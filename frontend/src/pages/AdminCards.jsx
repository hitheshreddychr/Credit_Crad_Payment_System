import { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  User,
  CalendarDays,
  WalletCards,
  X,
  Save,
} from "lucide-react";
import api from "../api";

function AdminCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedCard, setSelectedCard] = useState(null);
  const [creditLimit, setCreditLimit] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadCards = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/api/admin/cards/");

      const data = response.data;

      setCards(
        Array.isArray(data)
          ? data
          : Array.isArray(data.results)
            ? data.results
            : []
      );
    } catch (requestError) {
      const responseData = requestError.response?.data;

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        setError(
          Object.values(responseData)
            .flat()
            .join(" ")
        );
      } else {
        setError("Unable to load cards.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const updateCard = async (card, updates) => {
    setError("");
    setMessage("");

    try {
      await api.patch(
        `/api/admin/cards/${card.id}/`,
        updates
      );

      setCards((current) =>
        current.map((item) =>
          item.id === card.id
            ? {
                ...item,
                ...updates,
              }
            : item
        )
      );

      setMessage(
        "Card updated successfully."
      );

      return true;
    } catch (requestError) {
      const responseData = requestError.response?.data;

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        setError(
          Object.values(responseData)
            .flat()
            .join(" ")
        );
      } else {
        setError("Unable to update card.");
      }

      return false;
    }
  };

  const handleToggleStatus = async (card) => {
    await updateCard(card, {
      is_active: !card.is_active,
    });
  };

  const openCreditModal = (card) => {
    setSelectedCard(card);
    setCreditLimit(
      String(card.credit_limit ?? "")
    );
    setError("");
    setMessage("");
  };

  const closeCreditModal = () => {
    if (updating) {
      return;
    }

    setSelectedCard(null);
    setCreditLimit("");
  };

  const handleCreditLimitUpdate = async (event) => {
    event.preventDefault();

    if (!selectedCard) {
      return;
    }

    const numericLimit = Number(creditLimit);

    if (
      !creditLimit ||
      Number.isNaN(numericLimit) ||
      numericLimit < 0
    ) {
      setError(
        "Enter a valid credit limit."
      );
      return;
    }

    setUpdating(true);
    setError("");

    try {
      const response = await api.patch(
        `/api/admin/cards/${selectedCard.id}/`,
        {
          credit_limit: numericLimit,
        }
      );

      const updatedCard =
        response.data || {
          ...selectedCard,
          credit_limit: numericLimit,
        };

      setCards((current) =>
        current.map((card) =>
          card.id === selectedCard.id
            ? {
                ...card,
                ...updatedCard,
                credit_limit:
                  updatedCard.credit_limit ??
                  numericLimit,
              }
            : card
        )
      );

      setSelectedCard(null);
      setCreditLimit("");
      setMessage(
        "Credit limit updated successfully."
      );
    } catch (requestError) {
      const responseData = requestError.response?.data;

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        setError(
          Object.values(responseData)
            .flat()
            .join(" ")
        );
      } else {
        setError(
          "Unable to update credit limit."
        );
      }
    } finally {
      setUpdating(false);
    }
  };

  const filteredCards = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return cards.filter((card) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          card.is_active) ||
        (statusFilter === "BLOCKED" &&
          !card.is_active);

      const searchableText = [
        card.id,
        card.username,
        card.user,
        card.cardholder_name,
        card.card_type,
        card.card_category,
        card.last_four_digits,
        card.masked_card_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchableText.includes(query);

      return (
        matchesStatus &&
        matchesSearch
      );
    });
  }, [cards, search, statusFilter]);

  const totalCards = cards.length;

  const activeCards = cards.filter(
    (card) => card.is_active
  ).length;

  const blockedCards =
    totalCards - activeCards;

  const formatAmount = (value) => {
    const amount = Number(value || 0);

    return `₹${amount.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatExpiry = (card) => {
    return `${String(
      card.expiry_month
    ).padStart(2, "0")}/${card.expiry_year}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading card management...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-7">

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                Administration
              </p>

              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                Card Control
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Card Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              View, block, unblock, and manage customer credit cards.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadCards(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {message && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
            <ShieldCheck size={19} />
            {message}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            <ShieldOff size={19} />
            {error}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Total Cards
                </p>

                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {totalCards}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <WalletCards size={23} />
              </div>
            </div>

            <p className="mt-4 text-xs font-medium text-slate-400">
              All customer cards
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Active Cards
                </p>

                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {activeCards}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <ShieldCheck size={23} />
              </div>
            </div>

            <p className="mt-4 text-xs font-medium text-green-600">
              Currently available
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Blocked Cards
                </p>

                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {blockedCards}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <ShieldOff size={23} />
              </div>
            </div>

            <p className="mt-4 text-xs font-medium text-red-600">
              Currently blocked
            </p>
          </div>

        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row">

            <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search
                size={19}
                className="shrink-0 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by cardholder, user, card type or last 4 digits..."
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="ALL">
                All Status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="BLOCKED">
                Blocked
              </option>
            </select>

          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Customer Cards
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredCards.length} card
              {filteredCards.length === 1
                ? ""
                : "s"} displayed
            </p>
          </div>
        </div>

        {filteredCards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <CreditCard size={27} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-800">
              No cards found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">

            {filteredCards.map((card) => (
              <div
                key={card.id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >

                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <CreditCard size={21} />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Card #{card.id}
                      </p>

                      <p className="mt-0.5 text-base font-extrabold text-slate-900">
                        {card.card_type}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                      card.is_active
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        card.is_active
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />

                    {card.is_active
                      ? "ACTIVE"
                      : "BLOCKED"}
                  </span>

                </div>

                <div className="px-6 py-6">

                  <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-6 text-white shadow-lg">

                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {card.card_category ||
                            "CREDIT"}
                        </p>

                        <p className="mt-1 text-lg font-extrabold">
                          {card.card_type}
                        </p>
                      </div>

                      <CreditCard
                        size={28}
                        className="text-blue-300"
                      />
                    </div>

                    <p className="mt-8 text-xl font-semibold tracking-[0.18em] text-slate-100">
                      {card.masked_card_number ||
                        `**** **** **** ${card.last_four_digits}`}
                    </p>

                    <div className="mt-7 flex items-end justify-between">

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Cardholder
                        </p>

                        <p className="mt-1 text-sm font-bold text-white">
                          {card.cardholder_name ||
                            "N/A"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Expiry
                        </p>

                        <p className="mt-1 text-sm font-bold text-white">
                          {formatExpiry(card)}
                        </p>
                      </div>

                    </div>

                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">

                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <User size={15} />

                        <p className="text-xs font-semibold">
                          Customer
                        </p>
                      </div>

                      <p className="mt-2 truncate text-sm font-bold text-slate-800">
                        {card.username ||
                          card.user ||
                          "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <CalendarDays size={15} />

                        <p className="text-xs font-semibold">
                          Expiry
                        </p>
                      </div>

                      <p className="mt-2 text-sm font-bold text-slate-800">
                        {formatExpiry(card)}
                      </p>
                    </div>

                  </div>

                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">

                    <div className="flex items-center justify-between gap-4">

                      <div>
                        <p className="text-xs font-semibold text-blue-600">
                          Credit Limit
                        </p>

                        <p className="mt-1 text-xl font-extrabold text-slate-900">
                          {formatAmount(
                            card.credit_limit
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openCreditModal(card)
                        }
                        className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-600 hover:text-white"
                      >
                        Update Limit
                      </button>

                    </div>

                  </div>

                  <div className="mt-5 flex gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleStatus(card)
                      }
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                        card.is_active
                          ? "bg-red-50 text-red-700 hover:bg-red-600 hover:text-white"
                          : "bg-green-50 text-green-700 hover:bg-green-600 hover:text-white"
                      }`}
                    >
                      {card.is_active ? (
                        <>
                          <ShieldOff size={17} />
                          Block Card
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={17} />
                          Unblock Card
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openCreditModal(card)
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600"
                    >
                      <WalletCards size={17} />
                      Credit Limit
                    </button>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Card #{selectedCard.id}
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Update Credit Limit
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  ****{" "}
                  {selectedCard.last_four_digits}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreditModal}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={
                handleCreditLimitUpdate
              }
              className="mt-7"
            >

              <label className="text-sm font-bold text-slate-700">
                New Credit Limit
              </label>

              <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-blue-500 focus-within:bg-white">
                <span className="mr-2 text-sm font-bold text-slate-400">
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={creditLimit}
                  onChange={(event) =>
                    setCreditLimit(
                      event.target.value
                    )
                  }
                  className="w-full bg-transparent text-lg font-bold text-slate-900 outline-none"
                  placeholder="100000"
                  autoFocus
                />
              </div>

              {error && (
                <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {error}
                </p>
              )}

              <div className="mt-7 flex gap-3">

                <button
                  type="button"
                  onClick={closeCreditModal}
                  disabled={updating}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />

                  {updating
                    ? "Updating..."
                    : "Update Limit"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}
    </>
  );
}

export default AdminCards;