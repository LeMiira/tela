export const getGoldPrices = async () => {
  try {
    const response = await fetch('/api/gold-prices');
    console.log(response);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
