import { useState, useEffect } from "react";
import styled from "styled-components";
import { socket, SOCKET_EVENTS } from "../socket";
import { fetchAvailableUrls } from "../api";

const Container = styled.div`
  padding: 1rem 1rem 1.5rem 1rem;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
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
`;

const App = styled.div`
  padding: 1.25rem 2rem;
  border-radius: 3rem;
  background: ${(props) =>
    props.isActive ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.1)"};
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  color: ${(props) =>
    props.isActive ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 1)"};
  text-align: left;
  font-size: 1.5rem;
  font-weight: bold;
`;

const StatusIndicator = styled.div`
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
      }
    };

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit(SOCKET_EVENTS.REQUEST_CURRENT_URL);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on(SOCKET_EVENTS.CURRENT_URL_STATE, handleCurrentUrlState);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off(SOCKET_EVENTS.CURRENT_URL_STATE);
    };
  }, [availableUrls]);

  const handleUrlChange = (newId) => {
    if (newId !== currentId) {
      setCurrentId(newId);
      socket.emit(SOCKET_EVENTS.CHANGE_URL, newId);
    }
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
        {availableUrls.map((item) => (
          <App
            key={item.id}
            isActive={item.id === currentId}
            onClick={() => handleUrlChange(item.id)}
          >
            {item.title}
          </App>
        ))}
      </AppSwitcher>
    </Container>
  );
}

export default RemoteControl;
