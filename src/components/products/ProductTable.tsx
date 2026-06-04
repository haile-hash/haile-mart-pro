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
        } else if (sortConfig.key === 'created_at') {
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

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <span style={{ fontSize: '10px', color: '#3b82f6' }}>▲</span> : <span style={{ fontSize: '10px', color: '#3b82f6' }}>▼</span>;
  };

  // ĐÃ FIX: Thêm tham số align để điều hướng menu sổ ra không bị cắt mép
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
        position: 'absolute', 
        top: '100%', 
        left: align === 'left' ? 0 : 'auto', // Fix tràn lề
        right: align === 'right' ? 0 : 'auto', // Fix tràn lề
        background: 'white', 
        border: '1px solid #cbd5e1', 
        borderRadius: '8px', 
        padding: '12px', 
        zIndex: 999, 
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', 
        width: '220px', 
        display: 'flex', 
        flexDirection: 'column', 
        cursor: 'default' 
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Lọc {title}</span>
        </div>
        
        <div style={{ overflowY: 'auto', maxHeight: '180px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
          {uniqueValues.map((val, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
              <input type="checkbox" checked={currentFilters.includes(val)} onChange={() => handleToggle(val)} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val || '(Trống)'}</span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
          <button onClick={() => { setFilterConfig(prev => ({ ...prev, [key]: [] })); setOpenFilter(null); }} style={{ flex: 1, padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>Bỏ lọc</button>
          <button onClick={() => setOpenFilter(null)} style={{ flex: 1, padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>OK</button>
        </div>
      </div>
    );
  };

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
    } catch {
      return { text: dateStr, color: "#64748b", bg: "#f1f5f9" };
    }
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
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', minHeight: '400px' }}>
      <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: '80px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left', userSelect: 'none' }}>
              
              {/* CỘT 1: TÊN SP */}
              <th style={{ padding: '14px 16px', fontWeight: 'bold', position: 'relative' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div onClick={() => handleSort('name')} style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }} title="Nhấn để sắp xếp">
                    Mã & Tên SP {getSortIcon('name')}
                  </div>
                  <div onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === 'name' ? null : 'name'); }} style={{ cursor: 'pointer', padding: '2px 6px', background: filterConfig['name']?.length ? '#eff6ff' : 'transparent', borderRadius: '4px' }} title="Lọc dữ liệu">
                    <span style={{ fontSize: '11px', color: filterConfig['name']?.length ? '#3b82f6' : '#94a3b8' }}>🔽</span>
                  </div>
                </div>
                {/* Đã truyền tham số 'left' để hộp đổ sang bên phải, không bị ăn lề */}
                {renderFilterDropdown('name', 'Tên SP', 'left')}
              </th>
              
              {/* CỘT 2: TỒN KHO */}
              <th style={{ padding: '14px 16px', fontWeight: 'bold', position: 'relative' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div onClick={() => handleSort('stock')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} title="Nhấn để sắp xếp">
                    Tồn kho {getSortIcon('stock')}
                  </div>
                  <div onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === 'stock' ? null : 'stock'); }} style={{ cursor: 'pointer', padding: '2px 6px', background: filterConfig['stock']?.length ? '#eff6ff' : 'transparent', borderRadius: '4px' }} title="Lọc dữ liệu">
                    <span style={{ fontSize: '11px', color: filterConfig['stock']?.length ? '#3b82f6' : '#94a3b8' }}>🔽</span>
                  </div>
                </div>
                {renderFilterDropdown('stock', 'Tồn kho')}
              </th>
              
              {/* CỘT 3: GIÁ VỐN */}
              <th style={{ padding: '14px 16px', fontWeight: 'bold', position: 'relative' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                  <div onClick={() => handleSort('import_price')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} title="Nhấn để sắp xếp">
                    Giá vốn {getSortIcon('import_price')}
                  </div>
                  <div onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === 'import_price' ? null : 'import_price'); }} style={{ cursor: 'pointer', padding: '2px 6px', background: filterConfig['import_price']?.length ? '#eff6ff' : 'transparent', borderRadius: '4px' }} title="Lọc dữ liệu">
                    <span style={{ fontSize: '11px', color: filterConfig['import_price']?.length ? '#3b82f6' : '#94a3b8' }}>🔽</span>
                  </div>
                </div>
                {renderFilterDropdown('import_price', 'Giá vốn')}
              </th>
              
              {/* CỘT 4: GIÁ BÁN */}
              <th style={{ padding: '14px 16px', fontWeight: 'bold', position: 'relative' }} className="filter-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                  <div onClick={() => handleSort('sale_price')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} title="Nhấn để sắp xếp">
                    Giá Bán & Khuyến Mãi {getSortIcon('sale_price')}
                  </div>
                  <div onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === 'sale_price' ? null : 'sale_price'); }} style={{ cursor: 'pointer', padding: '2px 6px', background: filterConfig['sale_price']?.length ? '#eff6ff' : 'transparent', borderRadius: '4px' }} title="Lọc dữ liệu">
                    <span style={{ fontSize: '11px', color: filterConfig['sale_price']?.length ? '#3b82f6' : '#94a3b8' }}>🔽</span>
                  </div>
                </div>
                {renderFilterDropdown('sale_price', 'Giá bán')}
              </th>
              
              <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>Lịch sử & HSD</th>
              <th style={{ padding: '14px 16px', fontWeight: 'bold', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          
          <tbody>
            {sortedProducts.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Không có sản phẩm nào phù hợp với bộ lọc</td></tr>
            ) : (
              sortedProducts.map((p, idx) => {
                const gift = parseGift(p.gift_info);
                const ageInfo = getInventoryAge(p.created_at);
                
                return (
                  <tr key={p.id || idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    
                    <td style={{ padding: '14px 16px', maxWidth: '280px' }}>
                      <div style={{ color: '#3b82f6', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer', marginBottom: '2px' }} title="Click để copy mã" onClick={() => navigator.clipboard.writeText(p.product_code || '')}>
                        {p.product_code}
                      </div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px', cursor: 'pointer', lineHeight: '1.4' }} onClick={() => handleEdit(p.id, 'name', p.name, true)} title="Click để sửa tên">
                        {cleanName(p.name)}
                      </div>
                      {gift.text && (
                        <div onClick={() => handleEdit(p.id, 'gift_info', p.gift_info, true)} style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: '#f3e8ff', border: '1px solid #e9d5ff', borderRadius: '6px', cursor: 'pointer' }} title="Click để sửa quà tặng">
                          <span style={{ fontSize: '12px' }}>🎁</span><span style={{ color: '#7e22ce', fontSize: '11px', fontWeight: 'bold' }}>{gift.cond > 1 ? `Mua ${gift.cond} tặng:` : 'Tặng:'} {gift.text}</span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '4px 10px', background: p.stock <= 5 ? '#fef2f2' : '#ecfdf5', color: p.stock <= 5 ? '#ef4444' : '#10b981', borderRadius: '20px', fontWeight: '900', fontSize: '14px', border: `1px solid ${p.stock <= 5 ? '#fca5a5' : '#6ee7b7'}` }}>
                        {p.stock}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#64748b', fontWeight: '600' }} onClick={() => handleEdit(p.id, 'import_price', p.import_price)}>
                      {(p.import_price || 0).toLocaleString()}đ
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ fontWeight: '900', color: p.promo_price ? '#ef4444' : '#f59e0b', fontSize: '15px', cursor: 'pointer' }} onClick={() => handleEdit(p.id, p.promo_price ? 'promo_price' : 'sale_price', p.promo_price || p.sale_price)}>
                        {(p.promo_price || p.sale_price || 0).toLocaleString()}đ
                      </div>
                      {p.promo_price > 0 && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through', cursor: 'pointer', marginTop: '2px' }} onClick={() => handleEdit(p.id, 'sale_price', p.sale_price)}>
                          Gốc: {(p.sale_price || 0).toLocaleString()}đ
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 6px', background: ageInfo.bg, borderRadius: '6px', width: 'fit-content', border: `1px solid ${ageInfo.bg !== '#f8fafc' ? ageInfo.color : '#e2e8f0'}` }} title={getExactDateStr(p.created_at)}>
                          <span style={{ fontSize: '10px' }}>📥</span><span style={{ color: ageInfo.color, fontWeight: 'bold' }}>{ageInfo.text}</span>
                        </div>
                        <div onClick={() => handleEdit(p.id, 'expiry_date', p.expiry_date, true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', padding: '2px 4px', width: 'fit-content' }} title="Click để sửa HSD">
                          {p.expiry_date ? ( <><span style={{ fontSize: '10px' }}>⏳</span><span style={{ color: '#059669', fontWeight: 'bold' }}>{p.expiry_date}</span></> ) : ( <><span style={{ fontSize: '10px', opacity: 0.5 }}>➖</span><span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Không có HSD</span></> )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => handleSelectSuggest(p)} style={{ padding: '8px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}>
                          🛒 Thêm
                        </button>
                        <button onClick={() => setPrintBarcodeProduct(p)} style={{ padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(59,130,246,0.2)' }} title="In tem mã vạch">🖨️</button>
                        <button onClick={() => handleDelete(p.id, p.name)} style={{ padding: '8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }} title="Xóa sản phẩm">🗑️</button>
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
