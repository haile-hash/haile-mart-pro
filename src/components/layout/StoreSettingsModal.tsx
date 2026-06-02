import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

export const StoreSettingsModal = ({ onClose }: { onClose: () => void }) => {
  const [storeName, setStoreName] = useState("");
  const [logoUrl, setLogoUrl] = useState(""); // Thêm state cho Logo
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Kéo dữ liệu cũ từ Local Storage lên form
    const savedStore = JSON.parse(window.localStorage.getItem("mart_current_store") || "{}");
    setStoreName(savedStore.store_name || "");
    setLogoUrl(savedStore.logo_url || ""); // Load logo
    setPhone(savedStore.phone || "");
    setAddress(savedStore.address || "");
    setTaxCode(savedStore.tax_code || "");
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Không tìm thấy phiên đăng nhập");

      // Cập nhật lên Supabase (Đảm bảo bảng 'stores' của bạn có cột 'logo_url')
      const { error } = await supabase
        .from('stores')
        .update({
          store_name: storeName,
          logo_url: logoUrl, // Lưu logo
          phone: phone,
          address: address,
          tax_code: taxCode
        })
        .eq('owner_id', user.id);

      if (error) throw error;

      // Lưu đè lại Local Storage để App nhận diện ngay
      const updatedStore = { store_name: storeName, logo_url: logoUrl, phone, address, tax_code };
      window.localStorage.setItem("mart_current_store", JSON.stringify(updatedStore));

      toast.success("Cập nhật thông tin cửa hàng thành công!");
      
      // Load nhẹ lại trang để cập nhật Header và Form in
      setTimeout(() => {
        window.location.reload();
      }, 800);
      
    } catch (error: any) {
      toast.error("Lỗi cập nhật: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }} onClick={onClose}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', width: '400px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', color: '#1e293b', display: 'flex', justifyContent: 'space-between' }}>
          ⚙️ Thông Tin Cửa Hàng
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
        </h2>
        
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Tên Cửa Hàng / Thương hiệu</label>
            <input type="text" required value={storeName} onChange={e => setStoreName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', background: '#f8fafc', color: '#1e293b', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
          </div>
          <div>
            {/* TRƯỜNG NHẬP LOGO MỚI */}
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Link Ảnh Logo (URL)</label>
            <input type="text" value={logoUrl} placeholder="Ví dụ: https://imgur.com/abc.png" onChange={e => setLogoUrl(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', background: '#f8fafc', color: '#1e293b', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Số Điện Thoại Hotline</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', background: '#f8fafc', color: '#1e293b', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Địa Chỉ Kinh Doanh</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Số nhà, đường, phường, quận..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', background: '#f8fafc', color: '#1e293b', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Mã Số Thuế (Tùy chọn)</label>
            <input type="text" value={taxCode} onChange={e => setTaxCode(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', background: '#f8fafc', color: '#1e293b', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}>Hủy</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? "Đang lưu..." : "Lưu Thông Tin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
