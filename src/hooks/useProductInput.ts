import { useState } from 'react';

export const useProductInput = () => {
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newImportPrice, setNewImportPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newPromoPrice, setNewPromoPrice] = useState("");
  const [newGiftCondition, setNewGiftCondition] = useState("1");
  const [newGiftInfo, setNewGiftInfo] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [newCategory, setNewCategory] = useState("Đồ uống");

  const resetProductForm = () => {
    setNewCode(""); setNewName(""); setNewImportPrice(""); setNewPrice("");
    setNewPromoPrice(""); setNewGiftCondition("1"); setNewGiftInfo("");
    setNewStock(""); setNewExpiry(""); setNewCategory("Đồ uống");
  };

  return {
    newCode, setNewCode, newName, setNewName, newImportPrice, setNewImportPrice,
    newPrice, setNewPrice, newPromoPrice, setNewPromoPrice, newGiftCondition, setNewGiftCondition,
    newGiftInfo, setNewGiftInfo, newStock, setNewStock, newExpiry, setNewExpiry, newCategory, setNewCategory,
    resetProductForm
  };
};
