export const getGoldPrices = async () => {
  const response = await fetch(
    import.meta.env.PROD
      ? "https://tela-backend.onrender.com/api/gold-prices"
      : "/api/gold-prices"
  );

  if (!response.ok) throw new Error("Network response was not ok");
  return await response.json();
};
