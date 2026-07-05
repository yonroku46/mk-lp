import { Metadata } from 'next';

type MetadataType = 'home' | 'schedule' | 'tickets' | 'tickets-lookup' | 'tickets-purchase' | 'tickets-pin-change';

const APP_NAME = "스터디 예약";
const APP_DESCRIPTION = "선생님과 학생의 더 효율적인 클래스 관리를 돕는 스마트 매니저";
const APP_URL = process.env.NEXT_PUBLIC_APP_ADDRESS || "http://localhost:3000";

const PAGE_INFO: Record<MetadataType, { title: string; description?: string }> = {
  'home': {
    title: '스터디 예약',
    description: '예약 가능한 시간표를 확인하고 지금 바로 수업을 예약하세요.'
  },
  'schedule': {
    title: '운영 시간표 확인',
    description: '선생님별 운영 시간표를 확인하세요.'
  },
  'tickets': {
    title: '횟수권 관리',
    description: '횟수권 조회, 구입, 비밀번호 변경을 관리합니다.'
  },
  'tickets-lookup': {
    title: '횟수권 잔여 확인',
    description: '이름과 닉네임, 조회코드로 잔여 횟수를 조회하세요.'
  },
  'tickets-purchase': {
    title: '수강권 구입 신청',
    description: '횟수권을 온라인으로 편리하게 구매 신청하세요.'
  },
  'tickets-pin-change': {
    title: '조회코드 변경',
    description: '횟수권 조회 시 필요한 비밀번호(PIN) 변경을 신청하세요.'
  }
};

export function generatePageMetadata(type: MetadataType): Metadata {
  const info = PAGE_INFO[type];
  const title = info.title;
  const description = info.description || APP_DESCRIPTION;

  return {
    metadataBase: new URL(APP_URL),
    title: type === 'home' ? {
      default: APP_NAME,
      template: `%s`,
    } : title,
    description,
    keywords: ['스터디예약', '운영시간표'],
    authors: [{ name: 'TuterLog' }],
    creator: 'TuterLog',
    publisher: 'TuterLog',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      siteName: APP_NAME,
      title: `${title}`,
      description,
      url: APP_URL,
      images: [
        {
          url: '/assets/icons/favicon.svg',
          width: 1200,
          height: 630,
          alt: APP_NAME,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title}`,
      description,
      images: ['/assets/icons/favicon.svg'],
    },
    icons: {
      icon: [
        { url: '/assets/icons/favicon.ico', sizes: 'any' },
        { url: '/assets/icons/favicon.svg', type: 'image/svg+xml' }
      ],
      apple: [
        { url: '/assets/icons/favicon.svg' }
      ],
    },
    manifest: '/manifest.json',
  };
}
