import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AssetForm } from "@/components/asset/asset-form";
import { QRGenerator } from "@/components/qr/qr-generator";
import { useAssets } from "@/hooks/use-assets";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  QrCode, 
  MapPin,
  Building,
  AlertCircle 
} from "lucide-react";
import type { Asset } from "@shared/schema";

export default function Assets() {
  const { data: assets = [], isLoading } = useAssets();
  const { toast } = useToast();
  const [location] = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Check if we should show add modal from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    if (urlParams.get("action") === "add") {
      setShowAddModal(true);
    }
  }, [location]);

  const deleteMutation = useMutation({
    mutationFn: async (assetId: number) => {
      await apiRequest("DELETE", `/api/assets/${assetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Asset deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowEditModal(true);
  };

  const handleDelete = (asset: Asset) => {
    if (confirm(`Are you sure you want to delete ${asset.name}?`)) {
      deleteMutation.mutate(asset.id);
    }
  };

  const handleShowQR = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowQRModal(true);
  };

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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-4">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-gray-600">Manage your inventory assets</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-accent hover:bg-green-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first asset</p>
            <Button onClick={() => setShowAddModal(true)} className="bg-accent hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Add First Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <Card key={asset.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{asset.name}</CardTitle>
                    <p className="text-sm text-gray-500">{asset.assetId}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {asset.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge className={getStatusColor(asset.status)}>
                      {getStatusIcon(asset.status, asset.inWarehouse)}
                      <span className="ml-1">
                        {asset.inWarehouse ? "In Warehouse" : "In Field"}
                      </span>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm font-medium">
                      ({asset.locationX}, {asset.locationY})
                    </span>
                  </div>

                  <div className="flex space-x-2 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShowQR(asset)}
                      className="flex-1"
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      QR
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(asset)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(asset)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Asset Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <AssetForm 
            onSuccess={() => setShowAddModal(false)}
            onCancel={() => setShowAddModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Asset Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          <AssetForm 
            asset={selectedAsset}
            onSuccess={() => setShowEditModal(false)}
            onCancel={() => setShowEditModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Asset QR Code</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <QRGenerator 
              value={selectedAsset.qrCode}
              assetName={selectedAsset.name}
              assetId={selectedAsset.assetId}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
