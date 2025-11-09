import { ShoppingCart, Heart, Star, Truck, RefreshCw, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { ProductCard } from "./ProductCard";

interface ProductPageProps {
  onNavigate: (page: string, id?: number) => void;
  onAddToCart: () => void;
}

export function ProductPage({ onNavigate, onAddToCart }: ProductPageProps) {
  const images = [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGhlYWRwaG9uZXN8ZW58MXx8fHwxNzYwMzIxNDY4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGhlYWRwaG9uZXN8ZW58MXx8fHwxNzYwMzIxNDY4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGhlYWRwaG9uZXN8ZW58MXx8fHwxNzYwMzIxNDY4fDA&ixlib=rb-4.1.0&q=80&w=1080"
  ];

  const relatedProducts = [
    {
      id: 2,
      name: "Modern Designer Sofa",
      price: 1499,
      image: "https://images.unsplash.com/photo-1759722668253-1767030ad9b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBmdXJuaXR1cmUlMjBzb2ZhfGVufDF8fHx8MTc2MDM1NjU1NXww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Furniture"
    },
    {
      id: 3,
      name: "Professional Camera Kit",
      price: 899,
      image: "https://images.unsplash.com/photo-1729857001644-ade54ca81f53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1lcmElMjBwaG90b2dyYXBoeSUyMGVxdWlwbWVudHxlbnwxfHx8fDE3NjAzNDMwNDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Photography"
    },
    {
      id: 4,
      name: "Smartphone Pro Max",
      price: 1199,
      image: "https://images.unsplash.com/photo-1676173646307-d050e097d181?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHBob25lJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjAzNzM5MjN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Electronics"
    },
    {
      id: 5,
      name: "Gaming Console",
      price: 499,
      image: "https://images.unsplash.com/photo-1580234797602-22c37b2a6230?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBjb25zb2xlfGVufDF8fHx8MTc2MDI3NDg0OHww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Gaming"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button onClick={() => onNavigate("dashboard")} className="hover:text-[#0A84FF]">
            Home
          </button>
          <span>/</span>
          <button onClick={() => onNavigate("shop")} className="hover:text-[#0A84FF]">
            Shop
          </button>
          <span>/</span>
          <span className="text-gray-900">Premium Wireless Headphones</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Images */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <Carousel className="w-full">
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square bg-gray-100">
                      <ImageWithFallback
                        src={image}
                        alt={`Product view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-3">Electronics</Badge>
              <h1 className="text-3xl md:text-4xl text-gray-900 mb-4">
                Premium Wireless Headphones
              </h1>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#FFD700] text-[#FFD700]" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(128 reviews)</span>
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl text-gray-900">$299</span>
                <span className="text-xl text-gray-400 line-through">$399</span>
                <Badge className="bg-green-500 hover:bg-green-600">25% OFF</Badge>
              </div>

              <p className="text-gray-600 mb-6">
                Experience premium sound quality with our wireless headphones featuring active
                noise cancellation, 30-hour battery life, and premium comfort. Perfect for music
                lovers and professionals alike.
              </p>
            </div>

            {/* Features */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="text-gray-900">Key Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#0A84FF] mt-1">•</span>
                  <span>Active Noise Cancellation (ANC)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0A84FF] mt-1">•</span>
                  <span>30-hour battery life with fast charging</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0A84FF] mt-1">•</span>
                  <span>Premium leather ear cushions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0A84FF] mt-1">•</span>
                  <span>Bluetooth 5.3 with multipoint connection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0A84FF] mt-1">•</span>
                  <span>Built-in microphone for calls</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 h-12"
                onClick={() => {
                  onAddToCart();
                  onNavigate("cart");
                }}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12">
                  Buy Now
                </Button>
                <Button variant="outline" className="h-12">
                  <Heart className="h-5 w-5 mr-2" />
                  Wishlist
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 rounded-lg p-2">
                  <Truck className="h-5 w-5 text-[#0A84FF]" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">Free Shipping</p>
                  <p className="text-xs text-gray-600">On orders over $50</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 rounded-lg p-2">
                  <RefreshCw className="h-5 w-5 text-[#0A84FF]" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">30-Day Returns</p>
                  <p className="text-xs text-gray-600">Money back guarantee</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 rounded-lg p-2">
                  <Shield className="h-5 w-5 text-[#0A84FF]" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">2 Year Warranty</p>
                  <p className="text-xs text-gray-600">Full coverage</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <section>
          <h2 className="text-2xl text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onViewDetails={(id) => onNavigate("product", id)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
