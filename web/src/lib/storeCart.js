const storageKey = "gezy_store_cart";

function readCart() {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("store-cart-updated"));
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
      item.id === productId ? { ...item, qty: Math.max(Number(qty || 1), 1) } : item,
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
