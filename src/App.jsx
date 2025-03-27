import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { Model } from "./pages/Model";
import { Landing } from "./pages/Landing";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/model" element={<Model />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
