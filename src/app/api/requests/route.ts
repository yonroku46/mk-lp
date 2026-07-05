import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SOLAPI_SENDER_NUMBER = process.env.SOLAPI_SENDER_NUMBER || '';
const SOLAPI_ADMIN_NUMBER = process.env.SOLAPI_ADMIN_NUMBER || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, realName, nickname, phoneNumber } = body;

    if (!type || !realName || !nickname || !phoneNumber) {
      return NextResponse.json({ error: '필수 입력 정보가 누락되었습니다.' }, { status: 400 });
    }

    let messageText = '';
    if (type === 'purchase') {
      const { productName, depositor } = body;
      messageText = `[LP 수강권 구매 신청]\n- 실명: ${realName}\n- 닉네임: ${nickname}\n- 연락처: ${phoneNumber}\n- 상품명: ${productName}\n- 입금자명: ${depositor}`;
    } else if (type === 'pin-change') {
      const { newPin } = body;
      messageText = `[LP 비밀번호 변경 신청]\n- 실명: ${realName}\n- 닉네임: ${nickname}\n- 연락처: ${phoneNumber}\n- 희망 PIN: ${newPin}`;
    } else {
      return NextResponse.json({ error: '올바르지 않은 신청 유형입니다.' }, { status: 400 });
    }

    console.log('Received Ticket Request:', messageText);

    // If Solapi credentials are set, call the Solapi SMS API
    if (SOLAPI_API_KEY && SOLAPI_API_SECRET && SOLAPI_SENDER_NUMBER && SOLAPI_ADMIN_NUMBER) {
      try {
        const date = new Date().toISOString();
        const salt = crypto.randomBytes(16).toString('hex');
        const signature = crypto
          .createHmac('sha256', SOLAPI_API_SECRET)
          .update(date + salt)
          .digest('hex');

        const authHeader = `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;

        const payload = {
          message: {
            to: SOLAPI_ADMIN_NUMBER.replace(/-/g, '').trim(),
            from: SOLAPI_SENDER_NUMBER.replace(/-/g, '').trim(),
            text: messageText,
            type: 'SMS'
          }
        };

        const solapiRes = await fetch('https://api.solapi.com/messages/v4/send', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!solapiRes.ok) {
          const errData = await solapiRes.json().catch(() => ({}));
          console.error('Solapi SMS Send Failed:', errData);
        } else {
          console.log('Solapi SMS Sent Successfully!');
        }
      } catch (smsErr) {
        console.error('Error invoking Solapi REST API:', smsErr);
      }
    } else {
      console.warn('Solapi credentials not fully set. SMS notification skipped.');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Request processing error:', err);
    return NextResponse.json({ error: '신청 처리에 실패했습니다. 다시 시도해 주세요.' }, { status: 500 });
  }
}
