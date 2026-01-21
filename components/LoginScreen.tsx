import React, { useState } from 'react';
import { MASCOT_URL, APP_NAME } from '../constants';
import { User } from '../types';
import { UserCircle2, Lock, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  availableUsers: User[]; // Recebe usuários dinâmicos
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ availableUsers, onLogin }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = availableUsers.find(u => u.id === selectedUserId);
    
    if (user && user.password === password) {
      onLogin(user);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-orange-50 flex items-center justify-center z-50 p-4">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-200/40 via-transparent to-transparent pointer-events-none"></div>

      <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(249,115,22,0.15)] p-8 max-w-md w-full border border-orange-100 flex flex-col items-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
        
        {/* Decorative Fire Background Glow behind mascot */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-100/50 rounded-full blur-3xl"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-100/30 rounded-full blur-3xl"></div>

        {/* Mascote */}
        <div className="relative w-36 h-36 mb-2">
          <div className="absolute inset-0 bg-orange-200 rounded-full blur-2xl opacity-40 scale-125 animate-pulse"></div>
          <img 
            src={MASCOT_URL} 
            alt="Mascote" 
            className="w-full h-full object-contain relative z-10 mix-blend-multiply drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)] animate-mascot-slow"
          />
        </div>

        {/* Burning Title */}
        <h2 className="text-4xl md:text-5xl font-black mb-1 tracking-tighter text-fire text-center">
          {APP_NAME}
        </h2>
        
        <p className="text-gray-400 mb-8 font-semibold text-sm uppercase tracking-widest opacity-80">Painel de Acesso</p>

        <form onSubmit={handleLogin} className="w-full space-y-5 relative z-10">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Selecione seu Perfil</label>
            <div className="relative group">
              <UserCircle2 className="absolute left-4 top-3.5 text-orange-400 group-focus-within:text-orange-600 transition-colors" size={20} />
              <select 
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setError(false);
                }}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-orange-100 bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none appearance-none text-gray-700 font-bold transition-all cursor-pointer shadow-sm hover:border-orange-200"
                required
              >
                <option value="" disabled>Quem está assumindo?</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Senha de Acesso</label>
             <div className="relative group">
               <Lock className="absolute left-4 top-3.5 text-orange-400 group-focus-within:text-orange-600 transition-colors" size={20} />
               <input 
                 type="password"
                 value={password}
                 onChange={(e) => {
                   setPassword(e.target.value);
                   setError(false);
                 }}
                 className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 bg-white focus:outline-none transition-all font-bold text-gray-700 tracking-widest
                   ${error ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : 'border-orange-100 focus:border-orange-500 focus:ring-orange-500/10 hover:border-orange-200 shadow-sm'}`}
                 placeholder="••••"
                 autoFocus
               />
             </div>
             {error && (
               <div className="flex items-center gap-1.5 text-red-500 text-xs font-bold ml-1 animate-in slide-in-from-top-1 duration-200">
                 <ArrowRight size={12} className="rotate-180" />
                 Senha incorreta. Tente novamente.
               </div>
             )}
          </div>

          <button 
            type="submit"
            disabled={!selectedUserId || !password}
            className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-gray-200 hover:shadow-orange-300/50 flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 overflow-hidden relative"
          >
            <span className="relative z-10 flex items-center gap-2">
              ACESSAR SISTEMA
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
            </span>
          </button>
        </form>
        
        <div className="mt-10 flex flex-col items-center gap-1 opacity-40">
           <p className="text-[10px] font-black tracking-[0.2em] text-gray-400">TÔ FRITO! POS ENGINE</p>
           <p className="text-[10px] text-gray-400 font-bold">VERSÃO 2.0 • 2026</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;