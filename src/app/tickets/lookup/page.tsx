'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Eye, EyeOff, X, Filter } from 'lucide-react';

interface ClassHistoryItem {
  date: string;
  time: string;
  tutor: string;
  ticketName?: string;
}

interface TicketInfo {
  ticketName: string;
  remaining: number;
  total: number;
  expiry: string;
  purchaseDate?: string;
  csvIndex?: number;
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

function isTicketExpired(ticket: TicketInfo): boolean {
  if (ticket.remaining <= 0) return true;
  const dDay = getDDayString(ticket.expiry);
  return dDay === '만료';
}

function getTicketYear(ticket: TicketInfo): string {
  const dateStr = ticket.purchaseDate || ticket.expiry || '';
  const cleanStr = dateStr.replace(/\./g, '-').trim();
  const match = cleanStr.match(/^(\d{4})/);
  return match ? match[1] : '기타';
}

/**
 * 3가지 조건 (수강권 명칭, 구입일자, 유효기간) 정밀 판별 함수
 */
function isHistoryMatchSelectedTicket(historyItem: ClassHistoryItem, selectedTicket: TicketInfo): boolean {
  if (!historyItem || !selectedTicket) return false;

  // 1. 수강권 명칭 (ticketName) 검증
  if (historyItem.ticketName) {
    const hName = historyItem.ticketName.trim().toLowerCase();
    const tName = selectedTicket.ticketName.trim().toLowerCase();
    const isNameMatched = hName === tName || hName.includes(tName) || tName.includes(hName);
    if (!isNameMatched) return false;
  }

  const hDateStr = historyItem.date.replace(/\./g, '-').trim();

  // 2. 등록일자 / 구입일자 (purchaseDate) 검증 (수업일자 >= 구입일자)
  if (selectedTicket.purchaseDate) {
    const pDateStr = selectedTicket.purchaseDate.replace(/\./g, '-').trim();
    if (hDateStr < pDateStr) {
      return false;
    }
  }

  // 3. 유효기간 (expiry) 검증 (수업일자 <= 유효기간)
  if (selectedTicket.expiry && selectedTicket.expiry !== '기한 없음') {
    const eDateStr = selectedTicket.expiry.replace(/\./g, '-').trim();
    if (hDateStr > eDateStr) {
      return false;
    }
  }

  return true;
}

function formatMonthDay(dateStr: string): string {
  const cleanStr = dateStr.replace(/\./g, '-').trim();
  const match = cleanStr.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!match) return dateStr;
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  return `${month}월 ${day}일`;
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
  const [showExpiredTickets, setShowExpiredTickets] = useState(false);
  const [selectedTicketFilter, setSelectedTicketFilter] = useState<TicketInfo | null>(null);
  const [onlyShowMatchedHistory, setOnlyShowMatchedHistory] = useState<boolean>(true);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  const handleSelectTicketFilter = (ticket: TicketInfo) => {
    setSelectedTicketFilter(ticket);
    setOnlyShowMatchedHistory(true);
    setActiveTab('history');
  };

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
      setShowExpiredTickets(false);
    } catch (err) {
      setSearchError('데이터를 조회하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSearchLoading(false);
    }
  };

  const allTickets = ticketData?.tickets || [];
  const activeTickets = allTickets.filter(t => !isTicketExpired(t));
  const expiredTickets = allTickets.filter(t => isTicketExpired(t));

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
                /* Slide Carousel (Active Tickets only) */
                <div className="sch-carousel-container">
                  {activeTickets.length === 0 ? (
                    <div className="ticket-empty">
                      <p style={{ fontWeight: 600, fontSize: '15px', color: '#64748b', margin: '0 0 6px 0' }}>
                        현재 이용 가능한 수강권이 없습니다.
                      </p>
                      {expiredTickets.length > 0 && (
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                          아래 지난 수강권 내역에서 만료/소진된 수강권을 확인할 수 있습니다.
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="sch-carousel-wrapper">
                        {activeTickets.length > 1 && (
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
                            {activeTickets.map((ticket, idx) => {
                              const ticketDDay = getDDayString(ticket.expiry);
                              const themeClass = `theme-${idx % 3}`;
                              return (
                                <div key={idx} className="sch-carousel-slide">
                                  <div 
                                    className={`sch-ticket-card ${themeClass}`}
                                    onClick={() => handleSelectTicketFilter(ticket)}
                                    style={{ cursor: 'pointer' }}
                                    title="클릭하여 이 수강권에 해당하는 수업 이력 보기"
                                  >
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
                                      <span className="card-footer-arrow">
                                        <ChevronRight size={16} />
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {activeTickets.length > 1 && (
                          <button
                            type="button"
                            className="carousel-nav-btn next"
                            onClick={() => setCurrentTicketIndex(prev => Math.min(activeTickets.length - 1, prev + 1))}
                            disabled={currentTicketIndex === activeTickets.length - 1}
                            aria-label="다음 수강권"
                          >
                            <ChevronRight size={20} />
                          </button>
                        )}
                      </div>

                      {activeTickets.length > 1 && (
                        <div className="carousel-dots">
                          {activeTickets.map((_, dotIdx) => (
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
                    <span className="history-title">
                      {selectedTicketFilter ? '선택한 수강권의 수업 이력' : '수업 이력 (최근 30회까지 표시)'}
                    </span>
                    {ticketData.history && ticketData.history.length > 0 && (
                      <span className="history-count">
                        {selectedTicketFilter 
                          ? `매칭된 수업 ${ticketData.history.filter(h => isHistoryMatchSelectedTicket(h, selectedTicketFilter)).length}회`
                          : `총 ${ticketData.history.length}회 수강`}
                      </span>
                    )}
                  </div>

                  {/* Active Filter Banner (Distinct Deep Purple Capsule) */}
                  {selectedTicketFilter && (
                    <div className="history-filter-banner">
                      <div className="filter-chip-info">
                        <div className="filter-chip-header">
                          <Filter size={11} />
                          <span className="filter-chip-name">{selectedTicketFilter.ticketName}</span>
                        </div>
                        {selectedTicketFilter.purchaseDate && (
                          <div className="filter-chip-date">
                            {selectedTicketFilter.purchaseDate} ~ {selectedTicketFilter.expiry}
                          </div>
                        )}
                      </div>

                      <div className="filter-chip-right">
                        <button
                          type="button"
                          className={`filter-mode-pill ${onlyShowMatchedHistory ? 'active' : ''}`}
                          onClick={() => setOnlyShowMatchedHistory(!onlyShowMatchedHistory)}
                          title="보기 방식 전환"
                        >
                          {onlyShowMatchedHistory ? '해당 수업만' : '전체 강조'}
                        </button>
                        <button
                          type="button"
                          className="filter-chip-remove"
                          onClick={() => setSelectedTicketFilter(null)}
                          aria-label="필터 해제"
                          title="필터 해제"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="history-timeline-container">
                    {(() => {
                      const allHistory = ticketData.history || [];
                      const matchedHistory = selectedTicketFilter
                        ? allHistory.filter(item => isHistoryMatchSelectedTicket(item, selectedTicketFilter))
                        : allHistory;

                      const historyToDisplay = (selectedTicketFilter && onlyShowMatchedHistory)
                        ? matchedHistory
                        : allHistory;

                      if (historyToDisplay.length === 0) {
                        return (
                          <div className="history-empty">
                            {selectedTicketFilter ? (
                              <>
                                <p style={{ margin: '0 0 6px 0', fontWeight: 600 }}>
                                  선택하신 &quot;{selectedTicketFilter.ticketName}&quot; 수강권(구입일: {selectedTicketFilter.purchaseDate || '미상'}, 유효기간: {selectedTicketFilter.expiry})에 해당하는 수업 이력이 없습니다.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setSelectedTicketFilter(null)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#af52de',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    textDecoration: 'underline',
                                  }}
                                >
                                  전체 수업 이력 보기
                                </button>
                              </>
                            ) : (
                              '수업 이력이 없습니다.'
                            )}
                          </div>
                        );
                      }

                      const items = historyToDisplay.slice(0, 30);
                      const groups: { year: string; list: typeof items }[] = [];
                      items.forEach(item => {
                        const year = item.date.split('-')[0] || '기타';
                        const lastGroup = groups[groups.length - 1];
                        if (lastGroup && lastGroup.year === year) {
                          lastGroup.list.push(item);
                        } else {
                          groups.push({ year, list: [item] });
                        }
                      });

                      return (
                        <div className="history-timeline">
                          {groups.map((group, gIdx) => (
                            <div key={gIdx} className="history-year-group">
                              <div className="history-year-title">{group.year}년</div>
                              <div className="history-year-list">
                                {group.list.map((item, idx) => {
                                  const isLastOfGroup = idx === group.list.length - 1;
                                  const isLastOverall = gIdx === groups.length - 1 && isLastOfGroup;
                                  const isMatched = selectedTicketFilter ? isHistoryMatchSelectedTicket(item, selectedTicketFilter) : false;

                                  return (
                                    <div key={idx} className={`timeline-item ${isMatched ? 'accent-highlight' : ''}`}>
                                      <div className="timeline-badge-col">
                                        <div className={`timeline-badge ${isMatched ? 'accent' : ''}`} />
                                        {!isLastOverall && <div className="timeline-line" />}
                                      </div>
                                      <div className="timeline-content">
                                        <div className="timeline-meta">
                                          <span className="class-date">{formatMonthDay(item.date)}</span>
                                          <span className="class-time">{item.time}</span>
                                          <span className="class-tutor-badge">{item.tutor} 센세</span>
                                        </div>
                                        {item.ticketName && (
                                          <div className="timeline-ticket-info">
                                            <span className="ticket-label">수강권</span>
                                            <span className="ticket-value">{item.ticketName}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Expired / Fully Used Tickets Accordion Section (Active Tab only) */}
              {activeTab === 'ticket' && expiredTickets.length > 0 && (
                <div className="expired-tickets-container">
                  <button
                    type="button"
                    className={`expired-tickets-toggle ${showExpiredTickets ? 'expanded' : ''}`}
                    onClick={() => setShowExpiredTickets(prev => !prev)}
                    aria-expanded={showExpiredTickets}
                  >
                    <span className="toggle-title">
                      지난 수강권 내역 <span className="count-badge">{expiredTickets.length}</span>
                    </span>
                    {showExpiredTickets ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {showExpiredTickets && (
                    <div className="expired-tickets-list">
                      {(() => {
                        const groups: { year: string; list: typeof expiredTickets }[] = [];
                        expiredTickets.forEach(ticket => {
                          const year = getTicketYear(ticket);
                          const lastGroup = groups[groups.length - 1];
                          if (lastGroup && lastGroup.year === year) {
                            lastGroup.list.push(ticket);
                          } else {
                            groups.push({ year, list: [ticket] });
                          }
                        });

                        return groups.map((group, gIdx) => (
                          <div key={gIdx} className="expired-year-group">
                            <div className="expired-year-title">{group.year === '기타' ? '기타' : `${group.year}년`}</div>
                            <div className="expired-year-list">
                              {group.list.map((ticket, idx) => {
                                const formattedExpiry = formatMonthDay(ticket.expiry);
                                const isFullyUsed = ticket.remaining <= 0;
                                const badgeText = isFullyUsed 
                                  ? (formattedExpiry && formattedExpiry !== '기한 없음' ? `${formattedExpiry} 소진 완료` : '소진 완료')
                                  : (formattedExpiry && formattedExpiry !== '기한 없음' ? `${formattedExpiry} 만료` : '유효기간 만료');

                                return (
                                  <div 
                                    key={idx} 
                                    className="expired-ticket-item clickable"
                                    onClick={() => handleSelectTicketFilter(ticket)}
                                    title="클릭하여 이 수강권에 해당하는 수업 이력 보기"
                                  >
                                    <div className="expired-item-main">
                                      <div className="expired-item-header">
                                        <span className="expired-item-name">{ticket.ticketName}</span>
                                        <span className={`expired-status-badge ${isFullyUsed ? 'used' : 'expired'}`}>
                                          {badgeText}
                                        </span>
                                      </div>
                                      <div className="expired-item-meta">
                                        <span>잔여 {ticket.remaining}회 / 총 {ticket.total}회</span>
                                        <span>구입일: {ticket.purchaseDate || '기록 없음'}</span>
                                      </div>
                                    </div>
                                    <div className="expired-item-arrow">
                                      <ChevronRight size={18} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              )}

              <Link href="/tickets" className="sch-btn-reset" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '12px' }}>
                이전으로
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
