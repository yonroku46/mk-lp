import { NextResponse } from 'next/server';

const TICKETS_LIST_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLdUQKCVye8yT3mIS4FnoP_Cf66HnBk1tJYAX78IL6ZfbRxxvioU9UHzwtoAQN4Bie2kumK2G-DfVf/pub?gid=0&single=true&output=csv';

const getCacheBustedUrl = (url: string) => {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
};

// 1개월 이내 만료(또는 유효/미래 만료) 여부 검단 유틸
const isWithinOneMonth = (dateStr: string): boolean => {
  if (!dateStr || dateStr.includes('기한')) return true;
  const cleanStr = dateStr.replace(/\./g, '-').replace(/\//g, '-').trim();
  const date = new Date(cleanStr);
  if (isNaN(date.getTime())) return true;

  const now = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(now.getDate() - 31); // 최근 1개월 이내 기준 (31일 전부터~)

  return date >= oneMonthAgo;
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

    // B열: 닉네임 (index 1)
    // C열: 수강권명칭 (index 2)
    // D열: 남은횟수 (index 3)
    // E열: 총횟수 (index 4)
    // F열: 만료일 (index 5)
    const exhaustedTickets = rows
      .filter((row, index) => {
        if (index === 0) return false; // Header row 제외
        const remaining = Number(row[3]);
        const expireDate = row[5] || '';
        
        // 남은 횟수 0회 & 1개월 이내 만료 조건 필터링
        return !isNaN(remaining) && remaining === 0 && isWithinOneMonth(expireDate);
      })
      .map((row, idx) => ({
        id: `ticket-${idx}-${row[1]}-${row[2]}`,
        nickname: row[1] || '이름 없음',
        productName: row[2] || '수강권',
        remaining: 0,
        total: Number(row[4]) || 0,
        expireDate: row[5] || '기한 없음'
      }));

    return NextResponse.json({ tickets: exhaustedTickets });
  } catch (error: any) {
    console.error('Error fetching exhausted tickets:', error);
    return NextResponse.json(
      { error: '수강권 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
