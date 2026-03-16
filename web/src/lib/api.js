const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8081/v1";

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
  return request("/users?skip=0&limit=1", { token });
}
