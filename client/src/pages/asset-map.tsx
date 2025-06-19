import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetMap } from "@/components/map/asset-map";
import { useAssets } from "@/hooks/use-assets";
import { useWarehouse } from "@/hooks/use-warehouse";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building, Truck } from "lucide-react";

export default function AssetMapPage() {
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const { data: warehouse, isLoading: warehouseLoading } = useWarehouse();

  if (assetsLoading || warehouseLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const warehouseAssets = assets.filter(asset => asset.inWarehouse);
  const fieldAssets = assets.filter(asset => !asset.inWarehouse);

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Asset Locations Map</CardTitle>
            </CardHeader>
            <CardContent>
              <AssetMap assets={assets} warehouse={warehouse} height="600px" showControls />
            </CardContent>
          </Card>
        </div>

        {/* Legend and Stats */}
        <div className="space-y-6">
          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Map Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm">In Warehouse</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span className="text-sm">In Field</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm">In Transit</span>
              </div>
              <div className="border-2 border-dashed border-green-400 p-2 text-xs text-center rounded">
                Warehouse Boundary
              </div>
            </CardContent>
          </Card>

          {/* Asset Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Location Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-green-600" />
                  <span className="text-sm">In Warehouse</span>
                </div>
                <Badge variant="secondary">{warehouseAssets.length}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span className="text-sm">In Field</span>
                </div>
                <Badge variant="secondary">{fieldAssets.length}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Total Assets</span>
                </div>
                <Badge variant="secondary">{assets.length}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Info */}
          {warehouse && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Warehouse Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{warehouse.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">({warehouse.locationX}, {warehouse.locationY})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Size</p>
                  <p className="font-medium">{warehouse.width} × {warehouse.height}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Capacity</p>
                  <p className="font-medium">
                    {warehouse.currentCount} / {warehouse.maxCapacity}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all" 
                      style={{ 
                        width: `${(warehouse.currentCount / warehouse.maxCapacity) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
