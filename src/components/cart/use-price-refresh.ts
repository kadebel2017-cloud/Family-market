"use client";

import { useEffect, useRef, useState } from "react";

import { refreshCartPrices } from "@/lib/actions/pricing";
import { entryKey, useCart } from "./cart-context";

// Runs once per page mount: re-checks live prices for cart contents so
// a started promo lowers prices and an ended/removed promo (or product)
// reverts/removes them, with a notice. Server is read-only here;
// order placement re-validates everything again anyway.
export function usePriceRefresh(): { changed: boolean } {
  const { lines, setLinePrice, setPackPrice, removeLine } = useCart();
  const [changed, setChanged] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || lines.length === 0) {
      return;
    }
    ran.current = true;
    const productIds = lines.flatMap((line) =>
      line.kind === "product" ? [line.productId] : [],
    );
    const packIds = lines.flatMap((line) =>
      line.kind === "pack" ? [line.packId] : [],
    );
    refreshCartPrices(productIds, packIds)
      .then((result) => {
        let touched = false;
        for (const item of result.products) {
          const line = lines.find(
            (entry) => entry.kind === "product" && entry.productId === item.productId,
          );
          if (!line || line.kind !== "product") {
            continue;
          }
          if (!item.available) {
            removeLine(entryKey(line));
            touched = true;
            continue;
          }
          if (Math.abs(line.price - item.unit) > 0.001) {
            setLinePrice(entryKey(line), item.unit);
            touched = true;
          }
        }
        for (const pack of result.packs) {
          const line = lines.find(
            (entry) => entry.kind === "pack" && entry.packId === pack.packId,
          );
          if (!line || line.kind !== "pack") {
            continue;
          }
          if (!pack.valid) {
            removeLine(entryKey(line));
            touched = true;
            continue;
          }
          if (
            Math.abs(line.packPrice - pack.packPrice) > 0.001 ||
            Math.abs(line.normalTotal - pack.normalTotal) > 0.001
          ) {
            setPackPrice(pack.packId, pack.packPrice, pack.normalTotal);
            touched = true;
          }
        }
        setChanged(touched);
      })
      .catch(() => {
        // Offline/DB hiccup — keep snapshot prices; order placement
        // will re-validate server-side anyway.
      });
  }, [lines, setLinePrice, setPackPrice, removeLine]);

  return { changed };
}
