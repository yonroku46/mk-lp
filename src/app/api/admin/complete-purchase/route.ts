import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SOLAPI_SENDER_NUMBER = process.env.SOLAPI_SENDER_NUMBER || '';
const SOLAPI_PF_ID = process.env.SOLAPI_PF_ID || '';
const SOLAPI_TEMPLATE_ID_COMPLETE = process.env.SOLAPI_TEMPLATE_ID_COMPLETE || '';

const ADMIN_PASSCODE = '0607';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data') || '';
  const code = searchParams.get('code') || '';

  let realName = '';
  let phone = '';
  let productName = '';
  let price = '';

  if (data) {
    try {
      const decoded = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
      realName = decoded.realName || '';
      phone = decoded.phone || '';
      productName = decoded.productName || '';
      price = decoded.price || '';
    } catch (e) {
      return new NextResponse(
        renderErrorHtml('파라미터 데이터 해석 중 오류가 발생했습니다.'),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
  }

  if (!realName || !phone || !productName || !price) {
    return new NextResponse(
      renderErrorHtml('필수 입력 정보(이름, 연락처, 상품명, 가격)가 누락되었습니다.'),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const cleanPhone = phone.replace(/-/g, '').trim();
  const priceStr = String(price);
  const rawPrice = Number(priceStr.replace(/[^0-9]/g, ''));
  const formattedPrice = isNaN(rawPrice) ? priceStr : rawPrice.toLocaleString();

  // 인증코드가 없거나 올바르지 않으면 인증 대기 화면을 보여줌
  if (code !== ADMIN_PASSCODE) {
    const isError = code.length > 0; // 틀린 코드 입력 시 에러 표시
    return new NextResponse(
      renderAuthHtml(realName, productName, formattedPrice, isError),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // 조립된 카카오 알림톡 전송 텍스트
  const messageText = `안녕하세요, ${realName}님!\n수강권 발급이 완료되었습니다.\n잔여 횟수 조회는 서비스 내에서 확인 가능합니다. \n\n■ 상품명: ${productName}\n■ 결제 금액: ${formattedPrice}원\n\n앞으로도 잘 부탁드립니다!`;

  let sendResult = false;
  let errorMsg = '';

  if (SOLAPI_API_KEY && SOLAPI_API_SECRET && SOLAPI_SENDER_NUMBER && SOLAPI_PF_ID && SOLAPI_TEMPLATE_ID_COMPLETE) {
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
          to: cleanPhone,
          from: SOLAPI_SENDER_NUMBER.replace(/-/g, '').trim(),
          text: messageText,
          type: 'ATA',
          kakaoOptions: {
            pfId: SOLAPI_PF_ID,
            templateId: SOLAPI_TEMPLATE_ID_COMPLETE,
            title: '수강권 구입 완료'
          }
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

      const resData = await solapiRes.json().catch(() => ({}));

      if (!solapiRes.ok) {
        errorMsg = resData.errorMessage || resData.message || '솔라피 API 전송 실패';
        console.error('AlimTalk Send Failed:', resData);
      } else if (resData.count && resData.count.registeredFailed > 0) {
        errorMsg = '알림톡 발송 접수에 실패했습니다. (템플릿 또는 수신번호 오류)';
        console.error('AlimTalk Registration Failed:', resData);
      } else {
        sendResult = true;
      }
    } catch (err: any) {
      errorMsg = err.message || '알림톡 전송 중 오류 발생';
      console.error('Error invoking Solapi REST API:', err);
    }
  } else {
    errorMsg = '솔라피 환경 변수(인증키, 발신번호, 플러스친구 ID, 템플릿 ID 등) 설정이 누락되었습니다.';
    console.warn(errorMsg);
  }

  if (sendResult) {
    return new NextResponse(renderSuccessHtml(realName, productName, formattedPrice), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } else {
    return new NextResponse(renderErrorHtml(errorMsg), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

function renderAuthHtml(realName: string, productName: string, price: string, isError: boolean) {
  return `
    <!DOCTYPE html>
    <html lang="ko">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>관리자 인증 - 수강권 구입 완료</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f2f2f7;
            color: #111111;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: #ffffff;
            padding: 32px 24px;
            border-radius: 20px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
            width: 100%;
            max-width: 360px;
            box-sizing: border-box;
          }
          .title {
            font-size: 1.25rem;
            font-weight: 800;
            margin-bottom: 20px;
            text-align: center;
            color: #af52de;
          }
          .info-box {
            background: #fafafa;
            border: 1px solid #e5e5ea;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
            font-size: 0.875rem;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .info-row:last-child {
            margin-bottom: 0;
          }
          .info-label {
            color: #8e8e93;
          }
          .info-value {
            font-weight: 600;
          }
          .form-group {
            margin-bottom: 24px;
          }
          .form-group label {
            display: block;
            font-size: 0.75rem;
            font-weight: 700;
            color: #8e8e93;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          .input-code {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid #e5e5ea;
            border-radius: 12px;
            font-size: 1.25rem;
            text-align: center;
            letter-spacing: 0.5em;
            outline: none;
            box-sizing: border-box;
          }
          .input-code:focus {
            border-color: #af52de;
          }
          .error-msg {
            color: #ff3b30;
            font-size: 0.75rem;
            margin-top: 8px;
            text-align: center;
            font-weight: 600;
          }
          .btn-group {
            display: flex;
            gap: 8px;
          }
          .btn {
            flex: 1;
            padding: 12px 0;
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-cancel {
            background: #e5e5ea;
            color: #8e8e93;
          }
          .btn-submit {
            background: #af52de;
            color: #ffffff;
          }
          .btn-submit:hover {
            background: #9f3ee0;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="title">수강권 구입 완료 승인</div>
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">수신 고객</span>
              <span class="info-value">${realName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">신청 상품</span>
              <span class="info-value">${productName}</span>
            </div>
            <div class="info-row" style="border-top: 1px dashed #e5e5ea; margin-top: 8px; padding-top: 8px;">
              <span class="info-label">결제 금액</span>
              <span class="info-value" style="color: #af52de;">${price}원</span>
            </div>
          </div>
          <div class="form-group">
            <label for="code">관리자 인증번호</label>
            <input type="password" id="code" class="input-code" pattern="[0-9]*" inputmode="numeric" maxlength="4" placeholder="••••" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
            <div id="error" class="error-msg">${isError ? '인증번호가 일치하지 않습니다.' : ''}</div>
          </div>
          <div class="btn-group">
            <button class="btn btn-cancel" onclick="closeWindow()">취소</button>
            <button class="btn btn-submit" onclick="submitCode()">인증 후 발송</button>
          </div>
        </div>

        <script>
          function closeWindow() {
            var ua = navigator.userAgent.toLowerCase();
            if (ua.indexOf("kakaotalk") > -1) {
              if (/iphone|ipad|ipod/i.test(ua)) {
                location.href = "kakaoweb://closeBrowser";
              } else {
                location.href = "kakaotalk://inappbrowser/close";
              }
            } else {
              window.close();
            }
          }
          function submitCode() {
            const codeVal = document.getElementById('code').value;
            if (!codeVal) {
              document.getElementById('error').innerText = '인증번호를 입력해주세요.';
              return;
            }
            const url = new URL(window.location.href);
            url.searchParams.set('code', codeVal);
            window.location.href = url.toString();
          }
          document.getElementById('code').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
              submitCode();
            }
          });
        </script>
      </body>
    </html>
  `;
}

function renderSuccessHtml(realName: string, productName: string, price: string) {
  return `
    <!DOCTYPE html>
    <html lang="ko">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>수강권 발급 완료</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f2f2f7;
            color: #111111;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: #ffffff;
            padding: 32px 24px;
            border-radius: 20px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
            width: 100%;
            max-width: 360px;
            text-align: center;
            box-sizing: border-box;
          }
          .icon {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: rgba(52, 199, 89, 0.1);
            color: #34c759;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px auto;
            font-size: 24px;
            font-weight: bold;
          }
          h1 {
            font-size: 1.25rem;
            font-weight: 800;
            margin-bottom: 12px;
          }
          p {
            font-size: 0.875rem;
            color: #8e8e93;
            line-height: 1.5;
            margin-bottom: 24px;
          }
          .btn-close {
            background: #af52de;
            color: #ffffff;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 700;
            cursor: pointer;
            width: 100%;
            transition: background 0.2s;
          }
          .btn-close:hover {
            background: #9f3ee0;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h1>수강권 발급 완료</h1>
          <p>
            <strong>${realName}</strong>님께 수강권 구입 완료 안내 알림톡이 성공적으로 전송되었습니다.<br/>
            (상품: ${productName} / 금액: ${price}원)
          </p>
          <button class="btn-close" onclick="closeWindow()">창 닫기</button>
        </div>
        <script>
          function closeWindow() {
            var ua = navigator.userAgent.toLowerCase();
            if (ua.indexOf("kakaotalk") > -1) {
              if (/iphone|ipad|ipod/i.test(ua)) {
                location.href = "kakaoweb://closeBrowser";
              } else {
                location.href = "kakaotalk://inappbrowser/close";
              }
            } else {
              window.close();
            }
          }
        </script>
      </body>
    </html>
  `;
}

function renderErrorHtml(errorMsg: string) {
  return `
    <!DOCTYPE html>
    <html lang="ko">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>오류 발생</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f2f2f7;
            color: #111111;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: #ffffff;
            padding: 32px 24px;
            border-radius: 20px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
            width: 100%;
            max-width: 360px;
            text-align: center;
            box-sizing: border-box;
          }
          .icon {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: rgba(255, 59, 48, 0.1);
            color: #ff3b30;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px auto;
            font-size: 24px;
            font-weight: bold;
          }
          h1 {
            font-size: 1.25rem;
            font-weight: 800;
            margin-bottom: 12px;
          }
          p {
            font-size: 0.875rem;
            color: #8e8e93;
            line-height: 1.5;
            margin-bottom: 24px;
            word-break: break-all;
          }
          .btn-close {
            background: #ff3b30;
            color: #ffffff;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 700;
            cursor: pointer;
            width: 100%;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">!</div>
          <h1>알림톡 발송 실패</h1>
          <p>${errorMsg}</p>
          <button class="btn-close" onclick="closeWindow()">창 닫기</button>
        </div>
        <script>
          function closeWindow() {
            var ua = navigator.userAgent.toLowerCase();
            if (ua.indexOf("kakaotalk") > -1) {
              if (/iphone|ipad|ipod/i.test(ua)) {
                location.href = "kakaoweb://closeBrowser";
              } else {
                location.href = "kakaotalk://inappbrowser/close";
              }
            } else {
              window.close();
            }
          }
        </script>
      </body>
    </html>
  `;
}
