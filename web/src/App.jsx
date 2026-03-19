import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Pos from "./pages/Pos";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Storefront from "./pages/Storefront";
import StoreProduct from "./pages/StoreProduct";
import StoreCart from "./pages/StoreCart";
import StoreOrderStatus from "./pages/StoreOrderStatus";
import StoreLogin from "./pages/StoreLogin";
import StoreRegister from "./pages/StoreRegister";
import StoreAccount from "./pages/StoreAccount";
import StoreOAuthCallback from "./pages/StoreOAuthCallback";
import RequireAuth from "./routes/RequireAuth";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/" element={<Storefront />} />
        <Route path="/store" element={<Storefront />} />
        <Route path="/store/login" element={<StoreLogin />} />
        <Route path="/store/register" element={<StoreRegister />} />
        <Route path="/store/account" element={<StoreAccount />} />
        <Route path="/store/auth/callback" element={<StoreOAuthCallback />} />
        <Route path="/store/:slug" element={<StoreProduct />} />
        <Route path="/store/cart" element={<StoreCart />} />
        <Route path="/store/orders/status" element={<StoreOrderStatus />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/pos" element={<Pos />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/customers/:id" element={<CustomerDetail />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </AppLayout>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
