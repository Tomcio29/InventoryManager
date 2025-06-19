import { useState } from "react";
import { Search, QrCode, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

const pageNames: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Monitor and manage your inventory assets" },
  "/assets": { title: "Asset Management", description: "Create, edit, and manage your assets" },
  "/map": { title: "Asset Map", description: "View asset locations on interactive map" },
  "/scanner": { title: "QR Scanner", description: "Scan QR codes to locate assets" },
  "/warehouse": { title: "Warehouse", description: "Manage warehouse capacity and layout" },
  "/admin": { title: "Admin Panel", description: "Administrative tools and settings" },
};

export function TopHeader() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const currentPage = pageNames[location] || { title: "Page", description: "" };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/scanner?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleScanQR = () => {
    setLocation("/scanner");
  };

  const handleAddAsset = () => {
    setLocation("/assets?action=add");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{currentPage.title}</h2>
          <p className="text-gray-600">{currentPage.description}</p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Search assets by ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </form>
          
          {/* QR Scanner Button */}
          <Button onClick={handleScanQR} className="bg-primary hover:bg-blue-700">
            <QrCode className="mr-2 h-4 w-4" />
            Scan QR
          </Button>
          
          {/* Add Asset Button */}
          <Button onClick={handleAddAsset} className="bg-accent hover:bg-green-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>
    </header>
  );
}
