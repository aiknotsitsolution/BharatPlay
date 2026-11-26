import { useState } from "react";
import AuthContext from "./auth-context-value";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem("adminToken");
    const savedUser = localStorage.getItem("adminUser");
    if (!savedToken || !savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch (error) {
      console.error("Failed to parse stored finance admin user:", error);
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem("adminToken") || null);
  const loading = false;

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem("adminToken", accessToken);
    localStorage.setItem("adminUser", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};