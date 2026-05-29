/* eslint-disable */
// @ts-nocheck
import React, { useRef, useState } from "react";

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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const toggleWindyMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/Windy Hill.mp3");
      audioRef.current.loop = true;
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.log("Cần tương tác để phát nhạc:", err));
      setIsPlaying(true);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px", fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }} className="no-print">
      
      {/* 1. ÉP FONT CHỮ CAO CẤP VÀ ANIMATION SANG TRỌNG */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
        
        .premium-banner {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          box-shadow: 0 4px 15px -3px rgba(220, 38, 38, 0.4);
          transition: all 0.3s ease;
        }
        .premium-banner:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -4px rgba(220, 38, 38, 0.5);
        }
        
        .modern-stat-card {
          background: ${darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'};
          border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'};
          border-radius: 14px;
          padding: 8px 16px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          min-width: 120px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
          transition: all 0.2s;
        }
        .modern-stat-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .stat-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        
        .stat-value {
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        @keyframes spinSlow { 100% { transform: rotate(360deg); } }
      `}</style>

      {/* 2. BANNER CỜ ĐỎ SAO VÀNG - BẢN RUBY LUXURY */}
      <div 
        className="premium-banner"
        onClick={toggleWindyMusic}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px', 
          padding: '8px 20px', 
          borderRadius: '16px', 
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          border: '1px solid #f87171'
        }}
        title="Bấm vào để BẬT/TẮT nhạc Windy Hill"
      >
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '12px', 
          background: 'linear-gradient(135deg, #fef08a 0%, #eab308 100%)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '24px', 
          boxShadow: '0 2px 10px rgba(234, 179, 8, 0.5)',
          transform: isPlaying ? 'scale(1.05)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          {isPlaying ? <span style={{ animation: 'spinSlow 3s linear infinite' }}>📀</span> : "⭐"}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '10px' }}>
          <span style={{ fontSize: '17px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {getStoreName()}
          </span>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#fef08a', letterSpacing: '0.5px' }}>
            {isPlaying ? "🎶 ĐANG PHÁT WINDY HILL..." : "✨ CLICK LOGO QUẨY NHẠC"}
          </span>
        </div>
      </div>

      {/* 3. KHỐI CHỈ SỐ KINH DOANH - SẠCH SẼ, HIỆN ĐẠI, DỄ NHÌN */}
      <div style={{ display: "flex", gap: "12px", flex: 1, justifyContent: "center" }}>
        {role === "admin" && (
          <div className="modern-stat-card">
            <span className="stat-label" style={{ color: "#64748b" }}>Vốn hàng hoá</span>
            <span className="stat-value" style={{ color: darkMode ? "#cbd5e1" : "#334155" }}>{Math.round(totalValue).toLocaleString()}đ</span>
          </div>
        )}
        <div className="modern-stat-card pointer-click" onClick={() => setCashFlowModalInfo('TIỀN MẶT')} style={{ cursor: 'pointer', borderBottom: '3px solid #10b981' }}>
          <span className="stat-label" style={{ color: "#10b981" }}>Tiền mặt 👆</span>
          <span className="stat-value" style={{ color: "#059669" }}>{Math.round(currentShiftStats.cash).toLocaleString()}đ</span>
        </div>
        <div className="modern-stat-card pointer-click" onClick={() => setCashFlowModalInfo('CHUYỂN KHOẢN')} style={{ cursor: 'pointer', borderBottom: '3px solid #3b82f6' }}>
          <span className="stat-label" style={{ color: "#3b82f6" }}>Chuyển khoản 👆</span>
          <span className="stat-value" style={{ color: "#2563eb" }}>{Math.round(currentShiftStats.transfer).toLocaleString()}đ</span>
        </div>
        {role === "admin" && (
          <div className="modern-stat-card" style={{ borderBottom: '3px solid #f59e0b' }}>
            <span className="stat-label" style={{ color: "#f59e0b" }}>Lãi tạm tính</span>
            <span className="stat-value" style={{ color: "#d97706" }}>{Math.round(currentShiftStats.profit).toLocaleString()}đ</span>
          </div>
        )}
      </div>

      {/* 4. KHỐI ĐIỀU KHIỂN & MENU - GỌN GÀNG, BO GÓC CHUẨN UX */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        
        {/* Đèn báo trạng thái mạng */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '12px', background: isOnline ? (darkMode ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : (darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2'), border: `1px solid ${isOnline ? '#a7f3d0' : '#fecaca'}` }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#10b981' : '#ef4444', display: 'inline-block', boxShadow: isOnline ? '0 0 8px #10b981' : '0 0 8px #ef4444' }}></span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: isOnline ? '#059669' : '#dc2626' }}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Nút bật tắt Darkmode */}
        <button onClick={() => setDarkMode(!darkMode)} style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, cursor: 'pointer', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }} title="Thay đổi giao diện">
          {darkMode ? "☀️" : "🌙"}
        </button>

        {/* Khối tài khoản nhân sự */}
        <div style={{ position: "relative" }}>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMainMenu(!showMainMenu); }} 
            style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, cursor: 'pointer', padding: "6px 14px 6px 6px", display: "flex", alignItems: "center", gap: "10px", borderRadius: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}
          >
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
              {role === "admin" ? "👑" : "🧑"}
            </div>
            <div style={{ textAlign: "left" }}>
              <span style={{ display: "block", fontSize: "13px", fontWeight: "700", color: darkMode ? '#ffffff' : "#334155" }}>{role === "admin" ? "Quản lý" : "Thu ngân"}</span>
              <span style={{ display: "block", fontSize: "11px", fontWeight: "500", color: "#64748b" }}>{shift}</span>
            </div>
            <span style={{ fontSize: "10px", color: '#94a3b8', marginLeft: '4px' }}>▼</span>
          </button>

          {/* Menu xổ xuống */}
          {showMainMenu && (
            <div className="dropdown-menu-saas" style={{ position: "absolute", right: 0, top: "100%", marginTop: "8px", width: "240px", zIndex: 99999, padding: "8px", borderRadius: "16px", background: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", borderBottom: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`, marginBottom: "4px" }}>Hệ thống SaaS</div>
              <button onClick={() => { setShowMainMenu(false); setShowStatsModal(true); }}>📊 Báo cáo doanh thu</button>
              <button onClick={() => { setShowMainMenu(false); setShowPOModal(true); }}>📦 Nhập kho NCC</button>
              <button onClick={() => { setShowMainMenu(false); setShowInventoryModal(true); }}>🔍 Kiểm kho định kỳ</button>
              <button style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => { setShowMainMenu(false); setShowInventoryModal(true); }}>
                ⚠️ Hàng sắp hết <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>{lowStockCount}</span>
              </button>
              <button onClick={() => { setShowMainMenu(false); setShowDebtModal(true); }}>💸 Sổ nợ Khách</button>
              <button onClick={() => { setShowMainMenu(false); setShowExpenseModal(true); }}>📉 Lập Phiếu Chi</button>
              <button onClick={() => { setShowMainMenu(false); setShowCustomerModal(true); }}>💳 Danh sách VIP</button>
              <button onClick={() => { setShowMainMenu(false); setShowSupplierModal(true); }}>🏢 Nhà cung cấp</button>
              <button onClick={() => { setShowMainMenu(false); setShowMarketingModal(true); }}>💌 Email Marketing</button>
              <button onClick={() => { setShowMainMenu(false); setShowScannerLinkModal(true); }}>🔗 Kết nối Máy quét</button>
              {role === "admin" && (
                <>
                  <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", borderTop: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`, marginTop: "4px", marginBottom: "4px" }}>Cấu hình</div>
                  <button onClick={() => { setShowMainMenu(false); setShowSettings(true); }}>⚙️ Thiết lập hệ thống</button>
                  <button onClick={() => { setShowMainMenu(false); setShowAuditModal(true); }}>📜 Nhật ký kiểm toán</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Nút Đăng xuất - Tinh tế hơn, bớt cồng kềnh */}
        <button onClick={handleLogoutClick} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', padding: "10px 16px", borderRadius: "12px", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2'; }} onMouseOut={(e) => { e.currentTarget.style.background = '#fef2f2'; }}>
          <span style={{ fontSize: '16px' }}>🚪</span> <span className="hide-on-mobile">ĐĂNG XUẤT</span>
        </button>

      </div>
    </div>
  );
};
