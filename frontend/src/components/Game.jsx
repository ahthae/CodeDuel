import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { socket, socket2 } from '../socket';
import styles from "./Game.module.css";

export default function Game() {
	const editorRef = useRef(null);
	const opponentEditorRef = useRef(null);

	const handleEditorMount = (editor, moncaco) => {
		editorRef.current = editor;
	};
	const handleOpponentEditorMount = (editor, moncaco) => {
		opponentEditorRef.current = editor;
	};

	useEffect(() => {
		socket.on('connect_error', (err) => {
			console.log(`Socket 1 error: ${err.name}: ${err.message}`)
		})
		socket2.on('connect_error', (err) => {
			console.log(`Socket 2 error: ${err.name}: ${err.message}`)
		})

		socket.on('connect', () => {
			console.log("Socket connected, joining\n");
			socket.emit('join_game');
		});
		socket2.on("waiting", (game_id) => {
			console.log("Received game ID, joining\n")
			socket2.emit('join_game', game_id); 
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
	<>
		<Editor className={styles.Editor}
				onMount={handleEditorMount}
				defaultValue={"#include <iostream>\n\nusing namespace std;\n\nint main(){\n    cout << \"Hello, world!\" << endl;\n\n    return 0;\n}\n"}
				defaultLanguage="cpp"
				options={{readOnly: false}}
				onChange={(value, ev) => { 
					socket.emit("editor_update", value);
					console.log("Emitted editor update");
					}}
		/>
		<Editor className={styles.Editor}
				onMount={handleOpponentEditorMount}
				defaultValue={"#include <iostream>\n\nusing namespace std;\n\nint main(){\n    cout << \"Hello, opponent!\" << endl;\n\n    return 0;\n}\n"}
				defaultLanguage="cpp"
				options={{readOnly: true}}
		/>
	</>
	)
}