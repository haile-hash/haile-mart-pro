import { useState } from 'react';

export const useUIState = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("mart_theme") === "dark");
  const [showSettings, setShowSettings] = useState(false);
  const [showInputForm, setShowInputForm] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [cashFlowModalInfo, setCashFlowModalInfo] = useState<'TIỀN MẶT' | 'CHUYỂN KHOẢN' | null>(null);
  const [scannerMode, setScannerMode] = useState<'product' | 'voucher' | 'customer' | null>(null);
  const [printMode, setPrintMode] = useState<'receipt' | 'barcode' | 'customer_card' | 'invoice_a4' | null>(null);

  return {
    darkMode, setDarkMode, showSettings, setShowSettings, showInputForm, setShowInputForm,
    showDebtModal, setShowDebtModal, showStatsModal, setShowStatsModal, showCustomerModal, setShowCustomerModal,
    showHandoverModal, setShowHandoverModal, showAuditModal, setShowAuditModal, showHoldModal, setShowHoldModal,
    showExpenseModal, setShowExpenseModal, showSupplierModal, setShowSupplierModal, showMarketingModal, setShowMarketingModal,
    showInventoryModal, setShowInventoryModal, showMainMenu, setShowMainMenu, cashFlowModalInfo, setCashFlowModalInfo,
    scannerMode, setScannerMode, printMode, setPrintMode
  };
};
