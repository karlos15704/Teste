import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS, APP_NAME, MASCOT_URL } from './constants';
import { Product, CartItem, Transaction, PaymentMethod } from './types';
import { generateId, formatCurrency } from './utils';
import ProductGrid from './components/ProductGrid';
import CartSidebar from './components/CartSidebar';
import Reports from './components/Reports';
import KitchenDisplay from './components/KitchenDisplay';
import { supabase, fetchTransactions, createTransaction, updateTransactionStatus, updateKitchenStatus, subscribeToTransactions } from './services/supabase';
import { LayoutGrid, BarChart3, Flame, CheckCircle2, ChefHat, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'pos' | 'reports' | 'kitchen'>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Data State - Now managed via Supabase
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  
  const [nextOrderNumber, setNextOrderNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for Order Success Modal
  const [lastCompletedOrder, setLastCompletedOrder] = useState<{number: string, change?: number} | null>(null);

  // Load Initial Data from Supabase
  const loadData = async () => {
    if (!supabase) {
      setIsConnected(false);
      setIsLoading(false);
      // Fallback to localstorage if no DB configured yet
      const saved = localStorage.getItem('pos_transactions');
      if (saved) setTransactions(JSON.parse(saved));
      return;
    }

    try {
      const data = await fetchTransactions();
      setTransactions(data);
      
      // Calculate next order number based on today's data
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todaysOrders = data.filter(t => t.timestamp >= startOfDay.getTime());
      const maxOrder = todaysOrders.length > 0 
        ? Math.max(...todaysOrders.map(t => parseInt(t.orderNumber) || 0))
        : 0;
      setNextOrderNumber(maxOrder + 1);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to Realtime Changes
    const subscription = subscribeToTransactions(() => {
      // Reload data when any change happens in the DB (new order, kitchen update, etc)
      loadData();
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // --- CART ACTIONS ---

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const handleCheckout = async (discount: number, method: PaymentMethod, change?: number, amountPaid?: number) => {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const total = Math.max(0, subtotal - discount);
    
    const orderNumber = nextOrderNumber.toString();
    const id = generateId();

    const newTransaction: Transaction = {
      id,
      orderNumber,
      timestamp: Date.now(),
      items: [...cart],
      subtotal,
      discount,
      total,
      paymentMethod: method,
      change,
      amountPaid,
      status: 'completed',
      kitchenStatus: 'pending' // Default status for kitchen
    };

    // Optimistic Update (update UI immediately)
    setTransactions(prev => [...prev, newTransaction]);
    setLastCompletedOrder({ number: orderNumber, change });
    clearCart();
    setNextOrderNumber(prev => prev + 1);

    // Send to DB
    if (isConnected) {
      await createTransaction(newTransaction);
    } else {
      // Fallback for demo/offline
      const current = JSON.parse(localStorage.getItem('pos_transactions') || '[]');
      localStorage.setItem('pos_transactions', JSON.stringify([...current, newTransaction]));
    }
  };

  const handleCancelTransaction = async (transactionId: string) => {
    // Optimistic update
    setTransactions(prev => prev.map(t => 
      t.id === transactionId ? { ...t, status: 'cancelled' as const } : t
    ));

    if (isConnected) {
      await updateTransactionStatus(transactionId, 'cancelled');
    }
  };

  const handleUpdateKitchenStatus = async (transactionId: string, status: 'pending' | 'done') => {
    // Optimistic update
    setTransactions(prev => prev.map(t => 
      t.id === transactionId ? { ...t, kitchenStatus: status } : t
    ));

    if (isConnected) {
      await updateKitchenStatus(transactionId, status);
    }
  };

  const handleResetSystem = async () => {
    // Note: In a real DB scenario, we might strictly delete rows or just archive them.
    // For this prototype, we just clear local state.
    // To implement DB wipe, we'd need a delete function in services/supabase.ts
    setTransactions([]);
    setNextOrderNumber(1);
    localStorage.removeItem('pos_transactions');
    alert("Para limpar o banco de dados online, faça isso via painel do Supabase.");
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-orange-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600 mb-4"></div>
        <p className="text-gray-600 font-bold animate-pulse">Conectando ao sistema...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-orange-50 relative">
      
      {!isConnected && (
         <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-xs py-1 px-4 text-center z-50 flex justify-center items-center gap-2">
            <WifiOff size={14} />
            <span>MODO OFFLINE - Configure o arquivo <b>services/supabase.ts</b> para sincronizar em tempo real.</span>
         </div>
      )}

      {/* Success Modal */}
      {lastCompletedOrder && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex justify-center">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle2 size={48} className="text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pedido Confirmado!</h2>
            <p className="text-gray-500 mb-6">Entrege a senha abaixo ao cliente.</p>
            
            <div className="bg-orange-100 border-2 border-orange-200 border-dashed rounded-xl p-6 mb-8">
              <span className="text-sm text-orange-600 font-bold uppercase tracking-wider block mb-1">SENHA</span>
              <span className="text-6xl font-black text-orange-600 tracking-tighter">
                {lastCompletedOrder.number}
              </span>
            </div>

            {/* Change Display for Cash Payments */}
            {lastCompletedOrder.change !== undefined && lastCompletedOrder.change > 0 && (
              <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-xl">
                 <span className="text-xs text-green-700 font-bold uppercase block">Troco a Devolver</span>
                 <span className="text-3xl font-black text-green-700">{formatCurrency(lastCompletedOrder.change)}</span>
              </div>
            )}

            <button 
              onClick={() => setLastCompletedOrder(null)}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-colors duration-300 animate-cta-bounce active:scale-95 active:animate-none"
            >
              Nova Venda
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <nav className="w-16 bg-gray-900 flex flex-col items-center py-4 gap-6 z-30 shadow-xl border-r border-gray-800 pt-6">
        <div className="text-orange-500 p-2 bg-gray-800 rounded-full mb-2 border border-orange-600 shadow-lg shadow-orange-900/50 hover:rotate-12 transition-transform duration-500 hover:scale-110">
          <Flame size={20} fill="currentColor" className="text-orange-500 animate-pulse" />
        </div>
        
        <button 
          onClick={() => setCurrentView('pos')}
          className={`p-2.5 rounded-xl transition-all duration-300 group relative ${currentView === 'pos' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`}
          title="Caixa / Pedidos"
        >
          <LayoutGrid size={20} className={`transition-transform duration-300 ${currentView === 'pos' ? '' : 'group-hover:rotate-3'}`} />
          {/* Active Dot */}
          {currentView === 'pos' && (
            <span className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-white border-2 border-gray-900 rounded-full animate-bounce" />
          )}
        </button>

        <button 
          onClick={() => setCurrentView('kitchen')}
          className={`p-2.5 rounded-xl transition-all duration-300 group relative ${currentView === 'kitchen' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`}
          title="Cozinha / Expedição"
        >
          <ChefHat size={20} className={`transition-transform duration-300 ${currentView === 'kitchen' ? '' : 'group-hover:rotate-6'}`} />
          {currentView === 'kitchen' && (
            <span className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-white border-2 border-gray-900 rounded-full animate-bounce" />
            
          )}
        </button>

        <button 
          onClick={() => setCurrentView('reports')}
          className={`p-2.5 rounded-xl transition-all duration-300 group relative ${currentView === 'reports' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`}
          title="Relatórios de Vendas"
        >
          <BarChart3 size={20} className={`transition-transform duration-300 ${currentView === 'reports' ? '' : 'group-hover:-rotate-3'}`} />
          {currentView === 'reports' && (
            <span className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-white border-2 border-gray-900 rounded-full animate-bounce" />
          )}
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden pt-6">
        {currentView === 'pos' && (
          <>
            {/* Left: Product Grid */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header Centered */}
              <header className="px-6 py-4 bg-white border-b border-orange-100 shadow-sm z-10 relative flex items-center justify-center min-h-[90px]">
                
                {/* Logo and Name Centered */}
                <div className="flex items-center gap-5 transition-transform hover:scale-105 duration-300">
                   {/* Optimized Image Loading: eager loading and fetchPriority */}
                   <img 
                      src={MASCOT_URL} 
                      className="w-20 h-20 object-contain mix-blend-multiply animate-mascot-slow" 
                      alt="Mascote" 
                      loading="eager"
                      fetchPriority="high"
                    />
                   <h1 className="text-5xl font-black text-fire uppercase tracking-tighter transform -skew-x-6 drop-shadow-sm" style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.8)' }}>
                     {APP_NAME}
                   </h1>
                </div>

              </header>
              <div className="flex-1 overflow-hidden relative">
                <ProductGrid products={MOCK_PRODUCTS} onAddToCart={addToCart} />
              </div>
            </div>

            {/* Right: Cart Sidebar */}
            <div className="w-96 min-w-[350px] h-full shadow-2xl z-20">
              <CartSidebar 
                cart={cart}
                onRemoveItem={removeFromCart}
                onUpdateQuantity={updateCartQuantity}
                onClearCart={clearCart}
                onCheckout={handleCheckout}
              />
            </div>
          </>
        )}

        {currentView === 'kitchen' && (
          <div className="w-full h-full bg-slate-100">
            <KitchenDisplay 
              transactions={transactions} 
              onUpdateStatus={handleUpdateKitchenStatus}
            />
          </div>
        )}

        {currentView === 'reports' && (
          <div className="w-full h-full bg-orange-50/50">
            <Reports 
              key={transactions.length}
              transactions={transactions} 
              onCancelTransaction={handleCancelTransaction}
              onResetSystem={handleResetSystem}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;