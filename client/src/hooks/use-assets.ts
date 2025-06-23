import { useQuery } from "@tanstack/react-query";
import type { Asset } from "@shared/schema";

export function useAssets() {
  return useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });
}

export function useAsset(id: number) {
  return useQuery<Asset>({
    queryKey: ["/api/assets", id],
    enabled: !!id,
  });
}

export function useAssetByAssetId(assetId: string) {
  return useQuery<Asset>({
    queryKey: [`/api/assets/find/${assetId}`],
    enabled: !!assetId,
  });
}
