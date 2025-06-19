import { useQuery } from "@tanstack/react-query";
import type { Warehouse } from "@shared/schema";

export function useWarehouse() {
  return useQuery<Warehouse>({
    queryKey: ["/api/warehouse"],
  });
}

export function useWarehouseInit() {
  return useQuery<Warehouse>({
    queryKey: ["/api/warehouse/init"],
  });
}
