import { useState, useEffect, useCallback } from 'react';
import { coffeeService } from '../services/coffeeService';

export function useFetch(fn, deps=[]) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fn()); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }}, deps);
      // beslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(()=>{ load(); },[load]);
  return { data, loading, error, refetch: load };
}

export const useKPIs          = () => useFetch(coffeeService.getKPIs.bind(coffeeService));
export const useMonthlySales  = () => useFetch(coffeeService.getMonthlySales.bind(coffeeService));
export const useByCategory    = () => useFetch(coffeeService.getByCategory.bind(coffeeService));
export const useByPayment     = () => useFetch(coffeeService.getByPayment.bind(coffeeService));
export const useByHour        = () => useFetch(coffeeService.getByHour.bind(coffeeService));
export const useTopProducts   = () => useFetch(coffeeService.getTopProducts.bind(coffeeService));
export const useProducts      = () => useFetch(coffeeService.getProducts.bind(coffeeService));
export const useClients       = () => useFetch(coffeeService.getClients.bind(coffeeService));
export const useReports       = () => useFetch(coffeeService.getReports.bind(coffeeService));
export const usePredHistory   = () => useFetch(coffeeService.getPredictionHistory.bind(coffeeService));
