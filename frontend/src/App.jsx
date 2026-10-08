import { useEffect, useState } from "react";
import api from "./api";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cards from "./pages/Cards";
import Payment from "./pages/Payment";
import Transactions from "./pages/Transactions";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCards from "./pages/AdminCards";
import Statements from "./pages/Statements";

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [page, setPage] = useState("dashboard");
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [statementLoading, setStatementLoading] = useState(false);

  const isAdmin = Boolean(
    user?.is_admin || user?.is_staff
  );

  const getError = (err, fallback) => {
    const data = err.response?.data;

    if (data?.message) {
      return data.message;
    }

    if (data && typeof data === "object") {
      return Object.values(data).flat().join(" ");
    }

    return fallback;
  };

  const loadCards = async () => {
    try {
      const response = await api.get("/api/cards/");
      setCards(response.data);
    } catch {
      setError("Unable to load saved cards.");
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await api.get(
        "/api/payments/history/"
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setTransactions(data);
      } else if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      } else if (Array.isArray(data.results)) {
        setTransactions(data.results);
      } else {
        setTransactions([]);
      }
    } catch {
      setError("Unable to load transaction history.");
    }
  };

  useEffect(() => {
    if (user) {
      loadCards();
      loadTransactions();
    }
  }, [user]);

  const handleLogin = (response) => {
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
      JSON.stringify(response.data.user)
    );

    setUser(response.data.user);
    setPage("dashboard");
    setMessage("Login successful.");
    setError("");
  };

  const handleLogout = async () => {
    const refreshToken =
      localStorage.getItem("refresh_token");

    try {
      if (refreshToken) {
        await api.post("/api/auth/logout/", {
          refresh: refreshToken,
        });
      }
    } catch {
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      setUser(null);
      setCards([]);
      setTransactions([]);
      setPage("dashboard");
    }
  };

  const addCard = async (cardData) => {
    try {
      const response = await api.post(
        "/api/cards/",
        {
          ...cardData,
          expiry_month: Number(
            cardData.expiry_month
          ),
          expiry_year: Number(
            cardData.expiry_year
          ),
        }
      );

      setCards((current) => [
        response.data,
        ...current,
      ]);

      setMessage("Card added successfully.");
      setError("");

      return true;
    } catch (err) {
      setError(
        getError(
          err,
          "Unable to add card."
        )
      );

      return false;
    }
  };

  const deleteCard = async (cardId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this card?"
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/api/cards/${cardId}/`
      );

      setCards((current) =>
        current.filter(
          (card) => card.id !== cardId
        )
      );

      setMessage("Card deleted successfully.");
      setError("");
    } catch {
      setError("Unable to delete card.");
    }
  };

  const makePayment = async (paymentData) => {
    try {
      const response = await api.post(
        "/api/payments/process/",
        {
          card_id: Number(
            paymentData.card_id
          ),
          amount: Number(
            paymentData.amount
          ),
          currency: paymentData.currency,
          description:
            paymentData.description,
        }
      );

      await loadTransactions();

      setMessage(
        response.data.message ||
          "Payment processed successfully."
      );

      setError("");

      return response.data;
    } catch (err) {
      setError(
        getError(
          err,
          "Unable to process payment."
        )
      );

      return null;
    }
  };

  const downloadStatement = async () => {
    setStatementLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await api.get(
        "/api/statements/monthly/",
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download =
        "monthly_statement.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setMessage(
        "Monthly statement downloaded successfully."
      );
    } catch {
      setError(
        "Unable to download monthly statement."
      );
    } finally {
      setStatementLoading(false);
    }
  };

  const showPage = () => {
    if (page === "cards") {
      return (
        <Cards
          cards={cards}
          addCard={addCard}
          deleteCard={deleteCard}
        />
      );
    }

    if (page === "payment") {
      return (
        <Payment
          cards={cards}
          makePayment={makePayment}
        />
      );
    }

    if (page === "transactions") {
      return (
        <Transactions
          transactions={transactions}
          refresh={loadTransactions}
        />
      );
    }

    if (page === "statements") {
      return (
        <Statements
          downloadStatement={
            downloadStatement
          }
          loading={statementLoading}
        />
      );
    }

    if (
      (page === "admin-cards" ||
        page === "adminCards") &&
      isAdmin
    ) {
      return <AdminCards />;
    }

    if (page === "admin" && isAdmin) {
      return <AdminDashboard />;
    }

    return (
      <Dashboard
        user={user}
        cards={cards}
        transactions={transactions}
        goTo={setPage}
      />
    );
  };

  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
      />
    );
  }

  return (
    <Layout
      user={user}
      page={page}
      setPage={setPage}
      isAdmin={isAdmin}
      onLogout={handleLogout}
      message={message}
      error={error}
      clearMessages={() => {
        setMessage("");
        setError("");
      }}
    >
      {showPage()}
    </Layout>
  );
}

export default App;