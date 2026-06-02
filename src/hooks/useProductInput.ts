import { useState } from 'react';

export const useProductInput = () => {
  // Thông tin cơ bản
  const [newCode, setNewCode] = useState<string>(""); 
  const [newName, setNewName] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("Đồ uống");
  
  // Thông tin giá cả
  const [newImportPrice, setNewImportPrice] = useState<string>(""); 
  const [newPrice, setNewPrice] = useState<string>("");
  const [newPromoPrice, setNewPromoPrice] = useState<string>(""); 
  
  // Thông tin quà tặng & Tồn kho
  const [newGiftCondition, setNewGiftCondition] = useState<string>("1");
  const [newGiftInfo, setNewGiftInfo] = useState<string>(""); 
  const [newStock, setNewStock] = useState<string>("");
  const [newExpiry, setNewExpiry] = useState<string>(""); 

  // Hàm reset form sau khi thêm/sửa thành công
  const resetProductForm = () => { 
    setNewCode(""); 
    setNewName(""); 
    setNewCategory("Đồ uống"); 
    setNewImportPrice(""); 
    setNewPrice(""); 
    setNewPromoPrice(""); 
    setNewGiftCondition("1"); 
    setNewGiftInfo(""); 
    setNewStock(""); 
    setNewExpiry(""); 
  };

  return { 
    newCode, setNewCode, 
    newName, setNewName, 
    newCategory, setNewCategory,
    newImportPrice, setNewImportPrice, 
    newPrice, setNewPrice, 
    newPromoPrice, setNewPromoPrice, 
    newGiftCondition, setNewGiftCondition, 
    newGiftInfo, setNewGiftInfo, 
    newStock, setNewStock, 
    newExpiry, setNewExpiry, 
    resetProductForm 
  };
};
