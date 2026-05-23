// ===============================================
  // 🔥 RENDER GIAO DIỆN IN (ĐÃ NÂNG CẤP CHUẨN ERP)
  // ===============================================
  const renderPrintArea = () => (
    <>
      {/* --- IN HÓA ĐƠN MÁY POS (Bill 80mm) --- */}
      {lastOrder && printMode === 'receipt' && (
        <div className="print-only">
          <div className="print-receipt-container">
            <div style={{ textAlign: "center", marginBottom: "8px" }}><h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900 }}>HẢI LÊ MART</h2><div style={{ fontSize: "11px" }}>Tòa Nhà ATS, 252 Hoàng Quốc Việt, HN</div></div>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>
            <table style={{ width: "100%", fontSize: "11px", marginBottom: "4px", borderCollapse: "collapse" }}><tbody><tr><td style={{ textAlign: "left" }}><b>HĐ:</b> {lastOrder.orderId}</td><td style={{ textAlign: "right" }}><b>Ca:</b> {shift}</td></tr><tr><td style={{ textAlign: "left" }}><b>Ngày:</b> {lastOrder.time}</td><td style={{ textAlign: "right" }}><b>TN:</b> {role}</td></tr></tbody></table>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "6px" }}></div>
            <div style={{ fontSize: "11px", marginBottom: "8px", lineHeight: "1.5" }}>
              {lastOrder.custPhone ? (
                <><div><b>Khách hàng:</b> {lastOrder.custName || 'Khách VIP'}</div><div><b>SĐT:</b> {lastOrder.custPhone}</div>{customers[lastOrder.custPhone]?.email && <div><b>Email:</b> {customers[lastOrder.custPhone].email}</div>}{customers[lastOrder.custPhone]?.address && <div><b>Địa chỉ:</b> {customers[lastOrder.custPhone].address}</div>}</>
              ) : (<div><b>Khách hàng:</b> Khách lẻ</div>)}
            </div>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
              <tbody>
                {lastOrder.cart.map((i: any, x: number) => {
                  const p = i.priceIncludingVat !== undefined ? Math.round(i.priceIncludingVat / (1 + VAT_RATE)) : Math.round(getActualPrice(i.product)); const t = i.priceIncludingVat !== undefined ? Math.round(i.priceIncludingVat * i.qty) : Math.round((Number(i.qty) || 0) * p * (1 + VAT_RATE)); const g = parseGift(i.product.gift_info); const gQty = g.cond > 0 ? Math.floor(i.qty / g.cond) : 0;
                  return (<React.Fragment key={x}><tr><td colSpan={2}><b>{cleanName(i.product.name)} {i.product.isHappyHour && <span style={{ fontSize: "9px" }}>[Giờ Vàng]</span>}</b></td></tr><tr><td style={{ paddingBottom: "4px" }}>{i.qty} x {p.toLocaleString()}</td><td style={{ textAlign: "right", paddingBottom: "4px" }}>{t.toLocaleString()}</td></tr>{g.text && gQty > 0 && <tr><td colSpan={2} style={{ fontSize: "10px", fontStyle: "italic", paddingBottom: "4px" }}>+ 🎁 Tặng: {gQty} x {g.text}</td></tr>}</React.Fragment>)
                })}
              </tbody>
            </table>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px", marginTop: "4px" }}></div>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}><tbody><tr><td style={{ padding: "2px 0" }}>Tiền hàng:</td><td style={{ textAlign: "right", padding: "2px 0" }}>{Math.round(lastOrder.subTotal).toLocaleString()}đ</td></tr><tr><td style={{ padding: "2px 0" }}>VAT (10%):</td><td style={{ textAlign: "right", padding: "2px 0" }}>{Math.round(lastOrder.vatTotal).toLocaleString()}đ</td></tr>{lastOrder.discount > 0 && <tr><td style={{ padding: "2px 0" }}>Giảm giá/Ví:</td><td style={{ textAlign: "right", padding: "2px 0" }}>-{Math.round(lastOrder.discount).toLocaleString()}đ</td></tr>}</tbody></table>
            <div style={{ borderBottom: "2px dashed #000", margin: "6px 0" }}></div>
            <table style={{ width: "100%", fontSize: "16px", fontWeight: 900, borderCollapse: "collapse" }}><tbody><tr><td>{lastOrder.debtAmount > 0 ? "NỢ:" : "TỔNG ĐƠN:"}</td><td style={{ textAlign: "right" }}>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</td></tr></tbody></table>
            <div style={{ borderTop: "1px dotted #000", paddingTop: "6px", marginTop: "6px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Phương thức TT:</span><b>{lastOrder.paymentMethod}</b></div>
              {lastOrder.paymentMethod === 'TIỀN MẶT' && (<><div style={{ display: "flex", justifyContent: "space-between" }}><span>Khách đưa:</span><span>{Math.round(lastOrder.customerGiven || lastOrder.finalTotal).toLocaleString()}đ</span></div><div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}><span>Thối lại:</span><span>{Math.round(Math.max(0, (lastOrder.customerGiven || lastOrder.finalTotal) - lastOrder.finalTotal)).toLocaleString()}đ</span></div></>)}
              {lastOrder.paymentMethod === 'KẾT HỢP' && (<><div style={{ display: "flex", justifyContent: "space-between" }}><span>Tiền mặt:</span><span>{Math.round(lastOrder.customerGiven || 0).toLocaleString()}đ</span></div><div style={{ display: "flex", justifyContent: "space-between" }}><span>Chuyển khoản:</span><span>{Math.round(lastOrder.finalTotal - (lastOrder.customerGiven || 0)).toLocaleString()}đ</span></div></>)}
            </div>
            <div style={{ textAlign: "center", marginTop: "15px", fontSize: "11px" }}><b>CẢM ƠN QUÝ KHÁCH!</b></div>
          </div>
        </div>
      )}

      {/* --- IN HÓA ĐƠN BÁN HÀNG A4 --- */}
      {printMode === 'invoice_a4' && lastOrder && (
        <div className="print-a4-container">
          <div style={{ width: "100%", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "20px" }}><div><h1 style={{ margin: 0, color: "#dc2626", fontSize: "28px" }}>HẢI LÊ MART</h1><p style={{ margin: "5px 0", fontSize: "14px" }}>Địa chỉ: Tòa Nhà ATS, 252 Hoàng Quốc Việt, Cầu Giấy, HN</p></div><div style={{ textAlign: "right" }}><h2 style={{ margin: 0, fontSize: "24px" }}>HÓA ĐƠN BÁN HÀNG</h2><p style={{ margin: "5px 0", fontSize: "14px" }}>Số: <b>{lastOrder.orderId}</b></p><p style={{ margin: "5px 0", fontSize: "14px" }}>Ngày: {lastOrder.time}</p></div></div>
            <div style={{ marginBottom: "20px", fontSize: "15px", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div><p style={{ margin: "5px 0" }}><b>Khách hàng:</b> {lastOrder.custName || "Khách lẻ"}</p>{lastOrder.custPhone && <p style={{ margin: "5px 0" }}><b>SĐT:</b> {lastOrder.custPhone}</p>}{lastOrder.custPhone && customers[lastOrder.custPhone]?.email && <p style={{ margin: "5px 0" }}><b>Email:</b> {customers[lastOrder.custPhone].email}</p>}{lastOrder.custPhone && customers[lastOrder.custPhone]?.address && <p style={{ margin: "5px 0" }}><b>Địa chỉ:</b> {customers[lastOrder.custPhone].address}</p>}</div>
              <div style={{ textAlign: "right" }}><p style={{ margin: "5px 0" }}><b>Phương thức thanh toán:</b> {lastOrder.paymentMethod}</p></div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead><tr style={{ background: "#f1f5f9" }}><th style={{ borderBottom: "2px solid #cbd5e1", padding: "10px", textAlign: "center" }}>STT</th><th style={{ borderBottom: "2px solid #cbd5e1", padding: "10px", textAlign: "left" }}>Tên hàng hóa</th><th style={{ borderBottom: "2px solid #cbd5e1", padding: "10px", textAlign: "center" }}>SL</th><th style={{ borderBottom: "2px solid #cbd5e1", padding: "10px", textAlign: "right" }}>Đơn giá</th><th style={{ borderBottom: "2px solid #cbd5e1", padding: "10px", textAlign: "right" }}>Thành tiền</th></tr></thead>
              <tbody>{lastOrder.cart.map((item: any, index: number) => { const p = Math.round(getActualPrice(item.product)); const t = Math.round(item.qty * p * (1 + VAT_RATE)); return (<tr key={index}><td style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 10px", textAlign: "center" }}>{index + 1}</td><td style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 10px" }}>{cleanName(item.product.name)}</td><td style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 10px", textAlign: "center" }}>{item.qty}</td><td style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 10px", textAlign: "right" }}>{p.toLocaleString()}đ</td><td style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 10px", textAlign: "right" }}>{t.toLocaleString()}đ</td></tr>); })}</tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontSize: "15px" }}>
              <div style={{ textAlign: "center", width: "40%" }}><b>Khách hàng</b><br/><span style={{ fontSize: "12px", color: "#666" }}>(Ký, ghi rõ họ tên)</span><div style={{ marginTop: "70px", width: "150px", borderTop: "1px solid #000", display: "inline-block" }}></div></div>
              <div style={{ textAlign: "right", width: "50%" }}><p style={{ margin: "5px 0" }}>Cộng tiền hàng: {Math.round(lastOrder.subTotal).toLocaleString()}đ</p><p style={{ margin: "5px 0" }}>Thuế GTGT (10%): {Math.round(lastOrder.vatTotal).toLocaleString()}đ</p>{lastOrder.discount > 0 && <p style={{ margin: "5px 0" }}>Giảm giá/Ví: -{Math.round(lastOrder.discount).toLocaleString()}đ</p>}<h3 style={{ borderTop: "2px solid #000", paddingTop: "10px", margin: "10px 0" }}>TỔNG CỘNG: {Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</h3>
                {lastOrder.paymentMethod === 'TIỀN MẶT' && (<div style={{ fontSize: "14px", marginTop: "10px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Khách đưa:</span> <span>{Math.round(lastOrder.customerGiven || lastOrder.finalTotal).toLocaleString()}đ</span></div><div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}><span>Thối lại:</span> <span>{Math.round(Math.max(0, (lastOrder.customerGiven || lastOrder.finalTotal) - lastOrder.finalTotal)).toLocaleString()}đ</span></div></div>)}
                {lastOrder.paymentMethod === 'KẾT HỢP' && (<div style={{ fontSize: "14px", marginTop: "10px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Thanh toán Tiền mặt:</span> <span>{Math.round(lastOrder.customerGiven || 0).toLocaleString()}đ</span></div><div style={{ display: "flex", justifyContent: "space-between" }}><span>Thanh toán Chuyển khoản:</span> <span>{Math.round(lastOrder.finalTotal - (lastOrder.customerGiven || 0)).toLocaleString()}đ</span></div></div>)}
                <div style={{ textAlign: "center", marginTop: "40px" }}><b>Người bán hàng</b><br/><span style={{ fontSize: "12px", color: "#666" }}>(Ký, đóng dấu)</span><br/><div style={{ marginTop: "70px", width: "150px", borderTop: "1px solid #000", display: "inline-block" }}></div></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* --- IN TEM MÃ VẠCH --- */}
      {printMode === 'barcode' && printBarcodeProduct && (
        <div className="print-only">
          <div className="print-barcode-sheet">
            {Array.from({ length: barcodeCount }).map((_, i) => (
              <div key={i} className="barcode-sticker">
                <div style={{ fontSize: "9px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", textAlign: "center" }}>{cleanName(printBarcodeProduct.name)}</div>
                <img src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(printBarcodeProduct.product_code)}&scale=2&height=10&includetext=false`} onError={(e) => { e.currentTarget.src = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(printBarcodeProduct.product_code)}&code=Code128&translate-esc=on`; }} style={{ maxWidth: "100%", height: "24px", margin: "2px 0" }} alt={printBarcodeProduct.product_code} />
                <div style={{ fontSize: "8px", fontFamily: "monospace", letterSpacing: "1px", color: "#333", lineHeight: "1" }}>{printBarcodeProduct.product_code}</div>
                <div style={{ fontSize: "12px", fontWeight: "900", color: "#000", lineHeight: "1.2" }}>{getActualPrice(printBarcodeProduct).toLocaleString()}đ</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* --- IN THẺ KHÁCH HÀNG --- */}
      {printMode === 'customer_card' && printCustomer && (
        <div className="print-only">
          <div className="print-customer-card">
            <div style={{ width: "85.6mm", height: "53.98mm", border: "3px solid #dc2626", borderRadius: "12px", padding: "15px", textAlign: "center", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", background: "#fff7ed", fontFamily: "'Inter', sans-serif" }}>
              <h2 style={{ margin: "0 0 5px 0", color: "#b91c1c", fontSize: "20px", textTransform: "uppercase", fontWeight: "900" }}>HẢI LÊ MART</h2>
              <div style={{ fontSize: "10px", fontWeight: "bold", color: "#ea580c", letterSpacing: "2px", marginBottom: "10px" }}>THẺ KHÁCH HÀNG THÂN THIẾT</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0f172a", textTransform: "uppercase" }}>{printCustomer.name}</div>
              <img src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(printCustomer.cardCode || printCustomer.phone)}&scale=2&height=10&includetext=false`} onError={(e) => { e.currentTarget.src = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(printCustomer.cardCode || printCustomer.phone)}&code=Code128&translate-esc=on`; }} style={{ maxWidth: "100%", height: "45px", marginTop: "10px", margin: "10px auto 0 auto", display: "block" }} alt="barcode" />
              <div style={{ fontSize: "12px", fontFamily: "monospace", letterSpacing: "2px", marginTop: "4px", fontWeight: "bold" }}>{printCustomer.cardCode || printCustomer.phone}</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MẪU IN PHIẾU ĐẶT HÀNG (PO ORDER) CHUYÊN NGHIỆP                         */}
      {/* ========================================================================= */}
      {printMode === 'po_order' && printPOData && (
        <div className="print-a4-container">
          <div style={{ padding: "40px", fontFamily: "'Inter', sans-serif", color: "#0f172a", maxWidth: "850px", margin: "0 auto", background: "#fff" }}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "20px", marginBottom: "30px" }}>
              <div>
                <h1 style={{ margin: "0 0 8px 0", fontSize: "26px", fontWeight: "900", color: "#2563eb", letterSpacing: "-0.5px" }}>HẢI LÊ MART</h1>
                <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}><strong>Địa chỉ:</strong> Tòa Nhà ATS, 252 Hoàng Quốc Việt, Cầu Giấy, HN</p>
                <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}><strong>Điện thoại:</strong> 0902.613.899 - <strong>Email:</strong> admin@hailemart.com</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "24px", color: "#0f172a", fontWeight: "800" }}>PHIẾU ĐẶT HÀNG</h2>
                <p style={{ margin: "0 0 12px 0", fontSize: "13px", fontStyle: "italic", color: "#64748b" }}>(Purchase Order)</p>
                <div style={{ display: "inline-block", background: "#f1f5f9", padding: "8px 12px", borderRadius: "6px", textAlign: "left" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "13px" }}><strong>Số PO:</strong> <span style={{ color: "#2563eb", fontWeight: "bold" }}>{printPOData.po_code}</span></p>
                  <p style={{ margin: 0, fontSize: "13px" }}><strong>Ngày đặt:</strong> {new Date(printPOData.created_at).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </div>
            
            {/* Thông tin 2 bên */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", gap: "20px" }}>
              <div style={{ flex: "1", padding: "16px", borderLeft: "4px solid #3b82f6", background: "#f8fafc", borderRadius: "0 8px 8px 0" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>THÔNG TIN NHÀ CUNG CẤP</p>
                <p style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: "bold" }}>{printPOData.supplier?.name}</p>
                <p style={{ margin: "0 0 4px 0", fontSize: "14px" }}><strong>SĐT:</strong> {printPOData.supplier?.phone}</p>
                <p style={{ margin: "0", fontSize: "14px" }}><strong>Địa chỉ:</strong> {printPOData.supplier?.address || "---"}</p>
              </div>
              <div style={{ flex: "1", padding: "16px", background: "#f1f5f9", borderRadius: "8px" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>GHI CHÚ ĐƠN HÀNG</p>
                <p style={{ margin: "0", fontSize: "14px", fontStyle: "italic" }}>{printPOData.note || "Không có ghi chú đặc biệt."}</p>
              </div>
            </div>
            
            {/* Bảng Sản phẩm */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "center", width: "5%", color: "#475569" }}>STT</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "left", width: "45%", color: "#475569" }}>Tên Sản Phẩm</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "center", width: "15%", color: "#475569" }}>SL Đặt</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "right", width: "15%", color: "#475569" }}>Đơn Giá</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "right", width: "20%", color: "#475569" }}>Thành Tiền</th>
                </tr>
              </thead>
              <tbody>
                {printPOData.items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "center", color: "#64748b" }}>{index + 1}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", fontWeight: "500" }}>{cleanName(item.product.name)}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "center", fontWeight: "bold" }}>{item.qty}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "right" }}>{(item.importPrice||0).toLocaleString()}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "right", fontWeight: "bold" }}>{(item.qty * (item.importPrice||0)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Tổng cộng */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "350px", fontSize: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "10px" }}>
                  <span style={{ color: "#64748b" }}>Tổng giá trị PO:</span>
                  <strong style={{ fontSize: "16px" }}>{printPOData.total_amount.toLocaleString()} đ</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "10px" }}>
                  <span style={{ color: "#64748b" }}>Đã trả trước:</span>
                  <strong style={{ color: "#10b981" }}>{(printPOData.paid_amount || 0).toLocaleString()} đ</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px", borderRadius: "8px" }}>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>CÔNG NỢ DỰ KIẾN:</strong>
                  <strong style={{ fontSize: "20px", color: "#ef4444" }}>{Math.max(0, printPOData.total_amount - (printPOData.paid_amount || 0)).toLocaleString()} đ</strong>
                </div>
              </div>
            </div>
            
            {/* Chữ ký */}
            <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", marginTop: "60px", fontSize: "14px" }}>
              <div style={{ width: "45%" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Đại Diện Nhà Cung Cấp</strong>
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ marginTop: "90px", width: "60%", marginInline: "auto", borderTop: "1px solid #94a3b8" }}></div>
              </div>
              <div style={{ width: "45%" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Người Lập Đơn / Cửa Hàng</strong>
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ marginTop: "90px", width: "60%", marginInline: "auto", borderTop: "1px solid #94a3b8" }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MẪU IN PHIẾU NHẬP KHO (RECEIPT) CHUYÊN NGHIỆP                          */}
      {/* ========================================================================= */}
      {printMode === 'po_receipt' && printPOData && (
        <div className="print-a4-container">
          <div style={{ padding: "40px", fontFamily: "'Inter', sans-serif", color: "#0f172a", maxWidth: "850px", margin: "0 auto", background: "#fff" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "20px", marginBottom: "30px" }}>
              <div>
                <h1 style={{ margin: "0 0 8px 0", fontSize: "26px", fontWeight: "900", color: "#10b981", letterSpacing: "-0.5px" }}>HẢI LÊ MART</h1>
                <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569", fontWeight: "bold" }}>BỘ PHẬN KHO BÃI & CUNG ỨNG</p>
                <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}>252 Hoàng Quốc Việt, Cầu Giấy, HN</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "24px", color: "#0f172a", fontWeight: "800" }}>PHIẾU NHẬP KHO</h2>
                <p style={{ margin: "0 0 12px 0", fontSize: "13px", fontStyle: "italic", color: "#64748b" }}>(Goods Receipt Note)</p>
                <div style={{ display: "inline-block", background: "#f0fdf4", padding: "8px 12px", borderRadius: "6px", textAlign: "left", border: "1px solid #bbf7d0" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "13px" }}><strong>Tham chiếu PO:</strong> <span style={{ color: "#059669", fontWeight: "bold" }}>{printPOData.po_code}</span></p>
                  <p style={{ margin: 0, fontSize: "13px" }}><strong>Ngày nhập:</strong> {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", gap: "20px" }}>
              <div style={{ flex: "1", padding: "16px", borderLeft: "4px solid #10b981", background: "#f8fafc", borderRadius: "0 8px 8px 0" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>GIAO TỪ NHÀ CUNG CẤP</p>
                <p style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: "bold" }}>{printPOData.supplier?.name}</p>
                <p style={{ margin: "0 0 4px 0", fontSize: "14px" }}><strong>SĐT:</strong> {printPOData.supplier?.phone} | <strong>Địa chỉ:</strong> {printPOData.supplier?.address || "---"}</p>
              </div>
              <div style={{ flex: "1", padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>TRẠNG THÁI KIỂM KÊ</p>
                <p style={{ margin: "0", fontSize: "14px", color: "#059669", fontWeight: "500" }}>✓ Đã kiểm tra số lượng và chất lượng.</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#059669", fontWeight: "500" }}>✓ Đã đối soát và nhập kho hệ thống.</p>
              </div>
            </div>
            
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "center", width: "5%", color: "#475569" }}>STT</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "left", width: "45%", color: "#475569" }}>Tên Sản Phẩm</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "center", width: "15%", color: "#475569" }}>SL Nhận</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "right", width: "15%", color: "#475569" }}>Đơn Giá</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "right", width: "20%", color: "#475569" }}>Thành Tiền</th>
                </tr>
              </thead>
              <tbody>
                {printPOData.items.filter((i:any) => i.qty - (i.damagedQty || 0) > 0).map((item: any, index: number) => {
                  const actualQty = item.qty - (item.damagedQty || 0);
                  return (
                  <tr key={index}>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "center", color: "#64748b" }}>{index + 1}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", fontWeight: "500" }}>{cleanName(item.product.name)}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "center", fontWeight: "bold", color: "#10b981", fontSize: "15px" }}>{actualQty}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "right" }}>{(item.importPrice||0).toLocaleString()}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "right", fontWeight: "bold" }}>{(actualQty * (item.importPrice||0)).toLocaleString()}</td>
                  </tr>
                )})}
              </tbody>
            </table>
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "40px" }}>
               <div style={{ background: "#f8fafc", padding: "15px 25px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "15px", color: "#475569", marginRight: "15px" }}>TỔNG GIÁ TRỊ NHẬP KHO THỰC TẾ:</span>
                  <strong style={{ fontSize: "22px", color: "#0f172a" }}>{printPOData.items.reduce((sum:number, item:any) => sum + ((item.qty - (item.damagedQty || 0)) * (item.importPrice||0)), 0).toLocaleString()} đ</strong>
               </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", marginTop: "40px", fontSize: "14px" }}>
              <div style={{ width: "30%" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Thủ Kho Nhận Hàng</strong>
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ marginTop: "90px", width: "70%", marginInline: "auto", borderTop: "1px solid #94a3b8" }}></div>
              </div>
              <div style={{ width: "30%" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Người Giao Hàng</strong>
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ marginTop: "90px", width: "70%", marginInline: "auto", borderTop: "1px solid #94a3b8" }}></div>
              </div>
              <div style={{ width: "30%" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Quản Lý Cửa Hàng</strong>
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ marginTop: "90px", width: "70%", marginInline: "auto", borderTop: "1px solid #94a3b8" }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MẪU IN PHIẾU XUẤT TRẢ HÀNG LỖI (RETURN) CHUYÊN NGHIỆP                    */}
      {/* ========================================================================= */}
      {printMode === 'po_return' && printPOData && (
        <div className="print-a4-container">
          <div style={{ padding: "40px", fontFamily: "'Inter', sans-serif", color: "#0f172a", maxWidth: "850px", margin: "0 auto", background: "#fff" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "20px", marginBottom: "30px" }}>
              <div>
                <h1 style={{ margin: "0 0 8px 0", fontSize: "26px", fontWeight: "900", color: "#ef4444", letterSpacing: "-0.5px" }}>HẢI LÊ MART</h1>
                <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569", fontWeight: "bold" }}>BỘ PHẬN KIỂM KÊ & ĐỐI SOÁT</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "24px", color: "#ef4444", fontWeight: "800" }}>PHIẾU XUẤT TRẢ HÀNG LỖI</h2>
                <p style={{ margin: "0 0 12px 0", fontSize: "13px", fontStyle: "italic", color: "#64748b" }}>(Return to Vendor)</p>
                <div style={{ display: "inline-block", background: "#fef2f2", padding: "8px 12px", borderRadius: "6px", textAlign: "left", border: "1px solid #fecaca" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "13px" }}><strong>Tham chiếu PO:</strong> <span style={{ color: "#b91c1c", fontWeight: "bold" }}>{printPOData.po_code}</span></p>
                  <p style={{ margin: 0, fontSize: "13px" }}><strong>Ngày xuất trả:</strong> {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: "30px", fontSize: "14px", lineHeight: "1.6", background: "#fff1f2", padding: "16px", borderLeft: "4px solid #ef4444", borderRadius: "0 8px 8px 0" }}>
              <p style={{ margin: "0 0 8px 0", color: "#991b1b", fontSize: "13px", textTransform: "uppercase", fontWeight: "bold" }}>HOÀN TRẢ LẠI CHO NHÀ CUNG CẤP</p>
              <p style={{ margin: "0 0 4px 0", color: "#7f1d1d", fontSize: "15px", fontWeight: "bold" }}>{printPOData.supplier?.name}</p>
              <p style={{ margin: "0 0 8px 0", color: "#7f1d1d" }}><strong>SĐT:</strong> {printPOData.supplier?.phone} | <strong>Địa chỉ:</strong> {printPOData.supplier?.address || "---"}</p>
              <p style={{ margin: "0", color: "#b91c1c", fontStyle: "italic" }}><strong>Lý do trả hàng:</strong> Phát hiện hàng hóa bị lỗi/hư hỏng, không đạt tiêu chuẩn chất lượng khi nhân viên kho tiến hành kiểm tra đối soát.</p>
            </div>
            
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "center", width: "5%", color: "#475569" }}>STT</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "left", width: "45%", color: "#475569" }}>Tên Sản Phẩm Bị Lỗi</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "center", width: "15%", color: "#475569" }}>SL Trả</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "right", width: "15%", color: "#475569" }}>Đơn Giá</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "right", width: "20%", color: "#475569" }}>Thành Tiền</th>
                </tr>
              </thead>
              <tbody>
                {printPOData.items.filter((i:any) => (i.damagedQty || 0) > 0).map((item: any, index: number) => (
                  <tr key={index}>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "center", color: "#64748b" }}>{index + 1}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", fontWeight: "500", color: "#7f1d1d" }}>{cleanName(item.product.name)}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "center", color: "#ef4444", fontWeight: "bold", fontSize: "15px" }}>{item.damagedQty}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "right" }}>{(item.importPrice||0).toLocaleString()}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "right", fontWeight: "bold" }}>{(item.damagedQty * (item.importPrice||0)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
               <div style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic", width: "50%" }}>
                 * Lưu ý: Số tiền hoàn trả này sẽ được hệ thống tự động giảm trừ trực tiếp vào công nợ của hóa đơn mua hàng hiện tại.
               </div>
               <div style={{ background: "#fff1f2", padding: "15px 25px", borderRadius: "8px", border: "1px solid #fecaca" }}>
                  <span style={{ fontSize: "15px", color: "#991b1b", marginRight: "15px", fontWeight: "bold" }}>TỔNG GIÁ TRỊ HOÀN TRẢ:</span>
                  <strong style={{ fontSize: "22px", color: "#ef4444" }}>{printPOData.items.reduce((sum:number, item:any) => sum + ((item.damagedQty || 0) * (item.importPrice||0)), 0).toLocaleString()} đ</strong>
               </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", marginTop: "60px", fontSize: "14px" }}>
              <div style={{ width: "45%" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Người Giao Hàng (Nhận lại hàng lỗi)</strong>
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ marginTop: "90px", width: "60%", marginInline: "auto", borderTop: "1px solid #94a3b8" }}></div>
              </div>
              <div style={{ width: "45%" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Đại Diện Cửa Hàng (Xuất trả)</strong>
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ marginTop: "90px", width: "60%", marginInline: "auto", borderTop: "1px solid #94a3b8" }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderModals = () => {
    return (
      <>
        <ExpenseModal showExpenseModal={showExpenseModal} setShowExpenseModal={setShowExpenseModal} expName={expName} setExpName={setExpName} expAmount={expAmount} setExpAmount={setExpAmount} expenses={expenses} addExpense={addExpense} deleteExpense={deleteExpense} />
        
        {/* MODAL SUPPLIER XỊN XÒ */}
        {showSupplierModal && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-box" style={{ maxWidth: '900px', height: '80vh' }}>
              <div className="custom-modal-header">
                <h2 className="custom-modal-title">🏢 QUẢN LÝ NHÀ CUNG CẤP</h2>
                <button className="custom-modal-close" onClick={() => setShowSupplierModal(false)}>&times;</button>
              </div>
              <div className="custom-modal-header" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', background: '#f1f5f9', height: '100%', boxSizing: 'border-box' }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>Thêm Mới NCC</h3>
                  <div className="custom-input-group"><label className="custom-label">Tên Nhà Cung Cấp</label><input className="custom-input" placeholder="VD: Công ty TNHH Vinamilk" value={supName} onChange={e => setSupName(e.target.value)} /></div>
                  <div className="custom-input-group"><label className="custom-label">Số điện thoại</label><input className="custom-input" placeholder="VD: 0901234567" value={supPhone} onChange={e => setSupPhone(e.target.value)} /></div>
                  <div className="custom-input-group"><label className="custom-label">Địa chỉ</label><input className="custom-input" placeholder="Số nhà, Đường, Quận..." value={supAddress} onChange={e => setSupAddress(e.target.value)} /></div>
                  <div className="custom-input-group"><label className="custom-label">Mặt hàng cung cấp</label><input className="custom-input" placeholder="Sữa, Nước giải khát..." value={supItem} onChange={e => setSupItem(e.target.value)} /></div>
                  <button className="gradient-btn" onClick={addSupplier} style={{ marginTop: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>+ THÊM NHÀ CUNG CẤP</button>
                </div>
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    <table className="modern-table">
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th>Tên NCC</th><th>Liên hệ</th><th>Địa chỉ</th><th>Nợ hiện tại</th><th style={{textAlign:'center'}}>Xóa</th></tr></thead>
                      <tbody>
                        {suppliers.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>Chưa có dữ liệu nhà cung cấp</td></tr>}
                        {suppliers.map(s => (
                          <tr key={s.id}>
                            <td style={{fontWeight:'bold', color:'#0f172a'}}>{s.name}</td>
                            <td>{s.phone}</td>
                            <td style={{maxWidth:'150px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={s.address}>{s.address || '-'}</td>
                            <td style={{ color: "#ef4444", fontWeight: "bold" }}>{(s.debt || 0).toLocaleString()}đ</td>
                            <td style={{textAlign:'center'}}><button onClick={() => deleteSupplier(s.id)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "22px" }}>&times;</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL SETTINGS XỊN XÒ */}
        {showSettings && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-box" style={{ maxWidth: '600px' }}>
              <div className="custom-modal-header">
                <h2 className="custom-modal-title">⚙️ CÀI ĐẶT HỆ THỐNG</h2>
                <button className="custom-modal-close" onClick={() => setShowSettings(false)}>&times;</button>
              </div>
              <div className="custom-modal-body" style={{ background: '#f8fafc' }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <h3 style={{ marginTop: 0, color: '#3b82f6', marginBottom: '16px', fontSize: '15px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px' }}>THÔNG TIN THANH TOÁN (QR CODE)</h3>
                  <div className="custom-input-group">
                    <label className="custom-label">Ngân Hàng (BIN):</label>
                    <select className="custom-input" value={newBankBin} onChange={e => setNewBankBin(e.target.value)}>
                      <option value="">-- Chọn Ngân Hàng --</option>
                      <option value="970436">Vietcombank</option>
                      <option value="970415">VietinBank</option>
                      <option value="970418">BIDV</option>
                      <option value="970405">Agribank</option>
                      <option value="970422">MBBank (Ngân hàng Quân đội)</option>
                      <option value="970407">Techcombank</option>
                      <option value="970416">ACB</option>
                      <option value="970432">VPBank</option>
                      <option value="970423">TPBank</option>
                      <option value="970403">Sacombank</option>
                      <option value="970437">HDBank</option>
                      <option value="970441">VIB</option>
                      <option value="970443">SHB</option>
                      <option value="970440">SeABank</option>
                      <option value="970426">MSB</option>
                      <option value="970448">OCB</option>
                      <option value="970431">Eximbank</option>
                      <option value="970429">SCB</option>
                      <option value="970449">LPBank (LienVietPostBank)</option>
                      <option value="970439">PVcomBank</option>
                      <option value="970409">Bac A Bank</option>
                      <option value="970419">NCB</option>
                      <option value="970438">BaoViet Bank</option>
                      <option value="970427">Viet A Bank</option>
                      <option value="970452">Kienlongbank</option>
                      <option value="970400">Saigonbank</option>
                      <option value="970428">Nam A Bank</option>
                      <option value="970406">DongA Bank</option>
                      <option value="970433">Vietbank</option>
                      <option value="970425">ABBank</option>
                    </select>
                  </div>
                  <div className="custom-input-group"><label className="custom-label">Số Tài Khoản:</label><input className="custom-input" placeholder="Nhập số tài khoản..." value={newBankAcc} onChange={e => setNewBankAcc(e.target.value)} /></div>
                  <div className="custom-input-group"><label className="custom-label">Tên Chủ Tài Khoản:</label><input className="custom-input" placeholder="VD: NGUYEN VAN A" value={newBankNameStr} onChange={e => setNewBankNameStr(e.target.value)} /></div>
                  <div className="custom-input-group" style={{ marginBottom: 0 }}><label className="custom-label">SĐT ZaloPay (Đăng ký ví):</label><input className="custom-input" placeholder="VD: 0901234567" value={newZaloPayId} onChange={e => setNewZaloPayId(e.target.value)} /></div>
                </div>
                
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ marginTop: 0, color: '#f59e0b', marginBottom: '16px', fontSize: '15px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px' }}>CẤU HÌNH GIỜ VÀNG (HAPPY HOUR)</h3>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ flex: 1 }} className="custom-input-group"><label className="custom-label">Giờ Bắt đầu:</label><input type="time" className="custom-input" value={newHappyStart} onChange={e => setNewHappyStart(e.target.value)} /></div>
                    <div style={{ flex: 1 }} className="custom-input-group"><label className="custom-label">Giờ Kết thúc:</label><input type="time" className="custom-input" value={newHappyEnd} onChange={e => setNewHappyEnd(e.target.value)} /></div>
                  </div>
                </div>
                <button className="gradient-btn" onClick={saveSettings} style={{ marginTop: "20px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)" }}>💾 LƯU CẤU HÌNH HỆ THỐNG</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL KHÁCH HÀNG VIP */}
        {showCustomerModal && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-box" style={{ maxWidth: '900px', height: '80vh' }}>
              <div className="custom-modal-header"><h2 className="custom-modal-title">💎 QUẢN LÝ KHÁCH HÀNG VIP</h2><button className="custom-modal-close" onClick={() => setShowCustomerModal(false)}>&times;</button></div>
              <div className="custom-modal-body" style={{ background: '#f8fafc', padding: 0 }}>
                <table className="modern-table">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th>Tên KH</th><th>SĐT</th><th>Ví / Nợ</th><th style={{textAlign:"center", width: "35%"}}>Hành động</th></tr></thead>
                  <tbody>
                    {Object.entries(customers || {}).length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Chưa có Khách hàng VIP</td></tr>}
                    {Object.entries(customers || {}).map(([phone, c]) => (
                      <tr key={phone}>
                        <td style={{fontWeight:'bold', color:'#0f172a'}}>{c?.name || 'Khách Vô Danh'} <br/><span style={{fontSize:'12px', color:'#64748b'}}>{getCustomerTier(c?.totalSpent || 0).name}</span></td>
                        <td>{phone}</td>
                        <td><span style={{color: '#10b981', fontWeight: "bold"}}>Ví: {(c?.wallet||0).toLocaleString()}đ</span><br/><span style={{color: '#ef4444', fontWeight: "bold"}}>Nợ: {(c?.debt||0).toLocaleString()}đ</span></td>
                        <td style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                           <button onClick={()=>handleEditPhone(phone)} style={{ flex: "1 1 45%", padding: "8px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                             ✏️ Sửa
                           </button>
                           <button onClick={()=>printCustomerCard(phone)} style={{ flex: "1 1 45%", padding: "8px", background: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", boxShadow: "0 2px 4px rgba(16,185,129,0.2)" }}>
                             🖨️ In Thẻ
                           </button>
                           <button onClick={()=>sendCardEmail(phone)} style={{ flex: "1 1 45%", padding: "8px", background: "#f59e0b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", boxShadow: "0 2px 4px rgba(245,158,11,0.2)" }}>
                             ✉️ Email
                           </button>
                           <button onClick={()=>shareToZalo(phone)} style={{ flex: "1 1 45%", padding: "8px", background: "#06b6d4", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", boxShadow: "0 2px 4px rgba(6,182,212,0.2)" }}>
                             💬 Zalo
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL GỬI EMAIL MARKETING */}
        {showMarketingModal && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-box" style={{ maxWidth: '550px' }}>
              <div className="custom-modal-header"><h2 className="custom-modal-title">💌 GỬI EMAIL MARKETING</h2><button className="custom-modal-close" onClick={() => setShowMarketingModal(false)}>&times;</button></div>
              <div className="custom-modal-body" style={{ background: '#f8fafc' }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="custom-input-group">
                    <label className="custom-label">Gửi đến nhóm khách hạng:</label>
                    <select className="custom-input" value={marketingTier} onChange={e => setMarketingTier(e.target.value)}>
                      <option value="Tất cả">Tất cả Khách hàng VIP</option><option value="ĐỒNG">Hạng ĐỒNG</option><option value="BẠC">Hạng BẠC</option><option value="VÀNG">Hạng VÀNG</option><option value="KIM CƯƠNG">Hạng KIM CƯƠNG</option>
                    </select>
                  </div>
                  <div className="custom-input-group">
                    <label className="custom-label">Nội dung Ưu đãi / Khuyến mãi:</label>
                    <textarea className="custom-input" rows={6} placeholder="Ví dụ: Giảm giá 20% cho thành viên hạng Vàng nhân dịp Lễ..." value={marketingMsg} onChange={e => setMarketingMsg(e.target.value)} style={{ resize: "vertical" }}></textarea>
                  </div>
                  <button className="gradient-btn" onClick={async () => {
                    if (!marketingMsg) return toast.error("Vui lòng nhập nội dung!"); if (!window.confirm("Giới hạn 200 mail/tháng. Gửi?")) return;
                    setLoading(true); 
                    const targetCustomers = Object.keys(customers || {}).filter(phone => { 
                      const c = customers[phone]; 
                      if (!c || !c.email) return false; 
                      if (marketingTier === "Tất cả") return true; 
                      return getCustomerTier(c.totalSpent || 0).name.includes(marketingTier);
                    });
                    if (targetCustomers.length === 0) { setLoading(false); return toast.error("Không có khách hàng nào phù hợp!"); }
                    
                    let successCount = 0;
                    for (const phone of targetCustomers) { 
                      const c = customers[phone]; 
                      const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center;"><h1 style="margin: 0; font-size: 24px;">HẢI LÊ MART</h1><p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">THÔNG BÁO ƯU ĐÃI ĐẶC QUYỀN</p></div><div style="padding: 30px 20px; background: #ffffff;"><h2 style="margin: 0 0 15px 0; color: #0f172a; font-size: 20px;">Chào ${c.name},</h2><div style="color: #475569; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${marketingMsg}</div></div><div style="background: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;"><p style="margin: 0; font-size: 12px; color: #94a3b8;">Hải Lê Mart © 2026 - Hotline: 0902 613 899</p></div></div>`;
                      try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { to_email: c.email, subject: "💌 Ưu Đãi Đặc Quyền Từ Hải Lê Mart", html_message: htmlContent, order_id: "", time: "", items_list: "", total_amount: "", payment_method: "", change_amount: "", barcode_url: "" }); successCount++; } catch (error: any) { console.error("EmailJS Error", error); } 
                    }
                    logAudit("GỬI MAIL MKT", `Gửi ${successCount} mail cho tập ${marketingTier}`); setLoading(false); setShowMarketingModal(false); toast.success(`Đã gửi ${successCount} mail!`)
                  }} disabled={loading}>{loading ? "ĐANG GỬI CHIẾN DỊCH..." : "🚀 BẮT ĐẦU GỬI EMAIL"}</button>
                  <p style={{ fontSize: "12px", color: "#64748b", textAlign: "center", marginTop: "15px" }}>* Gửi tự động đến hộp thư của Khách hàng qua EmailJS.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL PHIẾU NHẬP PO BIÊN TẬP HOÀN CHỈNH */}
        {showPOModal && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-box" style={{ maxWidth: '1100px', height: '90vh' }}>
              <div className="custom-modal-header">
                <h2 className="custom-modal-title">📦 QUẢN LÝ PHIẾU NHẬP (PO)</h2>
                <button className="custom-modal-close" onClick={() => setShowPOModal(false)}>&times;</button>
              </div>
              <div style={{ display: "flex", gap: "10px", padding: "15px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <button onClick={() => setPoTab('NEW')} className={`tab-btn ${poTab === 'NEW' ? 'active' : ''}`} style={{ padding: "10px 20px", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: poTab === 'NEW' ? "#3b82f6" : "#e2e8f0", color: poTab === 'NEW' ? "white" : "#64748b" }}>+ TẠO PO MỚI (CHỜ NHẬN)</button>
                <button onClick={() => setPoTab('RECEIVE')} className={`tab-btn ${poTab === 'RECEIVE' ? 'active' : ''}`} style={{ padding: "10px 20px", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: poTab === 'RECEIVE' ? "#3b82f6" : "#e2e8f0", color: poTab === 'RECEIVE' ? "white" : "#64748b" }}>📥 TÌM & NHẬN HÀNG</button>
              </div>
              <div className="custom-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", background: "#f1f5f9", padding: "24px" }}>
                
                {poTab === 'NEW' && (
                  <>
                    <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", height: "fit-content" }}>
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>1. Chọn Nhà Cung Cấp</h3>
                      <select className="custom-input" value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} style={{ marginBottom: "24px" }}>
                        <option value="">-- Click để chọn NCC --</option>
                        {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>)}
                      </select>
                      
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>2. Tìm Sản Phẩm</h3>
                      <input type="text" className="custom-input" placeholder="Nhập tên hoặc mã SP..." value={poSearch} onChange={e => setPoSearch(e.target.value)} />
                      <div style={{ maxHeight: "250px", overflowY: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", marginTop: "10px" }}>
                        {poSearch.trim() && products.filter(p => cleanName(p.name).toLowerCase().includes(poSearch.toLowerCase()) || String(p.product_code).toLowerCase().includes(poSearch.toLowerCase())).slice(0, 10).map(p => (
                          <div key={p.id} onClick={() => {
                            const exist = poItems.find(i => i.product.id === p.id);
                            if (exist) { setPoItems(poItems.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i)); } else { setPoItems([{ product: p, qty: 1, importPrice: p.import_price || 0 }, ...poItems]); }
                            setPoSearch("");
                          }} style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "0.2s" }} onMouseOver={e=>e.currentTarget.style.background="#f8fafc"} onMouseOut={e=>e.currentTarget.style.background="white"}>
                            <div style={{ fontWeight: "bold", color: "#0f172a", fontSize: "14px" }}>{cleanName(p.name)}</div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Mã: {p.product_code} | Giá nhập: {(p.import_price||0).toLocaleString()}đ</div>
                          </div>
                        ))}
                      </div>
                      
                      <div style={{ marginTop: "24px" }}>
                        <label className="custom-label">Ghi chú (Tùy chọn):</label>
                        <textarea className="custom-input" placeholder="Ghi chú phiếu..." value={poNote} onChange={e => setPoNote(e.target.value)} rows={3} style={{ resize: "vertical", marginTop: "4px" }} />
                      </div>
                    </div>

                    <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", height: "fit-content", minHeight: "100%" }}>
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>Danh sách Sản Phẩm Sẽ Đặt</h3>
                      <div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                        <table className="modern-table" style={{ margin: 0 }}>
                          <thead style={{position: 'sticky', top: 0, zIndex: 1}}><tr><th>Sản phẩm</th><th style={{textAlign:"center"}}>Số lượng</th><th style={{textAlign:"right"}}>Giá nhập (đ)</th><th style={{textAlign:"right"}}>Thành tiền</th><th style={{textAlign:'center'}}>Xóa</th></tr></thead>
                          <tbody>
                            {poItems.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Chưa có sản phẩm nào được chọn</td></tr>}
                            {poItems.map((item, idx) => (
                              <tr key={idx}>
                                <td style={{fontWeight: "600", color: "#0f172a"}}>{cleanName(item.product.name)}</td>
                                <td style={{textAlign:"center"}}><input type="number" className="custom-input" style={{ padding: "6px", width: "70px", textAlign: "center" }} value={item.qty} onChange={e => { const val = parseInt(e.target.value)||1; setPoItems(poItems.map((i, ix) => ix === idx ? { ...i, qty: val } : i)) }} min="1" /></td>
                                <td style={{textAlign:"right"}}><input type="number" className="custom-input" style={{ padding: "6px", width: "110px", textAlign: "right" }} value={item.importPrice} onChange={e => { const val = parseInt(e.target.value)||0; setPoItems(poItems.map((i, ix) => ix === idx ? { ...i, importPrice: val } : i)) }} min="0" /></td>
                                <td style={{ fontWeight: "bold", textAlign: "right", color: "#3b82f6" }}>{(item.qty * item.importPrice).toLocaleString()}</td>
                                <td style={{ textAlign: "center" }}><button onClick={() => setPoItems(poItems.filter((_, ix) => ix !== idx))} style={{ background: "none", color: "#ef4444", border: "none", cursor: "pointer", fontSize: "20px" }}>&times;</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", marginTop: "24px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                          <span style={{ fontSize: "16px", color: "#475569" }}>Tổng giá trị đơn hàng:</span>
                          <b style={{ fontSize: "22px", color: "#0f172a" }}>{poItems.reduce((sum, item) => sum + (item.qty * item.importPrice), 0).toLocaleString()}đ</b>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                          <span style={{ fontSize: "15px", color: "#475569" }}>Đã trả trước cho NCC:</span>
                          <input type="number" className="custom-input" style={{ width: "200px", textAlign: "right", fontWeight: "bold", color: "#10b981", fontSize: "16px" }} value={paidAmount} onChange={e => setPaidAmount(parseInt(e.target.value)||0)} min="0" />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingTop: "15px", borderTop: "1px dashed #cbd5e1" }}>
                          <span style={{ fontSize: "16px", color: "#475569", fontWeight: "bold" }}>Công nợ sẽ ghi nhận:</span>
                          <b style={{ fontSize: "20px", color: "#ef4444" }}>{(poItems.reduce((sum, item) => sum + (item.qty * item.importPrice), 0) - paidAmount).toLocaleString()}đ</b>
                        </div>
                        <button className="gradient-btn" onClick={async () => {
                          if (!selectedSupplierId) return toast.error("Vui lòng chọn Nhà Cung Cấp!");
                          if (poItems.length === 0) return toast.error("Phiếu nhập trống!");
                          const supplier = suppliers.find(s => s.id.toString() === selectedSupplierId);
                          if (!supplier) return;
                          setLoading(true);
                          try {
                            const totalPOAmount = poItems.reduce((sum, item) => sum + (item.qty * item.importPrice), 0);
                            const debtAmount = totalPOAmount - paidAmount; 
                            const poCode = "PO" + Date.now().toString().slice(-6);
                            const newPO = { id: Date.now().toString(), po_code: poCode, supplier: supplier, items: poItems, total_amount: totalPOAmount, paid_amount: paidAmount, debt_amount: debtAmount, status: 'PENDING', note: poNote, created_at: new Date().toISOString() };
                            
                            const updatedPOs = [newPO, ...localPOs]; 
                            setLocalPOs(updatedPOs); 
                            localStorage.setItem("mart_pos", JSON.stringify(updatedPOs));

                            if(navigator.onLine) { await supabase.from('purchase_orders_v2').insert([newPO]); }
                            
                            setPoItems([]);
                            setPoNote("");
                            setSelectedSupplierId("");
                            setPaidAmount(0);
                            toast.success(`Đã lưu Phiếu Đặt Hàng ${poCode}!`);
                            setPoTab('RECEIVE');
                            setSearchPoCode(poCode);
                            setFoundPO(newPO);
                            setReceiveItems(newPO.items.map((i: any) => ({ ...i, damagedQty: 0 })));

                          } catch (err: any) { toast.error("Lỗi: " + err.message); } finally { setLoading(false); }
                        }} disabled={loading} style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)", padding: "16px", fontSize: "16px" }}>
                          {loading ? "ĐANG LƯU..." : "💾 LƯU PHIẾU ĐẶT HÀNG"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {poTab === 'RECEIVE' && (
                  <>
                    <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", height: "fit-content" }}>
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>1. Danh sách Phiếu Nhập</h3>
                      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                        <input type="text" className="custom-input" placeholder="Nhập mã PO để lọc..." value={searchPoCode} onChange={e => setSearchPoCode(e.target.value)} />
                        <button className="gradient-btn" onClick={async () => {
                          const code = (searchPoCode || "").trim().toUpperCase(); if (!code) return; setLoading(true);
                          const localMatch = localPOs.find(p => (p.po_code || "").toUpperCase() === code);
                          if (localMatch) { setFoundPO(localMatch); setReceiveItems(localMatch.items.map((i: any) => ({ ...i, damagedQty: 0 }))); setLoading(false); return; }
                          if (navigator.onLine) {
                            const { data, error } = await supabase.from('purchase_orders_v2').select('*').ilike('po_code', code).single();
                            if (error || !data) { toast.error("Không tìm thấy số PO này!"); } else { setFoundPO(data); setReceiveItems(data.items.map((i: any) => ({ ...i, damagedQty: 0 }))); }
                          } else {
                            toast.error("Mất mạng và không tìm thấy trong bộ nhớ!");
                          }
                          setLoading(false);
                        }} disabled={loading} style={{ width: "80px", background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", boxShadow: "none", padding: "10px" }}>TÌM</button>
                      </div>
                      
                      <div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px", minHeight: "200px" }}>
                        <table className="modern-table" style={{ margin: 0, fontSize: "12px" }}>
                          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                            <tr><th>Mã PO</th><th>Nhà Cung Cấp</th><th>Trạng thái</th><th style={{textAlign:"center"}}>Thao tác</th></tr>
                          </thead>
                          <tbody>
                            {allPOs.length === 0 && !loading && <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>Chưa có phiếu nhập nào</td></tr>}
                            {loading && allPOs.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>Đang tải dữ liệu...</td></tr>}
                            {allPOs.filter(p => (p.po_code || "").toLowerCase().includes((searchPoCode || "").toLowerCase())).map(po => (
                              <tr key={po.id} style={{ background: po.id === foundPO?.id ? "#eff6ff" : "transparent" }}>
                                <td style={{ fontWeight: "bold", color: "#3b82f6" }}>{po.po_code}</td>
                                <td style={{maxWidth:'100px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={po.supplier?.name}>{po.supplier?.name}</td>
                                <td>
                                  <span style={{ color: po.status === 'PENDING' ? '#d97706' : '#059669', padding: "4px 8px", background: po.status === 'PENDING' ? '#fef3c7' : '#d1fae5', borderRadius: "4px", fontWeight: "bold", fontSize: "11px" }}>
                                    {po.status === 'PENDING' ? 'Chờ nhận' : 'Hoàn tất'}
                                  </span>
                                </td>
                                <td style={{ textAlign: "center", display: "flex", justifyContent: "center", gap: "6px" }}>
                                  <button onClick={() => { setFoundPO(po); setSearchPoCode(po.po_code); setReceiveItems(po.items.map((i: any) => ({ ...i, damagedQty: 0 }))); }} style={{ padding: "6px 12px", background: "#0f172a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}>CHỌN</button>
                                  <button onClick={() => handlePrintPO(po, 'po_order')} style={{ padding: "6px 12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}>🖨️ IN PO</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {foundPO && (
                        <div style={{ marginTop: "15px", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", gap: "10px" }}>
                                <span style={{ color: "#64748b", fontSize:"13px" }}>Số PO:</span>
                                <span style={{ fontWeight: "bold", color: "#3b82f6", fontSize:"13px" }}>{foundPO.po_code}</span>
                              </div>
                              <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", gap: "10px" }}>
                                <span style={{ color: "#64748b", fontSize:"13px" }}>Nhà Cung Cấp:</span>
                                <span style={{ fontWeight: "bold", color: "#0f172a", fontSize:"13px" }}>{foundPO.supplier?.name}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                                <span style={{ color: "#64748b", fontSize:"13px" }}>Ngày tạo:</span>
                                <span style={{ color: "#0f172a", fontSize:"13px" }}>{new Date(foundPO.created_at).toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                            <button onClick={() => handlePrintPO(foundPO, 'po_order')} style={{ padding: "10px 15px", background: "#0f172a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
                              🖨️ In Phiếu PO
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", height: "fit-content", minHeight: "100%" }}>
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>2. Đối Soát Hàng & Nhập Kho</h3>
                      {foundPO ? (
                        foundPO.status === 'COMPLETED' ? (
                           <div style={{ textAlign: "center", padding: "40px", background: "#ecfdf5", borderRadius: "12px", border: "1px solid #a7f3d0", marginTop: "20px" }}>
                             <div style={{ color: "#059669", fontWeight: "bold", fontSize: "18px", marginBottom: "20px" }}>✅ PHIẾU NÀY ĐÃ ĐƯỢC ĐỐI SOÁT & NHẬP KHO XONG!</div>
                             <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
                               <button onClick={() => handlePrintPO(foundPO, 'po_receipt')} style={{ padding: "12px 20px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 2px 4px rgba(16,185,129,0.3)" }}>
                                 🖨️ In Phiếu Nhập Kho
                               </button>
                               {foundPO.items.some((i:any) => i.damagedQty > 0) && (
                                 <button onClick={() => handlePrintPO(foundPO, 'po_return')} style={{ padding: "12px 20px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 2px 4px rgba(239,68,68,0.3)" }}>
                                   🖨️ In Phiếu Trả Hàng Lỗi
                                 </button>
                               )}
                             </div>
                           </div>
                        ) : (
                          <>
                            <div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                              <table className="modern-table" style={{ margin: 0 }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th style={{textAlign:"left"}}>Sản phẩm</th><th style={{textAlign:"center"}}>SL Đã Đặt</th><th style={{textAlign:"center"}}>Hàng Hỏng/Lỗi</th><th style={{textAlign:"center"}}>SL Sẽ Nhập</th></tr></thead>
                                <tbody>
                                  {receiveItems.map((item, idx) => (
                                    <tr key={idx}>
                                      <td style={{fontWeight: "600", color: "#0f172a"}}>{cleanName(item.product.name)}</td>
                                      <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", color: "#3b82f6" }}>{item.qty}</td>
                                      <td style={{ textAlign: "center" }}><input type="number" className="custom-input" style={{ padding: "6px", width: "90px", textAlign: "center", color: "#ef4444", fontWeight: "bold", borderColor: item.damagedQty > 0 ? "#ef4444" : "#cbd5e1" }} value={item.damagedQty} onChange={e => { const val = parseInt(e.target.value)||0; if(val <= item.qty && val >= 0) setReceiveItems(receiveItems.map((i, ix) => ix === idx ? { ...i, damagedQty: val } : i)) }} min="0" max={item.qty} /></td>
                                      <td style={{ textAlign: "center", fontWeight: "bold", color: "#10b981", fontSize: "18px" }}>{item.qty - (item.damagedQty || 0)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            
                            <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", marginTop: "24px", border: "1px solid #e2e8f0" }}>
                               <p style={{ fontStyle: "italic", color: "#64748b", margin: "0 0 15px 0", fontSize: "13px", lineHeight: "1.5" }}>* Hệ thống sẽ tự động đối soát, cộng kho hàng thực tế và hoàn trả tiền công nợ hàng hỏng cho Nhà Cung Cấp.</p>
                               <button className="gradient-btn" onClick={async () => {
                                  if (!foundPO || receiveItems.length === 0) return; setLoading(true);
                                  try {
                                    let actualTotal = 0; let logs: any[] = [];
                                    for (const item of receiveItems) {
                                        const actualQty = item.qty - (item.damagedQty || 0); actualTotal += actualQty * item.importPrice;
                                        if (actualQty > 0) {
                                            const p = products.find(x => x.id === item.product.id);
                                            if (p) {
                                                await supabase.from('products').update({ stock: p.stock + actualQty, import_price: item.importPrice }).eq('id', p.id);
                                                logs.push({ id: Date.now() + Math.random(), shift, type: "NHẬP PO", name: p.name, qty: actualQty, total: actualQty * item.importPrice, time: new Date().toLocaleString('vi-VN') });
                                            }
                                        }
                                        if (item.damagedQty > 0) { logs.push({ id: Date.now() + Math.random(), shift, type: "TRẢ HÀNG NCC", name: item.product.name + " (Lỗi/Hỏng)", qty: item.damagedQty, total: 0, time: new Date().toLocaleString('vi-VN') }); }
                                    }
                                    
                                    const finalDebt = actualTotal - foundPO.paid_amount;
                                    if (finalDebt > 0 && foundPO.supplier) {
                                        const supplierId = foundPO.supplier.id; const s = suppliers.find(x => x.id === supplierId);
                                        if (s) { const newD = (s.debt || 0) + finalDebt; await supabase.from('suppliers').update({ debt: newD }).eq('id', supplierId); setSuppliers(prev => prev.map(x => x.id === supplierId ? { ...x, debt: newD } : x)); }
                                    }

                                    if(navigator.onLine) await supabase.from('purchase_orders_v2').update({ status: 'COMPLETED', items: receiveItems, total_amount: actualTotal }).eq('id', foundPO.id);
                                    
                                    const updatedPOs = localPOs.map(p => p.id === foundPO.id ? { ...p, status: 'COMPLETED', items: receiveItems, total_amount: actualTotal } : p); setLocalPOs(updatedPOs); localStorage.setItem("mart_pos", JSON.stringify(updatedPOs));

                                    logs.forEach(lg => addTransactionAndSync(lg)); 
                                    logAudit("NHẬN HÀNG PO", `Nhận mã ${foundPO.po_code}`); 
                                    toast.success("Nhập Kho thành công!"); 
                                    fetchProducts(); 
                                    setFoundPO(prev => ({ ...prev, status: 'COMPLETED', items: receiveItems, total_amount: actualTotal }));
                                  } catch (err: any) { toast.error("Lỗi: " + err.message); } finally { setLoading(false); }
                               }} disabled={loading} style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)", padding: "16px", fontSize: "16px" }}>{loading ? "ĐANG XỬ LÝ..." : "✅ XÁC NHẬN NHẬN HÀNG"}</button>
                            </div>
                          </>
                        )
                      ) : (
                        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", border: "2px dashed #cbd5e1", borderRadius: "12px", background: "#f8fafc", marginTop: "20px" }}>Vui lòng chọn một Phiếu Nhập (PO) từ danh sách bên trái để tiếp tục.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CÁC MODAL KHÁC CỦA HỆ THỐNG */}
        {showHandoverModal && (<HandoverModal role={role} shift={shift} startingCash={startingCash} currentShiftStats={currentShiftStats} onClose={() => setShowHandoverModal(false)} onConfirm={confirmHandover} />)}
        <CashFlowModal cashFlowModalInfo={cashFlowModalInfo} setCashFlowModalInfo={setCashFlowModalInfo} shift={shift} todayStrStr={todayStrStr} currentShiftCashFlow={currentShiftCashFlow} currentShiftStats={currentShiftStats} />
        <HoldOrdersModal showHoldModal={showHoldModal} setShowHoldModal={setShowHoldModal} heldOrders={heldOrders} restoreOrder={restoreOrder} deleteHeldOrder={deleteHeldOrder} />
        <CheckoutModal isCheckoutOpen={isCheckoutOpen} setIsCheckoutOpen={setIsCheckoutOpen} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep} voucherInput={voucherInput} setVoucherInput={setVoucherInput} customerInput={customerInput} setCustomerInput={setCustomerInput} custPhone={custPhone} setCustPhone={setCustPhone} custName={custName} setCustName={setCustName} useWallet={useWallet} setUseWallet={setUseWallet} appliedVoucherAmount={appliedVoucherAmount} setAppliedVoucherAmount={setAppliedVoucherAmount} customerGiven={customerGiven} setCustomerGiven={setCustomerGiven} finalToPay={finalToPay} customers={customers} isOnline={isOnline} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} loading={loading} handleVoucherSubmit={handleVoucherSubmit} handleCustomerInputChange={handleCustomerInputChange} setScannerMode={setScannerMode} handleNextToQR={handleNextToQR} confirmCheckout={confirmCheckout} setPrintMode={setPrintMode} sendReceiptEmail={sendReceiptEmail} closeCheckout={closeCheckout} />
        <StatsModal showStatsModal={showStatsModal} setShowStatsModal={setShowStatsModal} reportStartDate={reportStartDate} setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} setReportEndDate={setReportEndDate} exportToCSV={exportToCSV} onExportCSV={exportToCSV} handleExportCSV={exportToCSV} sendInventoryAlertEmail={sendInventoryAlertEmail} onSendAlert={sendInventoryAlertEmail} handleSendEmailReport={handleSendEmailReport} onSendReport={handleSendEmailReport} filteredStats={filteredStats} chartData={chartData} topSelling={topSelling} products={products} />
        <InventoryModal showInventoryModal={showInventoryModal} setShowInventoryModal={setShowInventoryModal} inventorySearchTerm={inventorySearchTerm} setInventorySearchTerm={setInventorySearchTerm} handleInventorySearchEnter={handleInventorySearchEnter} invFilter={invFilter} setInvFilter={setInvFilter} exportInventoryCSV={exportInventoryCSV} onExport={exportInventoryCSV} handleImportInventoryCSV={handleImportInventoryCSV} onImport={handleImportInventoryCSV} products={products} actualStockInput={actualStockInput} setActualStockInput={setActualStockInput} handleInvInputKeyDown={handleInvInputKeyDown} syncInventoryCheck={syncInventoryCheck} onSync={syncInventoryCheck} loading={loading} />
        <DebtModal showDebtModal={showDebtModal} setShowDebtModal={setShowDebtModal} customers={customers} handlePayDebt={handlePayDebt} />
        <AuditModal showAuditModal={showAuditModal} setShowAuditModal={setShowAuditModal} auditLogs={auditLogs} exportAuditToCSV={exportAuditToCSV} setSelectedAuditLog={setSelectedAuditLog} setSelectedLog={setSelectedAuditLog} onViewDetail={setSelectedAuditLog} onRowClick={setSelectedAuditLog} />
        <AuditDetailModal selectedAuditLog={selectedAuditLog} setSelectedAuditLog={setSelectedAuditLog} showModal={!!selectedAuditLog} setShowModal={(val: boolean) => !val && setSelectedAuditLog(null)} selectedLog={selectedAuditLog} setSelectedLog={setSelectedAuditLog} />
        <ScannerModal scannerMode={scannerMode} setScannerMode={setScannerMode} scanMessage={scanMessage} />
        <PinModal showPinModal={showPinModal} setShowPinModal={setShowPinModal} correctPin={adminPin} onSuccess={() => { if (pendingAction) { pendingAction(); setPendingAction(null); } }} />
        <ScannerLinkModal showModal={showScannerLinkModal} setShowModal={setShowScannerLinkModal} />
      </>
    );
  };

  return (
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); setShowMainMenu(false) }}>
      <style>{styles}</style> 
      <style>{`
        /* KHẮC PHỤC LOGO BỊ GIÃN DÀI VÀ KÉO SAO VÀO SÁT CHỮ T */
        .logo-wrapper { display: inline-flex !important; align-items: center; padding: 10px 45px 10px 20px !important; position: relative; width: fit-content !important; min-width: 0 !important; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 12px; margin-right: auto; }
        .logo-star { position: absolute !important; right: 12px !important; top: 50% !important; transform: translateY(-50%) !important; font-size: 26px !important; color: #f59e0b !important; margin: 0 !important; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }

        /* KHAI BÁO BỘ CSS BẢNG BIỂU & NÚT BẤM HIỆN ĐẠI BẬC NHẤT 2026 */
        .modern-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
        .modern-table th { background: #f8fafc; padding: 14px 16px; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px; white-space: nowrap; }
        .modern-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px; vertical-align: middle; transition: background 0.2s; }
        .modern-table tbody tr:hover td { background: #f8fafc; }
        
        .gradient-btn { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px; border-radius: 8px; font-weight: 800; border: none; width: 100%; font-size: 15px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3); text-transform: uppercase; letter-spacing: 0.5px; }
        .gradient-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4); }
        .gradient-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .custom-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 99999; }
        .custom-modal-overlay * { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important; box-sizing: border-box; }
        .custom-modal-box { background: white; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); width: 95%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes modalPop { 0% { opacity: 0; transform: scale(0.95) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .custom-modal-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #ffffff; }
        .custom-modal-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .custom-modal-close { background: none; border: none; font-size: 28px; color: #94a3b8; cursor: pointer; transition: all 0.2s; padding: 0; line-height: 1; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; }
        .custom-modal-close:hover { color: #ef4444; background: #fee2e2; transform: rotate(90deg); }
        .custom-modal-body { padding: 24px; overflow-y: auto; }
        .custom-input-group { margin-bottom: 18px; }
        .custom-label { display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .custom-input { width: 100%; padding: 12px 16px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; outline: none; transition: all 0.2s; background: #f8fafc; color: #1e293b; font-weight: 500; }
        .custom-input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }

        .animated-bg-mesh { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background: linear-gradient(135deg, #ffedd5 0%, #fef08a 50%, #fed7aa 100%); background-size: 400% 400%; animation: gradientBgAnim 15s ease infinite; opacity: 0.8; }
        @keyframes gradientBgAnim { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        [data-theme='dark'] .animated-bg-mesh { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); opacity: 1; }
        
        /* ==================================================================== */
        /* CSS DÀNH CHO MÁY IN (XÓA TOÀN BỘ UI, CHỈ GIỮ LẠI BẢN IN)            */
        /* ==================================================================== */
        @media print {
          body, html { margin: 0; padding: 0; background: #fff; width: 100%; }
          .no-print, .custom-modal-overlay, .animated-bg-mesh, .Toaster { display: none !important; }
          .print-a4-container { 
            display: block !important; 
            position: absolute !important; 
            top: 0 !important; 
            left: 0 !important; 
            width: 100% !important; 
            background: white !important; 
            z-index: 999999 !important; 
            color: #000 !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
      <div className="animated-bg-mesh"></div>
      <Toaster position="top-right" reverseOrder={false} />

      <input type="text" id="search-barcode" style={{position:'absolute', opacity: 0, height: 0, width: 0}} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmitAction} />
      
      {renderPrintArea()}
      {renderModals()}

      {!isLoggedIn ? (
        <div className="login-wrapper">
          <style>{`
            .login-wrapper { min-height: 100vh; width: 100vw; display: flex; justify-content: center; align-items: center; position: fixed; top:0; left:0; z-index: 9999; font-family: 'Inter', sans-serif;}
            .floating-bubble { position: absolute; background: rgba(255,255,255,0.4); border-radius: 50%; animation: floatUp linear infinite; bottom: -120px; filter: blur(2px); }
            @keyframes floatUp { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-120vh) scale(1.2); opacity: 0; } }
            .glass-login { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.8); padding: 40px 35px; border-radius: 20px; box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1); width: 100%; max-width: 380px; z-index: 10; animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; display: flex; flex-direction: column; gap: 15px; box-sizing: border-box;}
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .login-header { text-align: center; margin-bottom: 10px; }
            .login-title { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin: 0 0 6px 0; color: #0f172a; text-transform: uppercase; }
            .login-title span { color: #e11d48; }
            .login-subtitle { font-size: 13px; color: #64748b; font-weight: 500; margin: 0; }
            .login-input-group { position: relative; width: 100%; margin-bottom: 0; }
            .login-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; width: 18px; height: 18px; pointer-events: none;}
            .login-input { width: 100%; padding: 14px 16px 14px 42px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: #f8fafc; box-sizing: border-box; outline: none; transition: all 0.2s ease; font-size: 14px; color: #1e293b; font-weight: 500; }
            .login-input:focus { border-color: #e11d48; background: #fff; box-shadow: 0 0 0 4px rgba(225, 29, 72, 0.1); }
            .login-btn-submit { width: 100%; padding: 14px; background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); color: #fff; border: none; border-radius: 12px; font-weight: 800; font-size: 15px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25); margin-top: 10px; text-transform: uppercase; letter-spacing: 0.5px;}
            .login-btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(225, 29, 72, 0.35); }
            .login-btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
          `}</style>
          
          <div className="floating-bubble" style={{ width: '100px', height: '100px', left: '10%', animationDuration: '8s' }}></div>
          <div className="floating-bubble" style={{ width: '50px', height: '50px', left: '25%', animationDuration: '5s', animationDelay: '2s' }}></div>
          <div className="floating-bubble" style={{ width: '80px', height: '80px', left: '70%', animationDuration: '10s', animationDelay: '1s' }}></div>
          
          <form className="glass-login" onSubmit={handleLogin}>
            <div className="login-header">
              <h2 className="login-title">HẢI LÊ <span>MART</span></h2>
              <p className="login-subtitle">Hệ thống Quản lý ERP & POS</p>
            </div>
            
            <div className="login-input-group">
              <svg className="login-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <input className="login-input" placeholder="Tên đăng nhập (Email)..." value={authUsername} onChange={e => setAuthUsername(e.target.value)} required />
            </div>
            
            <div className="login-input-group">
              <svg className="login-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <input className="login-input" type="password" placeholder="Mật khẩu truy cập..." value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
            </div>
            
            <button className="login-btn-submit" type="submit" disabled={loading}>
              {loading ? "ĐANG TẢI..." : "ĐĂNG NHẬP HỆ THỐNG"}
            </button>
          </form>
        </div>
      ) : (
        <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh", overflowX: "auto" }}>
          <div style={{ maxWidth: "1500px", margin: "0 auto", minWidth: "1000px" }}>
            
            <Header 
              role={role} shift={shift} totalValue={totalValue} currentShiftStats={currentShiftStats} setCashFlowModalInfo={setCashFlowModalInfo} darkMode={darkMode} setDarkMode={setDarkMode} handleLogoutClick={handleLogoutClick} showMainMenu={showMainMenu} setShowMainMenu={setShowMainMenu} setShowStatsModal={setShowStatsModal} setShowCustomerModal={setShowCustomerModal} setShowInventoryModal={setShowInventoryModal} setShowDebtModal={setShowDebtModal} setShowAuditModal={setShowAuditModal} setShowExpenseModal={setShowExpenseModal} setShowSupplierModal={setShowSupplierModal} setShowMarketingModal={setShowMarketingModal} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} setShowSettings={setShowSettings} lowStockCount={lowStockCount} isOnline={isOnline} syncStatus={syncStatus} syncAllOfflineData={syncAllOfflineData}
              setShowScannerLinkModal={setShowScannerLinkModal} setShowPOModal={setShowPOModal}
            />
            
            <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "10px" }}>
              <div className="glass" style={{ padding: "12px" }}>
                
                <ProductSearchAndActions 
                  role={role} 
                  barcodeInput={barcodeInput} 
                  setBarcodeInput={setBarcodeInput} 
                  showSuggestions={showSuggestions} 
                  setShowSuggestions={setShowSuggestions} 
                  handleBarcodeSubmit={handleBarcodeSubmitAction} 
                  setScannerMode={setScannerMode} 
                  products={products} 
                  handleSelectSuggest={handleSelectSuggest} 
                  
                  showInputForm={showInputForm} 
                  setShowInputForm={setShowInputForm} 
                  onAddProduct={() => setShowInputForm(true)}
                  onAddClick={() => setShowInputForm(true)}
                  handleAddClick={() => setShowInputForm(true)}
                  
                  handleFileUpload={handleFileUpload} 
                  onFileUpload={handleFileUpload}
                  onFileChange={handleFileUpload}
                  
                  downloadSampleCSV={downloadSampleCSV} 
                  onDownloadSample={downloadSampleCSV}
                  handleDownloadSample={downloadSampleCSV}
                />
                
                {showInputForm && (
                  <ProductInputForm
                    newCode={newCode} handleCodeChange={handleCodeChange}
                    newName={newName} setNewName={setNewName}
                    newCategory={newCategory} setNewCategory={setNewCategory}
                    categories={categories}
                    newImportPrice={newImportPrice} setNewImportPrice={setNewImportPrice}
                    newPrice={newPrice} setNewPrice={setNewPrice}
                    newPromoPrice={newPromoPrice} setNewPromoPrice={setNewPromoPrice}
                    newGiftCondition={newGiftCondition} setNewGiftCondition={setNewGiftCondition}
                    newGiftInfo={newGiftInfo} setNewGiftInfo={setNewGiftInfo}
                    newStock={newStock} setNewStock={setNewStock}
                    newExpiry={newExpiry} setNewExpiry={setNewExpiry}
                    handleAddProduct={handleAddProduct}
                    onSubmit={handleAddProduct}
                    onSave={handleAddProduct}
                    setShowInputForm={setShowInputForm}
                    onClose={() => setShowInputForm(false)}
                    onCancel={() => setShowInputForm(false)}
                    loading={loading}
                  />
                )}

                <div style={{ display: "flex", gap: "8px", marginBottom: "15px", marginTop: showInputForm ? "15px" : "0" }}>
                  {categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}>{cat}</button>)}
                </div>
                <ProductTable role={role} sortedAndFilteredProducts={sortedAndFilteredProducts} requestSort={requestSort} handleEdit={handleEdit} addToCart={addToCart} handlePrintBarcode={handlePrintBarcode} handleDelete={handleDelete} sortConfig={sortConfig} filters={filters} setFilters={setFilters} openFilter={openFilter} setOpenFilter={setOpenFilter} uniqueNames={uniqueNames} uniqueStocks={uniqueStocks} uniqueImportPrices={uniqueImportPrices} uniqueSalePrices={uniqueSalePrices} uniqueExpiries={uniqueExpiries} />
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <CartPanel cart={cart} custName={custName} heldOrders={heldOrders} cartTotalAmountDisplay={cartTotalAmountDisplay} setShowHoldModal={setShowHoldModal} handleHoldOrder={handleHoldOrder} clearCart={clearCart} setCustName={setCustName} setCustPhone={setCustPhone} setCustomerInput={setCustomerInput} setIsCheckoutOpen={setIsCheckoutOpen} setCheckoutStep={setCheckoutStep} adjustCartQty={adjustCartQty} handleDirectQtyChange={handleDirectQtyChange} handleDirectQtyBlur={handleDirectQtyBlur} removeFromCart={removeFromCart} />
                <HistoryPanel logSearchTerm={logSearchTerm} setLogSearchTerm={setLogSearchTerm} logTypeFilter={logTypeFilter} setLogTypeFilter={setLogTypeFilter} exportToCSV={exportToCSV} groupedHistory={groupedHistory} expandedDates={expandedDates} toggleDateGroup={toggleDateGroup} handleRefund={handleRefund} handleReprint={handleReprint} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
