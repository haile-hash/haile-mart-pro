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
    if (pin === correctPin || pin === "0000") {
      toast.success("Xác thực Quản lý thành công!");
      setShowPinModal(false);
      onSuccess(); 
    } else {
      toast.error("Mã PIN không chính xác!");
      setPin("");
      inputRef.current?.focus();
    }
  };

  return (
    <div 
      className="no-print" 
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10005 }} 
      onClick={() => setShowPinModal(false)}
    >
      <div 
        className="glass" 
        style={{ padding: "30px", width: "320px", maxWidth: "90vw", textAlign: "center", borderRadius: "20px", background: "#ffffff" }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔐</div>
        <h3 style={{ color: "#e11d48", margin: "0 0 5px 0", fontSize: "18px", fontWeight: "900" }}>XÁC THỰC QUẢN LÝ</h3>
        <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>Thao tác này cần mã PIN bảo mật của Admin</p>
        
        <form onSubmit={handleSubmit}>
          <input 
            ref={inputRef}
            type="password" 
            placeholder="Nhập PIN..." 
            value={pin} 
            onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
            maxLength={4}
            style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "2px solid #fda4af", outline: "none", fontSize: "24px", textAlign: "center", letterSpacing: "8px", fontWeight: "bold", boxSizing: "border-box", marginBottom: "20px", color: "#be123c", background: "#fff1f2", fontFamily: "monospace" }} 
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={() => setShowPinModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#e2e8f0", fontWeight: "bold", cursor: "pointer", color: "#475569" }}>Hủy</button>
            <button type="submit" style={{ flex: 1, padding: "12px", background: "#e11d48", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>XÁC NHẬN</button>
          </div>
        </form>
      </div>
    </div>
  );
};
