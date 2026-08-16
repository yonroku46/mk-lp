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

// Dakuon (탁음) & Handakuon (반탁음) static data
const HIRAGANA_DAKUON: KanaItem[] = [
  { char: 'が', romaji: 'ga', korean: '가', mnemonic: '가(か)에 탁음(゛)', rowGroup: 'か행', type: 'hiragana' },
  { char: 'ぎ', romaji: 'gi', korean: '기', mnemonic: '키(き)에 탁음(゛)', rowGroup: 'か행', type: 'hiragana' },
  { char: 'ぐ', romaji: 'gu', korean: '구', mnemonic: '쿠(く)에 탁음(゛)', rowGroup: 'か행', type: 'hiragana' },
  { char: 'げ', romaji: 'ge', korean: '게', mnemonic: '케(け)에 탁음(゛)', rowGroup: 'か행', type: 'hiragana' },
  { char: 'ご', romaji: 'go', korean: '고', mnemonic: '코(こ)에 탁음(゛)', rowGroup: 'か행', type: 'hiragana' },
  { char: 'ざ', romaji: 'za', korean: '자', mnemonic: '사(さ)에 탁음(゛)', rowGroup: 'さ행', type: 'hiragana' },
  { char: 'じ', romaji: 'ji', korean: '지', mnemonic: '시(し)에 탁음(゛)', rowGroup: 'さ행', type: 'hiragana' },
  { char: 'ず', romaji: 'zu', korean: '즈', mnemonic: '스(す)에 탁음(゛)', rowGroup: 'さ행', type: 'hiragana' },
  { char: 'ぜ', romaji: 'ze', korean: '제', mnemonic: '세(せ)에 탁음(゛)', rowGroup: 'さ행', type: 'hiragana' },
  { char: 'ぞ', romaji: 'zo', korean: '조', mnemonic: '소(そ)에 탁음(゛)', rowGroup: 'さ행', type: 'hiragana' },
  { char: 'だ', romaji: 'da', korean: '다', mnemonic: '타(た)에 탁음(゛)', rowGroup: 'た행', type: 'hiragana' },
  { char: 'ぢ', romaji: 'dji', korean: '지', mnemonic: '치(ち)에 탁음(゛)', rowGroup: 'た행', type: 'hiragana' },
  { char: 'づ', romaji: 'dzu', korean: '즈', mnemonic: '츠(つ)에 탁음(゛)', rowGroup: 'た행', type: 'hiragana' },
  { char: 'で', romaji: 'de', korean: '데', mnemonic: '테(て)에 탁음(゛)', rowGroup: 'た행', type: 'hiragana' },
  { char: 'ど', romaji: 'do', korean: '도', mnemonic: '토(と)에 탁음(゛)', rowGroup: 'た행', type: 'hiragana' },
  { char: 'ば', romaji: 'ba', korean: '바', mnemonic: '하(は)에 탁음(゛)', rowGroup: 'は행', type: 'hiragana' },
  { char: 'び', romaji: 'bi', korean: '비', mnemonic: '히(ひ)에 탁음(゛)', rowGroup: 'は행', type: 'hiragana' },
  { char: 'ぶ', romaji: 'bu', korean: '부', mnemonic: '후(ふ)에 탁음(゛)', rowGroup: 'は행', type: 'hiragana' },
  { char: 'べ', romaji: 'be', korean: '베', mnemonic: '헤(へ)에 탁음(゛)', rowGroup: 'は행', type: 'hiragana' },
  { char: 'ぼ', romaji: 'bo', korean: '보', mnemonic: '호(ほ)에 탁음(゛)', rowGroup: 'は행', type: 'hiragana' },
];

const HIRAGANA_HANDAKUON: KanaItem[] = [
  { char: 'ぱ', romaji: 'pa', korean: '파', mnemonic: '하(は)에 반탁음(゜)', rowGroup: 'は행', type: 'hiragana' },
  { char: 'ぴ', romaji: 'pi', korean: '피', mnemonic: '히(ひ)에 반탁음(゜)', rowGroup: 'は행', type: 'hiragana' },
  { char: 'ぷ', romaji: 'pu', korean: '푸', mnemonic: '후(ふ)에 반탁음(゜)', rowGroup: 'は행', type: 'hiragana' },
  { char: 'ぺ', romaji: 'pe', korean: '페', mnemonic: '헤(へ)에 반탁음(゜)', rowGroup: 'は행', type: 'hiragana' },
  { char: 'ぽ', romaji: 'po', korean: '포', mnemonic: '호(ほ)에 반탁음(゜)', rowGroup: 'は행', type: 'hiragana' },
];

const KATAKANA_DAKUON: KanaItem[] = [
  { char: 'ガ', romaji: 'ga', korean: '가', mnemonic: '카(カ)에 탁음(゛)', rowGroup: 'か행', type: 'katakana' },
  { char: 'ギ', romaji: 'gi', korean: '기', mnemonic: '키(キ)에 탁음(゛)', rowGroup: 'か행', type: 'katakana' },
  { char: 'グ', romaji: 'gu', korean: '구', mnemonic: '쿠(ク)에 탁음(゛)', rowGroup: 'か행', type: 'katakana' },
  { char: 'ゲ', romaji: 'ge', korean: '게', mnemonic: '케(ケ)에 탁음(゛)', rowGroup: 'か행', type: 'katakana' },
  { char: 'ゴ', romaji: 'go', korean: '고', mnemonic: '코(コ)에 탁음(゛)', rowGroup: 'か행', type: 'katakana' },
  { char: 'ザ', romaji: 'za', korean: '자', mnemonic: '사(サ)에 탁음(゛)', rowGroup: 'さ행', type: 'katakana' },
  { char: 'ジ', romaji: 'ji', korean: '지', mnemonic: '시(シ)에 탁음(゛)', rowGroup: 'さ행', type: 'katakana' },
  { char: 'ズ', romaji: 'zu', korean: '즈', mnemonic: '스(ス)에 탁음(゛)', rowGroup: 'さ행', type: 'katakana' },
  { char: 'ゼ', romaji: 'ze', korean: '제', mnemonic: '세(セ)에 탁음(゛)', rowGroup: 'さ행', type: 'katakana' },
  { char: 'ゾ', romaji: 'zo', korean: '조', mnemonic: '소(ソ)에 탁음(゛)', rowGroup: 'さ행', type: 'katakana' },
  { char: 'ダ', romaji: 'da', korean: '다', mnemonic: '타(タ)에 탁음(゛)', rowGroup: 'た행', type: 'katakana' },
  { char: 'ヂ', romaji: 'dji', korean: '지', mnemonic: '치(チ)에 탁음(゛)', rowGroup: 'た행', type: 'katakana' },
  { char: 'ヅ', romaji: 'dzu', korean: '즈', mnemonic: '츠(ツ)에 탁음(゛)', rowGroup: 'た행', type: 'katakana' },
  { char: 'デ', romaji: 'de', korean: '데', mnemonic: '테(テ)에 탁음(゛)', rowGroup: 'た행', type: 'katakana' },
  { char: 'ド', romaji: 'do', korean: '도', mnemonic: '토(ト)에 탁음(゛)', rowGroup: 'た행', type: 'katakana' },
  { char: 'バ', romaji: 'ba', korean: '바', mnemonic: '하(ハ)에 탁음(゛)', rowGroup: 'は행', type: 'katakana' },
  { char: 'ビ', romaji: 'bi', korean: '비', mnemonic: '히(ヒ)에 탁음(゛)', rowGroup: 'は행', type: 'katakana' },
  { char: 'ブ', romaji: 'bu', korean: '부', mnemonic: '후(フ)에 탁음(゛)', rowGroup: 'は행', type: 'katakana' },
  { char: 'ベ', romaji: 'be', korean: '베', mnemonic: '헤(ヘ)에 탁음(゛)', rowGroup: 'は행', type: 'katakana' },
  { char: 'ボ', romaji: 'bo', korean: '보', mnemonic: '호(ホ)에 탁음(゛)', rowGroup: 'は행', type: 'katakana' },
];

const KATAKANA_HANDAKUON: KanaItem[] = [
  { char: 'パ', romaji: 'pa', korean: '파', mnemonic: '하(ハ)에 반탁음(゜)', rowGroup: 'は행', type: 'katakana' },
  { char: 'ピ', romaji: 'pi', korean: '피', mnemonic: '히(ヒ)에 반탁음(゜)', rowGroup: 'は행', type: 'katakana' },
  { char: 'プ', romaji: 'pu', korean: '푸', mnemonic: '후(フ)에 반탁음(゜)', rowGroup: 'は행', type: 'katakana' },
  { char: 'ペ', romaji: 'pe', korean: '페', mnemonic: '헤(ヘ)에 반탁음(゜)', rowGroup: 'は행', type: 'katakana' },
  { char: 'ポ', romaji: 'po', korean: '포', mnemonic: '호(ホ)에 반탁음(゜)', rowGroup: 'は행', type: 'katakana' },
];

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
  // Sound type toggle state: seion (청음) -> dakuon (탁음) -> handakuon (반탁음) -> seion
  const [soundType, setSoundType] = useState<'seion' | 'dakuon' | 'handakuon'>('seion');
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

  // Cycle sound type mode (청음 -> 탁음 -> 반탁음)
  const cycleSoundType = () => {
    setSoundType((prev) => {
      if (prev === 'seion') return 'dakuon';
      if (prev === 'dakuon') return 'handakuon';
      return 'seion';
    });
  };

  // Available row groups depending on viewMode & soundType
  const availableRowGroups = useMemo(() => {
    if (viewMode === 'grid') {
      if (soundType === 'dakuon') {
        return ['전체', 'か행', 'さ행', 'た행', 'は행'];
      }
      if (soundType === 'handakuon') {
        return ['전체', 'は행'];
      }
    }
    return ROW_GROUPS;
  }, [viewMode, soundType]);

  // Reset soundType to 'seion' when switching back to flashcard mode
  useEffect(() => {
    if (viewMode === 'flashcard') {
      setSoundType('seion');
    }
  }, [viewMode]);

  // Automatically reset selectedRow to '전체' if current row is invalid for selected soundType
  useEffect(() => {
    if (!availableRowGroups.includes(selectedRow)) {
      setSelectedRow('전체');
    }
  }, [availableRowGroups, selectedRow]);

  // Parse base data for Flashcards (Always 46 Seion characters)
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

  // Structured Grid layout items for Japanese Kana chart
  const gridItems = useMemo(() => {
    if (soundType === 'dakuon') {
      const list = mode === 'hiragana' ? HIRAGANA_DAKUON : KATAKANA_DAKUON;
      if (selectedRow === '전체') return list;
      const filtered = list.filter((item) => item.rowGroup === selectedRow);
      return filtered.length > 0 ? filtered : list;
    }

    if (soundType === 'handakuon') {
      const list = mode === 'hiragana' ? HIRAGANA_HANDAKUON : KATAKANA_HANDAKUON;
      if (selectedRow === '전체') return list;
      const filtered = list.filter((item) => item.rowGroup === selectedRow);
      return filtered.length > 0 ? filtered : list;
    }

    // soundType === 'seion' (기본 오십음도)
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
  }, [mode, soundType, rawDeck, filteredDeck, selectedRow]);

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

  // Helper for Web Speech API TTS
  const speakWebSpeech = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      if (jaVoice) {
        utterance.voice = jaVoice;
      }
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    },
    [jaVoice]
  );

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    } catch (err) {
      console.error('stopAudio error:', err);
    }
  }, []);

  // Audio Playback Handler
  // 1순위: /public/audio/kana/[romaji].mp3
  // 2순위: Web Speech API (브라우저 내장 TTS Fallback)
  // 원본URL: https://code.responsivevoice.org/getvoice.php?t=${encodeURIComponent(text)}&tl=ja
  const playAudio = useCallback(
    (text: string, romaji?: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();

      try {
        stopAudio();

        // 1순위: /public/audio/kana/[romaji].mp3 로컬 음성 파일 재생
        if (romaji) {
          const audioPath = `/audio/kana/${romaji}.mp3`;
          const audio = new Audio(audioPath);
          currentAudioRef.current = audio;

          audio.play().catch(() => {
            // 로컬 MP3 파일이 없거나 재생 오류 발생 시 Web Speech API Fallback
            speakWebSpeech(text);
          });
          return;
        }

        speakWebSpeech(text);
      } catch (err) {
        console.error('Audio playback error:', err);
      }
    },
    [speakWebSpeech, stopAudio]
  );

  const navTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear navigation timer on unmount
  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  // Card Flip Toggle
  const handleCardClick = () => {
    stopAudio();
    if (navTimerRef.current !== null) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
    const nextFlippedState = !isFlipped;
    setIsFlipped(nextFlippedState);
    if (nextFlippedState && activeCard) {
      playAudio(activeCard.char, activeCard.romaji);
    }
  };

  // Next Card Navigation with optional Show-Answer-First logic
  const handleNext = useCallback(() => {
    stopAudio();

    // If rapid-clicked while card is flipping back: cancel timer & advance index immediately
    if (navTimerRef.current !== null) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
      setIsFlipped(false);
      if (currentIndex < currentDeck.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setShowCompleteModal(true);
      }
      return;
    }

    if (showAnswerFirst && !isFlipped) {
      // If check option is ON and card is currently front: flip to back first & play audio
      setIsFlipped(true);
      if (activeCard) {
        playAudio(activeCard.char, activeCard.romaji);
      }
    } else {
      // Advance to next card: if flipped, flip back first then update index after 150ms
      if (isFlipped) {
        setIsFlipped(false);
        navTimerRef.current = setTimeout(() => {
          navTimerRef.current = null;
          if (currentIndex < currentDeck.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            setShowCompleteModal(true);
          }
        }, 150);
      } else {
        if (currentIndex < currentDeck.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setShowCompleteModal(true);
        }
      }
    }
  }, [showAnswerFirst, isFlipped, activeCard, playAudio, stopAudio, currentIndex, currentDeck.length]);

  // Prev Card Navigation
  const handlePrev = useCallback(() => {
    stopAudio();

    if (navTimerRef.current !== null) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
      setIsFlipped(false);
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
      return;
    }

    if (isFlipped) {
      setIsFlipped(false);
      navTimerRef.current = setTimeout(() => {
        navTimerRef.current = null;
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      }, 150);
    } else {
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    }
  }, [stopAudio, isFlipped, currentIndex]);

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
              {availableRowGroups.map((row) => (
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
                          onClick={(e) => playAudio(activeCard.char, activeCard.romaji, e)}
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
                  {mode === 'hiragana' ? '히라가나' : '카타카나'}표
                </span>
                <span className="grid-subtitle">터치하면 소리를 들을 수 있어요</span>
              </div>

              <div className="grid-header-actions">
                <button
                  className={`grid-sub-toggle-btn sound-type-btn ${soundType}`}
                  onClick={cycleSoundType}
                  title="소리 구분 변경 (청음 ➔ 탁음 ➔ 반탁음)"
                >
                  <span>
                    {soundType === 'seion'
                      ? '청음'
                      : soundType === 'dakuon'
                      ? '탁음 (゛)'
                      : '반탁음 (゜)'}
                  </span>
                </button>

                <button
                  className="grid-sub-toggle-btn"
                  onClick={cycleGridSubMode}
                  title="발음 표시 변경 (로마자 ➔ 한글 ➔ 숨김)"
                >
                  <Languages size={14} />
                  <span>
                    {gridSubMode === 'romaji'
                      ? '로마자'
                      : gridSubMode === 'korean'
                      ? '한글'
                      : '숨김'}
                  </span>
                </button>
              </div>
            </div>

            <div className="kana-chart-grid">
              {gridItems.map((item, idx) =>
                item ? (
                  <div
                    key={item.char}
                    className="chart-card"
                    onClick={() => playAudio(item.char, item.romaji)}
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