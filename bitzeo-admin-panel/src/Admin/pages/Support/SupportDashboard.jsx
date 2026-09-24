import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import {
  Shield,
  Users,
  MessageSquare,
  Trash2,
  Clock,
  Inbox,
  BarChart3,
  UserPlus,
} from "lucide-react";
import tableCustomStyles from "../../../utils/tableStyles";
import useDashboardData from "../../../hooks/useDashboardData";
import useSupportEmployees from "../../../hooks/useSupportEmployees";
import { fetchContactRequests, fetchDeletionRequests } from "../../../api";
import CopyrightDashboard from "../Copyright/CopyrightDashboard";
import ContactRequestList from "./ContactRequestList";
import DeletionRequestList from "./DeletionRequestList";
import PageHeader from "../../../components/layout/PageHeader";
import { getCurrentRole, hasFeature } from "../../../config/roleConfig";

const StatCard = ({ title, value, icon: Icon, color, bg, onClick }) => (
  <div
    className={`stat-card ${onClick ? "cursor-pointer hover:bg-bp-elevated transition-colors" : ""}`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-bp-text-secondary font-medium">{title}</p>
        <p className="text-2xl font-bold text-bp-text mt-1">{value}</p>
      </div>
      <div className={`p-2.5 rounded-lg ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </div>
);

function OverviewPanel() {
  const navigate = useNavigate();
  const { data } = useDashboardData();
  const { employees, loading: employeesLoading } = useSupportEmployees();

  const [activeUsers, setActiveUsers] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [pendingContactCount, setPendingContactCount] = useState(0);
  const [deletionCount, setDeletionCount] = useState(0);
  const [pendingDeletionCount, setPendingDeletionCount] = useState(0);
  const [unassignedContact, setUnassignedContact] = useState(0);
  const [unassignedDeletion, setUnassignedDeletion] = useState(0);
  const [loads, setLoads] = useState([]);

  const fetchCounts = async () => {
    const [c, d, pc, pd] = await Promise.allSettled([
      fetchContactRequests({ page: 1, limit: 1 }),
      fetchDeletionRequests({ page: 1, limit: 1 }),
      fetchContactRequests({ status: "pending", page: 1, limit: 1 }),
      fetchDeletionRequests({ status: "pending", page: 1, limit: 1 }),
    ]);
    if (c.status === "fulfilled")
      setContactCount(c.value.data?.pagination?.total || 0);
    if (d.status === "fulfilled")
      setDeletionCount(d.value.data?.pagination?.total || 0);
    if (pc.status === "fulfilled")
      setPendingContactCount(pc.value.data?.pagination?.total || 0);
    if (pd.status === "fulfilled")
      setPendingDeletionCount(pd.value.data?.pagination?.total || 0);
  };

  const fetchLoads = async () => {
    const results = await Promise.allSettled(
      employees
        .flatMap((employee) => [
          fetchContactRequests({ assignedTo: employee.id, page: 1, limit: 1 }),
          fetchDeletionRequests({ assignedTo: employee.id, page: 1, limit: 1 }),
        ])
        .concat([
          fetchContactRequests({ assignedTo: "unassigned", page: 1, limit: 1 }),
          fetchDeletionRequests({ assignedTo: "unassigned", page: 1, limit: 1 }),
        ])
    );

    const rows = employees.map((employee, index) => {
      const contacts =
        results[index * 2]?.status === "fulfilled"
          ? results[index * 2].value.data?.pagination?.total || 0
          : 0;
      const deletions =
        results[index * 2 + 1]?.status === "fulfilled"
          ? results[index * 2 + 1].value.data?.pagination?.total || 0
          : 0;
      return {
        id: employee.id,
        name: employee.name,
        contacts,
        deletions,
        total: contacts + deletions,
      };
    });

    const base = results.length - 2;
    setUnassignedContact(
      results[base]?.status === "fulfilled"
        ? results[base].value.data?.pagination?.total || 0
        : 0
    );
    setUnassignedDeletion(
      results[base + 1]?.status === "fulfilled"
        ? results[base + 1].value.data?.pagination?.total || 0
        : 0
    );
    setLoads(rows);
  };

  useEffect(() => {
    if (data?.stats) setActiveUsers(data.stats.activeUsers || 0);
  }, [data]);

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    if (!employeesLoading) fetchLoads();
  }, [employees, employeesLoading]);

  let adminUser = null;
  try {
    adminUser = JSON.parse(localStorage.getItem("adminUser") || "null");
  } catch {
    adminUser = null;
  }

  const tableRows = [
    ...loads,
    ...(!employeesLoading &&
    (unassignedContact > 0 || unassignedDeletion > 0)
      ? [
          {
            id: "unassigned",
            name: "Unassigned",
            isUnassigned: true,
            contacts: unassignedContact,
            deletions: unassignedDeletion,
            total: unassignedContact + unassignedDeletion,
          },
        ]
      : []),
  ];

  const columns = [
    {
      name: "Sr. No.",
      width: "80px",
      selector: (row, index) => index + 1,
    },
    {
      name: "Support Employee",
      minWidth: "220px",
      grow: 2,
      cell: (row) => (
        <p className="text-sm font-medium text-white">
          {row.name}
          {!row.isUnassigned &&
            String(adminUser?.id) === String(row.id) && (
              <span className="ml-2 px-2 py-0.5 text-[11px] font-medium bg-bp-blue/15 text-bp-blue rounded-full">
                You
              </span>
            )}
        </p>
      ),
    },
    {
      name: "Contacts",
      width: "120px",
      selector: (row) => row.contacts,
    },
    {
      name: "Deletions",
      width: "120px",
      selector: (row) => row.deletions,
    },
    {
      name: "Total",
      width: "100px",
      cell: (row) => (
        <span className="text-sm font-semibold text-bp-text">{row.total}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Active Users"
          value={activeUsers.toLocaleString()}
          icon={Users}
          color="text-bp-blue"
          bg="bg-bp-blue/10"
          onClick={() => navigate("/alluser")}
        />
        <StatCard
          title="Contact Requests"
          value={contactCount}
          icon={MessageSquare}
          color="text-bp-cyan"
          bg="bg-bp-cyan/10"
          onClick={() => navigate("/support/contact")}
        />
        <StatCard
          title="Pending Contacts"
          value={pendingContactCount}
          icon={Clock}
          color="text-bp-yellow"
          bg="bg-bp-yellow/10"
          onClick={() => navigate("/support/contact?status=pending")}
        />
        <StatCard
          title="Deletion Requests"
          value={deletionCount}
          icon={Trash2}
          color="text-red-500"
          bg="bg-red-500/10"
          onClick={() => navigate("/support/deletion")}
        />
        <StatCard
          title="Pending Deletions"
          value={pendingDeletionCount}
          icon={Clock}
          color="text-bp-yellow"
          bg="bg-bp-yellow/10"
          onClick={() => navigate("/support/deletion?status=pending")}
        />
        <StatCard
          title="Unassigned Tickets"
          value={unassignedContact + unassignedDeletion}
          icon={Inbox}
          color="text-purple-400"
          bg="bg-purple-400/10"
          onClick={() => navigate("/support/contact?assignedTo=unassigned")}
        />
      </div>

      <div className="bp-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-bp-text">
              Tickets per Support Employee
            </h2>
            <p className="text-xs text-bp-text-muted mt-0.5">
              Auto-assigned equally (round-robin) across active support
              employees
            </p>
          </div>
          {!employeesLoading && employees.length === 0 && hasFeature("canCreateEmployee") && (
            <button
              onClick={() => navigate("/create-employee")}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-bp-blue/10 text-bp-blue rounded-lg hover:bg-bp-blue/20 transition-colors"
            >
              <UserPlus size={14} />
              Add support employee
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={tableRows}
          customStyles={tableCustomStyles}
          progressPending={employeesLoading}
          progressComponent={
            <div className="py-12 text-center text-sm text-bp-text-secondary">
              Loading support employees...
            </div>
          }
          noDataComponent={
            <div className="py-12 text-center text-sm text-bp-text-muted">
              No support employees yet. Create support-role employees to begin
              auto-assignment.
            </div>
          }
          highlightOnHover
          conditionalRowStyles={[
            {
              when: (row) => row.isUnassigned,
              style: {
                backgroundColor: "var(--bp-surface)",
                fontWeight: 600,
              },
            },
          ]}
        />
      </div>
    </div>
  );
}

const ALL_TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "copyright", label: "Copyright Issues", icon: Shield },
  { key: "contact", label: "General Queries", icon: MessageSquare },
  { key: "deletion", label: "Deletions Requests", icon: Trash2 },
];

export default function SupportDashboard() {
  const role = getCurrentRole();
  const [searchParams, setSearchParams] = useSearchParams();

  const canManageTickets = role === "admin" || role === "support";
  // Admin's Overview sidebar page shows only the overview panel (flat layout,
  // the other sections are separate sidebar pages). Finance / read-only keep
  // the legacy tabbed page.
  let visibleTabs = [ALL_TABS[0]];
  if (canManageTickets) {
    visibleTabs = role === "support" ? [ALL_TABS[0]] : ALL_TABS;
  }
  if (role === "admin") visibleTabs = [ALL_TABS[0]];

  const showTabs = role === "finance" || role === "read-only";

  const requested = searchParams.get("tab");
  const activeTab = visibleTabs.some((tab) => tab.key === requested)
    ? requested
    : visibleTabs[0].key;

  const handleTab = (key) => {
    setSearchParams(key === "overview" ? {} : { tab: key }, { replace: true });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Support Management"
        subtitle="Support employees, tickets, copyright, and deletion management"
      />

      {showTabs && (
        <div className="bg-bp-card rounded-2xl p-1 flex gap-1 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  isActive
                    ? "bg-bp-blue text-white"
                    : "text-bp-text-secondary hover:text-bp-text hover:bg-bp-elevated/50"
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === "overview" && <OverviewPanel />}
      {activeTab === "copyright" && <CopyrightDashboard hideHeader />}
      {activeTab === "contact" && <ContactRequestList hideHeader />}
      {activeTab === "deletion" && <DeletionRequestList hideHeader />}
    </div>
  );
}