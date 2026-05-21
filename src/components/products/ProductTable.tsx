import React from 'react';
import { cleanName, parseGift, getActualPrice } from '../../utils/helpers';

interface ProductTableProps {
  role: string;
  sortedAndFilteredProducts: any[];
  requestSort: (key: string) => void;
  handleEdit: (id: any, field: string, old: any, isText?: boolean) => void;
  addToCart: (p: any) => void;
  handlePrintBarcode: (p: any) => void;
  handleDelete: (id: any, name: string) => void;
  // Dữ liệu dùng cho Popup Lọc
  sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
  filters: Record<string, any[]>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  openFilter: string | null;
  setOpenFilter: (val: string | null) => void;
  uniqueNames: string[];
  uniqueStocks: number[];
  uniqueImportPrices: number[];
  uniqueSalePrices: number[];
  uniqueExpiries: string[];
}

export const ProductTable: React.FC<ProductTableProps> = ({
  role, sortedAndFilteredProducts, requestSort, handleEdit,
  addToCart, handlePrintBarcode, handleDelete,
  sortConfig, filters, setFilters, openFilter, setOpenFilter,
  uniqueNames, uniqueStocks, uniqueImportPrices, uniqueSalePrices, uniqueExpiries
}) => {

  const handleFilterCheck = (col: string, val: any) => { 
    setFilters(prev => { 
      const cur = prev[col] || []; 
      if (cur.includes(val)) return { ...prev, [col]: cur.filter(v => v !== val) }; 
      return { ...prev, [col]: [...cur, val] } 
    });
  };

  const renderHeaderIcon = (colKey: string) => { 
    const isFiltered = filters[colKey]?.length > 0; 
    const isSortedAsc = sortConfig?.key === colKey && sortConfig.direction === 'asc'; 
    const isSortedDesc = sortConfig?.key === colKey && sortConfig.direction === 'desc'; 
    let icon = '🔽'; if (isSortedAsc) icon = '🔼'; if (isSortedDesc) icon = '🔽'; 
    return (
      <span onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === colKey ? null : colKey) }} 
            style={{ cursor: "pointer", color: isFiltered || sortConfig?.key === colKey ? '#ef4444' : '#94a3b8', fontSize: "10px", padding: "2px", marginLeft: "4px", border: isFiltered ? "1px dashed #ef4444" : "1px solid transparent", borderRadius: "2px" }} title="Lọc">
        {icon}
      </span>
    );
  };
  
  const renderFilterPopup = (colKey: string, title: string, uniqueValues: any[], formatVal?: (v: any) => string) => {
    if (openFilter !== colKey) return null;
    return (
      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: colKey === 'name' ? "0" : "50%", transform: colKey === 'name' ? "none" : "translateX(-50%)", background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "10px", zIndex: 999, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)", minWidth: "160px", textAlign: "left", color: "var(--text-main)", fontWeight: "normal", fontSize: "12px", display: "flex", flexDirection: "column" }}>
        <div style={{ marginTop: "10px", fontWeight: "bold", color: "var(--text-muted)", fontSize: "10px", marginBottom: "6px" }}>LỌC {title}:</div>
        <div style={{ overflowY: "auto", flex: 1, maxHeight: "150px", border: "1px solid var(--border-glass)", borderRadius: "4px", padding: "4px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px", cursor: "pointer", borderBottom: "1px dashed var(--border-glass)" }}>
            <input type="checkbox" checked={!filters[colKey] || filters[colKey].length === 0} onChange={() => setFilters(prev => ({ ...prev, [colKey]: [] }))} />
            <span style={{ color: "#3b82f6", fontWeight: "bold" }}>Tất cả</span>
          </label>
          {uniqueValues.map((v, i) => (
            <label key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px", cursor: "pointer", borderBottom: "1px dashed var(--border-glass)" }}>
              <input type="checkbox" checked={filters[colKey]?.includes(v) || false} onChange={() => handleFilterCheck(colKey, v)} />
              <span>{formatVal ? formatVal(v) : v}</span>
            </label>
          ))}
        </div>
        {filters[colKey]?.length > 0 && (<div style={{ marginTop: "8px", textAlign: "center", cursor: "pointer", color: "#ef4444", fontWeight: "bold", fontSize: "11px", padding: "4px" }} onClick={() => setFilters(prev => ({ ...prev, [colKey]: [] }))}>❌ Bỏ lọc</div>)}
      </div>
    );
  };

  return (
    <div style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ color: "#10b981", fontSize: "10px", borderBottom: "2px solid var(--border-glass)", position: "sticky", top: 0, background: "var(--bg-glass)", zIndex: 1 }}>
            <th style={{ textAlign: "left", padding: "10px 4px" }}><div style={{ display: "flex", alignItems: "center", gap: "4px", width: "max-content" }}><span onClick={() => requestSort('name')} style={{ cursor: "pointer", userSelect: "none" }}>SẢN PHẨM</span>{renderHeaderIcon('name')}</div>{renderFilterPopup('name', 'TÊN SẢN PHẨM', uniqueNames)}</th>
            <th style={{ textAlign: "center", padding: "10px 4px" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}><span onClick={() => requestSort('stock')} style={{ cursor: "pointer", userSelect: "none" }}>TỒN</span>{renderHeaderIcon('stock')}</div>{renderFilterPopup('stock', 'SỐ LƯỢNG TỒN', uniqueStocks)}</th>
            {role === 'admin' && (<th style={{ textAlign: "center", padding: "10px 4px" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}><span onClick={() => requestSort('import_price')} style={{ cursor: "pointer", userSelect: "none" }}>GIÁ VỐN</span>{renderHeaderIcon('import_price')}</div>{renderFilterPopup('import_price', 'GIÁ VỐN', uniqueImportPrices, (v) => v.toLocaleString() + 'đ')}</th>)}
            <th style={{ textAlign: "center", padding: "10px 4px" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}><span onClick={() => requestSort('sale_price')} style={{ cursor: "pointer", userSelect: "none" }}>GIÁ BÁN</span>{renderHeaderIcon('sale_price')}</div>{renderFilterPopup('sale_price', 'GIÁ BÁN', uniqueSalePrices, (v) => v.toLocaleString() + 'đ')}</th>
            <th style={{ textAlign: "center", padding: "10px 4px", lineHeight: "1.2" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}><span onClick={() => requestSort('expiry_date')} style={{ cursor: "pointer", userSelect: "none" }}>HẠN SỬ DỤNG</span>{renderHeaderIcon('expiry_date')}</div>{renderFilterPopup('expiry_date', 'HẠN SỬ DỤNG', uniqueExpiries, (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '---')}</th>
            <th style={{ textAlign: "right", padding: "10px 4px" }}></th>
          </tr>
        </thead>
        <tbody>
          {sortedAndFilteredProducts.map(p => {
            const isP = p.promo_price > 0; 
            const d = Math.floor(Math.abs(new Date().getTime() - new Date(p.created_at).getTime()) / 86400000); 
            const isOutOfStock = p.stock <= 0; 
            const isNearExpiry = p.expiry_date && (new Date(p.expiry_date).getTime() - new Date().getTime()) / 86400000 <= 45 && !isOutOfStock; 
            const isLowStock = p.stock > 0 && p.stock < 10; 
            const gift = parseGift(p.gift_info); 
            let dText = "Mới nhập hôm nay"; if (d === 1) dText = "Nhập hôm qua"; else if (d > 1) dText = `${d} ngày trước`;
            
            return (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border-glass)", background: isNearExpiry ? "rgba(239, 68, 68, 0.1)" : "transparent" }}>
                <td style={{ padding: "12px 4px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "bold" }}>{role === 'admin' ? p.name : cleanName(p.name)} {isNearExpiry && <span style={{ color: "#ef4444", fontSize: "9px", border: "1px solid #ef4444", padding: "1px 2px", borderRadius: "2px" }}>⚠️</span>} {p.isHappyHour && <span style={{ color: "#ea580c", fontSize: "9px", fontStyle: "italic" }}>[Giờ Vàng]</span>}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{p.product_code} • <span style={{ cursor: role === 'admin' ? 'pointer' : 'default', textDecoration: role === 'admin' ? 'underline' : 'none' }} onClick={() => role === 'admin' && handleEdit(p.id, 'category', p.category || "Khác", true)}>{p.category || "Khác"}</span></div>
                  {gift.text ? (<div style={{ fontSize: "10px", color: "#10b981", fontWeight: "bold", cursor: role === 'admin' ? 'pointer' : 'default', marginTop: "2px" }} onClick={() => role === 'admin' && handleEdit(p.id, 'gift_info', p.gift_info, true)}>🎁 Tặng: {gift.text} {gift.cond > 1 ? `(Mua ≥ ${gift.cond})` : ''}</div>) : (role === 'admin' && <div style={{ fontSize: "9px", color: "var(--border-glass)", cursor: "pointer", marginTop: "2px" }} onClick={() => handleEdit(p.id, 'gift_info', '', true)}>+ Thêm quà</div>)}
                </td>
                <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "14px", color: isOutOfStock ? "var(--text-muted)" : (isLowStock ? "#ef4444" : "var(--text-main)") }}>{p.stock} {isLowStock && <span title="Sắp hết hàng" style={{ fontSize: "10px" }}>📉</span>}</td>
                {role === 'admin' && <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>{p.import_price?.toLocaleString()}</td>}
                <td style={{ textAlign: "center" }}>
                  <div style={{ color: isP ? "var(--text-muted)" : "#10b981", textDecoration: isP ? "line-through" : "none", fontSize: isP ? "11px" : "14px", fontWeight: "bold", cursor: role === 'admin' ? "pointer" : "default" }} onClick={() => role === 'admin' && handleEdit(p.id, 'sale_price', p.sale_price)}>{p.sale_price.toLocaleString()}</div>
                  {isP ? (<div style={{ color: "#ef4444", fontWeight: "900", fontSize: "14px", cursor: role === 'admin' ? "pointer" : "default" }} onClick={() => role === 'admin' && handleEdit(p.id, 'promo_price', p.promo_price)}>🔥 {p.promo_price.toLocaleString()}</div>) : (role === 'admin' && <div style={{ fontSize: "9px", color: "var(--border-glass)", cursor: "pointer", marginTop: "2px" }} onClick={() => handleEdit(p.id, 'promo_price', 0)}>🏷️ +Thêm KM</div>)}
                </td>
                <td style={{ textAlign: "center", fontSize: "11px" }}>
                  <div style={{ color: isNearExpiry ? "#ef4444" : "#b91c1c", fontWeight: "bold", cursor: role === 'admin' ? "pointer" : "default" }} onClick={() => role === 'admin' && handleEdit(p.id, 'expiry_date', p.expiry_date, true)}>{isOutOfStock ? "---" : (p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('vi-VN') : "---")}</div>
                  <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>{isOutOfStock ? "---" : dText}</div>
                </td>
                <td style={{ textAlign: "right", padding: "12px 4px" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                    <button className="add-to-cart-btn" onClick={() => addToCart(p)}>+ GIỎ</button>
                    {role === 'admin' && <button onClick={() => handlePrintBarcode(p)} style={{ padding: "6px 8px", background: "var(--border-glass)", color: "var(--text-main)", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }} title="In tem mã vạch">🖨️ Tem</button>}
                    {role === 'admin' && <button onClick={() => handleDelete(p.id, p.name)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px", padding: 0 }}>🗑️</button>}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
};
