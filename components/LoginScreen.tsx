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
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-orange-100 flex flex-col items-center animate-in zoom-in-95 duration-300">
        
        {/* Mascote e Logo */}
        <div className="relative w-32 h-32 mb-4">
          <div className="absolute inset-0 bg-orange-100 rounded-full blur-2xl opacity-50"></div>
          <img 
            src={MASCOT_URL} 
            alt="Mascote" 
            className="w-full h-full object-contain relative z-10 mix-blend-multiply drop-shadow-lg"
          />
        </div>

        <h2 className="text-3xl font-black text-gray-800 mb-1 tracking-tight">{APP_NAME}</h2>
        <p className="text-gray-400 mb-8 font-medium">Quem está assumindo o caixa?</p>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Funcionário</label>
            <div className="relative">
              <UserCircle2 className="absolute left-3 top-3.5 text-orange-400" size={20} />
              <select 
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setError(false);
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-orange-100 bg-white focus:border-orange-500 focus:outline-none appearance-none text-gray-700 font-bold transition-colors cursor-pointer"
                required
              >
                <option value="" disabled>Selecione seu nome...</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
             <label className="text-xs font-bold text-gray-500 uppercase ml-1">Senha de Acesso</label>
             <div className="relative">
               <Lock className="absolute left-3 top-3.5 text-orange-400" size={20} />
               <input 
                 type="password"
                 value={password}
                 onChange={(e) => {
                   setPassword(e.target.value);
                   setError(false);
                 }}
                 className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 bg-white focus:outline-none transition-colors font-bold text-gray-700
                   ${error ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-orange-100 focus:border-orange-500'}`}
                 placeholder="Digite sua senha..."
                 autoFocus
               />
             </div>
             {error && <p className="text-red-500 text-xs font-bold ml-1">Senha incorreta. Tente novamente.</p>}
          </div>

          <button 
            type="submit"
            disabled={!selectedUserId || !password}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-gray-200 hover:shadow-orange-200 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            ENTRAR NO CAIXA
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        
        <p className="mt-8 text-xs text-gray-400">Sistema TÔ FRITO! v1.2</p>
      </div>
    </div>
  );
};

export default LoginScreen;