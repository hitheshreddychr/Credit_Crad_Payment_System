
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import StatCard from "../components/StatCard";
import {
  exportAnalyticsCSV,
  exportAnalyticsPDF,
  getAdminAnalytics,
  getAdminSummary,
  getAdminSystemHealth,
  getAdminTransactions,
  getAdminUsers,
  updateUserStatus,
} from "../services/adminService";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const number = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

const getRows = (data) =>
  Array.isArray(data) ? data : data?.results || [];

const getError = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong.";

const downloadBlob = (data, filename, type) => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

function Panel({ title, subtitle, children, action }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function HorizontalBars({ items, labelKey, valueKey, format = money }) {
  const max = Math.max(
    1,
    ...items.map((item) => Number(item[valueKey] || 0)),
  );

  if (!items.length) {
    return <p className="py-6 text-sm text-slate-500">No chart data available for this period.</p>;
  }

  return (
    <div className="space-y-5">
      {items.map((item, index) => {
        const value = Number(item[valueKey] || 0);
        const width = Math.max(0, Math.min(100, (value / max) * 100));

        return (
          <div key={`${item[labelKey]}-${index}`}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-slate-700">
                {item[labelKey] || "Other"}
              </span>
              <span className="font-bold text-slate-900">{format(value)}</span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-slate-100"
              role="img"
              aria-label={`${item[labelKey]}: ${format(value)}`}
            >
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [transactionCount, setTransactionCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    status: "",
    min_amount: "",
    max_amount: "",
    card_number: "",
    ordering: "-created_at",
  });

  const filterParams = useCallback(() => {
    const params = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "") params[key] = value;
    });

    return params;
  }, [filters]);

  const loadUsers = useCallback(async (searchValue = userSearch) => {
    try {
      const response = await getAdminUsers(searchValue);
      setUsers(getRows(response.data));
    } catch (requestError) {
      setError(`Could not load users: ${getError(requestError)}`);
    }
  }, [userSearch]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = {
      ...filterParams(),
      page,
      page_size: pageSize,
    };

    const results = await Promise.allSettled([
      getAdminSummary(),
      getAdminAnalytics(filterParams()),
      getAdminTransactions(params),
      getAdminSystemHealth(),
      getAdminUsers(userSearch),
    ]);

    const messages = [];

    if (results[0].status === "fulfilled") {
      setSummary(results[0].value.data);
    } else {
      messages.push(`Summary: ${getError(results[0].reason)}`);
    }

    if (results[1].status === "fulfilled") {
      setAnalytics(results[1].value.data);
    } else {
      messages.push(`Analytics: ${getError(results[1].reason)}`);
    }

    if (results[2].status === "fulfilled") {
      const data = results[2].value.data;
      setTransactions(getRows(data));
      setTransactionCount(
        Number(data?.count ?? getRows(data).length),
      );
    } else {
      messages.push(`Transactions: ${getError(results[2].reason)}`);
    }

    if (results[3].status === "fulfilled") {
      setHealth(results[3].value.data);
    } else {
      messages.push(`System health: ${getError(results[3].reason)}`);
    }

    if (results[4].status === "fulfilled") {
      setUsers(getRows(results[4].value.data));
    } else {
      messages.push(`Users: ${getError(results[4].reason)}`);
    }

    setError(messages.join(" | "));
    setLoading(false);
  }, [filterParams, page, pageSize, userSearch]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const changeFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      start_date: "",
      end_date: "",
      status: "",
      min_amount: "",
      max_amount: "",
      card_number: "",
      ordering: "-created_at",
    });
    setPage(1);
  };

  const searchUsers = async () => {
    setError("");
    try {
      const response = await getAdminUsers(userSearch);
      setUsers(getRows(response.data));
    } catch (requestError) {
      setError(`User search failed: ${getError(requestError)}`);
    }
  };

  const toggleUserStatus = async (user) => {
    setError("");
    setNotice("");

    try {
      await updateUserStatus(user.id, !user.is_active);
      setNotice(`User ${user.username} updated successfully.`);
      await loadUsers();
    } catch (requestError) {
      setError(`Could not update user: ${getError(requestError)}`);
    }
  };

  const runExport = async (kind) => {
    setExporting(kind);
    setError("");
    setNotice("");

    try {
      const params = filterParams();

      if (kind === "csv") {
        const response = await exportAnalyticsCSV(params);
        downloadBlob(response.data, "assessment24_analytics.csv", "text/csv");
      } else if (kind === "pdf") {
        const response = await exportAnalyticsPDF(params);
        downloadBlob(response.data, "assessment24_analytics.pdf", "application/pdf");
      }

      setNotice(`${kind.toUpperCase()} export downloaded successfully.`);
    } catch (requestError) {
      setError(`Export failed: ${getError(requestError)}`);
    } finally {
      setExporting("");
    }
  };

  const maxPages = Math.max(1, Math.ceil(transactionCount / pageSize));
  const monthlySpending = analytics?.monthly_spending || [];
  const categorySpending = analytics?.category_spending || [];
  const utilization = Math.min(
    100,
    Math.max(0, Number(analytics?.credit_utilization_percent || 0)),
  );

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-purple-600">ADMINISTRATION · ASSESSMENT 24</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor payments, fraud alerts, users, analytics, and system health.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white disabled:opacity-60"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh dashboard
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {notice}
        </div>
      )}

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Transactions" value={number(summary.total_transactions)} icon={Activity} />
          <StatCard title="Successful" value={number(summary.successful_payments)} icon={CheckCircle2} iconClass="bg-green-50 text-green-600" />
          <StatCard title="Failed" value={number(summary.failed_payments)} icon={XCircle} iconClass="bg-red-50 text-red-600" />
          <StatCard title="Pending" value={number(summary.pending_payments)} icon={Clock3} iconClass="bg-yellow-50 text-yellow-600" />
          <StatCard title="Successful Amount" value={money(summary.total_successful_amount)} icon={BarChart3} iconClass="bg-purple-50 text-purple-600" />
        </div>
      )}

      <Panel
        title="System Health"
        subtitle="Current backend database and transaction health indicators."
        action={
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
            health?.database_connected
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
            {health ? (health.database_connected ? "DATABASE CONNECTED" : "DATABASE ISSUE") : "CHECKING"}
          </span>
        }
      >
        {health ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <Activity className="mb-3 text-blue-600" size={22} />
              <p className="text-sm text-slate-500">Recent transactions</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {number(health.recent_transactions ?? health.transaction_count)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <XCircle className="mb-3 text-red-600" size={22} />
              <p className="text-sm text-slate-500">Recent failures</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {number(health.recent_failures ?? health.failed_transactions)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <AlertTriangle className="mb-3 text-amber-600" size={22} />
              <p className="text-sm text-slate-500">Suspicious transactions</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {number(health.suspicious_transactions ?? health.recent_suspicious_transactions)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <ShieldCheck className="mb-3 text-purple-600" size={22} />
              <p className="text-sm text-slate-500">Admin audit logs</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {number(health.admin_logs ?? health.recent_admin_logs)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Health metrics are unavailable. Check the administrator API permissions.
          </p>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Monthly Spending" subtitle="Successful spending grouped by month.">
          <HorizontalBars
            items={monthlySpending}
            labelKey="month"
            valueKey="amount"
          />
        </Panel>

        <Panel title="Spending by Category" subtitle="Category totals inferred from transaction descriptions.">
          <HorizontalBars
            items={categorySpending}
            labelKey="category"
            valueKey="amount"
          />
        </Panel>
      </div>

      <Panel title="Credit Utilization" subtitle="Approximate utilization calculated by the analytics API.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-4xl font-extrabold text-slate-900">
              {utilization.toFixed(2)}%
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Total active credit limit: {money(analytics?.credit_limit_total)}
            </p>
          </div>
          <div className="w-full sm:max-w-md">
            <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">
              <span>Used</span>
              <span>100%</span>
            </div>
            <div
              className="h-4 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label="Credit utilization"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={utilization}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  utilization >= 80 ? "bg-red-500" : utilization >= 50 ? "bg-amber-500" : "bg-green-500"
                }`}
                style={{ width: `${utilization}%` }}
              />
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Analytics Export" subtitle="Export analytics using the selected date and transaction filters.">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => runExport("csv")}
            disabled={Boolean(exporting)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            <Download size={17} />
            {exporting === "csv" ? "Preparing CSV..." : "Export Analytics CSV"}
          </button>
          <button
            type="button"
            onClick={() => runExport("pdf")}
            disabled={Boolean(exporting)}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            <FileText size={17} />
            {exporting === "pdf" ? "Preparing PDF..." : "Export Analytics PDF"}
          </button>
        </div>
      </Panel>

      <Panel title="Registered Users" subtitle="Search users and manage account activation.">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 px-4">
            <Search size={18} className="text-slate-400" />
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") searchUsers();
              }}
              placeholder="Search username, email, or phone"
              aria-label="Search users"
              className="w-full border-0 py-3 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={searchUsers}
            className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white"
          >
            Search users
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                {["ID", "Username", "Email", "Role", "Status", "Action"].map((label) => (
                  <th key={label} className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase text-slate-500">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-4 font-semibold">{user.id}</td>
                  <td className="px-4 py-4">{user.username}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">{user.email || "-"}</td>
                  <td className="px-4 py-4 text-sm font-bold">
                    {user.role || (user.is_superuser || user.is_admin || user.is_staff ? "ADMIN" : "READ_ONLY")}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {user.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => toggleUserStatus(user)}
                      className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                      disabled={loading}
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Transaction Search"
        subtitle="Filter and page through transactions using server-side query parameters."
        action={
          <span className="text-sm font-semibold text-slate-500">
            {number(transactionCount)} records
          </span>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-semibold text-slate-600">
            Start date
            <input
              type="date"
              value={filters.start_date}
              onChange={(event) => changeFilter("start_date", event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 p-3"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            End date
            <input
              type="date"
              value={filters.end_date}
              onChange={(event) => changeFilter("end_date", event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 p-3"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Status
            <select
              value={filters.status}
              onChange={(event) => changeFilter("status", event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 p-3"
            >
              <option value="">All statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Sort by
            <select
              value={filters.ordering}
              onChange={(event) => changeFilter("ordering", event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 p-3"
            >
              <option value="-created_at">Newest first</option>
              <option value="created_at">Oldest first</option>
              <option value="-amount">Amount: high to low</option>
              <option value="amount">Amount: low to high</option>
              <option value="status">Status</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Minimum amount
            <input
              type="number"
              min="0"
              value={filters.min_amount}
              onChange={(event) => changeFilter("min_amount", event.target.value)}
              placeholder="0.00"
              className="mt-2 w-full rounded-lg border border-slate-200 p-3"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Maximum amount
            <input
              type="number"
              min="0"
              value={filters.max_amount}
              onChange={(event) => changeFilter("max_amount", event.target.value)}
              placeholder="10000.00"
              className="mt-2 w-full rounded-lg border border-slate-200 p-3"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 sm:col-span-2">
            Card number (full or partial)
            <input
              value={filters.card_number}
              onChange={(event) => changeFilter("card_number", event.target.value)}
              placeholder="Enter masked card digits"
              className="mt-2 w-full rounded-lg border border-slate-200 p-3"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setPage(1);
              loadDashboard();
            }}
            className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700"
          >
            Clear filters
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Transaction", "User", "Amount", "Status", "Fraud", "Date"].map((label) => (
                  <th key={label} className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase text-slate-500">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((transaction) => (
                <tr key={transaction.id || transaction.transaction_id}>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-bold">
                    {transaction.transaction_id || transaction.id}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {transaction.username || transaction.user?.username || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold">
                    {transaction.currency || "INR"} {number(transaction.amount)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      transaction.status === "SUCCESS"
                        ? "bg-green-100 text-green-700"
                        : transaction.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {transaction.is_suspicious ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700" title={transaction.fraud_reason || "Suspicious transaction"}>
                        <AlertTriangle size={13} /> Flagged
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">No flag</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                    {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
              {!transactions.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    No transactions match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Rows per page
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 p-2"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-slate-600">
              Page {page} of {maxPages}
            </span>
            <button
              type="button"
              disabled={page >= maxPages}
              onClick={() => setPage((current) => Math.min(maxPages, current + 1))}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </Panel>

      {loading && (
        <div role="status" className="fixed bottom-5 right-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl">
          Loading dashboard...
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
