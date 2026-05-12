import { BrowserRouter, Routes, Route } from "react-router";
import { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import Game from "./components/Game";
import Dashboard from "./Dashboard";
import HistoryPage from "./HistoryPage";
import '@/index.css'

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
	  const savedUser = localStorage.getItem("user");
	  if (savedUser) {
		setUser(JSON.parse(savedUser));
	  }
  }, []);
	
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage setUser={setUser}/>} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard user={user}/>} />
        <Route path="/game/:gameId?" element={<Game user={user}/>} />
        <Route path="/history" element={<HistoryPage user={user}/>} />
      </Routes>
    </BrowserRouter>
  );
}
