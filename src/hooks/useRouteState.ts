import { useState } from "react";
import { Route } from "@/types/route";
import { SearchResult } from "@/types/location";

export const useRouteState = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  return {
    routes,
    setRoutes,
    isCalculatingRoute,
    setIsCalculatingRoute,
    selectedResult,
    setSelectedResult
  };
};