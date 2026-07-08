'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Eye, EyeOff, Check } from 'lucide-react';

export default function PinChangePage() {
  const [cRealName, setCRealName] = useState('');
  const [cNickname, setCNickname] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [newPin, setNewPin] = useState('');
  const [cPinVisible, setCPinVisible] = useState(false);
  const [pinChangeLoading, setPinChangeLoading] = useState(false);
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);

  // Auto-fill from localStorage on mount
  useEffect(() => {
    const savedRealName = localStorage.getItem('student-realname') || '';
    const savedNickname = localStorage.getItem('student-nickname') || '';
    const savedPhone = localStorage.getItem('student-phone') || '';

    if (savedRealName) setCRealName(savedRealName);
    if (savedNickname) setCNickname(savedNickname);
    if (savedPhone) setCPhone(savedPhone);
  }, []);

  const handlePinChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cRealName.trim() || !cNickname.trim() || !cPhone.trim() || newPin.length !== 4) return;

    setPinChangeLoading(true);
    setPinChangeError(null);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pin-change',
          realName: cRealName,
          nickname: cNickname,
          phoneNumber: cPhone,
          newPin: newPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinChangeError(data.error || '비밀번호 변경 신청에 실패했습니다.');
        return;
      }

      // Save input details for better UX auto-fill
      localStorage.setItem('student-realname', cRealName.trim());
      localStorage.setItem('student-nickname', cNickname.trim());
      localStorage.setItem('student-phone', cPhone.trim());

      setPinChangeSuccess(true);
    } catch (err) {
      setPinChangeError('신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setPinChangeLoading(false);
    }
  };

  return (
    <main>
      <div className="container">
        {/* Navigation Header like Schedule Page */}
        <div className="sch-header" style={{ width: '100%', marginBottom: '20px' }}>
          <div className="sch-title-wrapper">
            <Link 
              href="/tickets" 
              className="sch-back-button"
              aria-label="이전 페이지로 이동"
            >
              <ChevronLeft size={24} />
            </Link>
            <h1 className="sch-title">
              {pinChangeSuccess ? '신청 완료' : '조회코드 변경'}
            </h1>
          </div>
          <p className="sch-notice">
            {pinChangeSuccess ? '신청이 정상적으로 완료되었습니다.' : '조회코드 설정 및 변경을 신청해 주세요.'}
          </p>
        </div>

        <div className="sch-modal-content" style={{ animation: 'none' }}>
          {!pinChangeSuccess ? (
            <form onSubmit={handlePinChangeSubmit}>
              <div className="sch-form-group">
                <label htmlFor="change-name">이름 (실명)</label>
                <input
                  id="change-name"
                  type="text"
                  placeholder="예: 김철수"
                  value={cRealName}
                  onChange={(e) => setCRealName(e.target.value)}
                  required
                />
              </div>

              <div className="sch-form-group">
                <label htmlFor="change-nickname">닉네임</label>
                <input
                  id="change-nickname"
                  type="text"
                  placeholder="예: chulsoo123"
                  value={cNickname}
                  onChange={(e) => setCNickname(e.target.value)}
                  required
                />
              </div>

              <div className="sch-form-group">
                <label htmlFor="change-phone">연락처</label>
                <input
                  id="change-phone"
                  type="tel"
                  placeholder="예: 010-1234-5678"
                  value={cPhone}
                  onChange={(e) => setCPhone(e.target.value.replace(/[^0-9-]/g, ''))}
                  required
                />
              </div>

              <div className="sch-form-group">
                <label htmlFor="change-pin">새로 설정할 조회코드 (4자리 PIN)</label>
                <div className="pin-input-wrapper">
                  <input
                    id="change-pin"
                    className={cPinVisible ? 'visible' : ''}
                    type={cPinVisible ? 'text' : 'password'}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="숫자 4자리 입력"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-visibility-btn"
                    onClick={() => setCPinVisible(!cPinVisible)}
                    aria-label={cPinVisible ? '코드 숨기기' : '코드 보기'}
                  >
                    {cPinVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              {pinChangeError && <p className="sch-search-error">{pinChangeError}</p>}

              <button
                type="submit"
                className="sch-btn-submit"
                disabled={pinChangeLoading || !cRealName.trim() || !cNickname.trim() || !cPhone.trim() || newPin.length !== 4}
              >
                {pinChangeLoading ? '신청 처리 중...' : '조회코드 설정/변경 신청하기'}
              </button>

              <Link href="/tickets" className="sch-btn-reset" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '8px' }}>
                이전으로
              </Link>
            </form>
          ) : (
            <div className="sch-success-view">
              <div className="success-icon-circle">
                <Check size={24} strokeWidth={3} className="success-icon" />
              </div>
              <h3 className="success-title">설정/변경 신청 완료</h3>
              <p className="success-desc">
                조회코드 설정/변경 신청이 성공적으로 전송되었습니다.<br />
                관리자 확인 후 빠르게 적용됩니다.
              </p>
              <Link href="/tickets" className="sch-btn-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                메뉴로 돌아가기
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
