import { useCreateCompany, useUpdateCompany } from "@/features/company/useCompany";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Building2, CreditCard, FileSignature, FileText, Hash, Landmark, LocateIcon, Mail, MapPin, Phone, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  gstin: string;
  hallMarkNumber: string;
  email: string;
  phone: string;
  termsConditions: string;
  address: { street: string; city: string; landmark: string; state: string; statecode: string; pincode: string };
  bank: { bankName: string; branch: string; accountNumber: string; ifsc: string; holderName: string };
}

const INITIAL: FormData = {
  name: "", gstin: "", hallMarkNumber: "", email: "", phone: "", termsConditions: "",
  address: { street: "", city: "", landmark: "", state: "", statecode: "", pincode: "" },
  bank: { bankName: "", branch: "", accountNumber: "", ifsc: "", holderName: "" },
};

// ─── Field ────────────────────────────────────────────────────────────────────

const Field = React.memo(({
  label, placeholder, type = "text", icon: Icon, required = false,
  value, error, onChange, multiline = false,
}: {
  label: string; placeholder?: string; type?: string; icon?: React.FC<any>;
  required?: boolean; value: string; error?: string; onChange: (v: string) => void; multiline?: boolean;
}) => (
  <div className="space-y-1.5">
    <Label className="flex items-center gap-1.5 text-sm font-medium">
      {Icon && <Icon size={14} className="text-indigo-400 shrink-0" />}
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
    {multiline ? (
      <Textarea
        rows={4}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`resize-none ${error ? "border-red-300 focus-visible:ring-red-300" : ""}`}
      />
    ) : (
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-red-300 focus-visible:ring-red-300" : ""}
      />
    )}
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-500">
        <AlertTriangle size={11} /> {error}
      </p>
    )}
  </div>
));

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEP_LABELS = ["Company Info", "Address", "Bank & Terms"];

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="flex items-center justify-center gap-0 mb-6">
    {Array.from({ length: totalSteps }, (_, i) => (
      <div key={i} className="flex items-center">
        <div className="flex flex-col items-center gap-1">
          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-200
            ${i + 1 === currentStep
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              : i + 1 < currentStep
              ? "bg-emerald-500 text-white"
              : "bg-gray-100 text-gray-400"}`}>
            {i + 1 < currentStep ? "✓" : i + 1}
          </div>
          <span className={`text-[10px] font-medium whitespace-nowrap hidden sm:block
            ${i + 1 === currentStep ? "text-indigo-600" : i + 1 < currentStep ? "text-emerald-500" : "text-gray-400"}`}>
            {STEP_LABELS[i]}
          </span>
        </div>
        {i < totalSteps - 1 && (
          <div className={`w-12 sm:w-20 h-0.5 mx-1 mb-4 transition-colors ${i + 1 < currentStep ? "bg-emerald-400" : "bg-gray-200"}`} />
        )}
      </div>
    ))}
  </div>
);

// ─── Form ─────────────────────────────────────────────────────────────────────

const CompanyForm = ({ company, onClose, isOpen }: { company?: any; onClose: () => void; isOpen: boolean }) => {
  const createCompanyMutation = useCreateCompany();
  const updateCompanyMutation = useUpdateCompany();
  const isLoading = createCompanyMutation.isPending || updateCompanyMutation.isPending;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (company) {
      setFormData({
        ...INITIAL,
        ...company,
        address: { ...INITIAL.address, ...company.address },
        bank: { ...INITIAL.bank, ...company.bank },
        phone: Array.isArray(company.phone) ? company.phone.join(", ") : (company.phone ?? ""),
        termsConditions: Array.isArray(company.termsConditions)
          ? company.termsConditions.join("\n")
          : (company.termsConditions ?? ""),
      });
    } else {
      setFormData(INITIAL);
    }
    setStep(1);
    setErrors({});
  }, [company, isOpen]);

  const set = (field: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev } as any;
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        next[parent] = { ...next[parent], [child]: value };
      } else {
        next[field] = value;
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!formData.name.trim()) e.name = "Company name is required";
      if (!formData.gstin.trim()) e.gstin = "GSTIN is required";
      if (!formData.email.trim()) e.email = "Email is required";
      if (!formData.phone.trim()) e.phone = "Phone is required";
    } else if (step === 2) {
      if (!formData.address.street.trim()) e["address.street"] = "Street is required";
      if (!formData.address.state.trim()) e["address.state"] = "State is required";
    } else if (step === 3) {
      if (!formData.bank.bankName.trim()) e["bank.bankName"] = "Bank name is required";
      if (!formData.bank.accountNumber.trim()) e["bank.accountNumber"] = "Account number is required";
      if (!formData.bank.ifsc.trim()) e["bank.ifsc"] = "IFSC code is required";
      if (!formData.bank.holderName.trim()) e["bank.holderName"] = "Holder name is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    if (step < 3) { setStep((p) => p + 1); return; }

    const payload = {
      ...formData,
      phone: formData.phone.split(",").map((p) => p.trim()).filter(Boolean),
      termsConditions: formData.termsConditions.split(/\r?\n/).map((t) => t.trim()).filter(Boolean),
      // Flatten for backend
      street: formData.address.street, city: formData.address.city,
      landmark: formData.address.landmark, state: formData.address.state,
      statecode: formData.address.statecode, pincode: formData.address.pincode,
      bankName: formData.bank.bankName, branch: formData.bank.branch,
      accountNumber: formData.bank.accountNumber, ifsc: formData.bank.ifsc,
      holderName: formData.bank.holderName,
    };

    try {
      if (company?._id) {
        await updateCompanyMutation.mutateAsync({ ...payload, _id: company._id });
      } else {
        await createCompanyMutation.mutateAsync(payload);
      }
      onClose();
    } catch { /* shown inline */ }
  };

  const apiError = (createCompanyMutation.error || updateCompanyMutation.error) as any;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {company ? "Edit Company" : "Add New Company"}
          </DialogTitle>
        </DialogHeader>

        <StepIndicator currentStep={step} totalSteps={3} />

        {/* API error */}
        {apiError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <AlertTriangle size={14} />
            {apiError?.response?.data?.message ?? "Something went wrong"}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-4">
              <Field label="Company Name" value={formData.name} onChange={(v) => set("name", v)} error={errors.name} placeholder="e.g. Sharma Jewellers" icon={Building2} required />
              <Field label="GSTIN" value={formData.gstin} onChange={(v) => set("gstin", v)} error={errors.gstin} placeholder="27AAAAA0000A1Z5" icon={Hash} required />
              <Field label="Hallmark Number" value={formData.hallMarkNumber} onChange={(v) => set("hallMarkNumber", v)} placeholder="BIS HM number" icon={FileText} />
              <Field label="Email" value={formData.email} onChange={(v) => set("email", v)} error={errors.email} placeholder="owner@example.com" icon={Mail} type="email" required />
              <Field label="Phone (comma-separated for multiple)" value={formData.phone} onChange={(v) => set("phone", v)} error={errors.phone} placeholder="9876543210, 9876543211" icon={Phone} required />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-4">
              <Field label="Street" value={formData.address.street} onChange={(v) => set("address.street", v)} error={errors["address.street"]} placeholder="123 Main Street" icon={LocateIcon} required />
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" value={formData.address.city} onChange={(v) => set("address.city", v)} placeholder="Mumbai" icon={LocateIcon} />
                <Field label="Landmark" value={formData.address.landmark} onChange={(v) => set("address.landmark", v)} placeholder="Near City Mall" icon={LocateIcon} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="State" value={formData.address.state} onChange={(v) => set("address.state", v)} error={errors["address.state"]} placeholder="Maharashtra" icon={MapPin} required />
                <Field label="State Code" value={formData.address.statecode} onChange={(v) => set("address.statecode", v)} placeholder="27" icon={Hash} />
              </div>
              <Field label="Pincode" value={formData.address.pincode} onChange={(v) => set("address.pincode", v)} placeholder="400001" icon={Hash} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Bank Name" value={formData.bank.bankName} onChange={(v) => set("bank.bankName", v)} error={errors["bank.bankName"]} placeholder="State Bank of India" icon={Landmark} required />
                <Field label="Branch" value={formData.bank.branch} onChange={(v) => set("bank.branch", v)} placeholder="Dadar Branch" icon={Building2} />
              </div>
              <Field label="Account Number" value={formData.bank.accountNumber} onChange={(v) => set("bank.accountNumber", v)} error={errors["bank.accountNumber"]} placeholder="XXXXXXXXXX" icon={CreditCard} required />
              <div className="grid grid-cols-2 gap-4">
                <Field label="IFSC Code" value={formData.bank.ifsc} onChange={(v) => set("bank.ifsc", v)} error={errors["bank.ifsc"]} placeholder="SBIN0001234" icon={Hash} required />
                <Field label="Holder Name" value={formData.bank.holderName} onChange={(v) => set("bank.holderName", v)} error={errors["bank.holderName"]} placeholder="S Jewellers" icon={User} required />
              </div>
              <Field label="Terms & Conditions (one per line)" value={formData.termsConditions} onChange={(v) => set("termsConditions", v)} placeholder={"No exchange without receipt\nGoods once sold will not be returned"} icon={FileSignature} multiline />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t mt-4 gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep((p) => p - 1)} disabled={isLoading}>
                ← Back
              </Button>
            )}
            <Button onClick={handleNext} disabled={isLoading}>
              {isLoading ? "Saving…" : step < 3 ? "Next →" : company ? "Update Company" : "Create Company"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyForm;