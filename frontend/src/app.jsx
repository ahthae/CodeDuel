import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import Duel from "./components/Duel";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/duel" element={<Duel/>} />
      </Routes>
    </BrowserRouter>
  );
}