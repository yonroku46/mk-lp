'use client';

import { useMemo, useState, Fragment, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, Share2, Check } from 'lucide-react';

interface TimeSlot {
  day: number;
  start: string;
  end: string;
}

const LEVEL_THEMES = {
  기초: {
    bgColor: 'rgba(34, 197, 94, 0.13)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
    accentColor: '#16a34a',
    color: '#15803d',
  },
  초급: {
    bgColor: 'rgba(59, 130, 246, 0.13)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
    accentColor: '#2563eb',
    color: '#1d4ed8',
  },
  중급: {
    bgColor: 'rgba(168, 85, 247, 0.14)',
    borderColor: 'rgba(168, 85, 247, 0.38)',
    accentColor: '#9333ea',
    color: '#7e22ce',
  },
} as const;

type LessonLevel = keyof typeof LEVEL_THEMES;

const LEVELS = ['전체', '기초', '초급', '중급'] as const;
type Level = (typeof LEVELS)[number];

interface GroupLesson {
  id: string;
  title: string;          // 그룹타이틀
  level: LessonLevel;     // 레벨 (기초 | 초급 | 중급)
  maxMembers: number;     // 정원
  currentMembers: number; // 현재인원
  schedule: TimeSlot[];   // 수업 일정
}

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const START_HOUR = 10;
const END_HOUR = 22;
const SLOT_HEIGHT = 30;
const TIME_COL_W = 48;
const HEADER_H = 40;

const timeToSlots = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return (h - START_HOUR) * 2 + m / 30;
};

const fmt = (h: number, m: number) =>
  `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

function GroupScheduleContent() {
  const searchParams = useSearchParams();
  const isShared = searchParams.get('share') === 'true';

  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level>('전체');
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=true`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const groups: GroupLesson[] = useMemo(() => [
    // ---------------- 화요일 (day: 1) ----------------
    {
      id: 'tue-14',
      title: '중급 회화',
      level: '중급',
      maxMembers: 4,
      currentMembers: 2,
      schedule: [{ day: 1, start: '14:00', end: '15:00' }],
    },
    {
      id: 'tue-15',
      title: 'N3 대비',
      level: '초급',
      maxMembers: 4,
      currentMembers: 2,
      schedule: [{ day: 1, start: '15:00', end: '16:00' }],
    },
    {
      id: 'tue-18',
      title: '중급 회화',
      level: '중급',
      maxMembers: 4,
      currentMembers: 4,
      schedule: [{ day: 1, start: '18:00', end: '19:00' }],
    },
    {
      id: 'tue-19',
      title: '초급 회화',
      level: '초급',
      maxMembers: 4,
      currentMembers: 0,
      schedule: [{ day: 1, start: '19:00', end: '20:00' }],
    },

    // ---------------- 수요일 (day: 2) ----------------
    {
      id: 'wed-10',
      title: '초급 회화',
      level: '초급',
      maxMembers: 4,
      currentMembers: 0,
      schedule: [{ day: 2, start: '10:00', end: '11:00' }],
    },
    {
      id: 'wed-11',
      title: '기초반',
      level: '기초',
      maxMembers: 4,
      currentMembers: 2,
      schedule: [{ day: 2, start: '11:00', end: '12:00' }],
    },
    {
      id: 'wed-19',
      title: '중급 회화',
      level: '중급',
      maxMembers: 4,
      currentMembers: 0,
      schedule: [{ day: 2, start: '19:00', end: '20:00' }],
    },
    {
      id: 'wed-20',
      title: '초급 회화',
      level: '초급',
      maxMembers: 4,
      currentMembers: 1,
      schedule: [{ day: 2, start: '20:00', end: '21:00' }],
    },

    // ---------------- 목요일 (day: 3) ----------------
    {
      id: 'thu-14',
      title: '기초반',
      level: '기초',
      maxMembers: 4,
      currentMembers: 0,
      schedule: [{ day: 3, start: '14:00', end: '15:00' }],
    },
    {
      id: 'thu-15',
      title: '초급 회화',
      level: '초급',
      maxMembers: 4,
      currentMembers: 0,
      schedule: [{ day: 3, start: '15:00', end: '16:00' }],
    },

    // ---------------- 금요일 (day: 4) ----------------
    {
      id: 'fri-11',
      title: '초급 회화',
      level: '초급',
      maxMembers: 4,
      currentMembers: 0,
      schedule: [{ day: 4, start: '11:00', end: '12:00' }],
    },
    {
      id: 'fri-15',
      title: 'N3 대비',
      level: '초급',
      maxMembers: 4,
      currentMembers: 2,
      schedule: [{ day: 4, start: '15:00', end: '16:00' }],
    },
    {
      id: 'fri-17',
      title: '초급 회화',
      level: '초급',
      maxMembers: 4,
      currentMembers: 0,
      schedule: [{ day: 4, start: '17:00', end: '18:00' }],
    },
    {
      id: 'fri-18',
      title: '중급 회화',
      level: '중급',
      maxMembers: 4,
      currentMembers: 3,
      schedule: [{ day: 4, start: '18:00', end: '19:00' }],
    },
    {
      id: 'fri-19',
      title: '기초반',
      level: '기초',
      maxMembers: 4,
      currentMembers: 2,
      schedule: [{ day: 4, start: '19:00', end: '20:00' }],
    },

    // ---------------- 토요일 (day: 5) ----------------
    {
      id: 'sat-10',
      title: '중급 회화',
      level: '중급',
      maxMembers: 4,
      currentMembers: 3,
      schedule: [{ day: 5, start: '10:00', end: '11:00' }],
    },
    {
      id: 'sat-11',
      title: '기초반',
      level: '기초',
      maxMembers: 4,
      currentMembers: 0,
      schedule: [{ day: 5, start: '11:00', end: '12:00' }],
    },
    {
      id: 'sat-13',
      title: 'N4・5 대비',
      level: '기초',
      maxMembers: 4,
      currentMembers: 2,
      schedule: [{ day: 5, start: '13:00', end: '14:00' }],
    },
  ], []);

  const totalSlots = (END_HOUR - START_HOUR) * 2;

  type Block = {
    id: string;
    groupId: string;
    title: string;
    level: LessonLevel;
    color: string;
    bgColor: string;
    borderColor: string;
    accentColor: string;
    maxMembers: number;
    currentMembers: number;
    timeText: string;
    startSlot: number;
    endSlot: number;
    col: number;
    colTotal: number;
  };

  const blocksByDay: Block[][] = useMemo(() => {
    const days: Block[][] = Array.from({ length: 7 }, () => []);

    groups.forEach(group => {
      const theme = LEVEL_THEMES[group.level];

      group.schedule.forEach((slot, slotIndex) => {
        days[slot.day].push({
          id: `${group.id}-${slot.day}-${slotIndex}`,
          groupId: group.id,
          title: group.title,
          level: group.level,
          color: theme.color,
          bgColor: theme.bgColor,
          borderColor: theme.borderColor,
          accentColor: theme.accentColor,
          maxMembers: group.maxMembers,
          currentMembers: group.currentMembers,
          timeText: `${slot.start}~${slot.end}`,
          startSlot: timeToSlots(slot.start),
          endSlot: timeToSlots(slot.end),
          col: 0,
          colTotal: 1,
        });
      });
    });

    days.forEach(dayBlocks => {
      for (let i = 0; i < dayBlocks.length; i++) {
        for (let j = i + 1; j < dayBlocks.length; j++) {
          const a = dayBlocks[i];
          const b = dayBlocks[j];
          if (a.startSlot < b.endSlot && a.endSlot > b.startSlot) {
            b.col = Math.max(b.col, a.col + 1);
            const total = Math.max(a.colTotal, b.col + 1);
            a.colTotal = total;
            b.colTotal = total;
          }
        }
      }
    });

    return days;
  }, [groups]);

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
          <div className={`sch-title-wrapper ${isShared ? 'no-back' : ''}`}>
            {!isShared && (
              <Link href="/schedule" className="sch-back-button" aria-label="이전 페이지로 이동">
                <ChevronLeft size={24} />
              </Link>
            )}
            <h1 className="sch-title">그룹일정 (그룹레슨)</h1>
            <button
              type="button"
              className={`sch-share-button ${copied ? 'copied' : ''}`}
              onClick={handleShare}
              aria-label="공유 링크 복사"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>복사됨!</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span>공유</span>
                </>
              )}
            </button>
          </div>
          <p className="sch-notice">
            참여신청은 당근 혹은 카카오톡으로 부탁드립니다.<br />
            모든 그룹 레슨은 참여 인원 2명 이상 확정 시 진행되며, 개설 날짜는 신청 인원에 따라 결정됩니다.
          </p>

          {/* Level Filter Bar */}
          <div className="sch-filter-bar">
            {LEVELS.map(lvl => {
              const theme = lvl !== '전체' ? LEVEL_THEMES[lvl] : null;
              const isActive = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  className={`sch-filter-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedLevel(lvl)}
                  style={
                    isActive && theme
                      ? {
                          backgroundColor: theme.accentColor,
                          borderColor: theme.accentColor,
                          color: '#ffffff',
                        }
                      : undefined
                  }
                >
                  {theme && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#ffffff' : theme.accentColor,
                        marginRight: 6,
                        transition: 'background-color 0.2s',
                      }}
                    />
                  )}
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sch-scroll-area">
          <div
            className="sch-grid"
            style={{ gridTemplateColumns, gridTemplateRows }}
          >
            <div className="sch-corner" style={{ gridRow: 1, gridColumn: 1 }}></div>

            {DAYS.map((day, di) => (
              <div
                key={day}
                className={`sch-day-header${di === 5 ? ' saturday' : di === 6 ? ' sunday' : ''}${hoveredCol === di ? ' highlighted' : ''}`}
                style={{
                  gridRow: 1,
                  gridColumn: di + 2,
                  userSelect: 'none'
                }}
              >
                {day}
              </div>
            ))}

            {/* Time labels + row cells */}
            {timeRows.map(({ hour, min, isHour }, i) => (
              <Fragment key={`row-${i}`}>
                {/* Time label */}
                <div
                  className={`sch-time-label${isHour ? ' on-hour' : ''}${hoveredRow === i ? ' highlighted' : ''}`}
                  style={{
                    gridRow: i + 2,
                    gridColumn: 1,
                    userSelect: 'none'
                  }}
                >
                  {isHour && <span>{fmt(hour, min)}</span>}
                </div>

                {/* Empty cells */}
                {i < totalSlots &&
                  DAYS.map((_, di) => {
                    const isSunday = di === 6;
                    const isColHovered = hoveredCol === di;
                    const isRowHovered = hoveredRow === i;

                    return (
                      <div
                        key={`cell-${di}-${i}`}
                        className={`sch-cell${isHour ? ' on-hour' : ''}${isSunday ? ' sunday-col' : ''}${isColHovered ? ' col-highlighted' : ''}${isRowHovered ? ' row-highlighted' : ''}`}
                        style={{
                          gridRow: i + 2,
                          gridColumn: di + 2,
                        }}
                        onMouseEnter={() => {
                          setHoveredCol(di);
                          setHoveredRow(i);
                        }}
                        onMouseLeave={() => {
                          setHoveredCol(null);
                          setHoveredRow(null);
                        }}
                      />
                    );
                  })}
              </Fragment>
            ))}

            {/* Group Lesson Blocks */}
            {DAYS.map((_, di) =>
              blocksByDay[di].map(block => {
                const topRow = block.startSlot + 2;
                const rowSpan = block.endSlot - block.startSlot;
                const pct = 100 / block.colTotal;
                const left = `calc(${block.col * pct}% + 1px)`;
                const width = `calc(${pct}% - 2px)`;
                const isDimmed = selectedLevel !== '전체' && block.level !== selectedLevel;

                return (
                  <div
                    key={block.id}
                    className={`sch-block ${isDimmed ? 'dimmed' : ''}`}
                    style={{
                      gridRow: `${topRow} / span ${rowSpan}`,
                      gridColumn: di + 2,
                      left,
                      width,
                      backgroundColor: block.bgColor,
                      borderColor: block.borderColor,
                      borderLeftColor: block.accentColor,
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
                      <span className="sch-group-title">{block.title}</span>
                      <div className={`sch-group-capacity ${block.currentMembers >= block.maxMembers ? 'full' : ''}`}>
                        <div className="capacity-text">
                          <span className="badge-num">{block.currentMembers}/{block.maxMembers}</span>
                          {block.currentMembers >= block.maxMembers ? (
                            <span className="badge-status">명</span>
                          ) : (
                            <span className="badge-unit">명</span>
                          )}
                        </div>
                        <div className="capacity-gauge" aria-hidden="true">
                          <div
                            className="gauge-fill"
                            style={{
                              width: `${Math.min(100, (block.currentMembers / block.maxMembers) * 100)}%`,
                              backgroundColor: block.currentMembers >= block.maxMembers ? '#d70015' : block.accentColor,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Sunday holiday overlay */}
            <div
              className="sch-holiday"
              style={{
                gridRow: `2 / span ${totalSlots}`,
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

export default function GroupSchedulePage() {
  return (
    <Suspense fallback={null}>
      <GroupScheduleContent />
    </Suspense>
  );
}
