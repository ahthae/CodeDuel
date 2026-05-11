import Cookies from 'js-cookie';
import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import GameInfo from '@/components/GameInfo';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import styles from "./Game.module.css";

const default_editor_text = `#include <iostream>

using namespace std;

int main(){
    cout << "Hello, world!" << endl;
    return 0;
}
`;

const default_opponent_editor_text = `#include <iostream>

using namespace std;

int main(){
    cout << "Hello, opponent!" << endl;
    return 0;
}
`;

export default function Game() {
	const navigate = useNavigate();
	const { gameId } = useParams();

	const [socket, setSocket] = useState(io(undefined, {autoConnect: false, withCredentials: true}));
    const [problem, setProblem] = useState(null);

	const editorRef = useRef(null);
	const opponentEditorRef = useRef(null);

	useEffect(() => {
		socket.on("connect_error", (err) => {
			console.log(`Socket ${err.name}: ${err.message}`);
			toast.error(`Socket ${err.name}`, {description: `${err.message}`});
			navigate('/dashboard');
		});
		socket.on("error", (args) => {
			switch( args.error_code) {
				case 1:
				case 2:
				case 3:
					console.log("Could not join game: " + args.description);
					toast.error("Error while joining game", {description: `Error message: ${args.description}`});
					navigate('/dashboard');
					break;
			}
		});
		socket.on("connect", () => {
			console.log("Socket connected.\n");
			if (gameId) {
				console.log(`Joining ${gameId}.`);
				joinGame(gameId);
			} else {
				console.log("Creating new game.");
				createGame();
			}
		});
		socket.on("join", (data) => {
			if (data.user_id == Cookies.get("user_id")) {
				navigate("/game/"+data.game_id, { replace: true });
			} else {
				socket.emit("editor_update", editorRef?.current.getValue());
			}
		});
		socket.on("start", async problemId => {
			await updateProblem(problemId);
		});
		socket.on("end", (winner) => {
			sessionStorage.removeItem("game_id");
			sessionStorage.removeItem("editor_content");
			sessionStorage.removeItem("opponent_editor_content");
			// TODO
			// game results screen or navigate?
		});
		socket.on("editor_update", (content) => {
			updateOpponentEditor(content);
		});
		socket.on("submission", (results) => {
			for (const result of results) {
				console.log(`${result.test_case_id}: ${result.status.description}`);
				if (result.compile_output) {
					console.log(atob(result.compile_output));
				}
			}
			// TODO
		});

		socket.connect();

		return () => {
			socket.off("connect_error")
			socket.off("connect")
			socket.off("error")
			socket.off("waiting")
			socket.off("start")
			socket.off("end")
			socket.off("join")
			socket.off("editor_update")
			socket.off("submission")
			socket.disconnect()
			console.log("Socket disconnected.");
		};
	}, [socket]);

	const fetchProblem = async problemId => {
		return await (await fetch(`/api/problem/${problemId}`, {
			headers: { 'X-CSRF-Token': Cookies.get("csrf_access_token") },
			credentials: 'include'
		})).json();
	};

	const updateProblem = async problemId => {
		setProblem(await fetchProblem(problemId));
	}

	const createGame = () => { 
		socket.emit("join");
	}
	const joinGame = (gameId) => { 
		socket.emit("join", gameId);
	};

	const handleEditorMount = (editor, moncaco) => {
		editorRef.current = editor;
	};
	const handleEditorChange = (value) => {
		sessionStorage.setItem("editor_content", value);
		socket.emit("editor_update", value);
	};
	const handleOpponentEditorMount = (editor, moncaco) => {
		opponentEditorRef.current = editor;
	};

	const updateOpponentEditor = (value) => {
		sessionStorage.setItem("opponent_editor_content", value);
		opponentEditorRef?.current?.setValue(value)
	};

	const handleSubmit = () => {
		socket.emit("submission", btoa(editorRef.current.getValue()));
	}

return (
	<ResizablePanelGroup className={styles.leftPanel+" min-h-screen"}>
		<ResizablePanel>
			<ResizablePanelGroup orientation="vertical">
			<ResizablePanel defaultSize="66%">
				<GameInfo problem={problem} onSubmit={handleSubmit}/>
			</ResizablePanel>

			<ResizableHandle />

			<ResizablePanel>
				<Editor
					ref={opponentEditorRef}
					onMount={handleOpponentEditorMount}
					defaultValue={sessionStorage.getItem("opponent_editor_content") ?? default_opponent_editor_text}
					defaultLanguage="cpp"
					theme="vs-dark"
					options={{ readOnly: true }}
				/>
			</ResizablePanel>
			</ResizablePanelGroup>
		</ResizablePanel>

		<ResizableHandle />

		<ResizablePanel defaultSize="66%" className={styles.rightPanel}>
			<Editor
				ref={editorRef}
				onMount={handleEditorMount}
				defaultValue={sessionStorage.getItem("editor_content") ?? default_editor_text}
				defaultLanguage="cpp"
				theme="vs-dark"
				options={{ readOnly: false }}
				onChange={handleEditorChange}
			/>
		</ResizablePanel>
	</ResizablePanelGroup>
);
}
