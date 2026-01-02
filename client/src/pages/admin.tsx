import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAssets } from "@/hooks/use-assets";
import { useWarehouse } from "@/hooks/use-warehouse";
import { 
  Shuffle, 
  Settings, 
  Database, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RotateCcw
} from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const { data: assets = [] } = useAssets();
  const { data: warehouse } = useWarehouse();
  const [isMoving, setIsMoving] = useState(false);
  const [reports, setReports] = useState<Array<any>>([]);
  const [events, setEvents] = useState<Array<any>>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [openReportIds, setOpenReportIds] = useState<Record<string, boolean>>({});
  const [openEventIds, setOpenEventIds] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'recon'>('overview');

  const moveAssetsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/move-assets");
      return response.json();
    },
    onMutate: () => {
      setIsMoving(true);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse"] });
      
      toast({
        title: "Assets Moved",
        description: `Successfully moved ${data.assets.length} assets to random locations`,
      });
      setIsMoving(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsMoving(false);
    },
  });

  const handleMoveAssets = () => {
    if (assets.length === 0) {
      toast({
        title: "No Assets",
        description: "There are no assets to move",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`This will randomly move all ${assets.length} assets. Are you sure?`)) {
      moveAssetsMutation.mutate();
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await apiRequest('GET', '/api/admin/recon-reports');
      const data = await res.json();
      setReports(data);
    } catch (e: any) {
      toast({ title: 'Error fetching reports', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await apiRequest('GET', '/api/admin/audit-events');
      const data = await res.json();
      setEvents(data);
    } catch (e: any) {
      toast({ title: 'Error fetching events', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    // fetch initial data for admin view
    fetchReports();
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capacityUsed = warehouse ? (warehouse.currentCount / warehouse.maxCapacity) * 100 : 0;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Admin Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            Admin Panel
          </h1>
          <p className="text-gray-600">Administrative tools and system management</p>

          {/* Tabs */}
          <div className="mt-4 flex items-center space-x-2">
            <Button variant={activeTab === 'overview' ? undefined : 'ghost'} onClick={() => setActiveTab('overview')}>Overview</Button>
            <Button variant={activeTab === 'recon' ? undefined : 'ghost'} onClick={() => { setActiveTab('recon'); if (!reports.length) fetchReports(); if (!events.length) fetchEvents(); }}>Reconciliation</Button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Assets</p>
                  <p className="text-3xl font-bold text-gray-900">{assets.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Database className="text-primary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Warehouse Usage</p>
                  <p className="text-3xl font-bold text-gray-900">{capacityUsed.toFixed(0)}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-accent text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Status</p>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-lg font-semibold text-green-600">Online</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

          {/* Asset Management Tools */}
          <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shuffle className="w-5 h-5 mr-2" />
              Asset Movement Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Random Movement */}
            <div className="border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Random Asset Movement
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Simulate asset movement by randomly relocating all assets to new coordinates. 
                    This tool is useful for testing the tracking system and map visualization.
                  </p>
                  
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This action will move all {assets.length} assets to random locations 
                      and randomly assign them to warehouse or field status.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={handleMoveAssets}
                      disabled={isMoving || assets.length === 0}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isMoving ? (
                        <div className="flex items-center">
                          <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                          Moving Assets...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Shuffle className="w-4 h-4 mr-2" />
                          Move All Assets Randomly
                        </div>
                      )}
                    </Button>
                    
                    {assets.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No assets available to move
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Movement Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Movement Range</h4>
                <ul className="space-y-1">
                  <li>• X coordinates: -50 to 150</li>
                  <li>• Y coordinates: -50 to 150</li>
                  <li>• Random warehouse/field assignment</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Effects</h4>
                <ul className="space-y-1">
                  <li>• Updates asset coordinates</li>
                  <li>• Refreshes warehouse capacity</li>
                  <li>• Updates map visualization</li>
                  <li>• Triggers location change notifications</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

          </>
        )}

        {activeTab === 'recon' && (
          <>
            {/* Reconciliation Reports & Audit Events */}
            <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
              Reconciliation Reports & Audit Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Reconciliation Reports</h4>
                  <div className="flex items-center space-x-2">
                    <Button onClick={fetchReports} disabled={loadingReports}>
                      {loadingReports ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                </div>

                {reports.length === 0 ? (
                  <p className="text-sm text-gray-500">No reports available</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {reports.map((r) => {
                      const id = String(r.id || JSON.stringify(r));
                      const open = !!openReportIds[id];
                      return (
                        <div key={id} className="p-2 border rounded">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">{r.runAt || r.run_at || ''}</div>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-medium text-gray-700">{r.status}</div>
                              <Button size="sm" onClick={() => setOpenReportIds(prev => ({ ...prev, [id]: !prev[id] }))}>
                                {open ? 'Hide' : 'Show'}
                              </Button>
                            </div>
                          </div>
                          {open ? (
                            <pre className="text-sm mt-2 overflow-auto whitespace-pre-wrap">{JSON.stringify(r, null, 2)}</pre>
                          ) : (
                            <div className="text-sm text-gray-600 mt-2 truncate">{JSON.stringify(r.diff || r, null, 2).slice(0, 200)}{String(r.diff || r).length > 200 ? '…' : ''}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Audit Events</h4>
                  <div className="flex items-center space-x-2">
                    <Button onClick={fetchEvents} disabled={loadingEvents}>
                      {loadingEvents ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                </div>

                {events.length === 0 ? (
                  <p className="text-sm text-gray-500">No audit events available</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {events.map((e) => {
                      const id = String(e.id || JSON.stringify(e));
                      const open = !!openEventIds[id];
                      return (
                        <div key={id} className="p-2 border rounded">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">{e.createdAt || e.created_at || ''}</div>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-medium text-gray-700">{e.eventType || e.type}</div>
                              <Button size="sm" onClick={() => setOpenEventIds(prev => ({ ...prev, [id]: !prev[id] }))}>
                                {open ? 'Hide' : 'Show'}
                              </Button>
                            </div>
                          </div>
                          {open ? (
                            <pre className="text-sm mt-2 overflow-auto whitespace-pre-wrap">{JSON.stringify(e, null, 2)}</pre>
                          ) : (
                            <div className="text-sm text-gray-600 mt-2 truncate">{JSON.stringify(e.payload || e, null, 2).slice(0, 200)}{String(e.payload || e).length > 200 ? '…' : ''}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
            </Card>
          </>
        )}

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Database Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assets Table:</span>
                    <span className="text-green-600 font-medium">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Warehouse Table:</span>
                    <span className="text-green-600 font-medium">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Records:</span>
                    <span className="font-medium">{assets.length + (warehouse ? 1 : 0)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Features</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>QR Code Generation</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>GPS Coordinate Tracking</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Interactive Mapping</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Warehouse Management</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
