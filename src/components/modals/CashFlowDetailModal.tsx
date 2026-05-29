import React from 'react';
import { TransactionLog } from './HistoryPanel';

interface CashFlowDetailModalProps {
  flowType: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | null;
  onClose: () => void;
  allLogs: TransactionLog[];
}

export const CashFlowDetailModal: React.FC<CashFlowDetailModalProps> = ({ flowType, onClose, allLogs }) => {
  if (!flowType) return null;

  // Lọc các giao dịch sinh ra tiền dựa theo phương thức (TM hoặc CK)
  // Bỏ qua các giao dịch NHẬP (vì nó là chi, không phải thu - tùy logic kế toán của bạn)
  const filteredLogs = allLogs.filter(log => {
    const isMatchedMethod = log.paymentMethod === flowType || (log.paymentMethod === "TM" && flowType === "TIỀN MẶT") || (log.paymentMethod === "CK" && flowType === "CHUYỂN KHOẢN");
    const isRevenueGenerated = log.type === "BÁN" || log.type === "THU NỢ";
    return isMatchedMethod && isRevenueGenerated;
  });

  const totalAmount = filteredLogs.reduce((sum, log) => sum + (log.total || 0), 0);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }} onClick={onClose}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', width: '500px', maxWidth: '95%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <span>
            BẢNG KÊ CHI TIẾT: <span style={{ color: flowType === 'TIỀN MẶT' ? '#10b981' : '#3b82f6' }}>{flowType}</span>
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
        </h2>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Chưa có phát sinh giao dịch nào cho phương thức này.</div>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>[{log.type}] {log.name || "Đơn hàng"}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>⏰ {log.time || log.t} | Khách: {log.customer || "Khách lẻ"}</div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: flowType === 'TIỀN MẶT' ? '#10b981' : '#3b82f6' }}>
                  +{log.total.toLocaleString()}đ
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '2px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>TỔNG CỘNG:</span>
          <span style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>{totalAmount.toLocaleString()}đ</span>
        </div>

      </div>
    </div>
  );
};
