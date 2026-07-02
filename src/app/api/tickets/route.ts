import { NextResponse } from 'next/server';

// The Google Sheet URL is kept strictly on the server and is never sent to the client browser
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLdUQKCVye8yT3mIS4FnoP_Cf66HnBk1tJYAX78IL6ZfbRxxvioU9UHzwtoAQN4Bie2kumK2G-DfVf/pub?output=csv';

export async function POST(request: Request) {
  try {
    const { nickname, pinCode } = await request.json();

    if (!nickname || !pinCode) {
      return NextResponse.json({ error: '이름과 조회코드를 입력해 주세요.' }, { status: 400 });
    }

    if (!SPREADSHEET_URL || SPREADSHEET_URL.includes('YOUR_SPREADSHEET_URL_HERE')) {
      return NextResponse.json({ error: '구글 스프레드시트 URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    // Fetch Google Sheets CSV securely on the server side
    const res = await fetch(SPREADSHEET_URL, {
      cache: 'no-store'
    });
    if (!res.ok) {
      throw new Error('Google Sheet connection failed');
    }
    const csvText = await res.text();

    const rows = csvText
      .split(/\r?\n/)
      .map(line => line.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1').trim()))
      .filter(row => row.length >= 5); // Must have at least 5 columns (이름, 조회코드, 수업권명칭, 남은횟수, 총횟수)

    // Lookup using plain text nickname and pinCode
    const foundRow = rows.find(row => {
      const sName = row[1] || '';
      const sCode = row[2] || '';
      return sName.toLowerCase() === nickname.toLowerCase().trim() && sCode === pinCode.trim();
    });

    if (foundRow) {
      // Return ONLY the matched student's data. Other students' data remains invisible
      return NextResponse.json({
        ticketName: foundRow[3],
        remaining: Number(foundRow[4]) || 0,
        total: Number(foundRow[5]) || 0,
        expiry: foundRow[6] || '기한 없음',
      });
    } else {
      return NextResponse.json({ error: '일치하는 수강권 정보를 찾을 수 없습니다. 이름과 조회코드를 확인해 주세요.' }, { status: 404 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: '데이터를 조회하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
  }
}
