// =====================================================================
  // 4. IN PHIẾU ĐẶT HÀNG / NHẬP KHO / ĐỔI TRẢ NCC (PO - CHUẨN KẾ TOÁN A4)
  // =====================================================================
  if (printMode === 'po_order' || printMode === 'po_receipt' || printMode === 'po_return') {
    if (!printPOData) return null;
    const isReceipt = printMode === 'po_receipt';
    const isReturn = printMode === 'po_return';
    
    // 1. TÍNH TOÁN DÒNG TIỀN THỰC TẾ TRÊN TỪNG LOẠI PHIẾU (ĐỘNG)
    let actualTotal = 0;
    printPOData.items?.forEach((item: any) => {
      let q = item.qty;
      if (isReceipt) q = item.qty - (item.damagedQty || 0); // Nhập kho = Chỉ tính hàng tốt
      else if (isReturn) q = item.damagedQty || 0;          // Trả hàng = Chỉ tính hàng hỏng
      
      if (q > 0) {
        actualTotal += q * item.importPrice;
      }
    });

    const paidAmount = Number(printPOData.paid_amount || 0);
    const debtAmount = actualTotal - paidAmount; // Tiền còn nợ thực tế

    let title = isReceipt ? "PHIẾU NHẬP KHO" : isReturn ? "PHIẾU ĐỔI TRẢ HÀNG LỖI" : "PHIẾU ĐẶT HÀNG (PO)";
    let qtyColumnName = isReceipt ? 'SL Nhập' : isReturn ? 'SL Trả' : 'SL Đặt';
    const dateObj = new Date();

    return (
      <div className="print-only-zone" style={{ width: '100%', backgroundColor: '#fff' }}>
        <div style={{ width: '100%', maxWidth: '210mm', margin: '0 auto', padding: '15mm 20mm', fontFamily: '"Times New Roman", Times, serif', color: '#000', boxSizing: 'border-box' }}>
          
          {/* HEADER CHỨNG TỪ - ĐẦY ĐỦ ĐỊA CHỈ & MÃ SỐ THUẾ CỦA HẢI LÊ MART */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '20px' }}>
            <div style={{ width: '55%' }}>
              <h1 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>HỆ THỐNG HẢI LÊ MART</h1>
              <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Địa chỉ:</strong> 123 Đường ABC, Quận XYZ, TP. Hà Nội</p>
              <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Điện thoại:</strong> 0902 613 899</p>
              <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Mã số thuế:</strong> 0101234567</p>
            </div>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>{title}</h2>
              <p style={{ margin: '3px 0', fontSize: '14px', fontStyle: 'italic' }}>Ngày {dateObj.getDate()} tháng {dateObj.getMonth() + 1} năm {dateObj.getFullYear()}</p>
              <p style={{ margin: '3px 0', fontSize: '14px' }}>Mã số: <strong>{printPOData.po_code}</strong></p>
            </div>
          </div>

          {/* THÔNG TIN CHI TIẾT ĐỐI TÁC NHÀ CUNG CẤP */}
          <div style={{ marginBottom: '20px', fontSize: '15px', lineHeight: '1.8' }}>
            <div style={{ display: 'flex' }}><span style={{ width: '150px' }}>Nhà cung cấp:</span><strong>{printPOData.supplier?.name || "................................................"}</strong></div>
            <div style={{ display: 'flex' }}><span style={{ width: '150px' }}>Mã số thuế (MST):</span><span>{printPOData.supplier?.taxCode || printPOData.supplier?.tax_code || "................................................"}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '150px' }}>Địa chỉ:</span><span>{printPOData.supplier?.address || "................................................"}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '150px' }}>Số điện thoại:</span><span>{printPOData.supplier?.phone || "................................................"}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '150px' }}>Số tài khoản:</span><span>{printPOData.supplier?.bankAccount || printPOData.supplier?.bank_account || "................................................"}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '150px' }}>Ghi chú phiếu:</span><span>{printPOData.note || "................................................"}</span></div>
          </div>

          {/* BẢNG LIỆT KÊ SẢN PHẨM */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '15px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '50px' }}>STT</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>Tên mặt hàng</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '60px' }}>ĐVT</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '80px' }}>{qtyColumnName}</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '120px' }}>Đơn giá</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '140px' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {printPOData.items?.map((item: any, idx: number) => {
                let qty = item.qty;
                if (isReceipt) qty = item.qty - (item.damagedQty || 0);
                else if (isReturn) qty = item.damagedQty || 0;
                
                if (qty <= 0) return null; // Ẩn hoàn toàn các món có số lượng hiển thị = 0
                
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{item.product?.name || item.name}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Cái</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{qty}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{Number(item.importPrice).toLocaleString()}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{(qty * item.importPrice).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ĐỐI SOÁT DÒNG TIỀN ĐỘNG */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
            <div style={{ width: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '15px' }}>
                <span>{isReturn ? "Tổng giá trị hàng trả:" : isReceipt ? "Cộng tiền hàng thực nhập:" : "Cộng tiền hàng:"}</span>
                <span style={{ fontWeight: 'bold' }}>{actualTotal.toLocaleString()}đ</span>
              </div>
              
              {!isReturn && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '15px' }}>
                    <span>Đã thanh toán (Trả trước NCC):</span>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{paidAmount.toLocaleString()}đ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '18px', fontWeight: 'bold', borderTop: '2px solid #000' }}>
                    <span>{debtAmount < 0 ? "NCC CẦN HOÀN LẠI:" : "CẦN THANH TOÁN THÊM:"}</span>
                    <span style={{ color: debtAmount < 0 ? '#10b981' : '#ef4444' }}>{Math.abs(debtAmount).toLocaleString()}đ</span>
                  </div>
                </>
              )}

              {/* Nếu là phiếu trả hàng, ghi rõ đây là khoản Giảm trừ công nợ */}
              {isReturn && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '16px', fontWeight: 'bold', borderTop: '2px solid #000', color: '#ea580c' }}>
                  <span>GIÁ TRỊ GIẢM TRỪ CÔNG NỢ:</span>
                  <span>{actualTotal.toLocaleString()}đ</span>
                </div>
              )}
            </div>
          </div>

          {/* VÙNG CHỮ KÝ XÁC NHẬN CHUẨN PHÁP LÝ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <div style={{ textAlign: 'center', width: '30%' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>Người lập phiếu</p>
              <p style={{ margin: '0 0 80px 0', fontSize: '14px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
            </div>
            <div style={{ textAlign: 'center', width: '30%' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>Kế toán trưởng</p>
              <p style={{ margin: '0 0 80px 0', fontSize: '14px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
            </div>
            <div style={{ textAlign: 'center', width: '30%' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>Đại diện NCC</p>
              <p style={{ margin: '0 0 80px 0', fontSize: '14px', fontStyle: 'italic' }}>(Ký, đóng dấu)</p>
            </div>
          </div>

        </div>
      </div>
    );
  }
