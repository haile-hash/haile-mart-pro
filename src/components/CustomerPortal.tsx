import React, { useState } from 'react';

export default function CustomerPortal({ products, onAddOrder, onUpdateInventoryAfterSale }: any) {
  const [cart, setCart] = useState<any[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.barcode);
      if (existing) {
        return prev.map(item => item.productId === product.barcode ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { productId: product.barcode, name: product.name, price: product.sellingPrice || product.sale_price, qty: 1 }];
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Gỉa lập luồng xử lý đơn hàng
    const newOrder = {
      id: `ORD-${Date.now()}`,
      items: cart,
      orderDate: new Date().toISOString(),
      totalAmount: totalAmount,
      finalAmount: totalAmount,
      paymentMethod: 'momo',
      paymentStatus: 'paid',
      shippingStatus: 'shipping',
      shippingAddress: 'Khách mua Online',
      deliveryProgress: 30,
      timestamp: new Date().toISOString()
    };

    onAddOrder(newOrder);
    onUpdateInventoryAfterSale(cart);
    setCart([]);
    setIsCheckingOut(true);
    
    // Tự động tắt thông báo sau 4 giây
    setTimeout(() => setIsCheckingOut(false), 4000);
  };

  if (isCheckingOut) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6">
        <div className="text-8xl animate-bounce">🛵</div>
        <h2 className="text-3xl font-black text-orange-500">Thanh toán thành công!</h2>
        <p className="text-slate-500 text-lg">Tài xế đang trên đường giao hàng đến bạn (Live GPS simulated).</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Danh sách sản phẩm */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-2xl font-black text-slate-800 mb-6">Siêu thị Online</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((p: any) => (
            <div key={p.barcode} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="h-32 bg-slate-50 rounded-xl flex items-center justify-center text-4xl mb-4">🛒</div>
              <h3 className="font-bold text-slate-800 text-sm line-clamp-2">{p.name}</h3>
              <p className="text-orange-500 font-black mt-2">{(p.sellingPrice || p.sale_price || 0).toLocaleString()}đ</p>
              <button 
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className={`mt-4 py-2 rounded-xl font-bold transition-colors ${p.stock > 0 ? 'bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              >
                {p.stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Giỏ hàng thanh toán */}
      <div className="w-96 bg-white rounded-3xl shadow-lg border border-slate-100 p-6 flex flex-col">
        <h3 className="text-xl font-black text-slate-800 mb-4 border-b pb-4">Giỏ hàng của bạn</h3>
        <div className="flex-1 overflow-y-auto space-y-4">
          {cart.length === 0 ? (
            <p className="text-slate-400 text-center mt-10">Giỏ hàng đang trống.</p>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <div className="font-bold text-sm text-slate-800">{item.name}</div>
                  <div className="text-orange-500 font-bold text-xs">{item.price.toLocaleString()}đ x {item.qty}</div>
                </div>
                <div className="font-black text-slate-800">{(item.price * item.qty).toLocaleString()}đ</div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500 font-bold">Tổng thanh toán:</span>
            <span className="text-2xl font-black text-orange-500">{totalAmount.toLocaleString()}đ</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${cart.length > 0 ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/30 hover:bg-orange-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            Thanh toán Online (VNPay/MoMo)
          </button>
        </div>
      </div>
    </div>
  );
}
