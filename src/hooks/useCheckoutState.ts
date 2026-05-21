import { useState } from 'react';

export const useCheckoutState = () => {
  const [cart, setCart] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [customerInput, setCustomerInput] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custName, setCustName] = useState("");
  const [useWallet, setUseWallet] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucherAmount, setAppliedVoucherAmount] = useState<number>(0);
  const [customerGiven, setCustomerGiven] = useState<number | "">("");
  const [lastOrder, setLastOrder] = useState<any>(null);

  const resetCheckout = () => {
    setCart([]); setIsCheckoutOpen(false); setCheckoutStep(1); setCustPhone("");
    setCustName(""); setCustomerInput(""); setUseWallet(false); setVoucherInput("");
    setAppliedVoucherAmount(0); setCustomerGiven(""); setLastOrder(null);
  };

  return {
    cart, setCart, barcodeInput, setBarcodeInput, isCheckoutOpen, setIsCheckoutOpen,
    checkoutStep, setCheckoutStep, customerInput, setCustomerInput, custPhone, setCustPhone,
    custName, setCustName, useWallet, setUseWallet, voucherInput, setVoucherInput,
    appliedVoucherAmount, setAppliedVoucherAmount, customerGiven, setCustomerGiven,
    lastOrder, setLastOrder, resetCheckout
  };
};
