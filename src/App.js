import { StrictMode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Display from "./Display";
import RemoteControl from "./RemoteControl";

const App = () => {
  return (
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Display />} />
          <Route path="/remote-control" element={<RemoteControl />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>
  );
};

export default App;
