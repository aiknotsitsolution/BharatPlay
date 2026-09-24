import axios from "axios";
import { setupAdminAxiosAuth } from "./utils/session";

// Base URL from env (VITE_API_BASE_URL), production fallback for deployed builds.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

const attachToken = (config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.withCredentials = true;
  return config;
};

axios.interceptors.request.use(attachToken);
API.interceptors.request.use(attachToken);

// Single-flight refresh + auto-retry on 401 for both instances.
setupAdminAxiosAuth(axios);
setupAdminAxiosAuth(API);

export default API;

// Admin Dashboard
export const getAdminDashboard = () => API.get("/admin/dashboard");

// Products
export const addProduct = (productData) => API.post("/product", productData);
export const fetchProducts = () => API.get("/product");
export const updateProduct = (id, productData) =>
  API.put(`/product/${id}`, productData);
export const deleteProduct = (id) => API.delete(`/product/${id}`);

// Barcode / Cart
export const getProductByBarcode = (barcode) =>
  API.post(`/cart/add/${barcode}`);
export const addProductToCart = (productId) =>
  API.post(`/cart/add/${productId}`);

// Auth / Registration
export const Registration = () => API.post("/register");
export const fetchRegistration = () => API.get("/display");

// Category
export const fetchcategory = () => API.get("/category");
export const addCategory = (name) => API.post("/category", { name });
export const updateCategory = (id, name) =>
  API.put(`/category/${id}`, { name });
export const deleteCategory = (id) => API.delete(`/category/${id}`);

// Subcategory
export const fetchSubcategory = (categoryId) =>
  categoryId
    ? API.get(`/subcategory?categoryId=${categoryId}`)
    : API.get("/subcategory");

export const addSubCategory = (data) => API.post("/subcategory", data);

export const updateSubCategory = (id, data) =>
  API.put(`/subcategory/${id}`, data);

export const deleteSubCategory = (id) => API.delete(`/subcategory/${id}`);

// Extra
export const getProductByBarcodes = (barcode) =>
  API.get(`/products/barcode/${barcode}`);

// Γ£à FIXED (API_URL was undefined)
export const scanProduct = (barcodeData) =>
  API.put("/purchase/scan", barcodeData);

// Admin User Management
export const fetchAdminUsers = (params) =>
  API.get("/admin/alluser", { params });
export const fetchAdminUserById = (id) => API.get(`/admin/users/${id}`);
export const fetchAdminUserOverview = (id) =>
  API.get(`/admin/users/${id}/overview`);
export const fetchAdminUserChannels = (id, params) =>
  API.get(`/admin/users/${id}/channels`, { params });
export const fetchAdminUserVideos = (id, params) =>
  API.get(`/admin/users/${id}/videos`, { params });
export const fetchAdminUserShorts = (id, params) =>
  API.get(`/admin/users/${id}/shorts`, { params });
export const updateAdminUser = (id, data) =>
  API.put(`/admin/users/${id}`, data);
export const deleteAdminUser = (id, reason) =>
  API.delete(`/admin/users/${id}`, { data: { reason } });

// Admin User 360┬░ ΓÇö Phase 3
export const fetchAdminUserActivity = (id, params) =>
  API.get(`/admin/users/${id}/activity`, { params });
export const fetchAdminUserWatchHistory = (id, params) =>
  API.get(`/admin/users/${id}/watch-history`, { params });
export const fetchAdminUserSubscriptions = (id) =>
  API.get(`/admin/users/${id}/subscriptions`);
export const fetchAdminUserLikedVideos = (id, params) =>
  API.get(`/admin/users/${id}/liked-videos`, { params });
export const fetchAdminUserDislikedVideos = (id, params) =>
  API.get(`/admin/users/${id}/disliked-videos`, { params });
export const fetchAdminUserWatchLater = (id, params) =>
  API.get(`/admin/users/${id}/watch-later`, { params });
export const fetchAdminUserNotifications = (id, params) =>
  API.get(`/admin/users/${id}/notifications`, { params });
export const fetchAdminUserDevices = (id) =>
  API.get(`/admin/users/${id}/devices`);
export const fetchAdminUserFraudEvents = (id, params) =>
  API.get(`/admin/users/${id}/fraud-events`, { params });
export const fetchAdminUserEngagement = (id) =>
  API.get(`/admin/users/${id}/engagement`);

// Admin Uploads
export const getAdminUploads = (params) =>
  API.get("/admin/uploads", { params });

// Admin Profile (self)
export const getAdminProfile = () => API.get("/admin/me");
export const updateAdminProfile = (formData) =>
  API.patch("/admin/profile", formData);

// Admin password reset (OTP)
export const requestAdminPasswordOtp = () =>
  API.post("/admin/forgot-password");
export const verifyAdminResetOtp = (otp) =>
  API.post("/admin/verify-reset-otp", { otp });
export const resetAdminPassword = (token, newPassword) =>
  API.post("/admin/reset-password", { token, newPassword });

// Admin User Moderation
export const suspendAdminUser = (id, reason) =>
  API.post(`/admin/users/${id}/suspend`, { reason });
export const restoreAdminUser = (id) => API.post(`/admin/users/${id}/restore`);
export const banAdminUser = (id, reason) =>
  API.post(`/admin/users/${id}/ban`, { reason });

// Admin Channel Moderation
export const disableAdminChannel = (userId, channelId, reason) =>
  API.post(`/admin/users/${userId}/channels/${channelId}/disable`, { reason });
export const enableAdminChannel = (userId, channelId) =>
  API.post(`/admin/users/${userId}/channels/${channelId}/enable`);
export const banAdminChannel = (userId, channelId, reason) =>
  API.post(`/admin/users/${userId}/channels/${channelId}/ban`, { reason });
export const restoreAdminChannel = (userId, channelId) =>
  API.post(`/admin/users/${userId}/channels/${channelId}/restore`);
export const deleteAdminChannel = (userId, channelId, reason) =>
  API.delete(`/admin/users/${userId}/channels/${channelId}`, {
    data: { reason },
  });

// Admin Video Moderation
export const disableAdminVideo = (userId, videoId, reason) =>
  API.post(`/admin/users/${userId}/videos/${videoId}/disable`, { reason });
export const enableAdminVideo = (userId, videoId) =>
  API.post(`/admin/users/${userId}/videos/${videoId}/enable`);
export const deleteAdminVideo = (userId, videoId, reason) =>
  API.delete(`/admin/users/${userId}/videos/${videoId}`, { data: { reason } });

// Admin Short Moderation
export const disableAdminShort = (userId, videoId, reason) =>
  API.post(`/admin/users/${userId}/shorts/${videoId}/disable`, { reason });
export const enableAdminShort = (userId, videoId) =>
  API.post(`/admin/users/${userId}/shorts/${videoId}/enable`);
export const deleteAdminShort = (userId, videoId, reason) =>
  API.delete(`/admin/users/${userId}/shorts/${videoId}`, { data: { reason } });

// Copyright Management
export const fetchCopyrightCases = (params) =>
  API.get("/admin/copyright/cases", { params });
export const fetchCopyrightCaseById = (id) =>
  API.get(`/admin/copyright/cases/${id}`);
export const createCopyrightCase = (data) =>
  API.post("/admin/copyright/cases", data);
export const updateCopyrightCaseStatus = (id, data) =>
  API.put(`/admin/copyright/cases/${id}/status`, data);
export const assignCopyrightCase = (id, data) =>
  API.put(`/admin/copyright/cases/${id}/assign`, data);
export const addCopyrightEvidence = (id, data) =>
  API.post(`/admin/copyright/cases/${id}/evidence`, data);
export const addCopyrightNote = (id, data) =>
  API.post(`/admin/copyright/cases/${id}/notes`, data);

// Copyright Strikes
export const fetchCopyrightStrikes = (params) =>
  API.get("/admin/copyright/strikes", { params });
export const fetchCopyrightStrikeById = (id) =>
  API.get(`/admin/copyright/strikes/${id}`);
export const disputeCopyrightStrike = (id, data) =>
  API.post(`/admin/copyright/strikes/${id}/dispute`, data);
export const resolveCopyrightStrikeDispute = (id, data) =>
  API.put(`/admin/copyright/strikes/${id}/resolve`, data);
export const fetchUserCopyrightStrikes = (userId) =>
  API.get(`/admin/copyright/strikes/user/${userId}`);

// Copyright Stats
export const fetchCopyrightStats = () => API.get("/admin/copyright/stats");

// Search (for copyright create form etc.)
export const searchVideos = (q) =>
  API.get("/admin/search/videos", { params: { q } });
export const searchUsers = (q) =>
  API.get("/admin/search/users", { params: { q } });

// Deleted Users
export const fetchDeletedUsers = (params) =>
  API.get("/admin/deleted-users", { params });
export const hardDeleteUser = (id) =>
  API.delete(`/admin/users/${id}/permanent`);

// Support — Contact Requests
export const fetchContactRequests = (params) =>
  API.get("/support/contact", { params });
export const fetchContactRequestById = (id) =>
  API.get(`/support/contact/${id}`);
export const updateContactRequest = (id, data) =>
  API.patch(`/support/contact/${id}`, data);

// Support — Deletion Requests
export const fetchDeletionRequests = (params) =>
  API.get("/support/deletion-request", { params });
export const fetchDeletionRequestById = (id) =>
  API.get(`/support/deletion-request/${id}`);
export const updateDeletionRequest = (id, data) =>
  API.patch(`/support/deletion-request/${id}`, data);

// Support — Associates
export const fetchSupportAssociates = () => API.get("/support/associates");
