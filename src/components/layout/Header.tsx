/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState, useRef } from "react";

export const Header = (props: any) => {
  const [storeInfo, setStoreInfo] = useState({ name: "HỆ THỐNG POS PRO", logo: "" });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRenewPopup, setShowRenewPopup] = useState(false);
  
  const ui = props.ui;
  const daysLeft = props.daysLeft || 0;
  const storeData = props.storeData;
  
  // Lấy trực tiếp số lượng đã đếm từ file App.tsx truyền xuống
  const alertCount = props.lowStockCount || 0;

  useEffect(() => {
    try {
      const savedStore = window.localStorage.getItem("mart_current_store");
      if (savedStore) {
        const storeObj = JSON.parse(savedStore);
        setStoreInfo({ name: storeObj.store_name ? storeObj.store_name.toUpperCase() : "HỆ THỐNG POS PRO", logo: storeObj.logo_url || "" });
      }
    } catch (e) {}
  }, []);

  const toggleWindyMusic = () => {
    if (!audioRef.current) { audioRef.current = new Audio("/Windy Hill.mp3"); audioRef.current.loop = true; }
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); } 
    else { audioRef.current.play().catch(err => console.log(err)); setIsPlaying(true); }
  };

  // Điều kiện hiển thị banner: Đang là gói PRO, chưa hết hạn hoàn toàn (daysLeft > 0) và còn nhỏ hơn hoặc bằng 5 ngày[cite: 3]
  const shouldShowBanner = storeData?.plan_type === 'PRO' && daysLeft > 0 && daysLeft <= 5;[cite: 3]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }} className="no-print">[cite: 3]
      <style>{`
        .premium-banner { background: linear-gradient(135deg, #DA251D 0%, #A61611 100%); box-shadow: 0 10px 20px -5px rgba(218, 37, 29, 0.4); transition: all 0.3s ease; }
        .premium-banner:hover { transform: translateY(-2px); box-shadow: 0 12px 25px -4px rgba(218, 37, 29, 0.5); }
        .modern-stat-card { background: ${ui.darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'}; border: 1px solid ${ui.darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}; border-radius: 12px; padding: 8px 16px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; min-width: 120px; box-shadow: 0 2px 6px rgba(0,0,0,0.02); }
        .main-menu-btn { background: ${ui.darkMode ? '#334155' : '#1e293b'}; color: white; padding: 8px 20px; border-radius: 10px; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; border: none; cursor: pointer; transition: 0.2s; }
        .main-menu-btn:hover { background: #0f172a; }
        .dropdown-menu-saas button { width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; color: ${ui.darkMode ? '#cbd5e1' : '#334155'}; font-size: 13px; font-weight: 600; cursor: pointer; display: block; border-bottom: 1px solid ${ui.darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}; }
        .dropdown-menu-saas button:hover { background: ${ui.darkMode ? '#334155' : '#f1f5f9'}; color: ${ui.darkMode ? '#ffffff' : '#da251d'}; padding-left: 18px; transition: 0.2s; }
        @keyframes spinSlow { 100% { transform: rotate(360deg); } }
        @keyframes wave-slide { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>[cite: 3]

      {/* BANNER THÔNG BÁO SẮP HẾT HẠN */}
      {shouldShowBanner && ([cite: 3]
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '12px 24px',
          borderRadius: '12px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          border: '1px solid #ffeeba',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <span>⚠️ Gói cước POS PRO của cửa hàng sẽ hết hạn sau <strong>{daysLeft} ngày</strong> nữa (vào ngày {new Date(storeData.expire_at).toLocaleDateString('vi-VN')}). Vui lòng chuẩn bị gia hạn để tránh gián đoạn.</span>[cite: 3]
          <button 
            onClick={() => setShowRenewPopup(true)}[cite: 3]
            style={{
              backgroundColor: '#856404',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
          >
            🚀 Gia hạn ngay
          </button>
        </div>
      )}

      {/* POPUP HIỂN THỊ MÃ QR GIA HẠN CHỦ ĐỘNG TRƯỚC HẠN */}
      {showRenewPopup && ([cite: 3]
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}>[cite: 3]
           <div style={{ background: 'white', padding: '30px', borderRadius: '24px', textAlign: 'center', maxWidth: '460px', width: '90%', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>[cite: 3]
              <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b', marginBottom: '15px' }}>Quét mã QR để Gia hạn chủ động</div>[cite: 3]
              <img 
                src={"https://img.vietqr.io/image/" + props.MY_BANK_ID + "-" + props.MY_ACCOUNT_NO + "-compact2.png?amount=" + props.SUBSCRIPTION_FEE + "&addInfo=" + encodeURIComponent("GIAHAN POS " + storeData?.id) + "&accountName=" + encodeURIComponent(props.ACCOUNT_NAME)}
                alt="VietQR Payment" 
                style={{ width: '220px', height: '220px', objectFit: 'contain', borderRadius: '10px' }}
              />
              <div style={{ marginTop: '15px', textAlign: 'left', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>[cite: 3]
                  <div style={{ marginBottom: '6px', fontSize: '13px', color: '#1e293b' }}>Ngân hàng: <strong>{props.MY_BANK_ID}</strong></div>[cite: 3]
                  <div style={{ marginBottom: '6px', fontSize: '13px', color: '#1e293b' }}>Số tài khoản: <strong style={{ color: '#2563eb' }}>{props.MY_ACCOUNT_NO}</strong></div>[cite: 3]
                  <div style={{ marginBottom: '6px', fontSize: '13px', color: '#1e293b' }}>Chủ tài khoản: <strong>{props.ACCOUNT_NAME}</strong></div>[cite: 3]
                  <div style={{ marginBottom: '6px', fontSize: '13px', color: '#1e293b' }}>Số tiền gia hạn: <strong style={{ color: '#ef4444' }}>{props.SUBSCRIPTION_FEE?.toLocaleString()}đ</strong> / tháng</div>[cite: 3]
                  <div style={{ fontSize: '13px', color: '#1e293b' }}>Nội dung CK: <strong style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>GIAHAN POS {storeData?.id}</strong></div>[cite: 3]
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: '12px 0 20px 0' }}>[cite: 3]
                 *Hệ thống tự động cộng dồn thêm 1 tháng vào sau ngày hết hạn cũ của bạn ngay khi nhận được tiền.
              </p>
              <button 
                onClick={() => setShowRenewPopup(false)}[cite: 3]
                style={{ width: '100%', padding: '12px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ĐÓNG CỬA SỔ
              </button>
           </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>[cite: 3]
        <div className="premium-banner" onClick={toggleWindyMusic} style={{ display: 'flex', alignItems: 'center', padding: '10px 24px', borderRadius: '16px', cursor: 'pointer', minWidth: '320px', position: 'relative', overflow: 'hidden' }} title="Bật/Tắt nhạc">[cite: 3]
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200%', height: '55%', animation: 'wave-slide 4s linear infinite', pointerEvents: 'none' }}>[cite: 3]
            <svg viewBox="0 0 800 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>[cite: 3]
              <path d="M0,50 Q100,0 200,50 T400,50 T600,50 T800,50 L800,120 L0,120 Z" fill="rgba(255, 206, 0, 0.15)" />[cite: 3]
            </svg>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200%', height: '70%', animation: 'wave-slide 6s linear infinite reverse', pointerEvents: 'none' }}>[cite: 3]
            <svg viewBox="0 0 800 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>[cite: 3]
              <path d="M0,50 Q100,100 200,50 T400,50 T600,50 T800,50 L800,120 L0,120 Z" fill="rgba(255, 255, 255, 0.08)" />[cite: 3]
            </svg>
          </div>
          <div style={{ position: 'relative', zIndex: 1, marginRight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: storeInfo.logo ? '8px' : '0', overflow: 'hidden', transform: isPlaying ? 'scale(1.1)' : 'none', transition: 'all 0.3s ease' }}>[cite: 3]
            {storeInfo.logo ? ( <img src={storeInfo.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> ) : isPlaying ? ( <span style={{ animation: 'spinSlow 3s linear infinite', fontSize: '26px' }}>📀</span> ) : ( <svg width="34" height="34" viewBox="0 0 50 50" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}><polygon points="25,2 32.35,17.15 48.77,19.54 36.88,31.13 39.69,47.5 25,39.77 10.31,47.5 13.12,31.13 1.23,19.54 17.65,17.15" fill="#FFCE00" /></svg> )}[cite: 3]
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>[cite: 3]
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.5px' }}>{storeInfo.name}</span>[cite: 3]
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#FFCE00', letterSpacing: '0.5px' }}>CLOUD ENTERPRISE ERP</span>[cite: 3]
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flex: 1, justifyContent: "center" }}>[cite: 3]
          <div className="modern-stat-card"><span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Vốn hàng hoá</span><span style={{ fontSize: "17px", fontWeight: "800", color: ui.darkMode ? "#cbd5e1" : "#334155" }}>{Math.round(props.totalValue).toLocaleString()}đ</span></div>[cite: 3]
          <div className="modern-stat-card" onClick={() => ui.setCashFlowModalInfo?.('cash')} style={{ cursor: 'pointer', borderBottom: '3px solid #10b981' }}><span style={{ fontSize: "11px", fontWeight: "700", color: "#10b981", textTransform: "uppercase" }}>Tiền mặt 👆</span><span style={{ fontSize: "17px", fontWeight: "800", color: "#059669" }}>{Math.round(props.currentShiftStats.cash).toLocaleString()}đ</span></div>[cite: 3]
          <div className="modern-stat-card" onClick={() => ui.setCashFlowModalInfo?.('transfer')} style={{ cursor: 'pointer', borderBottom: '3px solid #3b82f6' }}><span style={{ fontSize: "11px", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase" }}>Chuyển khoản 👆</span><span style={{ fontSize: "17px", fontWeight: "800", color: "#2563eb" }}>{Math.round(props.currentShiftStats.transfer).toLocaleString()}đ</span></div>[cite: 3]
          <div className="modern-stat-card" style={{ borderBottom: '3px solid #f59e0b' }}><span style={{ fontSize: "11px", fontWeight: "700", color: "#f59e0b", textTransform: "uppercase" }}>Lãi tạm tính</span><span style={{ fontSize: "17px", fontWeight: "800", color: "#d97706" }}>{Math.round(props.currentShiftStats.profit).toLocaleString()}đ</span></div>[cite: 3]
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>[cite: 3]
          {/* CHUÔNG THÔNG BÁO TỰ ĐỘNG HIỆN KHI CÓ SẢN PHẨM SẮP HẾT HOẶC ĐÃ HẾT */}
          {alertCount > 0 && (
            <div 
              title={`Có ${alertCount} sản phẩm dưới 10 pc cần kiểm tra kho!`}
              style={{ 
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                width: '44px', height: '44px', borderRadius: '12px', background: '#fef2f2', 
                border: '1px solid #fecaca', cursor: 'pointer', fontSize: '20px'
              }}
            >
              🔔
              <span style={{ 
                position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', 
                borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', fontWeight: 'bold', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' 
              }}>
                {alertCount}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', background: props.isOnline ? (ui.darkMode ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : (ui.darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2'), border: `1px solid ${props.isOnline ? '#a7f3d0' : '#fecaca'}` }}>[cite: 3]
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: props.isOnline ? '#10b981' : '#ef4444', display: 'inline-block' }}></span>[cite: 3]
            <span style={{ fontSize: '12px', fontWeight: '700', color: props.isOnline ? '#059669' : '#dc2626' }}>{props.isOnline ? 'Online' : 'Offline'}</span>[cite: 3]
          </div>
          <button onClick={() => ui.setDarkMode?.(!ui.darkMode)} style={{ background: ui.darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff', border: `1px solid ${ui.darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, cursor: 'pointer', width: '44px', height: '44px', borderRadius: '12px', fontSize: '18px' }}>{ui.darkMode ? "☀️" : "🌙"}</button>[cite: 3]
          
          {/* NÚT KHÓA MÀN HÌNH */}
          <button onClick={props.handleLockScreen} style={{ background: ui.darkMode ? 'rgba(245,158,11,0.1)' : '#fffbeb', color: '#d97706', border: `1px solid ${ui.darkMode ? 'rgba(245,158,11,0.2)' : '#fcd34d'}`, cursor: 'pointer', width: '44px', height: '44px', borderRadius: '12px', fontSize: '18px' }} title="Khóa màn hình">🔒</button>[cite: 3]

          <button onClick={props.handleLogoutClick} style={{ background: ui.darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2', color: '#dc2626', border: `1px solid ${ui.darkMode ? 'rgba(239,68,68,0.2)' : '#fecaca'}`, width: '44px', height: '44px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px' }} title="Đăng xuất">⏻</button>[cite: 3]
        </div>
      </div>

      <div style={{ display: "flex", justifycontent: "flex-start", width: "100%", position: "relative" }}>[cite: 3]
        <button className="main-menu-btn" onClick={(e) => { e.stopPropagation(); ui.setShowMainMenu?.(!ui.showMainMenu); }}>☰ MENU TÍNH NĂNG</button>[cite: 3]
        
        {ui.showMainMenu && ([cite: 3]
          <div className="dropdown-menu-saas" style={{ position: "absolute", left: 0, top: "100%", marginTop: "8px", width: "480px", zIndex: 99999, padding: "12px", borderRadius: "16px", background: ui.darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${ui.darkMode ? '#334155' : '#e2e8f0'}`, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }} onClick={e => e.stopPropagation()}>[cite: 3]
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>[cite: 3]
              <div style={{ padding: "4px 12px", fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" }}>NGHIỆP VỤ</div>[cite: 3]
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowStatsModal?.(true); }}>📊 Báo cáo doanh thu</button>[cite: 3]
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowPOModal?.(true); }}>📦 Nhập hàng (PO)</button>[cite: 3]
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowInventoryModal?.(true); }}>🔍 Kiểm kho định kỳ</button>[cite: 3]
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowDebtModal?.(true); }}>💸 Sổ nợ Khách</button>[cite: 3]
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowExpenseModal?.(true); }}>📉 Lập Phiếu Chi</button>[cite: 3]
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>[cite: 3]
              <div style={{ padding: "4px 12px", fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" }}>ĐỐI TÁC & HỆ THỐNG</div>[cite: 3]
              
              {/* MENU KẾT NỐI ĐIỆN THOẠI CHUẨN XỊN ĐÃ VÀO ĐÚNG VỊ TRÍ */}
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowScannerLinkModal?.(true); }}>📲 Kết nối Điện Thoại (QR)</button>[cite: 3]
              
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowCustomerModal?.(true); }}>💳 Danh sách VIP</button>[cite: 3]
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowSupplierModal?.(true); }}>🏭 Nhà Cung Cấp</button>[cite: 3]
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowMarketingModal?.(true); }}>💌 Chiến dịch Marketing</button>[cite: 3]
              <div style={{ margin: "4px 0", borderBottom: `1px solid ${ui.darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}` }}></div>[cite: 3]
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowAuditModal?.(true); }}>📝 Nhật ký hệ thống</button>[cite: 3]
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowSettings?.(true); }}>⚙️ Cài đặt & Giờ vàng</button>[cite: 3]
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowStoreSettings?.(true); }}>🏪 Thiết lập Logo</button>[cite: 3]
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
