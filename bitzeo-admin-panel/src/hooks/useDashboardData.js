import { useState, useEffect, useCallback } from "react";
import { getAdminDashboard } from "../api";

const useDashboardData = () => {
  const [data, setData] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminDashboard();
      setData(res.data?.data || null);
      setGeneratedAt(res.data?.generatedAt || null);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("unauthorized");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to load dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, generatedAt, loading, error, refetch: fetchDashboard };
};

export default useDashboardData;
