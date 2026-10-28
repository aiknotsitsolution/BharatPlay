import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://192.168.1.20:5173/:8000/api"}/admin`,
  withCredentials: true, // important for cookies
  timeout: 20000,
});

// Register Employee / Admin
export const registerEmployee = (data) => API.post("/employee/register", data);

// Login
export const loginEmployee = (data) => API.post("/employee/login", data);

// Optional: logout
export const logoutEmployee = () => API.post("/employee/logout");
