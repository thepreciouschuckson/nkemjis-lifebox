import { STATUSES, GROUPS, CATEGORIES } from "./config.js";
import { api } from "./api.js";

const $ = (s) => document.querySelector(s);
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cat = (k) => CATEGORIES.find((c) => c.key === k);
const group = (k) => GROUPS.find((g) => g.key === k);

let items = [];
let editingId = null;
const f = { group: "", category: "", tag: "", q: "" };

function filtered() {
  const q = f.q.trim().toLowerCase();
  return items.filter((i) => {
    const c = cat(i.category);
    if (f.group && c?.group !== f.group) return false;
    if (f.category && i.category !== f.category) return false;
    if (f.tag && !i.tags.includes(f.tag)) return false;
    if (!q) return true;
    return [i.title, i.notes, i.link, c?.label, ...i.tags, ...Object.values(i.extra || {})].join(" ").toLowerCase().includes(q);
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function renderChips() {
  $("#groups").innerHTML = [{ key: "", label: "Everything" }, ...GROUPS].map((g) =>
    `<button class="chip group ${f.group === g.key ? "on" : ""}" data-group="${g.key}" style="--c:${g.color || "#7b4fa3"}">${esc(g.label)}</button>`).join("");
  const cats = f.group ? CATEGORIES.filter((c) => c.group === f.group) : [];
  $("#cats").innerHTML = cats.map((c) =>
    `<button class="chip ${f.category === c.key ? "on" : ""}" data-cat="${c.key}">${c.emoji} ${esc(c.label)}</button>`).join("");
  $("#cats").hidden = !cats.length;
  $("#gamesnight").classList.toggle("on", f.tag === "games night");
}

function card(i) {
  const c = cat(i.category) || { emoji: "🧺", label: "Random Finds", group: "odds" };
  const col = group(c.group)?.color || "#b8b8c8";
  const st = STATUSES.find((s) => s.key === i.status);
  const media = i.image ? `<img src="${esc(i.image)}" alt="" loading="lazy">` : `<span>${c.emoji}</span>`;
  return `<button class="card ${c.imageFirst ? "tall" : ""}" data-id="${esc(i.id)}" style="--c:${col}">
    <div class="media">${media}</div>
    <div class="body"><h3>${esc(i.title)}</h3>
    <p class="meta">${c.emoji} ${esc(c.label)} ${st ? `<b title="${esc(st.label)}">${st.emoji}</b>` : ""}</p>
    ${i.tags.length ? `<p class="tags">${i.tags.map((t) => `<i>${esc(t)}</i>`).join("")}</p>` : ""}</div></button>`;
}

function render() {
  renderChips();
  const list = filtered();
  $("#count").textContent = `${list.length} ${list.length === 1 ? "find" : "finds"}`;
  $("#grid").innerHTML = list.length ? list.map(card).join("") : `<p class="empty">Nothing here yet. Tap + to save your first find.</p>`;
}

/* Editor */
const dlg = $("#dlg");
const form = $("#form");

$("#f-cat").innerHTML = GROUPS.map((g) =>
  `<optgroup label="${esc(g.label)}">${CATEGORIES.filter((c) => c.group === g.key).map((c) => `<option value="${c.key}">${c.emoji} ${esc(c.label)}</option>`).join("")}</optgroup>`).join("");
$("#f-status").innerHTML = STATUSES.map((s) => `<option value="${s.key}">${s.emoji} ${esc(s.label)}</option>`).join("");

function renderExtra(catKey, values = {}) {
  $("#extra").innerHTML = (cat(catKey)?.extra || []).map((x) => {
    const v = values[x.key];
    if (x.type === "select") return `<label>${esc(x.label)}<select name="x-${x.key}"><option value=""></option>${x.options.map((o) => `<option ${v === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></label>`;
    if (x.type === "checkbox") return `<label class="check"><input type="checkbox" name="x-${x.key}" ${v ? "checked" : ""}> ${esc(x.label)}</label>`;
    return `<label>${esc(x.label)}<input name="x-${x.key}" value="${esc(v || "")}" placeholder="${esc(x.placeholder || "")}"></label>`;
  }).join("");
}

function openEditor(id) {
  editingId = id || null;
  const i = id ? items.find((x) => x.id === id) : null;
  const catKey = i?.category || f.category || CATEGORIES.find((c) => c.group === f.group)?.key || "random";
  $("#dlg-title").textContent = i ? "Edit find" : "Add to the box";
  $("#f-title").value = i?.title || "";
  $("#f-cat").value = catKey;
  $("#f-link").value = i?.link || "";
  $("#f-notes").value = i?.notes || "";
  $("#f-tags").value = (i?.tags || []).join(", ");
  $("#f-status").value = i?.status || "want";
  $("#f-image").value = i?.image || "";
  renderExtra(catKey, i?.extra);
  $("#more").open = !!i;
  $("#delete").hidden = !i;
  dlg.showModal();
}

$("#f-cat").addEventListener("change", (e) => renderExtra(e.target.value));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const catKey = $("#f-cat").value;
  const extra = {};
  (cat(catKey)?.extra || []).forEach((x) => {
    const el = form.elements["x-" + x.key];
    extra[x.key] = x.type === "checkbox" ? el.checked : el.value;
  });
  const data = {
    title: $("#f-title").value.trim(), category: catKey, link: $("#f-link").value.trim(),
    image: $("#f-image").value.trim(), notes: $("#f-notes").value.trim(),
    tags: $("#f-tags").value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    status: $("#f-status").value, extra,
  };
  const btn = form.querySelector(".primary");
  btn.disabled = true;
  try {
    if (editingId) {
      const saved = await api.update(editingId, data);
      items = items.map((i) => (i.id === editingId ? saved : i));
    } else {
      items.unshift(await api.create(data));
    }
    dlg.close(); render();
  } catch (err) {
    if (err.auth) { dlg.close(); showLogin(); } else alert("Could not save. Check your connection and try again.");
  } finally { btn.disabled = false; }
});

$("#delete").addEventListener("click", async () => {
  if (!confirm("Delete this find?")) return;
  try {
    await api.remove(editingId);
    items = items.filter((i) => i.id !== editingId);
    dlg.close(); render();
  } catch (err) {
    if (err.auth) { dlg.close(); showLogin(); } else alert("Could not delete. Try again.");
  }
});
$("#cancel").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

/* Page controls */
$("#add").addEventListener("click", () => openEditor());
$("#grid").addEventListener("click", (e) => { const b = e.target.closest(".card"); if (b) openEditor(b.dataset.id); });
$("#groups").addEventListener("click", (e) => {
  const b = e.target.closest("[data-group]"); if (!b) return;
  f.group = b.dataset.group; f.category = ""; render();
});
$("#cats").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cat]"); if (!b) return;
  f.category = f.category === b.dataset.cat ? "" : b.dataset.cat; render();
});
$("#q").addEventListener("input", (e) => { f.q = e.target.value; render(); });
$("#gamesnight").addEventListener("click", () => {
  const on = f.tag !== "games night";
  f.tag = on ? "games night" : ""; if (on) { f.group = ""; f.category = ""; }
  render();
});
$("#surprise").addEventListener("click", () => {
  const list = filtered(); if (!list.length) return;
  openEditor(list[Math.floor(Math.random() * list.length)].id);
});
$("#export").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "lifebox-export.json" });
  a.click(); URL.revokeObjectURL(url);
});

/* Login and startup */
const loginDlg = $("#login");
function showLogin() { $("#login-error").hidden = true; if (!loginDlg.open) loginDlg.showModal(); }
loginDlg.addEventListener("cancel", (e) => e.preventDefault());
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (await api.login($("#password").value)) {
    $("#password").value = ""; loginDlg.close(); boot();
  } else { $("#login-error").hidden = false; }
});

async function boot() {
  $("#count").textContent = "";
  $("#grid").innerHTML = `<p class="empty">Opening the box...</p>`;
  try {
    items = await api.list();
    render();
  } catch (err) {
    if (err.auth) { $("#grid").innerHTML = ""; showLogin(); }
    else $("#grid").innerHTML = `<p class="empty">Cannot reach the box. Check your connection and refresh.</p>`;
  }
}

renderChips();
boot();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
