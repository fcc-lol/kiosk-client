import { io } from "socket.io-client";

export const SOCKET_EVENTS = {
  CHANGE_URL: "changeUrl",
  REQUEST_CURRENT_URL: "requestCurrentUrl",
  CURRENT_URL_STATE: "currentUrlState"
} as const;

export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});
