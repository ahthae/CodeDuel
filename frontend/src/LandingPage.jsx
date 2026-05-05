import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import "./App.css"

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <h1 className="title">CodeDuel</h1>

      <p className="subtitle">1v1 Real-Time Coding Battles</p>

      <div className="button-group">
        <button className="btn login" onClick={() => navigate("/login")}>
          Login
        </button>

        <button className="btn register" onClick={() => navigate("/register")}>
          Register
        </button>
      </div>

    </div>
  );
}