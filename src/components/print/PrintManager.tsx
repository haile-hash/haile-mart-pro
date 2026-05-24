import React from 'react';
import { cleanName, getActualPrice, parseGift } from '../../utils/helpers';

// Định nghĩa các kiểu dữ liệu (Props) mà App.tsx truyền vào
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
  
  // Nếu không có lệnh in, không render gì để tiết kiệm tài nguyên
  if (!printMode) return null;

  return (
    <>
      {/* 1. IN HÓA ĐƠN MÁY POS (Bill nhiệt 80mm) */}
      {printMode === 'receipt' && lastOrder && (
        <div className="print-only" style={{ width: "80mm", padding: "10px", fontFamily: "monospace", fontSize: "12px", color: "#000", background: "#fff" }}>
          <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "10px", marginBottom: "10px" }}>
            <h2 style={{ margin: "0 0 5px 0", fontSize: "18px" }}>HẢI LÊ MART</h2>
            <p style={{ margin: "0" }}>Hotline: 0902 613 899</p>
            <p style={{ margin: "0" }}>ĐC: 123 Đường ABC, Hà Nội</p>
          </div>
          
          <div style={{ marginBottom: "10px" }}>
            <p style={{ margin: "2px 0" }}>Mã HĐ: <b>{lastOrder.orderId}</b></p>
            <p style={{ margin: "2px 0" }}>Thời gian: {lastOrder.time}</p>
            <p style={{ margin: "2px 0" }}>Thu ngân: {role === 'admin' ? 'Quản lý' : 'Nhân viên'} ({shift})</p>
            <p style={{ margin: "2px 0" }}>Khách hàng: {lastOrder.custName || "Khách lẻ"}</p>
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
              {lastOrder.cart.map((item: any, idx: number) => {
                const priceToUse = item.priceIncludingVat !== undefined 
                  ? item.priceIncludingVat 
                  : Math.round(getActualPrice(item.product) * (1 + VAT_RATE));
                return (
                  <tr key={idx}>
                    <td style={{ padding: "5px 0" }}>{cleanName(item.product.name)} {item.product.isHappyHour ? '⭐' : ''}</td>
                    <td style={{ textAlign: "center", padding: "5px 0" }}>{item.qty}</td>
                    <td style={{ textAlign: "right", padding: "5px 0" }}>{(priceToUse * item.qty).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ borderTop: "1px dashed #000", paddingTop: "10px", marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
              <span>Tổng tiền hàng:</span>
              <span>{Math.round(lastOrder.subTotal + lastOrder.vatTotal).toLocaleString()}đ</span>
            </div>
            {lastOrder.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                <span>Chiết khấu/Ví:</span>
                <span>-{Math.round(lastOrder.discount).toLocaleString()}đ</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", margin: "5px 0", fontWeight: "bold", fontSize: "14px" }}>
              <span>THANH TOÁN:</span>
              <span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
            </div>
          </div>

          <div style={{ textAlign: "center", borderTop: "1px dashed #000", paddingTop: "10px" }}>
            <p style={{ margin: "0", fontStyle: "italic" }}>Cảm ơn Quý khách & Hẹn gặp lại!</p>
          </div>
        </div>
      )}

      {/* 2. IN HÓA ĐƠN BÁN HÀNG KHỔ A4 CHUẨN ĐẸP */}
      {printMode === 'invoice_a4' && lastOrder && (
         <div className="print-a4-container" style={{ width: "210mm", padding: "15mm", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#000", background: "#fff", boxSizing: "border-box" }}>
           {/* Header thông tin cửa hàng */}
           <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
             <tbody>
               <tr>
                 <td style={{ verticalAlign: "top", width: "60%" }}>
                   <h2 style={{ margin: "0 0 5px 0", fontSize: "22px", fontWeight: "bold", color: "#dc2626" }}>HẢI LÊ MART</h2>
                   <p style={{ margin: "2px 0", fontSize: "13px" }}><b>Địa chỉ:</b> 123 Đường ABC, Quận XYZ, Hà Nội</p>
                   <p style={{ margin: "2px 0", fontSize: "13px" }}><b>Điện thoại:</b> 0902 613 899</p>
                   <p style={{ margin: "2px 0", fontSize: "13px" }}><b>Email:</b> contact@hailemart.com</p>
                 </td>
                 <td style={{ verticalAlign: "top", width: "40%", textAlign: "right" }}>
                   <h4 style={{ margin: "0 0 5px 0", fontSize: "14px", fontWeight: "bold" }}>MẪU HÓA ĐƠN NỘI BỘ</h4>
                   <p style={{ margin: "2px 0", fontSize: "13px" }}><b>Ký hiệu:</b> HL/2026P</p>
                   <p style={{ margin: "2px 0", fontSize: "13px" }}><b>Số hóa đơn:</b> <span style={{ fontWeight: "bold", fontSize: "16px", color: "#b91c1c" }}>{lastOrder.orderId}</span></p>
                 </td>
               </tr>
             </tbody>
           </table>

           {/* Tiêu đề chính */}
           <div style={{ textAlign: "center", marginBottom: "25px" }}>
             <h1 style={{ margin: "0 0 5px 0", fontSize: "28px", fontWeight: "bold", letterSpacing: "1px" }}>HÓA ĐƠN BÁN HÀNG</h1>
             <p style={{ margin: "0", fontSize: "13px", fontStyle: "italic" }}>Thời gian xuất đơn: {lastOrder.time}</p>
           </div>

           {/* Thông tin người mua */}
           <div style={{ border: "1px solid #000", padding: "15px", borderRadius: "8px", marginBottom: "25px", fontSize: "14px", lineHeight: "1.7" }}>
             <table style={{ width: "100%", borderCollapse: "collapse" }}>
               <tbody>
                 <tr>
                   <td style={{ width: "18%" }}><b>Tên khách hàng:</b></td>
                   <td style={{ width: "47%" }}>{lastOrder.custName || "Khách lẻ"}</td>
                   <td style={{ width: "15%" }}><b>Số điện thoại:</b></td>
                   <td style={{ width: "20%" }}>{lastOrder.custPhone || "N/A"}</td>
                 </tr>
                 <tr>
                   <td><b>Địa chỉ khách hàng:</b></td>
                   <td colSpan={3}>{customers[lastOrder.custPhone]?.address || "N/A"}</td>
                 </tr>
                 <tr>
                   <td><b>Hình thức TT:</b></td>
                   <td><span style={{ fontWeight: "bold" }}>{lastOrder.paymentMethod}</span></td>
                   <td><b>Thu ngân trực:</b></td>
                   <td>{role === 'admin' ? 'Quản lý' : 'Nhân viên'} ({shift})</td>
                 </tr>
               </tbody>
             </table>
           </div>

           {/* Bảng danh sách sản phẩm */}
           <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px", fontSize: "14px" }}>
             <thead>
               <tr style={{ backgroundColor: "#f1f5f9" }}>
                 <th style={{ border: "1px solid #000", padding: "10px", textAlign: "center", width: "7%", fontWeight: "bold" }}>STT</th>
                 <th style={{ border: "1px solid #000", padding: "10px", textAlign: "left", width: "45%", fontWeight: "bold" }}>Tên sản phẩm, hàng hóa</th>
                 <th style={{ border: "1px solid #000", padding: "10px", textAlign: "center", width: "10%", fontWeight: "bold" }}>ĐVT</th>
                 <th style={{ border: "1px solid #000", padding: "10px", textAlign: "center", width: "10%", fontWeight: "bold" }}>SL</th>
                 <th style={{ border: "1px solid #000", padding: "10px", textAlign: "right", width: "13%", fontWeight: "bold" }}>Đơn giá</th>
                 <th style={{ border: "1px solid #000", padding: "10px", textAlign: "right", width: "15%", fontWeight: "bold" }}>Thành tiền</th>
               </tr>
             </thead>
             <tbody>
               {lastOrder.cart.map((item: any, idx: number) => {
                 const priceToUse = item.priceIncludingVat !== undefined 
                   ? item.priceIncludingVat 
                   : Math.round(getActualPrice(item.product) * (1 + VAT_RATE));
                 return (
                   <tr key={idx}>
                     <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>{idx + 1}</td>
                     <td style={{ border: "1px solid #000", padding: "10px" }}>
                       {cleanName(item.product.name)} {item.product.isHappyHour ? ' [GIỜ VÀNG ⭐]' : ''}
                     </td>
                     <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>Cái</td>
                     <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>{item.qty}</td>
                     <td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{priceToUse.toLocaleString()}đ</td>
                     <td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{(priceToUse * item.qty).toLocaleString()}đ</td>
                   </tr>
                 );
               })}
             </tbody>
           </table>

           {/* Khu vực tổng kết tiền (Nằm bên tay phải) */}
           <div style={{ width: "50%", float: "right", fontSize: "14px", marginBottom: "40px" }}>
             <table style={{ width: "100%", borderCollapse: "collapse" }}>
               <tbody>
                 <tr>
                   <td style={{ padding: "6px 0", textAlign: "left" }}>Cộng tiền hàng hóa (Chưa thuế):</td>
                   <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "bold" }}>{Math.round(lastOrder.subTotal).toLocaleString()}đ</td>
                 </tr>
                 <tr>
                   <td style={{ padding: "6px 0", textAlign: "left" }}>Thuế giá trị gia tăng VAT (10%):</td>
                   <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "bold" }}>{Math.round(lastOrder.vatTotal).toLocaleString()}đ</td>
                 </tr>
                 {lastOrder.discount > 0 && (
                   <tr>
                     <td style={{ padding: "6px 0", textAlign: "left", color: "#ef4444" }}>Chiết khấu ưu đãi / Mã giảm giá:</td>
                     <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "bold", color: "#ef4444" }}>-{Math.round(lastOrder.discount).toLocaleString()}đ</td>
                   </tr>
                 )}
                 <tr style={{ borderTop: "2px solid #000" }}>
                   <td style={{ padding: "12px 0 6px 0", textAlign: "left", fontSize: "16px", fontWeight: "bold" }}>TỔNG TIỀN THANH TOÁN:</td>
                   <td style={{ padding: "12px 0 6px 0", textAlign: "right", fontSize: "18px", fontWeight: "bold", color: "#be123c" }}>
                     {Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ
                   </td>
                 </tr>
               </tbody>
             </table>
           </div>
           <div style={{ clear: "both" }}></div>

           {/* Khu vực ký tên xác nhận */}
           <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px", textAlign: "center", fontSize: "14px" }}>
             <tbody>
               <tr>
                 <td style={{ width: "50%", paddingBottom: "70px" }}>
                   <b>NGƯỜI MUA HÀNG</b><br />
                   <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                 </td>
                 <td style={{ width: "50%", paddingBottom: "70px" }}>
                   <b>NGƯỜI BÁN HÀNG</b><br />
                   <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký, ghi tên và đóng dấu)</span>
                 </td>
               </tr>
               <tr>
                 <td>
                   <p style={{ margin: "0", fontWeight: "bold", color: "#334155" }}>{lastOrder.custName || ""}</p>
                 </td>
                 <td>
                   <p style={{ margin: "0", fontWeight: "bold", color: "#dc2626" }}>HẢI LÊ MART</p>
                 </td>
               </tr>
             </tbody>
           </table>
         </div>
      )}

      {/* 3. IN TEM MÃ VẠCH (Chuẩn Grid 3 Hàng Dọc) */}
      {printMode === 'barcode' && printBarcodeProduct && (
         <div className="print-a4-container" style={{ background: "#fff", padding: "10mm" }}>
           <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", justifyItems: "center" }}>
             {Array.from({ length: barcodeCount }).map((_, i) => {
               const code = String(printBarcodeProduct.product_code).split('-')[0];
               return (
                 <div key={i} style={{ width: "55mm", height: "28mm", padding: "3mm", border: "1px dashed #ccc", textAlign: "center", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                   <div style={{ fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", marginBottom: "4px" }}>
                     {cleanName(printBarcodeProduct.name)}
                   </div>
                   <img 
                     src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=false`} 
                     style={{ maxWidth: "100%", height: "35px" }} 
                     alt="barcode" 
                   />
                   <div style={{ fontSize: "10px", fontFamily: "monospace", marginTop: "3px" }}>{code}</div>
                   <div style={{ fontSize: "13px", fontWeight: "900" }}>{printBarcodeProduct.sale_price.toLocaleString()}đ</div>
                 </div>
               );
             })}
           </div>
         </div>
      )}

      {/* 4. IN THẺ KHÁCH HÀNG (VIP CARD) */}
      {printMode === 'customer_card' && printCustomer && (
         <div className="print-card-container"> 
           <div style={{ width: "85.6mm", height: "53.98mm", border: "3px solid #dc2626", borderRadius: "12px", padding: "15px", textAlign: "center", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", background: "#fff7ed", fontFamily: "'Inter', sans-serif" }}>
             <h2 style={{ margin: "0 0 5px 0", color: "#b91c1c", fontSize: "20px", textTransform: "uppercase", fontWeight: "900" }}>HẢI LÊ MART</h2>
             <div style={{ fontSize: "10px", fontWeight: "bold", color: "#ea580c", letterSpacing: "2px", marginBottom: "10px" }}>THẺ KHÁCH HÀNG THÂN THIẾT</div>
             <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0f172a", textTransform: "uppercase" }}>{printCustomer.name}</div>
             <img src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(printCustomer.cardCode || printCustomer.phone)}&scale=2&height=10&includetext=false`} onError={(e) => { e.currentTarget.src = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(printCustomer.cardCode || printCustomer.phone)}&code=Code128&translate-esc=on`; }} style={{ maxWidth: "100%", height: "45px", marginTop: "10px", margin: "10px auto 0 auto", display: "block" }} alt="barcode" />
             <div style={{ fontSize: "12px", fontFamily: "monospace", letterSpacing: "2px", marginTop: "4px", fontWeight: "bold" }}>{printCustomer.cardCode || printCustomer.phone}</div>
           </div>
         </div>
      )}
    </>
  );
};
