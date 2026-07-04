'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, Calendar, Ticket, X, Eye, EyeOff } from 'lucide-react';

interface StudentTicket {
  name: string;
  ticketName: string;
  remaining: number;
  total: number;
  expiry: string;
}

function getDDayString(expiryStr: string): string | null {
  if (!expiryStr || expiryStr === '기한 없음') return null;

  const cleanStr = expiryStr.replace(/\./g, '-').trim();
  const match = cleanStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;

  const [_, year, month, day] = match;
  const expiryDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  expiryDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `D-${diffDays}`;
  } else if (diffDays === 0) {
    return 'D-Day';
  } else {
    return '만료';
  }
}

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isPinVisible, setIsPinVisible] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<StudentTicket | null>(null);

  const dDayText = ticketData ? getDDayString(ticketData.expiry) : null;

  const nameInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Auto-load name and manage auto-focus on modal open
  useEffect(() => {
    if (isModalOpen) {
      const savedName = localStorage.getItem('student-nickname') || '';
      
      setTimeout(() => {
        setNickname(savedName);
        if (savedName) {
          pinInputRef.current?.focus();
        } else {
          nameInputRef.current?.focus();
        }
      }, 60);
    }
  }, [isModalOpen]);

  const fetchTickets = async (nameInput: string, codeInput: string) => {
    setSearchLoading(true);
    setSearchError(null);
    
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: nameInput,
          pinCode: codeInput,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setSearchError(data.error || '조회에 실패했습니다.');
        return;
      }
      
      localStorage.setItem('student-nickname', nameInput.trim());
      setTicketData({
        name: nameInput.trim(),
        ticketName: data.ticketName,
        remaining: data.remaining,
        total: data.total,
        expiry: data.expiry,
      });
    } catch (err) {
      setSearchError('데이터를 조회하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !pinCode.trim()) return;
    fetchTickets(nickname, pinCode);
  };

  const resetSearch = () => {
    setNickname('');
    setPinCode('');
    setIsPinVisible(false);
    setTicketData(null);
    setSearchError(null);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 60);
  };

  return (
    <main>
      <div className="container">
        <h1 className="title">
          스터디 예약하기
          <div className="date">7월6일부로 통합 변경됩니다</div>
        </h1>
        <p className="notice">센세별 운영시간은 운영 시간표에서 확인 가능합니다.<br />횟수권 잔여확인은 메세지로 문의 부탁드립니다.</p>
        
        <div className="action-list">
          <Link href={'https://whattime.co.kr/miku'} className="action-button">
            <div className="action-info">
              <div className="icon-wrapper reserve">
                <Calendar size={24} strokeWidth={2} />
              </div>
              <div className="text-content">
                <span className="action-title">{'예약하기'}</span>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={2} className="arrow" />
          </Link>
          
          <Link href={'/schedule'} className="action-button">
            <div className="action-info">
              <div className="icon-wrapper schedule">
                <Clock size={24} strokeWidth={2} />
              </div>
              <div className="text-content">
                <span className="action-title">{'운영 시간표 확인'}</span>
                <span className="action-subtitle">
                  {'미쿠/아유미 센세'}
                </span>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={2} className="arrow" />
          </Link>
          
          <button className="action-button" onClick={() => setIsModalOpen(true)}>
            <div className="action-info">
              <div className="icon-wrapper ticket">
                <Ticket size={24} strokeWidth={2} />
              </div>
              <div className="text-content">
                <span className="action-title">{'횟수권 잔여 확인'}</span>
                <span className="action-subtitle">
                  {'비밀번호로 조회'}
                </span>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={2} className="arrow" />
          </button>
        </div>
      </div>

      {/* Ticket Lookup Modal */}
      {isModalOpen && (
        <div className="sch-modal-overlay">
          <div className="sch-modal-content">
            <button className="close-btn" onClick={() => { setIsModalOpen(false); resetSearch(); }} aria-label="닫기">
              <X size={20} />
            </button>

            {!ticketData ? (
              <form onSubmit={handleSearchSubmit}>
                <h2 className="sch-modal-title">수강권 잔여 횟수 조회</h2>
                <p className="sch-modal-desc">
                  조회코드 변경 및 재발급은 관리자에게 문의해주세요.
                </p>

                <div className="sch-form-group">
                  <label htmlFor="student-name">이름 (닉네임)</label>
                  <input
                    ref={nameInputRef}
                    id="student-name"
                    type="text"
                    placeholder="예: 김철수"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                  />
                </div>

                <div className="sch-form-group">
                  <label htmlFor="pin-code">조회코드 (4자리 PIN)</label>
                  <div className="pin-input-wrapper">
                    <input
                      ref={pinInputRef}
                      id="pin-code"
                      className={isPinVisible ? 'visible' : ''}
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="숫자 4자리 입력"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-visibility-btn"
                      onClick={() => setIsPinVisible(!isPinVisible)}
                      aria-label={isPinVisible ? '코드 숨기기' : '코드 보기'}
                    >
                      {isPinVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {searchError && <p className="sch-search-error">{searchError}</p>}

                <button
                  type="submit"
                  className="sch-btn-submit"
                  disabled={searchLoading || !nickname.trim() || pinCode.length !== 4}
                >
                  {searchLoading ? '조회 중...' : '조회하기'}
                </button>
              </form>
            ) : (
              <div>
                <h2 className="sch-modal-title">조회 완료</h2>
                <p className="sch-modal-desc">회원님의 남은 수강 횟수 정보입니다.</p>

                {/* Apple Calendar Style Ticket Card */}
                <div className="sch-ticket-card">
                  <div className="ticket-header">
                    <span className="student-name">{ticketData.name} 님</span>
                    <span className="ticket-badge">{ticketData.ticketName}</span>
                  </div>
                  
                  <div className="ticket-body">
                    <div className="ticket-detail">
                      {ticketData.total}회권 중 {ticketData.remaining}회 남음
                    </div>

                    {/* Stamp Card Visualization */}
                    <div className="ticket-stamps">
                      {Array.from({ length: ticketData.total }).map((_, idx) => {
                        // Punch used sessions, keep remaining empty
                        const usedCount = ticketData.total - ticketData.remaining;
                        const isUsed = idx < usedCount;
                        return (
                          <div key={idx} className={`ticket-stamp ${isUsed ? 'used' : 'remaining'}`}>
                            {isUsed ? '✓' : idx + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="ticket-divider" />

                  <div className="ticket-footer">
                    <span>유효기간: {ticketData.expiry}{dDayText ? ` (${dDayText})` : ''}</span>
                    <span>실시간 기준</span>
                  </div>
                </div>

                <button onClick={() => { setIsModalOpen(false); resetSearch(); }} className="sch-btn-reset">
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
