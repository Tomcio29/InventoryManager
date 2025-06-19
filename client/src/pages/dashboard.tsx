import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AssetMap } from "@/components/map/asset-map";
import { AssetCard } from "@/components/asset/asset-card";
import { 
  Boxes, 
  Warehouse, 
  MapPin, 
  PieChart,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useAssets } from "@/hooks/use-assets";
import { useWarehouse } from "@/hooks/use-warehouse";

export default function Dashboard() {
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const { data: warehouse, isLoading: warehouseLoading } = useWarehouse();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (assetsLoading || warehouseLoading || statsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentAssets = assets.slice(0, 3);

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalAssets || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Boxes className="text-primary text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-accent flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                Active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Warehouse</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.inWarehouse || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Warehouse className="text-accent text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500">
                Capacity: {stats?.capacityUsed || 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Field</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.inField || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <MapPin className="text-warning text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {stats?.inField > 0 && (
                <span className="text-sm text-warning flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Deployed
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Free Space</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.freeSpace || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <PieChart className="text-purple-600 text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-accent h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${100 - (stats?.capacityUsed || 0)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Asset Map */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Asset Locations</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = "/map"}
                className="text-primary hover:text-blue-700"
              >
                View Full Map
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AssetMap assets={assets} warehouse={warehouse} height="320px" />
          </CardContent>
        </Card>

        {/* Recent Assets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Assets</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = "/assets"}
                className="text-primary hover:text-blue-700"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAssets.length > 0 ? (
                recentAssets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Boxes className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No assets found</p>
                  <p className="text-sm">Add your first asset to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Capacity */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Warehouse Capacity</CardTitle>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Coordinates: ({warehouse?.locationX || 0},{warehouse?.locationY || 0}) 
                Size: {warehouse?.width || 0}x{warehouse?.height || 0}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 relative">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth="2" fill="none"/>
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth="2" 
                    strokeDasharray={`${(stats?.capacityUsed || 0) * 0.628} ${(100 - (stats?.capacityUsed || 0)) * 0.628}`}
                    strokeLinecap="round" 
                    fill="none"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">{stats?.capacityUsed || 0}%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">Space Used</p>
              <p className="text-xs text-gray-500">
                {stats?.inWarehouse || 0} of {stats?.warehouseCapacity || 0} slots
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Boxes className="text-2xl text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Available Space</p>
              <p className="text-xs text-gray-500">{stats?.freeSpace || 0} slots remaining</p>
            </div>
            
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="text-2xl text-red-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Capacity Alert</p>
              <p className="text-xs text-gray-500">
                {(stats?.capacityUsed || 0) >= 80 ? "Near capacity!" : "Alert at 80% full"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
