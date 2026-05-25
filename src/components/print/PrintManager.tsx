import React from 'react';
import { cleanName, getActualPrice } from '../../utils/helpers';

interface PrintManagerProps {
  printMode: string | null;
  lastOrder: any;
  shift: string;
  role: string;
  customers: any;
  VAT_RATE: number;
  printBarcodeProduct: any;
  barcodeCount: number;
  printCustomer: any;
  printPOData: any;
}

export const PrintManager: React.FC<PrintManagerProps> = ({
  printMode, lastOrder, shift, role, customers, VAT_RATE,
  printBarcodeProduct, barcodeCount, printCustomer, printPOData
}) => {
  
  if (!printMode) return null;

  const safeMode = String(printMode).toLowerCase().trim();

  // =====================================================================
  // HÀM BẢO VỆ HELPERS: Ngăn crash nếu helper bên ngoài viết thiếu an toàn
  // =====================================================================
  const safeGetPrice = (product: any) => {
    try { return typeof getActualPrice === 'function' && product ? (getActualPrice(product) || 0) : 0; } 
    catch { return 0; }
  };

  const safeCleanName = (name: any) => {
    try { return typeof cleanName === 'function' ? cleanName(String(name || '')) : String(name || 'Sản phẩm'); } 
    catch { return String(name || 'Sản phẩm'); }
  };

  // =====================================================================
  // VÙNG 1 & 2: CODE DÀNH RIÊNG CHO HÓA ĐƠN (80MM & A4)
  // =====================================================================
  const renderOrderInvoice = (isA4: boolean) => {
    try {
      if (!lastOrder) return <div className="print-a4-container">Đang chờ dữ liệu hóa đơn...</div>;

      const order = lastOrder;
      const safeFinalTotal = Number(order?.finalTotal) || 0;
      const safeCustomerGiven = Number(order?.customerGiven) || 0;
      const changeAmount = Math.max(0, safeCustomerGiven - safeFinalTotal);
      
      const paymentMethod = String(order?.paymentMethod || 'TIỀN MẶT');
      const orderId = String(order?.orderId || '');
      
      // FIX LỖI LOGIC: Không dùng || safeFinalTotal vì nếu nợ là 0 thì 0 || val sẽ lấy val gây lỗi hiển thị dư nợ
      const isDebtSale = paymentMethod === 'GHI NỢ';
      const isRefundDebt = paymentMethod === 'TRỪ NỢ';
      
      const custPhone = String(order?.custPhone || '');
      const currentTotalDebt = (custPhone && customers?.[custPhone]) ? (Number(customers[custPhone]?.debt) || 0) : 0;
      const custAddress = (custPhone && customers?.[custPhone]) ? (customers[custPhone]?.address || "N/A") : "N/A";
      
      const cartItems = Array.isArray(order?.cart) ? order.cart : [];
      const safeVatRate = Number(VAT_RATE) || 0.1;

      if (!isA4) {
        // ---------------------------------------------------------
        // 1. IN BILL MÁY POS 80MM
        // ---------------------------------------------------------
        return (
          <div className="print-only" style={{ width: "80mm", padding: "10px", fontFamily: "monospace", fontSize: "12px", color: "#000", background: "#fff" }}>
            <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "10px", marginBottom: "10px" }}>
              <h2 style={{ margin: "0 0 5px 0", fontSize: "18px" }}>HẢI LÊ MART</h2>
              <p style={{ margin: "0" }}>Hotline: 0902 613 899</p>
              <p style={{ margin: "0" }}>ĐC: 123 Đường ABC, Hà Nội</p>
            </div>
            
            <div style={{ marginBottom: "10px" }}>
              <p style={{ margin: "2px 0" }}>
                {orderId === 'PHIẾU_TRẢ_HÀNG' ? <b>PHIẾU HOÀN TRẢ HÀNG</b> : <span>Mã HĐ: <b>{orderId}</b></span>}
              </p>
              <p style={{ margin: "2px 0" }}>Thời gian: {order?.time || ''}</p>
              <p style={{ margin: "2px 0" }}>Thu ngân: {role === 'admin' ? 'Quản lý' : 'Nhân viên'} ({shift})</p>
              
              <div style={{ borderTop: "1px dotted #000", paddingTop: "5px", marginTop: "5px" }}>
                <p style={{ margin: "2px 0" }}><b>Khách hàng:</b> {order?.custName || "Khách lẻ"}</p>
                {custPhone && <p style={{ margin: "2px 0" }}><b>SĐT:</b> {custPhone}</p>}
                {custPhone && custAddress !== "N/A" && <p style={{ margin: "2px 0" }}><b>ĐC:</b> {custAddress}</p>}
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #000" }}>
                  <th style={{ textAlign: "left", padding: "5px 0" }}>Sản phẩm</th>
                  <th style={{ textAlign: "center", padding: "5px 0" }}>SL</th>
                  <th style={{ textAlign: "right", padding: "5px 0" }}>T.Tiền</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item: any, idx: number) => {
                  const prod = item?.product || {};
                  const itemQty = Number(item?.qty) || 0;
                  const priceToUse = item?.priceIncludingVat !== undefined 
                    ? Number(item.priceIncludingVat)
                    : Math.round(safeGetPrice(prod) * (1 + safeVatRate));
                    
                  return (
                    <tr key={idx}>
                      <td style={{ padding: "5px 0" }}>{safeCleanName(prod?.name)} {prod?.isHappyHour ? '⭐' : ''}</td>
                      <td style={{ textAlign: "center", padding: "5px 0" }}>{itemQty}</td>
                      <td style={{ textAlign: "right", padding: "5px 0" }}>{(priceToUse * itemQty).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ borderTop: "1px dashed #000", paddingTop: "10px", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                <span>Tổng tiền hàng:</span>
                <span>{Math.round(Number(order?.subTotal || 0) + Number(order?.vatTotal || 0)).toLocaleString()}đ</span>
              </div>
              
              {Number(order?.discount || 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                  <span>Chiết khấu/Ví:</span>
                  <span>-{Math.round(Number(order?.discount || 0)).toLocaleString()}đ</span>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", margin: "5px 0", fontWeight: "bold", fontSize: "14px" }}>
                <span>{orderId === 'PHIẾU_TRẢ_HÀNG' ? "TỔNG TIỀN HOÀN:" : "TỔNG THANH TOÁN:"}</span>
                <span>{Math.round(safeFinalTotal).toLocaleString()}đ</span>
              </div>
              
              <div style={{ borderTop: "1px solid #000", marginTop: "5px", paddingTop: "5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                  <span>Hình thức TT:</span>
                  <span style={{ fontWeight: "bold" }}>{paymentMethod}</span>
                </div>
                
                {/* XỬ LÝ RIÊNG HÌNH THỨC KẾT HỢP */}
                {paymentMethod === 'KẾT HỢP' && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                      <span> - Tiền mặt:</span>
                      <span>{Math.round(safeCustomerGiven).toLocaleString()}đ</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                      <span> - Chuyển khoản:</span>
                      <span>{Math.max(0, safeFinalTotal - safeCustomerGiven).toLocaleString()}đ</span>
                    </div>
                  </>
                )}

                {/* XỬ LÝ RIÊNG HÌNH THỨC TIỀN MẶT */}
                {paymentMethod === 'TIỀN MẶT' && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                      <span>Tiền khách đưa:</span>
                      <span>{Math.round(safeCustomerGiven).toLocaleString()}đ</span>
                    </div>
                    {changeAmount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                        <span>Tiền thối lại:</span>
                        <span>{Math.round(changeAmount).toLocaleString()}đ</span>
                      </div>
                    )}
                  </>
                )}
                
                {/* XỬ LÝ RIÊNG HÌNH THỨC GHI NỢ */}
                {(isDebtSale || isRefundDebt) && (
                  <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0", color: "#b91c1c", fontWeight: "bold", borderTop: "1px dashed #b91c1c", paddingTop: "6px" }}>
                    <span>TỔNG DƯ NỢ CỦA KHÁCH:</span>
                    <span style={{ fontSize: "14px" }}>{Math.round(currentTotalDebt).toLocaleString()}đ</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ textAlign: "center", borderTop: "1px dashed #000", paddingTop: "10px" }}>
              <p style={{ margin: "0", fontStyle: "italic" }}>Cảm ơn Quý khách & Hẹn gặp lại!</p>
            </div>
          </div>
        );
      } else {
        // ---------------------------------------------------------
        // 2. IN HÓA ĐƠN A4 
        // ---------------------------------------------------------
        return (
          <div className="print-a4-container" style={{ width: "210mm", padding: "15mm", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#000", background: "#fff", boxSizing: "border-box", margin: "0 auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: "top", width: "60%" }}>
                    <h2 style={{ margin: "0 0 5px 0", fontSize: "22px", fontWeight: "bold", color: "#dc2626" }}>HẢI LÊ MART</h2>
                    <p style={{ margin: "2px 0", fontSize: "13px" }}><b>Địa chỉ:</b> 123 Đường ABC, Quận XYZ, Hà Nội</p>
                    <p style={{ margin: "2px 0", fontSize: "13px" }}><b>Điện thoại:</b> 0902 613 899</p>
                  </td>
                  <td style={{ verticalAlign: "top", width: "40%", textAlign: "right" }}>
                    <h4 style={{ margin: "0 0 5px 0", fontSize: "14px", fontWeight: "bold" }}>MẪU HÓA ĐƠN NỘI BỘ</h4>
                    <p style={{ margin: "2px 0", fontSize: "13px" }}><b>Số hóa đơn:</b> <span style={{ fontWeight: "bold", fontSize: "16px", color: "#b91c1c" }}>{orderId}</span></p>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              <h1 style={{ margin: "0 0 5px 0", fontSize: "28px", fontWeight: "bold", letterSpacing: "1px" }}>
                {orderId === 'PHIẾU_TRẢ_HÀNG' ? "PHIẾU HOÀN TRẢ HÀNG" : "HÓA ĐƠN BÁN HÀNG"}
              </h1>
              <p style={{ margin: "0", fontSize: "13px", fontStyle: "italic" }}>Thời gian xuất đơn: {order?.time || ''}</p>
            </div>

            <div style={{ border: "1px solid #000", padding: "15px", borderRadius: "8px", marginBottom: "25px", fontSize: "14px", lineHeight: "1.7" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "18%" }}><b>Tên khách hàng:</b></td>
                    <td style={{ width: "47%" }}>{order?.custName || "Khách lẻ"}</td>
                    <td style={{ width: "15%" }}><b>Số điện thoại:</b></td>
                    <td style={{ width: "20%" }}>{custPhone || "N/A"}</td>
                  </tr>
                  <tr>
                    <td><b>Địa chỉ khách hàng:</b></td>
                    <td colSpan={3}>{custAddress}</td>
                  </tr>
                  <tr>
                    <td><b>Hình thức TT:</b></td>
                    <td><span style={{ fontWeight: "bold", textTransform: "uppercase", color: (isDebtSale || isRefundDebt) ? "#b91c1c" : "#000" }}>{paymentMethod}</span></td>
                    <td><b>Thu ngân trực:</b></td>
                    <td>{role === 'admin' ? 'Quản lý' : 'Nhân viên'} ({shift})</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9" }}>
                  <th style={{ border: "1px solid #000", padding: "10px", textAlign: "center", width: "7%" }}>STT</th>
                  <th style={{ border: "1px solid #000", padding: "10px", textAlign: "left", width: "45%" }}>Tên sản phẩm, hàng hóa</th>
                  <th style={{ border: "1px solid #000", padding: "10px", textAlign: "center", width: "10%" }}>ĐVT</th>
                  <th style={{ border: "1px solid #000", padding: "10px", textAlign: "center", width: "10%" }}>SL</th>
                  <th style={{ border: "1px solid #000", padding: "10px", textAlign: "right", width: "13%" }}>Đơn giá</th>
                  <th style={{ border: "1px solid #000", padding: "10px", textAlign: "right", width: "15%" }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item: any, idx: number) => {
                  const prod = item?.product || {};
                  const itemQty = Number(item?.qty) || 0;
                  const priceToUse = item?.priceIncludingVat !== undefined 
                    ? Number(item.priceIncludingVat) 
                    : Math.round(safeGetPrice(prod) * (1 + safeVatRate));
                    
                  return (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ border: "1px solid #000", padding: "10px" }}>
                        {safeCleanName(prod?.name)} {prod?.isHappyHour ? ' [GIỜ VÀNG ⭐]' : ''}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>Cái</td>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>{itemQty}</td>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{priceToUse.toLocaleString()}đ</td>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{(priceToUse * itemQty).toLocaleString()}đ</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ width: "55%", float: "right", fontSize: "14px", marginBottom: "40px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "4px 0", textAlign: "left" }}>Cộng tiền hàng hóa (Chưa thuế):</td>
                    <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "bold" }}>{Math.round(Number(order?.subTotal || 0)).toLocaleString()}đ</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 0", textAlign: "left" }}>Thuế giá trị gia tăng VAT (10%):</td>
                    <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "bold" }}>{Math.round(Number(order?.vatTotal || 0)).toLocaleString()}đ</td>
                  </tr>
                  {Number(order?.discount || 0) > 0 && (
                    <tr>
                      <td style={{ padding: "4px 0", textAlign: "left", color: "#ef4444" }}>Chiết khấu ưu đãi / Mã giảm:</td>
                      <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "bold", color: "#ef4444" }}>-{Math.round(Number(order?.discount || 0)).toLocaleString()}đ</td>
                    </tr>
                  )}
                  <tr style={{ borderTop: "1px solid #000" }}>
                    <td style={{ padding: "8px 0 4px 0", textAlign: "left", fontSize: "15px", fontWeight: "bold" }}>{orderId === 'PHIẾU_TRẢ_HÀNG' ? "TỔNG TIỀN HOÀN TRẢ:" : "TỔNG TIỀN PHẢI THANH TOÁN:"}</td>
                    <td style={{ padding: "8px 0 4px 0", textAlign: "right", fontSize: "16px", fontWeight: "bold" }}>{Math.round(safeFinalTotal).toLocaleString()}đ</td>
                  </tr>
                  
                  {paymentMethod === 'KẾT HỢP' && (
                    <>
                      <tr style={{ backgroundColor: "#f8fafc" }}>
                        <td style={{ padding: "6px 8px", textAlign: "left" }}>- Khách đưa tiền mặt:</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>{Math.round(safeCustomerGiven).toLocaleString()}đ</td>
                      </tr>
                      <tr style={{ backgroundColor: "#f8fafc" }}>
                        <td style={{ padding: "6px 8px", textAlign: "left" }}>- Khách chuyển khoản:</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>{Math.max(0, safeFinalTotal - safeCustomerGiven).toLocaleString()}đ</td>
                      </tr>
                    </>
                  )}

                  {paymentMethod === 'TIỀN MẶT' && (
                    <>
                      <tr style={{ backgroundColor: "#f8fafc" }}>
                        <td style={{ padding: "6px 8px", textAlign: "left" }}>Số tiền mặt khách đưa:</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>{Math.round(safeCustomerGiven).toLocaleString()}đ</td>
                      </tr>
                      {changeAmount > 0 && (
                        <tr>
                          <td style={{ padding: "4px 0", textAlign: "left", fontStyle: "italic" }}>Tiền thối lại cho khách:</td>
                          <td style={{ padding: "4px 0", textAlign: "right" }}>{Math.round(changeAmount).toLocaleString()}đ</td>
                        </tr>
                      )}
                    </>
                  )}
                  
                  {(isDebtSale || isRefundDebt) && (
                    <tr style={{ borderTop: "2px double #b91c1c" }}>
                      <td style={{ padding: "8px 0", textAlign: "left", fontSize: "15px", fontWeight: "bold", color: "#b91c1c" }}>TỔNG DƯ NỢ HIỆN TẠI CỦA KHÁCH:</td>
                      <td style={{ padding: "8px 0", textAlign: "right", fontSize: "16px", fontWeight: "bold", color: "#b91c1c" }}>
                        {Math.round(currentTotalDebt).toLocaleString()}đ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ clear: "both" }}></div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px", textAlign: "center", fontSize: "14px" }}>
              <tbody>
                <tr>
                  <td style={{ width: "50%", paddingBottom: "60px" }}>
                    <b>NGƯỜI MUA HÀNG</b><br />
                    <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                  </td>
                  <td style={{ width: "50%", paddingBottom: "60px" }}>
                    <b>NGƯỜI BÁN HÀNG</b><br />
                    <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và đóng dấu)</span>
                  </td>
                </tr>
                <tr>
                  <td><p style={{ margin: "0", fontWeight: "bold" }}>{order?.custName || ""}</p></td>
                  <td><p style={{ margin: "0", fontWeight: "bold", color: "#dc2626" }}>HẢI LÊ MART</p></td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      }
    } catch (error) {
      console.error("Lỗi Render PrintManager:", error);
      return <div className="print-a4-container" style={{ color: "red", padding: "20px", fontWeight: "bold" }}>❌ Có lỗi xảy ra trong quá trình dựng hóa đơn in. Vui lòng kiểm tra lại thông tin giỏ hàng hoặc chụp ảnh màn hình báo IT!</div>;
    }
  };

  // =====================================================================
  // VÙNG 3: CODE DÀNH RIÊNG CHO MÃ VẠCH
  // =====================================================================
  const renderBarcode = () => {
    if (!printBarcodeProduct) return null;
    
    return (
      <div className="print-a4-container" style={{ background: "#fff", padding: "10mm" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", justifyItems: "center" }}>
          {Array.from({ length: Number(barcodeCount) || 1 }).map((_, i) => {
            const code = String(printBarcodeProduct?.product_code || '').split('-')[0];
            return (
              <div key={i} style={{ width: "55mm", height: "28mm", padding: "3mm", border: "1px dashed #ccc", textAlign: "center", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", marginBottom: "4px" }}>
                  {safeCleanName(printBarcodeProduct?.name)}
                </div>
                <img src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=false`} style={{ maxWidth: "100%", height: "35px" }} alt="barcode" />
                <div style={{ fontSize: "10px", fontFamily: "monospace", marginTop: "3px" }}>{code}</div>
                <div style={{ fontSize: "13px", fontWeight: "900" }}>{Number(printBarcodeProduct?.sale_price || 0).toLocaleString()}đ</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // =====================================================================
  // VÙNG 4: CODE DÀNH RIÊNG CHO THẺ KHÁCH HÀNG
  // =====================================================================
  const renderCustomerCard = () => {
    if (!printCustomer) return null;
    const cardCode = printCustomer?.cardCode || printCustomer?.phone || 'VIP';

    return (
      <div className="print-card-container"> 
        <div style={{ width: "85.6mm", height: "53.98mm", border: "3px solid #dc2626", borderRadius: "12px", padding: "15px", textAlign: "center", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", background: "#fff7ed", fontFamily: "'Inter', sans-serif" }}>
          <h2 style={{ margin: "0 0 5px 0", color: "#b91c1c", fontSize: "20px", textTransform: "uppercase", fontWeight: "900" }}>HẢI LÊ MART</h2>
          <div style={{ fontSize: "10px", fontWeight: "bold", color: "#ea580c", letterSpacing: "2px", marginBottom: "10px" }}>THẺ KHÁCH HÀNG THÂN THIẾT</div>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0f172a", textTransform: "uppercase" }}>{printCustomer?.name || 'VIP'}</div>
          <img src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(cardCode)}&scale=2&height=10&includetext=false`} alt="barcode" style={{ maxWidth: "100%", height: "45px", margin: "10px auto 0 auto", display: "block" }} />
          <div style={{ fontSize: "12px", fontFamily: "monospace", letterSpacing: "2px", marginTop: "4px", fontWeight: "bold" }}>{cardCode}</div>
        </div>
      </div>
    );
  };

  // =====================================================================
  // VÙNG 5: CODE DÀNH RIÊNG CHO PHIẾU ĐẶT / NHẬP KHO (PO)
  // =====================================================================
  const renderPO = () => {
    if (!printPOData) return null;
    
    const po = printPOData;
    const isReceipt = safeMode.includes('receipt') || safeMode.includes('return');
    
    return (
      <div className="print-a4-container" style={{ width: "210mm", padding: "15mm", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#000", background: "#fff", boxSizing: "border-box", margin: "0 auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: "top", width: "60%" }}>
                <h2 style={{ margin: "0 0 5px 0", fontSize: "22px", fontWeight: "bold", color: "#dc2626" }}>HẢI LÊ MART</h2>
                <p style={{ margin: "2px 0", fontSize: "13px" }}><b>Kho tổng:</b> 123 Đường ABC, Hà Nội</p>
                <p style={{ margin: "2px 0", fontSize: "13px" }}><b>Điện thoại:</b> 0902 613 899</p>
              </td>
              <td style={{ verticalAlign: "top", width: "40%", textAlign: "right" }}>
                <h4 style={{ margin: "0 0 5px 0", fontSize: "14px", fontWeight: "bold" }}>MÃ PHIẾU: {po?.po_code}</h4>
                <p style={{ margin: "2px 0", fontSize: "13px" }}>Ngày tạo: {new Date(po?.created_at).toLocaleString('vi-VN')}</p>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <h1 style={{ margin: "0 0 5px 0", fontSize: "28px", fontWeight: "bold", letterSpacing: "1px" }}>
            {isReceipt ? "PHIẾU NHẬP KHO CHÍNH THỨC" : "PHIẾU YÊU CẦU ĐẶT HÀNG (PO)"}
          </h1>
        </div>

        <div style={{ border: "1px solid #000", padding: "10px 15px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
          <p style={{ margin: "5px 0" }}><b>Nhà cung cấp:</b> {po?.supplier?.name} - <b>SĐT:</b> {po?.supplier?.phone}</p>
          <p style={{ margin: "5px 0" }}><b>Địa chỉ / Sản phẩm cung cấp:</b> {po?.supplier?.address || po?.supplier?.item || "N/A"}</p>
          <p style={{ margin: "5px 0" }}><b>Ghi chú đơn hàng:</b> {po?.note || "Không có ghi chú"}</p>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px", fontSize: "14px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f1f5f9" }}>
              <th style={{ border: "1px solid #000", padding: "10px", textAlign: "center", width: "8%" }}>STT</th>
              <th style={{ border: "1px solid #000", padding: "10px", textAlign: "left", width: "45%" }}>Tên hàng hóa</th>
              <th style={{ border: "1px solid #000", padding: "10px", textAlign: "center", width: "12%" }}>SL {isReceipt ? "Thực Nhập" : "Đặt"}</th>
              <th style={{ border: "1px solid #000", padding: "10px", textAlign: "right", width: "15%" }}>Đơn giá nhập</th>
              <th style={{ border: "1px solid #000", padding: "10px", textAlign: "right", width: "20%" }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {po?.items?.map((item: any, idx: number) => {
              const actualQty = isReceipt ? Math.max(0, item?.qty - (item?.damagedQty || 0)) : item?.qty;
              const itemTotal = actualQty * (item?.importPrice || 0);
              
              return (
                <tr key={idx}>
                  <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>{idx + 1}</td>
                  <td style={{ border: "1px solid #000", padding: "10px" }}>{safeCleanName(item?.product?.name)} {item?.damagedQty > 0 && isReceipt ? ` (Hỏng: ${item.damagedQty})` : ''}</td>
                  <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center", fontWeight: "bold" }}>{actualQty}</td>
                  <td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{Number(item?.importPrice || 0).toLocaleString()}đ</td>
                  <td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{itemTotal.toLocaleString()}đ</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ width: "45%", float: "right", fontSize: "14px", marginBottom: "40px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "6px 0", textAlign: "left", fontWeight: "bold", fontSize: "16px" }}>TỔNG GIÁ TRỊ:</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "bold", fontSize: "16px" }}>{Number(po?.total_amount || 0).toLocaleString()}đ</td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", textAlign: "left" }}>Đã thanh toán trước:</td>
                <td style={{ padding: "6px 0", textAlign: "right" }}>{Number(po?.paid_amount || 0).toLocaleString()}đ</td>
              </tr>
              <tr style={{ borderTop: "2px solid #000" }}>
                <td style={{ padding: "8px 0", textAlign: "left", fontWeight: "bold", color: "#b91c1c" }}>CÒN NỢ NCC:</td>
                <td style={{ padding: "8px 0", textAlign: "right", fontWeight: "bold", color: "#b91c1c" }}>{Number(po?.debt_amount || 0).toLocaleString()}đ</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ clear: "both" }}></div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px", textAlign: "center", fontSize: "14px" }}>
          <tbody>
            <tr>
              <td style={{ width: "33%", paddingBottom: "60px" }}>
                <b>NGƯỜI LẬP PHIẾU</b><br />
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký, họ tên)</span>
              </td>
              <td style={{ width: "33%", paddingBottom: "60px" }}>
                <b>NGƯỜI GIAO HÀNG</b><br />
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký, họ tên)</span>
              </td>
              <td style={{ width: "33%", paddingBottom: "60px" }}>
                <b>THỦ KHO / QUẢN LÝ</b><br />
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký, đóng dấu)</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // =====================================================================
  // ĐIỀU HƯỚNG TỪNG CHẾ ĐỘ IN (KHÔNG LIÊN QUAN TỚI NHAU NỮA)
  // =====================================================================
  
  // 1. Máy in A4 (Invoice A4) - Nhận diện bằng từ khóa .includes() để chống trượt
  if (safeMode.includes('a4') || safeMode.includes('invoice')) {
    return renderOrderInvoice(true);
  }
  
  // 2. Máy in POS (80mm)
  if (safeMode.includes('receipt') || safeMode.includes('bill') || safeMode.includes('pos')) {
    return renderOrderInvoice(false);
  }
  
  // 3. In tem mã vạch
  if (safeMode.includes('barcode')) {
    return renderBarcode();
  }
  
  // 4. In thẻ khách hàng VIP
  if (safeMode.includes('card')) {
    return renderCustomerCard();
  }

  // 5. In phiếu đặt hàng/nhập kho (PO)
  if (safeMode.includes('po_')) {
    return renderPO();
  }

  return null;
};
