import { useState, useEffect } from "react";
import styled, { StyleSheetManager } from "styled-components";
import isPropValid from "@emotion/is-prop-valid";
import { socket, SOCKET_EVENTS } from "./socket";
import { fetchAvailableUrls } from "./api";

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

function RemoteControl() {
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
      }
    };

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit(SOCKET_EVENTS.REQUEST_CURRENT_URL);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    socket.on(SOCKET_EVENTS.CURRENT_URL_STATE, handleCurrentUrlState);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off(SOCKET_EVENTS.CURRENT_URL_STATE);
    };
  }, [availableUrls]);

  const handleUrlChange = (newUrl: string) => {
    if (newUrl !== currentUrl) {
      setCurrentUrl(newUrl);
      socket.emit(SOCKET_EVENTS.CHANGE_URL, newUrl);
    }
  };

  return (
    <StyleSheetManager shouldForwardProp={isPropValid}>
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
              onClick={() => handleUrlChange(url)}
            >
              {url.replace("https://", "").split("?")[0]}
            </App>
          ))}
        </AppSwitcher>
      </Container>
    </StyleSheetManager>
  );
}

export default RemoteControl;
