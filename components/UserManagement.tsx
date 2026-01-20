import React, { useState } from 'react';
import { User } from '../types';
import { generateId } from '../utils';
import { Plus, Trash2, Edit2, Shield, User as UserIcon, Save, X, Key } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');

  const resetForm = () => {
    setName('');
    setPassword('');
    setRole('staff');
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setPassword(user.password);
    setRole(user.role);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Editar
      onUpdateUser({
        ...editingUser,
        name,
        password,
        role
      });
    } else {
      // Criar Novo
      const newUser: User = {
        id: generateId(),
        name,
        password,
        role
      };
      onAddUser(newUser);
    }
    resetForm();
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-orange-50/50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-orange-600" />
            Gerenciamento de Equipe
          </h2>
          <p className="text-gray-500 text-sm">Adicione ou remova acesso ao sistema.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Plus size={20} />
          NOVO USUÁRIO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 flex flex-col relative group hover:shadow-md transition-shadow">
            
            <div className="flex items-start justify-between mb-4">
               <div className={`p-3 rounded-full ${user.role === 'admin' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                  {user.role === 'admin' ? <Shield size={24} /> : <UserIcon size={24} />}
               </div>
               <div className="flex gap-1">
                 <button 
                    onClick={() => openEdit(user)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                 >
                   <Edit2 size={18} />
                 </button>
                 {/* Não permitir deletar a si mesmo ou se for o único admin */}
                 {user.id !== currentUser.id && (
                   <button 
                      onClick={() => {
                        if(window.confirm(`Tem certeza que deseja remover ${user.name}?`)) {
                          onDeleteUser(user.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                   >
                     <Trash2 size={18} />
                   </button>
                 )}
               </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
            <span className={`text-xs font-bold uppercase tracking-wider mb-4 ${user.role === 'admin' ? 'text-orange-500' : 'text-gray-400'}`}>
              {user.role === 'admin' ? 'Gerente / Admin' : 'Vendedor / Staff'}
            </span>

            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2 text-gray-400 text-sm">
               <Key size={14} />
               <span>Senha: ••••</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {editingUser ? <Edit2 size={20}/> : <Plus size={20}/>}
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={resetForm} className="hover:bg-gray-700 p-1 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Funcionário</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold text-gray-700"
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha de Acesso (Numérica)</label>
                <input 
                  type="text" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold text-gray-700 tracking-widest"
                  placeholder="Ex: 1234"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nível de Acesso</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('staff')}
                    className={`p-3 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition-colors ${role === 'staff' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                  >
                    <UserIcon size={24} />
                    Vendedor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-3 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition-colors ${role === 'admin' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                  >
                    <Shield size={24} />
                    Gerente
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 flex items-center justify-center gap-2 mt-4"
              >
                <Save size={20} />
                SALVAR DADOS
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;