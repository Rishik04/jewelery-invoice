import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import * as z from "zod";
import API from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  _id?: string;
  name: string;
  address: string;
  phone: string;
  state: string;
}

// ─── React Query hooks ────────────────────────────────────────────────────────

// NOTE: The backend doesn't yet expose a customer list/create/update/delete API.
// These hooks are wired up and ready — add the routes to the backend when needed.
// For now useCustomers returns an empty list gracefully.

const useCustomers = () =>
  useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      // Swap in real endpoint when available: GET /api/customer
      // const res = await API.get("/customer");
      // return res.data.data || [];
      return [];
    },
  });

const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Customer, "_id">) => API.post("/customer", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
};

const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ _id, ...data }: Customer) => API.put(`/customer/${_id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
};

const useDeleteCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => API.delete(`/customer/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
};

// ─── Zod schema ──────────────────────────────────────────────────────────────

const customerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  address: z.string().min(5, "Please provide a valid address"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .regex(/^\d+$/, "Phone must contain only digits"),
  state: z.string().min(2, "State is required"),
});
type CustomerFormInputs = z.infer<typeof customerSchema>;

// ─── Customer Form ─────────────────────────────────────────────────────────

const CustomerForm = ({
  customer,
  onSave,
  onCancel,
}: {
  customer: Customer | null;
  onSave: (data: Customer) => void;
  onCancel: () => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormInputs>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ?? { name: "", address: "", phone: "", state: "" },
  });

  const onSubmit: SubmitHandler<CustomerFormInputs> = (data) =>
    onSave({ ...customer, ...data });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {[
        { id: "name", label: "Full Name", type: "text" },
        { id: "address", label: "Address", type: "text" },
        { id: "phone", label: "Phone Number", type: "tel" },
        { id: "state", label: "State", type: "text" },
      ].map(({ id, label, type }) => (
        <div key={id} className="space-y-1">
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          <input
            id={id}
            type={type}
            {...register(id as keyof CustomerFormInputs)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
          {errors[id as keyof CustomerFormInputs] && (
            <p className="text-xs text-red-600">
              {errors[id as keyof CustomerFormInputs]?.message}
            </p>
          )}
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Save Customer
        </button>
      </div>
    </form>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CustomerPage = () => {
  const { data: customers = [], isLoading, error } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const handleSave = (data: Customer) => {
    if (data._id) updateCustomer.mutate(data);
    else createCustomer.mutate(data);
    setIsFormOpen(false);
    setEditing(null);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b">
            <div>
              <h3 className="text-2xl font-semibold">Customers</h3>
              <p className="text-sm text-gray-500 mt-1">
                View, add, and manage your customers.
              </p>
            </div>
            <button
              onClick={() => { setEditing(null); setIsFormOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Add New Customer
            </button>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg">
                Failed to load customers.
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium mb-1">No customers yet</p>
                <p className="text-sm">Add your first customer to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      {["Name", "Address", "Phone", "State", "Actions"].map((h) => (
                        <th key={h} className="h-12 px-4 text-left font-semibold text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-gray-600">{c.address}</td>
                        <td className="px-4 py-3">{c.phone}</td>
                        <td className="px-4 py-3">{c.state}</td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => { setEditing(c); setIsFormOpen(true); }}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteCustomer.mutate(c._id!)}
                            className="px-3 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editing ? "Edit Customer" : "Add New Customer"}
              </h2>
              <CustomerForm
                customer={editing}
                onSave={handleSave}
                onCancel={() => { setIsFormOpen(false); setEditing(null); }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPage;
