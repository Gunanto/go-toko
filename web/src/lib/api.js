const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8082/v1";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
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

export async function registerUser(name, username, email, password) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify({ name, username, email, password }),
  });
}

export async function fetchMe(token) {
  return request("/users/me", { token });
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

export async function listPayments({ token, skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  return request(`/payments?${params.toString()}`, { token });
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

export async function listCustomers({ token, skip = 0, limit = 200 } = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  return request(`/customers?${params.toString()}`, { token });
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
