import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCreateCustomer, useCustomers, useDeleteCustomer, useUpdateCustomer } from "@/features/customer/useCustomer";
import { UserPlus } from "lucide-react";

interface Customer {
  _id?: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const customerSchema = z.object({
  customerName: z.string().min(3, "Name must be at least 3 characters"),
  customerAddress: z.string().min(5, "Please provide a valid address"),
  customerPhone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .regex(/^\d+$/, "Phone must contain only digits"),
  state: z.string().min(2, "State is required"),
});
type CustomerFormInputs = z.infer<typeof customerSchema>;

// ─── Form ─────────────────────────────────────────────────────────────────────

const FIELDS = [
  { id: "customerName", label: "Full Name", type: "text" },
  { id: "customerAddress", label: "Address", type: "text" },
  { id: "customerPhone", label: "Phone Number", type: "tel" },
] as const;

const CustomerForm = ({
  customer,
  onSave,
  onCancel,
  isPending,
}: {
  customer: Customer | null;
  onSave: (data: Customer) => void;
  onCancel: () => void;
  isPending: boolean;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormInputs>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ?? { customerName: "", customerAddress: "", customerPhone: "" },
  });

  const onSubmit: SubmitHandler<CustomerFormInputs> = (data) =>
    onSave({ ...customer, ...data });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
      {FIELDS.map(({ id, label, type }) => (
        <div key={id} className="space-y-1.5">
          <Label htmlFor={id}>{label}</Label>
          <Input
            id={id}
            type={type}
            placeholder={label}
            {...register(id)}
          />
          {errors[id] && (
            <p className="text-xs text-red-500">{errors[id]?.message}</p>
          )}
        </div>
      ))}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : customer?._id ? "Update Customer" : "Add Customer"}
        </Button>
      </div>
    </form>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const CustomerPage = () => {
  const { data: customers = [], isLoading, error } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isPending = createCustomer.isPending || updateCustomer.isPending;

  const openAdd = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (c: Customer) => { setEditing(c); setIsFormOpen(true); };
  const closeForm = () => { setIsFormOpen(false); setEditing(null); };

  const handleSave = (data: Customer) => {
    if (data._id) updateCustomer.mutate(data, { onSuccess: closeForm });
    else createCustomer.mutate(data, { onSuccess: closeForm });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteCustomer.mutate(id, { onSettled: () => setDeletingId(null) });
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-sm">

          {/* Header */}
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  👥 Customers
                </CardTitle>
                <CardDescription className="mt-1">
                  View, add, and manage your customers.
                </CardDescription>
              </div>
              <Button onClick={openAdd} className="w-full sm:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </CardHeader>

          <CardContent>

            {/* Loading */}
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg border border-red-100">
                Failed to load customers. Please try again.
              </div>
            )}

            {/* Empty */}
            {!isLoading && !error && customers.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-medium mb-1">No customers yet</p>
                <p className="text-sm">Add your first customer to get started.</p>
              </div>
            )}

            {/* Desktop Table */}
            {!isLoading && customers.length > 0 && (
              <>
                <div className="hidden md:block rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        {["Name", "Phone", "Address", "Actions"].map((h) => (
                          <TableHead key={h} className="font-semibold text-foreground">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((c) => (
                        <TableRow key={c._id}>
                          <TableCell className="font-medium">{c.customerName}</TableCell>
                          <TableCell>{c.customerPhone}</TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">
                            {c.customerAddress}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openEdit(c)}
                                className="text-sm text-blue-600 font-medium hover:underline underline-offset-2"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(c._id!)}
                                disabled={deletingId === c._id}
                                className="text-sm text-red-600 font-medium hover:underline underline-offset-2 disabled:opacity-50"
                              >
                                {deletingId === c._id ? "Deleting…" : "Delete"}
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {customers.map((c) => (
                    <Card key={c._id} className="shadow-none border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-sm">{c.customerName}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{c.customerPhone}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.customerAddress}</p>
                        <div className="flex gap-4 mt-3 text-xs font-medium">
                          <button
                            onClick={() => openEdit(c)}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c._id!)}
                            disabled={deletingId === c._id}
                            className="text-red-600 hover:underline disabled:opacity-50"
                          >
                            {deletingId === c._id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
          </DialogHeader>
          <CustomerForm
            customer={editing}
            onSave={handleSave}
            onCancel={closeForm}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerPage;