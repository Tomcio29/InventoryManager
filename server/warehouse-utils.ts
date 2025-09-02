// Utility function do sprawdzania czy asset jest w granicach warehouse
import type { Warehouse } from "@shared/schema";

export function isAssetInWarehouseBounds(
  assetX: number | string, 
  assetY: number | string, 
  warehouse: Warehouse
): boolean {
  const x = typeof assetX === 'string' ? parseFloat(assetX) : assetX;
  const y = typeof assetY === 'string' ? parseFloat(assetY) : assetY;
  
  const warehouseX = parseFloat(warehouse.locationX);
  const warehouseY = parseFloat(warehouse.locationY);
  const warehouseWidth = parseFloat(warehouse.width);
  const warehouseHeight = parseFloat(warehouse.height);
  
  const warehouseMaxX = warehouseX + warehouseWidth;
  const warehouseMaxY = warehouseY + warehouseHeight;
  
  return x >= warehouseX && x <= warehouseMaxX && 
         y >= warehouseY && y <= warehouseMaxY;
}

export function determineAssetStatus(
  assetX: number | string,
  assetY: number | string,
  warehouse: Warehouse
): { inWarehouse: boolean; status: string } {
  const inWarehouse = isAssetInWarehouseBounds(assetX, assetY, warehouse);
  return {
    inWarehouse,
    status: inWarehouse ? 'in_warehouse' : 'in_field'
  };
}

export function getWarehouseBounds(warehouse: Warehouse) {
  const warehouseX = parseFloat(warehouse.locationX);
  const warehouseY = parseFloat(warehouse.locationY);
  const warehouseWidth = parseFloat(warehouse.width);
  const warehouseHeight = parseFloat(warehouse.height);
  
  return {
    minX: warehouseX,
    minY: warehouseY,
    maxX: warehouseX + warehouseWidth,
    maxY: warehouseY + warehouseHeight
  };
}
