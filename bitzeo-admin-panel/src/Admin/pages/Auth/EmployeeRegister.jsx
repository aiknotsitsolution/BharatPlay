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
//           <div className="w-10 h-10 rounded-full bg-bp-border overflow-hidden flex items-center justify-center shrink-0">
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
//             <p className="text-xs text-bp-text-muted">
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
//         <div className="flex items-center gap-1.5 text-white">
//           <Mail size={14} className="text-bp-text-muted" />
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
//               ? "bg-bp-blue/20 text-bp-cyan"
//               : row.role === "finance"
//               ? "bg-emerald-500/20 text-emerald-300"
//               : row.role === "support"
//               ? "bg-bp-yellow/20 text-amber-300"
//               : "bg-bp-text-muted/20 text-white"
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
//         <span className="text-bp-text-secondary text-sm">
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
//             className="p-2 text-bp-text-secondary hover:text-bp-blue hover:bg-bp-blue/10 rounded-lg transition"
//             title="View Employee"
//           >
//             <Eye size={16} />
//           </button>
//           <button
//             onClick={() => handleDelete(row._id)}
//             className="p-2 text-bp-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
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
//     <div className="min-h-screen page-bg-gradient p-4 md:p-8">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
//           <div>
//             <h1 className="text-3xl font-bold text-white flex items-center gap-3">
//               <Users className="w-8 h-8 text-bp-blue" />
//               All Users
//             </h1>
//             <p className="text-bp-text-secondary mt-1">
//               Manage users & create new employees
//             </p>
//           </div>
//           <button
//             onClick={() => setShowAddModal(true)}
//             className="inline-flex items-center gap-2 bg-bp-blue hover:bg-bp-blue text-white px-5 py-2.5 rounded-lg font-medium transition shadow-lg shadow-indigo-900/30"
//           >
//             <UserPlus size={18} />
//             Add Employee
//           </button>
//         </div>

//         {/* Search + Filters */}
//         <div className="mb-6 flex flex-col lg:flex-row gap-4">
//           {/* Search */}
//           <div className="relative flex-1 max-w-md">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-5 h-5" />
//             <input
//               type="text"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               placeholder="Search by name, email or contact..."
//               className="w-full pl-10 pr-4 py-2.5 bg-bp-elevated border border-bp-border text-white rounded-lg placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue outline-none"
//             />
//           </div>

//           {/* Role Filter */}
//           <div className="relative">
//             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
//             <select
//               value={roleFilter}
//               onChange={(e) => setRoleFilter(e.target.value)}
//               className="pl-9 pr-8 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200 appearance-none cursor-pointer min-w-[140px]"
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
//               className="pl-4 pr-8 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200 appearance-none cursor-pointer min-w-[140px]"
//             >
//               <option value="all">All Status</option>
//               <option value="active">Active</option>
//               <option value="inactive">Inactive</option>
//             </select>
//           </div>
//         </div>

//         {/* Data Table */}
//         <div className="bg-bp-card border border-bp-border rounded-2xl overflow-hidden shadow-xl">
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
//               <div className="py-12 text-center text-bp-text-muted">
//                 No users found
//               </div>
//             }
//             progressComponent={
//               <div className="py-12 text-center text-bp-text-muted">
//                 Loading users...
//               </div>
//             }
//           />
//         </div>
//       </div>

//             {/* ==================== VIEW EMPLOYEE MODAL ==================== */}
//       {showAddModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
//           <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-bp-card border border-bp-border rounded-2xl shadow-2xl">
//             <div className="sticky top-0 z-10 flex items-center justify-between bg-bp-blue text-white px-6 py-4 rounded-t-2xl">
//               <h2 className="text-xl font-bold">Add New Employee</h2>
//               <button
//                 onClick={() => {
//                   setShowAddModal(false);
//                   resetForm();
//                 }}
//                 className="p-1.5 hover:bg-bp-hover rounded-lg transition"
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
//                   <div className="w-20 h-20 rounded-full bg-bp-elevated border-2 border-bp-border overflow-hidden flex items-center justify-center">
//                     {photoPreview ? (
//                       <img
//                         src={photoPreview}
//                         alt="Preview"
//                         className="w-full h-full object-cover"
//                       />
//                     ) : (
//                       <Camera className="w-7 h-7 text-bp-text-muted" />
//                     )}
//                   </div>
//                   <label className="absolute bottom-0 right-0 bg-bp-blue hover:bg-bp-blue text-white p-1.5 rounded-full cursor-pointer">
//                     <Camera size={12} />
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handlePhotoChange}
//                       className="hidden"
//                     />
//                   </label>
//                 </div>
//                 <p className="text-xs text-bp-text-muted mt-1">Max 5MB</p>
//               </div>

//               {/* Name + Email */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">
//                     Full Name
//                   </label>
//                   <div className="relative">
//                     <User className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
//                     <input
//                       type="text"
//                       name="name"
//                       value={formData.name}
//                       onChange={handleChange}
//                       required
//                       placeholder="John Doe"
//                       className="w-full pl-9 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">Email</label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
//                     <input
//                       type="email"
//                       name="email"
//                       value={formData.email}
//                       onChange={handleChange}
//                       required
//                       placeholder="employee@gmail.com"
//                       className="w-full pl-9 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Contact + Date */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">
//                     Contact Number
//                   </label>
//                   <div className="relative flex">
//                     <div className="relative">
//                       <button
//                         type="button"
//                         onClick={() => setShowCountryList(!showCountryList)}
//                         className="h-full flex items-center gap-1 px-3 py-2.5 bg-bp-elevated border border-bp-border border-r-0 rounded-l-lg text-white text-sm min-w-[85px]"
//                       >
//                         {selectedCountry.dial}
//                         <ChevronDown size={14} className="text-bp-text-secondary" />
//                       </button>
//                       {showCountryList && (
//                         <div className="absolute top-full left-0 mt-1 w-60 max-h-48 overflow-y-auto bg-bp-elevated border border-bp-border rounded-lg shadow-xl z-50">
//                           <div className="sticky top-0 p-2 bg-bp-elevated border-b border-bp-border">
//                             <input
//                               type="text"
//                               value={countrySearch}
//                               onChange={(e) => setCountrySearch(e.target.value)}
//                               placeholder="Search..."
//                               className="w-full px-2 py-1.5 bg-bp-card border border-bp-border text-white text-sm rounded outline-none"
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
//                               className="w-full text-left px-3 py-2 text-sm text-white hover:bg-bp-blue/30 flex justify-between"
//                             >
//                               <span>{c.name}</span>
//                               <span className="text-bp-text-secondary">{c.dial}</span>
//                             </button>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                     <div className="relative flex-1">
//                       <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
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
//                         className="w-full pl-9 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-r-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200"
//                       />
//                     </div>
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">
//                     Date of Joining
//                   </label>
//                   <div className="relative">
//                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
//                     <input
//                       type="date"
//                       name="dateOfJoining"
//                       value={formData.dateOfJoining}
//                       onChange={handleChange}
//                       required
//                       className="w-full pl-9 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200 [color-scheme:dark]"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Experience + Role */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">
//                     Experience (Years)
//                   </label>
//                   <div className="relative">
//                     <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
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
//                       className="w-full pl-9 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">Role</label>
//                   <div className="relative">
//                     <BriefcaseBusiness className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
//                     <select
//                       name="role"
//                       value={formData.role}
//                       onChange={handleChange}
//                       className="w-full pl-9 pr-4 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200 appearance-none"
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
//                   <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">
//                     Password
//                   </label>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
//                     <input
//                       type={showPassword ? "text" : "password"}
//                       name="password"
//                       value={formData.password}
//                       onChange={handleChange}
//                       onCopy={preventCopyPaste}
//                       onPaste={preventCopyPaste}
//                       required
//                       placeholder="••••••••"
//                       className="w-full pl-9 pr-10 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-bp-text-muted"
//                     >
//                       {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//                     </button>
//                   </div>

//                   {/* Password Strength Indicator */}
//                   {formData.password && (
//                     <div className="mt-2">
//                       <div className="flex items-center justify-between text-xs mb-1">
//                         <span className="text-bp-text-secondary">Password Strength</span>
//                         <span
//                           className={`font-medium ${
//                             getPasswordStrength(formData.password).label ===
//                             "Weak"
//                               ? "text-red-400"
//                               : getPasswordStrength(formData.password).label ===
//                                 "Medium"
//                               ? "text-bp-yellow"
//                               : "text-emerald-400"
//                           }`}
//                         >
//                           {getPasswordStrength(formData.password).label}
//                         </span>
//                       </div>
//                       <div className="w-full h-1.5 bg-bp-border rounded-full overflow-hidden">
//                         <div
//                           className={`h-full transition-all duration-300 ${
//                             getPasswordStrength(formData.password).color
//                           }`}
//                           style={{
//                             width: getPasswordStrength(formData.password).width,
//                           }}
//                         />
//                       </div>
//                       <p className="text-xs text-bp-text-muted mt-1.5">
//                         Must contain: 8+ chars, uppercase, lowercase, number &
//                         special character
//                       </p>
//                     </div>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">
//                     Confirm Password
//                   </label>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
//                     <input
//                       type={showPassword ? "text" : "password"}
//                       name="confirmPassword"
//                       value={formData.confirmPassword}
//                       onChange={handleChange}
//                       onCopy={preventCopyPaste}
//                       onPaste={preventCopyPaste}
//                       required
//                       placeholder="••••••••"
//                       className="w-full pl-9 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Setup Key */}
//               <div>
//                 <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">
//                   Setup Key
//                 </label>
//                 <div className="relative">
//                   <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
//                   <input
//                     type={showKey ? "text" : "password"}
//                     name="registerKey"
//                     value={formData.registerKey}
//                     onChange={handleChange}
//                     onCopy={preventCopyPaste}
//                     onPaste={preventCopyPaste}
//                     required
//                     placeholder="Admin setup key"
//                     className="w-full pl-9 pr-10 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowKey(!showKey)}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-bp-text-muted"
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
//                   className="flex-1 py-2.5 bg-bp-border hover:bg-bp-border text-white rounded-lg font-medium transition"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className="flex-1 py-2.5 bg-bp-blue hover:bg-bp-blue disabled:bg-bp-text-muted text-white rounded-lg font-medium transition"
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
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Check,
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
  const [showRoleList, setShowRoleList] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const todayObj = new Date();
  const [calYear, setCalYear] = useState(todayObj.getFullYear());
  const [calMonth, setCalMonth] = useState(todayObj.getMonth());
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

  const roles = [
    { value: "admin", label: "Admin", dot: "bg-bp-blue" },
    { value: "finance", label: "Finance", dot: "bg-bp-yellow" },
    { value: "support", label: "Support", dot: "bg-bp-cyan" },
    { value: "read-only", label: "Read Only", dot: "bg-bp-text-muted" },
  ];
  const selectedRole = roles.find((r) => r.value === formData.role) || roles[0];

  // ========== Custom calendar helpers (Date of Joining) ==========
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const parseDateStr = (s) => {
    if (!s) return null;
    const parts = s.split("-").map(Number);
    if (parts.length !== 3) return null;
    return { y: parts[0], m: parts[1] - 1, d: parts[2] };
  };
  const toDateStr = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const selectedDate = parseDateStr(formData.dateOfJoining);
  const openCalendar = () => {
    if (selectedDate) {
      setCalYear(selectedDate.y);
      setCalMonth(selectedDate.m);
    } else {
      const t = new Date();
      setCalYear(t.getFullYear());
      setCalMonth(t.getMonth());
    }
    setShowCalendar(true);
  };
  const shiftMonth = (dir) => {
    let m = calMonth + dir;
    let y = calYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setCalMonth(m);
    setCalYear(y);
  };
  const pickDate = (d) => {
    handleChange({ target: { name: "dateOfJoining", value: toDateStr(calYear, calMonth, d) } });
    setShowCalendar(false);
  };
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const realToday = new Date();

  // ========== Custom stepper (Experience Years, step 0.5) ==========
  const stepExperience = (dir) => {
    const cur = parseFloat(formData.experienceYears);
    const base = Number.isNaN(cur) ? 0 : cur;
    const next = Math.round((base + dir * 0.5) * 10) / 10;
    const clamped = Math.min(50, Math.max(0, next));
    handleChange({ target: { name: "experienceYears", value: String(clamped) } });
  };
  const expNum = parseFloat(formData.experienceYears);

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
    setShowCountryList(false);
    setShowRoleList(false);
    setShowCalendar(false);
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

    if (!formData.dateOfJoining) {
      toast.error("Please select date of joining");
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
          <div className="w-10 h-10 rounded-full bg-bp-border overflow-hidden flex items-center justify-center shrink-0">
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
                  ? "text-bp-text-muted line-through"
                  : "text-white"
              }`}
            >
              {row.name}
            </p>
            <p className="text-xs text-bp-text-muted">
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
            row.isActive === false ? "text-bp-text-muted" : "text-white"
          }`}
        >
          <Mail size={14} className="text-bp-text-muted" />
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
              ? "bg-bp-elevated text-bp-text-secondary"
              : row.role === "admin"
              ? "bg-bp-blue/20 text-bp-cyan"
              : row.role === "finance"
              ? "bg-emerald-500/20 text-emerald-300"
              : row.role === "support"
              ? "bg-bp-yellow/20 text-amber-300"
              : "bg-bp-text-muted/20 text-white"
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
            row.isActive === false ? "text-bp-text-muted" : "text-bp-text-secondary"
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
                  : "text-bp-orange hover:bg-bp-orange/10"
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
            className="p-2 text-bp-text-secondary hover:text-bp-blue hover:bg-bp-blue/10 rounded-lg transition"
            title="View Employee"
          >
            <Eye size={16} />
          </button>

          <button
            onClick={() => handleDelete(row._id)}
            className="p-2 text-bp-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
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
    <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              All Employee users
            </h1>
            <p className="text-[13px] text-bp-text-secondary mt-1">
              Manage users & create new employees
            </p>
          </div>

          {hasFeature("canCreateEmployee") && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{ background: "linear-gradient(135deg, #0069BE, #0092CC)" }}
              className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-white/10 shadow-md shadow-bp-blue/20 hover:shadow-lg hover:shadow-bp-blue/25"
            >
              <UserPlus size={18} />
              Add Employee
            </button>
          )}
        </div>

        {/* Search + Filters */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or contact..."
              className="w-full pl-9 pr-9 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-bp-text-muted hover:text-white hover:bg-bp-blue/10 transition-colors duration-150"
              >
                <X size={14} />
              </button>
            )}
          </div>


          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleFilter(!showRoleFilter)}
              className="pl-9 pr-10 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200 flex items-center gap-2 min-w-[160px]"
            >
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4 pointer-events-none" />
              <span className="font-medium">{roleFilter === "all" ? "All Roles" : (roles.find((r) => r.value === roleFilter)?.label || "All Roles")}</span>
            </button>
            <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 text-bp-text-secondary pointer-events-none transition-transform duration-200 ${showRoleFilter ? "rotate-180" : ""}`} />
            {showRoleFilter && (
              <div className="absolute top-full left-0 mt-2 min-w-full bg-bp-card border border-bp-border/60 rounded-xl shadow-2xl z-30 p-1.5">
                <button
                  type="button"
                  onClick={() => { setRoleFilter("all"); setShowRoleFilter(false); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 transition-colors duration-150 ${roleFilter === "all" ? "bg-bp-blue/15 text-bp-blue" : "text-white hover:bg-bp-blue/10"}`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0 bg-bp-text-muted" />
                  <span className="font-medium flex-1">All Roles</span>
                  {roleFilter === "all" && <Check size={14} />}
                </button>
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => { setRoleFilter(r.value); setShowRoleFilter(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 transition-colors duration-150 ${roleFilter === r.value ? "bg-bp-blue/15 text-bp-blue" : "text-white hover:bg-bp-blue/10"}`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${r.dot}`} />
                    <span className="font-medium flex-1">{r.label}</span>
                    {roleFilter === r.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className="pl-4 pr-10 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200 flex items-center gap-2 min-w-[150px]"
            >
              <span className="font-medium">{statusFilter === "all" ? "All Status" : statusFilter === "active" ? "Active" : "Disabled"}</span>
            </button>
            <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 text-bp-text-secondary pointer-events-none transition-transform duration-200 ${showStatusFilter ? "rotate-180" : ""}`} />
            {showStatusFilter && (
              <div className="absolute top-full left-0 mt-2 min-w-full bg-bp-card border border-bp-border/60 rounded-xl shadow-2xl z-30 p-1.5">
                {[
                  { value: "all", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Disabled" },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => { setStatusFilter(s.value); setShowStatusFilter(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 transition-colors duration-150 ${statusFilter === s.value ? "bg-bp-blue/15 text-bp-blue" : "text-white hover:bg-bp-blue/10"}`}
                  >
                    <span className="font-medium flex-1">{s.label}</span>
                    {statusFilter === s.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-bp-card border border-bp-border rounded-2xl overflow-hidden shadow-xl">
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
              <div className="py-12 text-center text-bp-text-muted">
                No users found
              </div>
            }
            progressComponent={
              <div className="py-12 text-center text-bp-text-muted">
                Loading users...
              </div>
            }
          />
        </div>

      {/* ==================== VIEW EMPLOYEE MODAL ==================== */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-bp-card border border-bp-border rounded-2xl shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => { setShowViewModal(false); setSelectedUser(null); }}
              className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-bp-elevated/60 border border-bp-border/50 text-bp-text-secondary hover:text-white hover:bg-bp-elevated hover:border-bp-border transition-all duration-200"
            >
              <X size={18} />
            </button>

            {/* Top accent glow */}
            <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-bp-blue/30 to-transparent" />

            <div className="p-8">
              {/* Avatar + Identity */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="relative mb-5">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, rgba(0,140,255,0.12), rgba(0,217,255,0.08))", border: "2px solid rgba(0,140,255,0.25)" }}>
                    {selectedUser.profilePhoto ? (
                      <img src={selectedUser.profilePhoto} alt={selectedUser.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-bp-blue">{selectedUser.name?.charAt(0)?.toUpperCase()}</span>
                    )}
</div>
                </div>

                <h3 className="text-xl font-bold text-bp-text">{selectedUser.name}</h3>
                <p className="text-sm text-bp-text-muted mt-1">{selectedUser.email}</p>

                <div className="flex items-center gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-bp-blue/12 text-bp-blue border border-bp-blue/15">
                    <Shield size={12} /> {selectedUser.role}
                  </span>
                  {selectedUser.isActive !== false ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/12 text-emerald-400 border border-emerald-500/15">
                      <CheckCircle2 size={12} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/12 text-red-400 border border-red-500/15">
                      <XCircle size={12} /> Disabled
                    </span>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {[
                  { icon: Phone, label: "Contact Number", value: selectedUser.contactNumber || "\u2014" },
                  { icon: Phone, label: "Country Code", value: selectedUser.countryCode || "\u2014" },
                  { icon: Calendar, label: "Date of Joining", value: selectedUser.dateOfJoining ? new Date(selectedUser.dateOfJoining).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "\u2014" },
                  { icon: Briefcase, label: "Experience", value: selectedUser.experienceYears ? `${selectedUser.experienceYears} Years` : "\u2014" },
                  { icon: Shield, label: "Status", value: selectedUser.isActive !== false ? "Active" : "Disabled", color: selectedUser.isActive !== false ? "text-emerald-400" : "text-red-400" },
                  { icon: Calendar, label: "Account Created", value: selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "\u2014" },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl bg-bp-surface/60 border border-bp-border/50 transition-colors duration-200 hover:bg-bp-surface hover:border-bp-border">
                    <div className="flex items-center gap-2 text-bp-text-muted text-xs font-medium mb-2 uppercase tracking-wider">
                      <item.icon size={13} /> {item.label}
                    </div>
                    <p className={`text-sm font-semibold ${item.color || "text-bp-text"}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Close */}
              <button
                onClick={() => { setShowViewModal(false); setSelectedUser(null); }}
                className="w-full py-3 rounded-xl text-sm font-semibold text-bp-text-secondary bg-bp-elevated border border-bp-border hover:bg-bp-elevated/80 hover:text-bp-text hover:border-bp-border/80 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
{/* ==================== ADD EMPLOYEE MODAL ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto dropdown-scroll bg-bp-card border border-bp-border rounded-2xl shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-bp-elevated/60 border border-bp-border/50 text-bp-text-secondary hover:text-white hover:bg-bp-elevated hover:border-bp-border transition-all duration-200"
            >
              <X size={18} />
            </button>

            {/* Top accent glow */}
            <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-bp-blue/30 to-transparent" />

            <div className="p-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              autoComplete="off"
            >
              {/* Header + Photo (single row, no scroll) */}
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(0,140,255,0.12), rgba(0,217,255,0.08))", border: "2px solid rgba(0,140,255,0.25)" }}>
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-bp-text-muted" />
                    )}
                  </div>
                  <label className="absolute -bottom-0.5 -right-0.5 bg-bp-blue hover:bg-[#0095ff] text-white p-1.5 rounded-full cursor-pointer border-[3px] border-bp-card shadow-lg transition-colors duration-200">
                    <Camera size={12} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-bp-text">Add New Employee</h2>
                  <p className="text-sm text-bp-text-muted mt-1">Create a new team member account <span className="text-bp-text-muted/70">• Max 5MB photo</span></p>
                </div>
              </div>

              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="w-full pl-9 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="off"
                        placeholder="employee@gmail.com"
                      className="w-full pl-9 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Contact + Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">
                    Contact Number
                  </label>
                  <div className="relative flex">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountryList(!showCountryList)}
                        className="h-full flex items-center gap-1 px-3 py-2.5 bg-bp-surface/60 border border-bp-border/50 border-r-0 rounded-l-xl text-white text-sm min-w-[85px] hover:border-bp-border transition-colors duration-200"
                      >
                        {selectedCountry.dial}
                        <ChevronDown size={14} className="text-bp-text-secondary" />
                      </button>
                      {showCountryList && (
                        <div className="absolute top-full left-0 mt-2 w-64 max-h-56 overflow-y-auto dropdown-scroll bg-bp-card border border-bp-border/60 rounded-xl shadow-2xl z-50 p-1.5">
                          <div className="sticky top-0 pb-1.5 bg-bp-card">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-bp-text-muted w-3.5 h-3.5" />
                              <input
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Search country..."
                                className="w-full pl-8 pr-2 py-2 bg-bp-surface/60 border border-bp-border/50 text-white text-sm rounded-lg outline-none focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 placeholder:text-bp-text-muted transition-colors duration-200"
                                autoFocus
                              />
                            </div>
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
                              className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between gap-2 transition-colors duration-150 ${selectedCountry.code === c.code ? "bg-bp-blue/15 text-bp-blue" : "text-white hover:bg-bp-blue/10"}`}
                            >
                              <span className="truncate">{c.name}</span>
                              <span className="flex items-center gap-1.5 shrink-0">
                                <span className={selectedCountry.code === c.code ? "text-bp-blue/80" : "text-bp-text-secondary"}>{c.dial}</span>
                                {selectedCountry.code === c.code && <Check size={14} />}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
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
                        className="w-full pl-9 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-r-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">
                    Date of Joining
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => (showCalendar ? setShowCalendar(false) : openCalendar())}
                      className="w-full pl-9 pr-10 py-2.5 bg-bp-surface/60 border border-bp-border/50 rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200 flex items-center"
                    >
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4 pointer-events-none" />
                      <span className={selectedDate ? "text-white font-medium" : "text-bp-text-muted"}>
                        {selectedDate ? `${String(selectedDate.d).padStart(2, "0")} ${monthNames[selectedDate.m].slice(0, 3)} ${selectedDate.y}` : "Select date"}
                      </span>
                    </button>
                    <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 text-bp-text-secondary pointer-events-none transition-transform duration-200 ${showCalendar ? "rotate-180" : ""}`} />
                    {showCalendar && (
                      <div className="absolute top-full left-0 mt-2 w-72 bg-bp-card border border-bp-border/60 rounded-xl shadow-2xl z-50 p-3">
                        {/* Month nav */}
                        <div className="flex items-center justify-between mb-2">
                          <button type="button" onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg text-bp-text-secondary hover:text-white hover:bg-bp-blue/10 transition-colors duration-150">
                            <ChevronLeft size={16} />
                          </button>
                          <span className="text-sm font-semibold text-bp-text">{monthNames[calMonth]} {calYear}</span>
                          <button type="button" onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg text-bp-text-secondary hover:text-white hover:bg-bp-blue/10 transition-colors duration-150">
                            <ChevronRight size={16} />
                          </button>
                        </div>
                        {/* Weekdays */}
                        <div className="grid grid-cols-7 gap-1 mb-1">
                          {weekDays.map((w) => (
                            <span key={w} className="h-7 flex items-center justify-center text-[11px] font-semibold text-bp-text-muted uppercase">{w}</span>
                          ))}
                        </div>
                        {/* Days */}
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: calFirstDay }).map((_, i) => (
                            <span key={`blank-${i}`} className="h-8" />
                          ))}
                          {Array.from({ length: calDaysInMonth }).map((_, i) => {
                            const d = i + 1;
                            const isSelected = selectedDate && selectedDate.y === calYear && selectedDate.m === calMonth && selectedDate.d === d;
                            const isToday = realToday.getFullYear() === calYear && realToday.getMonth() === calMonth && realToday.getDate() === d;
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => pickDate(d)}
                                className={`h-8 rounded-lg text-xs transition-colors duration-150 ${isSelected ? "bg-bp-blue text-white font-bold shadow-lg shadow-bp-blue/30" : isToday ? "text-bp-blue font-semibold border border-bp-blue/40 hover:bg-bp-blue/10" : "text-bp-text hover:bg-bp-blue/10"}`}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>
                        {/* Footer */}
                        <button
                          type="button"
                          onClick={() => {
                            const t = new Date();
                            setCalYear(t.getFullYear());
                            setCalMonth(t.getMonth());
                            pickDate(t.getDate());
                          }}
                          className="w-full mt-2 py-1.5 rounded-lg text-xs font-semibold text-bp-blue bg-bp-blue/10 hover:bg-bp-blue/20 transition-colors duration-150"
                        >
                          Today
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Experience + Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">
                    Experience (Years)
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4 pointer-events-none" />
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
                      className="w-full pl-9 pr-24 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => stepExperience(-1)}
                        disabled={Number.isNaN(expNum) || expNum <= 0}
                        className="p-1.5 rounded-lg bg-bp-elevated border border-bp-border/50 text-bp-text-secondary hover:text-white hover:border-bp-blue/40 hover:bg-bp-blue/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-bp-border/50 disabled:hover:bg-bp-elevated transition-all duration-150"
                      >
                        <Minus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => stepExperience(1)}
                        disabled={!Number.isNaN(expNum) && expNum >= 50}
                        className="p-1.5 rounded-lg bg-bp-elevated border border-bp-border/50 text-bp-text-secondary hover:text-white hover:border-bp-blue/40 hover:bg-bp-blue/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-bp-border/50 disabled:hover:bg-bp-elevated transition-all duration-150"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">Role</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowRoleList(!showRoleList)}
                      className="w-full pl-9 pr-10 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200 flex items-center gap-2"
                    >
                      <BriefcaseBusiness className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4 pointer-events-none" />
                      <span className={`w-2 h-2 rounded-full shrink-0 ${selectedRole.dot}`} />
                      <span className="font-medium">{selectedRole.label}</span>
                    </button>
                    <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 text-bp-text-secondary pointer-events-none transition-transform duration-200 ${showRoleList ? "rotate-180" : ""}`} />
                    {showRoleList && (
                      <div className="absolute top-full left-0 right-0 mt-2 overflow-y-auto dropdown-scroll bg-bp-card border border-bp-border/60 rounded-xl shadow-2xl z-50 p-1.5">
                        {roles.map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => {
                              handleChange({ target: { name: "role", value: r.value } });
                              setShowRoleList(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 transition-colors duration-150 ${formData.role === r.value ? "bg-bp-blue/15 text-bp-blue" : "text-white hover:bg-bp-blue/10"}`}
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${r.dot}`} />
                            <span className="font-medium flex-1">{r.label}</span>
                            {formData.role === r.value && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Password + Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onCopy={preventCopyPaste}
                        onPaste={preventCopyPaste}
                        required
                        autoComplete="new-password"
                        placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bp-text-muted"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-bp-text-secondary">Password Strength</span>
                        <span
                          className={`font-medium ${
                            getPasswordStrength(formData.password).label ===
                            "Weak"
                              ? "text-red-400"
                              : getPasswordStrength(formData.password).label ===
                                "Medium"
                              ? "text-bp-yellow"
                              : "text-emerald-400"
                          }`}
                        >
                          {getPasswordStrength(formData.password).label}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-bp-border rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            getPasswordStrength(formData.password).color
                          }`}
                          style={{
                            width: getPasswordStrength(formData.password).width,
                          }}
                        />
                      </div>
                      <p className="text-xs text-bp-text-muted mt-1.5">
                        Must contain: 8+ chars, uppercase, lowercase, number &
                        special character
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-bp-text-secondary uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted w-4 h-4" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onCopy={preventCopyPaste}
                        onPaste={preventCopyPaste}
                        required
                        autoComplete="new-password"
                        placeholder="••••••••"
                      className="w-full pl-9 py-2.5 bg-bp-surface/60 border border-bp-border/50 text-white rounded-xl text-sm focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border outline-none transition-colors duration-200"
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
                  className="flex-1 py-2.5 bg-bp-elevated hover:bg-bp-elevated/80 text-bp-text-secondary hover:text-bp-text border border-bp-border hover:border-bp-border/80 rounded-xl text-sm font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
                {hasFeature("canCreateEmployee") && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-bp-blue hover:bg-[#0095ff] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-lg shadow-bp-blue/20 transition-all duration-200"
                  >
                    {isSubmitting ? "Creating..." : "Create Employee"}
                  </button>
                )}
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}