const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8082/v1";

function buildApiUrl(path) {
  const normalizedBase = API_BASE.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(buildApiUrl(path), {
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.messages?.[0] || data?.message || "Request failed";
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function login(username, password) {
  return request("/users/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function registerUser(
  name,
  username,
  email,
  password,
  { token } = {},
) {
  return request("/users", {
    method: "POST",
    token,
    body: JSON.stringify({ name, username, email, password }),
  });
}

export async function fetchMe(token) {
  return request("/users/me", { token });
}

export async function listUsers({ token, skip = 0, limit = 100 } = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  return request(`/users?${params.toString()}`, { token });
}

export async function getUser(id, { token } = {}) {
  return request(`/users/${id}`, { token });
}

export async function updateUser(id, payload, { token } = {}) {
  return request(`/users/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id, { token } = {}) {
  return request(`/users/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function listCategories({ token, skip = 0, limit = 100 } = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  return request(`/categories?${params.toString()}`, { token });
}

export async function createCategory(name, { token } = {}) {
  return request("/categories", {
    method: "POST",
    token,
    body: JSON.stringify({ name }),
  });
}

export async function getCategory(id, { token } = {}) {
  return request(`/categories/${id}`, { token });
}

export async function updateCategory(id, payload, { token } = {}) {
  return request(`/categories/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id, { token } = {}) {
  return request(`/categories/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function listProducts({
  token,
  skip = 0,
  limit = 100,
  query = "",
  categoryId = "",
} = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  if (query) params.set("q", query);
  if (categoryId) params.set("category_id", String(categoryId));
  return request(`/products?${params.toString()}`, { token });
}

export async function createProduct(payload, { token } = {}) {
  return request("/products", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function getProduct(id, { token } = {}) {
  return request(`/products/${id}`, { token });
}

export async function listStoreProducts({
  skip = 0,
  limit = 100,
  query = "",
  categoryId = "",
} = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  if (query) params.set("q", query);
  if (categoryId) params.set("category_id", String(categoryId));
  return request(`/store/products?${params.toString()}`);
}

export async function listStoreCategories({ skip = 0, limit = 200 } = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  return request(`/store/categories?${params.toString()}`);
}

export async function getStoreProductBySlug(slug) {
  return request(`/store/products/${slug}`);
}

export async function listStorePayments({ skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  return request(`/store/payments?${params.toString()}`);
}

export async function findStoreCustomer({ phone = "", email = "" } = {}) {
  const params = new URLSearchParams();
  if (phone) params.set("phone", phone);
  if (email) params.set("email", email);
  return request(`/store/customers/lookup?${params.toString()}`);
}

export async function registerStoreCustomer(payload) {
  return request("/store/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchStoreAuthOptions() {
  return request("/store/auth/options");
}

export async function loginStoreCustomer(login, password) {
  return request("/store/auth/login", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });
}

export async function fetchStoreCustomerMe(token) {
  return request("/store/auth/me", { token });
}

export async function getStoreChat({ token } = {}) {
  return request("/store/chat", { token });
}

export async function listStoreChatMessages({
  token,
  skip = 0,
  limit = 50,
} = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  return request(`/store/chat/messages?${params.toString()}`, { token });
}

export async function sendStoreChatMessage(message, { token } = {}) {
  return request("/store/chat/messages", {
    method: "POST",
    token,
    body: JSON.stringify({ message }),
  });
}

export async function markStoreChatRead({ token } = {}) {
  return request("/store/chat/read", {
    method: "POST",
    token,
  });
}

export function getStoreGoogleAuthStartUrl(redirect = "/store/account") {
  const apiBase = API_BASE.endsWith("/v1") ? API_BASE.slice(0, -3) : API_BASE;
  const params = new URLSearchParams({ redirect });
  return `${apiBase}/v1/store/auth/google/start?${params.toString()}`;
}

export async function bulkCreateProducts(products, { token } = {}) {
  return request("/products/bulk", {
    method: "POST",
    token,
    body: JSON.stringify({ products }),
  });
}

export async function updateProduct(id, payload, { token } = {}) {
  return request(`/products/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id, { token } = {}) {
  return request(`/products/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function uploadProductImage(file, { token } = {}) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/uploads/products", {
    method: "POST",
    token,
    body: formData,
  });
}

export async function listPayments({ token, skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  return request(`/payments?${params.toString()}`, { token });
}

export async function createPayment(payload, { token } = {}) {
  return request("/payments", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function getPayment(id, { token } = {}) {
  return request(`/payments/${id}`, { token });
}

export async function updatePayment(id, payload, { token } = {}) {
  return request(`/payments/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deletePayment(id, { token } = {}) {
  return request(`/payments/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function listOrders({
  token,
  skip = 0,
  limit = 50,
  status = "",
  dateFrom = "",
  dateTo = "",
} = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  if (status) params.set("status", status);
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  return request(`/orders?${params.toString()}`, { token });
}

export async function createOrder(payload, { token } = {}) {
  return request("/orders", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function createStoreOrder(payload) {
  return request("/store/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listStoreOrdersHistory({
  phone = "",
  email = "",
  skip = 0,
  limit = 10,
} = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  if (phone) params.set("phone", phone);
  if (email) params.set("email", email);
  return request(`/store/orders/history?${params.toString()}`);
}

export async function getStoreOrderByReceipt(receiptCode) {
  return request(`/store/orders/${encodeURIComponent(receiptCode)}`);
}

export async function getOrder(id, { token } = {}) {
  return request(`/orders/${id}`, { token });
}

export async function payOrder(id, payload, { token } = {}) {
  return request(`/orders/${id}/pay`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function listCustomers({ token, skip = 0, limit = 200 } = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  return request(`/customers?${params.toString()}`, { token });
}

export async function getCustomer(id, { token } = {}) {
  return request(`/customers/${id}`, { token });
}

export async function createCustomer(payload, { token } = {}) {
  return request("/customers", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateCustomer(id, payload, { token } = {}) {
  return request(`/customers/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteCustomer(id, { token } = {}) {
  return request(`/customers/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function fetchSettings({ token } = {}) {
  return request("/settings", { token });
}

export async function fetchStoreSettings() {
  return request("/store/settings");
}

export async function updateSettings(payload, { token } = {}) {
  return request("/settings", {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function listAdminChatConversations({
  token,
  skip = 0,
  limit = 50,
  status = "",
} = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  if (status) params.set("status", status);
  return request(`/chat/conversations?${params.toString()}`, { token });
}

export async function listAdminChatMessages(
  conversationId,
  { token, skip = 0, limit = 50 } = {},
) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  return request(
    `/chat/conversations/${conversationId}/messages?${params.toString()}`,
    { token },
  );
}

export async function sendAdminChatMessage(
  conversationId,
  body,
  { token } = {},
) {
  return request(`/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    token,
    body: JSON.stringify({ message: body }),
  });
}

export async function markAdminChatRead(conversationId, { token } = {}) {
  return request(`/chat/conversations/${conversationId}/read`, {
    method: "POST",
    token,
  });
}
