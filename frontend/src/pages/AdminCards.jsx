import { useEffect, useState } from "react";
import api from "../api";

function AdminCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCards = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/admin/cards/");
      setCards(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load card management."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const updateCard = async (cardId, data) => {
    try {
      setMessage("");
      setError("");

      await api.patch(`/api/admin/cards/${cardId}/`, data);

      setMessage("Card updated successfully.");
      await loadCards();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to update card."
      );
    }
  };

  const toggleCard = (card) => {
    updateCard(card.id, {
      is_active: !card.is_active,
    });
  };

  const updateLimit = (card) => {
    const value = window.prompt(
      "Enter new credit limit:",
      card.credit_limit
    );

    if (value === null) {
      return;
    }

    const limit = Number(value);

    if (!Number.isFinite(limit) || limit < 0) {
      setError("Credit limit must be a valid non-negative number.");
      return;
    }

    updateCard(card.id, {
      credit_limit: limit,
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">ADMINISTRATION</div>
          <h1>Card Management</h1>
          <p>
            View, block, unblock, and manage customer credit cards.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={loadCards}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="card-management-container">
        {loading ? (
          <div className="empty-state">
            Loading cards...
          </div>
        ) : cards.length === 0 ? (
          <div className="empty-state">
            No cards found.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Cardholder</th>
                  <th>Card</th>
                  <th>Type</th>
                  <th>Expiry</th>
                  <th>Credit Limit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {cards.map((card) => (
                  <tr key={card.id}>
                    <td>{card.id}</td>

                    <td>
                      {card.username}
                    </td>

                    <td>
                      {card.cardholder_name}
                    </td>

                    <td>
                      {card.masked_card_number}
                    </td>

                    <td>
                      {card.card_type}
                    </td>

                    <td>
                      {String(card.expiry_month).padStart(2, "0")}/
                      {card.expiry_year}
                    </td>

                    <td>
                      ₹{Number(card.credit_limit).toFixed(2)}
                    </td>

                    <td>
                      <span
                        className={
                          card.is_active
                            ? "status-active"
                            : "status-blocked"
                        }
                      >
                        {card.is_active
                          ? "ACTIVE"
                          : "BLOCKED"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-card-actions">
                        <button
                          className={
                            card.is_active
                              ? "danger-button"
                              : "success-button"
                          }
                          onClick={() =>
                            toggleCard(card)
                          }
                        >
                          {card.is_active
                            ? "Block"
                            : "Unblock"}
                        </button>

                        <button
                          className="secondary-button"
                          onClick={() =>
                            updateLimit(card)
                          }
                        >
                          Credit Limit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCards;