import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { toast } from 'react-hot-toast';

interface MarketingModalProps {
  showMarketingModal: boolean;
  setShowMarketingModal: (val: boolean) => void;
  marketingTier: string;
  setMarketingTier: (val: string) => void;
  marketingMsg: string;
  setMarketingMsg: (val: string) => void;
  customersData: any;
}

export const MarketingModal: React.FC<MarketingModalProps> = ({
  showMarketingModal,
  setShowMarketingModal,
  marketingTier,
  setMarketingTier,
  marketingMsg,
  setMarketingMsg,
  customersData
}) => {
  const [loading, setLoading] = useState(false);

  if (!showMarketingModal) return null;

  const handleSendMarketingEmail = async () => {
    if (!marketingMsg.trim()) return toast.error("Vui lòng nhập nội dung Email!");
    setLoading(true);
    let successCount = 0;
    
    // BỌC GIÁP: Đảm bảo customersData không bị undefined
    const safeCustomers = customersData || {};
    const keys = Object.keys(safeCustomers);

    if (keys.length === 0) {
      toast.error("Chưa có khách hàng nào trong hệ thống.");
      setLoading(false);
      return;
    }

    for (const phone of keys) {
      const c = safeCustomers[phone];
      if (c && c.email) {
        // Có thể áp dụng bộ lọc hạng thành viên (Kim cương, Vàng, Bạc) ở đây nếu cần
        try {
          await emailjs.send(
            "service_7ie990l", // Thay bằng Service ID của bạn
            "template_m1j9i7k", // Thay bằng Template ID gửi Marketing
            {
              to_email: c.email,
              to_name: c.name || "Quý khách",
              message: marketingMsg
            }
          );
          successCount++;
        } catch (e) {
          console.error("Lỗi gửi email cho " + c.email);
        }
      }
    }
    
    setLoading(false);
    toast.success(`Đã gửi thành công ${successCount} email!`);
    setShowMarketingModal(false);
    setMarketingMsg("");
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
      <div style={{ background: "white", padding: "24px", borderRadius: "12px", width: "500px", maxWidth: "90%" }}>
        <h2 style={{ marginTop: 0, color: "#e11d48" }}>💌 CHIẾN DỊCH EMAIL MARKETING</h2>
        
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Gửi đến đối tượng:</label>
          <select value={marketingTier} onChange={e => setMarketingTier(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
            <option value="Tất cả">Tất cả khách hàng có Email</option>
            <option value="Kim Cương">Chỉ gửi khách Kim Cương</option>
            <option value="Vàng">Chỉ gửi khách Vàng</option>
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Nội dung Email (HTML hỗ trợ):</label>
          <textarea 
            value={marketingMsg} 
            onChange={e => setMarketingMsg(e.target.value)} 
            rows={6}
            placeholder="Kính gửi Quý khách, nhân dịp sinh nhật cửa hàng, chúng tôi tặng bạn Voucher..."
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={() => setShowMarketingModal(false)} style={{ padding: "10px 16px", borderRadius: "6px", border: "none", cursor: "pointer", background: "#f1f5f9", fontWeight: "bold" }}>
            Hủy
          </button>
          <button onClick={handleSendMarketingEmail} disabled={loading} style={{ padding: "10px 16px", borderRadius: "6px", border: "none", cursor: "pointer", background: "#e11d48", color: "white", fontWeight: "bold" }}>
            {loading ? "Đang gửi..." : "🚀 Gửi Hàng Loạt"}
          </button>
        </div>
      </div>
    </div>
  );
};
