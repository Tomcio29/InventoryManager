import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRScanner } from "@/components/qr/qr-scanner";
import { AssetCard } from "@/components/asset/asset-card";
import { useToast } from "@/hooks/use-toast";
import { useAssetByAssetId } from "@/hooks/use-assets";
import { Camera, Search, QrCode, AlertCircle } from "lucide-react";
import type { Asset } from "@shared/schema";

export default function QRScannerPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [manualId, setManualId] = useState("");
  const [searchId, setSearchId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [foundAsset, setFoundAsset] = useState<Asset | null>(null);

  // Check if we should search immediately from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const searchParam = urlParams.get("search");
    if (searchParam) {
      setSearchId(searchParam);
      setManualId(searchParam);
    }
  }, [location]);

  const { data: asset, isLoading, error } = useAssetByAssetId(searchId);

  useEffect(() => {
    if (asset && asset.name) {
      setFoundAsset(asset);
      toast({
        title: "Asset Found!",
        description: `Located ${asset.name}`,
      });
    } else if (error && searchId) {
      setFoundAsset(null);
      toast({
        title: "Asset Not Found",
        description: `No asset found with ID: ${searchId}`,
        variant: "destructive",
      });
    }
  }, [asset, error, searchId, toast]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      setSearchId(manualId.trim());
    }
  };

  const handleQRScan = (result: string) => {
    console.log('🎯 QR scan handler called with result:', result);
    
    setSearchId(result);
    setManualId(result);
    setIsScanning(false);
    toast({
      title: "QR Code Scanned",
      description: `Searching for asset: ${result}`,
    });
    
    console.log('📝 Search ID set to:', result);
  };

  const handleScanError = (error: string) => {
    toast({
      title: "Scan Error",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* QR Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="w-5 h-5 mr-2" />
                QR Code Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isScanning ? (
                <div className="space-y-4">
                  <QRScanner onScan={handleQRScan} onError={handleScanError} />
                  <Button 
                    onClick={() => setIsScanning(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Stop Scanning
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-lg h-64 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera className="w-16 h-16 mx-auto mb-3" />
                      <p className="text-lg mb-2">Camera Scanner</p>
                      <p className="text-sm text-gray-300">Click to start scanning QR codes</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setIsScanning(true)}
                    className="w-full bg-primary hover:bg-blue-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Scanning
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Manual Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSearch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset ID
                  </label>
                  <Input
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="Enter Asset ID (e.g., E123456-2024)"
                    className="w-full"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-accent hover:bg-green-600"
                  disabled={!manualId.trim() || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Searching...
                    </div>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search Asset
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Search Tips:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Enter the complete Asset ID</li>
                  <li>• Asset IDs typically follow format: X123456-2024</li>
                  <li>• Use QR scanner for more accurate results</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="mt-8">
          {foundAsset ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Asset Found!</CardTitle>
              </CardHeader>
              <CardContent>
                <AssetCard asset={foundAsset} showLocation />
              </CardContent>
            </Card>
          ) : searchId && !isLoading && error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Asset Not Found</h3>
                <p className="text-gray-500 mb-4">
                  No asset found with ID: <code className="bg-gray-100 px-2 py-1 rounded">{searchId}</code>
                </p>
                <p className="text-sm text-gray-400">
                  Please check the Asset ID and try again, or use the QR scanner for better accuracy.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
