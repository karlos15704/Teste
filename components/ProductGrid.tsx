import React from 'react';
import { Product, CartItem } from '../types';
import { formatCurrency } from '../utils';
import { Plus, X } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  cart: CartItem[]; // Recebe o carrinho para mostrar quantidades
  onAddToCart: (product: Product) => void;
  onRemoveFromCart?: (productId: string) => void; // Função para remover item
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, cart, onAddToCart, onRemoveFromCart }) => {
  return (
    // Grid adaptativo com padding extra na base para mobile
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-3 overflow-y-auto h-full bg-orange-50/50 content-start pb-24 md:pb-3">
      {products.map((product) => {
        // Verifica se o item já está no carrinho
        const cartItem = cart.find(item => item.id === product.id);
        const quantity = cartItem ? cartItem.quantity : 0;

        return (
          <div 
            key={product.id} 
            className={`bg-white rounded-xl shadow-sm border transition-all duration-300 cursor-pointer group relative overflow-hidden
              ${quantity > 0 ? 'border-orange-500 ring-2 ring-orange-100' : 'border-orange-100 hover:border-orange-300'}
              active:scale-95 md:hover:scale-105 md:hover:shadow-xl
            `}
            onClick={() => onAddToCart(product)}
          >
            {/* Imagem do Produto */}
            <div className="relative h-32 md:h-40 w-full bg-white p-2">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-sm"
                loading="lazy"
              />
              
              {/* Overlay Animation (Desktop Only - Apenas visual) */}
              <div className="hidden md:flex absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                <div className="bg-orange-600 text-white rounded-full p-2 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                  <Plus size={24} />
                </div>
              </div>

              {/* Badges e Controles sobre a imagem */}
              {quantity > 0 && (
                <>
                  {/* Badge de Quantidade (Canto Superior Direito) */}
                  <div className="absolute top-2 right-2 bg-orange-600 text-white font-black text-sm w-7 h-7 flex items-center justify-center rounded-full shadow-md animate-in zoom-in duration-200 border-2 border-white z-20">
                    {quantity}
                  </div>
                  
                  {/* Botão X para remover (Canto Superior Esquerdo) */}
                  <button 
                    className="absolute top-2 left-2 z-30 bg-white text-red-500 rounded-full p-1.5 shadow-md border border-red-100 hover:bg-red-50 hover:scale-110 transition-all animate-in zoom-in duration-200"
                    onClick={(e) => {
                      e.stopPropagation(); // Impede que o clique adicione mais um item
                      if (onRemoveFromCart) {
                        onRemoveFromCart(product.id);
                      }
                    }}
                    title="Remover do carrinho"
                  >
                     <X size={14} strokeWidth={3} />
                  </button>
                </>
              )}
            </div>
            
            {/* Info do Produto */}
            <div className="p-3 bg-white border-t border-gray-50">
              <h3 className="font-bold text-gray-800 text-xs md:text-sm line-clamp-2 leading-tight min-h-[2.5em] group-hover:text-orange-600 transition-colors">
                {product.name}
              </h3>
              <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 gap-1">
                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                    {product.category}
                 </span>
                 <p className="font-black text-sm md:text-base text-orange-600">
                    {formatCurrency(product.price)}
                 </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductGrid;