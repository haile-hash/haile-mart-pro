import React from 'react';
import { CartItem, HeldOrder } from '../../types';

export const CartPanel = ({
  cart = [], 
  heldOrders = [], 
  cartTotalAmountDisplay = 0,
  setShowHoldModal,
  handleHoldOrder,
  clearCart,
  setIsCheckoutOpen,
  setCheckoutStep,
  adjustCartQty,
  handleDirectQtyChange,
  handleDirectQtyBlur,
  removeFromCart
}: any) => {
  
  // Mở popup thanh toán
  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setCheckoutStep(1);
    setIsCheckoutOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', height: '100%', overflow: 'hidden' }}>
      
      {/* 1. HEADER GIỎ HÀNG */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <h3 style={{ margin: 0, color: '#dc2626', fontSize: '16px', fontWeight: 'bold' }}>
          🛒 GIỎ HÀNG ({cart.length})
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setShowHoldModal(true)} 
            style={{ padding: '6px 12px', border: '1px solid #fbbf24', background: '#fef3c7', color: '#d97706', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
          >
            📁 TẠM LƯU ({heldOrders.length})
          </button>
          <button 
            onClick={handleHoldOrder} 
            disabled={cart.length === 0} 
            style={{ padding: '6px 12px', border: '1px solid #60a5fa', background: '#eff6ff', color: '#2563eb', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', opacity: cart.length === 0 ? 0.5 : 1 }}
          >
            ⏸ LƯU (F4)
          </button>
          <button 
            onClick={clearCart} 
            disabled={cart.length === 0} 
            style={{ padding: '6px 12px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', opacity: cart.length === 0 ? 0.5 : 1 }}
          >
            🗑 HỦY
          </button>
        </div>
      </div>

      {/* 2. KHU VỰC CHỐT ĐƠN ĐƯA LÊN TRÊN CÙNG (CỐ ĐỊNH) */}
      <div style={{ padding: '16px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#475569' }}>TỔNG CỘNG:</span>
          <span style={{ fontSize: '28px', fontWeight: '900', color: '#ef4444' }}>
            {(cartTotalAmountDisplay || 0).toLocaleString('vi-VN')}đ
          </span>
        </div>
        <button 
          onClick={handleCheckoutClick}
          disabled={cart.length === 0}
          style={{
            width: '100%',
            padding: '16px',
            background: cart.length === 0 ? '#94a3b8' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: cart.length === 0 ? 'none' : '0 10px 15px -3px rgba(34, 197, 94, 0.4)',
            transition: 'transform 0.1s, box-shadow 0.2s',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
          onMouseDown={(e) => { if(cart.length > 0) e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={(e) => { if(cart.length > 0) e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { if(cart.length > 0) e.currentTarget.style.transform = 'scale(1)'; }}
        >
          💵 THANH TOÁN (F2)
        </button>
      </div>

      {/* 3. DANH SÁCH MÓN HÀNG NẰM Ở DƯỚI VÀ CÓ THANH CUỘN ĐỘC LẬP */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#ffffff', minHeight: '300px' }}>
        {cart.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontSize: '15px', fontStyle: 'italic' }}>
            Giỏ hàng đang trống. Hãy quét mã vạch!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cart.map((item: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0' }}>
                <div style={{ flex: 1, paddingRight: '10px' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>
                    {item?.product?.name || 'Sản phẩm không rõ'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  
                  {/* Nút tăng giảm số lượng */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button 
                      onClick={() => item?.product?.id && adjustCartQty(item.product.id, -1)} 
                      style={{ width: '28px', height: '28px', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#f97316' }}
                    >-</button>
                    <input 
                      type="text" 
                      value={item?.qty || ''} 
                      onChange={(e) => item?.product?.id && handleDirectQtyChange(item.product.id, e.target.value)}
                      onBlur={(e) => item?.product?.id && handleDirectQtyBlur(item.product.id, e.target.value)}
                      style={{ width: '40px', height: '28px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', fontWeight: 'bold', color: '#0f172a' }} 
                    />
                    <button 
                      onClick={() => item?.product?.id && adjustCartQty(item.product.id, 1)} 
                      style={{ width: '28px', height: '28px', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#f97316' }}
                    >+</button>
                    <button 
                      onClick={() => item?.product?.id && removeFromCart(item.product.id)} 
                      style={{ width: '28px', height: '28px', border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginLeft: '4px' }}
                    >✕</button>
                  </div>
                  
                  {/* Giá tiền */}
                  <div style={{ fontWeight: '900', color: '#dc2626', fontSize: '16px' }}>
                    {(item?.total || 0).toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
