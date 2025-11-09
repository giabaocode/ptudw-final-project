import { Search, Tag, TrendingUp, Shield, Truck } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ProductCard } from "./ProductCard";
import { AuctionCard } from "./AuctionCard";

interface LandingPageProps {
  onNavigate: (page: string, id?: number) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const featuredProducts = [
    {
      id: 1,
      name: "Premium Wireless Headphones",
      price: 299,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGhlYWRwaG9uZXN8ZW58MXx8fHwxNzYwMzIxNDY4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Electronics"
    },
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
    }
  ];

  const liveAuctions = [
    {
      id: 101,
      name: "Luxury Swiss Watch - Limited Edition",
      currentBid: 2500,
      image: "https://images.unsplash.com/photo-1742631193849-acc045ea5890?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3YXRjaCUyMGVsZWdhbnR8ZW58MXx8fHwxNzYwMjUzOTM0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      bidCount: 23
    },
    {
      id: 102,
      name: "MacBook Pro 16-inch M3",
      currentBid: 1800,
      image: "https://images.unsplash.com/photo-1754928864131-21917af96dfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsYXB0b3AlMjBjb21wdXRlcnxlbnwxfHx8fDE3NjAzNzU4MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
      bidCount: 45
    },
    {
      id: 103,
      name: "Designer Leather Handbag",
      currentBid: 650,
      image: "https://images.unsplash.com/photo-1758171692659-024183c2c272?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ25lciUyMGhhbmRiYWclMjBsdXh1cnl8ZW58MXx8fHwxNzYwMjU5MzE3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      bidCount: 12
    },
    {
      id: 104,
      name: "Gaming Console Bundle",
      currentBid: 450,
      image: "https://images.unsplash.com/photo-1580234797602-22c37b2a6230?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBjb25zb2xlfGVufDF8fHx8MTc2MDI3NDg0OHww&ixlib=rb-4.1.0&q=80&w=1080",
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      bidCount: 34
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0A84FF] to-[#0066CC] text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl mb-4">Discover Amazing Deals</h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              Shop thousands of products or bid on exclusive auctions
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search for products, auctions, or categories..."
                    className="pl-10 h-12 bg-white text-gray-900"
                  />
                </div>
                <Button className="h-12 px-8 bg-[#FFD700] text-gray-900 hover:bg-[#FFD700]/90">
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
            <div className="text-center">
              <div className="text-3xl mb-1">10K+</div>
              <div className="text-blue-100">Active Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">5K+</div>
              <div className="text-blue-100">Live Auctions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">50K+</div>
              <div className="text-blue-100">Happy Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-[#0A84FF]" />
              </div>
              <h3 className="text-gray-900 mb-2">Secure Payment</h3>
              <p className="text-sm text-gray-600">100% secure transactions</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-6 w-6 text-[#0A84FF]" />
              </div>
              <h3 className="text-gray-900 mb-2">Free Shipping</h3>
              <p className="text-sm text-gray-600">On orders over $50</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="h-6 w-6 text-[#0A84FF]" />
              </div>
              <h3 className="text-gray-900 mb-2">Best Prices</h3>
              <p className="text-sm text-gray-600">Competitive pricing</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-[#0A84FF]" />
              </div>
              <h3 className="text-gray-900 mb-2">Live Bidding</h3>
              <p className="text-sm text-gray-600">Real-time auctions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Auctions */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl text-gray-900 mb-2">Live Auctions</h2>
              <p className="text-gray-600">Don't miss out on these exclusive deals</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => onNavigate("auctions")}
            >
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {liveAuctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                {...auction}
                onViewDetails={(id) => onNavigate("auction", id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl text-gray-900 mb-2">Featured Products</h2>
              <p className="text-gray-600">Handpicked items just for you</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => onNavigate("shop")}
            >
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onViewDetails={(id) => onNavigate("product", id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-[#FFD700] to-[#FFC700]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl text-gray-900 mb-4">
            Start Selling Today
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Join thousands of sellers and reach millions of buyers worldwide
          </p>
          <Button 
            size="lg"
            className="bg-[#0A84FF] hover:bg-[#0A84FF]/90"
            onClick={() => onNavigate("signup")}
          >
            Become a Seller
          </Button>
        </div>
      </section>
    </div>
  );
}
