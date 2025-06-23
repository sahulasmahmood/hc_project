
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Plus, Search, Filter, AlertTriangle, Truck, Calendar, TrendingDown, TrendingUp } from "lucide-react";

const Inventory = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const inventory = [
    {
      id: "MED-001",
      name: "Paracetamol 500mg",
      category: "Medicine",
      currentStock: 250,
      minStock: 50,
      maxStock: 500,
      unit: "Tablets",
      pricePerUnit: 2.50,
      supplier: "Sun Pharma",
      expiryDate: "2025-06-15",
      batchNumber: "BT001",
      lastRestocked: "2024-01-15"
    },
    {
      id: "EQP-001", 
      name: "Digital Thermometer",
      category: "Equipment",
      currentStock: 15,
      minStock: 5,
      maxStock: 25,
      unit: "Pieces",
      pricePerUnit: 350,
      supplier: "Omron Healthcare",
      expiryDate: null,
      batchNumber: "DT2024",
      lastRestocked: "2024-01-10"
    },
    {
      id: "MED-002",
      name: "Amoxicillin 250mg",
      category: "Medicine", 
      currentStock: 30,
      minStock: 100,
      maxStock: 300,
      unit: "Capsules",
      pricePerUnit: 8.75,
      supplier: "Cipla Ltd",
      expiryDate: "2024-12-20",
      batchNumber: "AM250",
      lastRestocked: "2023-12-01"
    },
    {
      id: "SUP-001",
      name: "Surgical Gloves (Medium)",
      category: "Supplies",
      currentStock: 500,
      minStock: 200,
      maxStock: 1000,
      unit: "Pairs",
      pricePerUnit: 5.25,
      supplier: "Ansell Healthcare",
      expiryDate: "2026-03-10",
      batchNumber: "SG2024M",
      lastRestocked: "2024-01-18"
    },
    {
      id: "MED-003",
      name: "Insulin Glargine",
      category: "Medicine",
      currentStock: 8,
      minStock: 20,
      maxStock: 50,
      unit: "Vials",
      pricePerUnit: 1250,
      supplier: "Sanofi India",
      expiryDate: "2024-08-30",
      batchNumber: "IG2024",
      lastRestocked: "2024-01-05"
    }
  ];

  const categories = ["Medicine", "Equipment", "Supplies", "Consumables"];

  const filteredInventory = inventory.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStockStatus = (current: number, min: number, max: number) => {
    if (current <= min) return { status: "Low Stock", color: "bg-red-100 text-red-800" };
    if (current >= max * 0.9) return { status: "Overstocked", color: "bg-yellow-100 text-yellow-800" };
    return { status: "Normal", color: "bg-green-100 text-green-800" };
  };

  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock);
  const expiringItems = inventory.filter(item => {
    if (!item.expiryDate) return false;
    const expiryDate = new Date(item.expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow;
  });

  const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.pricePerUnit), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-medical-500" />
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        </div>
        <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
          <DialogTrigger asChild>
            <Button className="bg-medical-500 hover:bg-medical-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Item Name" />
                <Input placeholder="Item ID" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Unit (Tablets, Pieces, etc.)" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="Current Stock" type="number" />
                <Input placeholder="Min Stock" type="number" />
                <Input placeholder="Max Stock" type="number" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Price per Unit (₹)" type="number" />
                <Input placeholder="Supplier" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Batch Number" />
                <Input placeholder="Expiry Date" type="date" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsAddItemOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button className="bg-medical-500 hover:bg-medical-600">
                  Add Item
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{inventory.length}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
            <div className="text-sm text-gray-600">Low Stock Alerts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{expiringItems.length}</div>
            <div className="text-sm text-gray-600">Expiring Soon</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">₹{totalValue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockItems.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span>{item.name}</span>
                      <Badge variant="outline" className="text-red-600">
                        {item.currentStock} {item.unit}
                      </Badge>
                    </div>
                  ))}
                  {lowStockItems.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{lowStockItems.length - 3} more items
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {expiringItems.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <Calendar className="h-5 w-5" />
                  Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span>{item.name}</span>
                      <Badge variant="outline" className="text-yellow-600">
                        {item.expiryDate}
                      </Badge>
                    </div>
                  ))}
                  {expiringItems.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{expiringItems.length - 3} more items
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by item name, ID, or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory List */}
      <div className="space-y-4">
        {filteredInventory.map((item) => {
          const stockStatus = getStockStatus(item.currentStock, item.minStock, item.maxStock);
          const stockPercentage = (item.currentStock / item.maxStock) * 100;
          
          return (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-medical-50 rounded-lg">
                      <Package className="h-5 w-5 text-medical-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{item.id}</span>
                        <span>•</span>
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{item.supplier}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {item.currentStock} {item.unit}
                    </div>
                    <Badge className={stockStatus.color}>
                      {stockStatus.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Stock Level</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          stockPercentage <= (item.minStock / item.maxStock) * 100 
                            ? 'bg-red-500' 
                            : stockPercentage >= 90 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Min: {item.minStock} | Max: {item.maxStock}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Unit Price</div>
                    <div className="font-medium">₹{item.pricePerUnit}</div>
                    <div className="text-sm text-gray-500">
                      Total: ₹{(item.currentStock * item.pricePerUnit).toLocaleString()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Batch & Expiry</div>
                    <div className="font-medium">{item.batchNumber}</div>
                    <div className="text-sm text-gray-500">
                      {item.expiryDate ? `Exp: ${item.expiryDate}` : 'No expiry'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Last Restocked</div>
                    <div className="font-medium">{item.lastRestocked}</div>
                    <div className="text-sm text-gray-500">
                      {Math.floor((new Date().getTime() - new Date(item.lastRestocked).getTime()) / (1000 * 60 * 60 * 24))} days ago
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Restock
                  </Button>
                  <Button variant="outline" size="sm">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    Update Stock
                  </Button>
                  <Button variant="outline" size="sm">
                    <Truck className="h-4 w-4 mr-1" />
                    Order History
                  </Button>
                  <Button variant="outline" size="sm">
                    Edit Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredInventory.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Inventory;
