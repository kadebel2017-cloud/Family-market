"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CartLine {
  kind: "product";
  productId: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  size: string;
  /** Effective unit price in DA (sale price when discounted). */
  price: number;
  image: string | null;
  qty: number;
}

export interface CartPackItem {
  productId: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  /** Normal unit price in DA (reference — the pack charges packPrice). */
  unitPrice: number;
  image: string | null;
  qty: number;
}

export interface CartPack {
  kind: "pack";
  packId: string;
  titleFr: string;
  titleAr: string;
  image: string | null;
  /** Charged price per pack in DA (server-validated at order time). */
  packPrice: number;
  /** Sum of normal prices per pack (display reference only). */
  normalTotal: number;
  qty: number;
  items: CartPackItem[];
}

export type CartEntry = CartLine | CartPack;

export type NewCartLine = Omit<CartLine, "qty" | "kind">;
export type NewCartPack = Omit<CartPack, "qty" | "kind">;

export function entryKey(entry: CartEntry): string {
  return entry.kind === "pack" ? `pack:${entry.packId}` : entry.productId;
}

export function isPackEntry(entry: CartEntry): entry is CartPack {
  return entry.kind === "pack";
}

interface CartContextValue {
  lines: CartEntry[];
  count: number;
  /** Amount actually charged (pack prices + single products). */
  subtotal: number;
  /** Reference total at normal prices (packs at normalTotal). */
  normalTotal: number;
  addLine: (line: NewCartLine, qty?: number) => void;
  addPack: (pack: NewCartPack, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  setLinePrice: (key: string, price: number) => void;
  setPackPrice: (packId: string, packPrice: number, normalTotal: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "fm-cart-v1";
const MAX_QTY = 99;

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

function sanitizePackItem(raw: unknown): CartPackItem | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const candidate = raw as Partial<CartPackItem>;
  const unitPrice = toFiniteNumber(candidate.unitPrice);
  const qty = Math.floor(Number(candidate.qty));
  if (
    typeof candidate.productId !== "string" ||
    typeof candidate.nameFr !== "string" ||
    unitPrice === null ||
    !Number.isFinite(qty) ||
    qty < 1
  ) {
    return null;
  }
  return {
    productId: candidate.productId,
    slug: typeof candidate.slug === "string" ? candidate.slug : "",
    nameFr: candidate.nameFr,
    nameAr: typeof candidate.nameAr === "string" ? candidate.nameAr : "",
    unitPrice,
    image: typeof candidate.image === "string" ? candidate.image : null,
    qty: Math.min(MAX_QTY, qty),
  };
}

function sanitize(raw: unknown): CartEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const lines: CartEntry[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const candidate = entry as Partial<CartEntry>;
    const qty = Math.floor(Number(candidate.qty));
    if (!Number.isFinite(qty) || qty < 1) {
      continue;
    }
    if (candidate.kind === "pack") {
      const pack = candidate as Partial<CartPack>;
      const packPrice = toFiniteNumber(pack.packPrice);
      const normalTotal = toFiniteNumber(pack.normalTotal);
      const items = Array.isArray(pack.items)
        ? pack.items
            .map(sanitizePackItem)
            .filter((item): item is CartPackItem => item !== null)
        : [];
      if (
        typeof pack.packId !== "string" ||
        typeof pack.titleFr !== "string" ||
        packPrice === null ||
        normalTotal === null ||
        items.length === 0
      ) {
        continue;
      }
      lines.push({
        kind: "pack",
        packId: pack.packId,
        titleFr: pack.titleFr,
        titleAr: typeof pack.titleAr === "string" ? pack.titleAr : "",
        image: typeof pack.image === "string" ? pack.image : null,
        packPrice,
        normalTotal,
        qty: Math.min(MAX_QTY, qty),
        items,
      });
      continue;
    }
    // Loose product line (kind "product" or legacy entries without kind).
    const line = candidate as Partial<CartLine>;
    const price = toFiniteNumber(line.price);
    if (
      typeof line.productId !== "string" ||
      typeof line.nameFr !== "string" ||
      price === null
    ) {
      continue;
    }
    lines.push({
      kind: "product",
      productId: line.productId,
      slug: typeof line.slug === "string" ? line.slug : "",
      nameFr: line.nameFr,
      nameAr: typeof line.nameAr === "string" ? line.nameAr : "",
      size: typeof line.size === "string" ? line.size : "",
      price,
      image: typeof line.image === "string" ? line.image : null,
      qty: Math.min(MAX_QTY, qty),
    });
  }
  return lines;
}

function readStoredCart(): CartEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? sanitize(JSON.parse(stored)) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Starts empty on purpose: the server renders no cart, so the first
  // client render must match it exactly. The persisted cart loads in the
  // effect below, AFTER hydration, avoiding any SSR mismatch — and nothing
  // is written back until that load completes, so a fresh page can never
  // wipe the saved cart with an empty one.
  const [lines, setLines] = useState<CartEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-hydration load of the persisted cart
    setLines(readStoredCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage full or unavailable — cart still works in memory.
    }
  }, [lines, loaded]);

  const addLine = useCallback((line: NewCartLine, qty = 1) => {
    const amount = Math.min(MAX_QTY, Math.max(1, Math.floor(qty)));
    setLines((current) => {
      const existing = current.find(
        (item) => item.kind === "product" && item.productId === line.productId,
      );
      if (existing) {
        return current.map((item) =>
          item.kind === "product" && item.productId === line.productId
            ? { ...item, qty: Math.min(MAX_QTY, item.qty + amount) }
            : item,
        );
      }
      return [...current, { ...line, kind: "product" as const, qty: amount }];
    });
  }, []);

  const addPack = useCallback((pack: NewCartPack, qty = 1) => {
    const amount = Math.min(MAX_QTY, Math.max(1, Math.floor(qty)));
    setLines((current) => {
      const existing = current.find(
        (item) => item.kind === "pack" && item.packId === pack.packId,
      );
      if (existing) {
        return current.map((item) =>
          item.kind === "pack" && item.packId === pack.packId
            ? { ...item, qty: Math.min(MAX_QTY, item.qty + amount) }
            : item,
        );
      }
      return [...current, { ...pack, kind: "pack" as const, qty: amount }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    const amount = Math.floor(qty);
    setLines((current) =>
      amount < 1
        ? current.filter((item) => entryKey(item) !== key)
        : current.map((item) =>
            entryKey(item) === key
              ? { ...item, qty: Math.min(MAX_QTY, amount) }
              : item,
          ),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((current) => current.filter((item) => entryKey(item) !== key));
  }, []);

  const setLinePrice = useCallback((key: string, price: number) => {
    if (!Number.isFinite(price) || price < 0) {
      return;
    }
    setLines((current) =>
      current.map((item) =>
        entryKey(item) === key && item.kind === "product"
          ? { ...item, price }
          : item,
      ),
    );
  }, []);

  const setPackPrice = useCallback(
    (packId: string, packPrice: number, normalTotal: number) => {
      if (
        !Number.isFinite(packPrice) ||
        packPrice <= 0 ||
        !Number.isFinite(normalTotal) ||
        normalTotal <= 0
      ) {
        return;
      }
      setLines((current) =>
        current.map((item) =>
          item.kind === "pack" && item.packId === packId
            ? { ...item, packPrice, normalTotal }
            : item,
        ),
      );
    },
    [],
  );

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    let count = 0;
    let subtotal = 0;
    let normalTotal = 0;
    for (const line of lines) {
      if (line.kind === "pack") {
        count += line.qty;
        subtotal += line.packPrice * line.qty;
        normalTotal += line.normalTotal * line.qty;
      } else {
        count += line.qty;
        subtotal += line.price * line.qty;
        normalTotal += line.price * line.qty;
      }
    }
    return { lines, count, subtotal, normalTotal, addLine, addPack, setQty, removeLine, setLinePrice, setPackPrice, clear };
  }, [lines, addLine, addPack, setQty, removeLine, setLinePrice, setPackPrice, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>.");
  }
  return context;
}
