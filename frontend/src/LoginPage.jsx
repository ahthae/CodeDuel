import Cookies from "js-cookie";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "X-CSRF-Token": Cookies.get('csrf_access_token') // needed for JWT dobule submit
        },
        credentials: "include", // important for JWT cookies
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

    if (response.ok) {
      navigate("/dashboard");
    } else {
      alert(data.message || "Request failed");
    }

    } catch (error) {
      console.error("Login error:", error);
      alert("Server error. Is your backend running?");
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>

      <form onSubmit={handleLogin} className="auth-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}