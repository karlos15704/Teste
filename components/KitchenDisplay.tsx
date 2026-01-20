import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { Clock, CheckCircle2, ChefHat, PackageCheck, History, RotateCcw, Ban, AlertCircle } from 'lucide-react';

interface KitchenDisplayProps {
  transactions: Transaction[];
  onUpdateStatus: (id: string, status: 'pending' | 'done') => void;
}

type ViewMode = 'active' | 'history';

const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ transactions, onUpdateStatus }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Filter for active orders (PENDING in Kitchen)
  // Shows both 'completed' (new orders) and 'cancelled' (to alert kitchen)
  const pendingOrders = useMemo(() => {
    return transactions
      .filter(t => 
        t.kitchenStatus === 'pending' &&
        t.timestamp >= startOfDay.getTime()
      )
      .sort((a, b) => a.timestamp - b.timestamp); // FIFO: Oldest first
  }, [transactions]);

  // Filter for completed orders (DONE in Kitchen)
  const historyOrders = useMemo(() => {
    return transactions
      .filter(t => 
        t.kitchenStatus === 'done' &&
        t.timestamp >= startOfDay.getTime()
      )
      .sort((a, b) => b.timestamp - a.timestamp); // LIFO: Newest finished first
  }, [transactions]);

  // When clicking "PRONTO" or "CIENTE" (for cancelled), syncs to DB as 'done'
  const handleMarkAsDone = (id: string) => {
    onUpdateStatus(id, 'done');
  };

  // When clicking "VOLTAR", syncs to DB as 'pending'
  const handleReturnToPrep = (id: string) => {
    onUpdateStatus(id, 'pending');
  };

  const currentList = viewMode === 'active' ? pendingOrders : historyOrders;

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md flex flex-col md:flex-row justify-between items-center gap-4 z-10">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 hidden md:block">
             <ChefHat size={24} className="text-orange-500" />
          </div>
          <div>
             <h2 className="text-xl font-bold tracking-wide">COZINHA</h2>
             <p className="text-xs text-slate-400 hidden md:block">Sincronizado em Tempo Real</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700 w-full md:w-auto">
          <button
            onClick={() => setViewMode('active')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${
              viewMode === 'active' 
                ? 'bg-orange-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <PackageCheck size={18} />
            PENDENTES ({pendingOrders.length})
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${
              viewMode === 'history' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <History size={18} />
            PRONTOS ({historyOrders.length})
          </button>
        </div>

        <div className="hidden md:block text-right min-w-[120px]">
          <div className="text-2xl font-bold font-mono leading-none">
            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          <div className="text-xs text-slate-400">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </header>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
        {currentList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
             {viewMode === 'active' ? (
                <>
                  <ChefHat size={80} strokeWidth={1} className="mb-4" />
                  <p className="text-2xl font-light">Tudo limpo!</p>
                  <p className="text-sm">Sem pedidos pendentes no momento.</p>
                </>
             ) : (
                <>
                  <History size={80} strokeWidth={1} className="mb-4" />
                  <p className="text-2xl font-light">Sem histórico</p>
                  <p className="text-sm">Nenhum pedido foi concluído hoje ainda.</p>
                </>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
            {currentList.map((order) => {
               // Calculate elapsed time
               const timeDate = new Date(order.timestamp);
               const timeString = timeDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
               
               const isHistory = viewMode === 'history';
               const isCancelled = order.status === 'cancelled';

               // Determine styling based on state
               let borderColor = 'border-l-orange-500 border-gray-200';
               let headerBg = 'bg-orange-50 border-orange-100';
               let textColor = 'text-orange-600';
               
               if (isCancelled) {
                 borderColor = 'border-l-red-500 border-red-200 ring-2 ring-red-100';
                 headerBg = 'bg-red-100 border-red-200';
                 textColor = 'text-red-600';
               } else if (isHistory) {
                 borderColor = 'border-l-blue-400 border-gray-200 opacity-90';
                 headerBg = 'bg-blue-50 border-blue-100';
                 textColor = 'text-blue-600';
               }

               return (
                 <div key={order.id} className={`bg-white rounded-xl shadow-sm border-l-4 border-y border-r flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 relative ${borderColor}`}>
                    
                    {isCancelled && (
                      <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Ban size={80} className="text-red-500" />
                      </div>
                    )}

                    {/* Card Header */}
                    <div className={`p-3 border-b flex justify-between items-start ${headerBg}`}>
                       <div className="z-10">
                          {isCancelled ? (
                             <div className="flex items-center gap-1 mb-1">
                               <AlertCircle size={14} className="text-red-600" />
                               <span className="text-xs font-bold text-red-600 uppercase tracking-wider">CANCELADO</span>
                             </div>
                          ) : (
                             <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${textColor}`}>Senha</span>
                          )}
                          <span className={`text-4xl font-black leading-none ${isCancelled ? 'text-red-600 line-through decoration-4 decoration-red-400' : 'text-slate-800'}`}>
                            #{order.orderNumber}
                          </span>
                       </div>
                       <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-gray-100 shadow-sm z-10">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-sm font-bold text-gray-700">{timeString}</span>
                       </div>
                    </div>

                    {/* Items List */}
                    <div className="p-4 flex-1 overflow-y-auto max-h-[300px] z-10">
                       <ul className="space-y-3">
                          {order.items.map((item, idx) => (
                             <li key={`${order.id}-${idx}`} className="flex items-start gap-3">
                                <div className={`min-w-[24px] h-6 flex items-center justify-center font-bold text-sm rounded border 
                                  ${isCancelled ? 'bg-red-100 text-red-800 border-red-200' : 
                                    isHistory ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                                   {item.quantity}
                                </div>
                                <span className={`font-medium leading-tight pt-0.5 ${isHistory || isCancelled ? 'text-gray-500 line-through' : 'text-slate-700'}`}>
                                   {item.name}
                                </span>
                             </li>
                          ))}
                       </ul>
                    </div>

                    {/* Action Footer */}
                    <div className={`p-3 border-t ${isCancelled ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                       {isCancelled ? (
                         viewMode === 'active' ? (
                           <button 
                              onClick={() => handleMarkAsDone(order.id)}
                              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm animate-pulse"
                           >
                              <CheckCircle2 size={20} />
                              CIENTE
                           </button>
                         ) : (
                           <div className="w-full py-3 text-center font-bold text-red-400 bg-red-50 rounded-lg border border-red-100 flex items-center justify-center gap-2">
                             <Ban size={18} /> CANCELADO
                           </div>
                         )
                       ) : isHistory ? (
                         <button 
                            onClick={() => handleReturnToPrep(order.id)}
                            className="w-full bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 hover:border-orange-300 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm group"
                         >
                            <RotateCcw size={20} className="group-hover:-rotate-180 transition-transform duration-500" />
                            VOLTAR PARA PREPARO
                         </button>
                       ) : (
                         <button 
                            onClick={() => handleMarkAsDone(order.id)}
                            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                         >
                            <CheckCircle2 size={20} />
                            PRONTO
                         </button>
                       )}
                    </div>
                 </div>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;