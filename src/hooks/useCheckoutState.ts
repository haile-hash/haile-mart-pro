import { useState } from 'react';
import { CartItem, OrderReceipt } from '../types'; // Import các type đã định nghĩa

export const useCheckoutState = () => {
  // --- 1. NHÓM GIỎ HÀNG VÀ TIẾN TRÌNH ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<number>(1); 
  const [barcodeInput, setBarcodeInput] = useState<string>(""); 

  // --- 2. NHÓM THÔNG TIN KHÁCH HÀNG ---
  const [customerInput, setCustomerInput] = useState<string>("");
  const [custPhone, setCustPhone] = useState<string>(""); 
  const [custName, setCustName] = useState<string>("");
  const [custAddress, setCustAddress] = useState<string>(""); 

  // --- 3. NHÓM THANH TOÁN, VOUCHER VÀ VÍ ---
  const [useWallet, setUseWallet] = useState<boolean>(false); 
  const [voucherInput, setVoucherInput] = useState<string>("");
  const [appliedVoucherAmount, setAppliedVoucherAmount] = useState<number>(0);
  const [customerGiven, setCustomerGiven] = useState<number | "">(""); 
  
  // --- 4. NHÓM HÓA ĐƠN HOÀN TẤT ---
  // Dùng để in hóa đơn, gửi email sau khi thanh toán xong
  const [lastOrder, setLastOrder] = useState<OrderReceipt | null>(null);

  // Hàm dọn dẹp sạch sẽ toàn bộ state (Cực kỳ quan trọng để không bị lẫn đơn cũ)
  const resetCheckout = () => {
    setCart([]); 
    setIsCheckoutOpen(false); 
    setCheckoutStep(1); 
    setBarcodeInput(""); // Đã FIX: Reset input quét mã vạch
    
    // Reset Khách hàng
    setCustomerInput(""); 
    setCustPhone("");
    setCustName(""); 
    setCustAddress(""); 
    
    // Reset Thanh toán
    setUseWallet(false); 
    setVoucherInput("");
    setAppliedVoucherAmount(0); 
    setCustomerGiven(""); 
    
    setLastOrder(null);
  };

  return { 
    custAddress, setCustAddress, 
    cart, setCart, 
    barcodeInput, setBarcodeInput, 
    isCheckoutOpen, setIsCheckoutOpen, 
    checkoutStep, setCheckoutStep, 
    customerInput, setCustomerInput, 
    custPhone, setCustPhone, 
    custName, setCustName, 
    useWallet, setUseWallet, 
    voucherInput, setVoucherInput, 
    appliedVoucherAmount, setAppliedVoucherAmount, 
    customerGiven, setCustomerGiven, 
    lastOrder, setLastOrder, 
    resetCheckout 
  };
};
