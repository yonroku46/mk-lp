import { NextResponse } from 'next/server';
import { verifyAdminPasscode } from '@/common/utils/adminAuth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { passCode } = body || {};

    if (!passCode) {
      return NextResponse.json(
        { valid: false, error: '인증번호를 입력해 주세요.' },
        { status: 400 }
      );
    }

    const isValid = verifyAdminPasscode(String(passCode));

    if (!isValid) {
      return NextResponse.json(
        { valid: false, error: '관리자 인증번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (err: any) {
    console.error('Error verifying admin passcode:', err);
    return NextResponse.json(
      { valid: false, error: '인증 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
