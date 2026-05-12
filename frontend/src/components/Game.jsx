import Cookies from 'js-cookie';
import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

// Decodes a base 64 encoded UTF-8 string as sent by Judge0 into a UTF-16 JavaScript string
function decodeResultBase64(base64) {
	return new TextDecoder().decode(Uint8Array.from(atob(base64), m => m.codePointAt(0)));
}

export default function Game() {
	const navigate = useNavigate();
	const params = useParams();
	const gameId = params.gameId;

	const [socket, setSocket] = useState(io(import.meta.env.VITE_SOCKET_URL || undefined, {autoConnect: false, withCredentials: true, transports: ['websocket']}));
    const [problem, setProblem] = useState(null);
    const [testCaseResults, setTestCaseResults] = useState([]);
	const [ended, setEnded] = useState(false);
	const [game, setGame] = useState(null);
	const [resultDialogOpen, setResultDialogOpen] = useState(ended);

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
		socket.on("end", async winnerIdx => {
			const game = await fetchGame(gameId);
			setGame(game);
			handleGameEnd(game);
		});
		socket.on("editor_update", (content) => {
			updateOpponentEditor(content);
		});
		socket.on("submission", (results) => {
			for (const result of results) {
				if (result.compile_output) result.compile_output = decodeResultBase64(result.compile_output);
				if (result.stdout) result.stdout = decodeResultBase64(result.stdout);
				if (result.stderr) result.stderr = decodeResultBase64(result.stderr);
			}
			setTestCaseResults(results);
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
	}, [socket, gameId]);

	// Fetch the inital state of the game
	useEffect(() => {
		async function startFetchGame(gameId) {
			const game = await fetchGame(gameId);
			if (!ignore && game) {
				setGame(game);
				if (game.winner) { handleGameEnd(game); }
			}
		}

		let ignore = false;
		startFetchGame(gameId);
		return () => ignore = true;
	}, []);

	const fetchGame = async id => {
		if (!id) return;
		return await (await fetch(`/api/duel/${id}`, {
			headers: { 'X-CSRF-Token': Cookies.get("csrf_access_token") },
			credentials: 'include'
		})).json();
	}

	const fetchProblem = async problemId => {
		return await (await fetch(`/api/problem/${problemId}`, {
			headers: { 'X-CSRF-Token': Cookies.get("csrf_access_token") },
			credentials: 'include'
		})).json();
	};

	const handleGameEnd = game => {
		setEnded(true);
		setResultDialogOpen(true);
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
		setTestCaseResults([]);
		socket.emit("submission", btoa(editorRef.current.getValue()));
	}

	const isWinner = game => {
		if (!game) return false;
		const user_id = Cookies.get("user_id");
		return game.winner === 1 ? game.player1 == user_id : game.player2 == user_id;
	}

return (
<>
	<Dialog open={resultDialogOpen} onOpenChange={(open)=> {
			setResultDialogOpen(open)
			if (!open) {
				toast("This duel has ended.", {
					duration: Infinity,
					closeButton: true,
					onDismiss: ()=>setResultDialogOpen(true)
				});
			}
		}}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>

					<div>
						<h2 className="text-xl text-center">Duel Finished!</h2>
					</div>
				</DialogTitle>
			</DialogHeader>

			<h3 className="text-lg text-center">{isWinner(game) ? "You win!" : "You lost!"}</h3>
		</DialogContent>
	</Dialog>

	<ResizablePanelGroup className={styles.leftPanel+" min-h-screen"}>
		<ResizablePanel>
			<ResizablePanelGroup orientation="vertical">
			<ResizablePanel defaultSize="66%">
				<GameInfo gameId={gameId} problem={problem} testCaseResults={testCaseResults} onSubmit={handleSubmit}/>
			</ResizablePanel>

			<ResizableHandle withHandle />

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

		<ResizableHandle withHandle />

		<ResizablePanel defaultSize="66%" className={styles.rightPanel}>
			<Editor
				ref={editorRef}
				onMount={handleEditorMount}
				defaultValue={sessionStorage.getItem("editor_content") ?? default_editor_text}
				defaultLanguage="cpp"
				theme="vs-dark"
				options={{ readOnly: ended }}
				onChange={handleEditorChange}
			/>
		</ResizablePanel>
	</ResizablePanelGroup>
</>
);
}
