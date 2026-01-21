import React, { useMemo, useState, useEffect } from 'react';
import { Transaction } from '../types';
import { ChefHat, CheckCircle2, Flame, Clock } from 'lucide-react';
import { MASCOT_URL, APP_NAME, SCHOOL_CLASS } from '../constants';

interface PublicDisplayProps {
  transactions: Transaction[];
}

const PublicDisplay: React.FC<PublicDisplayProps> = ({ transactions }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Pedidos em Preparo (Kitchen Status: Pending)
  const preparingOrders = useMemo(() => {
    return transactions
      .filter(t => t.kitchenStatus === 'pending' && t.status !== 'cancelled' && t.timestamp >= startOfDay.getTime())
      .sort((a, b) => a.timestamp - b.timestamp); // Mais antigos primeiro
  }, [transactions]);

  // Pedidos Prontos (Kitchen Status: Done) - Pegamos os últimos 10 para não lotar a tela
  const readyOrders = useMemo(() => {
    return transactions
      .filter(t => t.kitchenStatus === 'done' && t.status !== 'cancelled' && t.timestamp >= startOfDay.getTime())
      .sort((a, b) => b.timestamp - a.timestamp) // Mais recentes primeiro (topo da lista)
      .slice(0, 8);
  }, [transactions]);

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col overflow-hidden relative">
      
      {/* Background Decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/20 via-gray-900 to-gray-900 pointer-events-none"></div>

      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between z-10 h-24">
        
        {/* Esquerda: Status Ao Vivo */}
        <div className="flex-1 flex items-center justify-start">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
               <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
               <span className="text-white/80 font-mono font-bold text-lg tracking-wider">
                 AO VIVO
               </span>
            </div>
        </div>

        {/* Centro: Mascote e Nome */}
        <div className="flex-[2] flex items-center justify-center gap-4">
           <img 
             src={MASCOT_URL} 
             alt="Mascote" 
             className="h-20 w-20 object-contain animate-mascot-slow drop-shadow-[0_0_15px_rgba(234,88,12,0.3)]" 
           />
           <h1 className="text-5xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(234,88,12,0.5)]" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
             {APP_NAME}
           </h1>
        </div>

        {/* Direita: Relógio */}
        <div className="flex-1 flex items-center justify-end">
            <div className="text-right">
                <div className="text-4xl font-mono font-bold text-white leading-none tracking-widest tabular-nums">
                    {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="text-xs text-white/40 font-bold uppercase tracking-[0.2em] mt-1 mr-1">
                    {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', '')}
                </div>
            </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex w-full relative z-10">
        
        {/* COLUNA ESQUERDA: PREPARANDO (Amarelo/Laranja) */}
        <div className="w-1/2 border-r border-white/10 flex flex-col bg-gray-900/50">
           <div className="p-6 bg-gradient-to-r from-yellow-600/20 to-transparent border-b border-yellow-500/30 flex items-center gap-3">
              <ChefHat size={40} className="text-yellow-400" />
              <h2 className="text-3xl font-black text-yellow-400 tracking-wider uppercase">Preparando</h2>
           </div>
           
           <div className="flex-1 p-6 overflow-hidden">
             <div className="grid grid-cols-2 gap-4 content-start">
                {preparingOrders.map(order => (
                  <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center animate-in zoom-in duration-300">
                     <span className="text-yellow-100/60 text-xs font-bold uppercase tracking-widest mb-1">Senha</span>
                     <span className="text-5xl font-black text-yellow-400 tracking-tighter">#{order.orderNumber}</span>
                  </div>
                ))}
                {preparingOrders.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center py-20 opacity-30">
                     <ChefHat size={80} className="text-white mb-4" />
                     <p className="text-white text-xl">Aguardando pedidos...</p>
                  </div>
                )}
             </div>
           </div>
        </div>

        {/* COLUNA DIREITA: PRONTO (Verde/Fogo) */}
        <div className="w-1/2 flex flex-col relative overflow-hidden">
           {/* Efeito de Fogo no fundo da coluna de prontos */}
           <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 via-transparent to-transparent pointer-events-none"></div>
           
           <div className="p-6 bg-gradient-to-r from-green-600/20 to-transparent border-b border-green-500/30 flex items-center gap-3 relative z-10">
              <CheckCircle2 size={40} className="text-green-400" />
              <h2 className="text-3xl font-black text-green-400 tracking-wider uppercase">Pronto</h2>
           </div>

           <div className="flex-1 p-6 overflow-hidden relative z-10">
              <div className="flex flex-col gap-4">
                 {readyOrders.map((order, index) => {
                   // O primeiro item (mais recente) recebe destaque especial
                   const isNewest = index === 0;
                   
                   return (
                     <div 
                        key={order.id} 
                        className={`relative rounded-2xl flex items-center justify-between px-8 py-6 shadow-lg animate-in slide-in-from-right duration-500
                          ${isNewest 
                             ? 'bg-gradient-to-r from-green-600 to-green-500 border-2 border-white scale-105 z-10 shadow-green-500/50' 
                             : 'bg-white/10 border border-white/5'
                          }`}
                     >
                        {/* Fogo animado apenas no mais recente */}
                        {isNewest && (
                          <div className="absolute -left-4 -top-4 text-orange-400 animate-bounce">
                             <Flame size={40} fill="currentColor" />
                          </div>
                        )}

                        <div className="flex flex-col">
                           <span className={`text-xs font-bold uppercase tracking-widest mb-1 ${isNewest ? 'text-green-100' : 'text-gray-400'}`}>
                             {isNewest ? 'Saiu agora!' : 'Senha'}
                           </span>
                           <span className={`text-6xl font-black tracking-tighter ${isNewest ? 'text-white drop-shadow-md' : 'text-green-400'}`}>
                             #{order.orderNumber}
                           </span>
                        </div>
                        
                        {/* Nome do Cliente (Opcional, se tiver) ou ícone */}
                        <div className="opacity-50">
                           <CheckCircle2 size={isNewest ? 48 : 32} className={isNewest ? 'text-white' : 'text-green-500'} />
                        </div>
                     </div>
                   );
                 })}

                 {readyOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                       <CheckCircle2 size={80} className="text-white mb-4" />
                       <p className="text-white text-xl">Nenhum pedido pronto.</p>
                    </div>
                 )}
              </div>
           </div>
        </div>

      </div>
      
      {/* Footer / Marquee */}
      <div className="bg-black py-2 border-t border-white/10 overflow-hidden relative">
         <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] text-white/50 font-mono text-sm uppercase font-bold">
            Retire seu pedido no balcão • Apresente sua senha • Bom apetite! • Tô Frito! Fast Food • Feira Cultural Colégio Progresso Santista • {SCHOOL_CLASS} • 
            Retire seu pedido no balcão • Apresente sua senha • Bom apetite! • Tô Frito! Fast Food • Feira Cultural Colégio Progresso Santista • {SCHOOL_CLASS} •
         </div>
         <style>{`
            @keyframes marquee {
               0% { transform: translateX(100%); }
               100% { transform: translateX(-100%); }
            }
         `}</style>
      </div>
    </div>
  );
};

export default PublicDisplay;