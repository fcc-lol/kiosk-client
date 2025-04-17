const API_SERVER_URL = process.env.REACT_APP_API_SERVER_URL;

export const fetchAvailableUrls = async () => {
  try {
    const apiKey = new URLSearchParams(window.location.search).get("fccApiKey");
    const url = new URL(`${API_SERVER_URL}/urls`);
    if (apiKey) {
      url.searchParams.set("fccApiKey", apiKey);
    }
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error("Failed to fetch URLs");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching URLs:", error);
    return [];
  }
};
