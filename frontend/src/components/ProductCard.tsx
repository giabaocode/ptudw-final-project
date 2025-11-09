import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  onViewDetails: (id: number) => void;
}

export function ProductCard({ id, name, price, image, category, onViewDetails }: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer">
      <div 
        className="relative h-48 overflow-hidden bg-gray-100"
        onClick={() => onViewDetails(id)}
      >
        <ImageWithFallback
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors">
          <Heart className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      
      <div className="p-4">
        <p className="text-xs text-[#0A84FF] mb-1">{category}</p>
        <h3 
          className="text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-[#0A84FF] transition-colors"
          onClick={() => onViewDetails(id)}
        >
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-2xl text-gray-900">${price}</span>
          <Button 
            size="sm"
            className="bg-[#0A84FF] hover:bg-[#0A84FF]/90"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
