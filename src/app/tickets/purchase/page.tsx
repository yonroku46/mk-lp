'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Check, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

const BANK_ACCOUNT = '토스뱅크 1001-3926-0609';
const BANK_OWNER = 'MATOBA MIKU';

interface TicketProduct {
  id: string;
  name: string;
  price: number;
}

interface TicketGroup {
  groupName: string;
  products: TicketProduct[];
}

const TICKET_PRODUCT_GROUPS: TicketGroup[] = [
  {
    groupName: '개인레슨 55분 수업',
    products: [
      { id: 'private_55_4', name: '월 4회 (주1회)', price: 140000 },
      { id: 'private_55_8', name: '월 8회 (주2회)', price: 280000 },
      { id: 'private_55_12', name: '월 12회 (주3회)', price: 420000 },
    ],
  },
  {
    groupName: '개인레슨 85분 수업',
    products: [
      { id: 'private_85_4', name: '월 4회 (주1회)', price: 210000 },
      { id: 'private_85_8', name: '월 8회 (주2회)', price: 420000 },
      { id: 'private_85_12', name: '월 12회 (주3회)', price: 630000 },
    ],
  },
  {
    groupName: '그룹레슨 55분 수업',
    products: [
      { id: 'group_55_4', name: '월 4회 (주1회)', price: 88000 },
      { id: 'group_55_8', name: '월 8회 (주2회)', price: 176000 },
    ],
  },
];

export default function PurchasePage() {
  const router = useRouter();
  const [pRealName, setPRealName] = useState('');
  const [pNickname, setPNickname] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const selectedProduct = TICKET_PRODUCT_GROUPS.flatMap(g => g.products).find(p => p.id === selectedProductId);
  const selectedGroup = TICKET_PRODUCT_GROUPS.find(g => g.products.some(p => p.id === selectedProductId));
  const [pDepositor, setPDepositor] = useState('');
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    alert('현재기능은 점검중입니다.\n관련 기능은 관리자에게 문의해주세요.');
    router.back();
  }, [router]);

  // Auto-fill from localStorage on mount
  useEffect(() => {
    const savedRealName = localStorage.getItem('student-realname') || '';
    const savedNickname = localStorage.getItem('student-nickname') || '';
    const savedPhone = localStorage.getItem('student-phone') || '';

    if (savedRealName) setPRealName(savedRealName);
    if (savedNickname) setPNickname(savedNickname);
    if (savedPhone) setPPhone(savedPhone);
  }, []);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(BANK_ACCOUNT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pRealName.trim() || !pNickname.trim() || !pPhone.trim() || !selectedProductId || !pDepositor.trim()) return;

    setPurchaseLoading(true);
    setPurchaseError(null);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'purchase',
          realName: pRealName,
          nickname: pNickname,
          phoneNumber: pPhone,
          productName: selectedProduct ? `${selectedProduct.name} (${selectedProduct.price.toLocaleString()}원)` : '',
          productId: selectedProductId,
          price: selectedProduct?.price || 0,
          depositor: pDepositor,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPurchaseError(data.error || '구매 신청에 실패했습니다.');
        return;
      }
      
      // Save input details for better UX auto-fill
      localStorage.setItem('student-realname', pRealName.trim());
      localStorage.setItem('student-nickname', pNickname.trim());
      localStorage.setItem('student-phone', pPhone.trim());
      
      setPurchaseSuccess(true);
    } catch (err) {
      setPurchaseError('신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  return (
    <main>
      <div className="container">
        {/* Navigation Header like Schedule Page */}
        <div className="sch-header" style={{ width: '100%', marginBottom: '20px' }}>
          <div className="sch-title-wrapper">
            <Link 
              href="/tickets" 
              className="sch-back-button"
              aria-label="이전 페이지로 이동"
            >
              <ChevronLeft size={24} />
            </Link>
            <h1 className="sch-title">
              {purchaseSuccess ? '신청 완료' : '수강권 구입 신청'}
            </h1>
          </div>
          <p className="sch-notice">
            {purchaseSuccess ? '신청이 정상적으로 완료되었습니다.' : '구입 신청 폼 작성 후 계좌 이체를 진행해 주세요.'}
          </p>
        </div>

        <div className="sch-modal-content" style={{ animation: 'none' }}>
          {!purchaseSuccess ? (
            <form onSubmit={handlePurchaseSubmit}>
              {/* Account Details Box */}
              <div className="bank-account-box">
                <div className="bank-info">
                  <span className="bank-label">입금 계좌번호</span>
                  <span className="bank-number" style={{ fontSize: '0.85rem' }}>{BANK_ACCOUNT}</span>
                  <span className="bank-owner">예금주: {BANK_OWNER}</span>
                </div>
                <button 
                  type="button" 
                  className={`copy-account-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopyAccount}
                  style={{ padding: '6px 10px', fontSize: '0.7rem' }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? '복사 완료' : '계좌 복사'}
                </button>
              </div>

              <div className="sch-form-group">
                <label htmlFor="purchase-product">수강권 상품 선택</label>
                <select
                  id="purchase-product"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className={`sch-form-select ${selectedProductId === '' ? 'empty' : ''}`}
                  required
                >
                  <option value="" disabled>수강권 상품을 선택해 주세요</option>
                  {TICKET_PRODUCT_GROUPS.map((group) => (
                    <optgroup key={group.groupName} label={group.groupName}>
                      {group.products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="ticket-summary-box">
                  <div className="bank-info">
                    <div className="summary-row">
                      <span className="bank-label">선택 수강권</span>
                      <span className="summary-value">
                        {selectedGroup ? `${selectedGroup.groupName} - ` : ''}{selectedProduct.name}
                      </span>
                    </div>
                    <div className="summary-row price-row">
                      <span className="bank-label">결제 금액</span>
                      <span className="bank-number">
                        {selectedProduct.price.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="sch-form-group">
                <label htmlFor="purchase-name">이름 (실명)</label>
                <input
                  id="purchase-name"
                  type="text"
                  placeholder="예: 김철수"
                  value={pRealName}
                  onChange={(e) => setPRealName(e.target.value)}
                  required
                />
              </div>

              <div className="sch-form-group">
                <label htmlFor="purchase-nickname">닉네임</label>
                <input
                  id="purchase-nickname"
                  type="text"
                  placeholder="예: chulsoo123"
                  value={pNickname}
                  onChange={(e) => setPNickname(e.target.value)}
                  required
                />
              </div>

              <div className="sch-form-group">
                <label htmlFor="purchase-phone">연락처</label>
                <input
                  id="purchase-phone"
                  type="tel"
                  placeholder="예: 010-1234-5678"
                  value={pPhone}
                  onChange={(e) => setPPhone(e.target.value.replace(/[^0-9-]/g, ''))}
                  required
                />
              </div>

              <div className="sch-form-group">
                <label htmlFor="purchase-depositor">입금자명</label>
                <input
                  id="purchase-depositor"
                  type="text"
                  placeholder="실제 계좌 이체 시 입금한 이름"
                  value={pDepositor}
                  onChange={(e) => setPDepositor(e.target.value)}
                  required
                />
              </div>

              {purchaseError && <p className="sch-search-error">{purchaseError}</p>}

              <button
                type="submit"
                className="sch-btn-submit"
                disabled={purchaseLoading || !pRealName.trim() || !pNickname.trim() || !pPhone.trim() || !selectedProductId || !pDepositor.trim()}
              >
                {purchaseLoading ? '신청 처리 중...' : '횟수권 구입 신청하기'}
              </button>

              <Link href="/tickets" className="sch-btn-reset" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '8px' }}>
                이전으로
              </Link>
            </form>
          ) : (
            <div className="sch-success-view">
              <div className="success-icon-circle">
                <Check size={24} strokeWidth={3} className="success-icon" />
              </div>
              <h3 className="success-title">신청 완료</h3>
              <p className="success-desc">
                구입 신청이 성공적으로 전송되었습니다.<br />
                입금해 주신 내역을 확인하는 대로 수강권이 발급되며,<br />완료 시 카카오톡으로 안내를 드립니다.
              </p>
              <div className="bank-account-box" style={{ marginBottom: '20px' }}>
                <div className="bank-info">
                  <span className="bank-label">입금 계좌번호</span>
                  <span className="bank-number" style={{ fontSize: '0.85rem' }}>{BANK_ACCOUNT}</span>
                  <span className="bank-owner">예금주: {BANK_OWNER}</span>
                </div>
                <button 
                  type="button" 
                  className={`copy-account-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopyAccount}
                  style={{ padding: '6px 10px', fontSize: '0.7rem' }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? '복사 완료' : '계좌 복사'}
                </button>
              </div>
              <Link href="/tickets" className="sch-btn-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                메뉴로 돌아가기
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
