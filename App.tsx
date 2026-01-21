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
import { 
  supabase, 
  fetchTransactions, 
  createTransaction, 
  updateTransactionStatus, 
  updateKitchenStatus, 
  subscribeToTransactions,
  fetchUsers, 
  createUser, 
  updateUser, 
  deleteUser
} from './services/supabase';
import { LayoutGrid, BarChart3, Flame, CheckCircle2, ChefHat, WifiOff, LogOut, UserCircle2, Users as UsersIcon, UploadCloud, ShoppingCart } from 'lucide-react';

const App: React.FC = () => {
  // Login & Users State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // View State
  const [currentView, setCurrentView] = useState<'pos' | 'reports' | 'kitchen' | 'users'>('pos');
  
  // Mobile UI States
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [nextOrderNumber, setNextOrderNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for Order Success Modal
  const [lastCompletedOrder, setLastCompletedOrder] = useState<{number: string, change?: number} | null>(null);

  // Logout Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // --- CARREGAMENTO DE DADOS BLINDADO ---
  const loadData = async () => {
    // 0. Check for Active Session
    const savedSession = localStorage.getItem('active_user');
    if (savedSession && !currentUser) {
      const user = JSON.parse(savedSession);
      setCurrentUser(user);
      
      if (user.role === 'kitchen') {
        setCurrentView('kitchen');
      } else if (user.role === 'staff') {
        setCurrentView('pos');
      }
    }

    // --- CARREGAR USUÁRIOS (AGORA DO SUPABASE) ---
    try {
      const dbUsers = await fetchUsers();
      if (dbUsers && dbUsers.length > 0) {
        setUsers(dbUsers);
        // Backup local caso fique offline depois
        localStorage.setItem('app_users', JSON.stringify(dbUsers));
      } else if (dbUsers && dbUsers.length === 0) {
        // Se conectou mas o banco está vazio, popula com o padrão
        console.log("Banco de usuários vazio. Inicializando com padrão...");
        setUsers(DEFAULT_STAFF);
        DEFAULT_STAFF.forEach(u => createUser(u)); // Envia para o banco
      } else {
        // Fallback offline
        const savedUsers = localStorage.getItem('app_users');
        if (savedUsers) {
          setUsers(JSON.parse(savedUsers));
        } else {
          setUsers(DEFAULT_STAFF);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar usuários:", e);
      // Fallback
      setUsers(DEFAULT_STAFF);
    }

    // --- CARREGAR VENDAS ---
    if (!supabase) {
      setIsConnected(false);
      setIsLoading(false);
      const saved = localStorage.getItem('pos_transactions');
      if (saved) setTransactions(JSON.parse(saved));
      return;
    }

    try {
      const data = await fetchTransactions();
      
      if (data === null) {
        // Falha na conexão: Mantém dados locais
        console.log("Modo Offline (API retornou null)");
        setIsConnected(false);
        const saved = localStorage.getItem('pos_transactions');
        if (saved) {
           const local = JSON.parse(saved);
           setTransactions(prev => prev.length > local.length ? prev : local);
        }
      } else {
        // Conexão OK
        setIsConnected(true);
        
        const localDataString = localStorage.getItem('pos_transactions');
        const localData: Transaction[] = localDataString ? JSON.parse(localDataString) : [];

        // LÓGICA DE RESTAURAÇÃO:
        if (data.length === 0 && localData.length > 0) {
           console.log("Detectado reset do banco. Preservando dados locais e iniciando restauração...");
           setTransactions(localData);
           setIsSyncing(true);
           
           Promise.all(localData.map(t => createTransaction(t)))
             .then(() => {
               console.log("Restauração completa!");
               setIsSyncing(false);
             })
             .catch(err => {
               console.error("Erro na restauração:", err);
               setIsSyncing(false);
             });

        } else {
           setTransactions(data);
           localStorage.setItem('pos_transactions', JSON.stringify(data));
        }
        
        // Calcular próximo número de pedido
        const currentData = data.length > 0 ? data : localData;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todaysOrders = currentData.filter(t => t.timestamp >= startOfDay.getTime());
        const maxOrder = todaysOrders.length > 0 
          ? Math.max(...todaysOrders.map(t => parseInt(t.orderNumber) || 0))
          : 0;
        setNextOrderNumber(maxOrder + 1);
      }
    } catch (error) {
      console.error("Erro fatal no loadData:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // EFEITO 1: INICIALIZAÇÃO E REALTIME (Sempre ativo)
  useEffect(() => {
    loadData();

    const subscription = subscribeToTransactions(() => {
      // Se estiver na tela de users, evitamos recarregar para não atrapalhar a edição
      // Mas como isso vem do servidor, pode ser importante.
      // Vou manter o loadData aqui, mas o refresh agressivo de 1s será controlado abaixo.
      loadData();
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // EFEITO 2: ATUALIZAÇÃO AUTOMÁTICA (POLLING) - Controlado pela View
  useEffect(() => {
    // PAUSA a atualização se estiver na tela de EQUIPE (users)
    // Isso evita "pulos" na tela ou perda de foco nos inputs
    if (currentView === 'users') {
      return; 
    }

    // Caso contrário, atualiza a cada 1 segundo (Padrão para Cozinha/PDV)
    const intervalId = setInterval(() => {
      loadData();
    }, 1000); 

    return () => {
      clearInterval(intervalId);
    };
  }, [currentView]); // Dependência: Recria o timer quando muda a tela

  // --- ACTIONS ---

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('active_user', JSON.stringify(user));
    
    if (user.role === 'kitchen') {
      setCurrentView('kitchen');
    } else {
      setCurrentView('pos');
    }
  };

  const handleAddUser = async (newUser: User) => {
    // 1. Atualiza UI imediatamente
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    
    // 2. Envia para o banco
    if (isConnected) {
      await createUser(newUser);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    // 1. Atualiza UI imediatamente
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    
    // Atualiza sessão se for o próprio usuário
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('active_user', JSON.stringify(updatedUser));
    }

    // 2. Envia para o banco
    if (isConnected) {
      await updateUser(updatedUser);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // 1. Atualiza UI imediatamente
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    
    // 2. Remove do banco
    if (isConnected) {
      await deleteUser(userId);
    }
  };

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
    try {
      const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const total = Math.max(0, subtotal - discount);
      
      const safeOrderNumber = (nextOrderNumber || 1).toString();
      const id = generateId();

      const newTransaction: Transaction = {
        id,
        orderNumber: safeOrderNumber,
        timestamp: Date.now(),
        items: [...cart],
        subtotal,
        discount,
        total,
        paymentMethod: method,
        amountPaid,
        change,
        sellerName: currentUser?.name || 'Caixa',
        status: 'completed',
        kitchenStatus: 'pending'
      };

      // 1. ATUALIZAÇÃO IMEDIATA
      const updatedTransactions = [...transactions, newTransaction];
      setTransactions(updatedTransactions);
      localStorage.setItem('pos_transactions', JSON.stringify(updatedTransactions));
      
      setLastCompletedOrder({ number: safeOrderNumber, change });
      clearCart();
      setIsMobileCartOpen(false); // Fecha o carrinho mobile se estiver aberto
      setNextOrderNumber(prev => (prev || 1) + 1);

      // 2. SINCRONIZAÇÃO EM SEGUNDO PLANO
      if (isConnected) {
        const success = await createTransaction(newTransaction);
        if (!success) {
           console.log("Venda salva localmente (falha no envio online)");
           setIsConnected(false); 
        }
      }
    } catch (error) {
      console.error("Erro crítico no checkout:", error);
      alert("Erro ao processar venda. Tente novamente.");
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
    alert("Para limpar o banco de dados online, utilize o painel do Supabase.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]);
    setCurrentView('pos');
    setShowLogoutModal(false);
    localStorage.removeItem('active_user');
  };

  // Helper for mobile cart
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-orange-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600 mb-4"></div>
        <p className="text-gray-600 font-bold animate-pulse">Iniciando sistema...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen availableUsers={users} onLogin={handleLogin} />;
  }

  const isKitchenUser = currentUser.role === 'kitchen';
  const isCashierUser = currentUser.role === 'staff';
  const isAdminUser = currentUser.role === 'admin';

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-orange-50 relative">
      
      {/* STATUS BAR */}
      <div className="absolute top-0 left-0 w-full z-50 flex justify-center pointer-events-none">
        {!isConnected && (
           <div className="bg-red-600 text-white text-xs py-1 px-4 rounded-b-lg shadow-md flex items-center gap-2 pointer-events-auto">
              <WifiOff size={14} />
              <span>OFFLINE</span>
           </div>
        )}
        {isConnected && isSyncing && (
           <div className="bg-blue-600 text-white text-xs py-1 px-4 rounded-b-lg shadow-md flex items-center gap-2 pointer-events-auto animate-pulse">
              <UploadCloud size={14} />
              <span>Sincronizando...</span>
           </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <LogOut className="text-red-500" size={24} />
              Sair do Sistema?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Você retornará para a tela de login.
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
      {lastCompletedOrder && !isKitchenUser && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex justify-center">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle2 size={48} className="text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pedido Confirmado!</h2>
            <p className="text-gray-500 mb-6">Entregue a senha abaixo ao cliente.</p>
            
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

      {/* SIDEBAR NAVIGATION (DESKTOP) */}
      <nav className="hidden md:flex w-20 bg-gray-900 flex-col items-center py-4 gap-6 z-30 shadow-xl border-r border-gray-800 pt-6">
        <div className="text-orange-500 p-2 bg-gray-800 rounded-full mb-2 border border-orange-600 shadow-lg shadow-orange-900/50 hover:rotate-12 transition-transform duration-500 hover:scale-110">
          <Flame size={24} fill="currentColor" className="text-orange-500 animate-pulse" />
        </div>
        
        {(isAdminUser || isCashierUser) && (
          <button 
            onClick={() => setCurrentView('pos')}
            className={`p-3 rounded-2xl transition-all duration-300 group relative ${currentView === 'pos' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`}
            title="Caixa / Pedidos"
          >
            <LayoutGrid size={24} className={`transition-transform duration-300 ${currentView === 'pos' ? '' : 'group-hover:rotate-3'}`} />
            {currentView === 'pos' && <span className="absolute -right-1 -top-1 w-3 h-3 bg-white border-2 border-gray-900 rounded-full animate-bounce" />}
          </button>
        )}

        {(isAdminUser || isKitchenUser) && (
          <button 
            onClick={() => setCurrentView('kitchen')}
            className={`p-3 rounded-2xl transition-all duration-300 group relative ${currentView === 'kitchen' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`}
            title="Cozinha"
          >
            <ChefHat size={24} className={`transition-transform duration-300 ${currentView === 'kitchen' ? '' : 'group-hover:rotate-6'}`} />
            {currentView === 'kitchen' && <span className="absolute -right-1 -top-1 w-3 h-3 bg-white border-2 border-gray-900 rounded-full animate-bounce" />}
          </button>
        )}

        {isAdminUser && (
          <button 
            onClick={() => setCurrentView('reports')}
            className={`p-3 rounded-2xl transition-all duration-300 group relative ${currentView === 'reports' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`}
            title="Relatórios"
          >
            <BarChart3 size={24} className={`transition-transform duration-300 ${currentView === 'reports' ? '' : 'group-hover:-rotate-3'}`} />
            {currentView === 'reports' && <span className="absolute -right-1 -top-1 w-3 h-3 bg-white border-2 border-gray-900 rounded-full animate-bounce" />}
          </button>
        )}

        {/* AGORA TODOS PODEM VER O BOTÃO EQUIPE */}
        <button 
          onClick={() => setCurrentView('users')}
          className={`p-3 rounded-2xl transition-all duration-300 group relative ${currentView === 'users' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-110'}`}
          title="Equipe"
        >
          <UsersIcon size={24} className={`transition-transform duration-300 ${currentView === 'users' ? '' : 'group-hover:rotate-6'}`} />
          {currentView === 'users' && <span className="absolute -right-1 -top-1 w-3 h-3 bg-white border-2 border-gray-900 rounded-full animate-bounce" />}
        </button>

        <div className="flex-1"></div>

        <button 
          onClick={() => setShowLogoutModal(true)}
          className="p-3 rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 mb-4 hover:scale-110 active:scale-95"
          title="Sair"
        >
          <LogOut size={24} />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-16 md:pb-0">
        {/* User Info Badge (Desktop) / Header (Mobile) */}
        <div className="md:absolute md:top-4 md:right-6 z-40 bg-white/90 backdrop-blur border-b md:border border-orange-200 px-4 py-3 md:py-1.5 md:rounded-full shadow-sm flex items-center justify-between md:justify-start gap-2 w-full md:w-auto">
           <div className="flex items-center gap-2">
              <UserCircle2 size={16} className="text-orange-600"/>
              <span className="text-xs font-bold text-gray-700 uppercase">{currentUser.name}</span>
              {isKitchenUser && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-bold">COZINHA</span>}
              {isCashierUser && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded font-bold">CAIXA</span>}
           </div>
           
           {/* Mobile Logout (Header) */}
           <button onClick={() => setShowLogoutModal(true)} className="md:hidden text-gray-400">
             <LogOut size={18} />
           </button>
        </div>

        {/* PDV / POS View */}
        {currentView === 'pos' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
            <div className="flex-1 flex flex-col min-w-0">
              <header className="px-6 py-2 md:py-4 bg-white border-b border-orange-100 shadow-sm z-10 relative flex items-center justify-center min-h-[70px] md:min-h-[90px]">
                <div className="flex items-center gap-3 md:gap-5 transition-transform hover:scale-105 duration-300">
                   <img 
                      src={MASCOT_URL} 
                      className="w-12 h-12 md:w-20 md:h-20 object-contain mix-blend-multiply animate-mascot-slow drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)]" 
                      alt="Mascote" 
                      loading="eager"
                      fetchPriority="high"
                    />
                   <h1 className="text-3xl md:text-5xl font-black text-fire uppercase tracking-tighter transform -skew-x-6 drop-shadow-sm" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
                     {APP_NAME}
                   </h1>
                </div>
              </header>
              <div className="flex-1 overflow-hidden relative">
                <ProductGrid 
                  products={MOCK_PRODUCTS} 
                  cart={cart} 
                  onAddToCart={addToCart} 
                  onRemoveFromCart={removeFromCart}
                />
              </div>
            </div>
            
            {/* Sidebar / Cart */}
            <div className={`
              fixed inset-y-0 right-0 z-50 w-full md:relative md:w-96 transform transition-transform duration-300 ease-in-out md:transform-none shadow-2xl md:shadow-none
              ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
               <CartSidebar 
                  cart={cart}
                  onRemoveItem={removeFromCart}
                  onUpdateQuantity={updateCartQuantity}
                  onClearCart={clearCart}
                  onCheckout={handleCheckout}
                  onClose={() => setIsMobileCartOpen(false)}
               />
            </div>
          </div>
        )}

        {/* Reports View */}
        {currentView === 'reports' && (
          <Reports 
            transactions={transactions} 
            onCancelTransaction={handleCancelTransaction}
            onResetSystem={handleResetSystem}
          />
        )}

        {/* Kitchen View */}
        {currentView === 'kitchen' && (
          <KitchenDisplay 
            transactions={transactions} 
            onUpdateStatus={handleUpdateKitchenStatus} 
          />
        )}

        {/* User Management View */}
        {currentView === 'users' && (
          <UserManagement
            users={users}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            currentUser={currentUser}
          />
        )}

        {/* Mobile Cart Toggle Button - Moved Up */}
        {currentView === 'pos' && !isMobileCartOpen && (
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="md:hidden fixed bottom-20 right-6 bg-orange-600 text-white p-4 rounded-full shadow-lg shadow-orange-600/40 z-50 animate-bounce"
          >
            <div className="relative">
              <ShoppingCart size={24} />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-orange-100">
                  {cartItemCount}
                </span>
              )}
            </div>
          </button>
        )}

        {/* MOBILE NAVIGATION BAR (BOTTOM) */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-orange-100 z-40 flex justify-around items-center h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-pb">
          
          {/* 1. POS / Vendas */}
          {(isAdminUser || isCashierUser) && (
            <button 
              onClick={() => setCurrentView('pos')}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === 'pos' ? 'text-orange-600 bg-orange-50/50' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid size={22} className={currentView === 'pos' ? 'fill-current' : ''} />
              <span className="text-[10px] font-bold uppercase">Vendas</span>
            </button>
          )}

          {/* 2. Cozinha */}
          {(isAdminUser || isKitchenUser) && (
            <button 
              onClick={() => setCurrentView('kitchen')}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === 'kitchen' ? 'text-orange-600 bg-orange-50/50' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ChefHat size={22} className={currentView === 'kitchen' ? 'fill-current' : ''} />
              <span className="text-[10px] font-bold uppercase">Cozinha</span>
            </button>
          )}

          {/* 3. Relatórios */}
          {isAdminUser && (
            <button 
              onClick={() => setCurrentView('reports')}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === 'reports' ? 'text-orange-600 bg-orange-50/50' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <BarChart3 size={22} className={currentView === 'reports' ? 'fill-current' : ''} />
              <span className="text-[10px] font-bold uppercase">Gestão</span>
            </button>
          )}

          {/* 4. Equipe */}
          <button 
            onClick={() => setCurrentView('users')}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === 'users' ? 'text-orange-600 bg-orange-50/50' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <UsersIcon size={22} className={currentView === 'users' ? 'fill-current' : ''} />
            <span className="text-[10px] font-bold uppercase">Equipe</span>
          </button>
        </div>

      </main>
    </div>
  );
};

export default App;