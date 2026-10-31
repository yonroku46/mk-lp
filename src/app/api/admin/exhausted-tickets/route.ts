import { NextResponse } from 'next/server';
import dayjs from 'dayjs';

const TICKETS_LIST_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLdUQKCVye8yT3mIS4FnoP_Cf66HnBk1tJYAX78IL6ZfbRxxvioU9UHzwtoAQN4Bie2kumK2G-DfVf/pub?gid=0&single=true&output=csv';

const getCacheBustedUrl = (url: string) => {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
};

// 최근 2개월 이내 등록 여부 판단 유틸
const isWithinTwoMonths = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const d = dayjs(dateStr.replace(/\./g, '-').replace(/\//g, '-').trim());
  return d.isValid() && d.isAfter(dayjs().subtract(2, 'month'));
};

export async function GET() {
  try {
    if (!TICKETS_LIST_SPREADSHEET_URL) {
      return NextResponse.json({ tickets: [] });
    }

    const res = await fetch(getCacheBustedUrl(TICKETS_LIST_SPREADSHEET_URL), {
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error('수강권 스프레드시트 응답 오류');
    }

    const csvText = await res.text();
    const rows = csvText
      .split(/\r?\n/)
      .map(line => line.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1').trim()))
      .filter(row => row.length >= 4);

    if (rows.length <= 1) {
      return NextResponse.json({ tickets: [] });
    }

    const headerRow = rows[0] || [];
    let nIdx = 1;   // 닉네임
    let tnIdx = 2;  // 수강권명칭
    let remIdx = 3; // 남은횟수
    let totIdx = 4; // 총횟수
    let regIdx = 5; // 등록일자

    const foundN = headerRow.findIndex(h => h.includes('닉네임'));
    const foundTn = headerRow.findIndex(h => h.includes('수강권') || h.includes('명칭'));
    const foundRem = headerRow.findIndex(h => h.includes('남은') || h.includes('잔여'));
    const foundTot = headerRow.findIndex(h => h.includes('총'));
    const foundReg = headerRow.findIndex(h => h.includes('등록') || h.includes('구입') || h.includes('구매'));

    if (foundN !== -1) nIdx = foundN;
    if (foundTn !== -1) tnIdx = foundTn;
    if (foundRem !== -1) remIdx = foundRem;
    if (foundTot !== -1) totIdx = foundTot;
    if (foundReg !== -1) regIdx = foundReg;

    const exhaustedTickets = rows
      .slice(1) // Header row 제외
      .filter((row) => {
        const remaining = Number(row[remIdx]);
        const registeredDate = row[regIdx] || '';

        // 남은 횟수 0회 & 등록일자가 최근 2개월 이내
        return !isNaN(remaining) && remaining === 0 && isWithinTwoMonths(registeredDate);
      })
      .map((row, idx) => ({
        id: `ticket-${idx}-${row[nIdx]}-${row[tnIdx]}`,
        nickname: row[nIdx] || '이름 없음',
        productName: row[tnIdx] || '수강권',
        remaining: 0,
        total: Number(row[totIdx]) || 0,
        registeredDate: row[regIdx] || ''
      }))
      .reverse(); // 최신 등록 건이 상단에 오도록 역순 정렬

    return NextResponse.json({ tickets: exhaustedTickets });
  } catch (error: any) {
    console.error('Error fetching exhausted tickets:', error);
    return NextResponse.json(
      { error: '수강권 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
