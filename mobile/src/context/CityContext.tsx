import React, { createContext, useContext, useMemo, useState } from "react";

type City = { id: string; label: string };

const DEFAULT_CITY: City = { id: "bishkek", label: "Все города" };

const CityContext = createContext<{
  city: City;
  setCity: (c: City) => void;
} | null>(null);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [city, setCity] = useState<City>(DEFAULT_CITY);
  const value = useMemo(() => ({ city, setCity }), [city]);
  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be used within CityProvider");
  return ctx;
}

export const CITIES: City[] = [
  { id: "all", label: "Все города" },
  { id: "bishkek", label: "Бишкек" },
  { id: "osh", label: "Ош" },
  { id: "jalalabad", label: "Джалал-Абад" },
];

