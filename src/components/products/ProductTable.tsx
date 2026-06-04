import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../../types';
import { cleanName, parseGift } from '../../utils/helpers';

interface ProductTableProps {
  products: Product[];
  handleSelectSuggest: (p: Product) => void;
  handleEdit: (id: any, field: string, old: any, isText?: boolean) => void;
  handleDelete: (id: any, name: string) => void;
  setPrintBarcodeProduct: (p: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products, handleSelectSuggest, handleEdit, handleDelete, setPrintBarcodeProduct
}) => {

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [filterConfig, setFilterConfig] = useState<Record<string, string[]>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (!e.target.closest('.filter-container')) {
        setOpenFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      for (const key in filterConfig) {
        const selectedValues = filterConfig[key];
        if (selectedValues && selectedValues.length > 0) {
          const pVal = String(p[key as keyof Product] || '');
          if (!selectedValues.includes(pVal)) return false;
        }
      }
      return true;
    });
  }, [products, filterConfig]);

  const sortedProducts = useMemo(() => {
    let sortableItems = [...filteredProducts];
    if (sortConfig !== null) {
      sortableItems.sort((a: any, b: any) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'stock' || sortConfig.key === 'import_price' || sortConfig.key === 'sale_price') {
          aVal = Number(aVal) || 0; bVal = Number(bVal) || 0;
        } else if (sortConfig.key === 'created_at' || sortConfig.key === 'expiry_date') {
          aVal = new Date(aVal || 0).getTime(); bVal = new Date(bVal || 0).getTime();
        } else {
          aVal = String(aVal || '').toLowerCase(); bVal = String(bVal || '').toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProducts, sortConfig]);

  // CHỈ GIỮ LẠI ICON PHỄU (SÁT VÀO TEXT)
  const getFilterIcon = (columnKey: keyof Product, onClick: (e: any) => void) => {
    const isFiltered = filterConfig[columnKey]?.length > 0;
    const isSorted = sortConfig?.key === columnKey;
    const isActive = isFiltered || isSorted; // Sáng lên nếu đang Lọc hoặc đang Sắp xếp

    return (
      <div
        onClick={onClick}
        style={{
          cursor: 'pointer', padding: '4px', borderRadius: '4px',
          background: isActive ? '#eff6ff' : 'transparent',
          color: isActive ? '#3b82f6' : '#cbd5e1', // Màu nhạt khi không active, xanh khi active
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', marginLeft: '6px' // Cách text một chút cho đẹp
        }}
        title="Tùy chọn hiển thị"
        onMouseOver={e => e.currentTarget.style.color = '#3b82f6'}
        onMouseOut={e => e.currentTarget.style.color = isActive ? '#3b82f6' : '#cbd5e1'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={isFiltered ? '#bfdbfe' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
      </div>
    );
  };

  // MENU XỔ XUỐNG CHỨA CẢ SẮP XẾP VÀ BỘ LỌC
  const renderFilterDropdown = (key: keyof Product, title: string, align: 'left' | 'right' = 'right') => {
    if (openFilter !== key) return null;
    
    const uniqueValues = Array.from(new Set(products.map(p => String(p[key] || '')))).sort();
    const currentFilters = filterConfig[key] || [];

    const handleToggle = (val: string) => {
      setFilterConfig(prev => {
        const current = prev[key] || [];
        const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
        return { ...prev, [key]: next };
      });
    };

    return (
      <div onClick={e => e.stopPropagation()} style={{ 
        position: 'absolute', top: '100%', marginTop: '6px',
        left: align === 'left' ? 0 : 'auto', right: align === 'right' ? 0 : 'auto', 
        background: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', 
        padding: '12px', zIndex: 999, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', 
        width: '220px', display: 'flex', flexDirection: 'column', cursor: 'default' 
      }}>
        
        {/* KHU VỰC SẮP XẾP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Sắp xếp</span>
          <button 
            onClick={() => { handleSort(key, 'asc'); setOpenFilter(null); }} 
            style={{ textAlign: 'left', padding: '8px 10px', background: sortConfig?.key === key && sortConfig?.direction === 'asc' ? '#eff6ff' : 'transparent', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: sortConfig?.key === key && sortConfig?.direction === 'asc' ? '#2563eb' : '#334155', fontWeight: sortConfig?.key === key && sortConfig?.direction === 'asc' ? 'bold' : 'normal' }}
            onMouseOver={e=>e.currentTarget.style.background='#f1f5f9'} onMouseOut={e=>e.currentTarget.style.background=sortConfig?.key === key && sortConfig?.direction === 'asc' ? '#eff6ff' : 'transparent'}
          >
            Tăng dần ▲
          </button>
          <button 
            onClick={() => { handleSort(key, 'desc'); setOpenFilter(null); }} 
            style={{ textAlign: 'left', padding: '8px 10px', background: sortConfig?.key === key && sortConfig?.direction === 'desc' ? '#eff6ff' : 'transparent', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: sortConfig?.key === key && sortConfig?.direction === 'desc' ? '#2563eb' : '#334155', fontWeight: sortConfig?.key === key && sortConfig?.direction === 'desc' ? 'bold' : 'normal' }}
            onMouseOver={e=>e.currentTarget.style.background='#f1f5f9'} onMouseOut={e=>e.currentTarget.style.background=sortConfig?.key === key && sortConfig?.direction === 'desc' ? '#eff6ff' : 'transparent'}
          >
            Giảm dần ▼
          </button>
        </div>

        {/* KHU VỰC BỘ LỌC */}
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Lọc dữ liệu</span>
        <div style={{ overflowY: 'auto', maxHeight: '160px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', paddingRight: '4px' }}>
          {uniqueValues.map((val, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
              <input type="checkbox" checked={currentFilters.includes(val)} onChange={() => handleToggle(val)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val || '(Trống)'}</span>
            </label>
          ))}
        </div>

        {/* CÁC NÚT HÀNH ĐỘNG */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => { setFilterConfig(prev => ({ ...prev, [key]: [] })); setSortConfig(null); setOpenFilter(null); }} style={{ flex: 1, padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>
            Bỏ chọn
          </button>
          <button onClick={() => setOpenFilter(null)} style={{ flex: 1, padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
            Áp dụng
          </button>
        </div>
      </div>
    );
  };

  // CÁC HÀM TÍNH TOÁN HIỂN THỊ
  const getInventoryAge = (dateStr?: string) => {
    if (!dateStr) return { text: "---", color: "#64748b", bg: "#f1f5f9" };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { text: dateStr.split('T')[0], color: "#64748b", bg: "#f1f5f9" };
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const created = new Date(d); created.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - created.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return { text: "Mới nhập hôm nay", color: "#059669", bg: "#dcfce7" }; 
      else if (diffDays <= 30) return { text: `Tồn ${diffDays} ngày`, color: "#475569", bg: "#f8fafc" }; 
      else return { text: `Tồn ${diffDays} ngày`, color: "#ef4444", bg: "#fef2f2" }; 
    } catch { return { text: dateStr, color: "#64748b", bg: "#f1f5f9" }; }
  };

  const getExactDateStr = (dateStr?: string) => {
    if (!dateStr) return "Không có thông tin ngày nhập";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `Nhập lúc: ${d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} ngày ${d.toLocaleDateString('vi-VN')}`;
    } catch { return dateStr; }
  };

  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', minHeight: '400px' }}>
      <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: '120px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#0f172a', textAlign: 'left', userSelect: 'none' }}>
              
              {/* CỘT 1: TÊN SP */}
              <th style={{ padding: '16px', fontWeight: '700', position: 'relative', width: '30%' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>Mã & Tên SP</span>
                  {getFilterIcon('name', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'name' ? null : 'name'); })}
                </div>
                {renderFilterDropdown('name', 'Tên SP', 'left')}
              </th>
              
              {/* CỘT 2: TỒN KHO */}
              <th style={{ padding: '16px', fontWeight: '700', position: 'relative', textAlign: 'center' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span>Tồn kho</span>
                  {getFilterIcon('stock', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'stock' ? null : 'stock'); })}
                </div>
                {renderFilterDropdown('stock', 'Tồn kho', 'left')}
              </th>
              
              {/* CỘT 3: GIÁ VỐN */}
              <th style={{ padding: '16px', fontWeight: '700', position: 'relative', textAlign: 'right' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span>Giá vốn</span>
                  {getFilterIcon('import_price', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'import_price' ? null : 'import_price'); })}
                </div>
                {renderFilterDropdown('import_price', 'Giá vốn', 'right')}
              </th>
              
              {/* CỘT 4: GIÁ BÁN */}
              <th style={{ padding: '16px', fontWeight: '700', position: 'relative', textAlign: 'right' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span>Giá Bán & Khuyến Mãi</span>
                  {getFilterIcon('sale_price', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'sale_price' ? null : 'sale_price'); })}
                </div>
                {renderFilterDropdown('sale_price', 'Giá bán', 'right')}
              </th>
              
              {/* CỘT 5: NGÀY NHẬP & HSD */}
              <th style={{ padding: '16px', fontWeight: '700', position: 'relative' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>Lịch sử & HSD</span>
                  {getFilterIcon('expiry_date', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'expiry_date' ? null : 'expiry_date'); })}
                </div>
                {renderFilterDropdown('expiry_date', 'Hạn sử dụng', 'right')}
              </th>
              
              <th style={{ padding: '16px', fontWeight: '700', textAlign: 'center', color: '#94a3b8' }}>Thao tác</th>
            </tr>
          </thead>
          
          <tbody>
            {sortedProducts.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '15px' }}>Trống rỗng! Không có sản phẩm nào phù hợp.</td></tr>
            ) : (
              sortedProducts.map((p, idx) => {
                const gift = parseGift(p.gift_info);
                const ageInfo = getInventoryAge(p.created_at);
                
                return (
                  <tr key={p.id || idx} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    
                    <td style={{ padding: '16px', maxWidth: '280px' }}>
                      <div style={{ color: '#3b82f6', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer', marginBottom: '4px' }} title="Click để copy mã" onClick={() => navigator.clipboard.writeText(p.product_code || '')}>
                        {p.product_code}
                      </div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px', cursor: 'pointer', lineHeight: '1.4' }} onClick={() => handleEdit(p.id, 'name', p.name, true)} title="Click để sửa tên">
                        {cleanName(p.name)}
                      </div>
                      {gift.text && (
                        <div onClick={() => handleEdit(p.id, 'gift_info', p.gift_info, true)} style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#f3e8ff', border: '1px solid #e9d5ff', borderRadius: '8px', cursor: 'pointer' }} title="Click để sửa quà tặng">
                          <span style={{ fontSize: '13px' }}>🎁</span><span style={{ color: '#7e22ce', fontSize: '12px', fontWeight: 'bold' }}>{gift.cond > 1 ? `Mua ${gift.cond} tặng:` : 'Tặng:'} {gift.text}</span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '6px 14px', background: p.stock <= 5 ? '#fef2f2' : '#ecfdf5', color: p.stock <= 5 ? '#ef4444' : '#10b981', borderRadius: '20px', fontWeight: '900', fontSize: '14px', border: `1px solid ${p.stock <= 5 ? '#fca5a5' : '#6ee7b7'}` }}>
                        {p.stock}
                      </span>
                    </td>

                    <td style={{ padding: '16px', textAlign: 'right', color: '#64748b', fontWeight: '600' }} onClick={() => handleEdit(p.id, 'import_price', p.import_price)}>
                      {(p.import_price || 0).toLocaleString()}đ
                    </td>

                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ fontWeight: '900', color: p.promo_price ? '#ef4444' : '#f59e0b', fontSize: '16px', cursor: 'pointer' }} onClick={() => handleEdit(p.id, p.promo_price ? 'promo_price' : 'sale_price', p.promo_price || p.sale_price)}>
                        {(p.promo_price || p.sale_price || 0).toLocaleString()}đ
                      </div>
                      {p.promo_price > 0 && (
                        <div style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through', cursor: 'pointer', marginTop: '4px' }} onClick={() => handleEdit(p.id, 'sale_price', p.sale_price)}>
                          Gốc: {(p.sale_price || 0).toLocaleString()}đ
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '4px 8px', background: ageInfo.bg, borderRadius: '8px', width: 'fit-content', border: `1px solid ${ageInfo.bg !== '#f8fafc' ? ageInfo.color : '#e2e8f0'}` }} title={getExactDateStr(p.created_at)}>
                          <span style={{ fontSize: '12px' }}>📥</span><span style={{ color: ageInfo.color, fontWeight: 'bold' }}>{ageInfo.text}</span>
                        </div>
                        <div onClick={() => handleEdit(p.id, 'expiry_date', p.expiry_date, true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', padding: '2px 4px', width: 'fit-content' }} title="Click để sửa HSD">
                          {p.expiry_date ? ( <><span style={{ fontSize: '12px' }}>⏳</span><span style={{ color: '#059669', fontWeight: 'bold' }}>{p.expiry_date}</span></> ) : ( <><span style={{ fontSize: '12px', opacity: 0.3 }}>➖</span><span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Không có HSD</span></> )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => handleSelectSuggest(p)} style={{ padding: '10px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px rgba(16,185,129,0.2)', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e=>e.currentTarget.style.transform='none'}>
                          🛒 Thêm
                        </button>
                        <button onClick={() => setPrintBarcodeProduct(p)} style={{ padding: '10px', background: '#f1f5f9', color: '#3b82f6', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.background='#f1f5f9'} title="In tem mã vạch">🖨️</button>
                        <button onClick={() => handleDelete(p.id, p.name)} style={{ padding: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#fee2e2'} onMouseOut={e=>e.currentTarget.style.background='#fef2f2'} title="Xóa sản phẩm">🗑️</button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
