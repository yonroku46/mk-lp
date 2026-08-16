'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Volume2,
  RotateCw,
  Shuffle,
  ChevronRight,
  Grid,
  Layers,
  Lightbulb,
  Trophy,
  X,
  Languages,
  Zap,
  Eye,
} from 'lucide-react';

import hiraganaJson from '../../../public/docs/hiragana.json';
import katakanaJson from '../../../public/docs/katakana.json';

interface RawItem {
  romaji: string;
  mnemonic: string;
}

interface KanaItem {
  char: string;
  romaji: string;
  mnemonic: string;
  korean: string;
  rowGroup: string;
  type: 'hiragana' | 'katakana';
}

// Romaji to Korean pronunciation map
const ROMAJI_TO_KO: Record<string, string> = {
  a: '아', i: '이', u: '우', e: '에', o: '오',
  ka: '카', ki: '키', ku: '쿠', ke: '케', ko: '코',
  sa: '사', shi: '시', su: '스', se: '세', so: '소',
  ta: '타', chi: '치', tsu: '츠', te: '테', to: '토',
  na: '나', ni: '니', nu: '누', ne: '네', no: '노',
  ha: '하', hi: '히', fu: '후', he: '헤', ho: '호',
  ma: '마', mi: '미', mu: '무', me: '메', mo: '모',
  ya: '야', yu: '유', yo: '요',
  ra: '라', ri: '리', ru: '루', re: '레', ro: '로',
  wa: '와', wo: '오', n: '응',
};

// Row Groups mapping
const ROW_GROUPS = [
  '전체',
  'あ행',
  'か행',
  'さ행',
  'た행',
  'な행',
  'は행',
  'ま행',
  'や행',
  'ら행',
  'わ행',
];

function getRowGroup(romaji: string): string {
  if (['a', 'i', 'u', 'e', 'o'].includes(romaji)) return 'あ행';
  if (['ka', 'ki', 'ku', 'ke', 'ko'].includes(romaji)) return 'か행';
  if (['sa', 'shi', 'su', 'se', 'so'].includes(romaji)) return 'さ행';
  if (['ta', 'chi', 'tsu', 'te', 'to'].includes(romaji)) return 'た행';
  if (['na', 'ni', 'nu', 'ne', 'no'].includes(romaji)) return 'な행';
  if (['ha', 'hi', 'fu', 'he', 'ho'].includes(romaji)) return 'は행';
  if (['ma', 'mi', 'mu', 'me', 'mo'].includes(romaji)) return 'ま행';
  if (['ya', 'yu', 'yo'].includes(romaji)) return 'や행';
  if (['ra', 'ri', 'ru', 're', 'ro'].includes(romaji)) return 'ら행';
  if (['wa', 'wo', 'n'].includes(romaji)) return 'わ행';
  return '전체';
}

export default function BenkyoPage() {
  const [mode, setMode] = useState<'hiragana' | 'katakana'>('hiragana');
  const [viewMode, setViewMode] = useState<'flashcard' | 'grid'>('flashcard');
  const [selectedRow, setSelectedRow] = useState<string>('전체');
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  
  // Navigation mode: show answer first when clicking next if checked
  const [showAnswerFirst, setShowAnswerFirst] = useState<boolean>(true);

  // Grid sheet subtext toggle state: romaji -> korean -> none -> romaji
  const [gridSubMode, setGridSubMode] = useState<'romaji' | 'korean' | 'none'>('romaji');
  const [jaVoice, setJaVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Load authentic Japanese TTS voice from browser
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const findJapaneseVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      const ja =
        voices.find(
          (v) =>
            v.lang.toLowerCase().replace('_', '-').startsWith('ja') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Online') ||
              v.name.includes('Nanami') ||
              v.name.includes('Keita') ||
              v.name.includes('Haruka'))
        ) || voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('ja'));

      if (ja) {
        setJaVoice(ja);
      }
    };

    findJapaneseVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = findJapaneseVoice;
    }
  }, []);

  // Cycle subtext display mode
  const cycleGridSubMode = () => {
    setGridSubMode((prev) => {
      if (prev === 'romaji') return 'korean';
      if (prev === 'korean') return 'none';
      return 'romaji';
    });
  };

  // Parse base data
  const rawDeck = useMemo(() => {
    const jsonSource = mode === 'hiragana' ? hiraganaJson : katakanaJson;
    const items: KanaItem[] = Object.entries(jsonSource as Record<string, RawItem>).map(
      ([char, data]) => ({
        char,
        romaji: data.romaji,
        mnemonic: data.mnemonic,
        korean: ROMAJI_TO_KO[data.romaji] || data.romaji,
        rowGroup: getRowGroup(data.romaji),
        type: mode,
      })
    );
    return items;
  }, [mode]);

  // Filter by selected row
  const filteredDeck = useMemo(() => {
    if (selectedRow === '전체') return rawDeck;
    return rawDeck.filter((item) => item.rowGroup === selectedRow);
  }, [rawDeck, selectedRow]);

  // Structured Grid layout items for standard Japanese 50-on chart (5 columns)
  // Handles empty slots for や행 (ya, _, yu, _, yo) and わ행 (wa, _, _, _, wo)
  const gridItems = useMemo(() => {
    const itemMap = new Map<string, KanaItem>();
    rawDeck.forEach((item) => itemMap.set(item.romaji, item));

    const standardLayout: (string | null)[] = [
      'a', 'i', 'u', 'e', 'o',
      'ka', 'ki', 'ku', 'ke', 'ko',
      'sa', 'shi', 'su', 'se', 'so',
      'ta', 'chi', 'tsu', 'te', 'to',
      'na', 'ni', 'nu', 'ne', 'no',
      'ha', 'hi', 'fu', 'he', 'ho',
      'ma', 'mi', 'mu', 'me', 'mo',
      'ya', null, 'yu', null, 'yo',
      'ra', 'ri', 'ru', 're', 'ro',
      'wa', null, null, null, 'wo',
      'n', null, null, null, null,
    ];

    if (selectedRow === '전체') {
      return standardLayout.map((romaji) => (romaji ? itemMap.get(romaji) || null : null));
    }

    if (selectedRow === 'や행') {
      return ['ya', null, 'yu', null, 'yo'].map((r) => (r ? itemMap.get(r) || null : null));
    }

    if (selectedRow === 'わ행') {
      return ['wa', null, null, null, 'wo', 'n', null, null, null, null].map((r) => (r ? itemMap.get(r) || null : null));
    }

    return filteredDeck;
  }, [rawDeck, filteredDeck, selectedRow]);

  // Handle deck shuffling
  const currentDeck = useMemo(() => {
    if (!isShuffled) return filteredDeck;
    const arr = [...filteredDeck];
    let seed = shuffleSeed || 1;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.abs(Math.sin(seed++) * 10000)) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [filteredDeck, isShuffled, shuffleSeed]);

  // Reset card state on deck or mode change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowCompleteModal(false);
  }, [mode, selectedRow, isShuffled]);

  const activeCard = currentDeck[currentIndex] || currentDeck[0];

  // Play Audio using ResponsiveVoice API (External non-Google audio service)
  const playAudio = useCallback((text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      // ResponsiveVoice Japanese Voice API
      const responsiveVoiceUrl = `https://code.responsivevoice.org/getvoice.php?t=${encodeURIComponent(text)}&tl=ja`;
      const audio = new Audio(responsiveVoiceUrl);

      audio.play().catch(() => {
        // Fallback handling if network is unavailable
      });
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  }, []);

  const navTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear navigation timer on unmount
  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  // Card Flip Toggle
  const handleCardClick = () => {
    const nextFlippedState = !isFlipped;
    setIsFlipped(nextFlippedState);
    if (nextFlippedState && activeCard) {
      playAudio(activeCard.char);
    }
  };

  // Next Card Navigation with optional Show-Answer-First logic
  const handleNext = useCallback(() => {
    if (navTimerRef.current) clearTimeout(navTimerRef.current);

    if (showAnswerFirst && !isFlipped) {
      // If check option is ON and card is currently front: flip to back first & play audio
      setIsFlipped(true);
      if (activeCard) {
        playAudio(activeCard.char);
      }
    } else {
      // Advance to next card smoothly without showing back of next card
      if (isFlipped) {
        setIsFlipped(false);
        navTimerRef.current = setTimeout(() => {
          if (currentIndex < currentDeck.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            setShowCompleteModal(true);
          }
        }, 180);
      } else {
        if (currentIndex < currentDeck.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setShowCompleteModal(true);
        }
      }
    }
  }, [showAnswerFirst, isFlipped, activeCard, playAudio, currentIndex, currentDeck.length]);

  // Prev Card Navigation
  const handlePrev = useCallback(() => {
    if (navTimerRef.current) clearTimeout(navTimerRef.current);

    if (isFlipped) {
      setIsFlipped(false);
      navTimerRef.current = setTimeout(() => {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      }, 180);
    } else {
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    }
  }, [isFlipped, currentIndex]);

  // Shuffle Toggle
  const handleShuffleToggle = () => {
    if (!isShuffled) {
      setIsShuffled(true);
      setShuffleSeed(Date.now());
    } else {
      setIsShuffled(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'flashcard' || showCompleteModal) return;
      
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleCardClick();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleShuffleToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isFlipped, activeCard, viewMode, showCompleteModal]);

  return (
    <main>
      <div className="benkyo-page">
        {/* Header */}
        <header className="benkyo-header">
          <div className="sch-header">
            <div className="sch-title-wrapper">
              <Link href="/" className="sch-back-button" aria-label="이전 페이지로 이동">
                <ChevronLeft size={24} />
              </Link>
              <h1 className="sch-title">기초연습</h1>
            </div>
          </div>

          <button
            className="view-toggle-btn"
            onClick={() => setViewMode((v) => (v === 'flashcard' ? 'grid' : 'flashcard'))}
          >
            {viewMode === 'flashcard' ? (
              <>
                <Grid size={15} />
                전체표로 보기
              </>
            ) : (
              <>
                <Layers size={15} />
                카드로 보기
              </>
            )}
          </button>
        </header>

        {/* Single-Row Zen Toolbar (Tabs + Row Dropdown + Mode Toggle + Shuffle) */}
        <div className="benkyo-toolbar">
          <div className="benkyo-tab-group">
            <button
              className={`benkyo-tab ${mode === 'hiragana' ? 'active' : ''}`}
              onClick={() => setMode('hiragana')}
            >
              히라가나
            </button>
            <button
              className={`benkyo-tab ${mode === 'katakana' ? 'active' : ''}`}
              onClick={() => setMode('katakana')}
            >
              카타카나
            </button>
          </div>

          <div className="toolbar-actions">
            {viewMode === 'flashcard' && (
              <>
                <button
                  className={`toolbar-icon-btn ${showAnswerFirst ? 'active' : ''}`}
                  onClick={() => setShowAnswerFirst((prev) => !prev)}
                  title={showAnswerFirst ? '확인 후 넘김 모드 (클릭하여 바로 넘김)' : '바로 넘김 모드 (클릭하여 확인 후 넘김)'}
                >
                  {showAnswerFirst ? <Eye size={15} /> : <Zap size={15} />}
                </button>

                <button
                  className={`toolbar-icon-btn ${isShuffled ? 'active' : ''}`}
                  onClick={handleShuffleToggle}
                  title={isShuffled ? '순서대로 정열' : '카드 섞기'}
                >
                  <Shuffle size={15} />
                </button>
              </>
            )}
            <select
              className="row-select-dropdown"
              value={selectedRow}
              onChange={(e) => setSelectedRow(e.target.value)}
            >
              {ROW_GROUPS.map((row) => (
                <option key={row} value={row}>
                  {row}
                </option>
              ))}
            </select>
          </div>
        </div>

        {viewMode === 'flashcard' ? (
          <>
            {/* 3D Flip Card Scene - 100% Pure Zen Character View */}
            {activeCard && (
              <div className="benkyo-card-scene" onClick={handleCardClick}>
                <div className={`benkyo-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
                  {/* Card Front */}
                  <div className="benkyo-card-face face-front">
                    <div className="card-header">
                      <div className="header-placeholder" />
                    </div>

                    <div className="card-body">
                      <div className="main-char">{activeCard.char}</div>
                    </div>

                    <div className="card-footer">
                      <div className="flip-hint">
                        <RotateCw size={14} />
                        <span>터치하여 발음 & 힌트 확인</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Back */}
                  <div className="benkyo-card-face face-back">
                    <div className="card-header">
                      <div className="header-placeholder" />
                    </div>

                    <div className="card-body">
                      <div className="main-char">{activeCard.char}</div>
                      <div className="sub-pronunciation">
                        <span className="romaji">{activeCard.romaji}</span>
                        <span className="korean">{activeCard.korean}</span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <div className="mnemonic-card">
                        <div className="mnemonic-content">
                          <Lightbulb size={16} className="mnemonic-icon" />
                          <p className="mnemonic-quote">{activeCard.mnemonic}</p>
                        </div>
                        <button
                          className="audio-icon-btn"
                          onClick={(e) => playAudio(activeCard.char, e)}
                          title="발음 듣기"
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Navigation Buttons */}
            <div className="benkyo-controls">
              <div className="benkyo-progress-text">
                {currentIndex + 1} / {currentDeck.length}
              </div>

              <div className="controls-btn-group">
                <button
                  className="nav-btn"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                >
                  이전 카드
                </button>

                <button className="nav-btn primary-next" onClick={handleNext}>
                  {currentIndex === currentDeck.length - 1 && isFlipped ? '학습 완료' : '다음 카드'}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Grid Chart Reference Sheet Mode */
          <div className="benkyo-grid-section">
            <div className="grid-section-header">
              <div className="grid-title-group">
                <span className="grid-title">
                  {mode === 'hiragana' ? '히라가나' : '카타카나'}표 ({filteredDeck.length}자)
                </span>
                <span className="grid-subtitle">터치하면 소리를 들을 수 있어요</span>
              </div>

              <button
                className="grid-sub-toggle-btn"
                onClick={cycleGridSubMode}
                title="발음 표시 변경 (로마자 ➔ 한글발음 ➔ 숨김)"
              >
                <Languages size={14} />
                <span>
                  {gridSubMode === 'romaji'
                    ? '로마자'
                    : gridSubMode === 'korean'
                    ? '한글 발음'
                    : '발음 숨김'}
                </span>
              </button>
            </div>

            <div className="kana-chart-grid">
              {gridItems.map((item, idx) =>
                item ? (
                  <div
                    key={item.char}
                    className="chart-card"
                    onClick={() => playAudio(item.char)}
                    title={`${item.char} (${item.romaji}): ${item.mnemonic}`}
                  >
                    <span className="chart-char">{item.char}</span>
                    {gridSubMode !== 'none' && (
                      <span className="chart-romaji">
                        {gridSubMode === 'romaji' ? item.romaji : item.korean}
                      </span>
                    )}
                  </div>
                ) : (
                  <div key={`empty-${idx}`} className="chart-card empty-card" aria-hidden="true" />
                )
              )}
            </div>
          </div>
        )}

        {/* Completion Modal */}
        {showCompleteModal && (
          <div className="sch-modal-overlay">
            <div className="sch-modal-content">
              <button className="close-btn" onClick={() => setShowCompleteModal(false)}>
                <X size={20} />
              </button>

              <div className="benkyo-complete-content">
                <div className="trophy-badge">
                  <Trophy size={36} />
                </div>
                <h3 className="complete-title">학습 완료</h3>
                <p className="complete-desc">
                  {selectedRow} {mode === 'hiragana' ? '히라가나' : '카타카나'} {currentDeck.length}개 카드를 모두 공부하셨습니다.
                </p>

                <button
                  className="sch-btn-submit"
                  onClick={() => {
                    setCurrentIndex(0);
                    setIsFlipped(false);
                    setShowCompleteModal(false);
                  }}
                  style={{ marginBottom: '8px' }}
                >
                  처음부터 다시 학습하기
                </button>

                <button
                  className="sch-btn-reset"
                  onClick={() => {
                    setMode((m) => (m === 'hiragana' ? 'katakana' : 'hiragana'));
                    setShowCompleteModal(false);
                  }}
                >
                  {mode === 'hiragana' ? '카타카나' : '히라가나'} 공부하러 가기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}