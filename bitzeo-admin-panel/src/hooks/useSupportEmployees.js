import { useEffect, useState } from "react";
import { fetchSupportAssociates } from "../api";

let cache = null;
let inflight = null;

const load = async () => {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetchSupportAssociates()
    .then((res) => {
      cache = res.data?.associates || [];
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

export const refreshSupportEmployees = async () => {
  cache = null;
  return load();
};

export default function useSupportEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    load().then((list) => {
      if (active) {
        setEmployees(list);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { employees, loading };
}