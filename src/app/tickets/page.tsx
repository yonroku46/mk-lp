'use client'

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Ticket, ShoppingCart, KeyRound } from 'lucide-react';

export default function TicketsMenuPage() {
  return (
    <main>
      <div className="container">
        {/* Navigation Header like Schedule Page */}
        <div className="sch-header" style={{ width: '100%', marginBottom: '20px' }}>
          <div className="sch-title-wrapper">
            <Link 
              href="/" 
              className="sch-back-button"
              aria-label="이전 페이지로 이동"
            >
              <ChevronLeft size={24} />
            </Link>
            <h1 className="sch-title">횟수권 관리</h1>
          </div>
          <p className="sch-notice">
            횟수권 잔여 확인, 구입, 조회코드 변경 신청이 가능합니다.<br />
            카드결제는 현장에서 부탁드립니다.
          </p>
        </div>

        <div className="action-list">
          <Link href="/tickets/lookup" className="action-button">
            <div className="action-info">
              <div className="icon-wrapper ticket">
                <Ticket size={24} strokeWidth={2} />
              </div>
              <div className="text-content">
                <span className="action-title">잔여 횟수 조회</span>
                <span className="action-subtitle">남은 수업 횟수와 최근 이력 확인</span>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={2} className="arrow" />
          </Link>

          <Link 
            href="/tickets/purchase" 
            className="action-button"
          >
            <div className="action-info">
              <div className="icon-wrapper ticket">
                <ShoppingCart size={24} strokeWidth={2} />
              </div>
              <div className="text-content">
                <span className="action-title">횟수권 구입</span>
                <span className="action-subtitle">신규 수강 패키지 구입 신청</span>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={2} className="arrow" />
          </Link>

          <Link 
            href="/tickets/pin-change" 
            className="action-button"
          >
            <div className="action-info">
              <div className="icon-wrapper ticket">
                <KeyRound size={24} strokeWidth={2} />
              </div>
              <div className="text-content">
                <span className="action-title">조회코드 변경</span>
                <span className="action-subtitle">조회용 4자리 PIN코드 변경 신청</span>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={2} className="arrow" />
          </Link>
        </div>
      </div>
    </main>
  );
}
