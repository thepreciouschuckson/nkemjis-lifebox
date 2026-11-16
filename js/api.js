const JSON_HEADERS = { "Content-Type": "application/json" };

async function call(path, opts = {}) {
  const r = await fetch(path, { credentials: "same-origin", headers: JSON_HEADERS, ...opts });
  if (r.status === 401) throw Object.assign(new Error("Not signed in"), { auth: true });
  if (!r.ok) throw new Error("Request failed");
  return r.status === 204 ? null : r.json();
}

export const api = {
  hasSession: () => fetch("/api/login", { credentials: "same-origin" }).then((r) => r.ok),
  login: (password) =>
    fetch("/api/login", { method: "POST", credentials: "same-origin", headers: JSON_HEADERS, body: JSON.stringify({ password }) }).then((r) => r.ok),
  list: () => call("/api/items"),
  create: (data) => call("/api/items", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => call(`/api/items/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => call(`/api/items/${id}`, { method: "DELETE" }),
};
