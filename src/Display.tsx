import { useState, useEffect } from "react";
import styled from "styled-components";
import { socket, AVAILABLE_URLS, SOCKET_EVENTS } from "./socket";

const Display = styled.div`
  height: 100vh;
  width: 100vw;
  position: relative;
  cursor: none !important;

  * {
    cursor: none !important;
  }
`;

const CursorHider = styled.button`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
  cursor: none !important;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  border: none;
  background: red;
  outline: none;

  * {
    cursor: none !important;
  }
`;

const App = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  cursor: none !important;

  * {
    cursor: none !important;
  }
`;

const StatusIndicator = styled.div<{ isConnected: boolean }>`
  position: fixed;
  top: 8px;
  right: 8px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${(props) => (props.isConnected ? "#4CAF50" : "#f44336")};
`;

function SpringBoard() {
  const [currentUrl, setCurrentUrl] = useState(AVAILABLE_URLS[0]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
      socket.emit(SOCKET_EVENTS.REQUEST_CURRENT_URL);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    socket.on(SOCKET_EVENTS.CHANGE_URL, (newUrl: string) => {
      console.log("Received URL change request:", newUrl);
      if (AVAILABLE_URLS.includes(newUrl)) {
        setCurrentUrl(newUrl);
      } else {
        console.warn("Received invalid URL:", newUrl);
      }
    });

    socket.on(SOCKET_EVENTS.CURRENT_URL_STATE, (newUrl: string) => {
      console.log("Received current URL state:", newUrl);
      if (AVAILABLE_URLS.includes(newUrl)) {
        setCurrentUrl(newUrl);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off(SOCKET_EVENTS.CHANGE_URL);
      socket.off(SOCKET_EVENTS.CURRENT_URL_STATE);
    };
  }, []);

  return (
    <Display>
      <CursorHider autoFocus />
      <StatusIndicator isConnected={isConnected} />
      <App
        src={currentUrl}
        title="Current URL"
        sandbox="allow-same-origin allow-scripts"
      />
    </Display>
  );
}

export default SpringBoard;
