const legacyStorageKey = "gezy_store_cart";
const storageKeyPrefix = "gezy_store_cart:";
const scopeStorageKey = "gezy_store_cart_scope";
const defaultScope = "guest";

function getScopedStorageKey(scope = defaultScope) {
  return `${storageKeyPrefix}${scope}`;
}

function getCurrentScope() {
  if (typeof window === "undefined") return defaultScope;
  return window.localStorage.getItem(scopeStorageKey) || defaultScope;
}

function migrateLegacyCartIfNeeded() {
  if (typeof window === "undefined") return;

  const legacyValue = window.localStorage.getItem(legacyStorageKey);
  if (!legacyValue) return;

  const guestKey = getScopedStorageKey(defaultScope);
  if (!window.localStorage.getItem(guestKey)) {
    window.localStorage.setItem(guestKey, legacyValue);
  }
  window.localStorage.removeItem(legacyStorageKey);
}

function readCart(scope = getCurrentScope()) {
  if (typeof window === "undefined") return [];

  migrateLegacyCartIfNeeded();

  try {
    const value = window.localStorage.getItem(getScopedStorageKey(scope));
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeCart(items, scope = getCurrentScope()) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    getScopedStorageKey(scope),
    JSON.stringify(items),
  );
  window.dispatchEvent(
    new CustomEvent("store-cart-updated", { detail: { scope } }),
  );
}

export function setCartScope(scope = defaultScope) {
  if (typeof window === "undefined") return;

  migrateLegacyCartIfNeeded();

  const normalizedScope = scope || defaultScope;
  window.localStorage.setItem(scopeStorageKey, normalizedScope);
  window.dispatchEvent(
    new CustomEvent("store-cart-updated", {
      detail: { scope: normalizedScope, scopeChanged: true },
    }),
  );
}

export function getCartItems() {
  return readCart();
}

export function getCartCount() {
  return readCart().reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

export function addToCart(product, qty = 1) {
  const items = readCart();
  const nextQty = Math.max(Number(qty || 1), 1);
  const index = items.findIndex((item) => item.id === product.id);

  if (index >= 0) {
    items[index] = { ...items[index], qty: items[index].qty + nextQty };
  } else {
    items.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: Number(product.price || 0),
      image: product.image || "",
      qty: nextQty,
    });
  }

  writeCart(items);
}

export function updateCartQty(productId, qty) {
  const items = readCart()
    .map((item) =>
      item.id === productId
        ? { ...item, qty: Math.max(Number(qty || 1), 1) }
        : item,
    )
    .filter((item) => item.qty > 0);
  writeCart(items);
}

export function removeFromCart(productId) {
  writeCart(readCart().filter((item) => item.id !== productId));
}

export function clearCart() {
  writeCart([]);
}

export function setCartItems(items) {
  const normalized = Array.isArray(items)
    ? items
        .map((item) => ({
          id: Number(item.id || 0),
          slug: item.slug || "",
          name: item.name || "",
          price: Number(item.price || 0),
          image: item.image || "",
          qty: Math.max(Number(item.qty || 1), 1),
        }))
        .filter((item) => item.id > 0 && item.name)
    : [];

  writeCart(normalized);
}
