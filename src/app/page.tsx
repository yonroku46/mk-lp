'use client'

import Link from 'next/link';
import { ChevronRight, Clock, Calendar, Ticket, Info, InfoIcon } from 'lucide-react';

export default function HomePage() {
  return (
    <main>
      <div className="container">
        <h1 className="title">
          스터디 예약하기
          <div className="date">
            <Info size={18} />
            7월6일부로 통합 변경됩니다
          </div>
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
          
          <Link href={'/tickets'} className="action-button">
            <div className="action-info">
              <div className="icon-wrapper ticket">
                <Ticket size={24} strokeWidth={2} />
              </div>
              <div className="text-content">
                <span className="action-title">{'횟수권'}</span>
                <span className="action-subtitle">
                  {'잔여 확인, 구입, 조회코드 변경'}
                </span>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={2} className="arrow" />
          </Link>
        </div>
      </div>
    </main>
  );
}
