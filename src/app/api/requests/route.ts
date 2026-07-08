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
    let isAlimTalk = false;
    let alimTalkTemplateId = '';

    const SOLAPI_PF_ID = process.env.SOLAPI_PF_ID || '';
    const SOLAPI_TEMPLATE_ID_PURCHASE = process.env.SOLAPI_TEMPLATE_ID_PURCHASE || '';
    const SOLAPI_TEMPLATE_ID_PIN_CHANGE = process.env.SOLAPI_TEMPLATE_ID_PIN_CHANGE || '';
    const APP_DOMAIN = process.env.APP_DOMAIN || 'http://localhost:3000';

    if (type === 'purchase') {
      const { productName, price, depositor } = body;
      const formattedPrice = typeof price === 'number' ? price.toLocaleString() : price;

      messageText = `[관리자 알림]\n새로운 수강권 구매 신청이 접수되었습니다. 입금 내역을 확인해 주세요.\n\n■ 신청 정보\n실명: ${realName}\n닉네임: ${nickname}\n연락처: ${phoneNumber}\n\n■ 수강권 정보\n상품명: ${productName}\n결제 금액: ${formattedPrice}원\n\n■ 입금 정보\n입금자명: ${depositor}`;

      if (SOLAPI_PF_ID && SOLAPI_TEMPLATE_ID_PURCHASE) {
        isAlimTalk = true;
        alimTalkTemplateId = SOLAPI_TEMPLATE_ID_PURCHASE;
      }
    } else if (type === 'pin-change') {
      const { newPin } = body;
      messageText = `[관리자 알림]\n새로운 회원정보 변경 신청이 접수되었습니다.\n\n■ 신청 정보\n실명: ${realName}\n닉네임: ${nickname}\n\n■ 변경 정보 희망\nPIN: ${newPin}`;

      if (SOLAPI_PF_ID && SOLAPI_TEMPLATE_ID_PIN_CHANGE) {
        isAlimTalk = true;
        alimTalkTemplateId = SOLAPI_TEMPLATE_ID_PIN_CHANGE;
      }
    } else {
      return NextResponse.json({ error: '올바르지 않은 신청 유형입니다.' }, { status: 400 });
    }

    console.log('Received Request:', messageText);

    // If Solapi credentials are set, call the Solapi SMS/Alimtalk API
    if (SOLAPI_API_KEY && SOLAPI_API_SECRET && SOLAPI_SENDER_NUMBER && SOLAPI_ADMIN_NUMBER) {
      try {
        const date = new Date().toISOString();
        const salt = crypto.randomBytes(16).toString('hex');
        const signature = crypto
          .createHmac('sha256', SOLAPI_API_SECRET)
          .update(date + salt)
          .digest('hex');

        const authHeader = `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;

        const payload: any = {
          message: {
            to: SOLAPI_ADMIN_NUMBER.replace(/-/g, '').trim(),
            from: SOLAPI_SENDER_NUMBER.replace(/-/g, '').trim(),
            text: messageText,
            type: isAlimTalk ? 'ATA' : 'SMS'
          }
        };

        if (isAlimTalk) {
          payload.message.kakaoOptions = {
            pfId: SOLAPI_PF_ID,
            templateId: alimTalkTemplateId
          };

          if (type === 'purchase') {
            const { productName, price } = body;
            const cleanPhone = phoneNumber.replace(/-/g, '').trim();

            const confirmDataObj = { realName, phone: cleanPhone, productName, price };
            const confirmToken = Buffer.from(JSON.stringify(confirmDataObj)).toString('base64url');

            const completeDataObj = { realName, phone: cleanPhone, productName, price };
            const completeToken = Buffer.from(JSON.stringify(completeDataObj)).toString('base64url');

            payload.message.kakaoOptions.buttons = [
              {
                buttonType: 'AL',
                buttonName: '입금 확인 요청',
                linkAnd: `${APP_DOMAIN}/api/admin/confirm-deposit?data=${confirmToken}`,
                linkIos: `${APP_DOMAIN}/api/admin/confirm-deposit?data=${confirmToken}`
              },
              {
                buttonType: 'AL',
                buttonName: '수강권 발급 완료',
                linkAnd: `${APP_DOMAIN}/api/admin/complete-purchase?data=${completeToken}`,
                linkIos: `${APP_DOMAIN}/api/admin/complete-purchase?data=${completeToken}`
              }
            ];
          } else if (type === 'pin-change') {
            const { newPin } = body;
            const cleanPhone = phoneNumber.replace(/-/g, '').trim();

            const pinChangeDataObj = { realName, phone: cleanPhone, newPin };
            const pinChangeToken = Buffer.from(JSON.stringify(pinChangeDataObj)).toString('base64url');

            payload.message.kakaoOptions.buttons = [
              {
                buttonType: 'AL',
                buttonName: '재설정 처리 완료',
                linkAnd: `${APP_DOMAIN}/api/admin/complete-pin-change?data=${pinChangeToken}`,
                linkIos: `${APP_DOMAIN}/api/admin/complete-pin-change?data=${pinChangeToken}`
              }
            ];
          }
        }

        const solapiRes = await fetch('https://api.solapi.com/messages/v4/send', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const resData = await solapiRes.json().catch(() => ({}));

        if (!solapiRes.ok) {
          console.error('Solapi SMS/AlimTalk Send Failed:', resData);
          return NextResponse.json({ 
            error: `알림 전송 실패: ${resData.errorMessage || '솔라피 서버 오류'}` 
          }, { status: 500 });
        }

        if (resData.count && resData.count.registeredFailed > 0) {
          console.error('Solapi SMS/AlimTalk Registration Failed:', resData);
          return NextResponse.json({ 
            error: '알림 발송 접수에 실패했습니다. (템플릿 정보 또는 번호 불일치)' 
          }, { status: 500 });
        }

        console.log(`Solapi ${isAlimTalk ? 'AlimTalk' : 'SMS'} Sent Successfully!`);
      } catch (smsErr: any) {
        console.error('Error invoking Solapi REST API:', smsErr);
        return NextResponse.json({ 
          error: `알림 API 호출 중 오류 발생: ${smsErr.message || '네트워크 오류'}` 
        }, { status: 500 });
      }
    } else {
      console.warn('Solapi credentials not fully set. Notification skipped.');
      return NextResponse.json({ 
        error: '솔라피 환경 변수(API Key, 발신/수신번호 등) 설정이 누락되었습니다.' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Request processing error:', err);
    return NextResponse.json({ error: '신청 처리에 실패했습니다. 다시 시도해 주세요.' }, { status: 500 });
  }
}
