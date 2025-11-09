import { Clock, TrendingUp, User as UserIcon, Shield, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";

interface AuctionPageProps {
  onNavigate: (page: string) => void;
}

export function AuctionPage({ onNavigate }: AuctionPageProps) {
  const [bidAmount, setBidAmount] = useState("2550");
  const [timeLeft, setTimeLeft] = useState("");
  
  const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

  const images = [
    "https://images.unsplash.com/photo-1742631193849-acc045ea5890?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3YXRjaCUyMGVsZWdhbnR8ZW58MXx8fHwxNzYwMjUzOTM0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1742631193849-acc045ea5890?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3YXRjaCUyMGVsZWdhbnR8ZW58MXx8fHwxNzYwMjUzOTM0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1742631193849-acc045ea5890?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3YXRjaCUyMGVsZWdhbnR8ZW58MXx8fHwxNzYwMjUzOTM0fDA&ixlib=rb-4.1.0&q=80&w=1080"
  ];

  const bidHistory = [
    { user: "john_doe", amount: 2500, time: "2 minutes ago" },
    { user: "jane_smith", amount: 2450, time: "15 minutes ago" },
    { user: "mike_wilson", amount: 2400, time: "32 minutes ago" },
    { user: "sarah_jones", amount: 2350, time: "1 hour ago" },
    { user: "david_brown", amount: 2300, time: "2 hours ago" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance < 0) {
        setTimeLeft("Ended");
        clearInterval(timer);
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button onClick={() => onNavigate("dashboard")} className="hover:text-[#0A84FF]">
            Home
          </button>
          <span>/</span>
          <button onClick={() => onNavigate("auctions")} className="hover:text-[#0A84FF]">
            Auctions
          </button>
          <span>/</span>
          <span className="text-gray-900">Luxury Swiss Watch</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
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

            {/* Product Details */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h1 className="text-3xl text-gray-900 mb-4">
                Luxury Swiss Watch - Limited Edition
              </h1>
              
              <div className="flex items-center gap-3 mb-6">
                <Badge className="bg-[#FFD700] text-gray-900 hover:bg-[#FFD700]/90">
                  <Clock className="h-3 w-3 mr-1" />
                  Ends in {timeLeft}
                </Badge>
                <Badge variant="outline">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  23 bids
                </Badge>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">
                    Exquisite Swiss-made timepiece featuring automatic movement, sapphire crystal,
                    and premium leather strap. This limited edition watch combines precision
                    engineering with timeless elegance. Only 500 pieces produced worldwide.
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-900 mb-2">Specifications</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-[#0A84FF]" />
                      <span>Movement: Swiss Automatic</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-[#0A84FF]" />
                      <span>Case: 42mm Stainless Steel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-[#0A84FF]" />
                      <span>Water Resistance: 100m</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-[#0A84FF]" />
                      <span>Warranty: 2 Years International</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-[#0A84FF] mt-0.5" />
                <div>
                  <h4 className="text-gray-900 mb-1">Buyer Protection</h4>
                  <p className="text-sm text-gray-600">
                    All purchases are covered by our buyer protection program. Authentic products
                    guaranteed or your money back.
                  </p>
                </div>
              </div>
            </div>

            {/* Bid History */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl text-gray-900 mb-4">Bid History</h3>
              <div className="space-y-3">
                {bidHistory.map((bid, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-gray-900">{bid.user}</p>
                        <p className="text-xs text-gray-500">{bid.time}</p>
                      </div>
                    </div>
                    <p className="text-[#0A84FF]">${bid.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Bidding Panel */}
          <div className="space-y-6">
            {/* Bidding Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">Current Bid</p>
                <p className="text-4xl text-[#0A84FF] mb-4">$2,500</p>
                <p className="text-sm text-gray-600">
                  Minimum bid increment: <span className="text-gray-900">$50</span>
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-gray-700 mb-2 block">Your Bid</label>
                  <Input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="text-lg"
                    placeholder="Enter bid amount"
                  />
                </div>

                <Button className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 h-12">
                  Place Bid
                </Button>

                <Button variant="outline" className="w-full h-12">
                  Add to Watchlist
                </Button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bid Amount</span>
                  <span className="text-gray-900">${bidAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Buyer's Premium (10%)</span>
                  <span className="text-gray-900">${(parseFloat(bidAmount) * 0.1).toFixed(0)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-gray-900">Total if you win</span>
                  <span className="text-gray-900">${(parseFloat(bidAmount) * 1.1).toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-gray-900 mb-4">Seller Information</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0A84FF] to-[#FFD700] rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-900">Premium Watches Co.</p>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★★★★★</span>
                    <span className="text-xs text-gray-600">(4.9)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Sales</span>
                  <span className="text-gray-900">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span>Member Since</span>
                  <span className="text-gray-900">2020</span>
                </div>
                <div className="flex justify-between">
                  <span>Location</span>
                  <span className="text-gray-900">Switzerland</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                View Seller Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
