import { io } from "socket.io-client";

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL;

export const SOCKET_EVENTS = {
  CHANGE_URL: "changeUrl",
  REQUEST_CURRENT_URL: "requestCurrentUrl",
  CURRENT_URL_STATE: "currentUrlState",
  ERROR: "error"
};

export const socket = io(SOCKET_SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});
