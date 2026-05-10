import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { io } from 'socket.io-client';
import styles from "./Game.module.css";
import GameInfo from './GameInfo';
import { useNavigate } from 'react-router-dom';

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

	const [socket, setSocket] = useState(io('ws://localhost:5000', {autoConnect: false, withCredentials: true}));
	const [socket2, setSocket2] = useState(io('ws://localhost:5000', {autoConnect: false, withCredentials: true})); // Mock opponent for testing

	const editorRef = useRef(null);
	const opponentEditorRef = useRef(null);

	useEffect(() => {
		socket.on("connect_error", (err) => {
			console.log(`Socket ${err.name}: ${err.message}`)
		});
		socket.on("error", (args) => {
			switch( args.error_code) {
				case 1:
				case 2:
				case 3:
					console.log("Could not join game:" + args.description);
					// TODO display error message
					navigate('/dashboard');
					break;
			}
		});
		socket.on("connect", () => {
			console.log("Socket connected, joining\n");
			const game_id = sessionStorage.getItem("game_id");
			if (game_id) {
				socket.emit("join", game_id);
			} else {
				socket.emit("join");
			}
		});
		socket.on("waiting", (game_id) => {
			sessionStorage.setItem("game_id", game_id)
		});
		socket.on("end", (winner) => {
			sessionStorage.removeItem("game_id");
			sessionStorage.removeItem("editor_content");
			sessionStorage.removeItem("opponent_editor_content");
			// TODO
		});

		socket2.on("connect", () => {
			if (sessionStorage.getItem("game_id")) {
				socket2.emit('join', sessionStorage.getItem("game_id"));
			}
		});
		socket2.on("waiting", (game_id) => {
			socket2.emit('join', game_id);
		});
		socket2.on("connect_error", (err) => {
			console.log(`Socket 2 ${err.name}: ${err.message}`)
		});
		socket2.on("editor_update", (content) => {
			sessionStorage.setItem("opponent_editor_content", content);
			updateOpponentEditor(content);
		});

		socket.connect();
		socket2.connect();

		return () => {
			console.log("Disconnecting");
			socket.off("connect_error")
			socket.off("connect")
			socket.off("error")
			socket.off("waiting")
			socket.off("end")
			socket2.off("connect_error")
			socket2.off("connect")
			socket2.off("waiting");
			socket2.off("editor_update");
			socket.disconnect()
			socket2.disconnect()
		};
	}, []);

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
