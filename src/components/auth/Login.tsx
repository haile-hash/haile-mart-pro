/* eslint-disable */
// @ts-nocheck
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

export const Login = ({ setIsLoggedIn, setRole, shift, setShift, startingCash, setStartingCash, installPrompt, handleInstallApp }: any) => {
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        setRole("admin"); 
        setIsLoggedIn(true);
        toast.success("Chào mừng quay trở lại!");
      }
    } catch (error: any) {
      toast.error("Tài khoản hoặc mật khẩu không chính xác!");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !phone || !email || !password) return toast.error("Vui lòng điền đủ thông tin!");
    if (password.length < 6) return toast.error("Mật khẩu bảo mật phải từ 6 ký tự!");
    
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      if (authData.user) {
        const { error: storeError } = await supabase.from('stores').insert([{
          store_name: storeName,
          phone: phone,
          owner_id: authData.user.id
        }]);
        
        if (storeError) throw storeError;
        toast.success("Khởi tạo không gian SaaS thành công!");
        setRole("admin");
        setIsLoggedIn(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Email này đã được đăng ký sử dụng!");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Vui lòng nhập email đã đăng ký!");
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // Khách bấm link trong mail sẽ tự đá về trang web của bạn
      });
      if (error) throw error;
      toast.success("Hệ thống đã gửi link đặt lại mật khẩu vào Email của bạn. Hãy kiểm tra hộp thư (hoặc thư rác)!");
      setAuthMode("login");
    } catch (error: any) {
      toast.error("Lỗi gửi yêu cầu: " + (error.message || "Vui lòng thử lại sau"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 50%, #1e1e38 0%, #0a0a14 100%)', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      <div style={{ position: 'absolute', width: '300px', height: '300px', background: authMode === 'register' ? '#10b981' : authMode === 'forgot' ? '#f59e0b' : '#3b82f6', filter: 'blur(120px)', opacity: 0.15, top: '20%', left: '35%', borderRadius: '50%', pointerEvents: 'none', transition: 'all 0.5s ease' }}></div>

      <div style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '40px 35px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', width: '100%', maxWidth: '440px', boxSizing: 'border-box', color: '#ffffff' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', borderRadius: '16px', background: authMode === 'register' ? 'linear-gradient(135deg, #10b981, #059669)' : authMode === 'forgot' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', fontSize: '24px', marginBottom: '16px', boxShadow: '0 8px 20px rgba(0,0,0,0.2)', transition: 'all 0.4s ease' }}>
            {authMode === 'register' ? "🚀" : authMode === 'forgot' ? "⏳" : "🔑"}
          </div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: '#ffffff' }}>
            {authMode === 'register' ? "BẮT ĐẦU KINH DOANH" : authMode === 'forgot' ? "KHÔI PHỤC MẬT KHẨU" : "HỆ THỐNG POS PRO"}
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
            {authMode === 'register' ? "Khởi tạo tài khoản phân mảnh doanh nghiệp Cloud" : authMode === 'forgot' ? "Nhập email hệ thống sẽ gửi liên kết xác thực" : "Nền tảng quản lý bán hàng đa cửa hàng"}
          </p>
        </div>

        <form onSubmit={authMode === 'register' ? handleRegister : authMode === 'forgot' ? handleForgotPassword : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {authMode === 'register' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#cbd5e1', fontSize: '13px' }}>Tên Cửa Hàng / Thương Hiệu</label>
                <input type="text" required value={storeName} onChange={e => setStoreName(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} placeholder="VD: Tạp Hóa Chú Tèo, MiniMart..." />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#cbd5e1', fontSize: '13px' }}>Số Điện Thoại Đại Diện</label>
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} placeholder="090..." />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#cbd5e1', fontSize: '13px' }}>Tài Khoản Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} placeholder="name@company.com" />
          </div>
          
          {authMode !== 'forgot' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontWeight: '600', color: '#cbd5e1', fontSize: '13px' }}>Mật Khẩu</label>
                {authMode === 'login' && (
                  <span onClick={() => setAuthMode("forgot")} style={{ color: '#3b82f6', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>Quên mật khẩu?</span>
                )}
              </div>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} placeholder="••••••••" />
            </div>
          )}

          {authMode === 'login' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#cbd5e1', fontSize: '13px' }}>Ca Làm Việc</label>
                <select value={shift} onChange={e => setShift(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: '#131324', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box', cursor: 'pointer' }}>
                  <option value="Ca Sáng">🌅 Ca Sáng</option>
                  <option value="Ca Chiều">🌇 Ca Chiều</option>
                  <option value="Ca Tối">🌃 Ca Tối</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#cbd5e1', fontSize: '13px' }}>Tiền Đầu Ca</label>
                <input type="number" required value={startingCash} onChange={e => setStartingCash(Number(e.target.value))} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: '8px', width: '100%', padding: '14px', background: authMode === 'register' ? 'linear-gradient(135deg, #10b981, #059669)' : authMode === 'forgot' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            {loading ? "ĐANG XỬ LÝ..." : (authMode === 'register' ? "MỞ CỬA HÀNG NGAY" : authMode === 'forgot' ? "GỬI YÊU CẦU ĐỔI MẬT KHẨU" : "ĐĂNG NHẬP VÀO CA")}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {authMode !== 'login' ? (
            <button onClick={() => setAuthMode("login")} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
              ← Quay lại đăng nhập hệ thống
            </button>
          ) : (
            <button onClick={() => setAuthMode("register")} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
              ✨ Bạn muốn bán phần mềm? Đăng ký dùng thử
            </button>
          )}
        </div>

        {installPrompt && authMode === 'login' && (
          <button onClick={handleInstallApp} style={{ width: '100%', marginTop: '16px', padding: '10px', background: 'rgba(255,255,255,0.02)', color: '#cbd5e1', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
            📲 Tải ứng dụng PWA về thiết bị
          </button>
        )}
      </div>
    </div>
  );
};
