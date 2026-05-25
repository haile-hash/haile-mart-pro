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

  // 1. Mở rộng bộ nhận diện lệnh in (thêm 'pos', 'invoice' phòng hờ truyền sai)
  const safeMode = String(printMode).toLowerCase().trim();
  
  // 2. Ép kiểu lastOrder thành object để tránh chặn render gây trắng bill
  const order = lastOrder || {};

  // BỌC THÉP TẤT CẢ BIẾN ĐỂ CHỐNG CRASH TẬN GỐC
  const safeFinalTotal = Number(order?.finalTotal) || 0;
  const safeCustomerGiven = Number(order?.customerGiven) || 0;
  const safeDebtAmount = Number(order?.debtAmount) || safeFinalTotal;
  const changeAmount = Math.max(0, safeCustomerGiven - safeFinalTotal);
  
  const paymentMethod = order?.paymentMethod || '';
  const orderId = order?.orderId || '';
  
  const isDebtSale = paymentMethod === 'GHI NỢ' || safeDebtAmount > 0;
  const isRefundDebt = paymentMethod === 'TRỪ NỢ';
  const isNoCashInvolved = isDebtSale || isRefundDebt;
  
  const custPhone = order?.custPhone || '';
  
  // 3. FIX LỖI CRASH TRẮNG TRANG: Dùng optional chaining triệt để thay vì ternary operator
  const currentTotalDebt = Number(customers?.[custPhone]?.debt) || 0;
  const custAddress = customers?.[custPhone]?.address || "N/A";
  
  const cartItems = Array.isArray(order?.cart) ? order.cart : [];
  const safeVatRate = Number(VAT_RATE) || 0.1;

  // Hàm bọc an toàn cho getActualPrice tránh crash component
  const safeGetPrice = (product: any) => {
    try {
      return typeof getActualPrice === 'function' ? (getActualPrice(product) || 0) : 0;
    } catch (error) {
      return 0;
    }
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. IN HÓA ĐƠN MÁY POS (Bill nhiệt 80mm) */}
      {/* ========================================================= */}
      {(safeMode === 'receipt' || safeMode === 'bill' || safeMode === 'pos') && (
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
            <p style={{ margin: "2px 0" }}>Khách hàng: {order?.custName || "Khách lẻ"}</p>
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
                
                // Sử dụng hàm an toàn để lấy giá
                const priceToUse = item?.priceIncludingVat !== undefined 
                  ? Number(item.priceIncludingVat)
                  : Math.round(safeGetPrice(prod) * (1 + safeVatRate));
                  
                return (
                  <tr key={idx}>
                    <td style={{ padding: "5px 0" }}>{cleanName(prod?.name || 'Sản phẩm')} {prod?.isHappyHour ? '⭐' : ''}</td>
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
                <span style={{ fontWeight: "bold" }}>{paymentMethod || 'Tiền mặt'}</span>
              </div>
              
              {!isNoCashInvolved && (
                <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                  <span>Tiền mặt khách đưa:</span>
                  <span>{Math.round(safeCustomerGiven).toLocaleString()}đ</span>
                </div>
              )}
              
              {paymentMethod === 'TIỀN MẶT' && changeAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                  <span>Tiền thối lại:</span>
                  <span>{Math.round(changeAmount).toLocaleString()}đ</span>
                </div>
              )}
              
              {(isDebtSale || isRefundDebt) && (
                <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0", color: "#b91c1c", fontWeight: "bold", borderTop: "1px dashed #b91c1c", paddingTop: "6px" }}>
                  <span>TỔNG DƯ NỢ HIỆN TẠI:</span>
                  <span style={{ fontSize: "14px" }}>{Math.round(currentTotalDebt).toLocaleString()}đ</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: "center", borderTop: "1px dashed #000", paddingTop: "10px" }}>
            <p style={{ margin: "0", fontStyle: "italic" }}>Cảm ơn Quý khách & Hẹn gặp lại!</p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. IN HÓA ĐƠN BÁN HÀNG KHỔ A4 */}
      {/* ========================================================= */}
      {(safeMode === 'invoice_a4' || safeMode === 'a4' || safeMode === 'invoice') && (
         <div className="print-a4-container" style={{ width: "210mm", padding: "15mm", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#000", background: "#fff", boxSizing: "border-box" }}>
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
                   <td><span style={{ fontWeight: "bold", textTransform: "uppercase", color: isNoCashInvolved ? "#b91c1c" : "#000" }}>{paymentMethod || 'Tiền mặt'}</span></td>
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
                       {cleanName(prod?.name || 'Sản phẩm')} {prod?.isHappyHour ? ' [GIỜ VÀNG ⭐]' : ''}
                     </td>
                     <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>Cái</td>
                     <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>{itemQty}</td>
                     <td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{priceToUse.toLocaleString()}đ</td>
                     <td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{(priceToUse * itemQty).toLocaleString()}đ</td>
                   </tr>
                 );
               })}
               {cartItems.length === 0 && (
                 <tr>
                    <td colSpan={6} style={{ border: "1px solid #000", padding: "10px", textAlign: "center", fontStyle: "italic" }}>Chưa có sản phẩm nào</td>
                 </tr>
               )}
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
                 
                 {!isNoCashInvolved && (
                   <tr style={{ backgroundColor: "#f8fafc" }}>
                     <td style={{ padding: "6px 8px", textAlign: "left" }}>Số tiền mặt khách đưa:</td>
                     <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>{Math.round(safeCustomerGiven).toLocaleString()}đ</td>
                   </tr>
                 )}
                 
                 {paymentMethod === 'TIỀN MẶT' && changeAmount > 0 && (
                   <tr>
                     <td style={{ padding: "4px 0", textAlign: "left", fontStyle: "italic" }}>Tiền thối lại cho khách:</td>
                     <td style={{ padding: "4px 0", textAlign: "right" }}>{Math.round(changeAmount).toLocaleString()}đ</td>
                   </tr>
                 )}
                 
                 {(isDebtSale || isRefundDebt) && (
                   <tr style={{ borderTop: "2px double #b91c1c" }}>
                     <td style={{ padding: "8px 0", textAlign: "left", fontSize: "15px", fontWeight: "bold", color: "#b91c1c" }}>TỔNG DƯ NỢ HIỆN TẠI:</td>
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
      )}

      {/* ========================================================= */}
      {/* 3. IN TEM MÃ VẠCH */}
      {/* ========================================================= */}
      {safeMode === 'barcode' && printBarcodeProduct && (
         <div className="print-a4-container" style={{ background: "#fff", padding: "10mm" }}>
           <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", justifyItems: "center" }}>
             {Array.from({ length: Number(barcodeCount) || 0 }).map((_, i) => {
               const code = String(printBarcodeProduct?.product_code || '').split('-')[0];
               return (
                 <div key={i} style={{ width: "55mm", height: "28mm", padding: "3mm", border: "1px dashed #ccc", textAlign: "center", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                   <div style={{ fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", marginBottom: "4px" }}>
                     {cleanName(printBarcodeProduct?.name || 'Sản phẩm')}
                   </div>
                   <img src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=false`} style={{ maxWidth: "100%", height: "35px" }} alt="barcode" />
                   <div style={{ fontSize: "10px", fontFamily: "monospace", marginTop: "3px" }}>{code}</div>
                   <div style={{ fontSize: "13px", fontWeight: "900" }}>{Number(printBarcodeProduct?.sale_price || 0).toLocaleString()}đ</div>
                 </div>
               );
             })}
           </div>
         </div>
      )}

      {/* ========================================================= */}
      {/* 4. IN THẺ KHÁCH HÀNG */}
      {/* ========================================================= */}
      {safeMode === 'customer_card' && printCustomer && (
         <div className="print-card-container"> 
           <div style={{ width: "85.6mm", height: "53.98mm", border: "3px solid #dc2626", borderRadius: "12px", padding: "15px", textAlign: "center", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", background: "#fff7ed", fontFamily: "'Inter', sans-serif" }}>
             <h2 style={{ margin: "0 0 5px 0", color: "#b91c1c", fontSize: "20px", textTransform: "uppercase", fontWeight: "900" }}>HẢI LÊ MART</h2>
             <div style={{ fontSize: "10px", fontWeight: "bold", color: "#ea580c", letterSpacing: "2px", marginBottom: "10px" }}>THẺ KHÁCH HÀNG THÂN THIẾT</div>
             <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0f172a", textTransform: "uppercase" }}>{printCustomer?.name || 'VIP'}</div>
             <img src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(printCustomer?.cardCode || printCustomer?.phone || '')}&scale=2&height=10&includetext=false`} alt="barcode" style={{ maxWidth: "100%", height: "45px", margin: "10px auto 0 auto", display: "block" }} />
             <div style={{ fontSize: "12px", fontFamily: "monospace", letterSpacing: "2px", marginTop: "4px", fontWeight: "bold" }}>{printCustomer?.cardCode || printCustomer?.phone || ''}</div>
           </div>
         </div>
      )}
    </>
  );
};
