import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS, APP_NAME, MASCOT_URL, STAFF_USERS as DEFAULT_STAFF } from './constants';
import { Product, CartItem, Transaction, PaymentMethod, User } from './types';
import { generateId, formatCurrency } from './utils';
import ProductGrid from './components/ProductGrid';
import CartSidebar from './components/CartSidebar';
import Reports from './components/Reports';
import KitchenDisplay from './components/KitchenDisplay';
import LoginScreen from './components/LoginScreen';
import UserManagement from './components/UserManagement';
import { supabase, fetchTransactions, createTransaction, updateTransactionStatus, updateKitchenStatus, subscribeToTransactions } from './services/supabase';
import { LayoutGrid, BarChart3, Flame, CheckCircle2, ChefHat, WifiOff, LogOut, UserCircle2, Users as UsersIcon, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  // Login & Users State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // View State
  const [currentView, setCurrentView] = useState<'pos' | 'reports' | 'kitchen' | 'users'>('pos');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Data State - Now managed via Supabase
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  
  const [nextOrderNumber, setNextOrderNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for Order Success Modal
  const [lastCompletedOrder, setLastCompletedOrder] = useState<{number: string, change?: number} | null>(null);

  // Logout Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load Initial Data (Users + Transactions)
  const loadData = async () => {
    // 0. Check for Active Session (Persistência de Login)
    const savedSession = localStorage.getItem('active_user');
    if (savedSession && !currentUser) {
      setCurrentUser(JSON.parse(savedSession));
    }

    // 1. Load Users from LocalStorage or Default
    const savedUsers = localStorage.getItem('app_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers(DEFAULT_STAFF);
      localStorage.setItem('app_users', JSON.stringify(DEFAULT_STAFF));
    }

    // 2. Load Transactions
    if (!supabase) {
      setIsConnected(false);
      setIsLoading(false);
      const saved = localStorage.getItem('pos_transactions');
      if (saved) setTransactions(JSON.parse(saved));
      return;
    }

    try {
      const data = await fetchTransactions();
      setTransactions(data);
      
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

    const subscription = subscribeToTransactions(() => {
      loadData();
    });

    // ATUALIZAÇÃO AUTOMÁTICA A CADA 3 SEGUNDOS
    // Isso garante que a tela da cozinha (e outras) recebam novos pedidos quase instantaneamente
    const intervalId = setInterval(() => {
      loadData();
    }, 3000);

    return () => {
      if (subscription) subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  // --- LOGIN ACTION (WRAPPER PARA SALVAR SESSÃO) ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Salva a sessão para não perder ao recarregar
    localStorage.setItem('active_user', JSON.stringify(user));
  };

  // --- USER MANAGEMENT ACTIONS ---
  const handleAddUser = (newUser: User) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
  };

  const handleUpdateUser = (updatedUser: User) => {
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    
    // Se o usuário editado for o atual, atualiza a sessão
    if (currentUser?.id === updatedUser.id) {
      const updatedSession = updatedUser;
      setCurrentUser(updatedSession);
      localStorage.setItem('active_user', JSON.stringify(updatedSession));
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
  };

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
      amountPaid,
      change,
      sellerName: currentUser?.name || 'Desconhecido',
      status: 'completed',
      kitchenStatus: 'pending'
    };

    setTransactions(prev => [...prev, newTransaction]);
    setLastCompletedOrder({ number: orderNumber, change });
    clearCart();
    setNextOrderNumber(prev => prev + 1);

    if (isConnected) {
      await createTransaction(newTransaction);
    } else {
      const current = JSON.parse(localStorage.getItem('pos_transactions') || '[]');
      localStorage.setItem('pos_transactions', JSON.stringify([...current, newTransaction]));
    }
  };

  const handleCancelTransaction = async (transactionId: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === transactionId ? { ...t, status: 'cancelled' as const } : t
    ));

    if (isConnected) {
      await updateTransactionStatus(transactionId, 'cancelled');
    }
  };

  const handleUpdateKitchenStatus = async (transactionId: string, status: 'pending' | 'done') => {
    setTransactions(prev => prev.map(t => 
      t.id === transactionId ? { ...t, kitchenStatus: status } : t
    ));

    if (isConnected) {
      await updateKitchenStatus(transactionId, status);
    }
  };

  const handleResetSystem = async () => {
    setTransactions([]);
    setNextOrderNumber(1);
    localStorage.removeItem('pos_transactions');
    alert("Para limpar o banco de dados online, faça isso via painel do Supabase.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]);
    setCurrentView('pos');
    setShowLogoutModal(false);
    // Remove sessão salva
    localStorage.removeItem('active_user');
  };

  const handleManualReload = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-orange-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600 mb-4"></div>
        <p className="text-gray-600 font-bold animate-pulse">Conectando ao sistema...</p>
      </div>
    );
  }

  // Se não estiver logado, mostra a tela de login (usando a lista dinâmica de usuários)
  if (!currentUser) {
    return <LoginScreen availableUsers={users} onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-orange-50 relative">
      
      {!isConnected && (
         <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-xs py-1 px-4 text-center z-50 flex justify-center items-center gap-2">
            <WifiOff size={14} />
            <span>MODO OFFLINE - Verifique sua conexão.</span>
         </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <LogOut className="text-red-500" size={24} />
              Sair do Caixa?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Você retornará para a tela de login. O carrinho atual será limpo.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowLogoutModal(false)} 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                SAIR
              </button>
            </div>
          </div>
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
      <nav className="w-20 bg-gray-900 flex flex-col items-center py-4 gap-6 z-30 shadow-xl border-r border-gray-800 pt-6">
        <div className="text-orange-500 p-2 bg-gray-800 rounded-full mb-2 border border-orange-600 shadow-lg shadow-orange-900/50 hover:rotate-12 transition-transform duration-500 hover:scale-110">
          <Flame size={24} fill="currentColor" className="text-orange-500 animate-pulse" />
        </div>
        
        <button 
          onClick={() => setCurrentView('pos')}
          className={`p-3 rounded-2xl transition-all duration-300 group relative ${currentView === 'pos' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`}
          title="Caixa / Pedidos"
        >
          <LayoutGrid size={24} className={`transition-transform duration-300 ${currentView === 'pos' ? '' : 'group-hover:rotate-3'}`} />
          {currentView === 'pos' && (
            <span className="absolute -right-1 -top-1 w-3 h-3 bg-white border-2 border-gray-900 rounded-full animate-bounce" />
          )}
        </button>

        <button 
          onClick={() => setCurrentView('kitchen')}
          className={`p-3 rounded-2xl transition-all duration-300 group relative ${currentView === 'kitchen' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`}
          title="Cozinha / Expedição"
        >
          <ChefHat size={24} className={`transition-transform duration-300 ${currentView === 'kitchen' ? '' : 'group-hover:rotate-6'}`} />
          {currentView === 'kitchen' && (
            <span className="absolute -right-1 -top-1 w-3 h-3 bg-white border-2 border-gray-900 rounded-full animate-bounce" />
            
          )}
        </button>

        <button 
          onClick={() => setCurrentView('reports')}
          className={`p-3 rounded-2xl transition-all duration-300 group relative ${currentView === 'reports' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`}
          title="Relatórios de Vendas"
        >
          <BarChart3 size={24} className={`transition-transform duration-300 ${currentView === 'reports' ? '' : 'group-hover:-rotate-3'}`} />
          {currentView === 'reports' && (
            <span className="absolute -right-1 -top-1 w-3 h-3 bg-white border-2 border-gray-900 rounded-full animate-bounce" />
          )}
        </button>

        {/* ADMIN ONLY: Users Management */}
        {currentUser.role === 'admin' && (
          <button 
            onClick={() => setCurrentView('users')}
            className={`p-3 rounded-2xl transition-all duration-300 group relative ${currentView === 'users' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`}
            title="Gerenciar Equipe"
          >
            <UsersIcon size={24} className={`transition-transform duration-300 ${currentView === 'users' ? '' : 'group-hover:rotate-6'}`} />
            {currentView === 'users' && (
              <span className="absolute -right-1 -top-1 w-3 h-3 bg-white border-2 border-gray-900 rounded-full animate-bounce" />
            )}
          </button>
        )}

        <div className="flex-1"></div>

        {/* Reload Button */}
        <button 
          onClick={handleManualReload}
          className="p-3 rounded-2xl text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-300 mb-2 hover:scale-110 active:scale-95 group"
          title="Recarregar Sistema"
        >
          <RefreshCw size={24} className="group-hover:animate-spin" />
        </button>

        {/* Logout Button */}
        <button 
          onClick={() => setShowLogoutModal(true)}
          className="p-3 rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 mb-4 hover:scale-110 active:scale-95"
          title="Sair / Logout"
        >
          <LogOut size={24} />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden pt-6 relative">
        {/* User Info Badge */}
        <div className="absolute top-4 right-6 z-40 bg-white/90 backdrop-blur border border-orange-200 px-4 py-1.5 rounded-full shadow-sm flex items-center gap-2">
           <UserCircle2 size={16} className="text-orange-600"/>
           <span className="text-xs font-bold text-gray-700 uppercase">{currentUser.name}</span>
        </div>

        {currentView === 'pos' && (
          <>
            <div className="flex-1 flex flex-col min-w-0">
              <header className="px-6 py-4 bg-white border-b border-orange-100 shadow-sm z-10 relative flex items-center justify-center min-h-[90px]">
                <div className="flex items-center gap-5 transition-transform hover:scale-105 duration-300">
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

        {/* View de Gerenciamento de Usuários */}
        {currentView === 'users' && currentUser.role === 'admin' && (
          <div className="w-full h-full bg-orange-50/50">
            <UserManagement 
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              currentUser={currentUser}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;