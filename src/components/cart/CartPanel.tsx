import React from 'react';
import { CartItem } from '../../types';
import { cleanName } from '../../utils/helpers';

export const CartPanel: React.FC<any> = ({
  cart, setCart, handleQtyChange, cartTotalAmountDisplay, setIsCheckoutOpen, handleHoldOrder, setCheckoutStep, setShowHoldModal
}) => {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
      
      {/* HEADER GIỎ HÀNG THIẾT KẾ MỚI: TẤT CẢ TRÊN 1 DÒNG */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
        <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontSize: '15px' }}>
          🛒 GIỎ HÀNG <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{cart.length}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={handleHoldOrder} disabled={cart.length === 0} style={{ padding: '8px 12px', background: cart.length === 0 ? '#cbd5e1' : '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }} title="Lưu tạm giỏ hàng (F4)">
            ⏸️ Lưu Tạm
          </button>
          <button onClick={() => { if(window.confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) setCart([]); }} disabled={cart.length === 0} style={{ padding: '8px 12px', background: cart.length === 0 ? '#cbd5e1' : '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }} title="Hủy toàn bộ">
            🗑️ Hủy
          </button>
          <button onClick={() => setShowHoldModal(true)} style={{ padding: '8px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }} title="Mở các đơn đang lưu">
            🕒 Mở Đơn
          </button>
        </div>
      </div>

      {/* DANH SÁCH SẢN PHẨM */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px', fontSize: '14px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
            Giỏ hàng đang trống.<br/>Hãy quét mã vạch hoặc bấm Thêm!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cart.map((item: CartItem, idx: number) => {
              const price = item.product.promo_price || item.product.sale_price || 0;
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#f8fafc' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '13px', marginBottom: '4px' }}>{cleanName(item.product.name)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '13px' }}>{price.toLocaleString()}đ</span>
                      <span style={{ color: '#94a3b8', fontSize: '12px', textDecoration: 'line-through' }}>{item.product.promo_price ? (item.product.sale_price || 0).toLocaleString() + 'đ' : ''}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="number" min="1" max={item.product.stock} value={item.qty} onChange={(e) => handleQtyChange(item.product.id, e.target.value)} style={{ width: '50px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', outline: 'none' }} />
                    <div style={{ fontWeight: '900', color: '#dc2626', width: '80px', textAlign: 'right' }}>{(item.total || 0).toLocaleString()}đ</div>
                    <button onClick={() => handleQtyChange(item.product.id, '0')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER THANH TOÁN */}
      <div style={{ padding: '20px', borderTop: '2px dashed #e2e8f0', background: '#f8fafc', borderRadius: '0 0 12px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>TỔNG CỘNG:</span>
          <span style={{ fontSize: '28px', fontWeight: '900', color: '#dc2626' }}>{cartTotalAmountDisplay.toLocaleString()}đ</span>
        </div>
        <button onClick={() => { setIsCheckoutOpen(true); setCheckoutStep(1); }} disabled={cart.length === 0} style={{ width: '100%', padding: '16px', background: cart.length === 0 ? '#cbd5e1' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '900', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', transition: '0.2s' }}>
          💵 THANH TOÁN (F2)
        </button>
      </div>
    </div>
  );
};
