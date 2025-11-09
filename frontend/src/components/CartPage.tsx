import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState } from "react";

interface CartPageProps {
  onNavigate: (page: string) => void;
}

export function CartPage({ onNavigate }: CartPageProps) {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Premium Wireless Headphones",
      price: 299,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGhlYWRwaG9uZXN8ZW58MXx8fHwxNzYwMzIxNDY4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      quantity: 1
    },
    {
      id: 2,
      name: "Professional Camera Kit",
      price: 899,
      image: "https://images.unsplash.com/photo-1729857001644-ade54ca81f53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1lcmElMjBwaG90b2dyYXBoeSUyMGVxdWlwbWVudHxlbnwxfHx8fDE3NjAzNDMwNDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      quantity: 1
    }
  ]);

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">
              Start shopping to add items to your cart
            </p>
            <Button
              onClick={() => onNavigate("shop")}
              className="bg-[#0A84FF] hover:bg-[#0A84FF]/90"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 mb-2 truncate">{item.name}</h3>
                    <p className="text-xl text-[#0A84FF] mb-3">${item.price}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center text-gray-900">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={() => onNavigate("shop")}
              className="w-full"
            >
              Continue Shopping
            </Button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-gray-900">
                    {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span className="text-gray-900">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-gray-900">Total</span>
                  <span className="text-2xl text-gray-900">${total.toFixed(2)}</span>
                </div>
              </div>

              {shipping > 0 && (
                <div className="bg-blue-50 rounded-lg p-3 mb-6 text-sm text-gray-700">
                  Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                </div>
              )}

              <Button
                className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 h-12 mb-3"
                onClick={() => onNavigate("checkout")}
              >
                Proceed to Checkout
              </Button>

              <div className="text-center text-sm text-gray-500">
                Secure checkout powered by AuctionBay
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
