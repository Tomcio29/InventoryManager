import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAssets } from "@/hooks/use-assets";
import { useWarehouse } from "@/hooks/use-warehouse";
import { AssetCard } from "@/components/asset/asset-card";
import { 
  Building, 
  Package, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  MapPin
} from "lucide-react";

export default function Warehouse() {
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const { data: warehouse, isLoading: warehouseLoading } = useWarehouse();

  if (assetsLoading || warehouseLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 h-32">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const warehouseAssets = assets.filter(asset => asset.inWarehouse);
  const capacityUsed = warehouse ? (warehouse.currentCount / warehouse.maxCapacity) * 100 : 0;
  const isNearCapacity = capacityUsed >= 80;
  const isFull = capacityUsed >= 100;

  return (
    <div className="p-6">
      {/* Warehouse Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Capacity</p>
                <p className="text-3xl font-bold text-gray-900">
                  {warehouse?.currentCount || 0}
                </p>
                <p className="text-sm text-gray-500">
                  of {warehouse?.maxCapacity || 0} slots
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="text-primary text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={capacityUsed} className="h-3" />
              <p className="text-xs text-gray-500 mt-1">{capacityUsed.toFixed(1)}% full</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Space</p>
                <p className="text-3xl font-bold text-gray-900">
                  {warehouse ? warehouse.maxCapacity - warehouse.currentCount : 0}
                </p>
                <p className="text-sm text-gray-500">slots remaining</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-accent text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Ready for new assets</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <div className="mt-2">
                  {isFull ? (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Full
                    </Badge>
                  ) : isNearCapacity ? (
                    <Badge className="bg-orange-100 text-orange-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Near Capacity
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Available
                    </Badge>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building className="text-purple-600 text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                {isFull 
                  ? "Cannot add more assets" 
                  : isNearCapacity 
                    ? "Approaching capacity limit"
                    : "Space available for new assets"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Details */}
      {warehouse && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Warehouse Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Name</p>
                <p className="text-lg font-semibold">{warehouse.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Location</p>
                <p className="text-lg font-semibold">
                  ({warehouse.locationX}, {warehouse.locationY})
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Dimensions</p>
                <p className="text-lg font-semibold">
                  {warehouse.width} × {warehouse.height}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Maximum Capacity</p>
                <p className="text-lg font-semibold">{warehouse.maxCapacity} slots</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assets in Warehouse */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Assets in Warehouse ({warehouseAssets.length})
            </CardTitle>
            {warehouseAssets.length > 0 && (
              <Badge variant="secondary">
                {warehouseAssets.length} of {warehouse?.maxCapacity || 0}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {warehouseAssets.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assets in Warehouse</h3>
              <p className="text-gray-500">
                The warehouse is currently empty. Add some assets to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouseAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} compact />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Capacity Warning */}
      {isNearCapacity && (
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900">Capacity Warning</h3>
                <p className="text-orange-800 mt-1">
                  {isFull 
                    ? "Your warehouse is at full capacity. You cannot add more assets until some are moved out."
                    : "Your warehouse is approaching full capacity. Consider moving some assets to the field or expanding capacity."
                  }
                </p>
                {!isFull && (
                  <p className="text-sm text-orange-700 mt-2">
                    Space remaining: {warehouse ? warehouse.maxCapacity - warehouse.currentCount : 0} slots
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
