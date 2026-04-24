import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
  Gem,
  Hash,
  Package,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["GOLD", "SILVER"] as const;
const KARATS = ["18K", "22K", "24K"] as const;
const HSN_CODE = "7113";

const PRODUCT_TYPES = [
  "Ring", "Necklace", "Bangle", "Bracelet", "Earring",
  "Pendant", "Chain", "Anklet", "Mangalsutra", "Nose Pin",
  "Coin", "Bar", "Other",
] as const;

const CATEGORY_META = {
  GOLD: {
    icon: Sparkles,
    gradient: "from-amber-400 to-yellow-500",
    bg: "from-amber-50 to-yellow-50",
    label: "Gold",
    accent: "text-amber-600",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
  },
  SILVER: {
    icon: Gem,
    gradient: "from-slate-400 to-gray-500",
    bg: "from-slate-50 to-gray-100",
    label: "Silver",
    accent: "text-slate-600",
    border: "border-slate-200",
    badge: "bg-slate-100 text-slate-700",
  },
} as const;

// ─── Empty form state ─────────────────────────────────────────────────────────

const emptyForm = () => ({
  name: "",
  type: "" as string,
  customType: "",
  category: "GOLD" as Product["category"],
  karat: "22K" as Product["karat"],
});

const formFromProduct = (p: Product) => ({
  name: p.name,
  type: PRODUCT_TYPES.includes(p.type as any) ? p.type : "Other",
  customType: PRODUCT_TYPES.includes(p.type as any) ? "" : p.type,
  category: p.category,
  karat: p.karat ?? "22K",
});

// ─── Product Card ─────────────────────────────────────────────────────────────

const ProductCard = ({
  product,
  index,
  onDelete,
  onEdit,
}: {
  product: Product;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (p: Product) => void;
}) => {
  const meta = CATEGORY_META[product.category as keyof typeof CATEGORY_META];
  const Icon = meta.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      whileHover={{ y: -3 }}
      className="group relative rounded-2xl border border-white/60 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg"
    >
      {/* Category bar */}
      <div className={`h-1 w-full rounded-t-2xl bg-gradient-to-r ${meta.gradient}`} />

      <div className="flex flex-col p-4">
        {/* Top row */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} shadow-sm`}>
            <Icon size={18} className="text-white" />
          </div>

          {/* Actions — visible on hover (desktop), always visible mobile */}
          <div className="flex gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            <button
              onClick={() => onEdit(product)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
              title="Edit"
            >
              <Tag size={14} />
            </button>
            <button
              onClick={() => onDelete(product._id!)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <h3 className="mb-0.5 truncate text-sm font-bold text-gray-900">{product.name}</h3>
        <p className="mb-3 truncate text-xs text-gray-500">{product.type}</p>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}>
            {meta.label}
          </span>
          {product.karat && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">
              {product.karat}
            </span>
          )}
          {product.hsnNumber && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Hash size={10} /> {product.hsnNumber}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Add / Edit Panel ─────────────────────────────────────────────────────────

const ProductPanel = ({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}) => {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const isEditing = !!product?._id;
  const isPending = createProduct.isPending || updateProduct.isPending;

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form whenever the panel opens


  useEffect(() => {
    const handleOpenChange = (o: boolean) => {
      if (o) {
        setForm(product ? formFromProduct(product) : emptyForm());
        setErrors({});
      } else {
        onClose();
      }
    };
    handleOpenChange(open);
  }, [open])

  const set = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.type) e.type = "Product type is required";
    if (form.type === "Other" && !form.customType.trim()) e.type = "Custom type is required";
    if (form.category === "GOLD" && !form.karat) e.karat = "Karat is required for gold";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      type: form.type === "Other" ? form.customType.trim() : form.type,
      category: form.category,
      karat: form.category === "GOLD" ? form.karat : undefined,
    };

    try {
      if (isEditing) {
        await updateProduct.mutateAsync({ ...payload, productId: product!._id! });
      } else {
        await createProduct.mutateAsync(payload);
      }
      onClose();
    } catch { /* errors shown inline */ }
  };

  const meta = CATEGORY_META[form.category];
  const apiError = (createProduct.error || updateProduct.error) as any;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-md"
          >
            {/* Panel header */}
            <div className={`bg-gradient-to-r ${meta.gradient} p-5 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{isEditing ? "Edit Product" : "Add Product"}</h2>
                  <p className="mt-0.5 text-sm text-white/80">
                    {isEditing ? "Update product details" : "Add a new item to your catalog"}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg bg-white/20 p-1.5 transition-colors hover:bg-white/30"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5">

              {/* Category */}
              <div>
                <Label className="mb-2 block">Category</Label>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => {
                    const m = CATEGORY_META[cat];
                    const CatIcon = m.icon;
                    const active = form.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => set("category", cat)}
                        className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${active
                          ? `bg-gradient-to-r ${m.bg} border-transparent shadow-sm`
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${m.gradient}`}>
                          <CatIcon size={14} className="text-white" />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${active ? m.accent : "text-gray-700"}`}>{m.label}</p>
                          <p className="text-xs text-gray-400">HSN {HSN_CODE}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Product Name <span className="text-red-400">*</span></Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Ladies Diamond Solitaire Ring"
                  className={errors.name ? "border-red-300 focus-visible:ring-red-300" : ""}
                />
                {errors.name && <p className="flex items-center gap-1 text-xs text-red-500"><AlertTriangle size={11} />{errors.name}</p>}
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label>Type <span className="text-red-400">*</span></Label>
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger className={errors.type ? "border-red-300" : ""}>
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {form.type === "Other" && (
                  <Input
                    value={form.customType}
                    onChange={(e) => set("customType", e.target.value)}
                    placeholder="Enter custom type…"
                    className="mt-2"
                  />
                )}
                {errors.type && <p className="flex items-center gap-1 text-xs text-red-500"><AlertTriangle size={11} />{errors.type}</p>}
              </div>

              {/* Karat — gold only */}
              <AnimatePresence>
                {form.category === "GOLD" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden space-y-1.5"
                  >
                    <Label>Karat <span className="text-red-400">*</span></Label>
                    <div className="grid grid-cols-3 gap-2">
                      {KARATS.map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => set("karat", k)}
                          className={`rounded-xl border-2 py-2.5 text-sm font-bold transition-all ${form.karat === k
                            ? "border-amber-400 bg-amber-50 text-amber-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                            }`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                    {errors.karat && <p className="flex items-center gap-1 text-xs text-red-500"><AlertTriangle size={11} />{errors.karat}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* HSN preview */}
              <div className={`rounded-xl border ${meta.border} bg-gradient-to-r ${meta.bg} p-4`}>
                <p className="mb-1 text-xs font-semibold text-gray-500">Auto-assigned HSN Code</p>
                <p className={`font-mono text-2xl font-black ${meta.accent}`}>{HSN_CODE}</p>
                <p className="mt-0.5 text-xs text-gray-400">Set automatically based on category</p>
              </div>

              {/* API error */}
              {apiError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <AlertTriangle size={14} />
                  {apiError?.response?.data?.message || "Something went wrong"}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="border-t p-5">
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className={`w-full bg-gradient-to-r ${meta.gradient} hover:opacity-90 border-0 py-5 font-bold text-white shadow-md`}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {isEditing ? "Updating…" : "Adding…"}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plus size={18} />
                    {isEditing ? "Update Product" : "Add to Catalog"}
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Delete Dialog ─────────────────────────────────────────────────────────────

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
  <Dialog open={!!product} onOpenChange={(o) => { if (!o) onCancel(); }}>
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <DialogTitle className="text-center">Remove Product?</DialogTitle>
        <p className="text-center text-sm text-muted-foreground">
          <span className="font-semibold text-gray-800">{product?.name}</span> will be permanently deleted.
        </p>
      </DialogHeader>
      <DialogFooter className="flex-row gap-3 sm:gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Delete"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// ─── Stats Bar ────────────────────────────────────────────────────────────────

const StatsBar = ({ products }: { products: Product[] }) => (
  <div className="grid grid-cols-2 gap-4">
    {CATEGORIES.map((cat, i) => {
      const meta = CATEGORY_META[cat];
      const Icon = meta.icon;
      const count = products.filter((p) => p.category === cat).length;
      return (
        <motion.div
          key={cat}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className={`rounded-2xl border ${meta.border} bg-gradient-to-br ${meta.bg} p-4 shadow-sm`}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} shadow-sm`}>
              <Icon size={16} className="text-white" />
            </div>
            <span className={`text-2xl font-black ${meta.accent}`}>{count}</span>
          </div>
          <p className="text-sm font-semibold text-gray-600">{meta.label} Products</p>
        </motion.div>
      );
    })}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const ProductsPage = () => {
  const { data: products = [], isLoading, error } = useProducts();
  const deleteProduct = useDeleteProduct();

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const filtered = useMemo(() =>
    products.filter((p) => {
      const matchCat = activeCategory === "ALL" || p.category === activeCategory;
      const q = search.trim().toLowerCase();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.karat?.toLowerCase().includes(q) ?? false);
      return matchCat && matchSearch;
    }),
    [products, activeCategory, search]
  );

  const openAdd = () => { setEditingProduct(null); setPanelOpen(true); };
  const openEdit = (p: Product) => { setEditingProduct(p); setPanelOpen(true); };
  const closePanel = () => { setPanelOpen(false); setEditingProduct(null); };

  const handleDelete = async () => {
    if (!toDelete?._id) return;
    await deleteProduct.mutateAsync(toDelete._id);
    setToDelete(null);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? "product" : "products"} in your catalog
            </p>
          </div>
          <Button onClick={openAdd} className="w-full sm:w-auto">
            <Plus size={16} className="mr-2" /> Add Product
          </Button>
        </div>

        {/* Stats */}
        {!isLoading && products.length > 0 && <StatsBar products={products} />}

        {/* Search + filter */}
        <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, type or karat…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 sm:pb-0">
            {["ALL", ...CATEGORIES].map((cat) => {
              const meta = cat !== "ALL" ? CATEGORY_META[cat as keyof typeof CATEGORY_META] : null;
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${active
                    ? meta
                      ? `bg-gradient-to-r ${meta.gradient} text-white shadow-sm`
                      : "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100"
                    }`}
                >
                  {cat === "ALL" ? "All" : CATEGORY_META[cat as keyof typeof CATEGORY_META].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-white p-4 space-y-3">
                <Skeleton className="h-1 w-full rounded-full" />
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <AlertTriangle size={40} className="mx-auto mb-3 text-red-400" />
            <h3 className="text-lg font-bold text-gray-800">Failed to load products</h3>
            <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
              <Package size={30} className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              {search || activeCategory !== "ALL" ? "No matching products" : "No products yet"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || activeCategory !== "ALL"
                ? "Try adjusting your search or filter."
                : "Add your first product to start building your catalog."}
            </p>
            {!search && activeCategory === "ALL" && (
              <Button onClick={openAdd} className="mt-4">
                <Plus size={16} className="mr-2" /> Add First Product
              </Button>
            )}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {filtered.map((p, i) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  index={i}
                  onEdit={openEdit}
                  onDelete={(id) => setToDelete(products.find((x) => x._id === id) ?? null)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <ProductPanel open={panelOpen} onClose={closePanel} product={editingProduct} />
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