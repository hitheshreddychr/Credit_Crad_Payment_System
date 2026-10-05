import api from "../api";

export const getCards = () =>
  api.get("/api/cards/");

export const createCard = (data) =>
  api.post("/api/cards/", data);

export const deleteCard = (id) =>
  api.delete(`/api/cards/${id}/`);