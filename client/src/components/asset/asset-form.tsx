import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWarehouse } from "@/hooks/use-warehouse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { insertAssetSchema, updateAssetSchema, type Asset } from "@shared/schema";
import { z } from "zod";
import { AlertTriangle } from "lucide-react";

const formSchema = insertAssetSchema.extend({
  locationX: z.coerce.number(),
  locationY: z.coerce.number(),
});

const updateFormSchema = updateAssetSchema.extend({
  locationX: z.coerce.number().optional(),
  locationY: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;
type UpdateFormData = z.infer<typeof updateFormSchema>;

interface AssetFormProps {
  asset?: Asset | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AssetForm({ asset, onSuccess, onCancel }: AssetFormProps) {
  const { toast } = useToast();
  const { data: warehouse } = useWarehouse();
  const isEdit = !!asset;

  const form = useForm<FormData | UpdateFormData>({
    resolver: zodResolver(isEdit ? updateFormSchema : formSchema),
    defaultValues: isEdit ? {
      name: asset.name,
      category: asset.category,
      status: asset.status,
      locationX: parseFloat(asset.locationX),
      locationY: parseFloat(asset.locationY),
      inWarehouse: asset.inWarehouse,
    } : {
      name: "",
      category: "",
      status: "in_warehouse",
      locationX: 50,
      locationY: 50,
      inWarehouse: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/assets", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse"] });
      toast({
        title: "Success",
        description: "Asset created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateFormData) => {
      const response = await apiRequest("PATCH", `/api/assets/${asset!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse"] });
      toast({
        title: "Success",
        description: "Asset updated successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData | UpdateFormData) => {
    if (isEdit) {
      updateMutation.mutate(data as UpdateFormData);
    } else {
      createMutation.mutate(data as FormData);
    }
  };

  const isWarehouseFull = warehouse && warehouse.currentCount >= warehouse.maxCapacity;
  const inWarehouseValue = form.watch("inWarehouse");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Warning for full warehouse */}
      {!isEdit && isWarehouseFull && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Warehouse is at full capacity. New assets can only be placed in the field.
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="name">Asset Name *</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="Enter asset name"
          className="mt-1"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="category">Category *</Label>
        <Select
          value={form.watch("category") || ""}
          onValueChange={(value) => form.setValue("category", value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="tools">Tools & Equipment</SelectItem>
            <SelectItem value="furniture">Furniture</SelectItem>
            <SelectItem value="supplies">Supplies</SelectItem>
            <SelectItem value="vehicles">Vehicles</SelectItem>
            <SelectItem value="machinery">Machinery</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.category && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.category.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="locationX">X Coordinate *</Label>
          <Input
            id="locationX"
            type="number"
            {...form.register("locationX")}
            placeholder="X coordinate"
            className="mt-1"
          />
          {form.formState.errors.locationX && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.locationX.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="locationY">Y Coordinate *</Label>
          <Input
            id="locationY"
            type="number"
            {...form.register("locationY")}
            placeholder="Y coordinate"
            className="mt-1"
          />
          {form.formState.errors.locationY && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.locationY.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="inWarehouse"
          checked={inWarehouseValue}
          onCheckedChange={(checked) => {
            if (!isEdit && isWarehouseFull && checked) {
              toast({
                title: "Warehouse Full",
                description: "Cannot place asset in warehouse - capacity reached",
                variant: "destructive",
              });
              return;
            }
            form.setValue("inWarehouse", checked);
            form.setValue("status", checked ? "in_warehouse" : "in_field");
          }}
          disabled={!isEdit && isWarehouseFull}
        />
        <Label htmlFor="inWarehouse">Place in warehouse</Label>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          className="flex-1 bg-primary hover:bg-blue-700"
        >
          {createMutation.isPending || updateMutation.isPending ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {isEdit ? "Updating..." : "Creating..."}
            </div>
          ) : (
            <>
              {isEdit ? "Update Asset" : "Create Asset"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
