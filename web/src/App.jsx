import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Pos from "./pages/Pos";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Inventory from "./pages/Inventory";
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
import RequireRole from "./routes/RequireRole";

const ChatInbox = lazy(() => import("./pages/ChatInbox"));
const StoreChat = lazy(() => import("./pages/StoreChat"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Reports = lazy(() => import("./pages/Reports"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-16">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-600 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
        Memuat halaman...
      </div>
    </div>
  );
}

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
        <Route
          path="/store/chat"
          element={
            <Suspense fallback={<RouteFallback />}>
              <StoreChat />
            </Suspense>
          }
        />
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
                  <Route
                    path="/products"
                    element={
                      <Suspense fallback={<RouteFallback />}>
                        <Products />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/products/:id"
                    element={
                      <Suspense fallback={<RouteFallback />}>
                        <ProductDetail />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <Suspense fallback={<RouteFallback />}>
                        <Orders />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/orders/:id"
                    element={
                      <Suspense fallback={<RouteFallback />}>
                        <OrderDetail />
                      </Suspense>
                    }
                  />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/customers/:id" element={<CustomerDetail />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route
                    path="/reports"
                    element={
                      <Suspense fallback={<RouteFallback />}>
                        <Reports />
                      </Suspense>
                    }
                  />
                  <Route path="/settings" element={<Settings />} />
                  <Route
                    path="/chat"
                    element={
                      <Suspense fallback={<RouteFallback />}>
                        <RequireRole role="admin">
                          <ChatInbox />
                        </RequireRole>
                      </Suspense>
                    }
                  />
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
