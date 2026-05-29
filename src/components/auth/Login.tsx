/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

export const Login = ({ setIsLoggedIn, setRole, shift, setShift, startingCash, setStartingCash, installPrompt, handleInstallApp }: any) => {
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot" | "update_password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setAuthMode('update_password');
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) { setRole("admin"); setIsLoggedIn(true); toast.success("Chào mừng quay trở lại!"); }
      } 
      else if (authMode === 'register') {
        if (!storeName || !phone || !email || !password) throw new Error("Vui lòng điền đủ thông tin!");
        if (password.length < 6) throw new Error("Mật khẩu bảo mật phải từ 6 ký tự!");
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        if (authData.user) {
          const { error: storeError } = await supabase.from('stores').insert([{ store_name: storeName, phone: phone, owner_id: authData.user.id }]);
          if (storeError) throw storeError;
          toast.success("Khởi tạo không gian SaaS thành công!");
          setRole("admin"); setIsLoggedIn(true);
        }
      }
      else if (authMode === 'forgot') {
        if (!email) throw new Error("Vui lòng nhập email đã đăng ký!");
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://pos-pro-enterprise.vercel.app' });
        if (error) throw error;
        toast.success("Đã gửi link khôi phục. Hãy kiểm tra hộp thư!");
        setAuthMode("login");
      }
      else if (authMode === 'update_password') {
        if (password.length < 6) throw new Error("Mật khẩu phải từ 6 ký tự!");
        const { error } = await supabase.auth.updateUser({ password: password });
        if (error) throw error;
        toast.success("Cập nhật thành công! Vui lòng đăng nhập lại.");
        setAuthMode("login"); setPassword("");
      }
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Background Đồ Họa Tuơi Sáng */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: 'linear-gradient(135deg, #bfdbfe, #86efac)', filter: 'blur(100px)', top: '10%', left: '10%', opacity: 0.5, borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'linear-gradient(135deg, #fbcfe8, #fef08a)', filter: 'blur(100px)', bottom: '10%', right: '10%', opacity: 0.5, borderRadius: '50%' }}></div>

      <div style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid #ffffff', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.08)', width: '100%', maxWidth: '440px', zIndex: 10 }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', fontSize: '28px', marginBottom: '16px', boxShadow: '0 8px 16px rgba(37,99,235,0.2)' }}>
            {authMode === 'register' ? "🚀" : authMode === 'forgot' ? "⏳" : authMode === 'update_password' ? "🔐" : "📦"}
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            {authMode === 'register' ? "MỞ CỬA HÀNG MỚI" : authMode === 'forgot' ? "KHÔI PHỤC MẬT KHẨU" : authMode === 'update_password' ? "ĐỔI MẬT KHẨU" : "HỆ THỐNG POS PRO"}
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Nền tảng quản lý bán hàng đa cửa hàng Cloud ERP</p>
        </div>

        <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {authMode === 'register' && (
            <>
              <input type="text" required value={storeName} onChange={e => setStoreName(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontSize: '14px', color: '#0f172a' }} placeholder="Tên Cửa Hàng / Thương Hiệu" />
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontSize: '14px', color: '#0f172a' }} placeholder="Số Điện Thoại" />
            </>
          )}

          {authMode !== 'update_password' && (
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontSize: '14px', color: '#0f172a' }} placeholder="Tài khoản Email" />
          )}
          
          {(authMode === 'login' || authMode === 'register' || authMode === 'update_password') && (
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontSize: '14px', color: '#0f172a' }} placeholder="Mật khẩu bảo mật" />
          )}

          {authMode === 'login' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select value={shift} onChange={e => setShift(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', outline: 'none', fontSize: '14px', cursor: 'pointer' }}>
                <option value="Ca Sáng">🌅 Ca Sáng</option>
                <option value="Ca Chiều">🌇 Ca Chiều</option>
                <option value="Ca Tối">🌃 Ca Tối</option>
              </select>
              <input type="number" required value={startingCash} onChange={e => setStartingCash(Number(e.target.value))} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontSize: '14px', color: '#0f172a' }} placeholder="Tiền đầu ca" />
            </div>
          )}

          {authMode === 'login' && (
            <div style={{ textAlign: 'right' }}>
              <span onClick={() => setAuthMode("forgot")} style={{ color: '#2563eb', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>Quên mật khẩu?</span>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: '8px', width: '100%', padding: '16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', transition: '0.2s', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
            {loading ? "ĐANG XỬ LÝ..." : (authMode === 'register' ? "ĐĂNG KÝ" : authMode === 'forgot' ? "LẤY LẠI MẬT KHẨU" : authMode === 'update_password' ? "LƯU MẬT KHẨU" : "ĐĂNG NHẬP")}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          {authMode !== 'login' ? (
            <button onClick={() => setAuthMode("login")} style={{ background: 'none', border: 'none', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>← Quay lại đăng nhập</button>
          ) : (
            <button onClick={() => setAuthMode("register")} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>✨ Chưa có tài khoản? Mở gian hàng ngay</button>
          )}
        </div>
      </div>
    </div>
  );
};
