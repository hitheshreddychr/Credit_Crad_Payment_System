import { useEffect, useState } from "react";
import {
  Users,
  ReceiptText,
  CheckCircle2,
  XCircle,
  Clock3,
  Download,
  Search,
} from "lucide-react";
import api from "../api";
import StatCard from "../components/StatCard";

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);

    try {
      const [
        summaryResponse,
        usersResponse,
        transactionsResponse,
      ] = await Promise.all([
        api.get("/api/payments/admin/summary/"),
        api.get("/api/admin/users/"),
        api.get(
          "/api/payments/admin/transactions/"
        ),
      ]);

      setSummary(summaryResponse.data);

      const usersData = usersResponse.data;

      setUsers(
        Array.isArray(usersData)
          ? usersData
          : usersData.results || []
      );

      const transactionData =
        transactionsResponse.data;

      setTransactions(
        Array.isArray(transactionData)
          ? transactionData
          : transactionData.results || []
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const searchUsers = async () => {
    const response = await api.get(
      "/api/admin/users/",
      {
        params: search
          ? { search }
          : {},
      }
    );

    const data = response.data;

    setUsers(
      Array.isArray(data)
        ? data
        : data.results || []
    );
  };

  const updateStatus = async (
    id,
    isActive
  ) => {
    await api.patch(
      `/api/admin/users/${id}/`,
      {
        is_active: isActive,
      }
    );

    load();
  };

  const exportCsv = async () => {
    const response = await api.get(
      "/api/payments/admin/transactions/export/",
      {
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(
      new Blob([response.data], {
        type: "text/csv",
      })
    );

    const link = document.createElement("a");

    link.href = url;
    link.download = "admin_transactions.csv";
    link.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-purple-600">
            ADMINISTRATION
          </p>

          <h1 className="mt-1 text-3xl font-extrabold">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-slate-400">
            Monitor users, payments, and transactions.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {summary && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Transactions"
            value={
              summary.total_transactions ?? 0
            }
            icon={ReceiptText}
          />

          <StatCard
            title="Successful"
            value={
              summary.successful_payments ?? 0
            }
            icon={CheckCircle2}
            iconClass="bg-green-50 text-green-600"
          />

          <StatCard
            title="Failed"
            value={
              summary.failed_payments ?? 0
            }
            icon={XCircle}
            iconClass="bg-red-50 text-red-600"
          />

          <StatCard
            title="Pending"
            value={
              summary.pending_payments ?? 0
            }
            icon={Clock3}
            iconClass="bg-yellow-50 text-yellow-600"
          />

          <StatCard
            title="Successful Amount"
            value={`₹${
              summary.total_successful_amount ||
              "0.00"
            }`}
            icon={Users}
            iconClass="bg-purple-50 text-purple-600"
          />
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex gap-3">
          <div className="flex flex-1 items-center gap-3 rounded-xl bg-slate-50 px-4">
            <Search
              size={18}
              className="text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchUsers();
                }
              }}
              placeholder="Search users..."
              className="w-full bg-transparent py-3 outline-none"
            />
          </div>

          <button
            onClick={searchUsers}
            className="rounded-xl bg-blue-600 px-6 font-bold text-white"
          >
            Search
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-extrabold">
            Registered Users
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Manage account activation.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400">
                  ID
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400">
                  Username
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400">
                  Email
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {users.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 font-bold">
                    {item.id}
                  </td>

                  <td className="px-6 py-4">
                    {item.username}
                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {item.email}
                  </td>

                  <td className="px-6 py-4">
                    {item.is_admin || item.is_staff
                      ? "ADMIN"
                      : "USER"}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.is_active
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        updateStatus(
                          item.id,
                          !item.is_active
                        )
                      }
                      className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                    >
                      {item.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-extrabold">
            All Transactions
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400">
                  Transaction
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400">
                  Amount
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {transactions.map((item) => (
                <tr
                  key={
                    item.id ||
                    item.transaction_id
                  }
                >
                  <td className="px-6 py-4 font-bold">
                    {item.transaction_id}
                  </td>

                  <td className="px-6 py-4">
                    {item.username ||
                      item.user?.username ||
                      "-"}
                  </td>

                  <td className="px-6 py-4">
                    {item.currency} {item.amount}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.status === "SUCCESS"
                          ? "bg-green-100 text-green-700"
                          : item.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-400">
                    {item.created_at
                      ? new Date(
                          item.created_at
                        ).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading && (
        <div className="fixed bottom-5 right-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl">
          Loading...
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;