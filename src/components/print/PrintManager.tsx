import React from 'react';
import { cleanName, getActualPrice, parseGift } from '../../utils/helpers';

// Định nghĩa các kiểu dữ liệu (Props) mà App.tsx sẽ truyền vào
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
  printMode,
  lastOrder,
  shift,
  role,
  customers,
  VAT_RATE,
  printBarcodeProduct,
  barcodeCount,
  printCustomer,
  printPOData
}) => {
  // Tối ưu hiệu năng: Nếu không có lệnh in, không render gì cả
  if (!printMode) return null;

  return (
    <>
      {/* 1. IN HÓA ĐƠN MÁY POS (Bill 80mm) */}
      {printMode === 'receipt' && lastOrder && (
         <div className="print-only">
           {/* Paste toàn bộ nội dung <div className="print-receipt-container"> của bạn vào đây */}
         </div>
      )}

      {/* 2. IN HÓA ĐƠN BÁN HÀNG A4 */}
      {printMode === 'invoice_a4' && lastOrder && (
         <div className="print-a4-container">
           {/* Paste toàn bộ nội dung <div className="print-a4-container"> của bạn vào đây */}
         </div>
      )}

      {/* 3. IN TEM MÃ VẠCH */}
      {printMode === 'barcode' && printBarcodeProduct && (
         <div className="print-a4-container" style={{ padding: "20px", background: "#fff" }}>
           {/* Paste nội dung in tem của bạn vào đây */}
         </div>
      )}

     {/* 4. IN THẺ KHÁCH HÀNG */}
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

      {/* 5. IN PHIẾU ĐẶT HÀNG (PO ORDER) */}
      {printMode === 'po_order' && printPOData && (
         <div className="print-a4-container">
           {/* Paste nội dung in PO Order của bạn vào đây */}
         </div>
      )}

      {/* 6. IN PHIẾU NHẬP KHO (PO RECEIPT) */}
      {printMode === 'po_receipt' && printPOData && (
         <div className="print-a4-container">
           {/* Paste nội dung in PO Receipt của bạn vào đây */}
         </div>
      )}

      {/* 7. IN PHIẾU XUẤT TRẢ (PO RETURN) */}
      {printMode === 'po_return' && printPOData && (
         <div className="print-a4-container">
           {/* Paste nội dung in PO Return của bạn vào đây */}
         </div>
      )}
    </>
  );
};
