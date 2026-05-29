/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

export const StoreSettingsModal = ({ onClose }: { onClose: () => void }) => {
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Lấy data cũ từ bộ nhớ điền vào Form
  useEffect(() => {
    const savedStore = JSON.parse(window.localStorage.getItem("mart_current_store") || "{}");
    setStoreName(savedStore.store_name || "");
    setPhone(savedStore.phone || "");
    setAddress(savedStore.address || "");
    setTaxCode(savedStore.tax_code || "");
  }, []);

  // Lưu thông tin lên Database và LocalStorage
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Không tìm thấy phiên đăng nhập");

      // Cập nhật Database
      const { error } = await supabase
        .from('stores')
        .update({
          store_name: storeName,
          phone: phone,
          address: address,
          tax_code: taxCode
        })
        .eq('owner_id', user.id);

      if (error) throw error;

      // Cập nhật LocalStorage
      const updatedStore = { store_name: storeName, phone, address, tax_code };
      window.localStorage.setItem("mart_current_store", JSON.stringify(updatedStore));

      toast.success("Đã lưu thông tin cửa hàng thành công!");
      
      // Load lại trang nhẹ để Header và Bill nhận tên mới
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      toast.error("Lỗi cập nhật: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '400px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', color: '#1e293b', display: 'flex', justifyContent: 'space-between' }}>
          ⚙️ Cấu hình Cửa Hàng
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
        </h2>
        
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Tên Cửa Hàng / Thương hiệu</label>
            <input type="text" required value={storeName} onChange={e => setStoreName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Số Điện Thoại Hotline</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Địa Chỉ Kinh Doanh</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ví dụ: Số 123 Lê Lợi, Quận 1..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Mã Số Thuế (Tùy chọn)</label>
            <input type="text" value={taxCode} onChange={e => setTaxCode(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
