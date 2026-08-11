'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, CheckCircle2, AlertCircle, Lock, ShieldCheck, Ticket, User, Calendar, Loader2, ChevronDown, Check } from 'lucide-react';

interface AdminExhaustedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExhaustedTicket {
  id: string;
  nickname: string;
  productName: string;
  remaining: number;
  total: number;
  expireDate: string;
}

export default function AdminExhaustedModal({ isOpen, onClose }: AdminExhaustedModalProps) {
  const [step, setStep] = useState<'auth' | 'dialog' | 'confirm' | 'success'>('auth');
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [verifyingPasscode, setVerifyingPasscode] = useState(false);

  // Confirm step (re-auth before send)
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [confirmingPasscode, setConfirmingPasscode] = useState(false);

  // Tickets List State
  const [tickets, setTickets] = useState<ExhaustedTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form State
  const [phone, setPhone] = useState('');
  const [realName, setRealName] = useState('');
  const [productName, setProductName] = useState('');
  const [expireDate, setExpireDate] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset state when opening/closing modal
  useEffect(() => {
    if (isOpen) {
      setStep('auth');
      setPasscode('');
      setPasscodeError('');
      setVerifyingPasscode(false);
      setPhone('');
      setTickets([]);
      setSelectedTicketId('');
      setIsDropdownOpen(false);
      setRealName('');
      setProductName('');
      setExpireDate('');
      setStatus(null);
      setConfirmPasscode('');
      setConfirmError('');
      setConfirmingPasscode(false);
    }
  }, [isOpen]);

  // Fetch zero-remaining tickets when transitioning to dialog step
  useEffect(() => {
    if (isOpen && step === 'dialog') {
      const fetchExhaustedTickets = async () => {
        setLoadingTickets(true);
        try {
          const res = await fetch('/api/admin/exhausted-tickets');
          const data = await res.json();
          if (res.ok && data.tickets) {
            setTickets(data.tickets);
          } else {
            console.error('Failed to fetch exhausted tickets:', data.error);
          }
        } catch (err) {
          console.error('Error fetching tickets:', err);
        } finally {
          setLoadingTickets(false);
        }
      };

      fetchExhaustedTickets();
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) {
      setPasscodeError('비밀번호를 입력해 주세요.');
      return;
    }

    setVerifyingPasscode(true);
    setPasscodeError('');

    try {
      const res = await fetch('/api/admin/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passCode: passcode })
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setStep('dialog');
      } else {
        setPasscodeError(data.error || '관리자 인증번호가 일치하지 않습니다.');
      }
    } catch (err) {
      setPasscodeError('인증 확인 중 오류가 발생했습니다.');
    } finally {
      setVerifyingPasscode(false);
    }
  };

  const handlePasscodeChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '').slice(0, 4);
    setPasscode(cleanVal);
    if (passcodeError) setPasscodeError('');
  };

  const handleTicketSelect = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsDropdownOpen(false);
    const found = tickets.find(t => t.id === ticketId);
    if (found) {
      setRealName(found.nickname);
      setProductName(found.productName);
      setExpireDate(found.expireDate);
    } else {
      setRealName('');
      setProductName('');
      setExpireDate('');
    }
  };

  // Step 2 → move to confirm step
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !realName || !productName) {
      setStatus({ type: 'error', message: '소진된 수강권을 선택해주세요.' });
      return;
    }
    if (!phone.trim()) {
      setStatus({ type: 'error', message: '수신자 연락처를 입력해주세요.' });
      return;
    }
    setConfirmPasscode('');
    setConfirmError('');
    setStep('confirm');
  };

  // Step 3 confirm: send directly (passcode already verified in step 1)
  const handleConfirmAndSend = async () => {
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/send-ticket-exhausted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          realName: realName.trim(),
          phone: phone.trim(),
          productName: productName.trim(),
          expireDate: expireDate.trim() || '-',
          passCode: passcode
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '알림톡 발송에 실패했습니다.');

      setStep('success');
      closeTimerRef.current = setTimeout(() => { onClose(); }, 2200);
    } catch (err: any) {
      setStep('dialog');
      setStatus({ type: 'error', message: err.message || '알림톡 발송 중 오류가 발생했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Cancel auto-close and go back to dialog for another send
  const handleContinueSending = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setSelectedTicketId('');
    setPhone('');
    setRealName('');
    setProductName('');
    setExpireDate('');
    setStatus(null);
    setConfirmPasscode('');
    setConfirmError('');
    setStep('dialog');
  };

  return (
    <div className="sch-modal-overlay" onClick={onClose}>
      <div
        className={`sch-modal-content ${step === 'dialog' ? 'admin-dialog-large' : 'admin-dialog-auth'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose} aria-label="닫기">
          <X size={20} />
        </button>

        {step === 'auth' ? (
          /* Step 1: Admin Passcode Entry */
          <div className="admin-auth-container">
            <div className="admin-auth-header">
              <div className="admin-icon-badge">
                <Lock size={22} />
              </div>
              <h2 className="sch-modal-title">관리자 인증</h2>
              <p className="sch-modal-desc">
                접근을 위해 관리자 비밀번호를 입력해 주세요.
              </p>
            </div>

            <form onSubmit={handleAuthSubmit}>
              <div className="sch-form-group">
                <label htmlFor="admin-passcode">관리자 인증번호</label>
                <input
                  id="admin-passcode"
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={passcode}
                  onChange={(e) => handlePasscodeChange(e.target.value)}
                  className="admin-passcode-input"
                  autoFocus
                />
                {passcodeError && (
                  <div className="sch-search-error">{passcodeError}</div>
                )}
              </div>

              <div className="admin-modal-btn-row">
                <button type="button" className="sch-btn-reset" onClick={onClose}>
                  취소
                </button>
                <button type="submit" className="sch-btn-submit" disabled={verifyingPasscode}>
                  {verifyingPasscode ? '확인 중...' : '인증하기'}
                </button>
              </div>
            </form>
          </div>
        ) : step === 'dialog' ? (
          /* Step 2: Alimtalk Dispatch Form */
          <div className="admin-dialog-container">
            <div className="admin-dialog-header">
              <h2 className="sch-modal-title">수강권 소진 알림톡 발송</h2>
            </div>

            {status && (
              <div className={`admin-status-banner ${status.type}`}>
                {status.type === 'success' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{status.message}</span>
              </div>
            )}

            <form onSubmit={handleSend} className="admin-dialog-form">
              <div className="sch-form-group">
                <label htmlFor="ticketSelect">소진 대상자 선택 (최근 1개월 이내)</label>
                {loadingTickets ? (
                  <div className="admin-ticket-loading">
                    <Loader2 size={16} className="spin" />
                    <span>대상자 목록을 불러오는 중입니다...</span>
                  </div>
                ) : (
                  <select
                    id="ticketSelect"
                    className="sch-form-select"
                    value={selectedTicketId || ''}
                    onChange={e => handleTicketSelect(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      {tickets.length > 0 ? '대상자 선택' : '최근 1개월 이내 소진된 수강권이 없습니다'}
                    </option>
                    {tickets.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.nickname} – {t.productName} (0/{t.total})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Phone Input */}
              <div className="sch-form-group">
                <label htmlFor="phone">수신자 연락처</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="예: 01012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="admin-modal-btn-row">
                <button
                  type="button"
                  className="sch-btn-reset"
                  onClick={onClose}
                  disabled={submitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="sch-btn-submit"
                  disabled={submitting || !selectedTicketId}
                >
                  {submitting ? '발송 처리 중...' : '알림톡 발송하기'}
                </button>
              </div>
            </form>
          </div>
        ) : step === 'confirm' ? (
          /* Step 3: Confirm passcode before sending */
          <div className="admin-auth-container">
            <div className="admin-auth-header">
              <div className="admin-icon-badge">
                <Send size={22} />
              </div>
              <h2 className="sch-modal-title">최종 확인</h2>
              <p className="sch-modal-desc">
                발송 전 한번 더 내용을 확인해 주세요.
              </p>
            </div>

            {/* Auto-selected Ticket Summary Card */}
            {selectedTicket && (
              <div className="admin-ticket-info-card">
                <div className="info-row">
                  <div className="info-label">
                    <User size={13} />
                    <span>수신 고객(닉네임)</span>
                  </div>
                  <div className="info-value">{realName}</div>
                </div>

                <div className="info-row">
                  <div className="info-label">
                    <Ticket size={13} />
                    <span>수강권 명칭</span>
                  </div>
                  <div className="info-value">{productName}</div>
                </div>

                <div className="info-row">
                  <div className="info-label">
                    <Calendar size={13} />
                    <span>만료일 / 잔여 횟수</span>
                  </div>
                  <div className="info-value highlight">
                    {expireDate} (잔여 {selectedTicket.remaining}회)
                  </div>
                </div>
              </div>
            )}

            <div className="admin-modal-btn-row">
              <button
                type="button"
                className="sch-btn-reset"
                onClick={() => setStep('dialog')}
                disabled={submitting}
              >
                돌아가기
              </button>
              <button
                type="button"
                className="sch-btn-submit"
                onClick={handleConfirmAndSend}
                disabled={submitting}
              >
                {submitting ? '발송 중...' : '발송하기'}
              </button>
            </div>
          </div>
        ) : step === 'success' ? (
          /* Step 4: Success screen */
          <div className="admin-auth-container admin-success-container">
            <div className="admin-success-icon">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="sch-modal-title">알림톡 발송 완료</h2>
            <p className="sch-modal-desc">수강권 사용 완료 알림톡이<br />성공적으로 발송되었습니다.<br /><small>2초 후 자동으로 닫힘니다.</small></p>
            <div className="admin-modal-btn-row" style={{ marginTop: '16px' }}>
              <button type="button" className="sch-btn-reset" onClick={handleContinueSending}>
                계속 발송하기
              </button>
              <button type="button" className="sch-btn-submit" onClick={onClose}>
                닫기
              </button>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
