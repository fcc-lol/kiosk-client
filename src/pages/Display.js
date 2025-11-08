import { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { socket, SOCKET_EVENTS, getScreenFromUrl } from "../socket";
import { fetchAvailableUrlsWithTemplates } from "../api";

const Display = styled.div`
  height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - ${(props) => props.topOffset || 0}px - ${(props) => props.bottomOffset || 0}px);
  width: 100vw;
  position: relative;
  margin-top: calc(env(safe-area-inset-top) + ${(props) => props.topOffset || 0}px);
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
  position: absolute;
  top: 0;
  left: 0;
  opacity: ${(props) => props.opacity || 1};
  visibility: ${(props) => (props.hidden ? "hidden" : "visible")};
  transition: opacity 0.5s ease-in-out;
  pointer-events: ${(props) => (props.hidden ? "none" : "auto")};
`;

const BlackOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: black;
  opacity: ${(props) => props.opacity || 0};
  transition: opacity 0.5s ease-in-out;
  pointer-events: none;
  z-index: 10;
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
  const [nextId, setNextId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [availableUrls, setAvailableUrls] = useState([]);
  const [pendingId, setPendingId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCurrent, setShowCurrent] = useState(true);
  const [blackOverlayOpacity, setBlackOverlayOpacity] = useState(0);
  const [iframe1Id, setIframe1Id] = useState("");
  const [iframe2Id, setIframe2Id] = useState("");

  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const screen = getScreenFromUrl();
  const showFullscreenButton = urlParams.get("showFullscreenButton") === "true";
  const onDevice = urlParams.get("onDevice") === "true";
  const slideshowMode = urlParams.get("slideshow") === "true";
  const topOffset = parseInt(urlParams.get("topOffset") || "0", 10);
  const bottomOffset = parseInt(urlParams.get("bottomOffset") || "0", 10);
  // Rotation interval in seconds (default: 30 seconds)
  const rotationIntervalSeconds = parseInt(
    urlParams.get("rotationInterval") || "60",
    10
  );
  const rotationIntervalMs = rotationIntervalSeconds * 1000;

  const shouldAutorotate = useCallback(() => {
    return slideshowMode;
  }, [slideshowMode]);

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

  const getRandomUrlId = useCallback(
    (excludeId) => {
      const availableIds = availableUrls
        .map((item) => item.id)
        .filter((id) => id !== excludeId); // Exclude specified ID to avoid repeats

      if (availableIds.length === 0) return excludeId;

      const randomIndex = Math.floor(Math.random() * availableIds.length);
      return availableIds[randomIndex];
    },
    [availableUrls]
  );

  // Initialize iframe IDs when slideshow mode starts
  useEffect(() => {
    if (
      shouldAutorotate() &&
      availableUrls.length > 1 &&
      currentId &&
      !iframe1Id
    ) {
      // Initialize both iframes on first load
      setIframe1Id(currentId);
      const prefetchNextId = getRandomUrlId(currentId);
      setNextId(prefetchNextId);
      setIframe2Id(prefetchNextId);
    }
  }, [currentId, availableUrls, shouldAutorotate, getRandomUrlId, iframe1Id]);

  // Transition to next iframe
  const transitionToNext = useCallback(() => {
    if (isTransitioning || !nextId || !availableUrls.length) return;

    setIsTransitioning(true);

    // Step 1: Fade to black (500ms)
    setBlackOverlayOpacity(1);

    setTimeout(() => {
      // Step 2: Switch which iframe is visible
      setShowCurrent((prevShowCurrent) => {
        const newShowCurrent = !prevShowCurrent;

        // Update current ID
        setCurrentId(nextId);
        socket.emit(SOCKET_EVENTS.CHANGE_URL, { id: nextId, screen });

        // Calculate next URL for prefetching
        const availableIds = availableUrls
          .map((item) => item.id)
          .filter((id) => id !== nextId);
        const newNextId =
          availableIds.length > 0
            ? availableIds[Math.floor(Math.random() * availableIds.length)]
            : nextId;

        setNextId(newNextId);

        // Update the hidden iframe with the new next URL
        if (newShowCurrent) {
          // iframe1 is now visible (showing nextId), update iframe2 with newNextId
          setIframe2Id(newNextId);
        } else {
          // iframe2 is now visible (showing nextId), update iframe1 with newNextId
          setIframe1Id(newNextId);
        }

        return newShowCurrent;
      });

      // Step 3: Fade from black (500ms)
      setBlackOverlayOpacity(0);

      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 500);
  }, [isTransitioning, nextId, availableUrls, screen]);

  // Store latest transitionToNext in a ref
  const transitionToNextRef = useRef(transitionToNext);
  useEffect(() => {
    transitionToNextRef.current = transitionToNext;
  }, [transitionToNext]);

  useEffect(() => {
    let rotationInterval;

    if (shouldAutorotate() && availableUrls.length > 0 && nextId) {
      rotationInterval = setInterval(() => {
        transitionToNextRef.current();
      }, rotationIntervalMs);
    }

    return () => {
      if (rotationInterval) {
        clearInterval(rotationInterval);
      }
    };
  }, [availableUrls, shouldAutorotate, rotationIntervalMs, nextId]);

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

  const currentUrl = availableUrls.find((item) => item.id === currentId)?.url;
  const iframe1Url = availableUrls.find((item) => item.id === iframe1Id)?.url;
  const iframe2Url = availableUrls.find((item) => item.id === iframe2Id)?.url;

  // Hide cursor if onDevice is true AND either:
  // - showFullscreenButton is false, OR
  // - we are in fullscreen mode
  const hideCursor = onDevice && (!showFullscreenButton || isFullscreen);

  // In slideshow mode, we have two iframes and alternate between them
  // In normal mode, we just show the current iframe
  const useDoubleBuffer = shouldAutorotate() && availableUrls.length > 1;

  return (
    <Display data-display-route="true" hideCursor={hideCursor} topOffset={topOffset} bottomOffset={bottomOffset}>
      <StatusIndicator isConnected={isConnected} />
      {showFullscreenButton && !isFullscreen && (
        <FullscreenButton onClick={toggleFullscreen}>
          Enter Fullscreen
        </FullscreenButton>
      )}

      {useDoubleBuffer ? (
        <>
          {/* iframe1 (visible when showCurrent is true) */}
          {iframe1Url && (
            <App
              key="iframe1"
              src={iframe1Url}
              title="Iframe 1"
              sandbox="allow-same-origin allow-scripts"
              hidden={!showCurrent}
              opacity={showCurrent ? 1 : 0}
            />
          )}

          {/* iframe2 (visible when showCurrent is false) */}
          {iframe2Url && (
            <App
              key="iframe2"
              src={iframe2Url}
              title="Iframe 2"
              sandbox="allow-same-origin allow-scripts"
              hidden={showCurrent}
              opacity={showCurrent ? 0 : 1}
            />
          )}

          {/* Black overlay for transitions */}
          <BlackOverlay opacity={blackOverlayOpacity} />
        </>
      ) : (
        <>
          {/* Normal mode - single iframe */}
          {currentUrl && (
            <App
              src={currentUrl}
              title="Current URL"
              sandbox="allow-same-origin allow-scripts"
            />
          )}
        </>
      )}
    </Display>
  );
}

export default SpringBoard;
