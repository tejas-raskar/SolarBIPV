import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { Model } from "./pages/Model";
import { Landing } from "./pages/Landing";
import { Docs } from "./pages/Docs";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/model" element={<Model />} />
        <Route path="/how-it-works" element={<Docs />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
