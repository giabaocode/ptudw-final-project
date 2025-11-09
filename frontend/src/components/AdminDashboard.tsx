import { Users, Package, Gavel, DollarSign, TrendingUp, Activity, BarChart3, Settings, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { useState } from "react";

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "products" | "auctions">("overview");

  const stats = [
    {
      icon: DollarSign,
      label: "Total Revenue",
      value: "$124,589",
      change: "+12.5%",
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      icon: Users,
      label: "Total Users",
      value: "8,459",
      change: "+8.2%",
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      icon: Package,
      label: "Total Products",
      value: "1,234",
      change: "+15.3%",
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      icon: Gavel,
      label: "Active Auctions",
      value: "456",
      change: "+5.7%",
      color: "text-[#FFD700]",
      bgColor: "bg-yellow-50"
    }
  ];

  const recentUsers = [
    { id: 1, name: "John Doe", email: "john@example.com", type: "Buyer", status: "Active", joined: "2025-10-10" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", type: "Seller", status: "Active", joined: "2025-10-09" },
    { id: 3, name: "Mike Wilson", email: "mike@example.com", type: "Buyer", status: "Pending", joined: "2025-10-08" },
    { id: 4, name: "Sarah Jones", email: "sarah@example.com", type: "Seller", status: "Active", joined: "2025-10-07" }
  ];

  const recentProducts = [
    { id: 1, name: "Wireless Headphones", category: "Electronics", price: "$299", status: "Active", sales: 45 },
    { id: 2, name: "Designer Sofa", category: "Furniture", price: "$1,499", status: "Active", sales: 12 },
    { id: 3, name: "Camera Kit", category: "Photography", price: "$899", status: "Active", sales: 28 },
    { id: 4, name: "Smartphone", category: "Electronics", price: "$1,199", status: "Low Stock", sales: 67 }
  ];

  const recentAuctions = [
    { id: 101, name: "Luxury Watch", currentBid: "$2,500", bids: 23, status: "Live", endsIn: "2h" },
    { id: 102, name: "MacBook Pro", currentBid: "$1,800", bids: 45, status: "Live", endsIn: "5h" },
    { id: 103, name: "Designer Handbag", currentBid: "$650", bids: 12, status: "Live", endsIn: "1d" },
    { id: 104, name: "Gaming Console", currentBid: "$450", bids: 34, status: "Ending Soon", endsIn: "30m" }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0A84FF] to-[#FFD700] rounded-lg flex items-center justify-center">
              <span className="text-white">AB</span>
            </div>
            <div>
              <p className="text-gray-900">Admin Panel</p>
              <p className="text-xs text-gray-500">AuctionBay</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "overview"
                  ? "bg-[#0A84FF] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "users"
                  ? "bg-[#0A84FF] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Users</span>
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "products"
                  ? "bg-[#0A84FF] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Package className="h-5 w-5" />
              <span>Products</span>
            </button>
            <button
              onClick={() => setActiveTab("auctions")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "auctions"
                  ? "bg-[#0A84FF] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Gavel className="h-5 w-5" />
              <span>Auctions</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              <Activity className="h-5 w-5" />
              <span>Analytics</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={() => onNavigate("landing")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl text-gray-900 mb-2">
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "users" && "User Management"}
              {activeTab === "products" && "Product Management"}
              {activeTab === "auctions" && "Auction Management"}
            </h1>
            <p className="text-gray-600">Welcome back, Admin</p>
          </div>

          {/* Stats Grid */}
          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`${stat.bgColor} rounded-xl p-3`}>
                          <Icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {stat.change}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-2xl text-gray-900">{stat.value}</p>
                    </Card>
                  );
                })}
              </div>

              {/* Charts Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="p-6">
                  <h3 className="text-lg text-gray-900 mb-4">Revenue Trend</h3>
                  <div className="h-64 bg-gradient-to-br from-[#0A84FF]/10 to-[#FFD700]/10 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Revenue chart visualization</p>
                  </div>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg text-gray-900 mb-4">Sales by Category</h3>
                  <div className="h-64 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Category chart visualization</p>
                  </div>
                </Card>
              </div>
            </>
          )}

          {/* Users Table */}
          {activeTab === "users" && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg text-gray-900">All Users</h3>
                <Button className="bg-[#0A84FF] hover:bg-[#0A84FF]/90">Add User</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.type}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.joined}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Products Table */}
          {activeTab === "products" && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg text-gray-900">All Products</h3>
                <Button className="bg-[#0A84FF] hover:bg-[#0A84FF]/90">Add Product</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.price}</TableCell>
                      <TableCell>
                        <Badge variant={product.status === "Active" ? "default" : "secondary"}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.sales}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Auctions Table */}
          {activeTab === "auctions" && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg text-gray-900">All Auctions</h3>
                <Button className="bg-[#0A84FF] hover:bg-[#0A84FF]/90">Create Auction</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auction Name</TableHead>
                    <TableHead>Current Bid</TableHead>
                    <TableHead>Total Bids</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ends In</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAuctions.map((auction) => (
                    <TableRow key={auction.id}>
                      <TableCell>{auction.name}</TableCell>
                      <TableCell>{auction.currentBid}</TableCell>
                      <TableCell>{auction.bids}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={auction.status === "Live" ? "default" : "secondary"}
                          className={auction.status === "Ending Soon" ? "bg-[#FFD700] text-gray-900" : ""}
                        >
                          {auction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{auction.endsIn}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">Manage</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
