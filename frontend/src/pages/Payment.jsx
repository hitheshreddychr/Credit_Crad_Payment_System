import { useState } from "react";
import {
  WalletCards,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function Payment({ cards, makePayment }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    card_id: "",
    amount: "",
    currency: "INR",
    description: "",
  });

  const change = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setResult(null);

    const response = await makePayment(form);

    setLoading(false);

    if (response) {
      setResult(response);

      setForm({
        ...form,
        amount: "",
        description: "",
      });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <p className="text-sm font-bold text-blue-600">
          PAYMENT
        </p>

        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
          Make a Payment
        </h1>

        <p className="mt-2 text-slate-400">
          Process a secure simulated card payment.
        </p>
      </div>

      <div className="grid gap-7 lg:grid-cols-5">
        <form
          onSubmit={submit}
          className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm lg:col-span-3"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <WalletCards size={22} />
            </div>

            <div>
              <h2 className="text-xl font-extrabold">
                Payment Details
              </h2>

              <p className="text-sm text-slate-400">
                Enter your payment information.
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold">
                Select Card
              </label>

              <select
                name="card_id"
                value={form.card_id}
                onChange={change}
                required
                disabled={cards.length === 0}
                className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-500"
              >
                <option value="">
                  Select a saved card
                </option>

                {cards.map((card) => (
                  <option
                    key={card.id}
                    value={card.id}
                  >
                    {card.card_type} -{" "}
                    {card.masked_card_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Amount
                </label>

                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={change}
                  required
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Currency
                </label>

                <select
                  name="currency"
                  value={form.currency}
                  onChange={change}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none"
                >
                  <option value="INR">
                    INR - Indian Rupee
                  </option>

                  <option value="USD">
                    USD - US Dollar
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Description
              </label>

              <input
                name="description"
                value={form.description}
                onChange={change}
                maxLength="255"
                placeholder="What is this payment for?"
                className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-500"
              />
            </div>

            {cards.length === 0 && (
              <div className="rounded-xl bg-yellow-50 p-4 text-sm font-semibold text-yellow-700">
                Add a card before making a payment.
              </div>
            )}

            <button
              disabled={loading || cards.length === 0}
              className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "Processing Payment..."
                : "Process Payment"}
            </button>
          </div>
        </form>

        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 p-7 text-white lg:col-span-2">
          <p className="text-sm font-semibold text-blue-300">
            PAYMENT STATUS
          </p>

          {result ? (
            <>
              <div className="mt-8">
                {result.transaction?.status ===
                "SUCCESS" ? (
                  <CheckCircle2
                    size={55}
                    className="text-green-400"
                  />
                ) : (
                  <XCircle
                    size={55}
                    className="text-red-400"
                  />
                )}

                <h2 className="mt-5 text-2xl font-extrabold">
                  {result.transaction?.status}
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Transaction completed.
                </p>
              </div>

              <div className="mt-8 space-y-5">
                <div>
                  <p className="text-xs text-slate-400">
                    Transaction ID
                  </p>

                  <p className="mt-1 break-all font-bold">
                    {result.transaction?.transaction_id}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Amount
                  </p>

                  <p className="mt-1 text-2xl font-extrabold">
                    {result.transaction?.currency}{" "}
                    {result.transaction?.amount}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Description
                  </p>

                  <p className="mt-1 font-semibold">
                    {result.transaction?.description ||
                      "-"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-20 text-center">
              <WalletCards
                size={60}
                className="mx-auto text-blue-400"
              />

              <h2 className="mt-6 text-xl font-bold">
                Ready to pay?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Select a card and enter the amount to
                process your payment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Payment;