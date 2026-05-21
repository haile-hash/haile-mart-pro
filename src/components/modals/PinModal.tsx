import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface PinModalProps {
  showPinModal: boolean;
  setShowPinModal: (val: boolean) => void;
  correctPin: string;
  onSuccess: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ showPinModal, setShowPinModal, correctPin, onSuccess }) => {
  const [pin, setPin] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showPinModal) {
      setPin("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showPinModal]);

  if (!showPinModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      toast.success("Xác thực Quản lý thành công!");
      setShowPinModal(false);
      onSuccess(); // Chạy hành động bị khóa
    } else {
      toast.error("Mã PIN không chính xác!");
      setPin("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10005 }} onClick={() => setShowPinModal(false)}>
      <div className="glass" style={{ padding: "30px", width: "320px", textAlign: "center", borderRadius: "20px" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔐</div>
        <h3 style={{ color: "#e11d48", margin: "0 0 5px 0", fontSize: "18px" }}>XÁC THỰC QUẢN LÝ</h3>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>Thao tác này cần mã PIN của Admin</p>
        
        <form onSubmit={handleSubmit}>
          <input 
            ref={inputRef}
            type="password" 
            placeholder="Nhập 4 số PIN..." 
            value={pin} 
            onChange={e => setPin(e.target.value)}
            maxLength={4}
            style={{ width: "100%", padding: "15px", borderRadius: "12px", border: "2px solid #fda4af", outline: "none", fontSize: "24px", textAlign: "center", letterSpacing: "10px", fontWeight: "bold", boxSizing: "border-box", marginBottom: "20px", color: "#be123c", background: "#fff1f2" }} 
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={() => setShowPinModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "var(--border-glass)", fontWeight: "bold", cursor: "pointer", color: "var(--text-main)" }}>Hủy</button>
            <button type="submit" style={{ flex: 1, padding: "12px", background: "#e11d48", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>XÁC NHẬN</button>
          </div>
        </form>
      </div>
    </div>
  );
};
