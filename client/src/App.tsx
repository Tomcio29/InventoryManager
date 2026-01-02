import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import Dashboard from "@/pages/dashboard";
import Assets from "@/pages/assets";
import AssetMap from "@/pages/asset-map";
import QRScanner from "@/pages/qr-scanner";
import Warehouse from "@/pages/warehouse";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopHeader />
            <main className="flex-1 overflow-auto">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/assets" component={Assets} />
                <Route path="/map" component={AssetMap} />
                <Route path="/scanner" component={QRScanner} />
                <Route path="/warehouse" component={Warehouse} />
                <Route path="/admin" component={Admin} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
