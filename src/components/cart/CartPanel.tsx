import React from 'react';
import { CartItem } from '../../types';
import { cleanName } from '../../utils/helpers';

export const CartPanel: React.FC<any> = ({
  cart, setCart, handleQtyChange, cartTotalAmountDisplay, setIsCheckoutOpen, handleHoldOrder, setCheckoutStep, setShowHoldModal
}) => {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
      
      {/* KHU VỰC TRÊN CÙNG: THANH TOÁN VÀ TỔNG TIỀN */}
      <div style={{ padding: '16px', borderBottom: '2px dashed #e2e8f0', background: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
        
        {/* Hàng 1: Tiêu đề và Nút phụ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px', color: '#1e293b', fontSize: '15px' }}>
            🛒 GIỎ HÀNG <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '12px', lineHeight: '1' }}>{cart.length}</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleHoldOrder} disabled={cart.length === 0} style={{ padding: '6px 10px', background: cart.length === 0 ? '#cbd5e1' : '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>⏸️ Lưu</button>
            <button onClick={() => { if(window.confirm('Xóa toàn bộ giỏ hàng?')) setCart([]); }} disabled={cart.length === 0} style={{ padding: '6px 10px', background: cart.length === 0 ? '#cbd5e1' : '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>🗑️ Hủy</button>
            <button onClick={() => setShowHoldModal(true)} style={{ padding: '6px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>🕒 Mở Đơn</button>
          </div>
        </div>

        {/* Hàng 2: Nút Thanh Toán To Nhất */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>TỔNG CỘNG:</span>
          <span style={{ fontSize: '26px', fontWeight: '900', color: '#dc2626' }}>{cartTotalAmountDisplay.toLocaleString()}đ</span>
        </div>

        <button onClick={() => { setIsCheckoutOpen(true); setCheckoutStep(1); }} disabled={cart.length === 0} style={{ width: '100%', padding: '14px', background: cart.length === 0 ? '#cbd5e1' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '900', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', transition: '0.2s', boxShadow: cart.length > 0 ? '0 4px 10px -2px rgba(16,185,129,0.4)' : 'none' }}>
          💵 THANH TOÁN (F2)
        </button>
      </div>

      {/* KHU VỰC DƯỚI: DANH SÁCH MÓN HÀNG */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px', fontSize: '13px' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px', opacity: 0.5 }}>📦</div>
            Giỏ hàng trống.<br/>Quét mã vạch hoặc bấm Thêm!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cart.map((item: CartItem, idx: number) => {
              const price = item.product.promo_price || item.product.sale_price || 0;
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '13px', marginBottom: '4px', lineHeight: '1.2' }}>{cleanName(item.product.name)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>{price.toLocaleString()}đ</span>
                      <span style={{ color: '#94a3b8', fontSize: '11px', textDecoration: 'line-through' }}>{item.product.promo_price ? (item.product.sale_price || 0).toLocaleString() + 'đ' : ''}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="number" min="1" max={item.product.stock} value={item.qty} onChange={(e) => handleQtyChange(item.product.id, e.target.value)} style={{ width: '45px', padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 'bold', outline: 'none', fontSize: '13px' }} />
                    <div style={{ fontWeight: '900', color: '#dc2626', width: '70px', textAlign: 'right', fontSize: '13px' }}>{(item.total || 0).toLocaleString()}đ</div>
                    <button onClick={() => handleQtyChange(item.product.id, '0')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
