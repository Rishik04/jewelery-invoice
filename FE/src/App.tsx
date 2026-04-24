import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Authentication from "./pages/Authentication";
import CustomerPage from "./pages/Customer";
import ModernCompanyDashboard from "./pages/UpdatedDashboard";
import InvoicePage from "./pages/Invoice";
import InvoiceForm from "./pages/InvoiceForm";
import DashboardLayout from "./components/layouts/DashboardLayout";
import ProductsPage from "./pages/ProductsPage";
import { JSX } from "react";

const isLoggedIn = () => !!localStorage.getItem("token");

const ProtectedRoute = ({ children }: { children: JSX.Element }) =>
  isLoggedIn() ? children : <Navigate to="/login" replace />;

const PublicRoute = ({ children }: { children: JSX.Element }) =>
  isLoggedIn() ? <Navigate to="/dashboard" replace /> : children;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<PublicRoute><Authentication /></PublicRoute>}
        />

        <Route
          path="/"
          element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<ModernCompanyDashboard />} />
          <Route path=":id/invoice" element={<InvoiceForm />} />
          <Route path="customers" element={<CustomerPage />} />
          <Route path="invoices" element={<InvoicePage />} />
          <Route path="products" element={<ProductsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
