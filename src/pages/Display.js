import { useState, useEffect } from "react";
import styled from "styled-components";
import { socket, SOCKET_EVENTS } from "../socket";
import { fetchAvailableUrlsWithTemplates } from "../api";

const Display = styled.div`
  height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  width: 100vw;
  position: relative;
  margin-top: env(safe-area-inset-top);
  margin-bottom: env(safe-area-inset-bottom);
  overflow: hidden;
  cursor: ${(props) => (props.hideCursor ? "none" : "default")};
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

const FullscreenButton = styled.button`
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 16px);
  right: 16px;
  padding: 12px 16px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
  z-index: 1000;

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.9);
  }
`;

function SpringBoard() {
  const [currentId, setCurrentId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [availableUrls, setAvailableUrls] = useState([]);
  const [pendingId, setPendingId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const showFullscreenButton = urlParams.get("showFullscreenButton") === "true";
  const onDevice = urlParams.get("onDevice") === "true";

  const isAutorotationDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();

    return (
      (year === 2025 && month === 4 && date === 17) || // May 17, 2025
      (year === 2025 && month === 10 && date >= 7 && date <= 9) // Nov 7-9, 2025
    );
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const initialize = async () => {
      socket.emit(SOCKET_EVENTS.REQUEST_CURRENT_URL);

      const urls = await fetchAvailableUrlsWithTemplates();
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
    let rotationInterval;

    const getRandomUrlId = (currentId) => {
      const availableIds = availableUrls
        .map((item) => item.id)
        .filter((id) => id !== currentId); // Exclude current ID to avoid repeats

      if (availableIds.length === 0) return currentId;

      const randomIndex = Math.floor(Math.random() * availableIds.length);
      return availableIds[randomIndex];
    };

    if (isAutorotationDate() && availableUrls.length > 0) {
      rotationInterval = setInterval(() => {
        const nextId = getRandomUrlId(currentId);
        setCurrentId(nextId);
        socket.emit(SOCKET_EVENTS.CHANGE_URL, nextId);
      }, 120000); // 2 minutes
    }

    return () => {
      if (rotationInterval) {
        clearInterval(rotationInterval);
      }
    };
  }, [availableUrls, currentId]);

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

  // Hide cursor if onDevice is true AND either:
  // - showFullscreenButton is false, OR
  // - we are in fullscreen mode
  const hideCursor = onDevice && (!showFullscreenButton || isFullscreen);

  return (
    <Display data-display-route="true" hideCursor={hideCursor}>
      <StatusIndicator isConnected={isConnected} />
      {showFullscreenButton && !isFullscreen && (
        <FullscreenButton onClick={toggleFullscreen}>
          Enter Fullscreen
        </FullscreenButton>
      )}
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
