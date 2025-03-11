import { io } from "socket.io-client";

// Socket event names
export const SOCKET_EVENTS = {
  CHANGE_URL: "changeUrl",
  REQUEST_CURRENT_URL: "requestCurrentUrl",
  CURRENT_URL_STATE: "currentUrlState"
} as const;

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

// Initialize socket connection
export const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});

// Function to fetch available URLs from the server
export const fetchAvailableUrls = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${SERVER_URL}/urls`);
    if (!response.ok) {
      throw new Error("Failed to fetch URLs");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching URLs:", error);
    return [];
  }
};
