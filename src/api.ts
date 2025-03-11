import { SERVER_URL } from "./socket";

export const fetchAvailableUrls = async (): Promise<string[]> => {
  try {
    const apiKey = new URLSearchParams(window.location.search).get(
      "fcc-api-key"
    );
    const url = new URL(`${SERVER_URL}/urls`);
    if (apiKey) {
      url.searchParams.set("fcc-api-key", apiKey);
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
