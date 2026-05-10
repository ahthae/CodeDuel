import Cookies from 'js-cookie';
import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { io } from 'socket.io-client';
import styles from "./Game.module.css";
import GameInfo from './GameInfo';
import { useNavigate, useParams } from 'react-router-dom';

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

	const [socket, setSocket] = useState(io('ws://localhost:5000', {autoConnect: false, withCredentials: true}));

	const editorRef = useRef(null);
	const opponentEditorRef = useRef(null);

	useEffect(() => {
		socket.on("connect_error", (err) => {
			console.log(`Socket ${err.name}: ${err.message}`);
			navigate('/dashboard');
		});
		socket.on("error", (args) => {
			switch( args.error_code) {
				case 1:
				case 2:
				case 3:
					console.log("Could not join game: " + args.description);
					// TODO display error message
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
				socket.emit("editor_update", editorRef.value);
			}
		});
		// TODO game waiting list?
		// might need to move socket connection logic out of this component
		// socket.on("waiting", (game_id) => {
		// 	sessionStorage.setItem("game_id", game_id);
		// });
		socket.on("end", (winner) => {
			sessionStorage.removeItem("game_id");
			sessionStorage.removeItem("editor_content");
			sessionStorage.removeItem("opponent_editor_content");
			// TODO
			// game results screen?
			// navigate
		});
		socket.on("editor_update", (content) => {
			updateOpponentEditor(content);
		});

		socket.connect();

		return () => {
			socket.off("connect_error")
			socket.off("connect")
			socket.off("error")
			socket.off("waiting")
			socket.off("end")
			socket.off("join")
			socket.off("editor_update")
			socket.disconnect()
			console.log("Socket disconnected.");
		};
	}, []);

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
		opponentEditorRef.current.setValue(value)
	};

return (
  <div className={styles.gameContainer}>

    <div className={styles.leftPanel}>
		<GameInfo onJoinGame={()=>{}}/>

      <Editor
	  	ref={opponentEditorRef}
        className={styles.Editor}
        onMount={handleOpponentEditorMount}
        defaultValue={sessionStorage.getItem("opponent_editor_content") ?? default_opponent_editor_text}
        defaultLanguage="cpp"
		theme="vs-dark"
        options={{ readOnly: true }}
      />
    </div>

    <div className={styles.rightPanel}>

      <Editor
	  	ref={editorRef}
        className={styles.Editor}
        onMount={handleEditorMount}
        defaultValue={sessionStorage.getItem("editor_content") ?? default_editor_text}
        defaultLanguage="cpp"
		theme="vs-dark"
        options={{ readOnly: false }}
        onChange={handleEditorChange}
      />
    </div>

  </div>
);
}
