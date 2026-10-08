export const getDashboardSummary = async () => {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    "http://127.0.0.1:8001/dashboard/summary",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Unable to load dashboard summary.");
  }

  return response.json();
};