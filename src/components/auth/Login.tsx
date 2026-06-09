/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

export const Login = ({ setIsLoggedIn, setRole, shift, setShift, startingCash, setStartingCash, installPrompt, handleInstallApp }: any) => {
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot" | "update_password" | "google_onboarding">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Các state thông tin cửa hàng
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [address, setAddress] = useState("");
  const [googleUser, setGoogleUser] = useState<any>(null);

  // TỰ ĐỘNG KIỂM TRA USER SAU KHI ĐĂNG NHẬP GOOGLE QUAY LẠI
  useEffect(() => {
    const checkGoogleUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Kiểm tra xem tài khoản này đã khởi tạo cửa hàng chưa
        const { data: existingStore } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (existingStore) {
          // Nếu đã có cửa hàng, cho vào thẳng bên trong luôn
          setRole("admin");
          setIsLoggedIn(true);
        } else {
          // Nếu chưa có cửa hàng, giữ chân lại giao diện điền thông tin bổ sung
          setGoogleUser(user);
          setAuthMode("google_onboarding");
          // Tự động lấy tên Google gợi ý làm tên cửa hàng ban đầu cho họ sửa
          setStoreName(`Cửa hàng của ${user.user_metadata?.full_name || ''}`);
        }
      }
    };
    
    checkGoogleUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setAuthMode('update_password');
    });
    return () => subscription.unsubscribe();
  }, [setIsLoggedIn, setRole]);

  // Hàm xử lý Đăng nhập / Đăng ký bằng Google gốc
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error("Lỗi kết nối Google: " + error.message);
      setLoading(false);
    }
  };

  // Hàm xử lý khi bấm nút xác nhận ở các Form
  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. LUỒNG ĐĂNG NHẬP THƯỜNG
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) { setRole("admin"); setIsLoggedIn(true); toast.success("Chào mừng quay trở lại!"); }
      } 
      // 2. LUỒNG ĐĂNG KÝ EMAIL THƯỜNG
      else if (authMode === 'register') {
        if (!storeName || !phone || !email || !password) throw new Error("Vui lòng điền đủ thông tin!");
        if (password.length < 6) throw new Error("Mật khẩu bảo mật phải từ 6 ký tự!");
        
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        
        if (authData.user) {
          const { error: storeError } = await supabase.from('stores').insert([{ 
            store_name: storeName, 
            phone: phone, 
            tax_code: taxCode, // Lưu thêm MST nếu có
            address: address,   // Lưu thêm địa chỉ nếu có
            owner_id: authData.user.id 
          }]);
          if (storeError) throw storeError;
          toast.success("Khởi tạo không gian SaaS thành công!");
          setRole("admin"); setIsLoggedIn(true);
        }
      }
      // 3. LUỒNG BẮT THÔNG TIN CHO USER ĐĂNG KÝ BẰNG GOOGLE MỚI TINH
      else if (authMode === 'google_onboarding') {
        if (!storeName || !phone || !address) throw new Error("Vui lòng nhập đầy đủ các trường bắt buộc!");
        const currentUser = googleUser || (await supabase.auth.getUser()).data.user;
        
        if (!currentUser) throw new Error("Không tìm thấy thông tin phiên đăng nhập Google!");

        // Tiến hành ghi nhận thông tin cửa hàng vào bảng dữ liệu cấu trúc doanh nghiệp của bạn
        const { error: storeError } = await supabase.from('stores').insert([{ 
          store_name: storeName, 
          phone: phone, 
          tax_code: taxCode, 
          address: address, 
          owner_id: currentUser.id 
        }]);

        if (storeError) throw storeError;
        
        toast.success("Cấu hình thông tin doanh nghiệp thành công!");
        setRole("admin"); 
        setIsLoggedIn(true);
      }
      // 4. CÁC LUỒNG QUÊN/ĐỔI MẬT KHẨU
      else if (authMode === 'forgot') {
        if (!email) throw new Error("Vui lòng nhập email đã đăng ký!");
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
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
      <div style={{ background: '#ffffff', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.05)', width: '100%', maxWidth: '440px', border: '1px solid #f1f5f9' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '16px', background: authMode === 'google_onboarding' ? '#10b981' : '#2563eb', color: 'white', fontSize: '28px', marginBottom: '16px' }}>
            {authMode === 'google_onboarding' ? "🏪" : authMode === 'register' ? "🚀" : authMode === 'forgot' ? "⏳" : authMode === 'update_password' ? "🔐" : "📦"}
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            {authMode === 'google_onboarding' ? "THIẾT LẬP CỬA HÀNG" : authMode === 'register' ? "MỞ CỬA HÀNG MỚI" : authMode === 'forgot' ? "KHÔI PHỤC MẬT KHẨU" : authMode === 'update_password' ? "ĐỔI MẬT KHẨU" : "HỆ THỐNG POS PRO"}
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            {authMode === 'google_onboarding' ? "Vui lòng hoàn tất thông tin để khởi tạo hệ thống" : "Nền tảng quản lý bán hàng đa cửa hàng Cloud ERP"}
          </p>
        </div>

        <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* CÁC TRƯỜNG HIỂN THỊ KHI ĐĂNG KÝ THƯỜNG HOẶC ĐĂNG KÝ BẰNG GOOGLE LẦN ĐẦU */}
          {(authMode === 'register' || authMode === 'google_onboarding') && (
            <>
              <input type="text" required value={storeName} onChange={e => setStoreName(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} placeholder="Tên Cửa Hàng / Thương Hiệu *" />
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} placeholder="Số Điện Thoại Liên Hệ *" />
              <input type="text" value={taxCode} onChange={e => setTaxCode(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} placeholder="Mã Số Thuế Doanh Nghiệp (Nếu có)" />
              <input type="text" required value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} placeholder="Địa Chỉ Cửa Hàng *" />
            </>
          )}

          {/* CÁC TRƯỜNG ĐĂNG NHẬP / ĐĂNG KÝ BẰNG EMAIL TRUYỀN THỐNG */}
          {(authMode !== 'update_password' && authMode !== 'google_onboarding') && (
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} placeholder="Tài khoản Email" />
          )}
          
          {(authMode === 'login' || authMode === 'register' || authMode === 'update_password') && (
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} placeholder="Mật khẩu bảo mật" />
          )}

          {authMode === 'login' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select value={shift} onChange={e => setShift(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', outline: 'none', fontSize: '14px' }}>
                <option value="Ca Sáng">🌅 Ca Sáng</option>
                <option value="Ca Chiều">🌇 Ca Chiều</option>
                <option value="Ca Tối">🌃 Ca Tối</option>
              </select>
              <input type="number" required value={startingCash} onChange={e => setStartingCash(Number(e.target.value))} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} placeholder="Tiền đầu ca" />
            </div>
          )}

          {authMode === 'login' && (
            <div style={{ textAlign: 'right' }}>
              <span onClick={() => setAuthMode("forgot")} style={{ color: '#2563eb', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>Quên mật khẩu?</span>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: '8px', width: '100%', padding: '16px', background: authMode === 'google_onboarding' ? '#10b981' : '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? "ĐANG XỬ LÝ..." : (authMode === 'google_onboarding' ? "HOÀN TẤT THIẾT LẬP" : authMode === 'register' ? "ĐĂNG KÝ" : authMode === 'forgot' ? "LẤY LẠI MẬT KHẨU" : authMode === 'update_password' ? "LƯU MẬT KHẨU" : "ĐĂNG NHẬP")}
          </button>
        </form>

        {/* NÚT ĐĂNG NHẬP GOOGLE CHỈ HIỆN Ở GIAO DIỆN CHƯA VÀO TRONG */}
        {(authMode === 'login' || authMode === 'register') && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
              <span style={{ padding: '0 12px', color: '#94a3b8', fontSize: '12px', fontWeight: '700' }}>HOẶC</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            </div>

            <button onClick={handleGoogleLogin} disabled={loading} type="button" style={{ width: '100%', padding: '14px', background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Tiếp tục với Google
            </button>
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          {authMode === 'google_onboarding' ? (
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Đang cấu hình thông tin cho: <b>{googleUser?.email}</b></p>
          ) : authMode !== 'login' ? (
            <button onClick={() => setAuthMode("login")} style={{ background: 'none', border: 'none', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>← Quay lại đăng nhập</button>
          ) : (
            <button onClick={() => setAuthMode("register")} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>✨ Chưa có tài khoản? Mở gian hàng ngay</button>
          )}
        </div>
      </div>
    </div>
  );
};
