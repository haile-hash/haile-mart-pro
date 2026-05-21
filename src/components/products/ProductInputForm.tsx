import React from 'react';

interface ProductInputFormProps {
  handleAddProduct: (e: React.FormEvent) => void;
  newCode: string; handleCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  newName: string; setNewName: (val: string) => void;
  newCategory: string; setNewCategory: (val: string) => void;
  categories: string[];
  newImportPrice: string; setNewImportPrice: (val: string) => void;
  newPrice: string; setNewPrice: (val: string) => void;
  newPromoPrice: string; setNewPromoPrice: (val: string) => void;
  newExpiry: string; setNewExpiry: (val: string) => void;
  newGiftCondition: string; setNewGiftCondition: (val: string) => void;
  newGiftInfo: string; setNewGiftInfo: (val: string) => void;
  newStock: string; setNewStock: (val: string) => void;
  loading: boolean;
}

export const ProductInputForm: React.FC<ProductInputFormProps> = (props) => {
  return (
    <form onSubmit={props.handleAddProduct} style={{ background: "var(--bg-input)", padding: "15px", borderRadius: "8px", border: "1px solid var(--border-glass)", marginBottom: "15px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">MÃ SẢN PHẨM</span><input placeholder="VD: SP001" value={props.newCode} onChange={props.handleCodeChange} style={{ padding: "8px", borderRadius: "4px" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">TÊN HÀNG HÓA</span><input placeholder="VD: Bia Tiger" value={props.newName} onChange={e => props.setNewName(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">PHÂN LOẠI</span><input list="category-list" placeholder="Chọn / Nhập..." value={props.newCategory} onChange={e => props.setNewCategory(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /><datalist id="category-list">{props.categories.filter(c => c !== 'Tất cả').map(c => <option key={c} value={c} />)}</datalist></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">GIÁ VỐN (Đ)</span><input type="number" placeholder="0" value={props.newImportPrice} onChange={e => props.setNewImportPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">GIÁ BÁN (Đ)</span><input type="number" placeholder="0" value={props.newPrice} onChange={e => props.setNewPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 0.8fr 80px", gap: "10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label-red">GIÁ KHUYẾN MÃI</span><input type="number" placeholder="0 (Bỏ trống)" value={props.newPromoPrice} onChange={e => props.setNewPromoPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ef4444" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">HẠN SỬ DỤNG</span><input type="date" value={props.newExpiry} onChange={e => props.setNewExpiry(e.target.value)} style={{ padding: "8px", borderRadius: "4px", fontFamily: "sans-serif" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label-green">ĐIỀU KIỆN & QUÀ TẶNG</span><div style={{ display: "flex", gap: "4px" }}><input type="number" placeholder="Từ..." value={props.newGiftCondition} onChange={e => props.setNewGiftCondition(e.target.value)} style={{ width: "45px", padding: "8px", borderRadius: "4px", border: "1px solid #10b981" }} title="Số lượng cần mua" /><input type="text" placeholder="Tên quà..." value={props.newGiftInfo} onChange={e => props.setNewGiftInfo(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #10b981" }} /></div></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">SỐ LƯỢNG NHẬP</span><input type="number" placeholder="0" value={props.newStock} onChange={e => props.setNewStock(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}><button type="submit" disabled={props.loading} style={{ padding: "8px", height: "35px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>LƯU</button></div>
      </div>
    </form>
  );
};
