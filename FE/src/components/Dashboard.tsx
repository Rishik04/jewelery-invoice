import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";

// Shadcn UI Components & Icons
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Correctly import Textarea
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";

import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
} from "@/features/company/useCompany";
import { Company } from "@/features/company/types";

// --- Zod Schema for Company Form Validation ---
// Refined schema for better validation of comma-separated strings
const companyFormSchema = z.object({
  name: z.string().min(1, "Company Name is required"),
  address: z.string().min(1, "Address is required"),
  gstin: z
    .string()
    .min(1, "GSTIN is required")
    .length(15, "GSTIN must be 15 characters")
    .regex(
      /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GSTIN format"
    ),
  hallMarkNumber: z.string().min(1, "Hallmark Number is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z
    .string()
    .min(1, "Phone number is required.")
    .refine((value) => /^[\d\s,]+$/.test(value), {
      message: "Phone must contain only digits, commas, and spaces.",
    })
    .refine((value) => value.split(',').every(phone => /^\d{10,15}$/.test(phone.trim())), {
      message: "Each phone number must be between 10 and 15 digits.",
    }),
  state: z.string().min(1, "State is required"),
  stateCode: z.string().min(1, "State Code is required"),
  bankDetails: z.object({
    name: z.string().min(1, "Bank Name is required"),
    branch: z.string().min(1, "Branch is required"),
    accountNumber: z
      .string()
      .min(1, "Account Number is required")
      .regex(/^\d+$/, "Account Number must contain only digits"),
    ifsc: z
      .string()
      .min(1, "IFSC is required")
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format"),
  }),
  // Changed to a single string to match the Textarea component
  termsConditions: z.string().optional(),
});

type CompanyFormInputs = z.infer<typeof companyFormSchema>;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: companies = [], isLoading: loading, error } = useCompanies();

  const createCompany = useCreateCompany();
  const updateCompanyMutation = useUpdateCompany();
  const deleteCompanyMutation = useDeleteCompany();

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDeleteId, setCompanyToDeleteId] = useState<string | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormInputs>({
    resolver: zodResolver(companyFormSchema),
    // Set default values consistent with the form fields
    defaultValues: {
      name: "",
      address: "",
      gstin: "",
      hallMarkNumber: "",
      email: "",
      phone: "",
      state: "",
      stateCode: "",
      bankDetails: {
        name: "",
        branch: "",
        accountNumber: "",
        ifsc: "",
      },
      termsConditions: "",
    },
  });


  // --- Dialog and Form Handling ---

  const openFormDialog = (company?: Company) => {
    setSelectedCompany(company || null); if (company) {
      // Pre-fill form for editing, joining arrays into strings for form fields
      reset({
        ...company,
        phone: company.phone ? company.phone.join(", ") : "",
        termsConditions: company.termsConditions ? company.termsConditions.join("\n") : "",
        bankDetails: { ...company.bankDetails },
      });
    } else {
      // Reset to default values for a new company
      reset();
    }
    setIsFormDialogOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormDialogOpen(false);
    reset();
    setSelectedCompany(null);
  };

  const onSubmit: SubmitHandler<CompanyFormInputs> = async (data) => {
    const companyDataToSend = {
      ...data,
      phone: data.phone.split(",").map((s) => s.trim()).filter(Boolean),
      termsConditions:
        data.termsConditions
          ?.split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean) || [],
    };

    try {
      if (selectedCompany) {
        await updateCompanyMutation.mutateAsync({
          ...companyDataToSend,
          _id: selectedCompany._id,
        });

      } else {
        await createCompany.mutateAsync(companyDataToSend);
      }
      closeFormDialog();

    } catch (err) {
      console.error(err);
    }

  };

  const openDeleteDialog = (companyId: string) => {
    setCompanyToDeleteId(companyId);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setCompanyToDeleteId(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!companyToDeleteId) return;
    try {
      await deleteCompanyMutation.mutateAsync(companyToDeleteId);
      closeDeleteDialog();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    navigate(`/${company._id}/invoice`);
  };

  return (
    <div className="flex flex-col items-center p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-6xl mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Company Dashboard</h1>
        <Button
          onClick={() => openFormDialog()}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" /> Add New Company
        </Button>
      </div>

      <div className="w-full max-w-6xl">
        <Card className="shadow-md dark:bg-gray-800">
          <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-xl text-gray-700 dark:text-gray-200">
              Your Companies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading && companies.length === 0 && (
              <div className="text-center p-6 text-gray-500 flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Loading companies...</span>
              </div>
            )}
            {error && (
              <p className="text-red-500 text-sm p-4 text-center">{error}</p>
            )}
            {!loading && companies?.length === 0 && !error && (
              <p className="text-center p-6 text-gray-500">
                No companies added yet. Click "Add New Company" to get started!
              </p>
            )}
            {companies.length > 0 && (
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader className="bg-gray-50 dark:bg-gray-700">
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead>Hallmark No.</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Bank Account</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <TableCell className="font-medium">
                          {/* Use a link-styled button for better accessibility and theme consistency */}
                          <Button variant="link" onClick={() => handleSelectCompany(company)} className="p-0 h-auto font-medium">
                            {company.name}
                          </Button>
                        </TableCell>
                        <TableCell>{company.gstin}</TableCell>
                        <TableCell>{company.hallMarkNumber}</TableCell>
                        <TableCell>{company.address}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{company.email}</span>
                            <span className="text-xs text-gray-500">{company.phone.join(", ")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{company.bankDetails.accountNumber}</span>
                            <span className="text-xs text-gray-500">{company.bankDetails.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openFormDialog(company)}
                              title="Edit Company"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => openDeleteDialog(company._id)}
                              title="Delete Company"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Company Dialog with improved scrolling for long forms */}
      <Dialog open={isFormDialogOpen} onOpenChange={closeFormDialog}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl font-bold">
              {selectedCompany ? "Edit Company" : "Add New Company"}
            </DialogTitle>
            <DialogDescription>
              {selectedCompany
                ? "Make changes to company details here."
                : "Enter details for your new company."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto px-6">
            <form id="company-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Company Details */}
              <div className="col-span-full">
                <h3 className="text-lg font-semibold text-gray-700 mb-2 dark:text-gray-200">Company Information</h3>
                <Separator className="mb-4" />
              </div>
              <div>
                <Label htmlFor="name">Company Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="gstin">GSTIN</Label>
                <Input id="gstin" {...register("gstin")} />
                {errors.gstin && <p className="text-red-500 text-xs mt-1">{errors.gstin.message}</p>}
              </div>
              <div>
                <Label htmlFor="hallMarkNumber">Hallmark Number</Label>
                <Input id="hallMarkNumber" {...register("hallMarkNumber")} />
                {errors.hallMarkNumber && <p className="text-red-500 text-xs mt-1">{errors.hallMarkNumber.message}</p>}
              </div>
              <div className="col-span-full">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" {...register("state")} />
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
              </div>
              <div>
                <Label htmlFor="stateCode">State Code</Label>
                <Input id="stateCode" {...register("stateCode")} />
                {errors.stateCode && <p className="text-red-500 text-xs mt-1">{errors.stateCode.message}</p>}
              </div>

              {/* Contact Details */}
              <div className="col-span-full mt-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2 dark:text-gray-200">Contact Information</h3>
                <Separator className="mb-4" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone (comma-separated)</Label>
                <Input id="phone" type="text" {...register("phone")} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>

              {/* Bank Details */}
              <div className="col-span-full mt-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2 dark:text-gray-200">Bank Details</h3>
                <Separator className="mb-4" />
              </div>
              <div>
                <Label htmlFor="bankDetails.name">Bank Name</Label>
                <Input id="bankDetails.name" {...register("bankDetails.name")} />
                {errors.bankDetails?.name && <p className="text-red-500 text-xs mt-1">{errors.bankDetails.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="bankDetails.branch">Branch</Label>
                <Input id="bankDetails.branch" {...register("bankDetails.branch")} />
                {errors.bankDetails?.branch && <p className="text-red-500 text-xs mt-1">{errors.bankDetails.branch.message}</p>}
              </div>
              <div>
                <Label htmlFor="bankDetails.accountNumber">Account Number</Label>
                <Input id="bankDetails.accountNumber" {...register("bankDetails.accountNumber")} />
                {errors.bankDetails?.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.bankDetails.accountNumber.message}</p>}
              </div>
              <div>
                <Label htmlFor="bankDetails.ifsc">IFSC Code</Label>
                <Input id="bankDetails.ifsc" {...register("bankDetails.ifsc")} />
                {errors.bankDetails?.ifsc && <p className="text-red-500 text-xs mt-1">{errors.bankDetails.ifsc.message}</p>}
              </div>

              {/* Terms and Conditions */}
              <div className="col-span-full mt-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2 dark:text-gray-200">Terms & Conditions</h3>
                <Separator className="mb-4" />
              </div>
              <div className="col-span-full">
                <Label htmlFor="termsConditions">Terms (one per line)</Label>
                {/* Use the correct Textarea component */}
                <Textarea
                  id="termsConditions"
                  className="w-full min-h-[100px]"
                  {...register("termsConditions")}
                />
                {errors.termsConditions && <p className="text-red-500 text-xs mt-1">{errors.termsConditions.message}</p>}
              </div>

              {error && (
                <p className="text-red-500 text-sm col-span-full text-center mt-4">{error}</p>
              )}
            </form>
          </div>
          <DialogFooter className="p-6 pt-4 border-t dark:border-gray-700 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeFormDialog}>Cancel</Button>
            <Button type="submit" form="company-form" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedCompany ? "Save Changes" : "Add Company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={closeDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this company? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={closeDeleteDialog}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteCompanyMutation.isPending}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

