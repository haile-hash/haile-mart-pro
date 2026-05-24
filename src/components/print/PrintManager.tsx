import React from 'react';
import { cleanName, getActualPrice, parseGift } from '../../utils/helpers';

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

  return (
    <>
      {/* 1. IN HÓA ĐƠN MÁY POS (Bill 80mm) */}
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
              <span>THÁNH TOÁN:</span>
              <span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
              <span>Tiền khách đưa ({lastOrder.paymentMethod}):</span>
              <span>{Math.round(lastOrder.customerGiven || lastOrder.finalTotal).toLocaleString()}đ</span>
            </div>
          </div>

          <div style={{ textAlign: "center", borderTop: "1px dashed #000", paddingTop: "10px" }}>
            <p style={{ margin: "0", fontStyle: "italic" }}>Cảm ơn Quý khách & Hẹn gặp lại!</p>
            <p style={{ margin: "0", fontSize: "10px", marginTop: "5px" }}>Powered by Hải Lê ERP</p>
          </div>
        </div>
      )}

      {/* 3. IN TEM MÃ VẠCH */}
      {printMode === 'barcode' && printBarcodeProduct && (
         <div className="print-a4-container" style={{ background: "#fff", padding: "10mm" }}>
           
           {/* DÙNG CSS GRID ĐỂ ÉP CHUẨN 3 CỘT (repeat(3, 1fr)) */}
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
      {/* 4. IN THẺ KHÁCH HÀNG (Giữ nguyên của bạn) */}
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
