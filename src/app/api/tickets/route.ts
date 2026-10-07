import { NextResponse } from 'next/server';

// Sheet 1: 회원 관리 (User Info) - maps name, nickname, PIN
const USER_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLdUQKCVye8yT3mIS4FnoP_Cf66HnBk1tJYAX78IL6ZfbRxxvioU9UHzwtoAQN4Bie2kumK2G-DfVf/pub?gid=1441868017&single=true&output=csv';

// Sheet 2: 수강권 목록 (Ticket List) - maps nickname, ticketName, remaining, total, expiry
const TICKETS_LIST_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLdUQKCVye8yT3mIS4FnoP_Cf66HnBk1tJYAX78IL6ZfbRxxvioU9UHzwtoAQN4Bie2kumK2G-DfVf/pub?gid=0&single=true&output=csv';

// Sheet 3: 수업 이력 (Class History) - maps nickname, date, time, tutor
const HISTORY_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLdUQKCVye8yT3mIS4FnoP_Cf66HnBk1tJYAX78IL6ZfbRxxvioU9UHzwtoAQN4Bie2kumK2G-DfVf/pub?gid=1533727054&single=true&output=csv';

const getCacheBustedUrl = (url: string) => {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
};

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// In-memory map to store IP-based rate limit records
const failedAttempts = new Map<string, { count: number; lockUntil: number }>();

export async function POST(request: Request) {
  try {
    const { realName, nickname, pinCode } = await request.json();

    if (!realName || !nickname || !pinCode) {
      return NextResponse.json({ error: '이름, 닉네임, 조회코드를 모두 입력해 주세요.' }, { status: 400 });
    }

    // Rate Limiting Check (Max 5 failures, then lock for 3 minutes)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const record = failedAttempts.get(ip);

    if (record && record.lockUntil > now) {
      const secondsLeft = Math.ceil((record.lockUntil - now) / 1000);
      return NextResponse.json({
        error: `보안을 위해 조회가 일시 잠금되었습니다.\n${secondsLeft}초 후 다시 시도해 주세요.`
      }, { status: 429 });
    }

    // PREVIEW MODE (When Sheet 2 URL is not configured yet)
    if (!TICKETS_LIST_SPREADSHEET_URL) {
      // Allow any login with code '1234' or any name for previewing the premium swipable UI
      failedAttempts.delete(ip);
      
      const mockTickets = [
        {
          ticketName: '비즈니스 일본어 회화 10회권',
          remaining: 3,
          total: 10,
          purchaseDate: '2026-01-15',
        },
        {
          ticketName: 'JLPT N2 대비 속성반 5회권',
          remaining: 0,
          total: 5,
          purchaseDate: '2026-03-01',
        },
        {
          ticketName: '시사 토론 및 청해 20회권',
          remaining: 18,
          total: 20,
          purchaseDate: '2026-04-10',
        },
        {
          ticketName: 'JLPT N3 입문반 10회권',
          remaining: 0,
          total: 10,
          purchaseDate: '2025-05-10',
        }
      ];

      const mockHistory = [
        {
          date: '2026-07-03',
          time: '15:00 - 16:00',
          tutor: '미쿠',
          ticketName: '비즈니스 일본어 회화 10회권',
        },
        {
          date: '2026-06-30',
          time: '13:00 - 14:00',
          tutor: '아유미',
          ticketName: 'JLPT N2 대비 속성반 5회권',
        },
        {
          date: '2026-06-25',
          time: '16:00 - 17:00',
          tutor: '미쿠',
          ticketName: '비즈니스 일본어 회화 10회권',
        },
        {
          date: '2025-10-15',
          time: '14:00 - 15:00',
          tutor: '사쿠라',
          ticketName: 'JLPT N3 입문반 10회권',
        },
      ];

      return NextResponse.json({
        name: realName.trim(),
        nickname: nickname.trim(),
        tickets: mockTickets,
        history: mockHistory,
      });
    }

    // PRODUCTION MODE (Verify against Sheet 1, then lookup Sheet 2 and Sheet 3)
    // 1. Fetch & Parse User Info (Sheet 1)
    const userRes = await fetchWithTimeout(getCacheBustedUrl(USER_SPREADSHEET_URL), { cache: 'no-store' }, 6000);
    if (!userRes.ok) {
      throw new Error('User Info Sheet fetch failed');
    }
    const userCsv = await userRes.text();
    const userRows = userCsv
      .split(/\r?\n/)
      .map(line => line.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1').trim()))
      .filter(row => row.length >= 4); // A: No, B: 이름, C: 닉네임, D: 조회코드

    // Find student matching Name, Nickname, and PIN code
    const verifiedUser = userRows.find(row => {
      const sRealName = row[1] || '';
      const sNickname = row[2] || '';
      const sPinCode = row[3] || '';
      return sRealName.toLowerCase() === realName.toLowerCase().trim() &&
             sNickname.toLowerCase() === nickname.toLowerCase().trim() &&
             sPinCode === pinCode.trim();
    });

    if (!verifiedUser) {
      // Increment failed attempts on mismatch
      const currentAttempts = (record ? record.count : 0) + 1;
      
      if (currentAttempts >= 5) {
        failedAttempts.set(ip, {
          count: currentAttempts,
          lockUntil: now + 3 * 60 * 1000 // 3 minutes lock
        });
        return NextResponse.json({
          error: '조회코드를 5회 연속 틀렸습니다. 보안을 위해 3분 동안 조회가 차단됩니다.'
        }, { status: 429 });
      } else {
        failedAttempts.set(ip, {
          count: currentAttempts,
          lockUntil: 0
        });
        return NextResponse.json({
          error: `일치하는 수강생 정보를 찾을 수 없습니다. (남은 시도 횟수: ${5 - currentAttempts}회)`
        }, { status: 404 });
      }
    }

    // Successful authentication
    failedAttempts.delete(ip);
    const studentRealName = verifiedUser[1];
    const studentNickname = verifiedUser[2];

    // Fetch Sheets 2 and 3 in parallel
    const [ticketsRes, historyRes] = await Promise.all([
      fetchWithTimeout(getCacheBustedUrl(TICKETS_LIST_SPREADSHEET_URL), { cache: 'no-store' }, 6000).catch(() => null),
      HISTORY_SPREADSHEET_URL ? fetchWithTimeout(getCacheBustedUrl(HISTORY_SPREADSHEET_URL), { cache: 'no-store' }, 6000).catch(() => null) : null
    ]);

    // 2. Parse Tickets (Sheet 2)
    let tickets: any[] = [];
    if (ticketsRes && ticketsRes.ok) {
      const ticketsCsv = await ticketsRes.text();
      const ticketRows = ticketsCsv
        .split(/\r?\n/)
        .map(line => line.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1').trim()));
      const rawRows = ticketRows.filter(row => row.length >= 3);
      if (rawRows.length > 0) {
        const headerCandidate = rawRows[0];
        const isHeader = headerCandidate.some(cell => 
          cell.includes('닉네임') || cell.includes('수강권') || cell.includes('횟수')
        );

        let nIdx = 1;
        let tnIdx = 2;
        let remIdx = 3;
        let totIdx = 4;
        let pIdx = 5;
        let rkIdx = 6;

        if (isHeader) {
          const foundN = headerCandidate.findIndex(h => h.includes('닉네임'));
          const foundTn = headerCandidate.findIndex(h => h.includes('수강권') || h.includes('명칭'));
          const foundRem = headerCandidate.findIndex(h => h.includes('남은') || h.includes('잔여'));
          const foundTot = headerCandidate.findIndex(h => h.includes('총'));
          const foundP = headerCandidate.findIndex(h => h.includes('등록') || h.includes('구입') || h.includes('구매'));
          const foundRk = headerCandidate.findIndex(h => h.includes('비고'));

          if (foundN !== -1) nIdx = foundN;
          if (foundTn !== -1) tnIdx = foundTn;
          if (foundRem !== -1) remIdx = foundRem;
          if (foundTot !== -1) totIdx = foundTot;
          if (foundRk !== -1) rkIdx = foundRk;
          if (foundP !== -1) {
            pIdx = foundP;
          } else {
            pIdx = headerCandidate.length >= 8 ? 6 : 5;
          }
        } else {
          pIdx = rawRows[0].length >= 8 ? 6 : 5;
          rkIdx = rawRows[0].length - 1;
        }

        const dataRows = isHeader ? rawRows.slice(1) : rawRows;

        tickets = dataRows
          .filter(row => {
            const rowNickname = row[nIdx] || '';
            return rowNickname.toLowerCase() === studentNickname.toLowerCase();
          })
          .map((row, idx) => {
            const remarkText = (row[rkIdx] || '').trim();
            const isCompleted = remarkText.includes('사용완료') || remarkText.includes('소진완료');
            const sheetRemaining = Number(row[remIdx]) || 0;
            const remaining = isCompleted ? 0 : sheetRemaining;

            return {
              ticketName: row[tnIdx] || '',
              remaining,
              total: Number(row[totIdx]) || 0,
              purchaseDate: row[pIdx] || '',
              csvIndex: idx,
            };
          })
          .reverse();
      }
    }

    // 3. Parse History (Sheet 3)
    let history: any[] = [];
    if (historyRes && historyRes.ok) {
      const historyCsv = await historyRes.text();
      const historyRows = historyCsv
        .split(/\r?\n/)
        .map(line => line.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1').trim()));
      const rawHistoryRows = historyRows.filter(row => row.length >= 3);

      if (rawHistoryRows.length > 0) {
        const headerCandidate = rawHistoryRows[0];
        const isHeader = headerCandidate.some(cell => 
          cell.includes('닉네임') || cell.includes('수업') || cell.includes('강사')
        );

        let nIdx = 1;      // 닉네임
        let dateIdx = 2;   // 수업일자
        let timeIdx = 3;   // 수업시간
        let tutorIdx = 4;  // 담당강사
        let tnIdx = 5;     // 사용수업권 (등록일자 열 삭제 후 5번째)

        if (isHeader) {
          const foundN = headerCandidate.findIndex(h => h.includes('닉네임'));
          const foundDate = headerCandidate.findIndex(h => h.includes('수업일자') || h.includes('날짜') || h.includes('일자'));
          const foundTime = headerCandidate.findIndex(h => h.includes('시간'));
          const foundTutor = headerCandidate.findIndex(h => h.includes('강사') || h.includes('센세') || h.includes('담당'));
          const foundTn = headerCandidate.findIndex(h => h.includes('수업권') || h.includes('수강권') || h.includes('사용'));

          if (foundN !== -1) nIdx = foundN;
          if (foundDate !== -1) dateIdx = foundDate;
          if (foundTime !== -1) timeIdx = foundTime;
          if (foundTutor !== -1) tutorIdx = foundTutor;
          if (foundTn !== -1) tnIdx = foundTn;
        }

        const dataRows = isHeader ? rawHistoryRows.slice(1) : rawHistoryRows;

        history = dataRows
          .filter(row => {
            const rowNickname = row[nIdx] || '';
            return rowNickname.toLowerCase() === studentNickname.toLowerCase();
          })
          .map(row => ({
            date: row[dateIdx] || '',
            time: row[timeIdx] || '',
            tutor: row[tutorIdx] || '',
            ticketName: row[tnIdx] || '',
          }));

        // Sort by date descending (newest first)
        history.sort((a, b) => b.date.localeCompare(a.date));
      }
    }

    return NextResponse.json({
      name: studentRealName,
      nickname: studentNickname,
      tickets,
      history,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: '데이터를 조회하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
  }
}
