import { CreditCard, MapPin, Lock } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";

interface CheckoutPageProps {
  onNavigate: (page: string) => void;
}

export function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");

  const cartItems = [
    {
      id: 1,
      name: "Premium Wireless Headphones",
      price: 299,
      quantity: 1
    },
    {
      id: 2,
      name: "Professional Camera Kit",
      price: 899,
      quantity: 1
    }
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-[#0A84FF]" />
                </div>
                <h2 className="text-xl text-gray-900">Shipping Address</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" className="mt-2" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" placeholder="123 Main Street" className="mt-2" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="New York" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select>
                      <SelectTrigger id="state" className="mt-2">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ny">New York</SelectItem>
                        <SelectItem value="ca">California</SelectItem>
                        <SelectItem value="tx">Texas</SelectItem>
                        <SelectItem value="fl">Florida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" placeholder="10013" className="mt-2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-[#0A84FF]" />
                </div>
                <h2 className="text-xl text-gray-900">Payment Method</h2>
              </div>

              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as "card" | "paypal")}
                className="space-y-3 mb-6"
              >
                <div>
                  <RadioGroupItem value="card" id="card" className="peer sr-only" />
                  <Label
                    htmlFor="card"
                    className="flex items-center justify-between rounded-lg border-2 border-gray-200 p-4 hover:bg-gray-50 peer-data-[state=checked]:border-[#0A84FF] peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5" />
                      <span>Credit / Debit Card</span>
                    </span>
                    <span className="text-sm text-gray-500">Visa, Mastercard, Amex</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="paypal" id="paypal" className="peer sr-only" />
                  <Label
                    htmlFor="paypal"
                    className="flex items-center justify-between rounded-lg border-2 border-gray-200 p-4 hover:bg-gray-50 peer-data-[state=checked]:border-[#0A84FF] peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516c-.041.26.16.492.419.492h4.608c.437 0 .81-.32.877-.753l.036-.188.697-4.43.045-.243c.067-.433.44-.753.877-.753h.552c3.583 0 6.388-1.455 7.207-5.66.342-1.755.166-3.22-.694-4.248z"/>
                      </svg>
                      <span>PayPal</span>
                    </span>
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input id="expiry" placeholder="MM/YY" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="123" className="mt-2" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input id="cardName" placeholder="John Doe" className="mt-2" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl text-gray-900 mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-6 pb-6 border-b">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="text-gray-900">${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600">FREE</span>
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

              <Button className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 h-12 mb-4">
                <Lock className="h-4 w-4 mr-2" />
                Place Order
              </Button>

              <div className="text-center text-sm text-gray-500">
                Your payment information is secure
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
