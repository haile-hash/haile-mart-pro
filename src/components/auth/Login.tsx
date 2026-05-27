// src/components/auth/Login.tsx
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "../../supabaseClient";

interface LoginProps {
  setIsLoggedIn: (value: boolean) => void;
  setRole: (role: string) => void;
  shift: string;
  setShift: (shift: string) => void;
  startingCash: number;
  setStartingCash: (cash: number) => void;
  installPrompt: any;
  handleInstallApp: () => void;
}

export const Login: React.FC<LoginProps> = ({
  setIsLoggedIn,
  setRole,
  shift,
  setShift,
  startingCash,
  setStartingCash,
  installPrompt,
  handleInstallApp
}) => {
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================================================
  // PHƯƠNG ÁN 1: TỰ ĐỘNG VÀO THẲNG APP NẾU ĐÃ CÓ PHIÊN TRƯỚC ĐÓ
  // =========================================================
  useEffect(() => {
    const checkSavedSession = async () => {
      // Vì chúng ta dùng IndexedDB ở file App.tsx để lưu "mart_logged_in"
      // Nhưng lúc này App.tsx chưa tải xong DB, ta có thể check tạm bằng localStorage
      const savedSession = localStorage.getItem("mart_offline_creds");
      const wasLoggedIn = localStorage.getItem("mart_was_logged_in") === "true";
      
      if (wasLoggedIn && savedSession) {
         // Phục hồi lại Role từ phiên cũ (nếu lưu)
         const savedRole = localStorage.getItem("mart_role") || "staff";
         setRole(savedRole);
         setIsLoggedIn(true);
      }
    };
    checkSavedSession();
  }, [setIsLoggedIn, setRole]);

  // =========================================================
  // XỬ LÝ NÚT ĐĂNG NHẬP (ONLINE & OFFLINE)
  // =========================================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let u = authUsername.trim().toLowerCase();
    const p = authPassword.trim();
    if (!u.includes("@")) {
      u = u + "@hailemart.com";
    }

    setLoading(true);
    const isOnline = navigator.onLine;

    if (isOnline) {
      // ---------- KHI CÓ MẠNG (Đăng nhập qua Supabase) ----------
      const { error } = await supabase.auth.signInWithPassword({
        email: u,
        password: p,
      });

      if (error) {
        toast.error(`Đăng nhập thất bại: Sai tài khoản hoặc mật khẩu.`);
        setLoading(false);
        return;
      }

      // Đăng nhập Server thành công -> Lưu dự phòng vào ổ cứng
      const userRole = u.includes("admin") ? "admin" : "staff";
      localStorage.setItem("mart_offline_creds", JSON.stringify({ email: u, password: p }));
      localStorage.setItem("mart_was_logged_in", "true");
      localStorage.setItem("mart_role", userRole);

      setRole(userRole);
      setStartingCash(startingCash); // Có thể cần cập nhật từ form
      setIsLoggedIn(true);

    } else {
      // ---------- KHI MẤT MẠNG (Xác thực bằng ổ cứng) ----------
      console.log('Đang chạy chế độ Offline...');
      const offlineCredsRaw = localStorage.getItem('mart_offline_creds');

      if (!offlineCredsRaw) {
         toast.error('Máy này chưa từng đăng nhập khi có mạng. Không thể vào ngoại tuyến!');
         setLoading(false);
         return;
      }

      const offlineCreds = JSON.parse(offlineCredsRaw);

      if (u === offlineCreds.email && p === offlineCreds.password) {
         // Đúng mật khẩu cũ
         const savedRole = localStorage.getItem("mart_role") || "staff";
         setRole(savedRole);
         localStorage.setItem("mart_was_logged_in", "true"); // Đánh dấu đã đăng nhập
         
         toast.success('Đang chạy ở chế độ Offline (Ngoại tuyến)');
         setIsLoggedIn(true);
      } else {
         toast.error('Sai tài khoản hoặc mật khẩu Offline!');
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-wrapper">
      <form className="glass-login" onSubmit={handleLoginSubmit}>
        <div className="login-header">
          <h2 className="login-title">
            HẢI LÊ <span>MART</span>
          </h2>
          <p className="login-subtitle">Hệ thống Quản lý ERP & POS</p>
        </div>

        {/* NÚT CÀI ĐẶT APP (PWA) CHỈ HIỆN KHI TRÌNH DUYỆT HỖ TRỢ */}
        {installPrompt && (
          <button
            type="button"
            onClick={handleInstallApp}
            style={{
              width: "100%",
              marginBottom: "15px",
              padding: "10px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            ⬇️ CÀI ĐẶT APP CHO MÁY NÀY
          </button>
        )}

        <div className="login-input-group">
          <input
            className="login-input"
            placeholder="Tên đăng nhập (Email)..."
            value={authUsername}
            onChange={(e) => setAuthUsername(e.target.value)}
            required
          />
        </div>
        <div className="login-input-group">
          <input
            className="login-input"
            type="password"
            placeholder="Mật khẩu..."
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            required
          />
        </div>
        <div className="login-input-group">
          <select
            className="login-input"
            value={shift}
            onChange={(e) => setShift(e.target.value)}
            required
          >
            <option value="Ca Sáng">🌅 Ca Sáng (06:00 - 14:00)</option>
            <option value="Ca Chiều">☀️ Ca Chiều (14:00 - 22:00)</option>
            <option value="Ca Tối">🌙 Ca Tối (22:00 - 06:00)</option>
          </select>
        </div>
        <button
          className="login-btn-submit"
          type="submit"
          disabled={loading}
        >
          {loading ? "ĐANG TẢI..." : "ĐĂNG NHẬP"}
        </button>
      </form>
    </div>
  );
};
