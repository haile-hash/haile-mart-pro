import React from 'react';
import { HeldOrder } from '../../types';

interface HoldOrdersModalProps {
  showHoldModal: boolean;
  setShowHoldModal: (show: boolean) => void;
  heldOrders: HeldOrder[];
  restoreOrder: (order: HeldOrder) => void;
  deleteHeldOrder: (id: number) => void;
}

export const HoldOrdersModal: React.FC<HoldOrdersModalProps> = ({
  showHoldModal,
  setShowHoldModal,
  heldOrders,
  restoreOrder,
  deleteHeldOrder
}) => {
  if (!showHoldModal) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999999 
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        width: '650px',
        maxWidth: '95%',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* HEADER MODAL */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>
            📦 DANH SÁCH ĐƠN TẠM LƯU ({heldOrders?.length || 0})
          </h2>
          <button 
            onClick={() => setShowHoldModal(false)}
            style={{
              background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#64748b', lineHeight: 1
            }}
            title="Đóng"
          >
            &times;
          </button>
        </div>

        {/* BODY MODAL */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#f1f5f9' }}>
          {!heldOrders || heldOrders.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '50px 0' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📭</span>
              Không có đơn hàng nào đang tạm lưu.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {heldOrders.map((order: any) => {
                const orderTotal = order.cart?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
                
                return (
                  <div key={order.id} style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    {/* Thông tin giờ, Tên Khách & Tiền */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: '900', color: '#1e293b', fontSize: '15px' }}>
                          👤 {order.note || 'Không tên'}
                        </span>
                        <span style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}>
                          🕒 Lưu lúc: {order.time || 'Không rõ'}
                        </span>
                      </div>
                      <span style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '18px' }}>
                        {orderTotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    
                    {/* Chi tiết món */}
                    <div style={{ fontSize: '15px', color: '#475569', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                      <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {order.cart?.map((item: any, idx: number) => (
                          <li key={idx}>
                            {item.product?.name || 'Sản phẩm không xác định'} <span style={{ fontWeight: 'bold', color: '#0f172a' }}>x{item.qty || 0}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Nút thao tác */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button 
                        onClick={() => {
                          if(window.confirm('Bạn có chắc chắn muốn xóa bỏ đơn tạm này không?')) {
                            deleteHeldOrder(order.id);
                          }
                        }}
                        style={{
                          padding: '10px 16px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        🗑 XÓA BỎ
                      </button>
                      
                      <button 
                        onClick={() => restoreOrder(order)}
                        style={{
                          padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)', transition: 'all 0.2s'
                        }}
                      >
                        🛒 GỌI RA GIỎ ĐỂ THANH TOÁN
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
