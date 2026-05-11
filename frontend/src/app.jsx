import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import Game from "./components/Game";
import Dashboard from "./Dashboard";
import HistoryPage from "./HistoryPage";
import '@/index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/game/:gameId?" element={<Game/>} />
		<Route path="/history" element={<HistoryPage/>} />
      </Routes>
    </BrowserRouter>
  );
}