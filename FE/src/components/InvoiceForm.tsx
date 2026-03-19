import { useCompany } from "@/features/company/useCompany";
import { useCreateInvoice } from "@/features/invoice/useInvoice";
import { useProducts } from "@/features/product/useProduct";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Building2, Calculator, Calendar, Check, ChevronRight,
  Coins, FileText, Hash, Home, MapPin, Phone, PlusCircle, Receipt,
  Sparkles, Trash2, User,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export const InputField = React.memo(
  ({ icon: Icon, type = "text", placeholder, value, onChange, className = "", label, ...props }: any) => (
    <motion.div className="relative group" whileHover={{ scale: 1.01 }}>
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 py-1">
        {Icon && <Icon size={16} />}{label}
      </label>
      <input type={type} value={value ?? ""} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3.5 bg-gray-50/80 border-2 rounded-xl outline-none font-medium transition-all border-gray-200 hover:border-gray-300 focus:border-blue-400 focus:bg-white ${className}`}
        {...props} />
    </motion.div>
  )
);

export const SelectField = React.memo(
  ({ icon: Icon, value, onChange, options, placeholder, label }: any) => (
    <div className="relative">
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 py-1">
        {Icon && <Icon size={16} />}{label}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none appearance-none cursor-pointer">
        <option value="">{placeholder}</option>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
);

// FIX: DescriptionInput was passing `typ` (item.type = "G"/"S") directly to useProducts
// but the API expects full category strings like "GOLD"/"SILVER"
const TYPE_TO_CATEGORY: Record<string, string> = {
  G: "GOLD", S: "SILVER", D: "DIAMOND", P: "PLATINUM",
};

const DescriptionInput = ({ value, onChange, typ, onProductSelect }: any) => {
  const [search, setSearch] = useState(value || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const category = TYPE_TO_CATEGORY[typ] || typ;
  const { data: products = [] } = useProducts(category);

  const filtered = useMemo(() =>
    !search ? products : products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase())),
    [search, products]
  );

  const handleSelect = (p: any) => {
    setSearch(p.name);
    onChange(p.name);
    setShowDropdown(false);
    onProductSelect?.(p);
  };

  return (
    <div className="relative w-full">
      <InputField label="Description" icon={FileText} placeholder="Product description" value={search}
        onChange={(v: string) => { setSearch(v); onChange(v); setShowDropdown(true); }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)} />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute top-full mt-1 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
          {filtered.map((p: any) => (
            <div key={p._id} onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm flex justify-between items-center">
              <span>{p.name}</span>
              {p.karat && (
                <span className="text-xs font-mono font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                  {p.karat}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EMPTY_ITEM = { type: "G", id: "", description: "", hsnCode: "7113", purity: "22K", grossWeight: 0, netWeight: 0, rate: 0, makingCharges: 0, otherCharges: 0 };

const ModernInvoiceForm = () => {
  const [step, setStep] = useState(1);
  const createInvoiceMutation = useCreateInvoice();
  const { data: selectedCompany, isLoading, error } = useCompany();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    customer: { name: "", address: "", phone: "", state: "" },
    items: [{ ...EMPTY_ITEM }],
  });

  const handleInputChange = React.useCallback((field: string, value: any, index: number | null = null, subField: string | null = null) => {
    setFormData(prev => {
      if (index !== null) {
        const items = [...prev.items];
        items[index] = { ...items[index], [field]: value };
        return { ...prev, items };
      }
      if (subField) return { ...prev, [field]: { ...(prev as any)[field], [subField]: value } };
      return { ...prev, [field]: value };
    });
  }, []);

  const addItem = () => setFormData(prev => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }));
  const removeItem = (i: number) => setFormData(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

  const { subtotal, sgst, cgst, total } = useMemo(() => {
    const sub = formData.items.reduce((acc, item) => {
      const w = Number(item.netWeight) || 0;
      const r = Number(item.rate) || 0;
      const mc = Number(item.makingCharges) || 0;
      const oc = Number(item.otherCharges) || 0;
      const base = w * r;
      return acc + base + (base * mc / 100) + oc;
    }, 0);
    const s = parseFloat((sub * 0.015).toFixed(2));
    return { subtotal: parseFloat(sub.toFixed(2)), sgst: s, cgst: s, total: parseFloat((sub + s * 2).toFixed(2)) };
  }, [formData.items]);

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      // FIX: map items to the shape saveInvoiceInDB expects: productId from description lookup
      // For now send weight/rate/makingCharges directly; backend resolves productId
      items: formData.items.map(i => ({
        ...i,
        weight: Number(i.netWeight),
        quantity: 1,
        rate: Number(i.rate),
        makingCharges: Number(i.makingCharges),
        otherCharges: Number(i.otherCharges),
      })),
    };
    try {
      await createInvoiceMutation.mutateAsync(payload);
    } catch (err) {
      console.error(err);
    }
  };

  const StepIndicator = ({ currentStep, totalSteps }: any) => (
    <div className="flex items-center justify-center mb-8">
      {[...Array(totalSteps)].map((_, i) => (
        <React.Fragment key={i}>
          <motion.div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
              ${i + 1 <= currentStep ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "bg-gray-200 text-gray-500"}`}
            animate={{ scale: i + 1 === currentStep ? 1.1 : 1 }}>
            {i + 1 < currentStep ? <Check size={16} /> : i + 1}
          </motion.div>
          {i < totalSteps - 1 && (
            <div className={`w-12 h-1 mx-2 rounded ${i + 1 < currentStep ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-gray-200"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const formattedAddress = typeof selectedCompany?.address === "string"
    ? selectedCompany.address
    : [selectedCompany?.address?.street, selectedCompany?.address?.city, selectedCompany?.address?.state].filter(Boolean).join(", ");

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading company...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Failed to load company data</div>;

  const stepVariants = {
    hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Create Invoice</h1>
            <p className="text-gray-600 mt-1">Generate GST-compliant invoices for your jewellery business</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-gray-700 font-medium hover:shadow-md">
            <Home size={16} /> Dashboard
          </motion.button>
        </div>

        {/* Company card */}
        {selectedCompany && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-8 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="text-white" size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedCompany.name}</h3>
                <p className="text-gray-500 text-sm">Invoice will be generated for this company</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p><span className="font-semibold">GSTIN:</span> {selectedCompany.gstin}</p>
                <p><span className="font-semibold">Hallmark:</span> {selectedCompany.hallMarkNumber}</p>
                <p><span className="font-semibold">Email:</span> {selectedCompany.email}</p>
              </div>
              <div className="space-y-1">
                <p><span className="font-semibold">Address:</span> {formattedAddress}</p>
                <p><span className="font-semibold">Phone:</span> {selectedCompany.phone?.join(", ")}</p>
              </div>
              <div className="space-y-1">
                <p><span className="font-semibold">Bank:</span> {selectedCompany.bank?.bankName}</p>
                <p><span className="font-semibold">A/C:</span> {selectedCompany.bank?.accountNumber}</p>
                <p><span className="font-semibold">IFSC:</span> {selectedCompany.bank?.ifsc}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          <div className="p-8">
            <StepIndicator currentStep={step} totalSteps={2} />

            {/* Mutation error */}
            {createInvoiceMutation.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                {(createInvoiceMutation.error as any)?.response?.data?.message || "Failed to generate invoice"}
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-1">Customer Information</h2>
                    <p className="text-gray-500">Enter customer details for this invoice</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <InputField label="Customer Name" icon={User} placeholder="Ramesh Sharma" value={formData.customer.name} onChange={(v: string) => handleInputChange("customer", v, null, "name")} />
                    <InputField label="Phone" icon={Phone} placeholder="9876543210" value={formData.customer.phone} onChange={(v: string) => handleInputChange("customer", v, null, "phone")} />
                    <InputField label="Address" icon={MapPin} placeholder="123 MG Road, Mumbai" value={formData.customer.address} onChange={(v: string) => handleInputChange("customer", v, null, "address")} />
                    <InputField label="State" icon={MapPin} placeholder="Maharashtra" value={formData.customer.state} onChange={(v: string) => handleInputChange("customer", v, null, "state")} />
                    <InputField label="Invoice Date" icon={Calendar} type="date" value={formData.date} onChange={(v: string) => handleInputChange("date", v)} />
                  </div>
                  <div className="flex justify-center mt-8">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(2)}
                      className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg">
                      Continue <ChevronRight size={20} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-1">Invoice Items</h2>
                    <p className="text-gray-500">Add jewellery items to this invoice</p>
                  </div>

                  <div className="space-y-6">
                    {formData.items.map((item, index) => (
                      <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50/80 rounded-xl p-6 border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-gray-800">Item {index + 1}</h4>
                          {formData.items.length > 1 && (
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => removeItem(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                              <Trash2 size={16} />
                            </motion.button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <SelectField label="Metal" icon={Coins} value={item.type} onChange={(v: string) => handleInputChange("type", v, index)}
                            options={[{ value: "G", label: "Gold" }, { value: "S", label: "Silver" }, { value: "D", label: "Diamond" }, { value: "P", label: "Platinum" }]} placeholder="Select metal" />
                          <DescriptionInput
                            value={item.description}
                            typ={item.type}
                            onChange={(v: string) => handleInputChange("description", v, index)}
                            onProductSelect={(product: any) => {
                              handleInputChange("description", product.name, index);
                              handleInputChange("id", product._id, index);
                              if (product.karat) {
                                handleInputChange("purity", product.karat, index);
                              }
                              // Auto-fill HSN from product
                              if (product.hsnNumber) {
                                handleInputChange("hsnCode", product.hsnNumber, index);
                              }
                            }}
                          />
                          <InputField label="HSN Code" icon={Hash} value={item.hsnCode} onChange={(v: string) => handleInputChange("hsnCode", v, index)} />
                          <SelectField label="Purity" icon={Sparkles} value={item.purity} onChange={(v: string) => handleInputChange("purity", v, index)}
                            options={[{ value: "18K", label: "18K / 750" }, { value: "22K", label: "22K / 916" }, { value: "24K", label: "24K / 999" }]} placeholder="Select purity" />
                          <InputField label="Gross Weight (g)" icon={Calculator} type="number" value={item.grossWeight} onChange={(v: string) => handleInputChange("grossWeight", v, index)} />
                          <InputField label="Net Weight (g)" icon={Calculator} type="number" value={item.netWeight} onChange={(v: string) => handleInputChange("netWeight", v, index)} />
                          <InputField label="Rate / 10g (₹)" icon={Calculator} type="number" value={item.rate} onChange={(v: string) => handleInputChange("rate", v, index)} />
                          <InputField label="Making Charges %" icon={Calculator} type="number" value={item.makingCharges} onChange={(v: string) => handleInputChange("makingCharges", v, index)} />
                          <InputField label="Other Charges (₹)" icon={Calculator} type="number" value={item.otherCharges} onChange={(v: string) => handleInputChange("otherCharges", v, index)} />
                        </div>
                      </motion.div>
                    ))}

                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={addItem}
                      className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all">
                      <PlusCircle size={20} /> Add Another Item
                    </motion.button>
                  </div>

                  {/* Summary */}
                  <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Invoice Summary</h3>
                    <div className="max-w-sm mx-auto space-y-2">
                      {[["Subtotal", subtotal], ["SGST (1.5%)", sgst], ["CGST (1.5%)", cgst]].map(([label, val]) => (
                        <div key={label as string} className="flex justify-between text-gray-700">
                          <span>{label}:</span><span className="font-semibold">₹ {(val as number).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t-2 border-gray-300 pt-3 flex justify-between text-xl font-bold text-gray-900">
                        <span>Total:</span><span>₹ {total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-center mt-8">
                    <motion.button whileHover={{ scale: 1.02 }} onClick={() => setStep(1)}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200">
                      <ArrowLeft size={18} /> Back
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit}
                      disabled={createInvoiceMutation.isPending}
                      className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50">
                      {createInvoiceMutation.isPending ? (
                        <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
                      ) : (
                        <><Receipt size={20} /> Generate Invoice</>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModernInvoiceForm;