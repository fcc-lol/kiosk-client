import { useState, useEffect } from "react";
import styled from "styled-components";
import { socket, SOCKET_EVENTS } from "../socket";
import { fetchAvailableUrls } from "../api";

const Display = styled.div`
  height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  width: 100vw;
  position: relative;
  margin-top: env(safe-area-inset-top);
  margin-bottom: env(safe-area-inset-bottom);
  overflow: hidden;
`;

const App = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
`;

const StatusIndicator = styled.div`
  position: fixed;
  top: calc(env(safe-area-inset-top) + 8px);
  right: 8px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${(props) => (props.isConnected ? "#4CAF50" : "#f44336")};
`;

function SpringBoard() {
  const [currentId, setCurrentId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [availableUrls, setAvailableUrls] = useState([]);
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      socket.emit(SOCKET_EVENTS.REQUEST_CURRENT_URL);

      const urls = await fetchAvailableUrls();
      if (urls.length > 0) {
        setAvailableUrls(urls);
        if (pendingId && urls.some((item) => item.id === pendingId)) {
          setCurrentId(pendingId);
          setPendingId(null);
        }
      }
    };
    initialize();
  }, [pendingId]);

  useEffect(() => {
    const handleCurrentUrlState = (newId) => {
      if (availableUrls.length === 0) {
        setPendingId(newId);
      } else if (availableUrls.some((item) => item.id === newId)) {
        setCurrentId(newId);
      } else {
        console.warn("Received invalid ID:", newId);
      }
    };

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit(SOCKET_EVENTS.REQUEST_CURRENT_URL);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on(SOCKET_EVENTS.CHANGE_URL, (newId) => {
      if (availableUrls.some((item) => item.id === newId)) {
        setCurrentId(newId);
      } else {
        console.warn("Received invalid ID:", newId);
      }
    });

    socket.on(SOCKET_EVENTS.CURRENT_URL_STATE, handleCurrentUrlState);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off(SOCKET_EVENTS.CHANGE_URL);
      socket.off(SOCKET_EVENTS.CURRENT_URL_STATE);
    };
  }, [availableUrls]);

  useEffect(() => {
    const preventContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);
    return () =>
      document.removeEventListener("contextmenu", preventContextMenu);
  }, []);

  const currentUrl = availableUrls.find((item) => item.id === currentId)?.url;

  return (
    <Display data-display-route="true">
      <StatusIndicator isConnected={isConnected} />
      {currentUrl && (
        <App
          src={currentUrl}
          title="Current URL"
          sandbox="allow-same-origin allow-scripts"
        />
      )}
    </Display>
  );
}

export default SpringBoard;
