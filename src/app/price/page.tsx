import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '요금표',
  description: '수강 레슨 요금표 안내',
};

export default function PricePage() {
  return (
    <div className="price-pdf-container">
      <iframe
        src="/docs/price.pdf"
        title="레슨 요금표"
      />
    </div>
  );
}
