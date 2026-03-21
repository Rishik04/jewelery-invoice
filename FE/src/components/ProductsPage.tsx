import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
  type Product,
} from "@/features/product/useProduct";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  Gem,
  Hash,
  Package,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["GOLD", "SILVER"] as const;
const KARATS = ["18K", "22K", "24K"] as const;

const PRODUCT_TYPES = [
  "Ring",
  "Necklace",
  "Bangle",
  "Bracelet",
  "Earring",
  "Pendant",
  "Chain",
  "Anklet",
  "Mangalsutra",
  "Nose Pin",
  "Coin",
  "Bar",
  "Other",
] as const;

const HSN_MAP: Record<string, string> = {
  GOLD: "7113",
  SILVER: "7113",
};

const CATEGORY_META: Record<
  string,
  {
    icon: React.FC<any>;
    gradient: string;
    bg: string;
    label: string;
    accent: string;
    softBorder: string;
  }
> = {
  GOLD: {
    icon: Sparkles,
    gradient: "from-amber-400 to-yellow-500",
    bg: "from-amber-50 to-yellow-50",
    label: "Gold",
    accent: "text-amber-600",
    softBorder: "border-amber-200/60",
  },
  SILVER: {
    icon: Gem,
    gradient: "from-slate-400 to-gray-500",
    bg: "from-slate-50 to-gray-100",
    label: "Silver",
    accent: "text-slate-600",
    softBorder: "border-slate-200/60",
  },
};

// ─── Product Card ─────────────────────────────────────────────────────────────

const ProductCard = ({
  product,
  index,
  onDelete,
  onEdit
}: {
  product: Product;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (product: Product) => void;
}) => {
  const meta = CATEGORY_META[product.category];
  const Icon = meta.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="group relative h-full rounded-2xl border border-white/60 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
    >
      <div className={`h-1.5 w-full rounded-t-2xl bg-gradient-to-r ${meta.gradient}`} />

      <div className="flex h-[calc(100%-6px)] flex-col p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} shadow-md`}
          >
            <Icon size={20} className="text-white" />
          </div>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => onDelete(product._id!)}
            className="rounded-lg p-1.5 text-gray-300 transition-all hover:bg-red-50 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Trash2 size={15} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => onEdit(product)}
            className="rounded-lg p-1.5 text-gray-300 transition-all hover:bg-blue-50 hover:text-blue-500 sm:opacity-0 sm:group-hover:opacity-100"
          >
            ✏️
          </motion.button>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="mb-1 truncate text-base font-bold text-gray-900 sm:text-lg">
            {product.name}
          </h3>
          <p className="mb-4 line-clamp-1 text-sm text-gray-500">{product.type}</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`inline-flex max-w-full items-center rounded-full border border-current/10 bg-gradient-to-r px-2.5 py-1 text-xs font-semibold ${meta.bg} ${meta.accent}`}
              >
                {meta.label}
              </span>

              {product.karat && (
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">
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
      </div>
    </motion.div>
  );
};

// ─── Add Product Form ─────────────────────────────────────────────────────────

const AddProductPanel = ({
  open,
  onClose,
  product
}: {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}) => {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        type: PRODUCT_TYPES.includes(product.type as any)
          ? product.type
          : "Other",
        customType: PRODUCT_TYPES.includes(product.type as any)
          ? ""
          : product.type || "",
        category: product.category,
        karat: product.karat || "22K",
      });
    }
  }, [product]);

  const [form, setForm] = useState({
    name: "",
    type: "",
    customType: "",
    category: "GOLD" as Product["category"],
    karat: "22K" as Product["karat"],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.type && !form.customType.trim()) e.type = "Product type is required";
    if (form.type === "Other" && !form.customType.trim()) {
      e.type = "Custom product type is required";
    }
    if (form.category === "GOLD" && !form.karat) e.karat = "Karat is required for gold";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const productType =
      form.type === "Other"
        ? form.customType.trim()
        : form.type || form.customType.trim();

    const payload = {
      name: form.name.trim(),
      type: productType,
      category: form.category,
      karat: form.category === "GOLD" ? form.karat : undefined,
    };

    try {
      if (product?._id) {
        await updateProduct.mutateAsync({
          ...payload,
          productId: product._id,
        });
      } else {
        await createProduct.mutateAsync(payload);
      }

      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const meta = CATEGORY_META[form.category];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-md"
          >
            <div className={`bg-gradient-to-r ${meta.gradient} p-5 text-white sm:p-6`}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold sm:text-xl">
                  {product ? "Edit Product" : "Add Product"}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.08, rotate: 90 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={onClose}
                  className="rounded-lg bg-white/20 p-1.5 transition-colors hover:bg-white/30"
                >
                  <X size={18} />
                </motion.button>
              </div>
              <p className="text-sm text-white/80">
                Add a new jewellery product to your catalog
              </p>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
              <div>
                <label className="mb-3 block text-sm font-semibold text-gray-700">
                  Category
                </label>

                <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2">
                  {CATEGORIES.map((cat) => {
                    const m = CATEGORY_META[cat];
                    const CatIcon = m.icon;
                    const active = form.category === cat;

                    return (
                      <motion.button
                        key={cat}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => set("category", cat)}
                        className={`relative flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${active
                          ? `bg-gradient-to-r ${m.bg} shadow-md border-transparent`
                          : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${m.gradient}`}
                        >
                          <CatIcon size={15} className="text-white" />
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`text-sm font-bold ${active ? m.accent : "text-gray-700"
                              }`}
                          >
                            {m.label}
                          </p>
                          <p className="text-xs text-gray-400">HSN {HSN_MAP[cat]}</p>
                        </div>

                        {active && (
                          <motion.div
                            layoutId="cat-check"
                            className={`absolute right-2 top-2 h-2 w-2 rounded-full bg-gradient-to-br ${m.gradient}`}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Tag size={14} /> Product Name <span className="text-red-400">*</span>
                </label>

                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Ladies Diamond Solitaire Ring"
                  className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium outline-none transition-all ${errors.name
                    ? "border-red-300 bg-red-50/50"
                    : "border-gray-200 bg-gray-50/80 hover:border-gray-300 focus:border-blue-400 focus:bg-white"
                    }`}
                />

                {errors.name && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                    <AlertTriangle size={12} />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Package size={14} /> Type <span className="text-red-400">*</span>
                </label>

                <div className="relative">
                  <select
                    value={form.type}
                    onChange={(e) => set("type", e.target.value)}
                    className={`w-full appearance-none rounded-xl border-2 px-4 py-3 text-sm font-medium outline-none transition-all ${errors.type
                      ? "border-red-300 bg-red-50/50"
                      : "border-gray-200 bg-gray-50/80 hover:border-gray-300 focus:border-blue-400"
                      }`}
                  >
                    <option value="">Select type…</option>
                    {PRODUCT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>

                {form.type === "Other" && (
                  <motion.input
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    value={form.customType}
                    onChange={(e) => set("customType", e.target.value)}
                    placeholder="Enter custom type…"
                    className="mt-2 w-full rounded-xl border-2 border-gray-200 bg-gray-50/80 px-4 py-3 text-sm font-medium outline-none focus:border-blue-400"
                  />
                )}

                {errors.type && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                    <AlertTriangle size={12} />
                    {errors.type}
                  </p>
                )}
              </div>

              <AnimatePresence>
                {form.category === "GOLD" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                      <Sparkles size={14} /> Karat <span className="text-red-400">*</span>
                    </label>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {KARATS.map((k) => (
                        <motion.button
                          key={k}
                          type="button"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => set("karat", k)}
                          className={`rounded-xl border-2 py-2.5 text-sm font-bold transition-all ${form.karat === k
                            ? "border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 shadow-sm"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                            }`}
                        >
                          {k}
                        </motion.button>
                      ))}
                    </div>

                    {errors.karat && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                        <AlertTriangle size={12} />
                        {errors.karat}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                className={`rounded-xl border ${meta.softBorder} bg-gradient-to-r ${meta.bg} p-4`}
              >
                <p className="mb-1 text-xs font-semibold text-gray-500">
                  Auto-assigned HSN Code
                </p>
                <p className={`font-mono text-2xl font-bold ${meta.accent}`}>
                  {HSN_MAP[form.category]}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Set automatically based on category
                </p>
              </div>

              {createProduct.error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <AlertTriangle size={14} />
                  {(createProduct.error as any)?.response?.data?.message ||
                    "Failed to add product"}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-4 sm:p-6">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSubmit}
                disabled={createProduct.isPending}
                className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${meta.gradient} py-4 font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-60`}
              >
                {createProduct.isPending ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Adding Product…
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    {product ? "Update Product" : "Add to Catalog"}
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

// ─── Delete Dialog ────────────────────────────────────────────────────────────

const DeleteDialog = ({
  product,
  onConfirm,
  onCancel,
  isLoading,
}: {
  product: Product | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) => (
  <AnimatePresence>
    {product && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <Trash2 size={26} className="text-red-500" />
          </div>

          <h3 className="mb-1 text-center text-lg font-bold text-gray-900">
            Remove Product?
          </h3>

          <p className="mb-6 text-center text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{product.name}</span> will
            be permanently deleted.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : null}
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
    acc[c] = products.filter((p) => p.category === c).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CATEGORIES.map((cat, i) => {
        const meta = CATEGORY_META[cat];
        const Icon = meta.icon;

        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-2xl border ${meta.softBorder} bg-gradient-to-br ${meta.bg} p-4 shadow-sm`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} shadow`}
              >
                <Icon size={16} className="text-white" />
              </div>
              <span className={`text-2xl font-black ${meta.accent}`}>
                {counts[cat]}
              </span>
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === "ALL" || p.category === activeCategory;
      const q = search.trim().toLowerCase();

      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.karat?.toLowerCase().includes(q) ?? false);

      return matchCat && matchSearch;
    });
  }, [products, activeCategory, search]);

  const handleDelete = async () => {
    if (!toDelete?._id) return;
    await deleteProduct.mutateAsync(toDelete._id);
    setToDelete(null);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-purple-400/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Product Catalog
            </h1>
            <p className="mt-1 text-sm text-gray-500 sm:text-base">
              {products.length} {products.length === 1 ? "product" : "products"} in
              your catalog
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPanelOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl sm:w-auto"
          >
            <Plus size={19} />
            Add Product
          </motion.button>
        </div>

        <StatsBar products={products} />

        <div className="rounded-2xl border border-white/40 bg-white/70 p-4 shadow-lg backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, type, category or karat…"
                className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/80 py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition-all focus:border-blue-400 focus:bg-white"
              />
            </div>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:px-0">
              {["ALL", ...CATEGORIES].map((cat) => {
                const meta = cat !== "ALL" ? CATEGORY_META[cat] : null;
                const active = activeCategory === cat;

                return (
                  <motion.button
                    key={cat}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-all ${active
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

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-5 shadow-sm animate-pulse"
              >
                <div className="mb-4 h-1.5 rounded-full bg-gray-200" />
                <div className="mb-4 h-11 w-11 rounded-xl bg-gray-200" />
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
            <h3 className="mb-2 text-xl font-bold text-gray-800">
              Failed to load products
            </h3>
            <p className="text-sm text-gray-500">
              Check your connection and try again.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center sm:py-24">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100">
              <Package size={36} className="text-blue-400" />
            </div>

            <h3 className="mb-2 text-xl font-bold text-gray-800">
              {search || activeCategory !== "ALL"
                ? "No matching products"
                : "No products yet"}
            </h3>

            <p className="mb-6 text-sm text-gray-500">
              {search || activeCategory !== "ALL"
                ? "Try adjusting your search or filter."
                : "Add your first product to start building your catalog."}
            </p>

            {!search && activeCategory === "ALL" && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPanelOpen(true)}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-bold text-white shadow-lg"
              >
                <span className="flex items-center gap-2">
                  <Plus size={18} />
                  Add First Product
                </span>
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence>
              {filtered.map((p, i) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  index={i}
                  onEdit={(product) => {
                    setEditingProduct(product);
                    setPanelOpen(true)
                  }}
                  onDelete={(id) =>
                    setToDelete(products.find((x) => x._id === id) || null)
                  }
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      <AddProductPanel
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
      />
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