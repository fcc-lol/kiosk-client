import { useState, useEffect } from "react";
import styled from "styled-components";
import { socket, SOCKET_EVENTS, fetchAvailableUrls } from "./socket";

const Display = styled.div`
  height: 100vh;
  width: 100vw;
  position: relative;
`;

const App = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
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
  const [currentUrl, setCurrentUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [availableUrls, setAvailableUrls] = useState<string[]>([]);

  useEffect(() => {
    const loadUrls = async () => {
      const urls = await fetchAvailableUrls();
      if (urls.length > 0) {
        setAvailableUrls(urls);
        if (!urls.includes(currentUrl)) {
          setCurrentUrl(urls[0]);
        }
      }
    };
    loadUrls();
  }, [currentUrl]);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit(SOCKET_EVENTS.REQUEST_CURRENT_URL);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    socket.on(SOCKET_EVENTS.CHANGE_URL, (newUrl: string) => {
      console.log("Received URL change request:", newUrl);
      if (availableUrls.includes(newUrl)) {
        setCurrentUrl(newUrl);
      } else {
        console.warn("Received invalid URL:", newUrl);
      }
    });

    socket.on(SOCKET_EVENTS.CURRENT_URL_STATE, (newUrl: string) => {
      console.log("Received current URL state:", newUrl);
      if (availableUrls.includes(newUrl)) {
        setCurrentUrl(newUrl);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off(SOCKET_EVENTS.CHANGE_URL);
      socket.off(SOCKET_EVENTS.CURRENT_URL_STATE);
    };
  }, [availableUrls]);

  useEffect(() => {
    const preventContextMenu = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);
    return () =>
      document.removeEventListener("contextmenu", preventContextMenu);
  }, []);

  return (
    <Display data-display-route="true">
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
