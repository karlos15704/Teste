import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { ChefHat, CheckCircle2, Flame, Clock, Sparkles } from 'lucide-react';
import { MASCOT_URL, APP_NAME, SCHOOL_CLASS } from '../constants';

interface PublicDisplayProps {
  transactions: Transaction[];
}

const PublicDisplay: React.FC<PublicDisplayProps> = ({ transactions }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Estado para controlar a animação de celebração (Pedido Pronto)
  const [celebratingOrder, setCelebratingOrder] = useState<Transaction | null>(null);
  const prevTopReadyIdRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Pedidos em Preparo
  const preparingOrders = useMemo(() => {
    return transactions
      .filter(t => t.kitchenStatus === 'pending' && t.status !== 'cancelled' && t.timestamp >= startOfDay.getTime())
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [transactions]);

  // Pedidos Prontos (Últimos 8)
  const readyOrders = useMemo(() => {
    return transactions
      .filter(t => t.kitchenStatus === 'done' && t.status !== 'cancelled' && t.timestamp >= startOfDay.getTime())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8);
  }, [transactions]);

  // --- FUNÇÃO DE ÁUDIO (Voz do Navegador) ---
  const playAudio = (orderNumber: string) => {
    if ('speechSynthesis' in window) {
      // Cancela falas anteriores para não encavalar
      window.speechSynthesis.cancel();
      
      const text = `Tá Fritoooo! Vem buscar a senha ${orderNumber}!`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR'; // Português Brasil
      utterance.rate = 1.1;     // Um pouco mais rápido para dar energia
      utterance.pitch = 1.1;    // Tom um pouco mais agudo/alegre
      utterance.volume = 1.0;   // Volume máximo
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // EFEITO 1: Detectar quando um pedido NOVO entra na lista de prontos
  useEffect(() => {
    if (readyOrders.length > 0) {
      const newestOrder = readyOrders[0];
      
      // Se o ID do pedido do topo mudou, significa que é um novo pedido pronto
      if (prevTopReadyIdRef.current !== newestOrder.id) {
         // Evita disparar na primeira renderização da página (se já tiver pedidos prontos antigos carregados ao abrir)
         if (prevTopReadyIdRef.current !== null) {
            setCelebratingOrder(newestOrder);
            playAudio(newestOrder.orderNumber); // Toca o som
         }
         // Atualiza a referência
         prevTopReadyIdRef.current = newestOrder.id;
      }
    }
  }, [readyOrders]);

  // EFEITO 2: Gerenciar o tempo de exibição (Separado para não ser cancelado por updates de dados)
  useEffect(() => {
    if (celebratingOrder) {
      const timer = setTimeout(() => {
        setCelebratingOrder(null);
      }, 10000); // 10 Segundos
      
      return () => clearTimeout(timer);
    }
  }, [celebratingOrder]);

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col overflow-hidden relative">
      
      {/* === OVERLAY DE CELEBRAÇÃO (PEDIDO PRONTO) === */}
      {celebratingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in zoom-in-50 duration-500">
           
           {/* Fundo de Fogo (Reaproveitando classes do index.html) */}
           <div className="absolute inset-0 opacity-40 overflow-hidden pointer-events-none">
              <div className="fire-container scale-150 origin-bottom">
                  <div className="flame-base"></div>
                  <div className="flame-body"></div>
                  <div className="flame-core"></div>
              </div>
           </div>

           <div className="relative z-10 flex flex-col items-center text-center p-6 animate-in slide-in-from-bottom-10 duration-700">
              
              {/* Mascote Pulando */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-orange-500 blur-3xl opacity-50 animate-pulse"></div>
                <img 
                  src={MASCOT_URL} 
                  className="w-56 h-56 object-contain relative z-10 animate-bounce drop-shadow-[0_0_30px_rgba(255,100,0,0.8)]" 
                  alt="Mascote Feliz"
                />
              </div>

              <h1 className="text-6xl md:text-7xl font-black text-white mb-4 drop-shadow-lg uppercase tracking-tighter">
                SAIU DO FORNO!
              </h1>

              {/* Número da Senha Gigante */}
              <div className="bg-gradient-to-tr from-orange-600 to-red-600 text-white px-12 py-4 rounded-3xl transform -rotate-3 mb-8 shadow-[0_0_50px_rgba(234,88,12,0.8)] border-4 border-yellow-400 animate-cta-bounce">
                <span className="text-9xl font-black tracking-tighter drop-shadow-md">#{celebratingOrder.orderNumber}</span>
              </div>

              {/* Frase Engraçada */}
              <p className="text-3xl text-yellow-300 font-black uppercase tracking-widest animate-pulse mb-8" style={{textShadow: '2px 2px 0px #000'}}>
                 🔥 TÁ PEGANDO FOGO, BICHO! 🔥
              </p>

              {/* Agradecimento da Turma */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-8 py-4 rounded-2xl transform rotate-1">
                 <p className="text-2xl text-white font-bold">
                   Retire seu pedido no balcão
                 </p>
                 <div className="flex items-center justify-center gap-2 mt-2">
                    <Sparkles className="text-yellow-400 animate-spin-in" size={24} />
                    <p className="text-4xl font-black text-orange-400 uppercase tracking-wide" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                      O {SCHOOL_CLASS} AGRADECE!
                    </p>
                    <Sparkles className="text-yellow-400 animate-spin-in" size={24} />
                 </div>
              </div>

           </div>
        </div>
      )}

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