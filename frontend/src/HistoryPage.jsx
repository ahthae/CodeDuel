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

	return (
		<div style={{ padding: 40, color: "white"}}>
			<h1>My History</h1>
			<button onClick={() => navigate("/dashboard")}>Back</button>
			<p>Total duels: {duels.length}</p>
			<pre style={{ marginTop: 20, fontSize: 12 }}>
				{JSON.stringify(duels, null, 2)}
			</pre>
			
		</div>
	);
}