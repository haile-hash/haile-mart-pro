import React from 'react';
import { CartItem } from '../../types';
import { cleanName, getActualPrice } from '../../utils/helpers';
import { toast } from 'react-hot-toast';

interface CartPanelProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  handleQtyChange: (id: string | number, qty: number | string) => void;
  cartTotalAmountDisplay: number;
  setIsCheckoutOpen: (isOpen: boolean) => void;
  handleHoldOrder: () => void; 
  setCheckoutStep: (step: number) => void;
  setShowHoldModal: (show: boolean) => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({ 
  cart, setCart, handleQtyChange, cartTotalAmountDisplay, 
  setIsCheckoutOpen, handleHoldOrder, setCheckoutStep, setShowHoldModal 
}) => {
  
  // 1. Hàm Hủy giỏ
  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm("Bạn có chắc muốn hủy giỏ hàng hiện tại?")) {
      setCart([]);
      toast.success("Đã hủy giỏ hàng");
    }
  };

  // 2. Hàm Lưu Tạm
  const onHoldClick = () => {
    if (cart.length === 0) return;
    const note = window.prompt("Nhập tên khách hàng hoặc ghi chú (Bàn 1, Khách áo đen...):", "Khách chờ");
    if (note !== null) {
      handleHoldOrder(); 
    }
  };

  // 3. Hàm Thanh toán
  const onCheckoutClick = () => {
    if (cart.length === 0) {
      toast.error("Giỏ hàng đang trống!");
      return;
    }
    setCheckoutStep(1); 
    setIsCheckoutOpen(true);
  };

  // 4. Hàm Mở danh sách đơn lưu
  const onOpenHoldModal = () => {
    setShowHoldModal(true);
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
      
      {/* HEADER & NÚT MỞ ĐƠN LƯU */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '15px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🛒 GIỎ HÀNG 
          <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
            {cart.length}
          </span>
        </h2>
        <button 
          onClick={onOpenHoldModal} 
          style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', boxShadow: '0 2px 4px rgba(59,130,246,0.3)' }}
        >
          🕒 MỞ ĐƠN LƯU
        </button>
      </div>

      {/* KHU VỰC TỔNG TIỀN VÀ CÁC NÚT THAO TÁC */}
      <div style={{ padding: '16px', borderBottom: '2px dashed #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>TỔNG CỘNG:</span>
          <span style={{ fontSize: '28px', fontWeight: '900', color: '#dc2626' }}>
            {cartTotalAmountDisplay.toLocaleString()}đ
          </span>
        </div>
        
        {/* Nút Thanh toán */}
        <button 
          onClick={onCheckoutClick}
          disabled={cart.length === 0}
          style={{ width: '100%', padding: '14px', background: cart.length === 0 ? '#cbd5e1' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', boxShadow: cart.length === 0 ? 'none' : '0 4px 12px rgba(16,185,129,0.3)', transition: 'all 0.2s', marginBottom: '12px' }}
        >
          💵 THANH TOÁN (F2)
        </button>

        {/* Cụm nút Lưu Tạm & Hủy Giỏ */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={onHoldClick} 
            disabled={cart.length === 0} 
            style={{ flex: 1, padding: '10px', background: cart.length === 0 ? '#f1f5f9' : '#fef08a', color: cart.length === 0 ? '#94a3b8' : '#854d0e', border: `1px solid ${cart.length === 0 ? '#e2e8f0' : '#fde047'}`, borderRadius: '6px', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            ⏸️ Lưu Tạm (F4)
          </button>
          
          <button 
            onClick={handleClearCart} 
            disabled={cart.length === 0} 
            style={{ flex: 1, padding: '10px', background: cart.length === 0 ? '#f1f5f9' : '#fee2e2', color: cart.length === 0 ? '#94a3b8' : '#dc2626', border: `1px solid ${cart.length === 0 ? '#e2e8f0' : '#fecaca'}`, borderRadius: '6px', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            🗑️ Hủy Giỏ
          </button>
        </div>
      </div>

      {/* DANH SÁCH MÓN HÀNG TRONG GIỎ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', minHeight: '250px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
            <p>Giỏ hàng đang trống.</p>
            <p>Hãy quét mã vạch hoặc bấm Thêm!</p>
          </div>
        ) : (
          cart.map((item: CartItem, index: number) => (
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
    </div>
  );
};
