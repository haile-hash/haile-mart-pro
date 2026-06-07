import React from "react";
import { TransactionLog } from "../../types";

interface Props {
  flowType: "cash" | "transfer";
  onClose: () => void;
  allLogs: TransactionLog[];
}

export const CashFlowDetailModal: React.FC<Props> = ({ flowType, onClose, allLogs }) => {
  const isCash = flowType === "cash";
  const titleColor = isCash ? "#10b981" : "#3b82f6"; // Xanh lá cho Tiền mặt, Xanh dương cho Chuyển khoản
  const titleText = isCash ? "TIỀN MẶT" : "CHUYỂN KHOẢN";
  
  // Lấy ngày hôm nay và ca hiện tại
  const todayStr = new Date().toLocaleDateString('vi-VN');
  const currentShift = window.localStorage.getItem('mart_shift') || "Ca Sáng";

  // LỌC GIAO DỊCH CHUẨN XÁC
  const filteredLogs = allLogs.filter((log) => {
    // 1. Tách chuỗi thời gian để lấy đúng phần Ngày (Tránh lỗi Invalid Date của JS)
    let logDate = "";
    if (log.time) {
      const parts = log.time.split(' ');
      const datePart = parts.find(p => p.includes('/'));
      if (datePart) logDate = datePart.replace(',', '').trim();
    }

    const isToday = logDate === todayStr;
    const isCurrentShift = log.shift === currentShift;

    // 2. Lọc đúng phương thức thanh toán
    const isRightMethod = isCash
      ? (log.paymentMethod === 'TIỀN MẶT' || log.paymentMethod === 'KẾT HỢP')
      : (log.paymentMethod === 'CHUYỂN KHOẢN' || log.paymentMethod === 'QUẸT THẺ' || log.paymentMethod === 'ZALO PAY' || log.paymentMethod === 'KẾT HỢP');

    // 3. Chỉ lấy các loại giao dịch ảnh hưởng tới dòng tiền
    const isValidAction = ['BÁN', 'GHI NỢ', 'TRẢ HÀNG', 'THU NỢ'].includes(log.type);

    return isToday && isCurrentShift && isRightMethod && isValidAction;
  });

  // TÍNH TỔNG TIỀN TRONG BẢNG KÊ
  const total = filteredLogs.reduce((sum, log) => {
    let amt = log.total || 0;
    if (log.paymentMethod === 'KẾT HỢP') {
      amt = isCash ? (log.split_cash || 0) : (amt - (log.split_cash || 0));
    }
    return sum + amt;
  }, 0);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(2px)' }}>
      <div style={{ background: 'white', width: '550px', maxWidth: '90%', borderRadius: '16px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: 800 }}>
            BẢNG KÊ CHI TIẾT: <span style={{ color: titleColor }}>{titleText}</span>
          </h3>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }}>
            &times;
          </button>
        </div>

        {/* Danh sách giao dịch */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
              <p style={{ color: '#64748b', margin: 0 }}>Chưa có phát sinh giao dịch nào cho phương thức này.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Thời gian</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Mã / Loại</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  let amt = log.total || 0;
                  if (log.paymentMethod === 'KẾT HỢP') {
                    amt = isCash ? (log.split_cash || 0) : (amt - (log.split_cash || 0));
                  }
                  
                  // Nếu là trả hàng, dòng tiền sẽ bị trừ
                  const isNegative = log.type === 'TRẢ HÀNG' || amt < 0;
                  
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '14px', transition: 'background 0.2s' }} className="hover:bg-slate-50">
                      <td style={{ padding: '12px 8px', color: '#475569' }}>
                        {log.time ? log.time.split(' ')[0] : ''}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{log.order_id || 'N/A'}</span>
                          <span style={{ 
                            background: log.type === 'BÁN' ? '#dcfce7' : log.type === 'TRẢ HÀNG' ? '#fee2e2' : log.type === 'THU NỢ' ? '#dbeafe' : '#f1f5f9', 
                            color: log.type === 'BÁN' ? '#166534' : log.type === 'TRẢ HÀNG' ? '#991b1b' : log.type === 'THU NỢ' ? '#1e40af' : '#334155', 
                            padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block', width: 'fit-content' 
                          }}>
                            {log.type}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: isNegative ? '#ef4444' : '#1e293b' }}>
                        {isNegative ? '-' : '+'}{Math.abs(amt).toLocaleString()}đ
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Tổng kết */}
        <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, color: '#475569', fontSize: '15px' }}>TỔNG PHÁT SINH:</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: titleColor }}>{total.toLocaleString()}đ</span>
        </div>
        
      </div>
    </div>
  );
};
