import { Clock, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";

interface AuctionCardProps {
  id: number;
  name: string;
  currentBid: number;
  image: string;
  endTime: Date;
  bidCount: number;
  onViewDetails: (id: number) => void;
}

export function AuctionCard({ id, name, currentBid, image, endTime, bidCount, onViewDetails }: AuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance < 0) {
        setTimeLeft("Ended");
        clearInterval(timer);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

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
        <Badge className="absolute top-3 left-3 bg-[#FFD700] text-gray-900 hover:bg-[#FFD700]/90">
          <Clock className="h-3 w-3 mr-1" />
          {timeLeft}
        </Badge>
      </div>
      
      <div className="p-4">
        <h3 
          className="text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-[#0A84FF] transition-colors"
          onClick={() => onViewDetails(id)}
        >
          {name}
        </h3>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500">Current Bid</p>
            <p className="text-xl text-[#0A84FF]">${currentBid}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {bidCount} bids
            </p>
          </div>
        </div>
        <Button 
          className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90"
          onClick={() => onViewDetails(id)}
        >
          Place Bid
        </Button>
      </div>
    </div>
  );
}
