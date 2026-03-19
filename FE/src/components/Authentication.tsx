import { useLogin, useOnboard } from "@/features/auth/useAuth";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight,
  Building, Lock, Mail,
  Shield, Sparkles, User, Zap
} from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";

// FIX: InputField was defined outside component but referenced in component body
// (there was a stray JSX call `<InputField .../>` at the top-level of the component
// function before the return — it was calling the component but discarding the result).
// Extracted as a proper named component.
const InputField = ({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  error = null,
  showPassword = false,
}: any) => (
  <div className="relative group">
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
      <Icon size={20} />
    </div>
    <input
      type={type === "password" && showPassword ? "text" : type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full pl-12 py-4 border-2 rounded-xl outline-none transition-all duration-300 font-medium
        ${error ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-blue-400 focus:bg-white"}`}
    />
    {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6 }}
    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
  >
    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
      <Icon size={24} className="text-white" />
    </div>
    <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
    <p className="text-white/80 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const ModernOnboarding = () => {
  const loginMutation = useLogin();
  const onboardMutation = useOnboard();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"login" | "onboard">("login");
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "", password: "", name: "", companyName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading = loginMutation.isPending || onboardMutation.isPending;
  // FIX: show server-side errors from mutations
  const serverError =
    (loginMutation.error as any)?.response?.data?.error ||
    (onboardMutation.error as any)?.response?.data?.error ||
    null;

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (activeTab === "login") {
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.password) newErrors.password = "Password is required";
    } else {
      if (step === 1) {
        if (!formData.name) newErrors.name = "Name is required";
        if (!formData.email) newErrors.email = "Email is required";
        if (!formData.password) newErrors.password = "Password is required";
      } else {
        if (!formData.companyName) newErrors.companyName = "Company name is required";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    if (activeTab === "onboard" && step === 1) {
      setStep(2);
      return;
    }

    try {
      if (activeTab === "login") {
        await loginMutation.mutateAsync({ email: formData.email, password: formData.password });
        // FIX: navigation is now inside useLogin onSuccess, but keep as fallback
        navigate("/dashboard");
      } else {
        await onboardMutation.mutateAsync({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
        });
        // After onboarding, switch to login tab
        setActiveTab("login");
        setStep(1);
      }
    } catch {
      // errors shown via serverError above
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div initial="hidden" animate="visible"
        className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero */}
          <motion.div className="space-y-8 text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Jewellery Billing
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block">
                  Made Simple
                </span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Manage invoices, products, and customers for your jewellery business with ease.
              </p>
            </div>
            <div className="grid gap-4">
              <FeatureCard icon={Zap} title="Instant PDF Invoices" description="Generate GST-compliant invoices and download PDFs in one click." delay={0.6} />
              <FeatureCard icon={Shield} title="Secure & Multi-Tenant" description="Each business has its own isolated data with JWT authentication." delay={0.8} />
              <FeatureCard icon={Sparkles} title="Smart Product Catalog" description="Manage gold, silver, diamond products with automatic HSN codes." delay={1.0} />
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }} className="w-full max-w-md mx-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-8 pb-0">
                <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
                  {(["login", "onboard"] as const).map((tab) => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setStep(1); setErrors({}); }}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300
                        ${activeTab === tab ? "bg-white text-gray-900 shadow-lg" : "text-gray-500 hover:text-gray-700"}`}>
                      {tab === "login" ? "Sign In" : "Get Started"}
                    </button>
                  ))}
                </div>

                {/* Server error banner */}
                {serverError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                    {serverError}
                  </div>
                )}
              </div>

              <div className="px-8 pb-8">
                <AnimatePresence mode="wait">
                  {activeTab === "login" && (
                    <motion.div key="login" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                      <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 mb-1">Welcome Back</h2>
                        <p className="text-gray-500 text-sm">Sign in to your account</p>
                      </div>
                      <div className="space-y-4">
                        <InputField icon={Mail} type="email" placeholder="Email address" value={formData.email}
                          onChange={(v: string) => handleInputChange("email", v)} error={errors.email} />
                        <InputField icon={Lock} type="password" placeholder="Password" value={formData.password}
                          onChange={(v: string) => handleInputChange("password", v)} error={errors.password}
                          showToggle showPassword={showPassword} setShowPassword={setShowPassword} />
                        <motion.button type="button" onClick={handleSubmit} disabled={isLoading}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-2xl hover:shadow-xl disabled:opacity-50 transition-all">
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Signing In...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">Sign In <ArrowRight size={20} /></span>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "onboard" && (
                    <motion.div key="onboard" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                      <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 mb-1">
                          {step === 1 ? "Create Account" : "Company Details"}
                        </h2>
                        <div className="mt-4 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <motion.div className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            animate={{ width: step === 1 ? "50%" : "100%" }} transition={{ duration: 0.5 }} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <AnimatePresence mode="wait">
                          {step === 1 ? (
                            <motion.div key="s1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                              <InputField icon={User} placeholder="Full name" value={formData.name}
                                onChange={(v: string) => handleInputChange("name", v)} error={errors.name} />
                              <InputField icon={Mail} type="email" placeholder="Email address" value={formData.email}
                                onChange={(v: string) => handleInputChange("email", v)} error={errors.email} />
                              <InputField icon={Lock} type="password" placeholder="Create password" value={formData.password}
                                onChange={(v: string) => handleInputChange("password", v)} error={errors.password} showToggle />
                              <motion.button type="button" onClick={handleSubmit} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-2xl">
                                <span className="flex items-center justify-center gap-2">Continue <ArrowRight size={20} /></span>
                              </motion.button>
                            </motion.div>
                          ) : (
                            <motion.div key="s2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                              <InputField icon={Building} placeholder="Company name" value={formData.companyName}
                                onChange={(v: string) => handleInputChange("companyName", v)} error={errors.companyName} />
                              <div className="flex gap-3">
                                <motion.button type="button" onClick={() => setStep(1)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-200">
                                  <span className="flex items-center justify-center gap-2"><ArrowLeft size={20} /> Back</span>
                                </motion.button>
                                <motion.button type="button" onClick={handleSubmit} disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                  className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-2xl disabled:opacity-50">
                                  {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      Creating...
                                    </span>
                                  ) : (
                                    <span className="flex items-center justify-center gap-2">Complete Setup <Sparkles size={20} /></span>
                                  )}
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModernOnboarding;
