import ExcelJS from 'exceljs';
// @ts-ignore
import { saveAs } from 'file-saver';

export const exportPOToExcel = async (
  po: any, 
  supplier: any, 
  storeInfo: any
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Đơn Đặt Hàng', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });

  worksheet.columns = [
    { key: 'stt', width: 6 },
    { key: 'code', width: 18 },
    { key: 'name', width: 40 },
    { key: 'qty', width: 12 },
    { key: 'price', width: 20 },
    { key: 'total', width: 22 },
  ];

  worksheet.mergeCells('A1:F2');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'ĐƠN ĐẶT HÀNG (PURCHASE ORDER)';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; 
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.mergeCells('A4:C4'); worksheet.getCell('A4').value = 'THÔNG TIN BÊN MUA (BUYER)';
  worksheet.mergeCells('D4:F4'); worksheet.getCell('D4').value = 'THÔNG TIN BÊN BÁN (SELLER)';
  worksheet.getRow(4).font = { bold: true, name: 'Arial', size: 11 };
  worksheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

  const safeStoreName = storeInfo?.store_name || 'HẢI LÊ MART';
  const safeSupplierName = supplier?.name || 'Chưa chọn NCC';
  
  worksheet.getCell('A5').value = `Tên đơn vị: ${safeStoreName}`;
  worksheet.getCell('D5').value = `Nhà cung cấp: ${safeSupplierName}`;
  worksheet.getCell('A6').value = `Địa chỉ: ${storeInfo?.address || '234 Hoàng Quốc Việt, Hà Nội'}`;
  worksheet.getCell('D6').value = `Địa chỉ: ${supplier?.address || 'Chưa cập nhật'}`;
  worksheet.getCell('A7').value = `Điện thoại: ${storeInfo?.phone || 'Chưa cập nhật'}`;
  worksheet.getCell('D7').value = `Điện thoại: ${supplier?.phone || 'Chưa cập nhật'}`;

  worksheet.mergeCells('A10:F10');
  worksheet.getCell('A10').value = 'THÔNG TIN CHỨNG TỪ';
  worksheet.getCell('A10').font = { bold: true };
  worksheet.getCell('A10').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

  worksheet.getCell('A11').value = `Mã phiếu: ${po.id}`;
  worksheet.getCell('D11').value = `Ngày lập: ${new Date(po.orderDate).toLocaleDateString('vi-VN')}`;
  worksheet.getCell('A12').value = `Ghi chú: ${po.note || 'Không có'}`;
  worksheet.getCell('D12').value = `Trạng thái: Bản nháp (Draft)`;

  const headerRow = worksheet.getRow(14);
  headerRow.values = ['STT', 'Mã Sản Phẩm', 'Tên Sản Phẩm', 'Số Lượng', 'Đơn Giá Nhập (VNĐ)', 'Thành Tiền (VNĐ)'];
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
    const cell = worksheet.getCell(`${col}14`);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }; 
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  let currentRow = 15;
  let totalAmount = 0;

  po.items.forEach((item: any, index: number) => {
    const row = worksheet.getRow(currentRow);
    const lineTotal = item.qty * item.importPrice;
    totalAmount += lineTotal;

    row.values = [
      index + 1,
      item.product.product_code || item.product.barcode || item.product.id,
      item.product.name,
      item.qty,
      item.importPrice,
      lineTotal
    ];

    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(4).alignment = { horizontal: 'center' };
    row.getCell(5).numFmt = '#,##0'; 
    row.getCell(6).numFmt = '#,##0';

    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
      row.getCell(`${col}${currentRow}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    currentRow++;
  });

  // --- PHẦN TỔNG KẾT (3 DÒNG TIỀN) ---
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const totalLabelCell = worksheet.getCell(`A${currentRow}`);
  totalLabelCell.value = 'TỔNG TIỀN HÀNG:';
  totalLabelCell.font = { bold: true };
  totalLabelCell.alignment = { horizontal: 'right' };
  worksheet.getCell(`F${currentRow}`).value = totalAmount;
  worksheet.getCell(`F${currentRow}`).font = { bold: true }; 
  worksheet.getCell(`F${currentRow}`).numFmt = '#,##0';
  currentRow++;

  const paid = po.paidAmount || 0;
  const debt = totalAmount - paid;

  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = 'ĐÃ TRẢ TRƯỚC:';
  worksheet.getCell(`A${currentRow}`).font = { italic: true };
  worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' };
  worksheet.getCell(`F${currentRow}`).value = paid;
  worksheet.getCell(`F${currentRow}`).font = { italic: true, color: { argb: 'FF059669' } }; 
  worksheet.getCell(`F${currentRow}`).numFmt = '#,##0';
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const debtLabelCell = worksheet.getCell(`A${currentRow}`);
  debtLabelCell.value = 'CÒN NỢ LẠI:';
  debtLabelCell.font = { bold: true };
  debtLabelCell.alignment = { horizontal: 'right' };
  worksheet.getCell(`F${currentRow}`).value = debt;
  worksheet.getCell(`F${currentRow}`).font = { bold: true, color: { argb: 'FFDC2626' } }; 
  worksheet.getCell(`F${currentRow}`).numFmt = '#,##0';
  
  // Kẻ viền cho 3 khối tổng kết
  for (let r = currentRow - 2; r <= currentRow; r++) {
    ['A', 'F'].forEach(col => {
      worksheet.getCell(`${col}${r}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  }

  currentRow += 3;
  worksheet.getCell(`B${currentRow}`).value = 'ĐẠI DIỆN BÊN MUA';
  worksheet.getCell(`B${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow + 1}`).value = '(Ký, ghi rõ họ tên & đóng dấu)';
  worksheet.getCell(`B${currentRow + 1}`).font = { italic: true };
  
  worksheet.getCell(`E${currentRow}`).value = 'ĐẠI DIỆN BÊN BÁN';
  worksheet.getCell(`E${currentRow}`).font = { bold: true };
  worksheet.getCell(`E${currentRow + 1}`).value = '(Ký, ghi rõ họ tên & đóng dấu)';
  worksheet.getCell(`E${currentRow + 1}`).font = { italic: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `PO_DRAFT_${new Date().getTime()}.xlsx`);
};
