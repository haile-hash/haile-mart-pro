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

  // SVG ICON PHỄU LỌC
  const getFilterIcon = (columnKey: keyof Product, onClick: (e: any) => void) => {
    const isFiltered = filterConfig[columnKey]?.length > 0;
    return (
      <div
        onClick={onClick}
        style={{
          cursor: 'pointer', padding: '4px', borderRadius: '6px',
          background: isFiltered ? '#eff6ff' : 'transparent',
          color: isFiltered ? '#3b82f6' : '#94a3b8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', marginLeft: '4px'
        }}
        title="Lọc dữ liệu"
        onMouseOver={e => e.currentTarget.style.background = isFiltered ? '#eff6ff' : 'rgba(0,0,0,0.05)'}
        onMouseOut={e => e.currentTarget.style.background = isFiltered ? '#eff6ff' : 'transparent'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={isFiltered ? '#bfdbfe' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
      </div>
    );
  };

  // DROPDOWN BỘ LỌC
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
        background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(203, 213, 225, 0.5)', borderRadius: '12px', 
        padding: '16px', zIndex: 999, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', 
        width: '240px', display: 'flex', flexDirection: 'column', cursor: 'default' 
      }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Sắp xếp</span>
          <button onClick={() => { handleSort(key); setOpenFilter(null); }} style={{ textAlign: 'left', padding: '8px 12px', background: sortConfig?.key === key && sortConfig?.direction === 'asc' ? '#eff6ff' : 'transparent', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: sortConfig?.key === key && sortConfig?.direction === 'asc' ? '#2563eb' : '#334155', fontWeight: sortConfig?.key === key && sortConfig?.direction === 'asc' ? 'bold' : '500', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#f8fafc'} onMouseOut={e=>e.currentTarget.style.background=sortConfig?.key === key && sortConfig?.direction === 'asc' ? '#eff6ff' : 'transparent'}>
            Tăng dần ▲
          </button>
          <button onClick={() => { setSortConfig({key, direction: 'desc'}); setOpenFilter(null); }} style={{ textAlign: 'left', padding: '8px 12px', background: sortConfig?.key === key && sortConfig?.direction === 'desc' ? '#eff6ff' : 'transparent', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: sortConfig?.key === key && sortConfig?.direction === 'desc' ? '#2563eb' : '#334155', fontWeight: sortConfig?.key === key && sortConfig?.direction === 'desc' ? 'bold' : '500', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#f8fafc'} onMouseOut={e=>e.currentTarget.style.background=sortConfig?.key === key && sortConfig?.direction === 'desc' ? '#eff6ff' : 'transparent'}>
            Giảm dần ▼
          </button>
        </div>

        <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Lọc dữ liệu</span>
        <div style={{ overflowY: 'auto', maxHeight: '160px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', paddingRight: '4px' }}>
          {uniqueValues.map((val, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1e293b', cursor: 'pointer', fontWeight: '500' }}>
              <input type="checkbox" checked={currentFilters.includes(val)} onChange={() => handleToggle(val)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val || '(Trống)'}</span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { setFilterConfig(prev => ({ ...prev, [key]: [] })); setSortConfig(null); setOpenFilter(null); }} style={{ flex: 1, padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', color: '#64748b', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#f1f5f9'} onMouseOut={e=>e.currentTarget.style.background='#f8fafc'}>Bỏ chọn</button>
          <button onClick={() => setOpenFilter(null)} style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' }}>Áp dụng</button>
        </div>
      </div>
    );
  };

  const getInventoryAge = (dateStr?: string) => {
    if (!dateStr) return { text: "---", color: "#94a3b8" };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { text: dateStr.split('T')[0], color: "#94a3b8" };
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const created = new Date(d); created.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - created.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return { text: "Mới nhập", color: "#059669" }; 
      else if (diffDays <= 30) return { text: `Tồn ${diffDays} ngày`, color: "#64748b" }; 
      else return { text: `Tồn ${diffDays} ngày`, color: "#ef4444" }; 
    } catch { return { text: dateStr, color: "#94a3b8" }; }
  };

  const getExactDateStr = (dateStr?: string) => {
    if (!dateStr) return "Không có thông tin";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - ${d.toLocaleDateString('vi-VN')}`;
    } catch { return dateStr; }
  };

  return (
    // HIỆU ỨNG GLASSMORPHISM Ở ĐÂY
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.65)', 
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderRadius: '16px', 
      border: '1px solid rgba(255, 255, 255, 0.6)', 
      overflow: 'hidden', 
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)', 
      minHeight: '400px' 
    }}>
      <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: '120px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            {/* DÒNG TIÊU ĐỀ KHÔNG BỊ XUỐNG DÒNG (whiteSpace: nowrap) */}
            <tr style={{ background: 'rgba(248, 250, 252, 0.4)', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', color: '#475569', textAlign: 'left', userSelect: 'none', whiteSpace: 'nowrap' }}>
              
              <th style={{ padding: '16px', fontWeight: '700', position: 'relative', minWidth: '280px' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span onClick={() => handleSort('name')} style={{ cursor: 'pointer' }} title="Sắp xếp Tên SP">Mã & Tên SP</span>
                  {getFilterIcon('name', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'name' ? null : 'name'); })}
                </div>
                {renderFilterDropdown('name', 'Tên SP', 'left')}
              </th>
              
              <th style={{ padding: '16px', fontWeight: '700', position: 'relative', textAlign: 'center', minWidth: '120px' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span onClick={() => handleSort('stock')} style={{ cursor: 'pointer' }} title="Sắp xếp Tồn kho">Tồn kho</span>
                  {getFilterIcon('stock', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'stock' ? null : 'stock'); })}
                </div>
                {renderFilterDropdown('stock', 'Tồn kho', 'center')}
              </th>
              
              <th style={{ padding: '16px', fontWeight: '700', position: 'relative', textAlign: 'right', minWidth: '130px' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span onClick={() => handleSort('import_price')} style={{ cursor: 'pointer' }} title="Sắp xếp Giá vốn">Giá vốn</span>
                  {getFilterIcon('import_price', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'import_price' ? null : 'import_price'); })}
                </div>
                {renderFilterDropdown('import_price', 'Giá vốn', 'right')}
              </th>
              
              <th style={{ padding: '16px', fontWeight: '700', position: 'relative', textAlign: 'right', minWidth: '160px' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span onClick={() => handleSort('sale_price')} style={{ cursor: 'pointer' }} title="Sắp xếp Giá bán">Giá Bán & Khuyến Mãi</span>
                  {getFilterIcon('sale_price', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'sale_price' ? null : 'sale_price'); })}
                </div>
                {renderFilterDropdown('sale_price', 'Giá bán', 'right')}
              </th>
              
              <th style={{ padding: '16px', fontWeight: '700', position: 'relative', minWidth: '160px' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span onClick={() => handleSort('created_at')} style={{ cursor: 'pointer' }} title="Sắp xếp Ngày nhập">Lịch sử & HSD</span>
                  {getFilterIcon('expiry_date', (e) => { e.stopPropagation(); setOpenFilter(openFilter === 'expiry_date' ? null : 'expiry_date'); })}
                </div>
                {renderFilterDropdown('expiry_date', 'Hạn sử dụng', 'right')}
              </th>
              
              <th style={{ padding: '16px', fontWeight: '700', textAlign: 'center', color: '#94a3b8', minWidth: '140px' }}>Thao tác</th>
            </tr>
          </thead>
          
          <tbody>
            {sortedProducts.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '80px', color: '#94a3b8', fontSize: '15px' }}>Không có dữ liệu phù hợp.</td></tr>
            ) : (
              sortedProducts.map((p, idx) => {
                const gift = parseGift(p.gift_info);
                const ageInfo = getInventoryAge(p.created_at);
                
                return (
                  <tr key={p.id || idx} style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.4)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    
                    <td style={{ padding: '16px' }}>
                      <div style={{ color: '#3b82f6', fontSize: '12px', fontFamily: 'monospace', fontWeight: '600', cursor: 'pointer', marginBottom: '4px' }} title="Copy mã" onClick={() => navigator.clipboard.writeText(p.product_code || '')}>
                        {p.product_code}
                      </div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px', cursor: 'pointer', lineHeight: '1.4' }} onClick={() => handleEdit(p.id, 'name', p.name, true)} title="Sửa tên">
                        {cleanName(p.name)}
                      </div>
                      {/* QUÀ TẶNG: Tag tinh tế */}
                      {gift.text && (
                        <div onClick={() => handleEdit(p.id, 'gift_info', p.gift_info, true)} style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: 'rgba(243, 232, 255, 0.7)', border: '1px solid rgba(233, 213, 255, 0.8)', borderRadius: '6px', cursor: 'pointer', backdropFilter: 'blur(4px)' }} title="Sửa quà tặng">
                          <span style={{ fontSize: '11px' }}>🎁</span><span style={{ color: '#7e22ce', fontSize: '11px', fontWeight: '600' }}>{gift.cond > 1 ? `Mua ${gift.cond} tặng:` : 'Tặng:'} {gift.text}</span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '4px 12px', background: p.stock <= 5 ? '#fef2f2' : '#ecfdf5', color: p.stock <= 5 ? '#ef4444' : '#10b981', borderRadius: '20px', fontWeight: '800', fontSize: '13px', border: `1px solid ${p.stock <= 5 ? '#fca5a5' : '#6ee7b7'}` }}>
                        {p.stock}
                      </span>
                    </td>

                    <td style={{ padding: '16px', textAlign: 'right', color: '#64748b', fontWeight: '600' }} onClick={() => handleEdit(p.id, 'import_price', p.import_price)}>
                      {(p.import_price || 0).toLocaleString()}đ
                    </td>

                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', color: p.promo_price ? '#ef4444' : '#f59e0b', fontSize: '16px', cursor: 'pointer' }} onClick={() => handleEdit(p.id, p.promo_price ? 'promo_price' : 'sale_price', p.promo_price || p.sale_price)}>
                        {(p.promo_price || p.sale_price || 0).toLocaleString()}đ
                      </div>
                      {p.promo_price > 0 && (
                        <div style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through', cursor: 'pointer', marginTop: '4px' }} onClick={() => handleEdit(p.id, 'sale_price', p.sale_price)}>
                          Gốc: {(p.sale_price || 0).toLocaleString()}đ
                        </div>
                      )}
                    </td>

                    {/* HSD VÀ NGÀY NHẬP: Lược bỏ khối box cục mịch, chuyển sang icon text gọn gàng */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }} title={getExactDateStr(p.created_at)}>
                          <span style={{ color: '#94a3b8' }}>📅</span>
                          <span style={{ color: ageInfo.color, fontWeight: '600' }}>{ageInfo.text}</span>
                        </div>
                        <div onClick={() => handleEdit(p.id, 'expiry_date', p.expiry_date, true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }} title="Click để sửa HSD">
                          {p.expiry_date ? ( 
                            <><span style={{ color: '#94a3b8' }}>⏳</span><span style={{ color: '#059669', fontWeight: '600' }}>{p.expiry_date}</span></> 
                          ) : ( 
                            <><span style={{ color: '#cbd5e1' }}>➖</span><span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Không có HSD</span></> 
                          )}
                        </div>
                      </div>
                    </td>

                    {/* THAO TÁC: Dùng Icon SVG chuyên nghiệp, nút gọn gàng */}
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => handleSelectSuggest(p)} style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 6px rgba(16,185,129,0.2)', transition: 'transform 0.1s' }} onMouseOver={e=>e.currentTarget.style.transform='scale(1.05)'} onMouseOut={e=>e.currentTarget.style.transform='none'}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                          Thêm
                        </button>
                        <button onClick={() => setPrintBarcodeProduct(p)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.5)', color: '#3b82f6', border: '1px solid rgba(191, 219, 254, 0.8)', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', backdropFilter: 'blur(4px)' }} onMouseOver={e=>e.currentTarget.style.background='#eff6ff'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.5)'} title="In tem mã vạch">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.5)', color: '#ef4444', border: '1px solid rgba(254, 202, 202, 0.8)', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', backdropFilter: 'blur(4px)' }} onMouseOver={e=>e.currentTarget.style.background='#fef2f2'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.5)'} title="Xóa sản phẩm">
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
