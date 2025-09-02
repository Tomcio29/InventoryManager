import { useEffect, useRef } from "react";
import type { Asset, Warehouse } from "@shared/schema";

interface AssetMapProps {
  assets: Asset[];
  warehouse?: Warehouse;
  height?: string;
  showControls?: boolean;
}

export function AssetMap({ assets, warehouse, height = "400px", showControls = false }: AssetMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Define coordinate system - show area from -50 to 250 (warehouse is 0-100)
    const mapWidth = 300; // -50 to 250 total range
    const mapHeight = 300; // -50 to 250 total range
    const mapOffsetX = 50; // offset to show negative coordinates
    const mapOffsetY = 50; // offset to show negative coordinates
    const scaleX = rect.width / mapWidth;
    const scaleY = rect.height / mapHeight;

    // Convert world coordinates to canvas coordinates
    const worldToCanvas = (x: number, y: number) => ({
      x: (x + mapOffsetX) * scaleX,
      y: (y + mapOffsetY) * scaleY,
    });

    // Draw warehouse boundary if available
    if (warehouse) {
      const warehouseX = parseFloat(warehouse.locationX);
      const warehouseY = parseFloat(warehouse.locationY);
      const warehouseWidth = parseFloat(warehouse.width);
      const warehouseHeight = parseFloat(warehouse.height);

      // Debug: log warehouse bounds
      console.log('Warehouse bounds:', {
        x: warehouseX,
        y: warehouseY,
        width: warehouseWidth,
        height: warehouseHeight,
        maxX: warehouseX + warehouseWidth,
        maxY: warehouseY + warehouseHeight
      });

      const topLeft = worldToCanvas(warehouseX, warehouseY);
      const bottomRight = worldToCanvas(
        warehouseX + warehouseWidth,
        warehouseY + warehouseHeight
      );

      // Draw warehouse rectangle
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
      );
      ctx.setLineDash([]);

      // Fill warehouse with light green
      ctx.fillStyle = "rgba(74, 222, 128, 0.1)";
      ctx.fillRect(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
      );

      // Add warehouse label
      ctx.fillStyle = "#16a34a";
      ctx.font = "12px sans-serif";
      ctx.fillText("Warehouse", topLeft.x + 5, topLeft.y + 15);
      
      // Debug: show exact coordinates on map
      ctx.fillStyle = "#16a34a";
      ctx.font = "10px sans-serif";
      ctx.fillText(`(${warehouseX},${warehouseY})`, topLeft.x + 5, topLeft.y + 30);
      ctx.fillText(`(${warehouseX + warehouseWidth},${warehouseY + warehouseHeight})`, bottomRight.x - 60, bottomRight.y - 5);
    }

    // Draw grid lines
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    
    // Vertical lines - every 25 units from -50 to 250
    for (let x = -50; x <= 250; x += 25) {
      const pos = worldToCanvas(x, 0);
      if (pos.x >= 0 && pos.x <= rect.width) {
        ctx.beginPath();
        ctx.moveTo(pos.x, 0);
        ctx.lineTo(pos.x, rect.height);
        ctx.stroke();
      }
    }
    
    // Horizontal lines - every 25 units from -50 to 250
    for (let y = -50; y <= 250; y += 25) {
      const pos = worldToCanvas(0, y);
      if (pos.y >= 0 && pos.y <= rect.height) {
        ctx.beginPath();
        ctx.moveTo(0, pos.y);
        ctx.lineTo(rect.width, pos.y);
        ctx.stroke();
      }
    }

    // Draw assets
    assets.forEach((asset) => {
      const x = parseFloat(asset.locationX);
      const y = parseFloat(asset.locationY);
      const pos = worldToCanvas(x, y);

      // Debug: log first 3 assets
      if (assets.indexOf(asset) < 3) {
        console.log(`Asset ${asset.name}: coords (${x},${y}), status: ${asset.status}, inWarehouse: ${asset.inWarehouse}`);
      }

      // Choose color based on status
      let color = "#3b82f6"; // blue for in_transit
      if (asset.status === "in_warehouse") {
        color = "#10b981"; // green
      } else if (asset.status === "in_field") {
        color = "#f59e0b"; // orange
      }

      // Draw asset marker
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Draw white border
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add asset ID label if space allows
      if (showControls) {
        ctx.fillStyle = "#374151";
        ctx.font = "10px sans-serif";
        const text = asset.assetId.substring(0, 8);
        const textWidth = ctx.measureText(text).width;
        ctx.fillText(text, pos.x - textWidth / 2, pos.y - 10);
        
        // Add coordinates for debugging
        ctx.fillStyle = "#6b7280";
        ctx.font = "8px sans-serif";
        const coordText = `(${asset.locationX},${asset.locationY})`;
        const coordWidth = ctx.measureText(coordText).width;
        ctx.fillText(coordText, pos.x - coordWidth / 2, pos.y + 15);
        
        // Add status indicator
        ctx.fillStyle = asset.status === "in_warehouse" ? "#16a34a" : "#ea580c";
        ctx.font = "8px sans-serif";
        const statusText = asset.status === "in_warehouse" ? "WH" : "FIELD";
        const statusWidth = ctx.measureText(statusText).width;
        ctx.fillText(statusText, pos.x - statusWidth / 2, pos.y + 25);
      }
    });

    // Draw coordinate labels
    if (showControls) {
      ctx.fillStyle = "#6b7280";
      ctx.font = "12px sans-serif";
      
      // X-axis labels - from -50 to 250, every 50 units
      for (let x = -50; x <= 250; x += 50) {
        const pos = worldToCanvas(x, -20);
        if (pos.x >= 0 && pos.x <= rect.width) {
          ctx.fillText(x.toString(), pos.x - 10, 15);
        }
      }
      
      // Y-axis labels - from -50 to 250, every 50 units  
      for (let y = -50; y <= 250; y += 50) {
        const pos = worldToCanvas(-30, y);
        if (pos.y >= 0 && pos.y <= rect.height) {
          ctx.fillText(y.toString(), 5, pos.y + 5);
        }
      }
      
      // Add warehouse boundary markers
      if (warehouse) {
        ctx.fillStyle = "#16a34a";
        ctx.font = "10px sans-serif";
        const warehouseMaxX = parseFloat(warehouse.locationX) + parseFloat(warehouse.width);
        const warehouseMaxY = parseFloat(warehouse.locationY) + parseFloat(warehouse.height);
        
        // Mark warehouse corners
        const corners = [
          { x: parseFloat(warehouse.locationX), y: parseFloat(warehouse.locationY), label: "WH(0,0)" },
          { x: warehouseMaxX, y: warehouseMaxY, label: `WH(${warehouseMaxX},${warehouseMaxY})` }
        ];
        
        corners.forEach(corner => {
          const pos = worldToCanvas(corner.x, corner.y);
          ctx.fillText(corner.label, pos.x + 8, pos.y - 8);
        });
      }
    }

  }, [assets, warehouse, showControls]);

  return (
    <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Warehouse</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Field</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Transit</span>
          </div>
        </div>
      </div>

      {/* Asset count */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2 text-sm font-medium">
        {assets.length} assets
      </div>
    </div>
  );
}
