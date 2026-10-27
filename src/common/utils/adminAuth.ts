/**
 * 관리자 인증 관련 공통 유틸리티
 */

export const getAdminPasscode = (): string => {
  // 환경변수 ADMIN_PASSCODE를 통해서만 관리자 비밀번호를 가져옵니다.
  return process.env.ADMIN_PASSCODE || '';
};

export const verifyAdminPasscode = (code: string): boolean => {
  const adminPasscode = getAdminPasscode();
  if (!code || !adminPasscode) return false;
  return code.trim() === adminPasscode.trim();
};
