import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { ChefHat, CheckCircle2, Flame, Sparkles, Clock } from 'lucide-react';
import { MASCOT_URL, APP_NAME, SCHOOL_CLASS } from '../constants';

interface PublicDisplayProps {
  transactions: Transaction[];
}

// Som de Campainha de Atendimento (Ding suave)
const BELL_SOUND_URL = "https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3";

const PublicDisplay: React.FC<PublicDisplayProps> = ({ transactions }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Estado para controlar a animação de celebração (Pedido Atualmente na Tela)
  const [celebratingOrder, setCelebratingOrder] = useState<Transaction | null>(null);
  
  // FILA DE CELEBRAÇÃO: Armazena pedidos que precisam ser mostrados
  const [celebrationQueue, setCelebrationQueue] = useState<Transaction[]>([]);
  
  // Histórico de IDs processados para não repetir o mesmo pedido
  const processedOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef<boolean>(true);

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

  // Pedidos Prontos (Limitado aos últimos 5 para ficarem GRANDES na TV)
  const readyOrders = useMemo(() => {
    return transactions
      .filter(t => t.kitchenStatus === 'done' && t.status !== 'cancelled' && t.timestamp >= startOfDay.getTime())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6);
  }, [transactions]);

  // --- FUNÇÃO DE ÁUDIO MELHORADA ---
  const playAudio = (orderNumber: string) => {
    const audio = new Audio(BELL_SOUND_URL);
    audio.volume = 0.6;
    audio.play().catch(e => console.error("Erro ao tocar campainha:", e));

    setTimeout(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const text = `Pedido pronto. Senha ${orderNumber}.`;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.volume = 1.0; 
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            
            const voices = window.speechSynthesis.getVoices();
            const bestVoice = voices.find(v => 
                (v.name.includes('Google') && v.lang.includes('pt-BR')) ||
                (v.name.includes('Luciana') && v.lang.includes('pt-BR')) ||
                v.lang === 'pt-BR'
            );

            if (bestVoice) {
                utterance.voice = bestVoice;
            }
            window.speechSynthesis.speak(utterance);
        }
    }, 800);
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
    }
  }, []);

  // === LÓGICA DE DETECÇÃO DE NOVOS PEDIDOS ===
  useEffect(() => {
    if (isFirstLoadRef.current) {
        if (readyOrders.length > 0) {
            readyOrders.forEach(t => processedOrderIdsRef.current.add(t.id));
        }
        isFirstLoadRef.current = false;
        return;
    }

    const currentReadyIds = new Set(readyOrders.map(t => t.id));
    processedOrderIdsRef.current.forEach(id => {
        if (!currentReadyIds.has(id)) {
            processedOrderIdsRef.current.delete(id);
        }
    });

    const newItems = readyOrders.filter(t => !processedOrderIdsRef.current.has(t.id));
    
    if (newItems.length > 0) {
        newItems.forEach(t => processedOrderIdsRef.current.add(t.id));
        const sortedNewItems = [...newItems].sort((a, b) => a.timestamp - b.timestamp);
        setCelebrationQueue(prevQueue => [...prevQueue, ...sortedNewItems]);
    }
  }, [readyOrders]);

  // === LÓGICA DE PROCESSAMENTO DA FILA ===
  useEffect(() => {
    if (!celebratingOrder && celebrationQueue.length > 0) {
        const nextOrder = celebrationQueue[0];
        setCelebratingOrder(nextOrder);
        playAudio(nextOrder.orderNumber);
        setCelebrationQueue(prev => prev.slice(1));
    }
  }, [celebratingOrder, celebrationQueue]);

  useEffect(() => {
    if (celebratingOrder) {
      const timer = setTimeout(() => {
        setCelebratingOrder(null);
      }, 8000); // 8 segundos para ser mais dinâmico na TV
      return () => clearTimeout(timer);
    }
  }, [celebratingOrder]);

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden relative font-sans text-white">
      
      {/* === OVERLAY DE CELEBRAÇÃO GIGANTE PARA TV === */}
      {celebratingOrder && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-in zoom-in-90 duration-300">
           
           {/* Fundo de Fogo */}
           <div className="absolute inset-0 opacity-60 overflow-hidden pointer-events-none">
              <div className="fire-container scale-[2] origin-bottom">
                  <div className="flame-base"></div>
                  <div className="flame-body"></div>
                  <div className="flame-core"></div>
              </div>
           </div>

           <div className="relative z-10 flex flex-col items-center text-center p-4 w-full">
              <h1 className="text-[8vw] leading-none font-black text-white mb-8 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] uppercase tracking-tighter animate-pulse">
                SAIU DO FORNO!
              </h1>

              {/* Box da Senha */}
              <div className="bg-gradient-to-br from-orange-600 to-red-600 px-20 py-8 rounded-[3rem] shadow-[0_0_100px_rgba(234,88,12,0.8)] border-[6px] border-yellow-400 animate-cta-bounce transform rotate-[-2deg]">
                 <span className="block text-4xl text-yellow-200 font-bold uppercase tracking-[0.5em] mb-2">SENHA</span>
                 <span className="block text-[15vw] leading-none font-black text-white drop-shadow-xl">
                    #{celebratingOrder.orderNumber}
                 </span>
              </div>

              <div className="mt-12 flex items-center gap-4 animate-in slide-in-from-bottom-20 duration-1000">
                 <img src={MASCOT_URL} className="h-32 w-32 object-contain animate-bounce" alt="Mascote" />
                 <p className="text-4xl text-white font-bold bg-white/10 px-6 py-3 rounded-full border border-white/20">
                    Retire no balcão agora!
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* HEADER COMPACTO PARA TV */}
      <header className="h-[10vh] bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8 z-10 relative shadow-xl">
        <div className="flex items-center gap-6">
           <img src={MASCOT_URL} alt="Logo" className="h-16 w-16 object-contain drop-shadow-[0_0_10px_rgba(255,165,0,0.5)]" />
           <div>
              <h1 className="text-4xl font-black tracking-tighter text-white uppercase" style={{ textShadow: '2px 2px 0 #ea580c' }}>{APP_NAME}</h1>
              <p className="text-gray-400 text-sm font-bold tracking-widest uppercase">Sistema de Pedidos {SCHOOL_CLASS}</p>
           </div>
        </div>

        <div className="text-right">
            <div className="text-5xl font-mono font-black text-white leading-none tracking-wider">
                {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
        </div>
      </header>

      {/* MAIN CONTENT - SPLIT 50/50 */}
      <div className="flex-1 flex w-full relative h-[85vh]">
        
        {/* ESQUERDA: PREPARANDO (GRID DE NÚMEROS) */}
        <div className="w-1/2 bg-[#1a1a1a] border-r border-gray-800 flex flex-col relative overflow-hidden">
           <div className="p-6 bg-gradient-to-r from-yellow-900/40 to-transparent border-b border-yellow-600/30 flex items-center gap-4">
              <ChefHat size={48} className="text-yellow-500" />
              <h2 className="text-4xl font-black text-yellow-500 tracking-wider uppercase">PREPARANDO</h2>
           </div>
           
           <div className="flex-1 p-6 overflow-hidden">
             {/* Grid otimizado para TV: Apenas números grandes */}
             <div className="grid grid-cols-3 gap-4 content-start">
                {preparingOrders.map(order => (
                  <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl aspect-[16/9] flex items-center justify-center animate-in fade-in duration-500">
                     <span className="text-6xl xl:text-7xl font-black text-yellow-400/90 tracking-tighter">
                       #{order.orderNumber}
                     </span>
                  </div>
                ))}
                
                {preparingOrders.length === 0 && (
                   <div className="col-span-3 flex flex-col items-center justify-center py-32 opacity-20">
                      <ChefHat size={100} className="text-white mb-4" />
                      <p className="text-3xl font-bold">Cozinha livre</p>
                   </div>
                )}
             </div>
           </div>
        </div>

        {/* DIREITA: PRONTO (LISTA GIGANTE) */}
        <div className="w-1/2 bg-black flex flex-col relative overflow-hidden">
           {/* Gradient Background */}
           <div className="absolute inset-0 bg-gradient-to-b from-green-900/30 via-transparent to-transparent pointer-events-none"></div>
           
           <div className="p-6 bg-gradient-to-r from-green-900/60 to-transparent border-b border-green-600/30 flex items-center gap-4 relative z-10">
              <CheckCircle2 size={48} className="text-green-400" />
              <h2 className="text-4xl font-black text-green-400 tracking-wider uppercase">PRONTO</h2>
           </div>

           <div className="flex-1 p-6 overflow-hidden relative z-10 flex flex-col gap-4">
               {readyOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-30">
                     <CheckCircle2 size={120} className="text-white mb-6" />
                     <p className="text-4xl font-bold">Nenhum pedido</p>
                  </div>
               ) : (
                  readyOrders.map((order, index) => {
                     // Lógica para destacar o primeiro item (Mais recente)
                     const isFirst = index === 0;
                     
                     return (
                        <div 
                           key={order.id}
                           className={`flex items-center justify-between rounded-2xl shadow-lg transition-all duration-500
                             ${isFirst 
                               ? 'bg-gradient-to-r from-green-700 to-green-600 border-4 border-white p-6 transform scale-[1.02] shadow-[0_0_30px_rgba(34,197,94,0.4)] z-10' 
                               : 'bg-gray-800 border border-gray-700 p-4 opacity-80'
                             }`}
                        >
                           {isFirst && (
                             <div className="flex items-center gap-3">
                                <div className="bg-white text-green-700 font-black px-3 py-1 rounded text-sm uppercase tracking-bold animate-pulse">
                                   Saiu Agora
                                </div>
                             </div>
                           )}

                           <div className="flex items-baseline gap-4 w-full justify-between">
                              <span className={`font-bold uppercase tracking-widest ${isFirst ? 'text-green-100 text-xl' : 'text-gray-500 text-lg'}`}>
                                 SENHA
                              </span>
                              <span className={`font-black leading-none tracking-tighter ${isFirst ? 'text-8xl text-white' : 'text-6xl text-green-500'}`}>
                                 #{order.orderNumber}
                              </span>
                           </div>
                           
                           {/* Icone de Check */}
                           <div className={`rounded-full flex items-center justify-center ${isFirst ? 'bg-white text-green-600 p-2' : 'hidden'}`}>
                              <CheckCircle2 size={32} />
                           </div>
                        </div>
                     );
                  })
               )}
           </div>
        </div>

      </div>
      
      {/* MARQUEE FOOTER (Notícias/Avisos) */}
      <div className="bg-orange-600 h-[5vh] flex items-center overflow-hidden relative border-t-4 border-orange-400 z-20">
         <div className="whitespace-nowrap animate-[marquee_25s_linear_infinite] text-white font-black text-xl uppercase tracking-widest drop-shadow-md">
            ⚠️ RETIRE SEU PEDIDO IMEDIATAMENTE APÓS CHAMAR • BOM APETITE! • {APP_NAME} • FEIRA CULTURAL {SCHOOL_CLASS} • EVITE FILAS, PEÇA COM ANTECEDÊNCIA • 
            ⚠️ RETIRE SEU PEDIDO IMEDIATAMENTE APÓS CHAMAR • BOM APETITE! • {APP_NAME} • FEIRA CULTURAL {SCHOOL_CLASS} • EVITE FILAS, PEÇA COM ANTECEDÊNCIA •
         </div>
      </div>

    </div>
  );
};

export default PublicDisplay;