'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface ClassHistoryItem {
  date: string;
  time: string;
  tutor: string;
}

interface TicketInfo {
  ticketName: string;
  remaining: number;
  total: number;
  expiry: string;
}

interface StudentTicket {
  name: string;
  nickname: string;
  tickets: TicketInfo[];
  history?: ClassHistoryItem[];
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

export default function LookupPage() {
  const [realName, setRealName] = useState('');
  const [nickname, setNickname] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isPinVisible, setIsPinVisible] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<StudentTicket | null>(null);
  const [activeTab, setActiveTab] = useState<'ticket' | 'history'>('ticket');
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill and auto-focus for lookup view
  useEffect(() => {
    if (!ticketData) {
      const savedRealName = localStorage.getItem('student-realname') || '';
      const savedNickname = localStorage.getItem('student-nickname') || '';
      
      setRealName(savedRealName);
      
      setTimeout(() => {
        setNickname(savedNickname);
        if (savedRealName && savedNickname) {
          pinInputRef.current?.focus();
        } else if (!savedRealName) {
          nameInputRef.current?.focus();
        } else {
          nicknameInputRef.current?.focus();
        }
      }, 60);
    }
  }, [ticketData]);

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!realName.trim() || !nickname.trim() || !pinCode.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          realName,
          nickname,
          pinCode,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setSearchError(data.error || '조회에 실패했습니다.');
        return;
      }
      
      localStorage.setItem('student-realname', realName.trim());
      localStorage.setItem('student-nickname', nickname.trim());
      setTicketData({
        name: data.name,
        nickname: data.nickname,
        tickets: data.tickets || [],
        history: data.history || [],
      });
      setActiveTab('ticket');
      setCurrentTicketIndex(0);
    } catch (err) {
      setSearchError('데이터를 조회하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSearchLoading(false);
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
            <h1 className="sch-title">횟수권 잔여 확인</h1>
          </div>
          <p className="sch-notice">이름, 닉네임, 조회코드(PIN)를 입력해 주세요.</p>
        </div>

        <div className="sch-modal-content" style={{ animation: 'none' }}>
          {!ticketData ? (
            <form onSubmit={handleLookupSubmit}>
              <div className="sch-form-group">
                <label htmlFor="student-name">이름 (실명)</label>
                <input
                  ref={nameInputRef}
                  id="student-name"
                  type="text"
                  placeholder="예: 김철수"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  required
                />
              </div>

              <div className="sch-form-group">
                <label htmlFor="student-nickname">닉네임</label>
                <input
                  ref={nicknameInputRef}
                  id="student-nickname"
                  type="text"
                  placeholder="예: chulsoo123"
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
                disabled={searchLoading || !realName.trim() || !nickname.trim() || pinCode.length !== 4}
              >
                {searchLoading ? '조회 중...' : '조회하기'}
              </button>

              <Link href="/tickets" className="sch-btn-reset" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '8px' }}>
                이전으로
              </Link>
            </form>
          ) : (
            <div>
              {/* Segmented Tab Control */}
              <div className="sch-modal-tabs">
                <button 
                  type="button"
                  onClick={() => setActiveTab('ticket')} 
                  className={`sch-modal-tab ${activeTab === 'ticket' ? 'active' : ''}`}
                >
                  수강권 정보
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('history')} 
                  className={`sch-modal-tab ${activeTab === 'history' ? 'active' : ''}`}
                >
                  수업 이력
                </button>
              </div>

              {activeTab === 'ticket' ? (
                /* Slide Carousel */
                <div className="sch-carousel-container">
                  {!ticketData.tickets || ticketData.tickets.length === 0 ? (
                    <div className="ticket-empty">수강권 정보가 없습니다.</div>
                  ) : (
                    <>
                      <div className="sch-carousel-wrapper">
                        {ticketData.tickets.length > 1 && (
                          <button
                            type="button"
                            className="carousel-nav-btn prev"
                            onClick={() => setCurrentTicketIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentTicketIndex === 0}
                            aria-label="이전 수강권"
                          >
                            <ChevronLeft size={20} />
                          </button>
                        )}

                        <div className="sch-carousel-viewport">
                          <div 
                            className="sch-carousel-track"
                            style={{ transform: `translateX(-${currentTicketIndex * 100}%)` }}
                          >
                            {ticketData.tickets.map((ticket, idx) => {
                              const ticketDDay = getDDayString(ticket.expiry);
                              const themeClass = `theme-${idx % 3}`;
                              return (
                                <div key={idx} className="sch-carousel-slide">
                                  <div className={`sch-ticket-card ${themeClass}`}>
                                    <div className="ticket-header">
                                      <span className="student-name">{ticketData.name} 님</span>
                                      <span className="ticket-badge">{ticket.ticketName}</span>
                                    </div>
                                    
                                    <div className="ticket-body">
                                      <div className="ticket-detail">
                                        {ticket.total}회권 중 {ticket.remaining}회 남음
                                      </div>

                                      <div className="ticket-stamps">
                                        {Array.from({ length: ticket.total }).map((_, stampIdx) => {
                                          const usedCount = ticket.total - ticket.remaining;
                                          const isUsed = stampIdx < usedCount;
                                          return (
                                            <div key={stampIdx} className={`ticket-stamp ${isUsed ? 'used' : 'remaining'}`}>
                                              {isUsed ? '✓' : stampIdx + 1}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div className="ticket-divider" />

                                    <div className="ticket-footer">
                                      <span>유효기간: {ticket.expiry}{ticketDDay ? ` (${ticketDDay})` : ''}</span>
                                      <span>실시간 기준</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {ticketData.tickets.length > 1 && (
                          <button
                            type="button"
                            className="carousel-nav-btn next"
                            onClick={() => setCurrentTicketIndex(prev => Math.min(ticketData.tickets.length - 1, prev + 1))}
                            disabled={currentTicketIndex === ticketData.tickets.length - 1}
                            aria-label="다음 수강권"
                          >
                            <ChevronRight size={20} />
                          </button>
                        )}
                      </div>

                      {ticketData.tickets.length > 1 && (
                        <div className="carousel-dots">
                          {ticketData.tickets.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              type="button"
                              className={`carousel-dot ${dotIdx === currentTicketIndex ? 'active' : ''}`}
                              onClick={() => setCurrentTicketIndex(dotIdx)}
                              aria-label={`${dotIdx + 1}번째 수강권`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                /* Timeline History */
                <div className="sch-history-section">
                  <div className="history-header">
                    <span className="history-title">수업 이력 (최근 30회까지 표시)</span>
                    {ticketData.history && ticketData.history.length > 0 && (
                      <span className="history-count">총 {ticketData.history.length}회 수강</span>
                    )}
                  </div>
                  
                  <div className="history-timeline-container">
                    {!ticketData.history || ticketData.history.length === 0 ? (
                      <div className="history-empty">수업 이력이 없습니다.</div>
                    ) : (
                      <div className="history-timeline">
                        {ticketData.history.slice(0, 30).map((item, idx) => {
                          const displayedCount = Math.min(ticketData.history!.length, 30);
                          return (
                            <div key={idx} className="timeline-item">
                              <div className="timeline-badge-col">
                                <div className="timeline-badge" />
                                {idx < displayedCount - 1 && <div className="timeline-line" />}
                              </div>
                              <div className="timeline-content">
                                <div className="timeline-meta">
                                  <span className="class-date">{item.date}</span>
                                  <span className="class-time">{item.time}</span>
                                  <span className="class-tutor-badge">{item.tutor} 센세</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Link href="/tickets" className="sch-btn-reset" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '8px' }}>
                이전으로
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
