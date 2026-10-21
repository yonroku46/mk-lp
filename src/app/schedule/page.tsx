'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';

export default function ScheduleMenuPage() {
  return (
    <main>
      <div className="container">
        <div className="sch-header" style={{ width: '100%', marginBottom: '20px' }}>
          <div className="sch-title-wrapper">
            <Link 
              href="/" 
              className="sch-back-button"
              aria-label="이전 페이지로 이동"
            >
              <ChevronLeft size={24} />
            </Link>
            <h1 className="sch-title">운영 시간표</h1>
          </div>
          <p className="sch-notice">
            확인하실 일정 종류를 선택해주세요.<br />
            일정은 수시로 변경될 수 있습니다.
          </p>
        </div>

        <div className="action-list">
          <Link href="/schedule/regular" className="action-button">
            <div className="action-info">
              <div className="icon-wrapper schedule">
                <Clock size={24} strokeWidth={2} />
              </div>
              <div className="text-content">
                <span className="action-title">정기일정</span>
                <span className="action-subtitle">개인레슨</span>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={2} className="arrow" />
          </Link>

          <Link href="/schedule/group" className="action-button">
            <div className="action-info">
              <div className="icon-wrapper schedule">
                <Users size={24} strokeWidth={2} />
              </div>
              <div className="text-content">
                <span className="action-title">그룹일정</span>
                <span className="action-subtitle">그룹레슨</span>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={2} className="arrow" />
          </Link>
        </div>
      </div>
    </main>
  );
}
