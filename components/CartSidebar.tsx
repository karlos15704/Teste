import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CartItem, PaymentMethod } from '../types';
import { formatCurrency } from '../utils';
import { MASCOT_URL } from '../constants';
import { X, Trash2, ShoppingCart, CreditCard, Banknote, QrCode, Lock, Unlock, Plus, Minus, CheckCircle2, Calculator, ChevronDown } from 'lucide-react';

interface CartSidebarProps {
  cart: CartItem[];
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onClearCart: () => void;
  onCheckout: (discount: number, method: PaymentMethod, change?: number, amountPaid?: number) => void;
  onClose?: () => void; // Prop opcional para fechar no mobile
}

const CartSidebar: React.FC<CartSidebarProps> = ({ cart, onRemoveItem, onUpdateQuantity, onClearCart, onCheckout, onClose }) => {
  const [discountValue, setDiscountValue] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  
  // Pix Modal State
  const [showPixModal, setShowPixModal] = useState(false);

  // Cash/Calculator Modal State
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceivedStr, setCashReceivedStr] = useState<string>('');
  const cashInputRef = useRef<HTMLInputElement>(null);

  // Discount Security State
  const [isDiscountUnlocked, setIsDiscountUnlocked] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cart]);

  const discount = parseFloat(discountValue) || 0;
  const total = Math.max(0, subtotal - discount);
  
  // Cash Calculations
  const cashReceived = parseFloat(cashReceivedStr.replace(',', '.')) || 0;
  const cashChange = Math.max(0, cashReceived - total);
  const missingCash = Math.max(0, total - cashReceived);

  // Configuração da Imagem do Pix (Link fornecido)
  const PIX_QR_IMAGE = "https://upnow-prod.ff45e40d1a1c8f7e7de4e976d0c9e555.r2.cloudflarestorage.com/sZfVUJbAelbb6Rfo7X2xf7SHdG82/dd07c32a-8de9-48cc-a6d6-77072b86c9d3?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=2f488bd324502ec20fee5b40e9c9ed39%2F20260120%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20260120T211559Z&X-Amz-Expires=43200&X-Amz-Signature=219bcd365bdd21f471b94deb3cc43205f21178d9df47dfbdaa1a666489ffc516&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3D%22Captura%20de%20tela%202026-01-20%20181523.png%22";

  // Focus input when cash modal opens
  useEffect(() => {
    if (showCashModal && cashInputRef.current) {
      cashInputRef.current.focus();
    }
  }, [showCashModal]);

  const resetState = () => {
    setDiscountValue('');
    setSelectedMethod(null);
    setShowPixModal(false);
    setShowCashModal(false);
    setCashReceivedStr('');
    setIsDiscountUnlocked(false);
    setShowPasswordInput(false);
    setPasswordAttempt('');
    if (onClose) onClose(); // Fecha o mobile drawer após checkout
  };

  const handleCheckout = () => {
    if (!selectedMethod) return;
    
    // For Cash, we pass extra info
    if (selectedMethod === PaymentMethod.CASH) {
       onCheckout(discount, selectedMethod, cashChange, cashReceived);
    } else {
       onCheckout(discount, selectedMethod);
    }
    resetState();
  };

  const handleUnlockDiscount = () => {
    // SENHA ATUALIZADA PARA O PADRÃO MASTER
    if (passwordAttempt === '32034392320') {
      setIsDiscountUnlocked(true);
      setShowPasswordInput(false);
      setPasswordAttempt('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordAttempt('');
    }
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method === PaymentMethod.PIX) {
      setShowPixModal(true);
    } else if (method === PaymentMethod.CASH) {
      setShowCashModal(true);
    } else {
      // Direct checkout for Card
      onCheckout(discount, method);
      resetState();
    }
  };

  // Calculator Logic
  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setCashReceivedStr('');
      return;
    }
    if (val === 'back') {
      setCashReceivedStr(prev => prev.slice(0, -1));
      return;
    }
    
    // Prevent multiple decimals
    if (val === ',' && cashReceivedStr.includes(',')) return;
    
    setCashReceivedStr(prev => prev + val);
  };

  const addBill = (amount: number) => {
    const current = parseFloat(cashReceivedStr.replace(',', '.')) || 0;
    const newVal = current + amount;
    setCashReceivedStr(newVal.toString().replace('.', ','));
  };

  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 bg-white border-l border-orange-100 relative overflow-hidden">
        {/* Mobile Close Button for Empty State */}
        {onClose && (
          <button 
            onClick={onClose} 
            className="absolute top-4 left-4 md:hidden p-2 bg-gray-100 rounded-full text-gray-600 z-50"
          >
            <ChevronDown size={24} />
          </button>
        )}

        {/* Mascot Image with Animation */}
        <div className="mb-6 relative w-48 h-48">
          <div className="absolute inset-0 bg-orange-100 rounded-full blur-2xl opacity-50 transform scale-110"></div>
          {/* Added mix-blend-multiply to simulate background removal */}
          <img 
            src={MASCOT_URL} 
            alt="Mascote Tô Frito" 
            className="w-full h-full object-contain relative z-10 animate-mascot-chill mix-blend-multiply"
          />
        </div>
        
        <p className="text-xl font-bold text-gray-600 mb-2 font-display">TÔ DE BOA...</p>
        <p className="text-sm text-gray-400 text-center max-w-[200px]">
          O mascote está relaxando porque ainda não tem pedidos. Bora vender!
        </p>
      </div>
    );
  }

  return (
    <>
      {/* CASH CALCULATOR MODAL */}
      {showCashModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           {/* Adicionado max-h e overflow-y para telas pequenas */}
           <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200 relative">
              <div className="bg-orange-600 p-4 text-white flex justify-between items-center sticky top-0 z-10">
                 <h3 className="font-bold text-lg flex items-center gap-2">
                   <Calculator size={24} />
                   Calculadora
                 </h3>
                 <button onClick={() => { setShowCashModal(false); setSelectedMethod(null); }} className="hover:bg-orange-700 p-1 rounded-full transition-colors">
                   <X size={24} />
                 </button>
              </div>
              
              <div className="p-4 md:p-6 bg-slate-50">
                 {/* Display Section */}
                 <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                    <div className="bg-white p-2 md:p-3 rounded-xl border border-gray-200 shadow-sm">
                       <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Total</p>
                       <p className="text-xl md:text-2xl font-black text-gray-800">{formatCurrency(total)}</p>
                    </div>
                    <div className={`p-2 md:p-3 rounded-xl border shadow-sm ${missingCash > 0 ? 'bg-white border-red-200' : 'bg-green-100 border-green-300'}`}>
                       <p className={`text-[10px] md:text-xs font-bold uppercase ${missingCash > 0 ? 'text-gray-500' : 'text-green-700'}`}>
                         {missingCash > 0 ? 'Falta' : 'Troco'}
                       </p>
                       <p className={`text-xl md:text-2xl font-black ${missingCash > 0 ? 'text-red-500' : 'text-green-700'}`}>
                         {missingCash > 0 ? formatCurrency(missingCash) : formatCurrency(cashChange)}
                       </p>
                    </div>
                 </div>

                 {/* Input Display */}
                 <div className="mb-4 relative">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Recebido</label>
                    <div className="flex items-center mt-1">
                      <span className="absolute left-4 text-gray-400 font-bold">R$</span>
                      <input 
                        ref={cashInputRef}
                        type="text" 
                        value={cashReceivedStr}
                        readOnly
                        className="w-full bg-white border-2 border-orange-200 rounded-xl py-3 pl-10 pr-4 text-right text-3xl font-bold text-gray-800 focus:outline-none focus:border-orange-500 transition-colors shadow-inner"
                        placeholder="0,00"
                      />
                    </div>
                 </div>

                 {/* Quick Add Buttons */}
                 <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {[2, 5, 10, 20, 50, 100].map(val => (
                      <button 
                        key={val}
                        onClick={() => addBill(val)}
                        className="flex-shrink-0 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-bold py-2 px-3 rounded-lg text-sm transition-colors shadow-sm"
                      >
                        +{val}
                      </button>
                    ))}
                 </div>

                 {/* Numeric Keypad */}
                 <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6">
                    {['1','2','3','4','5','6','7','8','9','C','0',','].map(key => (
                       <button
                         key={key}
                         onClick={() => handleKeypadPress(key)}
                         className={`py-3 md:py-4 rounded-xl text-xl font-bold shadow-sm transition-transform active:scale-95 border
                           ${key === 'C' 
                             ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                             : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                       >
                         {key}
                       </button>
                    ))}
                 </div>

                 <button 
                   disabled={missingCash > 0}
                   onClick={handleCheckout}
                   className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-all text-lg flex items-center justify-center gap-2 animate-cta-bounce active:scale-95 active:shadow-none"
                 >
                   <CheckCircle2 size={24} />
                   CONFIRMAR
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* PIX MODAL OVERLAY */}
      {showPixModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200 relative">
            
            {/* Close Button Absolute for cleaner look */}
            <button 
                onClick={() => { setShowPixModal(false); setSelectedMethod(null); }}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors z-10"
              >
                <X size={20} />
            </button>

            {/* Header */}
            <div className="pt-8 px-6 text-center">
              <div className="inline-flex p-3 bg-teal-50 rounded-full mb-3">
                 <QrCode size={32} className="text-teal-600" />
              </div>
              <h3 className="font-black text-xl text-gray-800 uppercase tracking-tight">
                Pagamento via Pix
              </h3>
              <p className="text-gray-500 text-sm mt-1">Aproxime a câmera ou escaneie</p>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col items-center">
              <div className="bg-white p-2 rounded-xl border-2 border-teal-500 shadow-lg shadow-teal-100 mb-6">
                {/* IMAGEM DO QR CODE */}
                <img 
                  src={PIX_QR_IMAGE} 
                  alt="QR Code Pix"
                  className="w-48 h-48 md:w-64 md:h-64 object-contain mix-blend-multiply" 
                />
              </div>
              
              <div className="w-full text-center mb-6 bg-teal-50 p-4 rounded-xl border border-teal-100">
                <p className="text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">Valor Total</p>
                <p className="text-4xl font-black text-teal-700">{formatCurrency(total)}</p>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-200"
              >
                <CheckCircle2 size={24} />
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Sidebar Content */}
      <div className="flex flex-col h-full bg-white border-l border-gray-200">
        
        {/* Header */}
        <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            {/* Mobile Close Button */}
            {onClose && (
               <button onClick={onClose} className="md:hidden p-1.5 mr-1 bg-white rounded-lg border border-gray-200 text-gray-600 shadow-sm active:scale-95">
                  <ChevronDown size={20} />
               </button>
            )}

            <div className="p-2 bg-white rounded-full text-orange-600 shadow-sm hidden md:block">
              <ShoppingCart size={20} />
            </div>
            <h2 className="font-bold text-gray-800 text-lg">Seu Pedido</h2>
          </div>
          <button 
            onClick={onClearCart}
            className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Limpar carrinho"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map((item) => (
            <div key={item.id} className="flex gap-3 bg-white border border-gray-100 rounded-xl p-2 shadow-sm hover:shadow-md transition-shadow group animate-in slide-in-from-left-2 duration-200">
               <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
                 <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                 <div className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                   x{item.quantity}
                 </div>
               </div>
               
               <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                     <h4 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">{item.name}</h4>
                     
                     {/* BOTÃO X ATUALIZADO: Sempre visível, vermelho e fácil de clicar */}
                     <button 
                       onClick={() => onRemoveItem(item.id)} 
                       className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1 rounded-md transition-colors"
                       title="Remover item"
                     >
                       <X size={18} />
                     </button>
                  </div>
                  
                  <div className="flex justify-between items-end mt-1">
                     <p className="text-sm font-bold text-orange-600">{formatCurrency(item.price * item.quantity)}</p>
                     
                     <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-orange-600 active:scale-95 transition-all disabled:opacity-50"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-bold text-gray-800 w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-orange-600 active:scale-95 transition-all"
                        >
                          <Plus size={12} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-gray-100 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] p-4 space-y-4">
           
           {/* Totals */}
           <div className="space-y-2">
             <div className="flex justify-between text-gray-500 text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
             </div>
             
             {/* Discount Section */}
             <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                   <span>Desconto</span>
                   {!isDiscountUnlocked ? (
                     <button onClick={() => setShowPasswordInput(true)} className="text-gray-400 hover:text-orange-500">
                       <Lock size={14} />
                     </button>
                   ) : (
                     <Unlock size={14} className="text-green-500" />
                   )}
                </div>
                
                {showPasswordInput ? (
                  <div className="flex items-center gap-2 animate-in slide-in-from-right duration-200">
                    <input 
                      type="password"
                      placeholder="Senha..."
                      className={`w-20 px-2 py-1 text-xs border rounded ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
                      value={passwordAttempt}
                      onChange={(e) => setPasswordAttempt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUnlockDiscount()}
                      autoFocus
                    />
                    <button onClick={handleUnlockDiscount} className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">OK</button>
                  </div>
                ) : isDiscountUnlocked ? (
                  <div className="flex items-center gap-1">
                     <span className="text-red-500 font-bold">- R$</span>
                     <input 
                        type="number"
                        min="0"
                        step="0.10"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-16 text-right font-bold text-red-500 border-b border-red-200 focus:outline-none bg-transparent"
                        placeholder="0.00"
                      />
                  </div>
                ) : (
                  <span>{formatCurrency(discount)}</span>
                )}
             </div>

             <div className="flex justify-between items-end pt-2 border-t border-gray-100">
                <span className="text-gray-800 font-bold text-lg">Total</span>
                <span className="text-3xl font-black text-gray-900">{formatCurrency(total)}</span>
             </div>
           </div>

           {/* Payment Methods */}
           <div className="grid grid-cols-2 gap-2 pt-2 pb-24 md:pb-0"> {/* Padding bottom extra on mobile */}
              <button 
                onClick={() => handlePaymentSelect(PaymentMethod.CREDIT)}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all active:scale-95"
              >
                <CreditCard size={20} className="mb-1" />
                <span className="text-xs font-bold">Crédito</span>
              </button>
              
              <button 
                onClick={() => handlePaymentSelect(PaymentMethod.DEBIT)}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all active:scale-95"
              >
                <CreditCard size={20} className="mb-1" />
                <span className="text-xs font-bold">Débito</span>
              </button>

              <button 
                onClick={() => handlePaymentSelect(PaymentMethod.PIX)}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-teal-100 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:border-teal-300 transition-all active:scale-95"
              >
                <QrCode size={20} className="mb-1" />
                <span className="text-xs font-bold">Pix</span>
              </button>

              <button 
                onClick={() => handlePaymentSelect(PaymentMethod.CASH)}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-green-100 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 transition-all active:scale-95"
              >
                <Banknote size={20} className="mb-1" />
                <span className="text-xs font-bold">Dinheiro</span>
              </button>
           </div>
        </div>
      </div>
    </>
  );
};

export default CartSidebar;