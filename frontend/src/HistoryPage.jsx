import { useNavigate } from "react-router-dom";

export default function HistoryPage() {
	const navigate = useNavigate();
	return (
		<div style={{ padding: 40, color: "white"}}>
			<h1>My History</h1>
			<p>In Progress</p>
			<button onClick={() => navigate("/dashboard")}>Back</button>
		</div>
	);
}