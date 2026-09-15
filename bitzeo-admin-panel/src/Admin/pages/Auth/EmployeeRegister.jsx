// import { useState, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import DataTable from "react-data-table-component";
// import {
//   UserPlus,
//   Search,
//   Users,
//   Mail,
//   Shield,
//   Eye,
//   Trash2,
//   X,
//   User,
//   Lock,
//   KeyRound,
//   EyeOff,
//   BriefcaseBusiness,
//   Phone,
//   Calendar,
//   Camera,
//   Briefcase,
//   ChevronDown,
//   CheckCircle2,
//   XCircle,
//   Filter,
// } from "lucide-react";
// import API from "../../../api";
// import toast from "react-hot-toast";

// // Country list
// const countries = [
//   { name: "India", code: "IN", dial: "+91" },
//   { name: "United States", code: "US", dial: "+1" },
//   { name: "United Kingdom", code: "GB", dial: "+44" },
//   { name: "Canada", code: "CA", dial: "+1" },
//   { name: "Australia", code: "AU", dial: "+61" },
//   { name: "Germany", code: "DE", dial: "+49" },
//   { name: "France", code: "FR", dial: "+33" },
//   { name: "UAE", code: "AE", dial: "+971" },
//   { name: "Saudi Arabia", code: "SA", dial: "+966" },
//   { name: "Singapore", code: "SG", dial: "+65" },
//   { name: "Japan", code: "JP", dial: "+81" },
//   { name: "China", code: "CN", dial: "+86" },
//   { name: "South Korea", code: "KR", dial: "+82" },
//   { name: "Brazil", code: "BR", dial: "+55" },
//   { name: "Russia", code: "RU", dial: "+7" },
//   { name: "South Africa", code: "ZA", dial: "+27" },
//   { name: "Nigeria", code: "NG", dial: "+234" },
//   { name: "Pakistan", code: "PK", dial: "+92" },
//   { name: "Bangladesh", code: "BD", dial: "+880" },
//   { name: "Nepal", code: "NP", dial: "+977" },
//   { name: "Sri Lanka", code: "LK", dial: "+94" },
//   { name: "Malaysia", code: "MY", dial: "+60" },
//   { name: "Indonesia", code: "ID", dial: "+62" },
//   { name: "Thailand", code: "TH", dial: "+66" },
//   { name: "Philippines", code: "PH", dial: "+63" },
//   { name: "Vietnam", code: "VN", dial: "+84" },
//   { name: "Italy", code: "IT", dial: "+39" },
//   { name: "Spain", code: "ES", dial: "+34" },
//   { name: "Netherlands", code: "NL", dial: "+31" },
//   { name: "Switzerland", code: "CH", dial: "+41" },
//   { name: "Sweden", code: "SE", dial: "+46" },
//   { name: "Norway", code: "NO", dial: "+47" },
//   { name: "Denmark", code: "DK", dial: "+45" },
//   { name: "Finland", code: "FI", dial: "+358" },
//   { name: "Poland", code: "PL", dial: "+48" },
//   { name: "Turkey", code: "TR", dial: "+90" },
//   { name: "Egypt", code: "EG", dial: "+20" },
//   { name: "Kenya", code: "KE", dial: "+254" },
//   { name: "New Zealand", code: "NZ", dial: "+64" },
//   { name: "Mexico", code: "MX", dial: "+52" },
//   { name: "Argentina", code: "AR", dial: "+54" },
//   { name: "Chile", code: "CL", dial: "+56" },
//   { name: "Colombia", code: "CO", dial: "+57" },
//   { name: "Ireland", code: "IE", dial: "+353" },
//   { name: "Portugal", code: "PT", dial: "+351" },
//   { name: "Belgium", code: "BE", dial: "+32" },
//   { name: "Austria", code: "AT", dial: "+43" },
//   { name: "Israel", code: "IL", dial: "+972" },
//   { name: "Qatar", code: "QA", dial: "+974" },
//   { name: "Kuwait", code: "KW", dial: "+965" },
//   { name: "Bahrain", code: "BH", dial: "+973" },
//   { name: "Oman", code: "OM", dial: "+968" },
//   { name: "Hong Kong", code: "HK", dial: "+852" },
//   { name: "Taiwan", code: "TW", dial: "+886" },
// ];

// export default function UsersManagement() {
//   const navigate = useNavigate();

//   // ========== Data State ==========
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // ========== Search + Filters ==========
//   const [search, setSearch] = useState("");
//   const [roleFilter, setRoleFilter] = useState("all");
//   const [statusFilter, setStatusFilter] = useState("all");

//   // ========== Modal + Form State ==========
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [showViewModal, setShowViewModal] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//     role: "admin",
//     registerKey: "ajhfgahg76873468gsjhfgjhsfhsdgfjh4654684621",
//     contactNumber: "",
//     dateOfJoining: "",
//     experienceYears: "",
//   });

//   const [selectedCountry, setSelectedCountry] = useState(countries[0]);
//   const [showCountryList, setShowCountryList] = useState(false);
//   const [countrySearch, setCountrySearch] = useState("");
//   const [profilePhoto, setProfilePhoto] = useState(null);
//   const [photoPreview, setPhotoPreview] = useState(null);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showKey, setShowKey] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const filteredCountries = countries.filter(
//     (c) =>
//       c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
//       c.dial.includes(countrySearch)
//   );

//   // ========== Fetch Users ==========
//   const fetchUsers = async () => {
//     try {
//       setLoading(true);
//       const res = await API.get("/admin/roles");
//       if (res.data.success) {
//         setUsers(res.data.data || []);
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to load users");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   // ========== Filtered Data (Search + Role + Status) ==========
//   const filteredUsers = useMemo(() => {
//     return users.filter((user) => {
//       const searchLower = search.toLowerCase().trim();

//       const matchesSearch =
//         !searchLower ||
//         user.name?.toLowerCase().includes(searchLower) ||
//         user.email?.toLowerCase().includes(searchLower) ||
//         user.contactNumber?.toLowerCase().includes(searchLower);

//       const matchesRole = roleFilter === "all" || user.role === roleFilter;

//       const matchesStatus =
//         statusFilter === "all" ||
//         (statusFilter === "active" && user.isActive !== false) ||
//         (statusFilter === "inactive" && user.isActive === false);

//       return matchesSearch && matchesRole && matchesStatus;
//     });
//   }, [users, search, roleFilter, statusFilter]);

//   // ========== Form Handlers ==========
//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     if (name === "contactNumber") {
//       // Sirf numbers allow
//       const onlyNums = value.replace(/\D/g, "");
//       setFormData((prev) => ({ ...prev, [name]: onlyNums }));
//       return;
//     }

//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // Email validation helper
//   const isValidEmail = (email) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   };

//   // Strong password validation
//   const validatePassword = (password) => {
//     const errors = [];

//     if (password.length < 8) {
//       errors.push("Password must be at least 8 characters");
//     }
//     if (!/[A-Z]/.test(password)) {
//       errors.push("At least one uppercase letter required");
//     }
//     if (!/[a-z]/.test(password)) {
//       errors.push("At least one lowercase letter required");
//     }
//     if (!/[0-9]/.test(password)) {
//       errors.push("At least one number required");
//     }
//     if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
//       errors.push("At least one special character required (!@#$%^&*)");
//     }

//     return errors;
//   };

//   // Password strength calculator
//   const getPasswordStrength = (password) => {
//     let score = 0;
//     if (password.length >= 8) score++;
//     if (/[A-Z]/.test(password)) score++;
//     if (/[a-z]/.test(password)) score++;
//     if (/[0-9]/.test(password)) score++;
//     if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

//     if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
//     if (score === 3 || score === 4)
//       return { label: "Medium", color: "bg-yellow-500", width: "66%" };
//     return { label: "Strong", color: "bg-emerald-500", width: "100%" };
//   };

//   const handlePhotoChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (!file.type.startsWith("image/")) {
//         toast.error("Please select an image file");
//         return;
//       }
//       if (file.size > 5 * 1024 * 1024) {
//         toast.error("Image size should be less than 5MB");
//         return;
//       }
//       setProfilePhoto(file);
//       setPhotoPreview(URL.createObjectURL(file));
//     }
//   };

//   const preventCopyPaste = (e) => {
//     e.preventDefault();
//     toast.error("Copy / Paste not allowed");
//   };

//   const resetForm = () => {
//     setFormData({
//       name: "",
//       email: "",
//       password: "",
//       confirmPassword: "",
//       role: "admin",
//       registerKey: "ajhfgahg76873468gsjhfgjhsfhsdgfjh4654684621",
//       contactNumber: "",
//       dateOfJoining: "",
//       experienceYears: "",
//     });
//     setProfilePhoto(null);
//     setPhotoPreview(null);
//     setSelectedCountry(countries[0]);
//     setShowPassword(false);
//     setShowKey(false);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // 1. Email validation
//     if (!isValidEmail(formData.email)) {
//       toast.error("Please enter a valid email address");
//       return;
//     }

//     // 2. Contact number validation
//     if (formData.contactNumber.length < 7 || formData.contactNumber.length > 15) {
//       toast.error("Please enter a valid contact number (7-15 digits)");
//       return;
//     }

//     // 3. Password validation
//     if (formData.password !== formData.confirmPassword) {
//       toast.error("Passwords do not match");
//       return;
//     }

//     const passwordErrors = validatePassword(formData.password);
//     if (passwordErrors.length > 0) {
//       toast.error(passwordErrors[0]);
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const fullContact = `${selectedCountry.dial}${formData.contactNumber}`;
//       const data = new FormData();
//       data.append("name", formData.name);
//       data.append("email", formData.email);
//       data.append("password", formData.password);
//       data.append("role", formData.role);
//       data.append("registerKey", formData.registerKey.trim());
//       data.append("contactNumber", fullContact);
//       data.append("countryCode", selectedCountry.dial);
//       data.append("dateOfJoining", formData.dateOfJoining);
//       data.append("experienceYears", formData.experienceYears);
//       if (profilePhoto) data.append("profilePhoto", profilePhoto);

//       const res = await API.post("/admin/employee/register", data, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       if (!res.data.success) {
//         throw new Error(res.data.message || "Registration failed");
//       }

//       toast.success(res.data.message || "Employee created successfully!");
//       setShowAddModal(false);
//       resetForm();
//       fetchUsers();
//     } catch (err) {
//       toast.error(
//         err.response?.data?.message || err.message || "Registration failed"
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this user?")) return;
//     try {
//       const res = await API.delete(`/admin/users/${id}`);
//       if (res.data.success) {
//         toast.success("User deleted");
//         fetchUsers();
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Delete failed");
//     }
//   };

//   const handleView = (user) => {
//     setSelectedUser(user);
//     setShowViewModal(true);
//   };

//   // ========== DataTable Columns ==========
//   const columns = [
//     {
//       name: "User",
//       selector: (row) => row.name,
//       sortable: true,
//       cell: (row) => (
//         <div className="flex items-center gap-3 py-2">
//           <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center shrink-0">
//             {row.profilePhoto ? (
//               <img
//                 src={row.profilePhoto}
//                 alt={row.name}
//                 className="w-full h-full object-cover"
//               />
//             ) : (
//               <span className="text-white font-medium">
//                 {row.name?.charAt(0)?.toUpperCase()}
//               </span>
//             )}
//           </div>
//           <div>
//             <p className="text-white font-medium">{row.name}</p>
//             <p className="text-xs text-gray-500">
//               {row.contactNumber || "No contact"} • {row.experienceYears ?? 0} yrs
//             </p>
//           </div>
//         </div>
//       ),
//       minWidth: "220px",
//     },
//     {
//       name: "Email",
//       selector: (row) => row.email,
//       sortable: true,
//       cell: (row) => (
//         <div className="flex items-center gap-1.5 text-gray-300">
//           <Mail size={14} className="text-gray-500" />
//           {row.email}
//         </div>
//       ),
//       minWidth: "200px",
//     },
//     {
//       name: "Role",
//       selector: (row) => row.role,
//       sortable: true,
//       cell: (row) => (
//         <span
//           className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
//             row.role === "admin"
//               ? "bg-indigo-500/20 text-indigo-300"
//               : row.role === "finance"
//               ? "bg-emerald-500/20 text-emerald-300"
//               : row.role === "support"
//               ? "bg-amber-500/20 text-amber-300"
//               : "bg-gray-500/20 text-gray-300"
//           }`}
//         >
//           <Shield size={12} />
//           {row.role}
//         </span>
//       ),
//     },
//     {
//       name: "Status",
//       selector: (row) => (row.isActive !== false ? "Active" : "Inactive"),
//       sortable: true,
//       cell: (row) =>
//         row.isActive !== false ? (
//           <span className="text-emerald-400 text-sm flex items-center gap-1">
//             <CheckCircle2 size={14} /> Active
//           </span>
//         ) : (
//           <span className="text-red-400 text-sm flex items-center gap-1">
//             <XCircle size={14} /> Inactive
//           </span>
//         ),
//     },
//     {
//       name: "Joined",
//       selector: (row) => row.createdAt,
//       sortable: true,
//       cell: (row) => (
//         <span className="text-gray-400 text-sm">
//           {row.createdAt
//             ? new Date(row.createdAt).toLocaleDateString()
//             : "—"}
//         </span>
//       ),
//     },
//     {
//       name: "Actions",
//       cell: (row) => (
//         <div className="flex items-center justify-end gap-2">
//           <button
//             onClick={() => handleView(row)}
//             className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
//             title="View Employee"
//           >
//             <Eye size={16} />
//           </button>
//           <button
//             onClick={() => handleDelete(row._id)}
//             className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
//             title="Delete Employee"
//           >
//             <Trash2 size={16} />
//           </button>
//         </div>
//       ),
//       right: true,
//       ignoreRowClick: true,
//       allowOverflow: true,
//       button: true,
//     },
//   ];

//   // ========== Custom Dark Theme for DataTable ==========
//   const customStyles = {
//     table: {
//       style: {
//         backgroundColor: "transparent",
//       },
//     },
//     headRow: {
//       style: {
//         backgroundColor: "rgba(31, 41, 55, 0.8)",
//         borderBottom: "1px solid #1f2937",
//         color: "#d1d5db",
//         fontSize: "0.875rem",
//         fontWeight: 500,
//         minHeight: "52px",
//       },
//     },
//     headCells: {
//       style: {
//         paddingLeft: "24px",
//         paddingRight: "24px",
//       },
//     },
//     rows: {
//       style: {
//         backgroundColor: "transparent",
//         color: "#e5e7eb",
//         borderBottom: "1px solid #1f2937",
//         minHeight: "64px",
//         "&:hover": {
//           backgroundColor: "rgba(31, 41, 55, 0.4)",
//         },
//       },
//     },
//     cells: {
//       style: {
//         paddingLeft: "24px",
//         paddingRight: "24px",
//       },
//     },
//     pagination: {
//       style: {
//         backgroundColor: "transparent",
//         borderTop: "1px solid #1f2937",
//         color: "#9ca3af",
//         minHeight: "56px",
//       },
//       pageButtonsStyle: {
//         borderRadius: "8px",
//         height: "36px",
//         width: "36px",
//         padding: "4px",
//         margin: "0 4px",
//         cursor: "pointer",
//         transition: "0.2s",
//         color: "#d1d5db",
//         fill: "#d1d5db",
//         backgroundColor: "#1f2937",
//         "&:disabled": {
//           cursor: "not-allowed",
//           opacity: 0.4,
//         },
//         "&:hover:not(:disabled)": {
//           backgroundColor: "#374151",
//         },
//         "&:focus": {
//           outline: "none",
//         },
//       },
//     },
//     noData: {
//       style: {
//         backgroundColor: "transparent",
//         color: "#6b7280",
//         padding: "48px",
//       },
//     },
//     progress: {
//       style: {
//         backgroundColor: "transparent",
//         color: "#818cf8",
//       },
//     },
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 p-4 md:p-8">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
//           <div>
//             <h1 className="text-3xl font-bold text-white flex items-center gap-3">
//               <Users className="w-8 h-8 text-indigo-400" />
//               All Users
//             </h1>
//             <p className="text-gray-400 mt-1">
//               Manage users & create new employees
//             </p>
//           </div>
//           <button
//             onClick={() => setShowAddModal(true)}
//             className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-lg shadow-indigo-900/30"
//           >
//             <UserPlus size={18} />
//             Add Employee
//           </button>
//         </div>

//         {/* Search + Filters */}
//         <div className="mb-6 flex flex-col lg:flex-row gap-4">
//           {/* Search */}
//           <div className="relative flex-1 max-w-md">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
//             <input
//               type="text"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               placeholder="Search by name, email or contact..."
//               className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none"
//             />
//           </div>

//           {/* Role Filter */}
//           <div className="relative">
//             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
//             <select
//               value={roleFilter}
//               onChange={(e) => setRoleFilter(e.target.value)}
//               className="pl-9 pr-8 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer min-w-[140px]"
//             >
//               <option value="all">All Roles</option>
//               <option value="admin">Admin</option>
//               <option value="finance">Finance</option>
//               <option value="support">Support</option>
//               <option value="read-only">Read Only</option>
//             </select>
//           </div>

//           {/* Status Filter */}
//           <div className="relative">
//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               className="pl-4 pr-8 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer min-w-[140px]"
//             >
//               <option value="all">All Status</option>
//               <option value="active">Active</option>
//               <option value="inactive">Inactive</option>
//             </select>
//           </div>
//         </div>

//         {/* Data Table */}
//         <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
//           <DataTable
//             columns={columns}
//             data={filteredUsers}
//             progressPending={loading}
//             pagination
//             paginationPerPage={10}
//             paginationRowsPerPageOptions={[5, 10, 15, 25, 50]}
//             highlightOnHover
//             pointerOnHover
//             customStyles={customStyles}
//             noDataComponent={
//               <div className="py-12 text-center text-gray-500">
//                 No users found
//               </div>
//             }
//             progressComponent={
//               <div className="py-12 text-center text-gray-500">
//                 Loading users...
//               </div>
//             }
//           />
//         </div>
//       </div>

//       {/* ==================== VIEW EMPLOYEE MODAL ==================== */}
//       {showViewModal && selectedUser && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
//           <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
//             <div className="sticky top-0 z-10 flex items-center justify-between bg-indigo-600 text-white px-6 py-4 rounded-t-2xl">
//               <h2 className="text-xl font-bold">Employee Details</h2>
//               <button
//                 onClick={() => {
//                   setShowViewModal(false);
//                   setSelectedUser(null);
//                 }}
//                 className="p-1.5 hover:bg-white/20 rounded-lg transition"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="p-6 space-y-6">
//               <div className="flex flex-col items-center text-center">
//                 <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-indigo-500/50 overflow-hidden flex items-center justify-center mb-3">
//                   {selectedUser.profilePhoto ? (
//                     <img
//                       src={selectedUser.profilePhoto}
//                       alt={selectedUser.name}
//                       className="w-full h-full object-cover"
//                     />
//                   ) : (
//                     <span className="text-3xl text-white font-bold">
//                       {selectedUser.name?.charAt(0)?.toUpperCase()}
//                     </span>
//                   )}
//                 </div>
//                 <h3 className="text-2xl font-bold text-white">
//                   {selectedUser.name}
//                 </h3>
//                 <p className="text-gray-400 text-sm mt-1">{selectedUser.email}</p>
//                 <div className="mt-3">
//                   <span
//                     className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
//                       selectedUser.role === "admin"
//                         ? "bg-indigo-500/20 text-indigo-300"
//                         : selectedUser.role === "finance"
//                         ? "bg-emerald-500/20 text-emerald-300"
//                         : selectedUser.role === "support"
//                         ? "bg-amber-500/20 text-amber-300"
//                         : "bg-gray-500/20 text-gray-300"
//                     }`}
//                   >
//                     <Shield size={12} />
//                     {selectedUser.role}
//                   </span>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div className="bg-gray-800/60 rounded-xl p-4">
//                   <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
//                     <Phone size={14} />
//                     Contact Number
//                   </div>
//                   <p className="text-white font-medium">
//                     {selectedUser.contactNumber || "—"}
//                   </p>
//                 </div>

//                 <div className="bg-gray-800/60 rounded-xl p-4">
//                   <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
//                     <Phone size={14} />
//                     Country Code
//                   </div>
//                   <p className="text-white font-medium">
//                     {selectedUser.countryCode || "—"}
//                   </p>
//                 </div>

//                 <div className="bg-gray-800/60 rounded-xl p-4">
//                   <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
//                     <Calendar size={14} />
//                     Date of Joining
//                   </div>
//                   <p className="text-white font-medium">
//                     {selectedUser.dateOfJoining
//                       ? new Date(selectedUser.dateOfJoining).toLocaleDateString(
//                           "en-IN",
//                           { day: "2-digit", month: "long", year: "numeric" }
//                         )
//                       : "—"}
//                   </p>
//                 </div>

//                 <div className="bg-gray-800/60 rounded-xl p-4">
//                   <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
//                     <Briefcase size={14} />
//                     Experience
//                   </div>
//                   <p className="text-white font-medium">
//                     {selectedUser.experienceYears
//                       ? `${selectedUser.experienceYears} Years`
//                       : "—"}
//                   </p>
//                 </div>

//                 <div className="bg-gray-800/60 rounded-xl p-4">
//                   <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
//                     <Shield size={14} />
//                     Status
//                   </div>
//                   <p className="text-white font-medium">
//                     {selectedUser.isActive !== false ? (
//                       <span className="text-emerald-400 flex items-center gap-1">
//                         <CheckCircle2 size={16} /> Active
//                       </span>
//                     ) : (
//                       <span className="text-red-400 flex items-center gap-1">
//                         <XCircle size={16} /> Inactive
//                       </span>
//                     )}
//                   </p>
//                 </div>

//                 <div className="bg-gray-800/60 rounded-xl p-4">
//                   <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
//                     <Calendar size={14} />
//                     Account Created
//                   </div>
//                   <p className="text-white font-medium">
//                     {selectedUser.createdAt
//                       ? new Date(selectedUser.createdAt).toLocaleDateString(
//                           "en-IN",
//                           { day: "2-digit", month: "long", year: "numeric" }
//                         )
//                       : "—"}
//                   </p>
//                 </div>
//               </div>

//               <button
//                 onClick={() => {
//                   setShowViewModal(false);
//                   setSelectedUser(null);
//                 }}
//                 className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ==================== ADD EMPLOYEE MODAL ==================== */}
//       {showAddModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
//           <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
//             <div className="sticky top-0 z-10 flex items-center justify-between bg-indigo-600 text-white px-6 py-4 rounded-t-2xl">
//               <h2 className="text-xl font-bold">Add New Employee</h2>
//               <button
//                 onClick={() => {
//                   setShowAddModal(false);
//                   resetForm();
//                 }}
//                 className="p-1.5 hover:bg-white/20 rounded-lg transition"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             <form
//               onSubmit={handleSubmit}
//               className="p-6 space-y-5"
//               autoComplete="off"
//             >
//               {/* Profile Photo */}
//               <div className="flex flex-col items-center">
//                 <div className="relative">
//                   <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-gray-700 overflow-hidden flex items-center justify-center">
//                     {photoPreview ? (
//                       <img
//                         src={photoPreview}
//                         alt="Preview"
//                         className="w-full h-full object-cover"
//                       />
//                     ) : (
//                       <Camera className="w-7 h-7 text-gray-500" />
//                     )}
//                   </div>
//                   <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-full cursor-pointer">
//                     <Camera size={12} />
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handlePhotoChange}
//                       className="hidden"
//                     />
//                   </label>
//                 </div>
//                 <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
//               </div>

//               {/* Name + Email */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm text-gray-300 mb-1">
//                     Full Name
//                   </label>
//                   <div className="relative">
//                     <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
//                     <input
//                       type="text"
//                       name="name"
//                       value={formData.name}
//                       onChange={handleChange}
//                       required
//                       placeholder="John Doe"
//                       className="w-full pl-9 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm text-gray-300 mb-1">Email</label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
//                     <input
//                       type="email"
//                       name="email"
//                       value={formData.email}
//                       onChange={handleChange}
//                       required
//                       placeholder="employee@gmail.com"
//                       className="w-full pl-9 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Contact + Date */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm text-gray-300 mb-1">
//                     Contact Number
//                   </label>
//                   <div className="relative flex">
//                     <div className="relative">
//                       <button
//                         type="button"
//                         onClick={() => setShowCountryList(!showCountryList)}
//                         className="h-full flex items-center gap-1 px-3 py-2.5 bg-gray-800 border border-gray-700 border-r-0 rounded-l-lg text-white text-sm min-w-[85px]"
//                       >
//                         {selectedCountry.dial}
//                         <ChevronDown size={14} className="text-gray-400" />
//                       </button>
//                       {showCountryList && (
//                         <div className="absolute top-full left-0 mt-1 w-60 max-h-48 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
//                           <div className="sticky top-0 p-2 bg-gray-800 border-b border-gray-700">
//                             <input
//                               type="text"
//                               value={countrySearch}
//                               onChange={(e) => setCountrySearch(e.target.value)}
//                               placeholder="Search..."
//                               className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 text-white text-sm rounded outline-none"
//                               autoFocus
//                             />
//                           </div>
//                           {filteredCountries.map((c) => (
//                             <button
//                               key={c.code}
//                               type="button"
//                               onClick={() => {
//                                 setSelectedCountry(c);
//                                 setShowCountryList(false);
//                                 setCountrySearch("");
//                               }}
//                               className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-indigo-600/30 flex justify-between"
//                             >
//                               <span>{c.name}</span>
//                               <span className="text-gray-400">{c.dial}</span>
//                             </button>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                     <div className="relative flex-1">
//                       <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
//                       <input
//                         type="tel"
//                         name="contactNumber"
//                         value={formData.contactNumber}
//                         onChange={handleChange}
//                         required
//                         maxLength={15}
//                         inputMode="numeric"
//                         pattern="[0-9]*"
//                         placeholder="9876543210"
//                         className="w-full pl-9 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-r-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
//                       />
//                     </div>
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm text-gray-300 mb-1">
//                     Date of Joining
//                   </label>
//                   <div className="relative">
//                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
//                     <input
//                       type="date"
//                       name="dateOfJoining"
//                       value={formData.dateOfJoining}
//                       onChange={handleChange}
//                       required
//                       className="w-full pl-9 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none [color-scheme:dark]"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Experience + Role */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm text-gray-300 mb-1">
//                     Experience (Years)
//                   </label>
//                   <div className="relative">
//                     <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
//                     <input
//                       type="number"
//                       name="experienceYears"
//                       value={formData.experienceYears}
//                       onChange={handleChange}
//                       required
//                       min="0"
//                       max="50"
//                       step="0.5"
//                       placeholder="2.5"
//                       className="w-full pl-9 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm text-gray-300 mb-1">Role</label>
//                   <div className="relative">
//                     <BriefcaseBusiness className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
//                     <select
//                       name="role"
//                       value={formData.role}
//                       onChange={handleChange}
//                       className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
//                     >
//                       <option value="admin">Admin</option>
//                       <option value="finance">Finance</option>
//                       <option value="support">Support</option>
//                       <option value="read-only">Read Only</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* Password + Confirm */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm text-gray-300 mb-1">
//                     Password
//                   </label>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
//                     <input
//                       type={showPassword ? "text" : "password"}
//                       name="password"
//                       value={formData.password}
//                       onChange={handleChange}
//                       onCopy={preventCopyPaste}
//                       onPaste={preventCopyPaste}
//                       required
//                       placeholder="••••••••"
//                       className="w-full pl-9 pr-10 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
//                     >
//                       {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//                     </button>
//                   </div>

//                   {/* Password Strength Indicator */}
//                   {formData.password && (
//                     <div className="mt-2">
//                       <div className="flex items-center justify-between text-xs mb-1">
//                         <span className="text-gray-400">Password Strength</span>
//                         <span
//                           className={`font-medium ${
//                             getPasswordStrength(formData.password).label ===
//                             "Weak"
//                               ? "text-red-400"
//                               : getPasswordStrength(formData.password).label ===
//                                 "Medium"
//                               ? "text-yellow-400"
//                               : "text-emerald-400"
//                           }`}
//                         >
//                           {getPasswordStrength(formData.password).label}
//                         </span>
//                       </div>
//                       <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
//                         <div
//                           className={`h-full transition-all duration-300 ${
//                             getPasswordStrength(formData.password).color
//                           }`}
//                           style={{
//                             width: getPasswordStrength(formData.password).width,
//                           }}
//                         />
//                       </div>
//                       <p className="text-xs text-gray-500 mt-1.5">
//                         Must contain: 8+ chars, uppercase, lowercase, number &
//                         special character
//                       </p>
//                     </div>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-sm text-gray-300 mb-1">
//                     Confirm Password
//                   </label>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
//                     <input
//                       type={showPassword ? "text" : "password"}
//                       name="confirmPassword"
//                       value={formData.confirmPassword}
//                       onChange={handleChange}
//                       onCopy={preventCopyPaste}
//                       onPaste={preventCopyPaste}
//                       required
//                       placeholder="••••••••"
//                       className="w-full pl-9 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Setup Key */}
//               <div>
//                 <label className="block text-sm text-gray-300 mb-1">
//                   Setup Key
//                 </label>
//                 <div className="relative">
//                   <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
//                   <input
//                     type={showKey ? "text" : "password"}
//                     name="registerKey"
//                     value={formData.registerKey}
//                     onChange={handleChange}
//                     onCopy={preventCopyPaste}
//                     onPaste={preventCopyPaste}
//                     required
//                     placeholder="Admin setup key"
//                     className="w-full pl-9 pr-10 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowKey(!showKey)}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
//                   >
//                     {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
//                   </button>
//                 </div>
//               </div>

//               {/* Submit */}
//               <div className="flex gap-3 pt-2">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowAddModal(false);
//                     resetForm();
//                   }}
//                   className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg font-medium transition"
//                 >
//                   {isSubmitting ? "Creating..." : "Create Employee"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import {
  UserPlus,
  Search,
  Users,
  Mail,
  Shield,
  Eye,
  Trash2,
  X,
  User,
  Lock,
  EyeOff,
  BriefcaseBusiness,
  Phone,
  Calendar,
  Camera,
  Briefcase,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Filter,
  Power,
  PowerOff,
} from "lucide-react";
import API from "../../../api";
import toast from "react-hot-toast";
import { hasFeature } from "../../../config/roleConfig";
import tableCustomStyles from "../../../utils/tableStyles";

// Country list
const countries = [
  { name: "India", code: "IN", dial: "+91" },
  { name: "United States", code: "US", dial: "+1" },
  { name: "United Kingdom", code: "GB", dial: "+44" },
  { name: "Canada", code: "CA", dial: "+1" },
  { name: "Australia", code: "AU", dial: "+61" },
  { name: "Germany", code: "DE", dial: "+49" },
  { name: "France", code: "FR", dial: "+33" },
  { name: "UAE", code: "AE", dial: "+971" },
  { name: "Saudi Arabia", code: "SA", dial: "+966" },
  { name: "Singapore", code: "SG", dial: "+65" },
  { name: "Japan", code: "JP", dial: "+81" },
  { name: "China", code: "CN", dial: "+86" },
  { name: "South Korea", code: "KR", dial: "+82" },
  { name: "Brazil", code: "BR", dial: "+55" },
  { name: "Russia", code: "RU", dial: "+7" },
  { name: "South Africa", code: "ZA", dial: "+27" },
  { name: "Nigeria", code: "NG", dial: "+234" },
  { name: "Pakistan", code: "PK", dial: "+92" },
  { name: "Bangladesh", code: "BD", dial: "+880" },
  { name: "Nepal", code: "NP", dial: "+977" },
  { name: "Sri Lanka", code: "LK", dial: "+94" },
  { name: "Malaysia", code: "MY", dial: "+60" },
  { name: "Indonesia", code: "ID", dial: "+62" },
  { name: "Thailand", code: "TH", dial: "+66" },
  { name: "Philippines", code: "PH", dial: "+63" },
  { name: "Vietnam", code: "VN", dial: "+84" },
  { name: "Italy", code: "IT", dial: "+39" },
  { name: "Spain", code: "ES", dial: "+34" },
  { name: "Netherlands", code: "NL", dial: "+31" },
  { name: "Switzerland", code: "CH", dial: "+41" },
  { name: "Sweden", code: "SE", dial: "+46" },
  { name: "Norway", code: "NO", dial: "+47" },
  { name: "Denmark", code: "DK", dial: "+45" },
  { name: "Finland", code: "FI", dial: "+358" },
  { name: "Poland", code: "PL", dial: "+48" },
  { name: "Turkey", code: "TR", dial: "+90" },
  { name: "Egypt", code: "EG", dial: "+20" },
  { name: "Kenya", code: "KE", dial: "+254" },
  { name: "New Zealand", code: "NZ", dial: "+64" },
  { name: "Mexico", code: "MX", dial: "+52" },
  { name: "Argentina", code: "AR", dial: "+54" },
  { name: "Chile", code: "CL", dial: "+56" },
  { name: "Colombia", code: "CO", dial: "+57" },
  { name: "Ireland", code: "IE", dial: "+353" },
  { name: "Portugal", code: "PT", dial: "+351" },
  { name: "Belgium", code: "BE", dial: "+32" },
  { name: "Austria", code: "AT", dial: "+43" },
  { name: "Israel", code: "IL", dial: "+972" },
  { name: "Qatar", code: "QA", dial: "+974" },
  { name: "Kuwait", code: "KW", dial: "+965" },
  { name: "Bahrain", code: "BH", dial: "+973" },
  { name: "Oman", code: "OM", dial: "+968" },
  { name: "Hong Kong", code: "HK", dial: "+852" },
  { name: "Taiwan", code: "TW", dial: "+886" },
];

export default function UsersManagement() {
  const navigate = useNavigate();

  // ========== Data State ==========
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ========== Search + Filters ==========
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // ========== Modal + Form State ==========
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin",
    contactNumber: "",
    dateOfJoining: "",
    experienceYears: "",
  });

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountryList, setShowCountryList] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dial.includes(countrySearch)
  );

  // ========== Fetch Users ==========
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/roles");
      if (res.data.success) {
        setUsers(res.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ========== Filtered Data ==========
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = search.toLowerCase().trim();

      const matchesSearch =
        !searchLower ||
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.contactNumber?.toLowerCase().includes(searchLower);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive !== false) ||
        (statusFilter === "inactive" && user.isActive === false);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // ========== Form Handlers ==========
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "contactNumber") {
      const onlyNums = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: onlyNums }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push("Password must be at least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("At least one uppercase letter required");
    if (!/[a-z]/.test(password)) errors.push("At least one lowercase letter required");
    if (!/[0-9]/.test(password)) errors.push("At least one number required");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      errors.push("At least one special character required (!@#$%^&*)");
    return errors;
  };

  const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
    if (score === 3 || score === 4)
      return { label: "Medium", color: "bg-yellow-500", width: "66%" };
    return { label: "Strong", color: "bg-emerald-500", width: "100%" };
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const preventCopyPaste = (e) => {
    e.preventDefault();
    toast.error("Copy / Paste not allowed");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "admin",
      contactNumber: "",
      dateOfJoining: "",
      experienceYears: "",
    });
    setProfilePhoto(null);
    setPhotoPreview(null);
    setSelectedCountry(countries[0]);
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (formData.contactNumber.length < 7 || formData.contactNumber.length > 15) {
      toast.error("Please enter a valid contact number (7-15 digits)");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      toast.error(passwordErrors[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      const fullContact = `${selectedCountry.dial}${formData.contactNumber}`;
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("role", formData.role);
      data.append("contactNumber", fullContact);
      data.append("countryCode", selectedCountry.dial);
      data.append("dateOfJoining", formData.dateOfJoining);
      data.append("experienceYears", formData.experienceYears);
      if (profilePhoto) data.append("profilePhoto", profilePhoto);

      const res = await API.post("/admin/employee/register", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "Registration failed");
      }

      toast.success(res.data.message || "Employee created successfully!");
      setShowAddModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Registration failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

 const handleDelete = async (id) => {                          // line 1461
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      const res = await API.delete(`/admin/employee/${id}`);    // line 1464  ← new endpoint
      if (res.data.success) {
        toast.success("Employee deleted");
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };
  // ========== Toggle Enable / Disable ==========
  const handleToggleStatus = async (user) => {
    const newStatus = user.isActive === false ? true : false;
    const action = newStatus ? "enable" : "disable";

    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const res = await API.patch(`/admin/users/${user._id}/status`, {
        isActive: newStatus,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        // Optimistic update
        setUsers((prev) =>
          prev.map((u) =>
            u._id === user._id ? { ...u, isActive: newStatus } : u
          )
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  // ========== DataTable Columns ==========
  const columns = [
    {
      name: "User",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div
          className={`flex items-center gap-3 py-2 ${
            row.isActive === false ? "opacity-50" : ""
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center shrink-0">
            {row.profilePhoto ? (
              <img
                src={row.profilePhoto}
                alt={row.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-medium">
                {row.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p
              className={`font-medium ${
                row.isActive === false
                  ? "text-gray-500 line-through"
                  : "text-white"
              }`}
            >
              {row.name}
            </p>
            <p className="text-xs text-gray-500">
              {row.contactNumber || "No contact"} • {row.experienceYears ?? 0} yrs
            </p>
          </div>
        </div>
      ),
      minWidth: "220px",
    },
    {
      name: "Email",
      selector: (row) => row.email,
      sortable: true,
      cell: (row) => (
        <div
          className={`flex items-center gap-1.5 ${
            row.isActive === false ? "text-gray-500" : "text-gray-300"
          }`}
        >
          <Mail size={14} className="text-gray-500" />
          {row.email}
        </div>
      ),
      minWidth: "200px",
    },
    {
      name: "Role",
      selector: (row) => row.role,
      sortable: true,
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
            row.isActive === false
              ? "bg-gray-600/30 text-gray-400"
              : row.role === "admin"
              ? "bg-indigo-500/20 text-indigo-300"
              : row.role === "finance"
              ? "bg-emerald-500/20 text-emerald-300"
              : row.role === "support"
              ? "bg-amber-500/20 text-amber-300"
              : "bg-gray-500/20 text-gray-300"
          }`}
        >
          <Shield size={12} />
          {row.role}
        </span>
      ),
    },
    {
      name: "Status",
      selector: (row) => (row.isActive !== false ? "Active" : "Inactive"),
      sortable: true,
      cell: (row) =>
        row.isActive !== false ? (
          <span className="text-emerald-400 text-sm flex items-center gap-1">
            <CheckCircle2 size={14} /> Active
          </span>
        ) : (
          <span className="text-red-400 text-sm flex items-center gap-1">
            <XCircle size={14} /> Disabled
          </span>
        ),
    },
    {
      name: "Joined",
      selector: (row) => row.createdAt,
      sortable: true,
      cell: (row) => (
        <span
          className={`text-sm ${
            row.isActive === false ? "text-gray-600" : "text-gray-400"
          }`}
        >
          {row.createdAt
            ? new Date(row.createdAt).toLocaleDateString()
            : "—"}
        </span>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          {/* Enable / Disable Dropdown */}
          <div className="relative group">
            <button
              onClick={() => handleToggleStatus(row)}
              className={`p-2 rounded-lg transition ${
                row.isActive === false
                  ? "text-emerald-400 hover:bg-emerald-500/10"
                  : "text-orange-400 hover:bg-orange-500/10"
              }`}
              title={row.isActive === false ? "Enable User" : "Disable User"}
            >
              {row.isActive === false ? (
                <Power size={16} />
              ) : (
                <PowerOff size={16} />
              )}
            </button>
          </div>

          <button
            onClick={() => handleView(row)}
            className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
            title="View Employee"
          >
            <Eye size={16} />
          </button>

          <button
            onClick={() => handleDelete(row._id)}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
            title="Delete Employee"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      style: { justifyContent: "flex-end" },
      minWidth: "140px",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-400" />
              All Users
            </h1>
            <p className="text-gray-400 mt-1">
              Manage users & create new employees
            </p>
          </div>

          {hasFeature("canCreateEmployee") && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-lg shadow-indigo-900/30"
            >
              <UserPlus size={18} />
              Add Employee
            </button>
          )}
        </div>

        {/* Search + Filters */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or contact..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>


          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="finance">Finance</option>
              <option value="support">Support</option>
              <option value="read-only">Read Only</option>
            </select>

          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-4 pr-8 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Disabled</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <DataTable
            columns={columns}
            data={filteredUsers}
            progressPending={loading}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[5, 10, 15, 25, 50]}
            highlightOnHover
            pointerOnHover={false}
            customStyles={tableCustomStyles}
            noDataComponent={
              <div className="py-12 text-center text-gray-500">
                No users found
              </div>
            }
            progressComponent={
              <div className="py-12 text-center text-gray-500">
                Loading users...
              </div>
            }
          />
        </div>
      </div>

      {/* ==================== VIEW EMPLOYEE MODAL ==================== */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-indigo-600 text-white px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold">Employee Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-indigo-500/50 overflow-hidden flex items-center justify-center mb-3">
                  {selectedUser.profilePhoto ? (
                    <img
                      src={selectedUser.profilePhoto}
                      alt={selectedUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-white font-bold">
                      {selectedUser.name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {selectedUser.name}
                </h3>
                <p className="text-gray-400 text-sm mt-1">{selectedUser.email}</p>
                <div className="mt-3 flex gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      selectedUser.role === "admin"
                        ? "bg-indigo-500/20 text-indigo-300"
                        : selectedUser.role === "finance"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : selectedUser.role === "support"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-gray-500/20 text-gray-300"
                    }`}
                  >
                    <Shield size={12} />
                    {selectedUser.role}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      selectedUser.isActive !== false
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {selectedUser.isActive !== false ? (
                      <>
                        <CheckCircle2 size={12} /> Active
                      </>
                    ) : (
                      <>
                        <XCircle size={12} /> Disabled
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-800/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Phone size={14} />
                    Contact Number
                  </div>
                  <p className="text-white font-medium">
                    {selectedUser.contactNumber || "—"}
                  </p>
                </div>

                <div className="bg-gray-800/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Phone size={14} />
                    Country Code
                  </div>
                  <p className="text-white font-medium">
                    {selectedUser.countryCode || "—"}
                  </p>
                </div>

                <div className="bg-gray-800/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Calendar size={14} />
                    Date of Joining
                  </div>
                  <p className="text-white font-medium">
                    {selectedUser.dateOfJoining
                      ? new Date(selectedUser.dateOfJoining).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "long", year: "numeric" }
                        )
                      : "—"}
                  </p>
                </div>

                <div className="bg-gray-800/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Briefcase size={14} />
                    Experience
                  </div>
                  <p className="text-white font-medium">
                    {selectedUser.experienceYears
                      ? `${selectedUser.experienceYears} Years`
                      : "—"}
                  </p>
                </div>

                <div className="bg-gray-800/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Shield size={14} />
                    Status
                  </div>
                  <p className="text-white font-medium">
                    {selectedUser.isActive !== false ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={16} /> Active
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1">
                        <XCircle size={16} /> Disabled
                      </span>
                    )}
                  </p>
                </div>

                <div className="bg-gray-800/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Calendar size={14} />
                    Account Created
                  </div>
                  <p className="text-white font-medium">
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "long", year: "numeric" }
                        )
                      : "—"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                }}
                className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD EMPLOYEE MODAL ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-indigo-600 text-white px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold">Add New Employee</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5"
              autoComplete="off"
            >
              {/* Profile Photo */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-gray-700 overflow-hidden flex items-center justify-center">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-7 h-7 text-gray-500" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-full cursor-pointer">
                    <Camera size={12} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
              </div>

              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="w-full pl-9 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="employee@gmail.com"
                      className="w-full pl-9 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Contact + Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Contact Number
                  </label>
                  <div className="relative flex">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountryList(!showCountryList)}
                        className="h-full flex items-center gap-1 px-3 py-2.5 bg-gray-800 border border-gray-700 border-r-0 rounded-l-lg text-white text-sm min-w-[85px]"
                      >
                        {selectedCountry.dial}
                        <ChevronDown size={14} className="text-gray-400" />
                      </button>
                      {showCountryList && (
                        <div className="absolute top-full left-0 mt-1 w-60 max-h-48 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                          <div className="sticky top-0 p-2 bg-gray-800 border-b border-gray-700">
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder="Search..."
                              className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 text-white text-sm rounded outline-none"
                              autoFocus
                            />
                          </div>
                          {filteredCountries.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(c);
                                setShowCountryList(false);
                                setCountrySearch("");
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-indigo-600/30 flex justify-between"
                            >
                              <span>{c.name}</span>
                              <span className="text-gray-400">{c.dial}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        required
                        maxLength={15}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="9876543210"
                        className="w-full pl-9 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-r-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Date of Joining
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="date"
                      name="dateOfJoining"
                      value={formData.dateOfJoining}
                      onChange={handleChange}
                      required
                      className="w-full pl-9 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {/* Experience + Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Experience (Years)
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="number"
                      name="experienceYears"
                      value={formData.experienceYears}
                      onChange={handleChange}
                      required
                      min="0"
                      max="50"
                      step="0.5"
                      placeholder="2.5"
                      className="w-full pl-9 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Role</label>
                  <div className="relative">
                    <BriefcaseBusiness className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="finance">Finance</option>
                      <option value="support">Support</option>
                      <option value="read-only">Read Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Password + Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onCopy={preventCopyPaste}
                      onPaste={preventCopyPaste}
                      required
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400">Password Strength</span>
                        <span
                          className={`font-medium ${
                            getPasswordStrength(formData.password).label ===
                            "Weak"
                              ? "text-red-400"
                              : getPasswordStrength(formData.password).label ===
                                "Medium"
                              ? "text-yellow-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {getPasswordStrength(formData.password).label}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            getPasswordStrength(formData.password).color
                          }`}
                          style={{
                            width: getPasswordStrength(formData.password).width,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">
                        Must contain: 8+ chars, uppercase, lowercase, number &
                        special character
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onCopy={preventCopyPaste}
                      onPaste={preventCopyPaste}
                      required
                      placeholder="••••••••"
                      className="w-full pl-9 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                {hasFeature("canCreateEmployee") && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg font-medium transition"
                  >
                    {isSubmitting ? "Creating..." : "Create Employee"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}