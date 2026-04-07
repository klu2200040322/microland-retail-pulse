import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id?: string;
  product_name: string;
  category: string;
  stock_level: number;
  price: number;
  reorder_point: number;
}

const emptyItem: InventoryItem = {
  product_name: "",
  category: "",
  stock_level: 0,
  price: 0,
  reorder_point: 10,
};

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem>(emptyItem);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data } = await supabase.from("inventory").select("*").order("product_name");
      return data || [];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (item: InventoryItem) => {
      if (isEditing && item.id) {
        const { error } = await supabase.from("inventory").update({
          product_name: item.product_name,
          category: item.category,
          stock_level: item.stock_level,
          price: item.price,
          reorder_point: item.reorder_point,
        }).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("inventory").insert({
          product_name: item.product_name,
          category: item.category,
          stock_level: item.stock_level,
          price: item.price,
          reorder_point: item.reorder_point,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setDialogOpen(false);
      toast({ title: isEditing ? "Product updated" : "Product added" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Product deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openAdd = () => {
    setEditItem(emptyItem);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const filtered = inventory?.filter(
    (item) =>
      item.product_name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Inventory</h2>
        <div className="flex gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={openAdd} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Reorder At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No products found</TableCell></TableRow>
                ) : (
                  filtered?.map((item) => {
                    const isLow = item.stock_level < item.reorder_point;
                    return (
                      <TableRow key={item.id} className={isLow ? "bg-destructive/5" : ""}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                        <TableCell className={`text-right font-semibold ${isLow ? "text-destructive" : ""}`}>{item.stock_level}</TableCell>
                        <TableCell className="text-right">{item.reorder_point}</TableCell>
                        <TableCell>
                          {isLow ? (
                            <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Low Stock</Badge>
                          ) : (
                            <Badge variant="outline" className="text-success border-success/30">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              upsertMutation.mutate(editItem);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input value={editItem.product_name} onChange={(e) => setEditItem({ ...editItem, product_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={editItem.category} onChange={(e) => setEditItem({ ...editItem, category: e.target.value })} required />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Price</Label>
                <Input type="number" step="0.01" min="0" value={editItem.price} onChange={(e) => setEditItem({ ...editItem, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" min="0" value={editItem.stock_level} onChange={(e) => setEditItem({ ...editItem, stock_level: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Reorder Point</Label>
                <Input type="number" min="0" value={editItem.reorder_point} onChange={(e) => setEditItem({ ...editItem, reorder_point: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Saving..." : isEditing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
