import { useEffect, useState } from "react";
import {
  CreditCard,
  ArrowUpRight,
  CheckCircle2,
  Receipt,
  Wallet,
  CircleDollarSign,
} from "lucide-react";
import StatCard from "../components/StatCard";
import { getDashboardSummary } from "../services/dashboardService";

function Dashboard({
  user,
  cards,
  transactions,
  goTo,
}) {
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");

  const loadDashboardSummary = async () => {
    try {
      const data = await getDashboardSummary();
      setSummary(data);
      setSummaryError("");
    } catch {
      setSummaryError(
        "Unable to load dashboard summary."
      );
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardSummary();
    }
  }, [user, transactions]);

  const successful = transactions.filter(
    (item) => item.status === "SUCCESS"
  ).length;

  const failed = transactions.filter(
    (item) => item.status === "FAILED"
  ).length;

  const total = transactions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const summaryTransactions =
    summary?.last_5_transactions || [];

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-7 text-white shadow-xl shadow-blue-100 lg:p-9">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-100">
              {new Date().toLocaleDateString(
                "en-IN",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}
            </p>

            <h1 className="mt-2 text-3xl font-extrabold lg:text-4xl">
              Welcome back, {user.username}
            </h1>

            <p className="mt-3 max-w-xl text-blue-100">
              Manage your cards, make secure payments,
              and keep track of your financial activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => goTo("payment")}
              className="rounded-xl bg-white px-5 py-3 font-bold text-blue-600 shadow-lg"
            >
              Make Payment
            </button>

            <button
              onClick={() => goTo("cards")}
              className="rounded-xl bg-white/15 px-5 py-3 font-bold text-white backdrop-blur"
            >
              Add Card
            </button>
          </div>
        </div>
      </section>

      {summaryError && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {summaryError}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Transactions"
          value={summary?.total_transactions ?? transactions.length}
          subtitle="All payment activity"
          icon={Receipt}
        />

        <StatCard
          title="Total Amount Spent"
          value={`₹${Number(
            summary?.total_amount_spent ?? total
          ).toFixed(2)}`}
          subtitle="Total transaction value"
          icon={CircleDollarSign}
          iconClass="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Current Month Spending"
          value={`₹${Number(
            summary?.current_month_spending ?? 0
          ).toFixed(2)}`}
          subtitle="Spending this month"
          icon={ArrowUpRight}
          iconClass="bg-orange-50 text-orange-600"
        />

        <StatCard
          title="Available Credit"
          value={`₹${Number(
            summary?.available_credit_limit ?? 0
          ).toFixed(2)}`}
          subtitle="Available credit limit"
          icon={CreditCard}
          iconClass="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Successful Payments"
          value={successful}
          subtitle="Completed successfully"
          icon={CheckCircle2}
          iconClass="bg-green-50 text-green-600"
        />

        <StatCard
          title="Failed Payments"
          value={failed}
          subtitle="Unsuccessful payments"
          icon={ArrowUpRight}
          iconClass="bg-red-50 text-red-500"
        />

        <StatCard
          title="Saved Cards"
          value={cards.length}
          subtitle="Active payment cards"
          icon={CreditCard}
          iconClass="bg-purple-50 text-purple-600"
        />

        <StatCard
          title="Latest Activity"
          value={summaryTransactions.length}
          subtitle="Recent transactions"
          icon={Receipt}
          iconClass="bg-slate-50 text-slate-600"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Recent Transactions
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Your latest payment activity
              </p>
            </div>

            <button
              onClick={() => goTo("transactions")}
              className="text-sm font-bold text-blue-600"
            >
              View All
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {summaryTransactions.map(
              (transaction, index) => (
                <div
                  key={`${transaction.date}-${index}`}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <CreditCard size={20} />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {transaction.masked_card_number}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {transaction.date
                          ? new Date(
                              transaction.date
                            ).toLocaleString("en-IN")
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      ₹
                      {Number(
                        transaction.amount || 0
                      ).toFixed(2)}
                    </p>

                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        transaction.status === "SUCCESS"
                          ? "bg-green-100 text-green-700"
                          : transaction.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                </div>
              )
            )}

            {summaryTransactions.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-10 text-center text-sm text-slate-400">
                No transactions yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-900">
            Payment Overview
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Your real-time payment summary
          </p>

          <div className="mt-7 rounded-2xl bg-blue-50 p-6">
            <Wallet
              className="text-blue-600"
              size={25}
            />

            <p className="mt-5 text-sm font-semibold text-blue-600">
              Total Amount Spent
            </p>

            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              ₹
              {Number(
                summary?.total_amount_spent ?? total
              ).toFixed(2)}
            </p>
          </div>

          <div className="mt-5 rounded-2xl bg-green-50 p-6">
            <CreditCard
              className="text-green-600"
              size={25}
            />

            <p className="mt-5 text-sm font-semibold text-green-600">
              Available Credit
            </p>

            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              ₹
              {Number(
                summary?.available_credit_limit ?? 0
              ).toFixed(2)}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => goTo("cards")}
              className="rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-50"
            >
              <CreditCard
                size={19}
                className="text-blue-600"
              />

              <p className="mt-2 text-xs text-slate-400">
                Saved Cards
              </p>

              <p className="font-bold text-slate-900">
                {cards.length}
              </p>
            </button>

            <button
              onClick={() => goTo("payment")}
              className="rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-50"
            >
              <ArrowUpRight
                size={19}
                className="text-green-600"
              />

              <p className="mt-2 text-xs text-slate-400">
                Quick Action
              </p>

              <p className="font-bold text-slate-900">
                Pay Now
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;