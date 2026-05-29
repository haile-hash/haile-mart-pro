/* eslint-disable */
// @ts-nocheck
import React from 'react';
import { cleanName, getActualPrice } from '../../utils/helpers';
import { toast } from 'react-hot-toast';

export const CartPanel = ({ cart, setCart, handleQtyChange, cartTotalAmountDisplay, setIsCheckoutOpen, handleHoldOrder }: any) => {
  
  // Hàm xử lý nút Hủy giỏ hàng
  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm("Bạn có chắc muốn hủy giỏ hàng hiện tại?")) {
      setCart([]);
      toast.success("Đã hủy giỏ hàng");
    }
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
      
      {/* HEADER GIỎ HÀNG */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🛒 GIỎ HÀNG <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{cart.length}</span>
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Nút Lưu F4 (Gọi hàm handleHoldOrder) */}
          <button onClick={handleHoldOrder} style={{ padding: '6px 12px', background: '#fef08a', color: '#854d0e', border: '1px solid #fde047', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }} title="Lưu đơn chờ thanh toán sau (F4)">
            ⏸️ Lưu (F4)
          </button>
          {/* Nút Hủy (Gọi hàm handleClearCart) */}
          <button onClick={handleClearCart} style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            🗑️ Hủy
          </button>
        </div>
      </div>

      {/* DANH SÁCH MÓN HÀNG */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', minHeight: '250px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
            <p>Giỏ hàng đang trống.</p>
            <p>Hãy quét mã vạch hoặc bấm Thêm!</p>
          </div>
        ) : (
          cart.map((item: any, index: number) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>{cleanName(item.product.name)}</div>
                <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>{getActualPrice(item.product).toLocaleString()}đ</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => handleQtyChange(item.product.id, item.qty - 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>-</button>
                <input type="number" value={item.qty} onChange={(e) => handleQtyChange(item.product.id, e.target.value)} style={{ width: '40px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px', outline: 'none' }} />
                <button onClick={() => handleQtyChange(item.product.id, item.qty + 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>+</button>
                <button onClick={() => handleQtyChange(item.product.id, 0)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', marginLeft: '4px' }}>×</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FOOTER THANH TOÁN */}
      <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>TỔNG CỘNG:</span>
          <span style={{ fontSize: '24px', fontWeight: '900', color: '#dc2626' }}>{cartTotalAmountDisplay.toLocaleString()}đ</span>
        </div>
        <button 
          onClick={() => setIsCheckoutOpen(true)}
          disabled={cart.length === 0}
          style={{ width: '100%', padding: '16px', background: cart.length === 0 ? '#cbd5e1' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', boxShadow: cart.length === 0 ? 'none' : '0 4px 12px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}
        >
          💵 THANH TOÁN (F2)
        </button>
      </div>
    </div>
  );
};
