import { useState, useEffect } from "react";
import styled from "styled-components";
import { socket, SOCKET_EVENTS, fetchAvailableUrls } from "./socket";

const Container = styled.div`
  padding: 20px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  color: #fff;
  margin: 0;

  @media (max-width: 600px) {
    font-size: 24px;
  }
`;

const AppSwitcher = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const App = styled.div<{ $isActive: boolean }>`
  padding: 1.25rem 2rem;
  border-radius: 3rem;
  background: ${(props) =>
    props.$isActive ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.1)"};
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  color: ${(props) =>
    props.$isActive ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 1)"};
  text-align: left;
  font-size: 1.5rem;
  font-weight: bold;
`;

const StatusIndicator = styled.div<{ $isConnected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${(props) => (props.$isConnected ? "#4CAF50" : "#f44336")};
  white-space: nowrap;
  font-size: 1rem;

  &::before {
    content: "";
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: ${(props) => (props.$isConnected ? "#4CAF50" : "#f44336")};
  }
`;

function ControlPanel() {
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
      console.log("URL changed:", newUrl);
      if (availableUrls.includes(newUrl)) {
        setCurrentUrl(newUrl);
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

  const handleUrlChange = (newUrl: string) => {
    setCurrentUrl(newUrl);
    socket.emit(SOCKET_EVENTS.CHANGE_URL, newUrl);
  };

  return (
    <Container>
      <Header>
        <Title>Remote Control</Title>
        <StatusIndicator $isConnected={isConnected}>
          {isConnected ? "Connected" : "Disconnected"}
        </StatusIndicator>
      </Header>

      <AppSwitcher>
        {availableUrls.map((url) => (
          <App
            key={url}
            $isActive={url === currentUrl}
            onClick={() => url !== currentUrl && handleUrlChange(url)}
          >
            {url.replace("https://", "").split("?")[0]}
          </App>
        ))}
      </AppSwitcher>
    </Container>
  );
}

export default ControlPanel;
