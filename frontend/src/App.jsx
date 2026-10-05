import { useEffect, useState } from "react";

import api from "./api";


function App() {
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone_number: "",
    password: "",
    password_confirmation: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  const [cards, setCards] = useState([]);

  const [showAddCard, setShowAddCard] = useState(false);

  const [cardLoading, setCardLoading] = useState(false);

  const [cardForm, setCardForm] = useState({
    cardholder_name: "",
    card_type: "VISA",
    card_category: "CREDIT",
    card_number: "",
    cvv: "",
    expiry_month: "",
    expiry_year: "",
  });

  const [showPayment, setShowPayment] = useState(false);

  const [paymentLoading, setPaymentLoading] = useState(false);

  const [paymentResult, setPaymentResult] = useState(null);

  const [paymentForm, setPaymentForm] = useState({
    card_id: "",
    amount: "",
    currency: "INR",
    description: "",
  });

  const [transactions, setTransactions] = useState([]);

  const [transactionLoading, setTransactionLoading] =
    useState(false);

  const [showTransactions, setShowTransactions] =
    useState(false);

  const [transactionFilters, setTransactionFilters] =
    useState({
      status: "ALL",
      minAmount: "",
      maxAmount: "",
      fromDate: "",
      toDate: "",
    });

  const [showAdminDashboard, setShowAdminDashboard] =
    useState(false);

  const [adminSummary, setAdminSummary] =
    useState(null);

  const [adminUsers, setAdminUsers] =
    useState([]);

  const [adminTransactions, setAdminTransactions] =
    useState([]);

  const [adminLoading, setAdminLoading] =
    useState(false);

  const [adminSearch, setAdminSearch] =
    useState("");

  const isAdmin =
    Boolean(
      user?.is_admin ||
      user?.is_staff
    );


  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };


  const handleCardChange = (event) => {
    setCardForm({
      ...cardForm,
      [event.target.name]: event.target.value,
    });
  };


  const handlePaymentChange = (event) => {
    setPaymentForm({
      ...paymentForm,
      [event.target.name]: event.target.value,
    });
  };


  const handleTransactionFilterChange = (event) => {
    setTransactionFilters({
      ...transactionFilters,
      [event.target.name]: event.target.value,
    });
  };


  const loadCards = async () => {
    try {
      const response = await api.get(
        "/api/cards/"
      );

      setCards(response.data);
    } catch {
      setError(
        "Unable to load saved cards."
      );
    }
  };


  const loadTransactions = async () => {
    setTransactionLoading(true);

    try {
      const response = await api.get(
        "/api/payments/history/"
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setTransactions(data);
      } else if (
        Array.isArray(data.transactions)
      ) {
        setTransactions(
          data.transactions
        );
      } else if (
        Array.isArray(data.results)
      ) {
        setTransactions(
          data.results
        );
      } else {
        setTransactions([]);
      }
    } catch {
      setError(
        "Unable to load transaction history."
      );
    } finally {
      setTransactionLoading(false);
    }
  };


  useEffect(() => {
    if (user) {
      loadCards();
      loadTransactions();
    }
  }, [user]);


  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const response = await api.post(
          "/api/auth/login/",
          {
            username: formData.username,
            password: formData.password,
          }
        );

        localStorage.setItem(
          "access_token",
          response.data.access
        );

        localStorage.setItem(
          "refresh_token",
          response.data.refresh
        );

        localStorage.setItem(
          "user",
          JSON.stringify(
            response.data.user
          )
        );

        setUser(response.data.user);

        setMessage(
          "Login successful."
        );

        setFormData({
          username: "",
          email: "",
          phone_number: "",
          password: "",
          password_confirmation: "",
        });
      } else {
        await api.post(
          "/api/auth/register/",
          {
            username: formData.username,
            email: formData.email,
            phone_number:
              formData.phone_number,
            password: formData.password,
            password_confirmation:
              formData.password_confirmation,
          }
        );

        setMessage(
          "Registration successful. Please login."
        );

        setIsLogin(true);

        setFormData({
          username: "",
          email: "",
          phone_number: "",
          password: "",
          password_confirmation: "",
        });
      }
    } catch (requestError) {
      const responseData =
        requestError.response?.data;

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
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };


  const handleAddCard = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setCardLoading(true);

    try {
      const response = await api.post(
        "/api/cards/",
        {
          ...cardForm,
          expiry_month: Number(
            cardForm.expiry_month
          ),
          expiry_year: Number(
            cardForm.expiry_year
          ),
        }
      );

      setCards([
        response.data,
        ...cards,
      ]);

      setCardForm({
        cardholder_name: "",
        card_type: "VISA",
        card_category: "CREDIT",
        card_number: "",
        cvv: "",
        expiry_month: "",
        expiry_year: "",
      });

      setShowAddCard(false);

      setMessage(
        "Card added successfully."
      );
    } catch (requestError) {
      const responseData =
        requestError.response?.data;

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
          "Unable to add card."
        );
      }
    } finally {
      setCardLoading(false);
    }
  };


  const handleDeleteCard = async (cardId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this card?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await api.delete(
        `/api/cards/${cardId}/`
      );

      setCards(
        cards.filter(
          (card) => card.id !== cardId
        )
      );

      if (
        String(paymentForm.card_id) ===
        String(cardId)
      ) {
        setPaymentForm({
          ...paymentForm,
          card_id: "",
        });
      }

      setMessage(
        "Card deleted successfully."
      );
    } catch {
      setError(
        "Unable to delete card."
      );
    }
  };


  const handlePayment = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setPaymentResult(null);
    setPaymentLoading(true);

    try {
      const response = await api.post(
        "/api/payments/process/",
        {
          card_id: Number(
            paymentForm.card_id
          ),
          amount: Number(
            paymentForm.amount
          ),
          currency:
            paymentForm.currency,
          description:
            paymentForm.description,
        }
      );

      setPaymentResult(
        response.data
      );

      setPaymentForm({
        ...paymentForm,
        amount: "",
        description: "",
      });

      await loadTransactions();

      setMessage(
        response.data.message ||
          "Payment processed successfully."
      );
    } catch (requestError) {
      const responseData =
        requestError.response?.data;

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        if (
          responseData.message
        ) {
          setError(
            responseData.message
          );
        } else {
          setError(
            Object.values(responseData)
              .flat()
              .join(" ")
          );
        }
      } else {
        setError(
          "Unable to process payment."
        );
      }
    } finally {
      setPaymentLoading(false);
    }
  };


  const getFilteredTransactions = () => {
    return transactions.filter(
      (transaction) => {
        const amount = Number(
          transaction.amount || 0
        );

        const statusMatches =
          transactionFilters.status ===
            "ALL" ||
          transaction.status ===
            transactionFilters.status;

        const minAmountMatches =
          !transactionFilters.minAmount ||
          amount >=
            Number(
              transactionFilters.minAmount
            );

        const maxAmountMatches =
          !transactionFilters.maxAmount ||
          amount <=
            Number(
              transactionFilters.maxAmount
            );

        const transactionDate =
          transaction.created_at
            ? new Date(
                transaction.created_at
              )
            : null;

        let fromDateMatches = true;
        let toDateMatches = true;

        if (
          transactionFilters.fromDate &&
          transactionDate
        ) {
          const fromDate = new Date(
            `${transactionFilters.fromDate}T00:00:00`
          );

          fromDateMatches =
            transactionDate >=
            fromDate;
        }

        if (
          transactionFilters.toDate &&
          transactionDate
        ) {
          const toDate = new Date(
            `${transactionFilters.toDate}T23:59:59`
          );

          toDateMatches =
            transactionDate <=
            toDate;
        }

        return (
          statusMatches &&
          minAmountMatches &&
          maxAmountMatches &&
          fromDateMatches &&
          toDateMatches
        );
      }
    );
  };


  const clearTransactionFilters = () => {
    setTransactionFilters({
      status: "ALL",
      minAmount: "",
      maxAmount: "",
      fromDate: "",
      toDate: "",
    });
  };


  const loadAdminDashboard = async () => {
    setAdminLoading(true);
    setError("");

    try {
      const [summaryResponse, usersResponse, transactionsResponse] =
        await Promise.all([
          api.get(
            "/api/payments/admin/summary/"
          ),
          api.get(
            "/api/admin/users/",
            {
              params: adminSearch
                ? { search: adminSearch }
                : {},
            }
          ),
          api.get(
            "/api/payments/admin/transactions/"
          ),
        ]);

      setAdminSummary(
        summaryResponse.data
      );

      const usersData =
        usersResponse.data;

      if (Array.isArray(usersData)) {
        setAdminUsers(usersData);
      } else if (
        Array.isArray(usersData.results)
      ) {
        setAdminUsers(
          usersData.results
        );
      } else {
        setAdminUsers([]);
      }

      const transactionsData =
        transactionsResponse.data;

      if (
        Array.isArray(
          transactionsData
        )
      ) {
        setAdminTransactions(
          transactionsData
        );
      } else if (
        Array.isArray(
          transactionsData.results
        )
      ) {
        setAdminTransactions(
          transactionsData.results
        );
      } else {
        setAdminTransactions([]);
      }
    } catch (requestError) {
      if (
        requestError.response?.status ===
        403
      ) {
        setError(
          "You do not have permission to access the admin dashboard."
        );
      } else {
        setError(
          "Unable to load the admin dashboard."
        );
      }
    } finally {
      setAdminLoading(false);
    }
  };


  const handleAdminSearch = async () => {
    setAdminLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/api/admin/users/",
        {
          params: adminSearch
            ? { search: adminSearch }
            : {},
        }
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setAdminUsers(data);
      } else if (
        Array.isArray(data.results)
      ) {
        setAdminUsers(data.results);
      } else {
        setAdminUsers([]);
      }
    } catch {
      setError(
        "Unable to search users."
      );
    } finally {
      setAdminLoading(false);
    }
  };


  const handleAdminUserStatus = async (
    userId,
    isActive
  ) => {
    setError("");
    setMessage("");

    try {
      await api.patch(
        `/api/admin/users/${userId}/`,
        {
          is_active: isActive,
        }
      );

      setMessage(
        "User status updated successfully."
      );

      await loadAdminDashboard();
    } catch (requestError) {
      const responseData =
        requestError.response?.data;

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
          "Unable to update user status."
        );
      }
    }
  };


  const handleAdminExport = async () => {
    setError("");
    setMessage("");

    try {
      const response = await api.get(
        "/api/payments/admin/transactions/export/",
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type: "text/csv",
        }
      );

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;
      link.download =
        "admin_transactions.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(
        url
      );

      setMessage(
        "Transaction CSV exported successfully."
      );
    } catch {
      setError(
        "Unable to export transactions."
      );
    }
  };


  const handleLogout = async () => {
    const refreshToken =
      localStorage.getItem(
        "refresh_token"
      );

    try {
      if (refreshToken) {
        await api.post(
          "/api/auth/logout/",
          {
            refresh: refreshToken,
          }
        );
      }
    } catch {
    } finally {
      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "refresh_token"
      );

      localStorage.removeItem(
        "user"
      );

      setUser(null);
      setCards([]);
      setTransactions([]);
      setPaymentResult(null);

      setMessage(
        "Logged out successfully."
      );

      setError("");
    }
  };


  if (user) {
    const filteredTransactions =
      getFilteredTransactions();

    return (
      <div className="min-h-screen bg-slate-100">

        <header className="bg-slate-900 text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

            <div>
              <h1 className="text-2xl font-bold">
                Credit Card Payment System
              </h1>

              <p className="text-sm text-slate-300">
                Welcome, {user.username}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              {isAdmin && (
                <button
                  onClick={() => {
                    const nextState =
                      !showAdminDashboard;

                    setShowAdminDashboard(
                      nextState
                    );

                    setShowTransactions(false);
                    setShowPayment(false);
                    setShowAddCard(false);
                    setMessage("");
                    setError("");

                    if (nextState) {
                      loadAdminDashboard();
                    }
                  }}
                  className="rounded-lg bg-purple-600 px-5 py-2 font-semibold transition hover:bg-purple-700"
                >
                  {showAdminDashboard
                    ? "Close Admin"
                    : "Admin Dashboard"}
                </button>
              )}

              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-500 px-5 py-2 font-semibold transition hover:bg-red-600"
              >
                Logout
              </button>
            </div>

          </div>
        </header>


        <main className="mx-auto max-w-7xl px-6 py-10">

          {message && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
              {message}
            </div>
          )}


          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}


          {isAdmin && showAdminDashboard && (
            <section className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Admin Dashboard
                  </h2>
                  <p className="mt-1 text-slate-500">
                    Monitor payments, transactions, and registered users.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={loadAdminDashboard}
                    disabled={adminLoading}
                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {adminLoading
                      ? "Refreshing..."
                      : "Refresh Dashboard"}
                  </button>

                  <button
                    onClick={handleAdminExport}
                    className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              {adminSummary && (
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-xl bg-slate-900 p-5 text-white">
                    <p className="text-sm text-slate-300">
                      Total Transactions
                    </p>
                    <p className="mt-2 text-3xl font-bold">
                      {adminSummary.total_transactions ?? 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-600 p-5 text-white">
                    <p className="text-sm text-green-100">
                      Successful
                    </p>
                    <p className="mt-2 text-3xl font-bold">
                      {adminSummary.successful_payments ?? 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-red-600 p-5 text-white">
                    <p className="text-sm text-red-100">
                      Failed
                    </p>
                    <p className="mt-2 text-3xl font-bold">
                      {adminSummary.failed_payments ?? 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-yellow-500 p-5 text-white">
                    <p className="text-sm text-yellow-100">
                      Pending
                    </p>
                    <p className="mt-2 text-3xl font-bold">
                      {adminSummary.pending_payments ?? 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-600 p-5 text-white">
                    <p className="text-sm text-blue-100">
                      Successful Amount
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      ₹{adminSummary.total_successful_amount ?? "0.00"}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <div className="flex-1">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Search Users
                    </label>

                    <input
                      type="text"
                      value={adminSearch}
                      onChange={(event) =>
                        setAdminSearch(
                          event.target.value
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter"
                        ) {
                          handleAdminSearch();
                        }
                      }}
                      placeholder="Username, email, or phone number"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <button
                    onClick={handleAdminSearch}
                    disabled={adminLoading}
                    className="rounded-lg bg-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Registered Users
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Manage user account activation status.
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                    {adminUsers.length} users
                  </span>
                </div>

                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  {adminLoading ? (
                    <div className="p-10 text-center text-slate-500">
                      Loading admin data...
                    </div>
                  ) : adminUsers.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">
                      No users found.
                    </div>
                  ) : (
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="px-5 py-4 font-semibold">
                            ID
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Username
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Email
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Phone
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Role
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Status
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {adminUsers.map(
                          (adminUser) => (
                            <tr
                              key={
                                adminUser.id
                              }
                              className="hover:bg-slate-50"
                            >
                              <td className="px-5 py-4 font-semibold text-slate-900">
                                {adminUser.id}
                              </td>

                              <td className="px-5 py-4 text-slate-700">
                                {adminUser.username}
                              </td>

                              <td className="px-5 py-4 text-slate-700">
                                {adminUser.email}
                              </td>

                              <td className="px-5 py-4 text-slate-700">
                                {adminUser.phone_number ||
                                  "-"}
                              </td>

                              <td className="px-5 py-4">
                                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                                  {adminUser.is_admin ||
                                  adminUser.is_staff
                                    ? "ADMIN"
                                    : "USER"}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    adminUser.is_active
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {adminUser.is_active
                                    ? "ACTIVE"
                                    : "INACTIVE"}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                {adminUser.id ===
                                user.id ? (
                                  <span className="text-xs text-slate-400">
                                    Current account
                                  </span>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleAdminUserStatus(
                                        adminUser.id,
                                        !adminUser.is_active
                                      )
                                    }
                                    className={`rounded-lg px-4 py-2 text-xs font-semibold text-white ${
                                      adminUser.is_active
                                        ? "bg-red-500 hover:bg-red-600"
                                        : "bg-green-600 hover:bg-green-700"
                                    }`}
                                  >
                                    {adminUser.is_active
                                      ? "Deactivate"
                                      : "Activate"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="mt-10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      All Transactions
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      View payment activity across all users.
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                    {adminTransactions.length} transactions
                  </span>
                </div>

                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  {adminTransactions.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">
                      No transactions found.
                    </div>
                  ) : (
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="px-5 py-4 font-semibold">
                            Transaction ID
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            User
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Amount
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Method
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Status
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Card
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Date
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {adminTransactions.map(
                          (transaction) => (
                            <tr
                              key={
                                transaction.id ||
                                transaction.transaction_id
                              }
                              className="hover:bg-slate-50"
                            >
                              <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                                {transaction.transaction_id}
                              </td>

                              <td className="px-5 py-4 text-slate-700">
                                {transaction.username ||
                                  transaction.user?.username ||
                                  "-"}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                                {transaction.currency}{" "}
                                {transaction.amount}
                              </td>

                              <td className="px-5 py-4 text-slate-700">
                                {transaction.payment_method}
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    transaction.status ===
                                    "SUCCESS"
                                      ? "bg-green-100 text-green-700"
                                      : transaction.status ===
                                          "FAILED"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {transaction.status}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-slate-700">
                                {transaction.card
                                  ?.masked_card_number ||
                                  transaction.masked_card_number ||
                                  "-"}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                {transaction.created_at
                                  ? new Date(
                                      transaction.created_at
                                    ).toLocaleString()
                                  : "-"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </section>
          )}


          <section className="rounded-2xl bg-white p-8 shadow-sm">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  My Cards
                </h2>

                <p className="mt-1 text-slate-500">
                  Manage your saved credit and debit cards.
                </p>
              </div>


              <div className="flex flex-wrap gap-3">

                <button
                  onClick={() => {
                    setShowTransactions(
                      !showTransactions
                    );

                    setShowPayment(false);
                    setShowAddCard(false);
                    setMessage("");
                    setError("");

                    if (
                      !showTransactions
                    ) {
                      loadTransactions();
                    }
                  }}
                  className="rounded-lg bg-slate-700 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  {showTransactions
                    ? "Close History"
                    : "Transaction History"}
                </button>


                <button
                  onClick={() => {
                    setShowPayment(
                      !showPayment
                    );

                    setShowTransactions(
                      false
                    );

                    setPaymentResult(null);
                    setMessage("");
                    setError("");
                  }}
                  className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
                >
                  {showPayment
                    ? "Close Payment"
                    : "Make a Payment"}
                </button>


                <button
                  onClick={() => {
                    setShowAddCard(
                      !showAddCard
                    );

                    setShowPayment(false);
                    setShowTransactions(
                      false
                    );
                  }}
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  {showAddCard
                    ? "Close"
                    : "Add New Card"}
                </button>

              </div>

            </div>


            {showTransactions && (
              <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Transaction History
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      View and filter your payment transactions.
                    </p>
                  </div>


                  <button
                    onClick={loadTransactions}
                    disabled={
                      transactionLoading
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {transactionLoading
                      ? "Refreshing..."
                      : "Refresh"}
                  </button>

                </div>


                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Status
                    </label>

                    <select
                      name="status"
                      value={
                        transactionFilters.status
                      }
                      onChange={
                        handleTransactionFilterChange
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    >
                      <option value="ALL">
                        All
                      </option>

                      <option value="SUCCESS">
                        Success
                      </option>

                      <option value="FAILED">
                        Failed
                      </option>

                      <option value="PENDING">
                        Pending
                      </option>
                    </select>
                  </div>


                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Min Amount
                    </label>

                    <input
                      type="number"
                      name="minAmount"
                      value={
                        transactionFilters.minAmount
                      }
                      onChange={
                        handleTransactionFilterChange
                      }
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>


                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Max Amount
                    </label>

                    <input
                      type="number"
                      name="maxAmount"
                      value={
                        transactionFilters.maxAmount
                      }
                      onChange={
                        handleTransactionFilterChange
                      }
                      min="0"
                      step="0.01"
                      placeholder="100000"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>


                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      From Date
                    </label>

                    <input
                      type="date"
                      name="fromDate"
                      value={
                        transactionFilters.fromDate
                      }
                      onChange={
                        handleTransactionFilterChange
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>


                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      To Date
                    </label>

                    <input
                      type="date"
                      name="toDate"
                      value={
                        transactionFilters.toDate
                      }
                      onChange={
                        handleTransactionFilterChange
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>

                </div>


                <div className="mt-4 flex justify-end">
                  <button
                    onClick={
                      clearTransactionFilters
                    }
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Clear Filters
                  </button>
                </div>


                <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">

                  {transactionLoading ? (
                    <div className="p-10 text-center text-slate-500">
                      Loading transactions...
                    </div>
                  ) : filteredTransactions.length ===
                    0 ? (
                    <div className="p-10 text-center">

                      <h4 className="font-semibold text-slate-800">
                        No transactions found
                      </h4>

                      <p className="mt-2 text-sm text-slate-500">
                        Try changing the filters or make a payment.
                      </p>

                    </div>
                  ) : (
                    <table className="min-w-full text-left text-sm">

                      <thead className="bg-slate-100 text-slate-600">

                        <tr>

                          <th className="px-5 py-4 font-semibold">
                            Transaction ID
                          </th>

                          <th className="px-5 py-4 font-semibold">
                            Amount
                          </th>

                          <th className="px-5 py-4 font-semibold">
                            Currency
                          </th>

                          <th className="px-5 py-4 font-semibold">
                            Method
                          </th>

                          <th className="px-5 py-4 font-semibold">
                            Status
                          </th>

                          <th className="px-5 py-4 font-semibold">
                            Description
                          </th>

                          <th className="px-5 py-4 font-semibold">
                            Date
                          </th>

                        </tr>

                      </thead>


                      <tbody className="divide-y divide-slate-200">

                        {filteredTransactions.map(
                          (transaction) => (
                            <tr
                              key={
                                transaction.id ||
                                transaction.transaction_id
                              }
                              className="hover:bg-slate-50"
                            >

                              <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                                {
                                  transaction.transaction_id
                                }
                              </td>


                              <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                                {transaction.amount}
                              </td>


                              <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                                {
                                  transaction.currency
                                }
                              </td>


                              <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                                {
                                  transaction.payment_method
                                }
                              </td>


                              <td className="whitespace-nowrap px-5 py-4">

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    transaction.status ===
                                    "SUCCESS"
                                      ? "bg-green-100 text-green-700"
                                      : transaction.status ===
                                          "FAILED"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {
                                    transaction.status
                                  }
                                </span>

                              </td>


                              <td className="px-5 py-4 text-slate-700">
                                {
                                  transaction.description ||
                                  "-"
                                }
                              </td>


                              <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                {transaction.created_at
                                  ? new Date(
                                      transaction.created_at
                                    ).toLocaleString()
                                  : "-"}
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>
                  )}

                </div>


                <p className="mt-4 text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold">
                    {
                      filteredTransactions.length
                    }
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">
                    {transactions.length}
                  </span>{" "}
                  transactions.
                </p>

              </section>
            )}


            {showPayment && (
              <form
                onSubmit={handlePayment}
                className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6"
              >

                <h3 className="text-xl font-bold text-slate-900">
                  Make a Payment
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  This payment is simulated for the assessment.
                </p>


                <div className="mt-6 grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Select Card
                    </label>

                    <select
                      name="card_id"
                      value={
                        paymentForm.card_id
                      }
                      onChange={
                        handlePaymentChange
                      }
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    >

                      <option value="">
                        Select a card
                      </option>

                      {cards.map((card) => (
                        <option
                          key={card.id}
                          value={card.id}
                        >
                          {card.card_type} -{" "}
                          {
                            card.masked_card_number
                          }
                        </option>
                      ))}

                    </select>
                  </div>


                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Amount
                    </label>

                    <input
                      type="number"
                      name="amount"
                      value={
                        paymentForm.amount
                      }
                      onChange={
                        handlePaymentChange
                      }
                      required
                      min="1"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      placeholder="Enter amount"
                    />
                  </div>


                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Currency
                    </label>

                    <select
                      name="currency"
                      value={
                        paymentForm.currency
                      }
                      onChange={
                        handlePaymentChange
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    >

                      <option value="INR">
                        INR - Indian Rupee
                      </option>

                      <option value="USD">
                        USD - US Dollar
                      </option>

                    </select>
                  </div>


                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Description
                    </label>

                    <input
                      type="text"
                      name="description"
                      value={
                        paymentForm.description
                      }
                      onChange={
                        handlePaymentChange
                      }
                      maxLength="255"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      placeholder="Payment description"
                    />
                  </div>

                </div>


                {cards.length === 0 && (
                  <p className="mt-5 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                    Add a card before making a payment.
                  </p>
                )}


                <div className="mt-6 flex justify-end">

                  <button
                    type="submit"
                    disabled={
                      paymentLoading ||
                      cards.length === 0
                    }
                    className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paymentLoading
                      ? "Processing..."
                      : "Process Payment"}
                  </button>

                </div>

              </form>
            )}


            {paymentResult && (
              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">

                <h3 className="text-xl font-bold text-slate-900">
                  Payment Result
                </h3>


                <div className="mt-5 grid gap-4 md:grid-cols-2">

                  <div className="rounded-lg bg-white p-4">
                    <p className="text-sm text-slate-500">
                      Transaction ID
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        paymentResult
                          .transaction
                          ?.transaction_id
                      }
                    </p>
                  </div>


                  <div className="rounded-lg bg-white p-4">
                    <p className="text-sm text-slate-500">
                      Status
                    </p>

                    <p
                      className={`mt-1 font-bold ${
                        paymentResult
                          .transaction
                          ?.status ===
                        "SUCCESS"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {
                        paymentResult
                          .transaction
                          ?.status
                      }
                    </p>
                  </div>


                  <div className="rounded-lg bg-white p-4">
                    <p className="text-sm text-slate-500">
                      Amount
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        paymentResult
                          .transaction
                          ?.currency
                      }{" "}
                      {
                        paymentResult
                          .transaction
                          ?.amount
                      }
                    </p>
                  </div>


                  <div className="rounded-lg bg-white p-4">
                    <p className="text-sm text-slate-500">
                      Description
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        paymentResult
                          .transaction
                          ?.description
                      }
                    </p>
                  </div>

                </div>

              </div>
            )}


            {showAddCard && (
              <form
                onSubmit={handleAddCard}
                className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6"
              >

                <h3 className="text-xl font-bold text-slate-900">
                  Add Card
                </h3>


                <div className="mt-6 grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Cardholder Name
                    </label>

                    <input
                      type="text"
                      name="cardholder_name"
                      value={
                        cardForm.cardholder_name
                      }
                      onChange={
                        handleCardChange
                      }
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Name on card"
                    />
                  </div>


                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Card Type
                    </label>

                    <select
                      name="card_type"
                      value={
                        cardForm.card_type
                      }
                      onChange={
                        handleCardChange
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >

                      <option value="VISA">
                        Visa
                      </option>

                      <option value="MASTERCARD">
                        Mastercard
                      </option>

                      <option value="AMEX">
                        American Express
                      </option>

                      <option value="RUPAY">
                        RuPay
                      </option>

                    </select>
                  </div>


                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Card Category
                    </label>

                    <select
                      name="card_category"
                      value={
                        cardForm.card_category
                      }
                      onChange={
                        handleCardChange
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >

                      <option value="CREDIT">
                        Credit
                      </option>

                      <option value="DEBIT">
                        Debit
                      </option>

                    </select>
                  </div>


                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Card Number
                    </label>

                    <input
                      type="text"
                      name="card_number"
                      value={
                        cardForm.card_number
                      }
                      onChange={
                        handleCardChange
                      }
                      required
                      maxLength="19"
                      inputMode="numeric"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Enter card number"
                    />
                  </div>


                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      CVV
                    </label>

                    <input
                      type="password"
                      name="cvv"
                      value={
                        cardForm.cvv
                      }
                      onChange={
                        handleCardChange
                      }
                      required
                      maxLength="4"
                      inputMode="numeric"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="CVV"
                    />
                  </div>


                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Expiry Month
                    </label>

                    <input
                      type="number"
                      name="expiry_month"
                      value={
                        cardForm.expiry_month
                      }
                      onChange={
                        handleCardChange
                      }
                      required
                      min="1"
                      max="12"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="MM"
                    />
                  </div>


                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Expiry Year
                    </label>

                    <input
                      type="number"
                      name="expiry_year"
                      value={
                        cardForm.expiry_year
                      }
                      onChange={
                        handleCardChange
                      }
                      required
                      min="2026"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="YYYY"
                    />
                  </div>

                </div>


                <div className="mt-6 flex justify-end">

                  <button
                    type="submit"
                    disabled={
                      cardLoading
                    }
                    className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cardLoading
                      ? "Adding..."
                      : "Add Card"}
                  </button>

                </div>

              </form>
            )}


            <div className="mt-8">

              {cards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">

                  <h3 className="text-lg font-semibold text-slate-800">
                    No saved cards
                  </h3>

                  <p className="mt-2 text-slate-500">
                    Add your first credit or debit card
                    to continue.
                  </p>

                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white shadow-lg"
                    >

                      <div className="flex items-start justify-between">

                        <div>
                          <p className="text-sm text-slate-300">
                            {card.card_category}
                          </p>

                          <p className="mt-1 text-xl font-bold">
                            {card.card_type}
                          </p>
                        </div>

                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                          ACTIVE
                        </span>

                      </div>


                      <p className="mt-8 text-xl tracking-widest">
                        {card.masked_card_number}
                      </p>


                      <div className="mt-6 flex items-end justify-between">

                        <div>
                          <p className="text-xs text-slate-400">
                            CARDHOLDER
                          </p>

                          <p className="mt-1 font-semibold">
                            {card.cardholder_name}
                          </p>
                        </div>


                        <div>
                          <p className="text-xs text-slate-400">
                            EXPIRY
                          </p>

                          <p className="mt-1 font-semibold">
                            {String(
                              card.expiry_month
                            ).padStart(
                              2,
                              "0"
                            )}
                            /
                            {card.expiry_year}
                          </p>
                        </div>

                      </div>


                      <button
                        onClick={() =>
                          handleDeleteCard(
                            card.id
                          )
                        }
                        className="mt-6 w-full rounded-lg bg-red-500/90 px-4 py-2 font-semibold transition hover:bg-red-500"
                      >
                        Delete Card
                      </button>

                    </div>
                  ))}

                </div>
              )}

            </div>

          </section>

        </main>

      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10">

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">

        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-xl lg:grid-cols-2">

          <div className="hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-center">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
              Assessment 21
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight">
              Credit Card
              <br />
              Payment System
            </h1>

            <p className="mt-6 max-w-md text-slate-300">
              Securely manage your cards, make simulated
              payments, and track your transactions.
            </p>

            <div className="mt-10 space-y-4 text-sm text-slate-300">
              <p>✓ JWT authentication</p>
              <p>✓ Secure card masking</p>
              <p>✓ Payment processing</p>
              <p>✓ Transaction management</p>
            </div>

          </div>


          <div className="p-8 sm:p-12">

            <div className="mx-auto max-w-md">

              <div className="mb-8">

                <h2 className="text-3xl font-bold text-slate-900">
                  {isLogin
                    ? "Welcome back"
                    : "Create account"}
                </h2>

                <p className="mt-2 text-slate-500">
                  {isLogin
                    ? "Login to continue to your account."
                    : "Register to start using the payment system."}
                </p>

              </div>


              {message && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {message}
                </div>
              )}


              {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}


              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Username
                  </label>

                  <input
                    type="text"
                    name="username"
                    value={
                      formData.username
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter username"
                  />

                </div>


                {!isLogin && (
                  <>
                    <div>

                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Email
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={
                          formData.email
                        }
                        onChange={
                          handleChange
                        }
                        required
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Enter email"
                      />

                    </div>


                    <div>

                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Phone Number
                      </label>

                      <input
                        type="tel"
                        name="phone_number"
                        value={
                          formData.phone_number
                        }
                        onChange={
                          handleChange
                        }
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Enter phone number"
                      />

                    </div>
                  </>
                )}


                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={
                      formData.password
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter password"
                  />

                </div>


                {!isLogin && (
                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Confirm Password
                    </label>

                    <input
                      type="password"
                      name="password_confirmation"
                      value={
                        formData.password_confirmation
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Confirm password"
                    />

                  </div>
                )}


                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Please wait..."
                    : isLogin
                      ? "Login"
                      : "Register"}
                </button>

              </form>


              <div className="mt-6 text-center">

                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(
                      !isLogin
                    );

                    setMessage("");
                    setError("");
                  }}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  {isLogin
                    ? "Don't have an account? Register"
                    : "Already have an account? Login"}
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


export default App;