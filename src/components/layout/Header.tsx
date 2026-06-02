import React, { useEffect, useState } from "react";

export const Header: React.FC<any> = (props) => {
  const [storeInfo, setStoreInfo] = useState({ name: "HỆ THỐNG POS PRO", logo: "" });

  useEffect(() => {
    try {
      const savedStore = window.localStorage.getItem("mart_current_store");
      if (savedStore) {
        const storeObj = JSON.parse(savedStore);
        setStoreInfo({ name: storeObj.store_name ? storeObj.store_name.toUpperCase() : "HỆ THỐNG POS PRO", logo: storeObj.logo_url || "" });
      }
    } catch (e) {}
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }} className="no-print">
      <style>{`
        .premium-banner { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); box-shadow: 0 4px 15px -3px rgba(220, 38, 38, 0.4); transition: all 0.3s ease; }
        .premium-banner:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -4px rgba(220, 38, 38, 0.5); }
        .modern-stat-card { background: ${props.darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'}; border: 1px solid ${props.darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}; border-radius: 12px; padding: 8px 16px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; min-width: 120px; box-shadow: 0 2px 6px rgba(0,0,0,0.02); }
        .main-menu-btn { background: ${props.darkMode ? '#334155' : '#1e293b'}; color: white; padding: 8px 20px; border-radius: 10px; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; border: none; cursor: pointer; transition: 0.2s; }
        .main-menu-btn:hover { background: #0f172a; }
        .dropdown-menu-saas button { width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; color: ${props.darkMode ? '#cbd5e1' : '#334155'}; font-size: 13px; font-weight: 600; cursor: pointer; display: block; border-bottom: 1px solid ${props.darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}; }
        .dropdown-menu-saas button:hover { background: ${props.darkMode ? '#334155' : '#f1f5f9'}; color: ${props.darkMode ? '#ffffff' : '#da251d'}; padding-left: 18px; transition: 0.2s; }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <div className="premium-banner" onClick={() => props.setShowStoreSettings(true)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '8px 20px', borderRadius: '16px', cursor: 'pointer', border: '1px solid #f87171', minWidth: '300px' }} title="Nhấn để Sửa tên & Logo">
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: storeInfo.logo ? 'transparent' : 'linear-gradient(135deg, #fef08a 0%, #eab308 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', overflow: 'hidden' }}>
            {storeInfo.logo ? <img src={storeInfo.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : "🏪"}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>{storeInfo.name}</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#fef08a' }}>CLOUD ENTERPRISE ERP</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flex: 1, justifyContent: "center" }}>
          <div className="modern-stat-card"><span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Vốn hàng hoá</span><span style={{ fontSize: "17px", fontWeight: "800", color: props.darkMode ? "#cbd5e1" : "#334155" }}>{Math.round(props.totalValue).toLocaleString()}đ</span></div>
          <div className="modern-stat-card" onClick={() => props.setCashFlowModalInfo('TIỀN MẶT')} style={{ cursor: 'pointer', borderBottom: '3px solid #10b981' }}><span style={{ fontSize: "11px", fontWeight: "700", color: "#10b981", textTransform: "uppercase" }}>Tiền mặt 👆</span><span style={{ fontSize: "17px", fontWeight: "800", color: "#059669" }}>{Math.round(props.currentShiftStats.cash).toLocaleString()}đ</span></div>
          <div className="modern-stat-card" onClick={() => props.setCashFlowModalInfo('CHUYỂN KHOẢN')} style={{ cursor: 'pointer', borderBottom: '3px solid #3b82f6' }}><span style={{ fontSize: "11px", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase" }}>Chuyển khoản 👆</span><span style={{ fontSize: "17px", fontWeight: "800", color: "#2563eb" }}>{Math.round(props.currentShiftStats.transfer).toLocaleString()}đ</span></div>
          <div className="modern-stat-card" style={{ borderBottom: '3px solid #f59e0b' }}><span style={{ fontSize: "11px", fontWeight: "700", color: "#f59e0b", textTransform: "uppercase" }}>Lãi tạm tính</span><span style={{ fontSize: "17px", fontWeight: "800", color: "#d97706" }}>{Math.round(props.currentShiftStats.profit).toLocaleString()}đ</span></div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', background: props.isOnline ? (props.darkMode ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : (props.darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2'), border: `1px solid ${props.isOnline ? '#a7f3d0' : '#fecaca'}` }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: props.isOnline ? '#10b981' : '#ef4444', display: 'inline-block' }}></span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: props.isOnline ? '#059669' : '#dc2626' }}>{props.isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <button onClick={() => props.setDarkMode(!props.darkMode)} style={{ background: props.darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff', border: `1px solid ${props.darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, cursor: 'pointer', width: '44px', height: '44px', borderRadius: '12px', fontSize: '18px' }}>{props.darkMode ? "☀️" : "🌙"}</button>
          <div style={{ background: props.darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff', border: `1px solid ${props.darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, padding: "6px 14px 6px 6px", display: "flex", alignItems: "center", gap: "10px", borderRadius: '14px' }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>👑</div>
            <div style={{ textAlign: "left" }}><span style={{ display: "block", fontSize: "13px", fontWeight: "700", color: props.darkMode ? '#ffffff' : "#334155" }}>Người dùng</span><span style={{ display: "block", fontSize: "11px", fontWeight: "500", color: "#64748b" }}>{props.shift}</span></div>
          </div>
          <button onClick={props.handleLogoutClick} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', width: '44px', height: '44px', borderRadius: '12px', cursor: 'pointer' }}>⏻</button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-start", width: "100%", position: "relative" }}>
        <button className="main-menu-btn" onClick={(e) => { e.stopPropagation(); props.setShowMainMenu(!props.showMainMenu); }}>☰ MENU TÍNH NĂNG</button>
        
        {props.showMainMenu && (
          <div className="dropdown-menu-saas" style={{ position: "absolute", left: 0, top: "100%", marginTop: "8px", width: "260px", zIndex: 99999, padding: "8px", borderRadius: "16px", background: props.darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${props.darkMode ? '#334155' : '#e2e8f0'}`, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => { props.setShowMainMenu(false); props.setShowStatsModal(true); }}>📊 Báo cáo doanh thu</button>
            <button onClick={() => { props.setShowMainMenu(false); props.setShowPOModal(true); }}>📦 Nhập hàng (PO)</button>
            <button onClick={() => { props.setShowMainMenu(false); props.setShowInventoryModal(true); }}>🔍 Kiểm kho định kỳ</button>
            <button onClick={() => { props.setShowMainMenu(false); props.setShowDebtModal(true); }}>💸 Sổ nợ Khách</button>
            <button onClick={() => { props.setShowMainMenu(false); props.setShowExpenseModal(true); }}>📉 Lập Phiếu Chi</button>
            <button onClick={() => { props.setShowMainMenu(false); props.setShowCustomerModal(true); }}>💳 Danh sách VIP</button>
            
            <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", margin: "4px 0 0 0" }}>Hệ thống</div>
            <button onClick={() => { props.setShowMainMenu(false); props.setShowSettings(true); }}>⚙️ Cài đặt Thanh toán & Giờ vàng</button>
            <button onClick={() => { props.setShowMainMenu(false); props.setShowStoreSettings(true); }}>🏪 Thiết lập Thương hiệu (Logo)</button>
          </div>
        )}
      </div>
    </div>
  );
};
