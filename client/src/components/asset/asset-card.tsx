import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building, MapPin, Package } from "lucide-react";
import type { Asset } from "@shared/schema";

interface AssetCardProps {
  asset: Asset;
  compact?: boolean;
  showLocation?: boolean;
}

export function AssetCard({ asset, compact = false, showLocation = false }: AssetCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_warehouse": return "bg-green-100 text-green-800";
      case "in_field": return "bg-orange-100 text-orange-800";
      case "in_transit": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string, inWarehouse: boolean) => {
    if (inWarehouse) return <Building className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  const getCategoryIcon = (category: string) => {
    return <Package className="w-4 h-4" />;
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900 truncate">{asset.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {asset.category}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mb-3">{asset.assetId}</p>
          <div className="flex items-center justify-between">
            <Badge className={`${getStatusColor(asset.status)} text-xs`}>
              {getStatusIcon(asset.status, asset.inWarehouse)}
              <span className="ml-1">
                {asset.inWarehouse ? "Warehouse" : "Field"}
              </span>
            </Badge>
            <span className="text-xs text-gray-500">
              ({asset.locationX}, {asset.locationY})
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
          {getCategoryIcon(asset.category)}
        </div>
        <div>
          <p className="font-medium text-gray-900">{asset.name}</p>
          <p className="text-sm text-gray-500">{asset.assetId}</p>
          {showLocation && (
            <p className="text-xs text-gray-400 mt-1">
              Coordinates: ({asset.locationX}, {asset.locationY})
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        <Badge className={getStatusColor(asset.status)}>
          {getStatusIcon(asset.status, asset.inWarehouse)}
          <span className="ml-1">
            {asset.inWarehouse ? "In Warehouse" : "In Field"}
          </span>
        </Badge>
        {!showLocation && (
          <p className="text-sm text-gray-500 mt-1">
            ({asset.locationX}, {asset.locationY})
          </p>
        )}
      </div>
    </div>
  );
}
