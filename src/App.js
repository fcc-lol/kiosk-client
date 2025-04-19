import { StrictMode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StyleSheetManager } from "styled-components";
import isPropValid from "@emotion/is-prop-valid";
import Display from "./pages/Display";
import RemoteControl from "./pages/RemoteControl";
import Config from "./pages/Config";

const App = () => {
  return (
    <StrictMode>
      <StyleSheetManager shouldForwardProp={isPropValid}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Display />} />
            <Route path="/remote-control" element={<RemoteControl />} />
            <Route path="/config" element={<Config />} />
          </Routes>
        </BrowserRouter>
      </StyleSheetManager>
    </StrictMode>
  );
};

export default App;
