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
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", gap: "10px" }} className="no-print">
      
      {/* BRANDING ĐỘNG CHO HỆ THỐNG SAAS MULTI-TENANT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 16px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', minWidth: '280px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: 'white', boxShadow: '0 0 10px rgba(225,29,72,0.5)' }}>
          🏪
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.5px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '220px' }}>
            {getStoreName()}
          </span>
          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#f43f5e', letterSpacing: '1px' }}>
            CLOUD ENTERPRISE ERP
          </span>
        </div>
      </div>

      {/* KHỐI HIỂN THỊ DOANH THU & CHỈ SỐ NHANH TRONG CA */}
      <div style={{ display: "flex", gap: "10px", flex: 1, justifyContent: "center" }}>
        {role === "admin" && (
          <div className="stat-card unique-card-glow" style={{ padding: "6px 12px", textAlign: "center", minWidth: "100px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", fontWeight: "bold" }}>VỐN HÀNG HOÁ</span>
            <strong style={{ fontSize: "15px", color: "var(--text-color)" }}>{Math.round(totalValue).toLocaleString()}đ</strong>
          </div>
        )}
        <div className="stat-card pointer-click unique-card-glow-green" onClick={() => setCashFlowModalInfo('TIỀN MẶT')} style={{ padding: "6px 12px", textAlign: "center", minWidth: "100px" }}>
          <span style={{ fontSize: "11px", color: "#10b981", display: "block", fontWeight: "bold" }}>TIỀN MẶT 👆</span>
          <strong style={{ fontSize: "15px", color: "#10b981" }}>{Math.round(currentShiftStats.cash).toLocaleString()}đ</strong>
        </div>
        <div className="stat-card pointer-click unique-card-glow-blue" onClick={() => setCashFlowModalInfo('CHUYỂN KHOẢN')} style={{ padding: "6px 12px", textAlign: "center", minWidth: "100px" }}>
          <span style={{ fontSize: "11px", color: "#3b82f6", display: "block", fontWeight: "bold" }}>CHUYỂN KHOẢN 👆</span>
          <strong style={{ fontSize: "15px", color: "#3b82f6" }}>{Math.round(currentShiftStats.transfer).toLocaleString()}đ</strong>
        </div>
        {role === "admin" && (
          <div className="stat-card unique-card-glow-orange" style={{ padding: "6px 12px", textAlign: "center", minWidth: "100px" }}>
            <span style={{ fontSize: "11px", color: "#f97316", display: "block", fontWeight: "bold" }}>LÃI TẠM TÍNH</span>
            <strong style={{ fontSize: "15px", color: "#f97316" }}>{Math.round(currentShiftStats.profit).toLocaleString()}đ</strong>
          </div>
        )}
      </div>

      {/* KHỐI ĐIỀU KHIỂN CHỨC NĂNG & THÀNH VIÊN */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        
        {/* Đèn báo trạng thái kết nối mạng Muti-tenant */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: isOnline ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#10b981' : '#ef4444', display: 'inline-block', boxShadow: isOnline ? '0 0 8px #10b981' : '0 0 8px #ef4444' }}></span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: isOnline ? '#10b981' : '#ef4444' }}>
            {isOnline ? (syncStatus === 'syncing' ? 'Đang đẩy lên...' : 'Đã đồng bộ Cloud') : 'Đang chạy Offline'}
          </span>
        </div>

        {/* Nút bật tắt Darkmode */}
        <button onClick={() => setDarkMode(!darkMode)} className="glass-btn btn-icon-only shadow-sm" title="Thay đổi giao diện">
          {darkMode ? "☀️" : "🌙"}
        </button>

        {/* Khối tài khoản nhân sự */}
        <div style={{ position: "relative" }}>
          <button onClick={(e) => { e.stopPropagation(); setShowMainMenu(!showMainMenu); }} className="glass-btn user-badge shadow-sm" style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px" }}>
              {role === "admin" ? "👑" : "🧑"}
            </div>
            <div style={{ textAlign: "left" }}>
              <span style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "var(--text-color)" }}>{role === "admin" ? "Quản lý" : "Thu ngân"}</span>
              <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>{shift}</span>
            </div>
            <span style={{ fontSize: "10px", marginLeft: "2px" }}>▼</span>
          </button>

          {/* MENU ĐIỀU HƯỚNG TỔNG CỦA HỆ THỐNG */}
          {showMainMenu && (
            <div className="glass dropdown-menu active" style={{ position: "absolute", right: 0, top: "100%", marginTop: "8px", width: "240px", zIndex: 99999, padding: "6px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)", marginBottom: "4px" }}>Hệ thống lõi SaaS</div>
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
                  <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)", textTransform: "uppercase", borderTop: "1px solid var(--border-color)", marginTop: "4px", marginBottom: "4px" }}>Cấu hình doanh nghiệp</div>
                  <button className="menu-item-btn text-left" onClick={() => { setShowMainMenu(false); setShowSettings(true); }}>⚙️ Thiết lập QR & Giờ Vàng</button>
                  <button className="menu-item-btn text-left" onClick={() => { setShowMainMenu(false); setShowAuditModal(true); }}>📜 Nhật ký kiểm toán hệ thống</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Nút Đăng xuất kết thúc ca làm việc */}
        <button onClick={handleLogoutClick} className="btn-danger shadow-sm" style={{ padding: "8px 14px", borderRadius: "8px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }} title="Đăng xuất kết thúc ca">
          🚪 <span className="hide-on-mobile">GIAO CA</span>
        </button>

      </div>
    </div>
  );
};
