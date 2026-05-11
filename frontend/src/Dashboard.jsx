import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");

  const handleFindMatch = () => {
    navigate("/game");
  };

  const handleCreateRoom = () => {
    sessionStorage.removeItem("editor_content");
    sessionStorage.removeItem("opponent_editor_content");
    navigate("/game");
  };

  const handleJoinRoom = () => {
    navigate("/game/"+roomCode);
  };

  const handleViewHistory = () => {
	navigate("/history");
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">CodeDuel</h1>

      <p className="dashboard-subtitle">
        Challenge other developers in real-time coding duels
      </p>

      <div className="dashboard-card">
        <button className="primary-btn" onClick={handleFindMatch}>
          ⚔️ Find Match (1v1)
        </button>
      </div>

      <div className="dashboard-card">
        <button className="secondary-btn" onClick={handleCreateRoom}>
          ➕ Create Private Room
        </button>
      </div>

      <div className="dashboard-card">
        <h3>Join Room</h3>

        <input
          className="dashboard-input"
          placeholder="Enter room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />

        <button className="secondary-btn" onClick={handleJoinRoom}>
          Join
        </button>
      </div>
	  <div className="dashboard-card">
		<button className="secondary-btn" onClick={handleViewHistory}>
			My History
		</button>
	  </div>
    </div>
  );
}