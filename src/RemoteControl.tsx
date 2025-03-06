import { useState, useEffect } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { socket, AVAILABLE_URLS, SOCKET_EVENTS } from "./socket";

const Container = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  color: #333;
  margin: 0;
`;

const KioskLink = styled(Link)`
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  &:hover {
    background: #45a049;
  }
`;

const UrlList = styled.div`
  display: grid;
  gap: 16px;
`;

const UrlCard = styled.div<{ isActive: boolean }>`
  padding: 16px;
  border-radius: 8px;
  background: ${(props) => (props.isActive ? "#e3f2fd" : "#f5f5f5")};
  border: 1px solid ${(props) => (props.isActive ? "#2196f3" : "#ddd")};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UrlText = styled.span`
  font-size: 16px;
  color: #333;
`;

const ActivateButton = styled.button<{ isActive: boolean }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background: ${(props) => (props.isActive ? "#2196f3" : "#666")};
  color: white;
  cursor: ${(props) => (props.isActive ? "default" : "pointer")};
  &:hover {
    background: ${(props) => (props.isActive ? "#2196f3" : "#555")};
  }
`;

const StatusIndicator = styled.div<{ isConnected: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${(props) => (props.isConnected ? "#4CAF50" : "#f44336")};

  &::before {
    content: "";
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${(props) => (props.isConnected ? "#4CAF50" : "#f44336")};
  }
`;

function ControlPanel() {
  const [currentUrl, setCurrentUrl] = useState(AVAILABLE_URLS[0]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Socket connection handlers
    socket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
      // Request current URL state when connected
      socket.emit(SOCKET_EVENTS.REQUEST_CURRENT_URL);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    // Listen for URL changes
    socket.on(SOCKET_EVENTS.CHANGE_URL, (newUrl: string) => {
      console.log("URL changed:", newUrl);
      if (AVAILABLE_URLS.includes(newUrl)) {
        setCurrentUrl(newUrl);
      }
    });

    // Listen for current URL state
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

  const handleUrlChange = (newUrl: string) => {
    setCurrentUrl(newUrl);
    socket.emit(SOCKET_EVENTS.CHANGE_URL, newUrl);
  };

  return (
    <Container>
      <Header>
        <Title>Kiosk Control Panel</Title>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <StatusIndicator isConnected={isConnected}>
            {isConnected ? "Connected" : "Disconnected"}
          </StatusIndicator>
          <KioskLink to="/">View Kiosk</KioskLink>
        </div>
      </Header>

      <UrlList>
        {AVAILABLE_URLS.map((url) => (
          <UrlCard key={url} isActive={url === currentUrl}>
            <UrlText>{url}</UrlText>
            <ActivateButton
              isActive={url === currentUrl}
              onClick={() => url !== currentUrl && handleUrlChange(url)}
              disabled={url === currentUrl}
            >
              {url === currentUrl ? "Active" : "Activate"}
            </ActivateButton>
          </UrlCard>
        ))}
      </UrlList>
    </Container>
  );
}

export default ControlPanel;
