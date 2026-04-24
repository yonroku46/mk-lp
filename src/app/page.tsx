import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Clock } from 'lucide-react';

const tutors = [
  {
    id: 1,
    name: '미쿠 선생님',
    schedule: '평일 오후',
    image: '/img/miku.png',
    link: 'https://whattime.co.kr/miku',
  },
  {
    id: 2,
    name: '아유미 선생님',
    schedule: '평일 저녁 / 주말 오전',
    image: '/img/ayumi.jpg',
    link: 'https://whattime.co.kr/ayumi',
  },
];

export default function HomePage() {
  return (
    <main>
      <div className="container">
        <h1 className="title">선생님을 선택해주세요</h1>
        <p className="notice">선생님 선택 후 예약 페이지로 이동합니다.<br />선생님별 수업 가능 시간이 다를 수 있습니다.</p>
        <div className="tutor-list">
          {tutors.map((tutor) => (
            <Link href={tutor.link} key={tutor.id} className="tutor-button">
              <div className="tutor-info">
                <div className="image-wrapper">
                  <Image
                    src={tutor.image}
                    alt={tutor.name}
                    width={52}
                    height={52}
                    className="profile-img"
                  />
                </div>
                <div className="text-content">
                  <span className="tutor-name">{tutor.name}</span>
                  <span className="tutor-schedule">
                    <Clock size={12} strokeWidth={2} />
                    {tutor.schedule}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} strokeWidth={2} className="arrow" />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
