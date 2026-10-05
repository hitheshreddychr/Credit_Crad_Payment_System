import { useState } from "react";
import { RefreshCw, ReceiptText } from "lucide-react";

function Transactions({
  transactions,
  refresh,
}) {
  const [filters, setFilters] = useState({
    status: "ALL",
    minAmount: "",
    maxAmount: "",
    fromDate: "",
    toDate: "",
  });

  const change = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const filtered = transactions.filter((item) => {
    const amount = Number(item.amount || 0);

    if (
      filters.status !== "ALL" &&
      item.status !== filters.status
    ) {
      return false;
    }

    if (
      filters.minAmount &&
      amount < Number(filters.minAmount)
    ) {
      return false;
    }

    if (
      filters.maxAmount &&
      amount > Number(filters.maxAmount)
    ) {
      return false;
    }

    const date = item.created_at
      ? new Date(item.created_at)
      : null;

    if (
      filters.fromDate &&
      date &&
      date < new Date(`${filters.fromDate}T00:00:00`)
    ) {
      return false;
    }

    if (
      filters.toDate &&
      date &&
      date >
        new Date(`${filters.toDate}T23:59:59`)
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-blue-600">
            PAYMENT ACTIVITY
          </p>

          <h1 className="mt-1 text-3xl font-extrabold">
            Transactions
          </h1>

          <p className="mt-2 text-slate-400">
            View and filter your payment history.
          </p>
        </div>

        <button
          onClick={refresh}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <select
            name="status"
            value={filters.status}
            onChange={change}
            className="rounded-xl border border-slate-200 px-4 py-3 outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>

          <input
            name="minAmount"
            type="number"
            value={filters.minAmount}
            onChange={change}
            placeholder="Min amount"
            className="rounded-xl border border-slate-200 px-4 py-3 outline-none"
          />

          <input
            name="maxAmount"
            type="number"
            value={filters.maxAmount}
            onChange={change}
            placeholder="Max amount"
            className="rounded-xl border border-slate-200 px-4 py-3 outline-none"
          />

          <input
            name="fromDate"
            type="date"
            value={filters.fromDate}
            onChange={change}
            className="rounded-xl border border-slate-200 px-4 py-3 outline-none"
          />

          <input
            name="toDate"
            type="date"
            value={filters.toDate}
            onChange={change}
            className="rounded-xl border border-slate-200 px-4 py-3 outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Transaction",
                  "Amount",
                  "Method",
                  "Status",
                  "Description",
                  "Date",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr
                  key={
                    item.id ||
                    item.transaction_id
                  }
                  className="hover:bg-slate-50"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                        <ReceiptText size={18} />
                      </div>

                      <span className="font-bold text-slate-800">
                        {item.transaction_id}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-5 font-bold">
                    {item.currency} {item.amount}
                  </td>

                  <td className="px-6 py-5 text-slate-500">
                    {item.payment_method}
                  </td>

                  <td className="px-6 py-5">
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

                  <td className="px-6 py-5 text-slate-500">
                    {item.description || "-"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-400">
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

        {filtered.length === 0 && (
          <div className="p-16 text-center">
            <ReceiptText
              className="mx-auto text-slate-300"
              size={45}
            />

            <p className="mt-4 font-bold">
              No transactions found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Transactions;