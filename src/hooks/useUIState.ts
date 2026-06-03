import { useState } from 'react';

export type CashFlowType = 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | null;
export type ScannerMode = 'product' | 'voucher' | 'customer' | null;
export type PrintMode = 'receipt_thermal' | 'receipt_a4' | 'barcode' | 'customer_card' | null;

export const useUIState = () => {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("mart_theme") === "dark";
    }
    return false;
  });

  // Modal Boolean States
  const [showSettings, setShowSettings] = useState<boolean>(false); 
  const [showInputForm, setShowInputForm] = useState<boolean>(false);
  const [showDebtModal, setShowDebtModal] = useState<boolean>(false); 
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false); 
  const [showHandoverModal, setShowHandoverModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false); 
  const [showHoldModal, setShowHoldModal] = useState<boolean>(false);
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false); 
  const [showSupplierModal, setShowSupplierModal] = useState<boolean>(false);
  const [showMarketingModal, setShowMarketingModal] = useState<boolean>(false); 
  const [showInventoryModal, setShowInventoryModal] = useState<boolean>(false);
  const [showMainMenu, setShowMainMenu] = useState<boolean>(false);
  
  // 👉 CÁC STATE BỊ THIẾU ĐÃ ĐƯỢC BỔ SUNG Ở ĐÂY:
  const [showPOModal, setShowPOModal] = useState<boolean>(false);
  const [showStoreSettings, setShowStoreSettings] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [showScannerLinkModal, setShowScannerLinkModal] = useState<boolean>(false);
  
  // Specific Tool States
  const [cashFlowModalInfo, setCashFlowModalInfo] = useState<CashFlowType>(null);
  const [scannerMode, setScannerMode] = useState<ScannerMode>(null);
  const [printMode, setPrintMode] = useState<PrintMode>(null);

  return { 
    darkMode, setDarkMode, 
    showSettings, setShowSettings, 
    showInputForm, setShowInputForm, 
    showDebtModal, setShowDebtModal, 
    showStatsModal, setShowStatsModal, 
    showCustomerModal, setShowCustomerModal, 
    showHandoverModal, setShowHandoverModal, 
    showAuditModal, setShowAuditModal, 
    showHoldModal, setShowHoldModal, 
    showExpenseModal, setShowExpenseModal, 
    showSupplierModal, setShowSupplierModal, 
    showMarketingModal, setShowMarketingModal, 
    showInventoryModal, setShowInventoryModal, 
    showMainMenu, setShowMainMenu, 
    
    // 👉 ĐỪNG QUÊN RETURN CHÚNG RA NGOÀI ĐỂ APP.TSX CÓ THỂ GỌI ĐƯỢC:
    showPOModal, setShowPOModal,
    showStoreSettings, setShowStoreSettings,
    showPinModal, setShowPinModal,
    showScannerLinkModal, setShowScannerLinkModal,

    cashFlowModalInfo, setCashFlowModalInfo, 
    scannerMode, setScannerMode, 
    printMode, setPrintMode 
  };
};
