import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Warehouse, 
  Boxes, 
  MapPin, 
  QrCode, 
  Building, 
  Settings,
  BarChart3
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Manage Assets", href: "/assets", icon: Boxes },
  { name: "Asset Map", href: "/map", icon: MapPin },
  { name: "QR Scanner", href: "/scanner", icon: QrCode },
  { name: "Warehouse", href: "/warehouse", icon: Building },
  { name: "Admin Panel", href: "/admin", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Warehouse className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Inventory Manager</h1>
            <p className="text-sm text-gray-500">Asset Tracking</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg font-medium transition-colors",
                  isActive
                    ? "text-primary bg-blue-50"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <Settings className="text-gray-600 w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}
