import { useState, useEffect } from "react";
import styled, { StyleSheetManager } from "styled-components";
import isPropValid from "@emotion/is-prop-valid";
import { socket, SOCKET_EVENTS } from "./socket";
import { fetchAvailableUrls } from "./api";

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
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      socket.emit(SOCKET_EVENTS.REQUEST_CURRENT_URL);

      const urls = await fetchAvailableUrls();
      if (urls.length > 0) {
        setAvailableUrls(urls);
        if (pendingUrl && urls.includes(pendingUrl)) {
          setCurrentUrl(pendingUrl);
          setPendingUrl(null);
        }
      }
    };
    initialize();
  }, [pendingUrl]);

  useEffect(() => {
    const handleCurrentUrlState = (newUrl: string) => {
      if (availableUrls.length === 0) {
        setPendingUrl(newUrl);
      } else if (availableUrls.includes(newUrl)) {
        setCurrentUrl(newUrl);
      } else {
        console.warn("Received invalid URL:", newUrl);
      }
    };

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit(SOCKET_EVENTS.REQUEST_CURRENT_URL);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on(SOCKET_EVENTS.CHANGE_URL, (newUrl: string) => {
      if (availableUrls.includes(newUrl)) {
        setCurrentUrl(newUrl);
      } else {
        console.warn("Received invalid URL:", newUrl);
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
    const preventContextMenu = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);
    return () =>
      document.removeEventListener("contextmenu", preventContextMenu);
  }, []);

  return (
    <StyleSheetManager shouldForwardProp={isPropValid}>
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
    </StyleSheetManager>
  );
}

export default SpringBoard;
