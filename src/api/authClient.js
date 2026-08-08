const API_BASE = "/api/auth";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Permintaan gagal");
  }

  return data;
}

export const authClient = {
  login(email, password) {
    return request("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(email, password) {
    return request("/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  me() {
    return request("/me");
  },

  logout() {
    return request("/logout", {
      method: "POST",
    });
  },
};
