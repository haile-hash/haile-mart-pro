import React from "react";
import { HeldOrder } from "../../types";
import { cleanName, getActualPrice } from "../../utils/helpers";

interface HoldOrdersModalProps {
  showHoldModal: boolean;
  setShowHoldModal: (val: boolean) => void;
  heldOrders: HeldOrder[];
  restoreOrder: (order: HeldOrder) => void;
  deleteHeldOrder: (id: string | number) => void;
}

export const HoldOrdersModal: React.FC<HoldOrdersModalProps> = ({
  showHoldModal,
  setShowHoldModal,
  heldOrders,
  restoreOrder,
  deleteHeldOrder,
}) => {
  if (!showHoldModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>ĐƠN HÀNG LƯU TẠM ({heldOrders?.length || 0})</h3>
          <button className="close-btn" onClick={() => setShowHoldModal(false)}>×</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '15px' }}>
          {(!heldOrders || heldOrders.length === 0) ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
              Không có đơn hàng nào đang lưu tạm
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {heldOrders.map((order, idx) => {
                // Tính toán an toàn tổng tiền của đơn lưu tạm
                const orderTotal = order?.cart?.reduce((sum, item) => {
                  if (!item?.product) return sum;
                  const price = getActualPrice(item.product);
                  return sum + ((item.qty || 0) * price * 1.1); // Cộng VAT 10%
                }, 0) || 0;

                return (
                  <div key={order.id || idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', background: '#f8fafc', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px' }}>
                      <strong style={{ color: '#1e293b' }}>🕒 Lưu lúc: {order.time || "Không rõ"}</strong>
                      <strong style={{ color: '#10b981' }}>{Math.round(orderTotal).toLocaleString('vi-VN')}đ</strong>
                    </div>
                    
                    <ul style={{ margin: '0 0 15px 0', paddingLeft: '20px', color: '#475569', fontSize: '14px' }}>
                      {order?.cart?.map((item, i) => (
                        <li key={i} style={{ marginBottom: '5px' }}>
                          {item?.product?.name ? cleanName(item.product.name) : "Sản phẩm lỗi"} 
                          <b style={{ color: '#0f172a', marginLeft: '5px' }}>x{item?.qty || 0}</b>
                        </li>
                      ))}
                    </ul>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => deleteHeldOrder(order.id)}
                        style={{ padding: '8px 15px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        🗑️ XÓA BỎ
                      </button>
                      <button 
                        onClick={() => restoreOrder(order)}
                        style={{ padding: '8px 15px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        🛒 TIẾP TỤC BÁN
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
