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

// Export the list of available URLs so it's consistent across components
export const AVAILABLE_URLS = [
  "https://example.com",
  "https://byt.fcc.lol?onDevice=true",
  "https://intake.fcc.lol",
  "https://coffee.nearby.land",
  "https://stoptheft.propel.app",
  "https://nyc-traffic-cameras.leo.gd"
];
