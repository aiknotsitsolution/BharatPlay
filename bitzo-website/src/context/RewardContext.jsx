import React, { createContext, useContext, useState, useEffect } from "react";

const RewardContext = createContext();

export function RewardProvider({ children }) {
  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem("VidBuxAppRewardPoints");
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (parsed === 70 && /^70(?:\.0{1,2})?$/.test(saved.trim())) return 0;
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  });
  useEffect(() => {
    localStorage.setItem("VidBuxAppRewardPoints", points.toFixed(2));
  }, [points]);

  const addPoints = (amount) => {
    setPoints((prev) => {
      const newValue = Number((prev + amount).toFixed(2));
      return newValue;
    });
  };

  const resetPoints = () => {
    setPoints(0);
  };

  const subtractPoints = (amount) => {
    setPoints((prev) => Math.max(0, Number((prev - amount).toFixed(2))));
  };

  const value = {
    points,
    addPoints,
    resetPoints,
    subtractPoints,
  };

  return (
    <RewardContext.Provider value={value}>{children}</RewardContext.Provider>
  );
}

export const useRewards = () => {
  const context = useContext(RewardContext);
  if (!context) {
    throw new Error("useRewards must be used within a RewardProvider");
  }
  return context;
};
