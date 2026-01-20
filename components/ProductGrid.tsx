import React from 'react';
import { Product } from '../types';
import { formatCurrency } from '../utils';
import { Plus } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart }) => {
  return (
    // Increased grid columns to make items smaller (compact view)
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3 overflow-y-auto h-full bg-orange-50/50 content-start">
      {products.map((product) => (
        <div 
          key={product.id} 
          className="bg-white rounded-lg shadow-sm border border-orange-100 overflow-hidden cursor-pointer group relative transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-200/60 hover:-rotate-1 hover:z-10"
          onClick={() => onAddToCart(product)}
        >
          {/* Reduced height for smaller appearance */}
          <div className="relative h-24 md:h-32 w-full overflow-hidden bg-gray-100">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            {/* Overlay Animation */}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
              <div className="bg-orange-600 text-white rounded-full p-1.5 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                <Plus size={20} />
              </div>
            </div>
          </div>
          
          <div className="p-2.5">
            <h3 className="font-bold text-gray-800 text-xs md:text-sm line-clamp-2 leading-tight min-h-[2.5em] group-hover:text-orange-600 transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center justify-between mt-2">
               <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{product.category}</span>
               <p className="font-black text-sm md:text-base text-orange-600">{formatCurrency(product.price)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;