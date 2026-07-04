'use client';

import { useMemo, useState, Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface TimeSlot {
  day: number;
  start: string;
  end: string;
}

interface Tutor {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  profileImage: string;
  schedule: TimeSlot[];
}

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const START_HOUR = 10;
const END_HOUR = 22;
const SLOT_HEIGHT = 30;
const TIME_COL_W = 48;
const DAY_COL_W = 88;
const HEADER_H = 40;

const timeToSlots = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return (h - START_HOUR) * 2 + m / 30;
};

const fmt = (h: number, m: number) =>
  `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

export default function SchedulePage() {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const tutors: Tutor[] = useMemo(() => [
    {
      id: 'miku',
      name: '미쿠 센세',
      color: '#0f93e0',
      bgColor: 'rgba(15, 147, 224, 0.13)',
      borderColor: 'rgba(15, 147, 224, 0.35)',
      profileImage: '/img/miku.png',
      schedule: [
        { day: 0, start: '10:00', end: '22:00' },
        { day: 1, start: '10:00', end: '18:00' },
        { day: 2, start: '10:00', end: '18:00' },
        { day: 3, start: '10:00', end: '22:00' },
        { day: 4, start: '10:00', end: '22:00' },
        { day: 5, start: '10:00', end: '14:00' },
      ],
    },
    {
      id: 'ayumi',
      name: '아유미 센세',
      color: '#ff9500',
      bgColor: 'rgba(255, 149, 0, 0.13)',
      borderColor: 'rgba(255, 149, 0, 0.35)',
      profileImage: '/img/ayumi.png',
      schedule: [
        { day: 1, start: '18:00', end: '22:00' },
        { day: 2, start: '18:00', end: '22:00' },
        { day: 5, start: '16:00', end: '18:00' },
      ],
    },
  ], []);

  const totalSlots = (END_HOUR - START_HOUR) * 2;

  type Block = {
    id: string;
    tutorName: string;
    profileImage: string;
    color: string;
    bgColor: string;
    borderColor: string;
    timeText: string;
    startSlot: number;
    endSlot: number;
    col: number;
    colTotal: number;
  };

  const blocksByDay: Block[][] = useMemo(() => {
    const days: Block[][] = Array.from({ length: 7 }, () => []);

    tutors.forEach(tutor => {
      tutor.schedule.forEach(slot => {
        days[slot.day].push({
          id: `${tutor.id}-${slot.day}`,
          tutorName: tutor.name,
          profileImage: tutor.profileImage,
          color: tutor.color,
          bgColor: tutor.bgColor,
          borderColor: tutor.borderColor,
          timeText: `${slot.start}~${slot.end}`,
          startSlot: timeToSlots(slot.start),
          endSlot: timeToSlots(slot.end),
          col: 0,
          colTotal: 1,
        });
      });
    });

    days.forEach(dayBlocks => {
      dayBlocks.sort((a, b) => a.startSlot - b.startSlot);
      for (let i = 0; i < dayBlocks.length; i++) {
        for (let j = i + 1; j < dayBlocks.length; j++) {
          if (dayBlocks[j].startSlot < dayBlocks[i].endSlot) {
            const group = [dayBlocks[i], dayBlocks[j]];
            group.forEach((b, idx) => {
              b.col = idx;
              b.colTotal = group.length;
            });
          }
        }
      }
    });

    return days;
  }, [tutors]);

  const timeRows = Array.from({ length: totalSlots + 1 }, (_, i) => ({
    hour: START_HOUR + Math.floor(i / 2),
    min: (i % 2) * 30,
    isHour: i % 2 === 0,
  }));

  const gridTemplateColumns = `${TIME_COL_W}px repeat(${DAYS.length}, 1fr)`;
  const gridTemplateRows = `${HEADER_H}px repeat(${totalSlots + 1}, ${SLOT_HEIGHT}px)`;

  return (
    <main>
      <div className="sch-page">
        <div className="sch-header">
          <div className="sch-title-wrapper">
            <Link href="/" className="sch-back-button" aria-label="이전 페이지로 이동">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="sch-title">운영 시간표</h1>
          </div>
          <p className="sch-notice">좌우 스크롤로 전체 요일을 확인하세요.</p>
        </div>

        <div className="sch-scroll-area">
          <div
            className="sch-grid"
            style={{ gridTemplateColumns, gridTemplateRows }}
          >
            <div className="sch-corner" style={{ gridRow: 1, gridColumn: 1 }} />

            {DAYS.map((day, di) => (
              <div
                key={day}
                className={`sch-day-header${di === 5 ? ' saturday' : di === 6 ? ' sunday' : ''}${hoveredCol === di ? ' highlighted' : ''}`}
                style={{ gridRow: 1, gridColumn: di + 2 }}
              >
                {day}
              </div>
            ))}

            {/* Time labels + row cells */}
            {timeRows.map(({ hour, min, isHour }, i) => (
              <Fragment key={`row-${i}`}>
                <div
                  className={`sch-time-label${isHour ? ' on-hour' : ''}${hoveredRow === i ? ' highlighted' : ''}`}
                  style={{ gridRow: i + 2, gridColumn: 1 }}
                >
                  {isHour && <span>{fmt(hour, min)}</span>}
                </div>
                {DAYS.map((_, di) => (
                  <div
                    key={`cell-${i}-${di}`}
                    className={`sch-cell${isHour ? ' on-hour' : ''}${di === 6 ? ' sunday-col' : ''}${hoveredCol === di ? ' col-highlighted' : ''}${hoveredRow === i ? ' row-highlighted' : ''}`}
                    style={{ gridRow: i + 2, gridColumn: di + 2 }}
                    onMouseEnter={() => {
                      setHoveredCol(di);
                      setHoveredRow(i);
                    }}
                    onMouseLeave={() => {
                      setHoveredCol(null);
                      setHoveredRow(null);
                    }}
                  />
                ))}
              </Fragment>
            ))}

            {DAYS.map((_, di) =>
              blocksByDay[di].map(block => {
                const topRow = block.startSlot + 2;
                const rowSpan = block.endSlot - block.startSlot;
                const pct = 100 / block.colTotal;
                const left = `calc(${block.col * pct}% + 1px)`;
                const width = `calc(${pct}% - 2px)`;

                return (
                  <div
                    key={block.id}
                    className="sch-block"
                    style={{
                      gridRow: `${topRow} / span ${rowSpan}`,
                      gridColumn: di + 2,
                      left,
                      width,
                      backgroundColor: block.bgColor,
                      borderColor: block.borderColor,
                      color: block.color,
                    }}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const slotOffset = Math.floor(y / SLOT_HEIGHT);
                      setHoveredCol(di);
                      setHoveredRow(block.startSlot + slotOffset);
                    }}
                    onMouseLeave={() => {
                      setHoveredCol(null);
                      setHoveredRow(null);
                    }}
                  >
                    <div className="sch-block-inner">
                      <div className="sch-block-avatar">
                        <Image
                          src={block.profileImage}
                          alt={block.tutorName}
                          width={26}
                          height={26}
                          className="sch-avatar-img"
                        />
                      </div>
                      <span className="sch-block-name">{block.tutorName}</span>
                      <span className="sch-block-time">{block.timeText}</span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Sunday holiday overlay */}
            <div
              className="sch-holiday"
              style={{
                gridRow: `2 / span ${totalSlots + 1}`,
                gridColumn: 8,
              }}
            >
              정기휴무
            </div>

            {/* Active Crosshair Guides */}
            {hoveredCol !== null && (
              <div
                className="sch-col-guide"
                style={{
                  gridRow: `2 / span ${totalSlots + 1}`,
                  gridColumn: hoveredCol + 2,
                }}
              />
            )}
            {hoveredRow !== null && (
              <div
                className="sch-row-guide"
                style={{
                  gridRow: hoveredRow + 2,
                  gridColumn: `2 / span ${DAYS.length}`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
