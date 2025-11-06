import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { socket, SOCKET_EVENTS, getScreenFromUrl } from "../socket";
import { fetchAvailableUrlsWithTemplates } from "../api";

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  overflow-y: scroll;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: auto; /* No smooth scrolling */
  cursor: ${(props) => (props.hideCursor ? "none" : "default")};
`;

const FrameWrapper = styled.div`
  height: 100vh;
  width: 100vw;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  position: relative;
`;

const Frame = styled.iframe`
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
  z-index: 1000;
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

const Label = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  z-index: 10;
  pointer-events: none;
`;

function DisplayPreload() {
  const [currentId, setCurrentId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [availableUrls, setAvailableUrls] = useState([]);
  const [pendingId, setPendingId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const frameRefs = useRef({});

  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const screen = getScreenFromUrl();
  const showFullscreenButton = urlParams.get("showFullscreenButton") === "true";
  const onDevice = urlParams.get("onDevice") === "true";
  const showLabels = urlParams.get("showLabels") === "true";

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
      socket.emit(SOCKET_EVENTS.REQUEST_CURRENT_URL, { screen });

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
  }, [pendingId, screen]);

  // Scroll to the current ID when it changes
  useEffect(() => {
    if (currentId && frameRefs.current[currentId] && containerRef.current) {
      const frameElement = frameRefs.current[currentId];

      // Scroll to the frame without animation using scrollIntoView
      frameElement.scrollIntoView({
        behavior: "auto", // No animation
        block: "start",
        inline: "nearest"
      });

      console.log("Scrolled to frame:", currentId);
    }
  }, [currentId]);

  useEffect(() => {
    const handleCurrentUrlState = (data) => {
      // Handle both old format (string) and new format (object)
      if (typeof data === "string") {
        // Legacy format
        if (availableUrls.length === 0) {
          setPendingId(data);
        } else if (availableUrls.some((item) => item.id === data)) {
          setCurrentId(data);
        } else {
          console.warn("Received invalid ID:", data);
        }
      } else if (data && data.screen === screen) {
        // New format with screen parameter
        const newId = data.id;
        if (availableUrls.length === 0) {
          setPendingId(newId);
        } else if (availableUrls.some((item) => item.id === newId)) {
          setCurrentId(newId);
        } else {
          console.warn("Received invalid ID:", newId);
        }
      }
    };

    const handleCurrentUrlStates = (states) => {
      // Handle initial state broadcast with all screens
      if (states && states[screen]) {
        const newId = states[screen];
        if (availableUrls.length === 0) {
          setPendingId(newId);
        } else if (availableUrls.some((item) => item.id === newId)) {
          setCurrentId(newId);
        }
      }
    };

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit(SOCKET_EVENTS.REQUEST_CURRENT_URL, { screen });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on(SOCKET_EVENTS.CURRENT_URL_STATE, handleCurrentUrlState);
    socket.on(SOCKET_EVENTS.CURRENT_URL_STATES, handleCurrentUrlStates);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off(SOCKET_EVENTS.CURRENT_URL_STATE);
      socket.off(SOCKET_EVENTS.CURRENT_URL_STATES);
    };
  }, [availableUrls, screen]);

  useEffect(() => {
    const preventContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);
    return () =>
      document.removeEventListener("contextmenu", preventContextMenu);
  }, []);

  // Hide cursor if onDevice is true AND either:
  // - showFullscreenButton is false, OR
  // - we are in fullscreen mode
  const hideCursor = onDevice && (!showFullscreenButton || isFullscreen);

  return (
    <>
      <StatusIndicator isConnected={isConnected} />
      {showFullscreenButton && !isFullscreen && (
        <FullscreenButton onClick={toggleFullscreen}>
          Enter Fullscreen
        </FullscreenButton>
      )}

      <Container
        ref={containerRef}
        hideCursor={hideCursor}
        data-display-route="true"
      >
        {availableUrls.map((item) => (
          <FrameWrapper
            key={item.id}
            ref={(el) => {
              if (el) {
                frameRefs.current[item.id] = el;
              }
            }}
          >
            {showLabels && <Label>{item.title || item.id}</Label>}
            <Frame
              src={item.url}
              title={item.title || item.id}
              sandbox="allow-same-origin allow-scripts"
            />
          </FrameWrapper>
        ))}
      </Container>
    </>
  );
}

export default DisplayPreload;
