import { Product, User } from './types';

// =================================================================================
// 👥 ÁREA DE LOGIN (USUÁRIOS E SENHAS)
// Para adicionar um novo funcionário:
// 1. Copie uma linha que começa com { e termina com },
// 2. Mude o 'id' (não pode repetir), o 'name' e a 'password'.
// =================================================================================
export const STAFF_USERS: User[] = [
  // SUPER ADMIN (Manda em tudo, inclusive no Gerente)
  { id: '0', name: 'Professor',         password: '32034392320', role: 'admin' },
  
  // ADMIN
  { id: '1', name: 'Gerente',           password: '32034392320', role: 'admin' },
  
  // STAFF
  { id: '2', name: 'João (Caixa)',      password: '32034392320', role: 'staff' },
  { id: '3', name: 'Maria (Caixa)',     password: '32034392320', role: 'staff' },
  { id: '4', name: 'Extra / Folguista', password: '32034392320', role: 'staff' },
  
  // Exemplo de como adicionar um novo (apague as barras // para ativar):
  // { id: '5', name: 'Pedro', password: '333', role: 'staff' },
];

// Mock Products - Iscas de Frango Theme
export const MOCK_PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: 'Combo Tô Frito (Clássico + Refri)', 
    price: 18.00, 
    category: 'Combos', 
    imageUrl: 'https://upnow-prod.ff45e40d1a1c8f7e7de4e976d0c9e555.r2.cloudflarestorage.com/sZfVUJbAelbb6Rfo7X2xf7SHdG82/4ea4650e-9e85-45b4-974b-f2b8caf0921e?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=2f488bd324502ec20fee5b40e9c9ed39%2F20260120%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20260120T220122Z&X-Amz-Expires=43200&X-Amz-Signature=d3bd1a17289edfeeda0368ee99f752b1ad396633bdb10c3da449c8f721132944&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3D%22Captura%20de%20tela%202026-01-20%20185949.png%22' 
  },
  { 
    id: '2', 
    name: "Tô Frito Clássico (150g + Molho)", 
    price: 15.00, 
    category: 'Porções', 
    imageUrl: 'https://upnow-prod.ff45e40d1a1c8f7e7de4e976d0c9e555.r2.cloudflarestorage.com/sZfVUJbAelbb6Rfo7X2xf7SHdG82/a3524630-d6d9-4b09-8b6c-7993e3b9c370?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=2f488bd324502ec20fee5b40e9c9ed39%2F20260120%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20260120T220141Z&X-Amz-Expires=43200&X-Amz-Signature=2c398cc250e06d56df1f4016b0014135ccddf3d7f6b7a69be602f0e59974be61&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3D%22sfgs.png%22' 
  },
  { 
    id: '3', 
    name: "Tô Frito Junior (100g)", 
    price: 10.00, 
    category: 'Porções', 
    imageUrl: 'https://upnow-prod.ff45e40d1a1c8f7e7de4e976d0c9e555.r2.cloudflarestorage.com/sZfVUJbAelbb6Rfo7X2xf7SHdG82/d565312c-aee5-4ba8-9159-a2fff90e5972?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=2f488bd324502ec20fee5b40e9c9ed39%2F20260120%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20260120T220048Z&X-Amz-Expires=43200&X-Amz-Signature=11491bb91493462588559bda98a21cb2376adc8ed74ec3c223906295fbaf6188&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3D%22Captura%20de%20tela%202026-01-20%20185904fs.png%22' 
  },
  { 
    id: '4', 
    name: 'Refrigerante Lata 350ml', 
    price: 5.00, 
    category: 'Bebidas', 
    imageUrl: 'https://upnow-prod.ff45e40d1a1c8f7e7de4e976d0c9e555.r2.cloudflarestorage.com/sZfVUJbAelbb6Rfo7X2xf7SHdG82/aa7595ae-affe-431d-904a-0f91a703df96?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=2f488bd324502ec20fee5b40e9c9ed39%2F20260120%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20260120T221522Z&X-Amz-Expires=43200&X-Amz-Signature=b50555fbb50af828b90cc486c4f9acb4f073955622f85f1230042989599714fa&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3D%22Captura%20de%20tela%202026-01-20%20191356.png%22' 
  },
  { 
    id: '5', 
    name: 'Água Mineral 500ml', 
    price: 3.00, 
    category: 'Bebidas', 
    imageUrl: 'https://upnow-prod.ff45e40d1a1c8f7e7de4e976d0c9e555.r2.cloudflarestorage.com/sZfVUJbAelbb6Rfo7X2xf7SHdG82/daf608ad-55bc-4819-8c41-b87d8b9e39cd?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=2f488bd324502ec20fee5b40e9c9ed39%2F20260120%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20260120T221544Z&X-Amz-Expires=43200&X-Amz-Signature=fadba269bc1607533f72f7cb1b6a1d81595b540efc3a5cb1bcfbcac9306835e8&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3D%22Captura%20de%20tela%202026-01-20%20191418.png%22' 
  },
];

export const APP_NAME = "TÔ FRITO!";

// Mascote: Link atualizado conforme solicitação
export const MASCOT_URL = "https://upnow-prod.ff45e40d1a1c8f7e7de4e976d0c9e555.r2.cloudflarestorage.com/sZfVUJbAelbb6Rfo7X2xf7SHdG82/ce188be5-d948-4b33-95f8-ef0c4dbf71c2?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=2f488bd324502ec20fee5b40e9c9ed39%2F20260120%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20260120T182411Z&X-Amz-Expires=43200&X-Amz-Signature=2867a71c1d85f22357320b8806b91ad6cb00ecbb40c7233926661b59538e080b&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3D%22Captura%20de%20tela%202026-01-20%20145931%20-%20Edited.png%22";