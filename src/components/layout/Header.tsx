import React from 'react';

// Định nghĩa các props mà Header cần nhận từ App.tsx
interface HeaderProps {
  role: string;
  shift: string;
  totalValue: number;
  currentShiftStats: { cash: number; transfer: number; prof: number };
  setCashFlowModalInfo: (info: 'TIỀN MẶT' | 'CHUYỂN KHOẢN') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  handleLogoutClick: () => void;
  // Bạn có thể mang cả component HeaderLogo và LiveClock vào file này
}

export const Header: React.FC<HeaderProps> = ({
  role,
  shift,
  totalValue,
  currentShiftStats,
  setCashFlowModalInfo,
  darkMode,
  setDarkMode,
  handleLogoutClick
}) => {
  return (
    <div className="glass" style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px", borderBottom: "4px solid #ef4444" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* Đưa phần <HeaderLogo /> vào đây */}
        
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {(new Date().getHours() >= 20 || new Date().getHours() < 6) && <span style={{ fontSize: "11px", background: "#fef08a", color: "#b45309", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold" }}>🌙 HAPPY HOUR</span>}
          <div style={{ width: "2px", height: "30px", background: "var(--border-glass)" }}></div>
          
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            {role === 'admin' && <div style={{ textAlign: "center", whiteSpace: "nowrap" }}><div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>VỐN</div><div style={{ fontSize: "15px", fontWeight: "900", color: "var(--text-main)" }}>{totalValue.toLocaleString()}đ</div></div>}
            
            <div className="cash-box" onClick={() => setCashFlowModalInfo('TIỀN MẶT')} style={{ textAlign: "center", whiteSpace: "nowrap", cursor: "pointer" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>TIỀN MẶT 👆</div>
              <div style={{ fontSize: "15px", fontWeight: "900", color: currentShiftStats.cash < 0 ? "#ef4444" : "#059669" }}>{currentShiftStats.cash.toLocaleString()}đ</div>
            </div>
            
            <div className="cash-box" onClick={() => setCashFlowModalInfo('CHUYỂN KHOẢN')} style={{ textAlign: "center", whiteSpace: "nowrap", cursor: "pointer" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>CHUYỂN KHOẢN 👆</div>
              <div style={{ fontSize: "15px", fontWeight: "900", color: "#3b82f6" }}>{currentShiftStats.transfer.toLocaleString()}đ</div>
            </div>
            
            {role === 'admin' && <div style={{ textAlign: "center", whiteSpace: "nowrap" }}><div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>LÃI</div><div style={{ fontSize: "15px", fontWeight: "900", color: currentShiftStats.prof < 0 ? "#ef4444" : "#ea580c" }}>{currentShiftStats.prof.toLocaleString()}đ</div></div>}
          </div>
          
          <div style={{ width: "2px", height: "30px", background: "var(--border-glass)" }}></div>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }} title="Bật/tắt Giao diện tối">{darkMode ? "☀️" : "🌙"}</button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ textAlign: "right", lineHeight: "1.2", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-main)" }}>{role === 'admin' ? "Quản lý" : "Thu ngân"}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{shift}</div>
            </div>
            <button onClick={handleLogoutClick} style={{ padding: "10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Đăng xuất">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </div>
      {/* ... Phần Menu Button có thể để ở đây hoặc tách tiếp thành MainMenu.tsx */}
    </div>
  );
};
