import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyAdminPasscode } from '@/common/utils/adminAuth';

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SOLAPI_SENDER_NUMBER = process.env.SOLAPI_SENDER_NUMBER || '';
const SOLAPI_PF_ID = process.env.SOLAPI_PF_ID || '';
const SOLAPI_TEMPLATE_ID_EXHAUSTED = process.env.SOLAPI_TEMPLATE_ID_EXHAUSTED || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { realName, phone, productName, expireDate, passCode } = body;

    // 1. 관리자 비밀번호 검증
    if (!verifyAdminPasscode(passCode)) {
      return NextResponse.json(
        { error: '관리자 인증번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // 2. 필수 값 검증
    if (!realName || !phone || !productName || !expireDate) {
      return NextResponse.json(
        { error: '모든 항목(성함, 연락처, 상품명, 만료일)을 입력해 주세요.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/-/g, '').trim();
    if (!/^\d{9,11}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: '올바른 휴대전화 번호 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 3. 메시지 텍스트 조합
    const messageText = `새로운 수강권을 신청해주세요\n\n수강권 사용 완료\n\n안녕하세요, ${realName}님.\n\n수강권의 잔여 횟수를 모두 사용하셨습니다.\n\n■ 수강권: ${productName}\n■ 만료일: ${expireDate}\n■ 잔여 횟수: 0회\n\n새로운 수강권 신청이 필요하신 경우 이용 부탁드립니다. 감사합니다.`;

    // 4. 솔라피 API 호출 환경변수 확인
    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SOLAPI_SENDER_NUMBER) {
      return NextResponse.json(
        { error: '솔라피 API 설정(API Key, Secret, 발신번호)이 누락되었습니다.' },
        { status: 500 }
      );
    }

    const date = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString('hex');
    const signature = crypto
      .createHmac('sha256', SOLAPI_API_SECRET)
      .update(date + salt)
      .digest('hex');

    const authHeader = `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;

    const isAlimTalk = Boolean(SOLAPI_PF_ID);
    const payload: any = {
      message: {
        to: cleanPhone,
        from: SOLAPI_SENDER_NUMBER.replace(/-/g, '').trim(),
        text: messageText,
        type: isAlimTalk ? 'ATA' : 'LMS'
      }
    };

    if (isAlimTalk) {
      payload.message.kakaoOptions = {
        pfId: SOLAPI_PF_ID,
        title: '새로운 수강권을 신청해주세요',
        variables: {
          '#{realName}': realName,
          '#{productName}': productName,
          '#{expireDate}': expireDate,
        }
      };
      if (SOLAPI_TEMPLATE_ID_EXHAUSTED) {
        payload.message.kakaoOptions.templateId = SOLAPI_TEMPLATE_ID_EXHAUSTED;
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
      const errorMsg = resData.errorMessage || resData.message || '솔라피 API 전송 실패';
      console.error('AlimTalk Send Failed:', resData);
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    if (resData.count && resData.count.registeredFailed > 0) {
      console.error('AlimTalk Registration Failed:', resData);
      return NextResponse.json(
        { error: '알림톡 발송 접수에 실패했습니다. (템플릿 정보 또는 번호 오류)' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '알림톡이 성공적으로 발송되었습니다.'
    });

  } catch (err: any) {
    console.error('Error sending ticket exhausted alimtalk:', err);
    return NextResponse.json(
      { error: err.message || '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
