import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

export default function HistoryPage() {
	const navigate = useNavigate();
	const [duels, setDuels] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const userId = Cookies.get("user_id");

	useEffect(() => {
		if (!userId) {
			navigate("/login");
			return;
		}

	fetch('/api/duel/?player=${userId}', { credentials: "include" })
	.then((res) => {
		if (!res.ok) throw new Error('Server returned ${res.status}');
		return res.json();
	})
	.then((data) => {
		setDuels(data);
		setLoading(false);
	})
	.catch((err) => {
		setError(err.message);
		setLoading(false);
	});
	}, [userId, navigate]);
	
	if (loading) return <div style={{ padding: 40, color: "white" }}>Loading</div>;
	if (error) return <div style={{ padding: 40, color: "white" }}>Error: {error}</div>;

	const id = parseInt(userId);
	const completed = duels.filter((d) => d.winner !== null);
	const gamesPlayed = completed.length;
	const wins = completed.filter((d) => {
		const isPlayer1 = d.player === id;
		return (isPlayer1 && d.winner === 1) || (!isPlayer1 && d.winner === 2);
	}).length;
	const losses = gamesPlayed - wins;
	const winRatio = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

	return (
		<div style={{ padding: 40, color: "white"}}>
			<h1>My History</h1>
			<button onClick={() => navigate("/dashboard")}>Back</button>
			<div style={{ marginTop: 30, display: "flex, gap:30 "}}>
				<div><h2>{gamesPlayed}</h2><p>Games Played</p></div>
				<div><h2>{wins}</h2><p>Wins</p></div>
				<div><h2>{losses}</h2><p>Losses</p></div>
				<div><h2>{winRatio}%</h2><p>Win Rate</p></div>
			</div>
			
		</div>
	);
}