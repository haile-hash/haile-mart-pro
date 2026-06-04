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
      if (!e.target.closest('.filter-container')) setOpenFilter(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
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

  const getFilterIcon = (columnKey: keyof Product, onClick: (e: any) => void) => {
    const isActive = filterConfig[columnKey]?.length > 0 || sortConfig?.key === columnKey;
    return (
      <div
        onClick={onClick}
        style={{
          cursor: 'pointer', padding: '4px', borderRadius: '4px',
          background: isActive ? '#e0f2fe' : 'transparent',
          color: isActive ? '#2563eb' : '#94a3b8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', marginLeft: '6px'
        }}
        title="Sắp xếp & Lọc"
        onMouseOver={e => e.currentTarget.style.color = '#2563eb'}
        onMouseOut={e => e.currentTarget.style.color = isActive ? '#2563eb' : '#94a3b8'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={filterConfig[columnKey]?.length > 0 ? '#bfdbfe' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
      </div>
    );
  };

  const renderFilterDropdown = (key: keyof Product, title: string, align: 'left' | 'right' | 'center' = 'left') => {
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
        position: 'absolute', top: '100%', marginTop: '8px',
        left: align === 'left' ? 0 : (align === 'center' ? '50%' : 'auto'),
        right: align === 'right' ? 0 : 'auto', 
        transform: align === 'center' ? 'translateX(-50%)' : 'none',
        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', 
        padding: '16px', zIndex: 999, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', 
        width: '240px', display: 'flex', flexDirection: 'column', cursor: 'default' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Sắp xếp</span>
          <button onClick={() => { handleSort(key); setOpenFilter(null); }} style={{ textAlign: 'left', padding: '8px 12px', background: sortConfig?.key === key && sortConfig?.direction === 'asc' ? '#eff6ff' : 'transparent', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: sortConfig?.key === key && sortConfig?.direction === 'asc' ? '#2563eb' : '#334155', fontWeight: sortConfig?.key === key && sortConfig?.direction === 'asc' ? '600' : '500' }}>
            Tăng dần ▲
          </button>
          <button onClick={() => { setSortConfig({key, direction: 'desc'}); setOpenFilter(null); }} style={{ textAlign: 'left', padding: '8px 12px', background: sortConfig?.key === key && sortConfig?.direction === 'desc' ? '#eff6ff' : 'transparent', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: sortConfig?.key === key && sortConfig?.direction === 'desc' ? '#2563eb' : '#334155', fontWeight: sortConfig?.key === key && sortConfig?.direction === 'desc' ? '600' : '500' }}>
            Giảm dần ▼
          </button>
        </div>

        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Lọc dữ liệu</span>
        <div style={{ overflowY: 'auto', maxHeight: '160px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {uniqueValues.map((val, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1e293b', cursor: 'pointer', fontWeight: '400' }}>
              <input type="checkbox" checked={currentFilters.includes(val)} onChange={() => handleToggle(val)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val || '(Trống)'}</span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { setFilterConfig(prev => ({ ...prev, [key]: [] })); setSortConfig(null); setOpenFilter(null); }} style={{ flex: 1, padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>Bỏ chọn</button>
          <button onClick={() => setOpenFilter(null)} style={{ flex: 1, padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>Áp dụng</button>
        </div>
      </div>
    );
  };

  const getInventoryAge = (dateStr?: string) => {
    if (!dateStr) return { text: "---", color: "#94a3b8", dot: "bg-slate-300" };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { text: dateStr.split('T')[0], color: "#64748b", dot: "bg-slate-400" };
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const created = new Date(d); created.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - created.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return { text: "Mới nhập hôm nay", color: "#059669", dot: "#10b981" }; 
      else if (diffDays <= 30) return { text: `Tồn ${diffDays} ngày`, color: "#475569", dot: "#f59e0b" }; 
      else return { text: `Tồn ${diffDays} ngày`, color: "#ef4444", dot: "#ef4444" }; 
    } catch { return { text: dateStr, color: "#94a3b8", dot: "#cbd5e1" }; }
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', userSelect: 'none' }}>
              
              {/* MÃ & TÊN SP (Căn Trái) */}
              <th style={{ padding: '12px 16px', position: 'relative' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mã & Tên SP</span>
                  {getFilterIcon('name', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'name' ? null : 'name'); })}
                </div>
                {renderFilterDropdown('name', 'Tên SP', 'left')}
              </th>
              
              {/* TỒN KHO (Căn Giữa) */}
              <th style={{ padding: '12px 16px', position: 'relative' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tồn kho</span>
                  {getFilterIcon('stock', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'stock' ? null : 'stock'); })}
                </div>
                {renderFilterDropdown('stock', 'Tồn kho', 'center')}
              </th>
              
              {/* GIÁ VỐN (Căn Phải) */}
              <th style={{ padding: '12px 16px', position: 'relative' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giá vốn</span>
                  {getFilterIcon('import_price', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'import_price' ? null : 'import_price'); })}
                </div>
                {renderFilterDropdown('import_price', 'Giá vốn', 'right')}
              </th>
              
              {/* GIÁ BÁN (Căn Phải) */}
              <th style={{ padding: '12px 16px', position: 'relative' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giá Bán & Khuyến Mãi</span>
                  {getFilterIcon('sale_price', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'sale_price' ? null : 'sale_price'); })}
                </div>
                {renderFilterDropdown('sale_price', 'Giá bán', 'right')}
              </th>
              
              {/* LỊCH SỬ & HSD (Căn Trái) */}
              <th style={{ padding: '12px 16px', position: 'relative' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lịch sử & HSD</span>
                  {getFilterIcon('expiry_date', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'expiry_date' ? null : 'expiry_date'); })}
                </div>
                {renderFilterDropdown('expiry_date', 'Hạn sử dụng', 'right')}
              </th>
              
              {/* THAO TÁC (Căn Giữa) */}
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thao tác</span>
              </th>
            </tr>
          </thead>
          
          <tbody>
            {sortedProducts.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '14px' }}>Không tìm thấy sản phẩm nào.</td></tr>
            ) : (
              sortedProducts.map((p, idx) => {
                const gift = parseGift(p.gift_info);
                const ageInfo = getInventoryAge(p.created_at);
                
                return (
                  <tr key={p.id || idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    
                    {/* CỘT 1: TÊN & MÃ */}
                    <td style={{ padding: '12px 16px', maxWidth: '280px' }}>
                      <div style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace', fontWeight: '600', marginBottom: '4px' }} title="Mã SP (Click để copy)" onClick={() => navigator.clipboard.writeText(p.product_code || '')}>
                        {p.product_code}
                      </div>
                      <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px', cursor: 'pointer', lineHeight: '1.4' }} onClick={() => handleEdit(p.id, 'name', p.name, true)} title="Click để sửa tên">
                        {cleanName(p.name)}
                      </div>
                      {gift.text && (
                        <div onClick={() => handleEdit(p.id, 'gift_info', p.gift_info, true)} style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: '#f5f3ff', border: '1px solid #e9d5ff', borderRadius: '4px', cursor: 'pointer' }}>
                          <span style={{ color: '#8b5cf6', fontSize: '11px', fontWeight: '600' }}>🎁 {gift.cond > 1 ? `Mua ${gift.cond} tặng:` : 'Tặng:'} {gift.text}</span>
                        </div>
                      )}
                    </td>

                    {/* CỘT 2: TỒN KHO */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 10px', background: p.stock <= 5 ? '#fef2f2' : '#ecfdf5', color: p.stock <= 5 ? '#ef4444' : '#059669', borderRadius: '12px', fontWeight: '700', fontSize: '13px' }}>
                        {p.stock}
                      </span>
                    </td>

                    {/* CỘT 3: GIÁ VỐN */}
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b', fontWeight: '500' }} onClick={() => handleEdit(p.id, 'import_price', p.import_price)}>
                      {(p.import_price || 0).toLocaleString()}đ
                    </td>

                    {/* CỘT 4: GIÁ BÁN */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', color: p.promo_price ? '#ef4444' : '#0f172a', fontSize: '14px', cursor: 'pointer' }} onClick={() => handleEdit(p.id, p.promo_price ? 'promo_price' : 'sale_price', p.promo_price || p.sale_price)}>
                        {(p.promo_price || p.sale_price || 0).toLocaleString()}đ
                      </div>
                      {p.promo_price > 0 && (
                        <div style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through', cursor: 'pointer', marginTop: '2px' }} onClick={() => handleEdit(p.id, 'sale_price', p.sale_price)}>
                          {(p.sale_price || 0).toLocaleString()}đ
                        </div>
                      )}
                    </td>

                    {/* CỘT 5: LỊCH SỬ & HSD */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ageInfo.dot }}></span>
                          <span style={{ color: ageInfo.color, fontSize: '12px', fontWeight: '500' }}>{ageInfo.text}</span>
                        </div>
                        <div onClick={() => handleEdit(p.id, 'expiry_date', p.expiry_date, true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.expiry_date ? '#3b82f6' : '#cbd5e1' }}></span>
                          <span style={{ color: p.expiry_date ? '#334155' : '#94a3b8', fontSize: '12px', fontStyle: p.expiry_date ? 'normal' : 'italic' }}>
                            {p.expiry_date ? `HSD: ${p.expiry_date}` : 'Không có HSD'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* CỘT 6: THAO TÁC */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => handleSelectSuggest(p)} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '12px', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#2563eb'} onMouseOut={e=>e.currentTarget.style.background='#3b82f6'}>
                          Thêm
                        </button>
                        <button onClick={() => setPrintBarcodeProduct(p)} style={{ padding: '6px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e=>{e.currentTarget.style.background='#e2e8f0'; e.currentTarget.style.color='#334155'}} onMouseOut={e=>{e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#64748b'}} title="In mã vạch">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)} style={{ padding: '6px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e=>{e.currentTarget.style.background='#fee2e2'; e.currentTarget.style.color='#dc2626'}} onMouseOut={e=>{e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='#ef4444'}} title="Xóa">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
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
