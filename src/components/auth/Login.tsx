import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

export const Login = ({ setIsLoggedIn, setRole, shift, setShift, startingCash, setStartingCash, installPrompt, handleInstallApp }: any) => {
  const [isRegistering, setIsRegistering] = useState(false);
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
        toast.success("Đăng nhập thành công!");
      }
    } catch (error: any) {
      toast.error("Sai tài khoản hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !phone || !email || !password) return toast.error("Vui lòng điền đủ thông tin!");
    if (password.length < 6) return toast.error("Mật khẩu phải từ 6 ký tự!");
    
    setLoading(true);
    try {
      // 1. Tạo tài khoản người dùng trên hệ thống Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      if (authData.user) {
        // 2. Tự động khởi tạo "Két sắt" (Không gian cửa hàng) cho người dùng mới
        const { error: storeError } = await supabase.from('stores').insert([{
          store_name: storeName,
          phone: phone,
          owner_id: authData.user.id
        }]);
        
        if (storeError) throw storeError;

        toast.success("Mở Cửa Hàng thành công! Đang tự động vào hệ thống...");
        
        // 3. Cho phép đăng nhập luôn ngay sau khi tạo
        setRole("admin");
        setIsLoggedIn(true);
      }
    } catch (error: any) {
      toast.error("Lỗi đăng ký: " + (error.message || "Email đã tồn tại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '20px' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#0f172a' }}>
            {isRegistering ? "TẠO CỬA HÀNG MỚI" : "HỆ THỐNG POS PRO"}
          </h1>
          <p style={{ margin: 0, color: '#64748b' }}>
            {isRegistering ? "Khởi tạo không gian bán hàng của riêng bạn" : "Đăng nhập để bắt đầu ca làm việc"}
          </p>
        </div>

        <form onSubmit={isRegistering ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* CÁC TRƯỜNG DÀNH RIÊNG CHO ĐĂNG KÝ */}
          {isRegistering && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>Tên Cửa Hàng</label>
                <input type="text" required value={storeName} onChange={e => setStoreName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} placeholder="VD: Tạp Hóa Cô Ba..." />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>Số điện thoại liên hệ</label>
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} placeholder="090..." />
              </div>
            </>
          )}

          {/* DÙNG CHUNG CHO CẢ LOGIN VÀ REGISTER */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>Email đăng nhập</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} placeholder="admin@cuahang.com" />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>Mật khẩu</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} placeholder="••••••••" />
          </div>

          {/* CHỌN CA CHỈ HIỆN KHI ĐĂNG NHẬP */}
          {!isRegistering && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>Chọn Ca</label>
                <select value={shift} onChange={e => setShift(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                  <option value="Ca Sáng">Ca Sáng</option>
                  <option value="Ca Chiều">Ca Chiều</option>
                  <option value="Ca Tối">Ca Tối</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>Tiền đầu ca</label>
                <input type="number" required value={startingCash} onChange={e => setStartingCash(Number(e.target.value))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: '10px', width: '100%', padding: '14px', background: isRegistering ? '#10b981' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background 0.3s' }}>
            {loading ? "ĐANG XỬ LÝ..." : (isRegistering ? "🚀 TẠO CỬA HÀNG MỚI" : "ĐĂNG NHẬP VÀO CA")}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px' }}>
            {isRegistering ? "Bạn đã có tài khoản rồi?" : "Bạn chưa có hệ thống quản lý?"}
          </p>
          <button onClick={() => setIsRegistering(!isRegistering)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', textDecoration: 'underline' }}>
            {isRegistering ? "👉 Quay lại Đăng nhập" : "✨ Đăng ký mở Cửa hàng dùng thử ngay"}
          </button>
        </div>

        {installPrompt && !isRegistering && (
          <button onClick={handleInstallApp} style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#f8fafc', color: '#0f172a', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            📱 Cài đặt App vào màn hình chính
          </button>
        )}
      </div>
    </div>
  );
};
