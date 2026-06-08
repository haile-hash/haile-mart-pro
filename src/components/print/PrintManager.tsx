/* eslint-disable */
import React from 'react';
import QRCode from 'react-qr-code';

export const PrintManager = ({ printMode, lastOrder, shift, role, customers, VAT_RATE, printCustomer, printPOData, printBarcodeProduct, barcodeCount }: any) => {
  const storeInfoStr = typeof window !== 'undefined' ? window.localStorage.getItem("mart_current_store") : null;
  const storeInfo = storeInfoStr ? JSON.parse(storeInfoStr) : {};
  const storeNameDisplay = storeInfo.store_name ? storeInfo.store_name.toUpperCase() : "HẢI LÊ MART PRO";
  const storeAddressDisplay = storeInfo.address || "234 Hoàng Quốc Việt - Nghĩa Đô - Hà Nội";
  const storePhoneDisplay = storeInfo.phone || "0902613899";

  // Hàm hỗ trợ lấy giá trị (nếu getActualPrice được pass từ ngoài vào thì có thể bỏ qua hàm này)
  const getActualPrice = (product: any) => product?.price || 0;

  // Hàm Kế Toán tính toán số lượng thực nhập (Trừ đi hàng lỗi chuẩn xác 100%)
  const getActualPOQty = (item: any) => {
    const orderQty = Number(item.qty) || 0;
    const receiveQty = item.receiveQty !== undefined ? Number(item.receiveQty) : orderQty;
    const faultQ = Number(item.faultyQty || item.faulty || item.errorQty || item.returnQty || item.rejectQty) || 0;

    if (receiveQty < orderQty) {
      return receiveQty;
    } else if (faultQ > 0) {
      return Math.max(0, orderQty - faultQ);
    } else {
      return receiveQty;
    }
  };

  // Tính tổng tiền dựa trên số lượng thực tế đã trừ lỗi
  const totalPOAmount = printPOData ? (printPOData.items || []).reduce((sum: number, item: any) => {
    return sum + (getActualPOQty(item) * (Number(item.importPrice) || 0));
  }, 0) : 0;

  return (
    <>
      {/* 1. IN BILL NHIỆT */}
      {printMode === 'receipt_thermal' && lastOrder && (
        <div className="print-content" id="print-thermal" style={{ width: '80mm', margin: '0 auto', fontSize: '12px', padding: '0 5px' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{storeNameDisplay}</h2>
            <p style={{ margin: '0 0 3px 0' }}>ĐC: {storeAddressDisplay}</p>
            <p style={{ margin: '0' }}>SĐT: {storePhoneDisplay}</p>
          </div>
          <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px', paddingBottom: '10px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{lastOrder.isRefund ? 'PHIẾU HOÀN TRẢ' : 'HÓA ĐƠN THANH TOÁN'}</h3>
            <p style={{ margin: 0 }}>Mã HĐ: {lastOrder.orderId}</p>
            <p style={{ margin: '2px 0 0 0' }}>Ngày: {lastOrder.time}</p>
            <p style={{ margin: '2px 0 0 0' }}>Ca: {lastOrder.shift} - NV: Quản lý</p>
            {lastOrder.custPhone && (
              <p style={{ margin: '2px 0 0 0', fontWeight: 'bold' }}>Khách hàng: {lastOrder.custName} ({lastOrder.custPhone})</p>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', padding: '4px 0' }}>Tên SP</th>
                <th style={{ textAlign: 'center', padding: '4px 0', width: '30px' }}>SL</th>
                <th style={{ textAlign: 'right', padding: '4px 0', width: '60px' }}>T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              {lastOrder.cart.map((item: any, idx: number) => {
                const isGift = item.product?.gift_info && item.qty >= parseInt((item.product.gift_info.split(';;;')[0] || "0"));
                const giftText = isGift ? item.product.gift_info.split(';;;')[1] : null;
                const pName = item.product?.name ? item.product.name.replace(/\[Lô mới\]/g, '').trim() : '';
                const priceToUse = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round(getActualPrice(item.product) * (1 + VAT_RATE));
                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <td style={{ padding: '4px 0', wordBreak: 'break-word' }}>
                        {pName} {item.product?.isHappyHour ? '(KM)' : ''}
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.qty}</td>
                      <td style={{ textAlign: 'right', padding: '4px 0' }}>{(priceToUse * item.qty).toLocaleString()}</td>
                    </tr>
                    {isGift && (
                      <tr>
                        <td colSpan={3} style={{ padding: '0 0 4px 10px', fontSize: '11px', fontStyle: 'italic' }}>
                          + Tặng: {giftText} (SL: 1)
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          <div style={{ borderTop: '1px dashed #000', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Cộng tiền hàng:</span>
              <span>{Math.round(lastOrder.subTotal + lastOrder.vatTotal + (lastOrder.discount || 0)).toLocaleString()}</span>
            </div>
            {(lastOrder.discount > 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Giảm giá/Voucher:</span>
                <span>-{lastOrder.discount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
              <span>TỔNG CỘNG:</span>
              <span>{Math.round(lastOrder.finalTotal).toLocaleString()}</span>
            </div>

            <div style={{ borderTop: '1px dotted #000', marginTop: '6px', paddingTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Tiền khách đưa:</span>
                <span>{lastOrder.customerGiven ? lastOrder.customerGiven.toLocaleString() : (lastOrder.paymentMethod === 'TIỀN MẶT' ? Math.round(lastOrder.finalTotal).toLocaleString() : '0')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Hình thức TT:</span>
                <span>{lastOrder.paymentMethod}</span>
              </div>
              {lastOrder.paymentMethod === 'KẾT HỢP' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '11px' }}>
                    <span>- Tiền mặt:</span>
                    <span>{(lastOrder.splitCash || 0).toLocaleString()}đ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '11px' }}>
                    <span>- Chuyển khoản:</span>
                    <span>{(lastOrder.splitTransfer || 0).toLocaleString()}đ</span>
                  </div>
                </>
              )}
              {lastOrder.debtAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontWeight: 'bold' }}>
                  <span>Ghi nợ:</span>
                  <span>{lastOrder.debtAmount.toLocaleString()}đ</span>
                </div>
              )}
              {lastOrder.paymentMethod === 'TIỀN MẶT' && lastOrder.customerGiven > lastOrder.finalTotal && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Tiền thừa trả khách:</span>
                  <span>{Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '15px', fontStyle: 'italic' }}>
              <p style={{ margin: '0 0 3px 0' }}>Cảm ơn quý khách và hẹn gặp lại!</p>
              <p style={{ margin: '0', fontSize: '10px' }}>Powered by HaiLe ERP</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. IN HÓA ĐƠN A4 */}
      {printMode === 'receipt_a4' && lastOrder && (
        <div className="print-content" id="print-a4" style={{ width: '210mm', padding: '20mm', margin: '0 auto', fontSize: '14px', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1e3a8a', paddingBottom: '20px', marginBottom: '20px' }}>
            <div>
              <h1 style={{ color: '#1e3a8a', margin: '0 0 10px 0', fontSize: '24px' }}>{storeNameDisplay}</h1>
              <p style={{ margin: '0 0 5px 0' }}><strong>Địa chỉ:</strong> {storeAddressDisplay}</p>
              <p style={{ margin: '0' }}><strong>Điện thoại:</strong> {storePhoneDisplay}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ color: '#64748b', margin: '0 0 10px 0', fontSize: '20px' }}>HÓA ĐƠN BÁN HÀNG</h2>
              <p style={{ margin: '0 0 5px 0' }}><strong>Số HĐ:</strong> {lastOrder.orderId}</p>
              <p style={{ margin: '0' }}><strong>Ngày lập:</strong> {lastOrder.time}</p>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 5px 0' }}><strong>Khách hàng:</strong> {lastOrder.custName || 'Khách lẻ'}</p>
            {lastOrder.custPhone && <p style={{ margin: '0 0 5px 0' }}><strong>Điện thoại:</strong> {lastOrder.custPhone}</p>}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>STT</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'left' }}>Tên Sản Phẩm</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>Số Lượng</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>Đơn Giá</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>Thành Tiền</th>
              </tr>
            </thead>
            <tbody>
              {lastOrder.cart.map((item: any, idx: number) => {
                const priceToUse = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round(getActualPrice(item.product) * (1 + VAT_RATE));
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>{item.product?.name ? item.product.name.replace(/\[Lô mới\]/g, '').trim() : ''}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>{priceToUse.toLocaleString()}đ</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>{(priceToUse * item.qty).toLocaleString()}đ</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>Cộng tiền hàng:</span>
                <strong>{Math.round(lastOrder.subTotal + lastOrder.vatTotal + (lastOrder.discount || 0)).toLocaleString()}đ</strong>
              </div>
              {lastOrder.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: '#ef4444' }}>
                  <span>Chiết khấu/Giảm giá:</span>
                  <strong>-{lastOrder.discount.toLocaleString()}đ</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #1e3a8a', fontSize: '18px', fontWeight: 'bold' }}>
                <span>TỔNG THANH TOÁN:</span>
                <span style={{ color: '#1e3a8a' }}>{Math.round(lastOrder.finalTotal).toLocaleString()}đ</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '50px', textAlign: 'center' }}>
            <div>
              <strong>Khách hàng</strong>
              <p style={{ marginTop: '50px', fontStyle: 'italic', color: '#64748b' }}>(Ký, ghi rõ họ tên)</p>
            </div>
            <div>
              <strong>Người bán hàng</strong>
              <p style={{ marginTop: '50px', fontStyle: 'italic', color: '#64748b' }}>(Ký, ghi rõ họ tên)</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. IN THẺ VIP */}
      {printMode === 'customer_card' && printCustomer && (
        <div className="print-content" id="print-card" style={{ width: '85mm', height: '54mm', margin: '0 auto', background: '#1e293b', color: 'white', borderRadius: '10px', padding: '15px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#38bdf8' }}>{storeNameDisplay}</h3>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>VIP CARD</span>
          </div>
          
          <div style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <QRCode value={printCustomer.cardCode || printCustomer.phone} size={60} />
          </div>

          <div>
            <p style={{ margin: '0 0 2px 0', fontSize: '10px', color: '#94a3b8' }}>Mã Thành Viên:</p>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', letterSpacing: '1px' }}>{printCustomer.cardCode || printCustomer.phone}</p>
          </div>
          
          <div style={{ position: 'absolute', bottom: '15px', right: '15px', textAlign: 'right' }}>
            <p style={{ margin: '0 0 2px 0', fontSize: '10px', color: '#94a3b8' }}>Chủ thẻ:</p>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>{printCustomer.name}</p>
          </div>
        </div>
      )}

      {/* 4. IN PHIẾU NHẬP KHO (Đã hoàn thiện chuẩn công thức Trừ Lỗi) */}
      {printMode === 'po' && printPOData && (
        <div className="print-content" id="print-po" style={{ width: '210mm', padding: '20mm', margin: '0 auto', fontSize: '14px', background: 'white' }}>
          <div className="invoice-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>PHIẾU NHẬP KHO (GOODS RECEIPT NOTE)</h2>
            <p style={{ margin: 0, fontSize: '13px' }}>Tham chiếu gốc (Mã PO): <strong>{printPOData.poCode || printPOData.id}</strong></p>
            <p style={{ margin: 0, fontSize: '13px' }}>Nhà cung cấp: <strong>{printPOData.supplierName || 'N/A'}</strong></p>
            <p style={{ margin: 0, fontSize: '13px' }}>Ngày nhập: {printPOData.importDate || new Date().toLocaleDateString('vi-VN')}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>STT</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'left' }}>Tên Sản Phẩm</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>Thực Nhận</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>Lỗi/Trả</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', color: '#1e3a8a' }}>SL (Trừ Lỗi)</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>Đơn Giá</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>Thành Tiền</th>
              </tr>
            </thead>
            <tbody>
              {(printPOData.items || []).map((item: any, idx: number) => {
                const orderQty = Number(item.qty) || 0;
                const receiveQty = item.receiveQty !== undefined ? Number(item.receiveQty) : orderQty;
                const faultQ = Number(item.faultyQty || item.faulty || item.errorQty || item.returnQty || item.rejectQty) || 0;
                
                // Cột SL = Thực nhận - Lỗi (Lấy từ hàm chuẩn Kế toán ở trên)
                const actualQty = getActualPOQty(item);
                const price = Number(item.importPrice) || 0;
                
                // Thành tiền = SL đã trừ lỗi * Đơn giá
                const lineTotal = actualQty * price;

                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>{item.product?.name || item.name}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>{receiveQty}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', color: faultQ > 0 ? '#ef4444' : 'inherit', fontWeight: faultQ > 0 ? 'bold' : 'normal' }}>
                      {faultQ > 0 ? `-${faultQ}` : 0}
                    </td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#1e3a8a' }}>
                      {actualQty}
                    </td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>{price.toLocaleString()}đ</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{lineTotal.toLocaleString()}đ</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '350px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #1e3a8a', fontSize: '18px', fontWeight: 'bold' }}>
                <span>TỔNG ĐƠN HÀNG:</span>
                <span style={{ color: '#1e3a8a' }}>{totalPOAmount.toLocaleString()}đ</span>
              </div>
              <p style={{ textAlign: 'right', fontSize: '12px', fontStyle: 'italic', color: '#64748b', margin: 0 }}>
                (Tổng tiền đã khấu trừ hàng lỗi/hoàn trả)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', textAlign: 'center', padding: '0 20px' }}>
            <div>
              <strong>Người Giao Hàng</strong>
              <p style={{ marginTop: '50px', fontStyle: 'italic', color: '#64748b' }}>(Ký, ghi rõ họ tên)</p>
            </div>
            <div>
              <strong>Thủ Kho</strong>
              <p style={{ marginTop: '50px', fontStyle: 'italic', color: '#64748b' }}>(Ký, ghi rõ họ tên)</p>
            </div>
            <div>
              <strong>Kế Toán / Quản Lý</strong>
              <p style={{ marginTop: '50px', fontStyle: 'italic', color: '#64748b' }}>(Ký, ghi rõ họ tên)</p>
            </div>
          </div>
        </div>
      )}

      {/* 5. IN TEM MÃ VẠCH (Barcode) */}
      {printMode === 'barcode' && printBarcodeProduct && (
        <div className="print-content" id="print-barcode" style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '5px' }}>
          {Array.from({ length: barcodeCount || 1 }).map((_, idx) => (
            <div key={idx} style={{ width: '35mm', height: '22mm', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1', padding: '2px', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '9px', textAlign: 'center', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', fontWeight: 'bold' }}>
                {printBarcodeProduct.name}
              </div>
              <QRCode value={printBarcodeProduct.barcode || printBarcodeProduct.id} size={40} />
              <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 'bold' }}>
                {Number(printBarcodeProduct.price || 0).toLocaleString()}đ
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
