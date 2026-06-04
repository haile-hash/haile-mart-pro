import React from 'react';

interface ProductSearchAndActionsProps {
  barcodeInput: string;
  setBarcodeInput: (val: string) => void;
  setScannerMode: (val: any) => void;
  showSuggestions: boolean;
  setShowSuggestions: (val: boolean) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  categories: string[];
  sortedAndFilteredProducts: any[];
  handleSelectSuggest: (p: any) => void;
  setShowInputForm: (val: boolean) => void;
  handleFileUpload: (e: any) => void;
  downloadSampleExcel: () => void;
}

export const ProductSearchAndActions: React.FC<ProductSearchAndActionsProps> = ({
  barcodeInput, setBarcodeInput, setScannerMode, showSuggestions, setShowSuggestions,
  searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, categories,
  sortedAndFilteredProducts, handleSelectSuggest, setShowInputForm, handleFileUpload, downloadSampleExcel
}) => {
  return (
    <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      
      {/* DÒNG 1: TÌM KIẾM & NÚT THAO TÁC */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        
        {/* Ô Tìm Kiếm */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f59e0b' }}>👉</div>
          <input 
            id="search-barcode"
            placeholder="QUẸT MÃ VẠCH (F1) hoặc Gõ tên SP..." 
            value={searchTerm || barcodeInput} 
            onChange={(e) => { setSearchTerm(e.target.value); setBarcodeInput(e.target.value); setShowSuggestions(true); }}
            style={{ width: '100%', padding: '12px 12px 12px 35px', borderRadius: '8px 0 0 8px', border: '2px solid #cbd5e1', borderRight: 'none', outline: 'none', fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}
            onFocus={() => setShowSuggestions(true)}
          />
          <button 
            onClick={() => setScannerMode('product')} 
            style={{ padding: '0 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', fontSize: '18px' }}
            title="Bật máy quét Camera"
          >
            📷
          </button>

          {/* Gợi ý tìm kiếm */}
          {showSuggestions && (searchTerm || barcodeInput) && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', zIndex: 100, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
              {sortedAndFilteredProducts.slice(0, 10).map((p: any) => (
                <div 
                  key={p.id} 
                  onClick={() => handleSelectSuggest(p)} 
                  style={{ padding: '10px 15px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px' }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Mã: {p.product_code}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#ef4444', fontWeight: 'bold' }}>{(p.promo_price || p.sale_price || 0).toLocaleString()}đ</div>
                    <div style={{ fontSize: '11px', color: '#10b981' }}>Tồn: {p.stock}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cụm Nút Thao Tác */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowInputForm(true)} style={{ padding: '10px 16px', background: '#fff', color: '#6366f1', border: '2px dashed #a5b4fc', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ➕ NHẬP LẺ / SỬA SP
          </button>
          <label style={{ padding: '10px 16px', background: '#fff', color: '#10b981', border: '2px dashed #6ee7b7', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            📂 TỪ EXCEL
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
          <button onClick={downloadSampleExcel} style={{ padding: '10px 16px', background: '#fff', color: '#3b82f6', border: '2px dashed #93c5fd', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📥 FILE MẪU
          </button>
        </div>
      </div>

      {/* DÒNG 2: THANH DANH MỤC NẰM NGANG (TABS) */}
      <div 
        className="category-tabs"
        style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}
      >
        <style>{`
          .category-tabs::-webkit-scrollbar { height: 4px; }
          .category-tabs::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
          .category-tabs::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          .category-tabs::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>
        
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: selectedCategory === cat ? 'none' : '1px solid #e2e8f0',
              background: selectedCategory === cat ? '#3b82f6' : '#f8fafc',
              color: selectedCategory === cat ? '#ffffff' : '#475569',
              fontWeight: 'bold',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: selectedCategory === cat ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

    </div>
  );
};
