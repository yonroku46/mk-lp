'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, Calendar, Ticket, X } from 'lucide-react';

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLdUQKCVye8yT3mIS4FnoP_Cf66HnBk1tJYAX78IL6ZfbRxxvioU9UHzwtoAQN4Bie2kumK2G-DfVf/pub?output=csv'; 

interface StudentTicket {
  name: string;
  code: string;
  ticketName: string;
  remaining: number;
  total: number;
  expiry: string;
}

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<StudentTicket | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Auto-load name and manage auto-focus on modal open
  useEffect(() => {
    if (isModalOpen) {
      const savedName = localStorage.getItem('student-nickname') || '';
      setNickname(savedName);
      
      setTimeout(() => {
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
    
    if (!SPREADSHEET_URL || SPREADSHEET_URL.includes('YOUR_SPREADSHEET_URL_HERE')) {
      setSearchError('구글 스프레드시트 URL이 설정되지 않았습니다. 관리자 세팅을 완료해 주세요.');
      setSearchLoading(false);
      return;
    }
    
    try {
      const res = await fetch(SPREADSHEET_URL, {
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('Sheet not accessible');
      const csvText = await res.text();
      
      const rows = csvText
        .split(/\r?\n/)
        .map(line => line.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1').trim()))
        .filter(row => row.length >= 5);
        
      const foundRow = rows.find(row => {
        const sName = row[0] || '';
        const sCode = row[1] || '';
        return sName.toLowerCase() === nameInput.toLowerCase().trim() && sCode === codeInput.trim();
      });
      
      if (foundRow) {
        localStorage.setItem('student-nickname', nameInput.trim());
        setTicketData({
          name: foundRow[0],
          code: foundRow[1],
          ticketName: foundRow[2],
          remaining: Number(foundRow[3]) || 0,
          total: Number(foundRow[4]) || 0,
          expiry: foundRow[5] || '기한 없음',
        });
      } else {
        setSearchError('일치하는 수강권 정보를 찾을 수 없습니다. 이름과 조회코드를 확인해 주세요.');
      }
    } catch (err) {
      setSearchError('데이터를 조회하는 중 오류가 발생했습니다. 구글 스프레드시트의 웹 게시 및 ID가 맞는지 확인해 주세요.');
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
                  <input
                    ref={pinInputRef}
                    id="pin-code"
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="숫자 4자리 입력"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
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
                    <span>유효기간: {ticketData.expiry}</span>
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
