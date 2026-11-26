import { useContext } from "react";
import { RewardContext } from "./rewardContextValue";

export const useRewards = () => {
  const context = useContext(RewardContext);
  if (!context) {
    throw new Error("useRewards must be used within a RewardProvider");
  }
  return context;
};
