import { useCreateProduct, useDeleteProduct, useProducts, type Product } from "@/features/product/useProduct";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, Box, ChevronDown, Diamond, Gem, Hash,
  Package, Plus, Search, Sparkles, Tag, Trash2, X,
} from "lucide-react";
import { useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["GOLD", "SILVER", "DIAMOND", "PLATINUM"] as const;

const KARATS = ["14K", "18K", "22K", "24K"] as const;

// Common jewellery types — user can also type a custom value
const PRODUCT_TYPES = [
  "Ring", "Necklace", "Bangle", "Bracelet", "Earring",
  "Pendant", "Chain", "Anklet", "Mangalsutra", "Nose Pin",
  "Brooch", "Cufflink", "Coin", "Bar", "Other",
];

const HSN_MAP: Record<string, string> = {
  GOLD: "7113", SILVER: "7113", PLATINUM: "7113", DIAMOND: "7102",
};

const CATEGORY_META: Record<string, {
  icon: React.FC<any>;
  gradient: string;
  bg: string;
  label: string;
  accent: string;
}> = {
  GOLD:     { icon: Sparkles,  gradient: "from-amber-400 to-yellow-500",   bg: "from-amber-50 to-yellow-50",   label: "Gold",     accent: "text-amber-600"  },
  SILVER:   { icon: Gem,       gradient: "from-slate-400 to-gray-500",     bg: "from-slate-50 to-gray-100",    label: "Silver",   accent: "text-slate-600"  },
  DIAMOND:  { icon: Diamond,   gradient: "from-cyan-400 to-blue-500",      bg: "from-cyan-50 to-blue-50",      label: "Diamond",  accent: "text-cyan-600"   },
  PLATINUM: { icon: Box,       gradient: "from-violet-400 to-purple-500",  bg: "from-violet-50 to-purple-50",  label: "Platinum", accent: "text-violet-600" },
};

// ─── Product Card ─────────────────────────────────────────────────────────────

const ProductCard = ({
  product, index, onDelete,
}: { product: Product; index: number; onDelete: (id: string) => void }) => {
  const meta = CATEGORY_META[product.category];
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden"
    >
      {/* Top color bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${meta.gradient}`} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-md`}>
            <Icon size={20} className="text-white" />
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(product._id!)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 size={15} />
          </motion.button>
        </div>

        <h3 className="font-bold text-gray-900 text-base mb-1 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-4">{product.type}</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r ${meta.bg} ${meta.accent} border border-current/10`}>
              {meta.label}
            </span>
            {product.karat && (
              <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                {product.karat}
              </span>
            )}
          </div>
          {product.hsnNumber && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Hash size={11} />
              <span>HSN {product.hsnNumber}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Add Product Form (slide-over panel) ─────────────────────────────────────

const AddProductPanel = ({
  open, onClose,
}: { open: boolean; onClose: () => void }) => {
  const createProduct = useCreateProduct();

  const [form, setForm] = useState({
    name: "",
    type: "",
    customType: "",
    category: "GOLD" as Product["category"],
    karat: "22K" as Product["karat"],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.type && !form.customType.trim()) e.type = "Product type is required";
    if (form.category === "GOLD" && !form.karat) e.karat = "Karat is required for gold";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const productType = form.type === "Other" ? form.customType.trim() : (form.type || form.customType.trim());
    await createProduct.mutateAsync({
      name: form.name.trim(),
      type: productType,
      category: form.category,
      karat: form.category === "GOLD" ? form.karat : undefined,
    });
    // reset
    setForm({ name: "", type: "", customType: "", category: "GOLD", karat: "22K" });
    setErrors({});
    onClose();
  };

  const meta = CATEGORY_META[form.category];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${meta.gradient} p-6 text-white`}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold">Add Product</h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X size={18} />
                </motion.button>
              </div>
              <p className="text-white/80 text-sm">
                Add a new jewellery product to your catalog
              </p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Category selector */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map(cat => {
                    const m = CATEGORY_META[cat];
                    const CatIcon = m.icon;
                    const active = form.category === cat;
                    return (
                      <motion.button
                        key={cat}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => set("category", cat)}
                        className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left
                          ${active
                            ? `border-transparent bg-gradient-to-r ${m.bg} shadow-md`
                            : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.gradient} flex items-center justify-center flex-shrink-0`}>
                          <CatIcon size={15} className="text-white" />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${active ? m.accent : "text-gray-700"}`}>{m.label}</p>
                          <p className="text-xs text-gray-400">HSN {HSN_MAP[cat]}</p>
                        </div>
                        {active && (
                          <motion.div
                            layoutId="cat-check"
                            className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-br ${m.gradient}`}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Product name */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Tag size={14} /> Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="e.g. Ladies Diamond Solitaire Ring"
                  className={`w-full px-4 py-3 rounded-xl border-2 outline-none font-medium text-sm transition-all
                    ${errors.name
                      ? "border-red-300 bg-red-50/50"
                      : "border-gray-200 hover:border-gray-300 focus:border-blue-400 focus:bg-white bg-gray-50/80"
                    }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={12} />{errors.name}
                  </p>
                )}
              </div>

              {/* Product type */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Package size={14} /> Type <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.type}
                    onChange={e => set("type", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none font-medium text-sm appearance-none cursor-pointer transition-all
                      ${errors.type
                        ? "border-red-300 bg-red-50/50"
                        : "border-gray-200 hover:border-gray-300 focus:border-blue-400 bg-gray-50/80"
                      }`}
                  >
                    <option value="">Select type…</option>
                    {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {form.type === "Other" && (
                  <motion.input
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    value={form.customType}
                    onChange={e => set("customType", e.target.value)}
                    placeholder="Enter custom type…"
                    className="mt-2 w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm bg-gray-50/80 font-medium"
                  />
                )}
                {errors.type && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={12} />{errors.type}
                  </p>
                )}
              </div>

              {/* Karat — only for GOLD */}
              <AnimatePresence>
                {form.category === "GOLD" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <Sparkles size={14} /> Karat <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {KARATS.map(k => (
                        <motion.button
                          key={k}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => set("karat", k)}
                          className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all
                            ${form.karat === k
                              ? "border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 shadow-sm"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                            }`}
                        >
                          {k}
                        </motion.button>
                      ))}
                    </div>
                    {errors.karat && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                        <AlertTriangle size={12} />{errors.karat}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* HSN preview */}
              <div className={`rounded-xl p-4 bg-gradient-to-r ${meta.bg} border border-current/10`}>
                <p className="text-xs font-semibold text-gray-500 mb-1">Auto-assigned HSN Code</p>
                <p className={`text-2xl font-bold font-mono ${meta.accent}`}>{HSN_MAP[form.category]}</p>
                <p className="text-xs text-gray-400 mt-0.5">Set automatically based on category</p>
              </div>

              {/* Server error */}
              {createProduct.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                  <AlertTriangle size={14} />
                  {(createProduct.error as any)?.response?.data?.message || "Failed to add product"}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={createProduct.isPending}
                className={`w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r ${meta.gradient}
                  shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2`}
              >
                {createProduct.isPending ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding Product…
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Add to Catalog
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

const DeleteDialog = ({
  product, onConfirm, onCancel, isLoading,
}: { product: Product | null; onConfirm: () => void; onCancel: () => void; isLoading: boolean }) => (
  <AnimatePresence>
    {product && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
        >
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={26} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Remove Product?</h3>
          <p className="text-gray-500 text-sm text-center mb-6">
            <span className="font-semibold text-gray-800">{product.name}</span> will be permanently deleted.
          </p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 text-sm">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 text-sm disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Delete
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ─── Stats Bar ────────────────────────────────────────────────────────────────

const StatsBar = ({ products }: { products: Product[] }) => {
  const counts = CATEGORIES.reduce((acc, c) => {
    acc[c] = products.filter(p => p.category === c).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {CATEGORIES.map((cat, i) => {
        const meta = CATEGORY_META[cat];
        const Icon = meta.icon;
        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`bg-gradient-to-br ${meta.bg} rounded-2xl p-4 border border-white/60 shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow`}>
                <Icon size={16} className="text-white" />
              </div>
              <span className={`text-2xl font-black ${meta.accent}`}>{counts[cat]}</span>
            </div>
            <p className="text-sm font-semibold text-gray-600">{meta.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ProductsPage = () => {
  const { data: products = [], isLoading, error } = useProducts();
  const deleteProduct = useDeleteProduct();

  const [panelOpen, setPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const filtered = products.filter(p => {
    const matchCat = activeCategory === "ALL" || p.category === activeCategory;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDelete = async () => {
    if (!toDelete?._id) return;
    await deleteProduct.mutateAsync(toDelete._id);
    setToDelete(null);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient blobs matching app theme */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-400/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-400/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-7xl mx-auto space-y-8"
      >
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Product Catalog
            </h1>
            <p className="text-gray-500 mt-1">
              {products.length} {products.length === 1 ? "product" : "products"} in your catalog
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600
              text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 self-start sm:self-auto"
          >
            <Plus size={19} />
            Add Product
          </motion.button>
        </div>

        {/* Stats */}
        <StatsBar products={products} />

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or type…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm font-medium bg-gray-50/80 focus:bg-white transition-all"
              />
            </div>
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {["ALL", ...CATEGORIES].map(cat => {
                const meta = cat !== "ALL" ? CATEGORY_META[cat] : null;
                const active = activeCategory === cat;
                return (
                  <motion.button
                    key={cat}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all
                      ${active
                        ? meta
                          ? `bg-gradient-to-r ${meta.gradient} text-white shadow-md`
                          : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                        : "text-gray-500 hover:bg-gray-100"
                      }`}
                  >
                    {cat === "ALL" ? "All" : CATEGORY_META[cat].label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                <div className="h-1.5 bg-gray-200 rounded-full mb-4" />
                <div className="w-11 h-11 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Failed to load products</h3>
            <p className="text-gray-500 text-sm">Check your connection and try again.</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Package size={36} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {search || activeCategory !== "ALL" ? "No matching products" : "No products yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {search || activeCategory !== "ALL"
                ? "Try adjusting your search or filter."
                : "Add your first product to start building your catalog."}
            </p>
            {!search && activeCategory === "ALL" && (
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => setPanelOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg"
              >
                <span className="flex items-center gap-2"><Plus size={18} /> Add First Product</span>
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            <AnimatePresence>
              {filtered.map((p, i) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  index={i}
                  onDelete={(id) => setToDelete(products.find(x => x._id === id) || null)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      <AddProductPanel open={panelOpen} onClose={() => setPanelOpen(false)} />

      <DeleteDialog
        product={toDelete}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        isLoading={deleteProduct.isPending}
      />
    </div>
  );
};

export default ProductsPage;