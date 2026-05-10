import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { io } from 'socket.io-client';
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
	const [socket, setSocket] = useState(io('ws://localhost:5000', {autoConnect: false, withCredentials: true}));
	const [socket2, setSocket2] = useState(io('ws://localhost:5000', {autoConnect: false, withCredentials: true}));

	const opponentEditorRef = useRef(null);

	const handleOpponentEditorMount = (editor, moncaco) => {
		opponentEditorRef.current = editor;
	};

	useEffect(() => {
		socket.on('connect_error', (err) => {
			console.log(`Socket 1 ${err.name}: ${err.message}`)
		})
		socket2.on('connect_error', (err) => {
			console.log(`Socket 2 ${err.name}: ${err.message}`)
		})

		socket.on('connect', () => {
			console.log("Socket connected, joining\n");
			socket.emit('join');
		});
		socket2.on("waiting", (game_id) => {
			console.log("Received game ID, joining\n")
			socket2.emit('join', game_id); 
		});
		socket2.on('editor_update', updateOpponentEditor);

		socket.connect()
		socket2.connect()

		return () => {
			socket.off('connect_error')
			socket2.off('connect_error')
			socket.off('connect')
			socket2.off('waiting');
			socket2.off('editor_update');
			socket.disconnect()
			socket2.disconnect()
		};
	}, []);

	const updateOpponentEditor = (value) => {
		opponentEditorRef.current.setValue(value)
	};

return (
  <div className={styles.gameContainer}>

    <div className={styles.leftPanel}>

      <div className={styles.problemPanel}>
      </div>

      <div className={styles.opponentPanel}></div>

      <Editor
        className={styles.Editor}
        defaultValue={default_editor_text}
        defaultLanguage="cpp"
		theme="vs-dark"
        options={{ readOnly: false }}
        onChange={(value, ev) => { 
          socket.emit("editor_update", value);
          console.log("Emitted editor update");
        }}
      />

    </div>

    <div className={styles.rightPanel}>
      <Editor
        className={styles.Editor}
        onMount={handleOpponentEditorMount}
        defaultValue={default_opponent_editor_text}
        defaultLanguage="cpp"
		theme="vs-dark"
        options={{ readOnly: true }}
      />
    </div>

  </div>
);
}
