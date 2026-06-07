import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PurchaseOrder, Supplier } from '../types';

export const exportPOToExcel = async (
  po: PurchaseOrder, 
  supplier: Supplier | undefined, 
  storeInfo: any
) => {
  // 1. Tạo Workbook và Worksheet mới
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Đơn Đặt Hàng', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });

  // 2. Thiết lập độ rộng các cột cho đẹp
  worksheet.columns = [
    { key: 'stt', width: 6 },
    { key: 'code', width: 18 },
    { key: 'name', width: 40 },
    { key: 'qty', width: 12 },
    { key: 'price', width: 20 },
    { key: 'total', width: 22 },
  ];

  // --- PHẦN HEADER ---
  // Dòng 1: Tiêu đề siêu to khổng lồ
  worksheet.mergeCells('A1:F2');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'ĐƠN ĐẶT HÀNG (PURCHASE ORDER)';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // Màu xanh navy đậm
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Dòng 4: Thông tin bên mua & Bên bán
  worksheet.mergeCells('A4:C4'); worksheet.getCell('A4').value = 'THÔNG TIN BÊN MUA (BUYER)';
  worksheet.mergeCells('D4:F4'); worksheet.getCell('D4').value = 'THÔNG TIN BÊN BÁN (SELLER)';
  worksheet.getRow(4).font = { bold: true, name: 'Arial', size: 11 };
  worksheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

  // Dòng 5-8: Chi tiết thông tin
  const safeStoreName = storeInfo?.store_name || 'HẢI LÊ MART';
  const safeSupplierName = supplier?.name || 'Nhà cung cấp ABC';
  
  worksheet.getCell('A5').value = `Tên đơn vị: ${safeStoreName}`;
  worksheet.getCell('D5').value = `Nhà cung cấp: ${safeSupplierName}`;
  
  worksheet.getCell('A6').value = `Địa chỉ: ${storeInfo?.address || '234 Hoàng Quốc Việt, Hà Nội'}`;
  worksheet.getCell('D6').value = `Địa chỉ: ${supplier?.address || 'Chưa cập nhật'}`;
  
  worksheet.getCell('A7').value = `Điện thoại: ${storeInfo?.phone || '090xxxxxxx'}`;
  worksheet.getCell('D7').value = `Điện thoại: ${supplier?.phone || 'Chưa cập nhật'}`;

  // Dòng 10: Thông tin chứng từ
  worksheet.mergeCells('A10:F10');
  worksheet.getCell('A10').value = 'THÔNG TIN CHỨNG TỪ';
  worksheet.getCell('A10').font = { bold: true };
  worksheet.getCell('A10').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

  worksheet.getCell('A11').value = `Mã PO: ${po.id}`;
  worksheet.getCell('D11').value = `Ngày lập: ${new Date(po.orderDate).toLocaleDateString('vi-VN')}`;
  
  worksheet.getCell('A12').value = `Ghi chú: ${po.note || 'Không có'}`;
  const statusText = po.status === 'draft' ? 'Bản nháp' : po.status === 'ordered' ? 'Đã gửi NCC' : 'Đã nhập kho';
  worksheet.getCell('D12').value = `Trạng thái: ${statusText}`;

  // --- PHẦN BẢNG DỮ LIỆU ---
  // Tiêu đề bảng (Dòng 14)
  const headerRow = worksheet.getRow(14);
  headerRow.values = ['STT', 'Mã Sản Phẩm', 'Tên Sản Phẩm', 'Số Lượng', 'Đơn Giá Nhập (VNĐ)', 'Thành Tiền (VNĐ)'];
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Tô màu nền xanh cho Header bảng và kẻ viền
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
    const cell = worksheet.getCell(`${col}14`);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }; // Xanh sáng hơn
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Đổ dữ liệu Sản phẩm
  let currentRow = 15;
  let totalAmount = 0;

  po.items.forEach((item, index) => {
    const row = worksheet.getRow(currentRow);
    const lineTotal = item.orderedQty * item.costPrice;
    totalAmount += lineTotal;

    row.values = [
      index + 1,
      item.productId,
      `Sản phẩm mã ${item.productId}`, // Chỗ này nếu truyền được Array Products vào để map lấy tên thì càng tốt
      item.orderedQty,
      item.costPrice,
      lineTotal
    ];

    // Căn lề & Format số
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(4).alignment = { horizontal: 'center' };
    row.getCell(5).numFmt = '#,##0'; // Format tiền tệ
    row.getCell(6).numFmt = '#,##0';

    // Kẻ viền cho từng ô dữ liệu
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
      row.getCell(`${col}${currentRow}`).border = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });
    currentRow++;
  });

  // --- PHẦN TỔNG KẾT ---
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const totalLabelCell = worksheet.getCell(`A${currentRow}`);
  totalLabelCell.value = 'TỔNG TIỀN THANH TOÁN:';
  totalLabelCell.font = { bold: true };
  totalLabelCell.alignment = { horizontal: 'right' };
  
  const totalValueCell = worksheet.getCell(`F${currentRow}`);
  totalValueCell.value = totalAmount;
  totalValueCell.font = { bold: true, color: { argb: 'FFDC2626' } }; // Chữ đỏ
  totalValueCell.numFmt = '#,##0';
  
  // Viền cho phần tổng kết
  ['A', 'F'].forEach(col => {
    worksheet.getCell(`${col}${currentRow}`).border = {
      top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });

  // --- CHỮ KÝ ---
  currentRow += 3;
  worksheet.getCell(`B${currentRow}`).value = 'ĐẠI DIỆN BÊN MUA';
  worksheet.getCell(`B${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow + 1}`).value = '(Ký, ghi rõ họ tên)';
  worksheet.getCell(`B${currentRow + 1}`).font = { italic: true };
  
  worksheet.getCell(`E${currentRow}`).value = 'ĐẠI DIỆN BÊN BÁN';
  worksheet.getCell(`E${currentRow}`).font = { bold: true };
  worksheet.getCell(`E${currentRow + 1}`).value = '(Ký, ghi rõ họ tên & đóng dấu)';
  worksheet.getCell(`E${currentRow + 1}`).font = { italic: true };

  // 3. Xuất file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `PO_${po.id}_${new Date().getTime()}.xlsx`);
};
