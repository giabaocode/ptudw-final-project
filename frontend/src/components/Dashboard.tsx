import { Wallet, Package, Gavel, Heart, TrendingUp, Clock, DollarSign } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AuctionCard } from "./AuctionCard";
import { ProductCard } from "./ProductCard";

interface DashboardProps {
  onNavigate: (page: string, id?: number) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const stats = [
    {
      icon: Gavel,
      label: "Active Bids",
      value: "5",
      color: "text-[#0A84FF]",
      bgColor: "bg-blue-50"
    },
    {
      icon: Heart,
      label: "Saved Items",
      value: "12",
      color: "text-red-500",
      bgColor: "bg-red-50"
    },
    {
      icon: Package,
      label: "Orders",
      value: "8",
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      icon: Wallet,
      label: "Wallet",
      value: "$2,450",
      color: "text-[#FFD700]",
      bgColor: "bg-yellow-50"
    }
  ];

  const liveAuctions = [
    {
      id: 101,
      name: "Luxury Swiss Watch - Limited Edition",
      currentBid: 2500,
      image: "https://images.unsplash.com/photo-1742631193849-acc045ea5890?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3YXRjaCUyMGVsZWdhbnR8ZW58MXx8fHwxNzYwMjUzOTM0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      bidCount: 23
    },
    {
      id: 102,
      name: "MacBook Pro 16-inch M3",
      currentBid: 1800,
      image: "https://images.unsplash.com/photo-1754928864131-21917af96dfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsYXB0b3AlMjBjb21wdXRlcnxlbnwxfHx8fDE3NjAzNzU4MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
      bidCount: 45
    },
    {
      id: 103,
      name: "Designer Leather Handbag",
      currentBid: 650,
      image: "https://images.unsplash.com/photo-1758171692659-024183c2c272?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ25lciUyMGhhbmRiYWclMjBsdXh1cnl8ZW58MXx8fHwxNzYwMjU5MzE3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      bidCount: 12
    },
    {
      id: 104,
      name: "Gaming Console Bundle",
      currentBid: 450,
      image: "https://images.unsplash.com/photo-1580234797602-22c37b2a6230?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBjb25zb2xlfGVufDF8fHx8MTc2MDI3NDg0OHww&ixlib=rb-4.1.0&q=80&w=1080",
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      bidCount: 34
    }
  ];

  const shopProducts = [
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

  const myBids = [
    {
      id: 105,
      name: "Vintage Camera Collection",
      currentBid: 350,
      image: "https://images.unsplash.com/photo-1729857001644-ade54ca81f53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1lcmElMjBwaG90b2dyYXBoeSUyMGVxdWlwbWVudHxlbnwxfHx8fDE3NjAzNDMwNDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      bidCount: 18
    },
    {
      id: 106,
      name: "Smart Home Bundle",
      currentBid: 550,
      image: "https://images.unsplash.com/photo-1676173646307-d050e097d181?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHBob25lJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjAzNzM5MjN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
      bidCount: 29
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Welcome back, John!</h1>
          <p className="text-gray-600">Here's what's happening with your account</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} rounded-xl p-3`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-[#0A84FF] to-[#0066CC] rounded-2xl p-6 mb-8 text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl mb-2">Ready to explore more?</h2>
              <p className="text-blue-100">
                Browse thousands of products and live auctions
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="secondary"
                onClick={() => onNavigate("shop")}
              >
                Browse Shop
              </Button>
              <Button 
                className="bg-[#FFD700] text-gray-900 hover:bg-[#FFD700]/90"
                onClick={() => onNavigate("auctions")}
              >
                View Auctions
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="auctions" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm">
            <TabsTrigger value="auctions" className="data-[state=active]:bg-[#0A84FF] data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Live Auctions
            </TabsTrigger>
            <TabsTrigger value="shop" className="data-[state=active]:bg-[#0A84FF] data-[state=active]:text-white">
              <Package className="h-4 w-4 mr-2" />
              Shop Products
            </TabsTrigger>
            <TabsTrigger value="mybids" className="data-[state=active]:bg-[#0A84FF] data-[state=active]:text-white">
              <Gavel className="h-4 w-4 mr-2" />
              My Bids
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auctions">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {liveAuctions.map((auction) => (
                <AuctionCard
                  key={auction.id}
                  {...auction}
                  onViewDetails={(id) => onNavigate("auction", id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shop">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {shopProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onViewDetails={(id) => onNavigate("product", id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mybids">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {myBids.map((auction) => (
                <AuctionCard
                  key={auction.id}
                  {...auction}
                  onViewDetails={(id) => onNavigate("auction", id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
