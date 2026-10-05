import { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import CardItem from "../components/CardItem";

function Cards({
  cards,
  addCard,
  deleteCard,
}) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    cardholder_name: "",
    card_type: "VISA",
    card_category: "CREDIT",
    card_number: "",
    cvv: "",
    expiry_month: "",
    expiry_year: "",
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

    const success = await addCard(form);

    setLoading(false);

    if (success) {
      setShowForm(false);

      setForm({
        cardholder_name: "",
        card_type: "VISA",
        card_category: "CREDIT",
        card_number: "",
        cvv: "",
        expiry_month: "",
        expiry_year: "",
      });
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-blue-600">
            PAYMENT METHODS
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
            My Cards
          </h1>

          <p className="mt-2 text-slate-400">
            Manage your saved payment cards.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-100"
        >
          <Plus size={18} />
          Add New Card
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <CreditCard size={21} />
            </div>

            <div>
              <h2 className="text-xl font-extrabold">
                Add New Card
              </h2>

              <p className="text-sm text-slate-400">
                Your card number and CVV are never stored.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {[
              [
                "cardholder_name",
                "Cardholder Name",
                "text",
                "Name on card",
              ],
              [
                "card_number",
                "Card Number",
                "text",
                "Enter card number",
              ],
              [
                "cvv",
                "CVV",
                "password",
                "CVV",
              ],
              [
                "expiry_month",
                "Expiry Month",
                "number",
                "MM",
              ],
              [
                "expiry_year",
                "Expiry Year",
                "number",
                "YYYY",
              ],
            ].map(([name, label, type, placeholder]) => (
              <div key={name}>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  {label}
                </label>

                <input
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={change}
                  required
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            ))}

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Card Type
              </label>

              <select
                name="card_type"
                value={form.card_type}
                onChange={change}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
              >
                <option value="VISA">Visa</option>
                <option value="MASTERCARD">
                  Mastercard
                </option>
                <option value="AMEX">
                  American Express
                </option>
                <option value="RUPAY">RuPay</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Card Category
              </label>

              <select
                name="card_category"
                value={form.card_category}
                onChange={change}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
              >
                <option value="CREDIT">Credit</option>
                <option value="DEBIT">Debit</option>
              </select>
            </div>
          </div>

          <button
            disabled={loading}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add Card"}
          </button>
        </form>
      )}

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <CreditCard
            className="mx-auto text-slate-300"
            size={45}
          />

          <h2 className="mt-4 text-xl font-bold">
            No saved cards
          </h2>

          <p className="mt-2 text-slate-400">
            Add your first card to make payments.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onDelete={deleteCard}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Cards;