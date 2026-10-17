"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import { createContext, type PropsWithChildren, useContext, useState } from "react";

export type GalleryFilter = PileMaterial | "all" | "wishlist";

interface ShowroomState {
  carpets: Carpet[];
  search: string;
  setSearch: (search: string) => void;
  filter: GalleryFilter;
  setFilter: (filter: GalleryFilter) => void;
  wishlist: string[];
  toggleWish: (slug: string) => void;
  /** Carpets the visitor wants to ask about; the shop has no online checkout. */
  selection: Carpet[];
  /** Adds a carpet; `ask` also opens the drawer at the inquiry form. */
  addToSelection: (carpet: Carpet, options?: { ask?: boolean }) => void;
  removeFromSelection: (slug: string) => void;
  clearSelection: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  quickView: Carpet | null;
  setQuickView: (carpet: Carpet | null) => void;
}

const ShowroomContext = createContext<ShowroomState | null>(null);

export function ShowroomProvider({ carpets, children }: PropsWithChildren<{ carpets: Carpet[] }>) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [selection, setSelection] = useState<Carpet[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickView, setQuickView] = useState<Carpet | null>(null);

  const value: ShowroomState = {
    carpets,
    search,
    setSearch,
    filter,
    setFilter,
    wishlist,
    toggleWish: (slug) =>
      setWishlist((w) => (w.includes(slug) ? w.filter((s) => s !== slug) : [...w, slug])),
    selection,
    addToSelection: (carpet, options) => {
      setSelection((s) => (s.some((c) => c.slug === carpet.slug) ? s : [...s, carpet]));
      if (options?.ask) setDrawerOpen(true);
    },
    removeFromSelection: (slug) => setSelection((s) => s.filter((c) => c.slug !== slug)),
    clearSelection: () => setSelection([]),
    drawerOpen,
    setDrawerOpen,
    quickView,
    setQuickView,
  };
  return <ShowroomContext.Provider value={value}>{children}</ShowroomContext.Provider>;
}

export function useShowroom(): ShowroomState {
  const state = useContext(ShowroomContext);
  if (!state) throw new Error("useShowroom must be used inside ShowroomProvider");
  return state;
}

/** Search matches the carpet name or its material label, ignoring Persian/Arabic letter variants. */
export function matchesSearch(carpet: Carpet, materialLabel: string, query: string): boolean {
  const normalise = (text: string) =>
    text.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ").trim().toLowerCase();
  const q = normalise(query);
  return q === "" || normalise(`${carpet.name} ${materialLabel} ${carpet.slug}`).includes(q);
}
