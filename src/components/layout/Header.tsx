/* eslint-disable */
// @ts-nocheck
import React from "react";

interface HeaderProps {
  role: string;
  shift: string;
  totalValue: number;
  currentShiftStats: {
    total: number;
    profit: number;
    orders: number;
    cash: number;
    transfer: number;
  };
  setCashFlowModalInfo: (info: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | null) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  handleLogoutClick: () => void;
  showMainMenu: boolean;
  setShowMainMenu: (val: boolean) => void;
  setShowStatsModal: (val: boolean) => void;
  setShowCustomerModal: (val: boolean) => void;
  setShowInventoryModal: (val: boolean) => void;
  setShowDebtModal: (val: boolean) => void;
  setShowAuditModal: (val: boolean) => void;
  setShowExpenseModal: (val: boolean) => void;
  setShowSupplierModal: (val: boolean) => void;
  setShowMarketingModal: (val: boolean) => void;
  bankBin: string;
  bankAcc: string;
  bankNameStr: string;
  setShowSettings: (val: boolean) => void;
  lowStockCount: number;
  isOnline: boolean;
  syncStatus: string;
  syncAllOfflineData: () => void;
  setShowScannerLinkModal: (val: boolean) => void;
  setShowPOModal: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  role, shift, totalValue, currentShiftStats, setCashFlowModalInfo,
  darkMode, setDarkMode, handleLogoutClick, showMainMenu, setShowMainMenu,
  setShowStatsModal, setShowCustomerModal, setShowInventoryModal, setShowDebtModal,
  setShowAuditModal, setShowExpenseModal, setShowSupplierModal, setShowMarketingModal,
  bankBin, bankAcc, bankNameStr, setShowSettings, lowStockCount,
  isOnline, syncStatus, syncAllOfflineData, setShowScannerLinkModal, setShowPOModal
}) => {

  // Hàm bổ trợ lấy tên cửa hàng động từ bộ nhớ local
  const getStoreName = () => {
    try {
      const savedStore = window.localStorage.getItem("mart_current_store");
      if (savedStore) {
        const storeObj = JSON.parse(savedStore);
        if (storeObj && storeObj.store_name) {
          return storeObj.store_name.toUpperCase();
        }
      }
    } catch (e) {
      console.error(e);
    }
    return "HỆ THỐNG POS PRO";
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px" }} className="no-print">
      
      {/* NHÚNG STYLE HIỆU ỨNG SÓNG NHẠC VÀ NEON RUNTIME CHỐNG PHÈN */}
      <style>{`
        @keyframes meshWave {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes neonWave {
          0%, 100% { border-color: #3b82f6; box-shadow: 0 0 14px rgba(59,130,246,0.6), inset 0 0 6px rgba(59,130,246,0.2); }
          33% { border-color: #ec4899; box-shadow: 0 0 14px rgba(236,72,153,0.6), inset 0 0 6px rgba(236,72,153,0.2); }
          66% { border-color: #10b981; box-shadow: 0 0 14px rgba(16,185,129,0.6), inset 0 0 6px rgba(16,185,129,0.2); }
        }
        /* Ép toàn bộ cơ thể web húp trọn nền sóng nhạc */
        body {
          background: linear-gradient(-45deg, #0b0b16, #121225, #07070f, #111827) !important;
          background-size: 400% 400% !important;
          animation: meshWave 12s ease infinite !important;
          color: #f8fafc !important;
        }
        .saas-logo-wave {
          animation: neonWave 5s linear infinite !important;
        }
        /* Ép các thẻ card phụ bọc kính mờ Glassmorphism */
        .stat-card {
          background: rgba(255, 255, 255, 0.03) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.07) !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2) !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.06) !important;
        }
      `}</style>

      {/* BRANDING ĐỘNG CHUYỂN MÀU LƯỢN SÓNG NEON */}
      <div className="saas-logo-wave" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 18px', background: 'rgba(10, 10, 20, 0.7)', borderRadius: '14px', border: '2px solid #3b82f6', minWidth: '290px', backdropFilter: 'blur(10px)' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'white', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}>
          🏪
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.8px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '210px', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
            {getStoreName()}
          </span>
          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#3b82f6', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            CYBER POS PLATFORM
          </span>
        </div>
      </div>

      {/* KHỐI HIỂN THỊ DOANH THU KÍNH MỜ (GLASSMORPHISM) */}
      <div style={{ display: "flex", gap: "10px", flex: 1, justifyContent: "center" }}>
        {role === "admin" && (
          <div className="stat-card" style={{ padding: "6px 14px", textAlign: "center", minWidth: "110px", borderRadius: "12px" }}>
            <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", fontWeight: "bold", letterSpacing: '0.3px' }}>VỐN HÀNG HOÁ</span>
            <strong style={{ fontSize: "15px", color: "#e2e8f0" }}>{Math.round(totalValue).toLocaleString()}đ</strong>
          </div>
        )}
        <div className="stat-card pointer-click" onClick={() => setCashFlowModalInfo('TIỀN MẶT')} style={{ padding: "6px 14px", textAlign: "center", minWidth: "110px", borderRadius: "12px", borderBottom: "2px solid #10b981" }}>
          <span style={{ fontSize: "11px", color: "#10b981", display: "block", fontWeight: "bold" }}>TIỀN MẶT 👆</span>
          <strong style={{ fontSize: "15px", color: "#10b981" }}>{Math.round(currentShiftStats.cash).toLocaleString()}đ</strong>
        </div>
        <div className="stat-card pointer-click" onClick={() => setCashFlowModalInfo('CHUYỂN KHOẢN')} style={{ padding: "6px 14px", textAlign: "center", minWidth: "110px", borderRadius: "12px", borderBottom: "2px solid #3b82f6" }}>
          <span style={{ fontSize: "11px", color: "#3b82f6", display: "block", fontWeight: "bold" }}>CHUYỂN KHOẢN 👆</span>
          <strong style={{ fontSize: "15px", color: "#3b82f6" }}>{Math.round(currentShiftStats.transfer).toLocaleString()}đ</strong>
        </div>
        {role === "admin" && (
          <div className="stat-card" style={{ padding: "6px 14px", textAlign: "center", minWidth: "110px", borderRadius: "12px", borderBottom: "2px solid #f97316" }}>
            <span style={{ fontSize: "11px", color: "#f97316", display: "block", fontWeight: "bold" }}>LÃI TẠM TÍNH</span>
            <strong style={{ fontSize: "15px", color: "#f97316" }}>{Math.round(currentShiftStats.profit).toLocaleString()}đ</strong>
          </div>
        )}
      </div>

      {/* KHỐI ĐIỀU KHIỂN CHỨC NĂNG & THÀNH VIÊN */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        
        {/* Đèn báo trạng thái kết nối mạng Multi-tenant */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: isOnline ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: isOnline ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#10b981' : '#ef4444', display: 'inline-block', boxShadow: isOnline ? '0 0 10px #10b981' : '0 0 10px #ef4444' }}></span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: isOnline ? '#10b981' : '#ef4444' }}>
            {isOnline ? (syncStatus === 'syncing' ? 'Đang sync...' : 'Cloud Connected') : 'Offline Local'}
          </span>
        </div>

        {/* Nút bật tắt Darkmode */}
        <button onClick={() => setDarkMode(!darkMode)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: '8px 12px', borderRadius: '10px', fontSize: '15px' }} title="Thay đổi giao diện">
          {darkMode ? "☀️" : "🌙"}
        </button>

        {/* Khối tài khoản nhân sự */}
        <div style={{ position: "relative" }}>
          <button onClick={(e) => { e.stopPropagation(); setShowMainMenu(!showMainMenu); }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: "6px 14px", display: "flex", alignItems: "center", gap: "8px", borderRadius: '10px' }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px" }}>
              {role === "admin" ? "👑" : "🧑"}
            </div>
            <div style={{ textAlign: "left" }}>
              <span style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#fff" }}>{role === "admin" ? "Quản lý" : "Thu ngân"}</span>
              <span style={{ display: "block", fontSize: "10px", color: "#94a3b8" }}>{shift}</span>
            </div>
            <span style={{ fontSize: "10px", color: '#94a3b8', marginLeft: "2px" }}>▼</span>
          </button>

          {/* MENU ĐIỀU HƯỚNG TỔNG CỦA HỆ THỐNG */}
          {showMainMenu && (
            <div className="glass dropdown-menu active" style={{ position: "absolute", right: 0, top: "100%", marginTop: "8px", width: "240px", zIndex: 99999, padding: "6px", borderRadius: "12px", background: '#101021', border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.4)" }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "4px" }}>Hệ thống lõi SaaS</div>
              <button className="menu-item-btn text-left" onClick={() => { setShowMainMenu(false); setShowStatsModal(true); }}>📊 Báo cáo doanh thu</button>
              <button className="menu-item-btn text-left" onClick={() => { setShowMainMenu(false); setShowPOModal(true); }}>📦 Nhập kho NCC (PO)</button>
              <button className="menu-item-btn text-left" onClick={() => { setShowMainMenu(false); setShowInventoryModal(true); }}>🔍 Kiểm kho định kỳ</button>
              <button className="menu-item-btn text-left" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => { setShowMainMenu(false); setShowInventoryModal(true); }}>
                ⚠️ Hàng sắp hết <span>{lowStockCount > 0 && <span className="badge-count-alert">{lowStockCount}</span>}</span>
              </button>
              <button className="menu-item-btn text-left" onClick={() => { setShowMainMenu(false); setShowDebtModal(true); }}>💸 Quản lý Sổ nợ Khách</button>
              <button className="menu-item-btn text-left" onClick={() => { setShowMainMenu(false); setShowExpenseModal(true); }}>📉 Lập Phiếu Chi ca</button>
              <button className="menu-item-btn text-left" onClick={() => { setShowMainMenu(false); setShowCustomerModal(true); }}>💳 Danh sách Thành viên (VIP)</button>
              <button className="menu-item-btn text-left" onClick={() => { setShowMainMenu(false); setShowSupplierModal(true); }}>🏢 Danh mục Nhà cung cấp</button>
              <button className="menu-item-btn text-left" onClick={() => { setShowMainMenu(false); setShowMarketingModal(true); }}>💌 Chiến dịch Email Marketing</button>
              <button className="menu-item-btn text-left" onClick={() => { setShowMainMenu(false); setShowScannerLinkModal(true); }}>🔗 Kết nối Máy quét Mobile</button>
              {role === "admin" && (
                <>
                  <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: "4px", marginBottom: "4px" }}>Cấu hình doanh nghiệp</div>
                  <button className="menu-item-btn text-left" onClick={() => { setShowMainMenu(false); setShowSettings(true); }}>⚙️ Thiết lập QR & Giờ Vàng</button>
                  <button className="menu-item-btn text-left" onClick={() => { setShowMainMenu(false); setShowAuditModal(true); }}>📜 Nhật ký kiểm toán hệ thống</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Nút Đăng xuất kết thúc ca làm việc */}
        <button onClick={handleLogoutClick} style={{ background: '#e11d48', color: 'white', border: 'none', cursor: 'pointer', padding: "8px 16px", borderRadius: "10px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", boxShadow: '0 4px 12px rgba(225,29,72,0.3)' }} title="Đăng xuất kết thúc ca">
          🚪 <span className="hide-on-mobile">GIAO CA</span>
        </button>

      </div>
    </div>
  );
};
