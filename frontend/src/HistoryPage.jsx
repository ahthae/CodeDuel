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
			<h2 style={{marginTop: 40}}>Past Games</h2>
			<table style={{width: "100%", borderCollapse: "collapse"}}>
				<thead>
					<tr style={{ textAlign: "left", borderBottom: "1px solid #334155"}}>
						<th style={{ padding: 10}}>Opponent</th>
						<th style={{ padding: 10}}>Problem</th>
						<th style={{ padding: 10}}>Result</th>
					</tr>
				</thead>
				<tbody>
					{completed.map((d) => {
						const isPlayer1 = d.player1 === id;
						const opponentId = isPlayer1 ? d.player2 : d.player1;
						const won = (isPlayer1 && d.winner == 1) || (!isPlayer1 && d.winner === 2);
						return (
							<tr key={d.id} style={{ borderBottom: "1px solid #1e293b"}}>
								<td style={{ padding:10 }}>Player #{opponentId}</td>
								<td style={{ padding:10 }}>Problem #{d.problem}</td>
								<td style={{ padding:10, color: won ? "#22c55e" : "#ef4444" }}>
									{won ? "Win" : "Loss"}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}