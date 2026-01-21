import React from 'react';
import { Product, CartItem } from '../types';
import { formatCurrency } from '../utils';
import { Plus } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  cart: CartItem[]; // Recebe o carrinho para mostrar quantidades
  onAddToCart: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, cart, onAddToCart }) => {
  return (
    // Alterado para grid-cols-2 no mobile (padrão) e grid-cols-3 no md
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-3 overflow-y-auto h-full bg-orange-50/50 content-start pb-24 md:pb-3">
      {products.map((product) => {
        // Verifica se o item já está no carrinho
        const cartItem = cart.find(item => item.id === product.id);
        const quantity = cartItem ? cartItem.quantity : 0;

        return (
          <div 
            key={product.id} 
            className="bg-white rounded-lg shadow-sm border border-orange-100 overflow-hidden cursor-pointer group relative transform transition-all duration-300 active:scale-95 md:hover:scale-105 md:hover:shadow-xl md:hover:shadow-orange-200/60 md:hover:-rotate-1 md:hover:z-10"
            onClick={() => onAddToCart(product)}
          >
            {/* Reduced height for smaller appearance */}
            <div className="relative h-28 md:h-32 w-full overflow-hidden bg-gray-100">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              
              {/* Overlay Animation (Desktop Only) */}
              <div className="hidden md:flex absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                <div className="bg-orange-600 text-white rounded-full p-1.5 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                  <Plus size={20} />
                </div>
              </div>

              {/* Mobile Touch Feedback Ripple can be simulated via active state on parent */}

              {/* QUANTITY BADGE */}
              {quantity > 0 && (
                <div className="absolute top-2 right-2 bg-red-600 text-white font-bold text-xs w-6 h-6 flex items-center justify-center rounded-full shadow-md animate-in zoom-in duration-200 border-2 border-white">
                  {quantity}
                </div>
              )}
            </div>
            
            <div className="p-2.5">
              <h3 className="font-bold text-gray-800 text-xs md:text-sm line-clamp-2 leading-tight min-h-[2.5em] group-hover:text-orange-600 transition-colors">
                {product.name}
              </h3>
              <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 gap-1">
                 <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{product.category}</span>
                 <p className="font-black text-sm md:text-base text-orange-600">{formatCurrency(product.price)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductGrid;