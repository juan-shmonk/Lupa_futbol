import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import LandingPage from "./landing/LandingPage";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app/*" element={<App />} />
    </Routes>
  </BrowserRouter>
);
