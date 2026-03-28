import { useCreateCompany, useUpdateCompany } from "@/features/company/useCompany";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, Building2, CreditCard, FileSignature, FileText,
  Hash, Landmark, LocateIcon, Mail, MapPin, Phone,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";

const InputField = React.memo(
  ({ label, placeholder, type = "text", icon: Icon, required = false, value, error, onChange, multiline = false }: any) => (
    <motion.div className="space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        {Icon && <Icon size={16} />}{label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        {multiline ? (
          <textarea
            rows={4}
            placeholder={placeholder}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-4 py-3.5 bg-gray-50/80 border-2 rounded-xl outline-none font-medium transition-all resize-none
              ${error ? "border-red-300 bg-red-50/50" : "border-gray-200 hover:border-gray-300 focus:border-blue-400 focus:bg-white"}`}
          />
        ) : (
          <input
            type={type}
            placeholder={placeholder}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-4 py-3.5 bg-gray-50/80 border-2 rounded-xl outline-none font-medium transition-all
              ${error ? "border-red-300 bg-red-50/50" : "border-gray-200 hover:border-gray-300 focus:border-blue-400 focus:bg-white"}`}
          />
        )}

        {error && (
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertTriangle size={14} />{error}
          </motion.p>
        )}
      </div>
    </motion.div>
  )
);

const StepIndicator = React.memo(({ currentStep, totalSteps }: any) => (
  <div className="flex items-center justify-center mb-8">
    {[...Array(totalSteps)].map((_, i) => (
      <div key={i} className="flex items-center">
        <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors
          ${i + 1 === currentStep ? "bg-blue-500 text-white" : i + 1 < currentStep ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}>
          {i + 1}
        </div>
        {i < totalSteps - 1 && <div className={`w-12 h-1 ${i + 1 < currentStep ? "bg-green-500" : "bg-gray-300"}`} />}
      </div>
    ))}
  </div>
));

// onSubmit prop removed — form calls its own mutations directly, then onClose.
// Passing onSubmit AND having the parent also call mutate was causing every submit to fire twice.
const ModernCompanyForm = ({ company, onClose, isOpen }: any) => {
  // FIX: was calling undefined updateCompanyMutation / createCompanyMutation
  // now correctly uses the hooks
  const createCompanyMutation = useCreateCompany();
  const updateCompanyMutation = useUpdateCompany();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<any>({});
  const isLoading = createCompanyMutation.isPending || updateCompanyMutation.isPending;

  useEffect(() => {
    const initial = {
      name: "", gstin: "", hallMarkNumber: "", email: "", phone: "",
      termsConditions: "",
      address: { street: "", city: "", landmark: "", state: "", statecode: "", pincode: "" },
      bank: { bankName: "", branch: "", accountNumber: "", ifsc: "", holderName: "" },
    };
    if (company) {
      setFormData({
        ...initial, ...company,
        address: { ...initial.address, ...company.address },
        bank: { ...initial.bank, ...company.bank },
        phone: Array.isArray(company.phone) ? company.phone.join(", ") : (company.phone || ""),
        termsConditions: Array.isArray(company.termsConditions) ? company.termsConditions.join("\n") : (company.termsConditions || ""),
      });
    } else {
      setFormData(initial);
    }
    setStep(1);
    setErrors({});
  }, [company, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = { ...prev };
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        updated[parent] = { ...updated[parent], [child]: value };
      } else {
        updated[field] = value;
      }
      return updated;
    });
    if (errors[field]) setErrors((prev: any) => ({ ...prev, [field]: null }));
  };

  const validateStep = () => {
    const e: any = {};
    if (step === 1) {
      if (!formData.name) e.name = "Company name is required";
      if (!formData.gstin) e.gstin = "GSTIN is required";
      if (!formData.email) e.email = "Email is required";
      if (!formData.phone) e.phone = "Phone is required";
    } else if (step === 2) {
      if (!formData.address?.street) e["address.street"] = "Street is required";
      if (!formData.address?.state) e.state = "State is required";
    } else if (step === 3) {
      if (!formData.bank?.bankName) e["bank.bankName"] = "Bank name is required";
      if (!formData.bank?.accountNumber) e["bank.accountNumber"] = "Account number is required";
      if (!formData.bank?.ifsc) e["bank.ifsc"] = "IFSC code is required";
      if (!formData.bank?.holderName) e["bank.holderName"] = "Holder Name is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (step < 3) { setStep((p) => p + 1); return; }

    const payload = {
      ...formData,
      phone: formData.phone ? formData.phone.split(",").map((p: string) => p.trim()).filter(Boolean) : [],
      termsConditions: formData.termsConditions
        ? formData.termsConditions
          .split(/\r?\n/)
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0)
        : [],
      // FIX: flatten address & bank fields for /company/add endpoint (which expects flat body)
      street: formData.address?.street,
      city: formData.address?.city,
      landmark: formData.address?.landmark,
      state: formData.address?.state,
      statecode: formData.address?.statecode,
      pincode: formData.address?.pincode,
      bankName: formData.bank?.bankName,
      branch: formData.bank?.branch,
      accountNumber: formData.bank?.accountNumber,
      ifsc: formData.bank?.ifsc,
      holderName: formData.bank?.holderName,
    };

    try {
      if (company?._id) {
        await updateCompanyMutation.mutateAsync({ ...payload, _id: company._id });
      } else {
        await createCompanyMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      console.error("Company save failed:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl py-4 px-8 max-h-[90vh] overflow-y-auto">

        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {company ? "Edit Company" : "Add New Company"}
        </h2>
        <StepIndicator currentStep={step} totalSteps={3} />

        {/* Mutation errors */}
        {(createCompanyMutation.error || updateCompanyMutation.error) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {(createCompanyMutation.error as any)?.response?.data?.message ||
              (updateCompanyMutation.error as any)?.response?.data?.message ||
              "An error occurred"}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
              <InputField label="Company Name" value={formData.name} onChange={(v: any) => handleInputChange("name", v)} error={errors.name} placeholder="e.g. Sharma Jewellers" icon={Building2} required />
              <InputField label="GSTIN" value={formData.gstin} onChange={(v: any) => handleInputChange("gstin", v)} error={errors.gstin} placeholder="27AAAAA0000A1Z5" icon={Hash} required />
              <InputField label="Hallmark Number" value={formData.hallMarkNumber} onChange={(v: any) => handleInputChange("hallMarkNumber", v)} placeholder="BIS HM number" icon={FileText} />
              <InputField label="Email" value={formData.email} onChange={(v: any) => handleInputChange("email", v)} error={errors.email} placeholder="owner@example.com" icon={Mail} required />
              <InputField label="Phone (comma-separated)" value={formData.phone} onChange={(v: any) => handleInputChange("phone", v)} error={errors.phone} placeholder="9876543210, 9876543211" icon={Phone} required />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
              {/* FIX: all address fields were calling handleInputChange("city", v) — corrected to correct keys */}
              <InputField label="Street" value={formData.address?.street} onChange={(v: any) => handleInputChange("address.street", v)} error={errors["address.street"]} placeholder="123 Main Street" icon={LocateIcon} required />
              <InputField label="City" value={formData.address?.city} onChange={(v: any) => handleInputChange("address.city", v)} placeholder="Mumbai" icon={LocateIcon} />
              <InputField label="Landmark" value={formData.address?.landmark} onChange={(v: any) => handleInputChange("address.landmark", v)} placeholder="Near City Mall" icon={LocateIcon} />
              <InputField label="State" value={formData.address?.state} onChange={(v: any) => handleInputChange("address.state", v)} error={errors.state} placeholder="Maharashtra" icon={MapPin} required />
              <InputField label="State Code" value={formData.address?.statecode} onChange={(v: any) => handleInputChange("address.statecode", v)} placeholder="27" icon={Hash} />
              <InputField label="Pincode" value={formData.address?.pincode} onChange={(v: any) => handleInputChange("address.pincode", v)} placeholder="400001" icon={Hash} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
              {/* FIX: was binding to formData.bankDetails but model field is formData.bank */}
              <InputField label="Bank Name" value={formData.bank?.bankName} onChange={(v: any) => handleInputChange("bank.bankName", v)} error={errors["bank.bankName"]} placeholder="State Bank of India" icon={Landmark} required />
              <InputField label="Branch" value={formData.bank?.branch} onChange={(v: any) => handleInputChange("bank.branch", v)} placeholder="Dadar Branch" icon={Building2} />
              <InputField label="Account Number" value={formData.bank?.accountNumber} onChange={(v: any) => handleInputChange("bank.accountNumber", v)} error={errors["bank.accountNumber"]} placeholder="XXXXXXXX" icon={CreditCard} required />
              <InputField label="IFSC Code" value={formData.bank?.ifsc} onChange={(v: any) => handleInputChange("bank.ifsc", v)} error={errors["bank.ifsc"]} placeholder="SBIN0001234" icon={Hash} required />
              <InputField label="Holder Name" value={formData.bank?.holderName} onChange={(v: any) => handleInputChange("bank.holderName", v)} error={errors["bank.holderName"]} placeholder="S Jewellers" icon={User} required />
              <InputField
                label="Terms & Conditions (one per line)"
                value={formData.termsConditions}
                onChange={(v: any) => handleInputChange("termsConditions", v)}
                placeholder={`No exchange without receipt Goods once sold will not be taken back`}
                icon={FileSignature}
                multiline
              />            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          {step > 1 && (
            <button onClick={() => setStep((p) => p - 1)}
              className="px-6 py-3 mx-2 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">
              Back
            </button>
          )}
          <button onClick={onClose} className="px-6 py-3 mx-2 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isLoading}
            className={`ml-auto px-6 py-3 rounded-xl text-white font-semibold ${isLoading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}>
            {isLoading ? "Saving..." : step < 3 ? "Next →" : company ? "Update Company" : "Create Company"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ModernCompanyForm;