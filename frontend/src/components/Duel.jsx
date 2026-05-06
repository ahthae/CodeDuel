import { useRef, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import styles from "./Duel.module.css";

export default function Duel() {
	const editorRef = useRef(null);
	const opponentEditorRef = useRef(null);

	const handleEditorMount = (editor, moncaco) => {
		editorRef.current = editor;
	};
	const handleOpponentEditorMount = (editor, moncaco) => {
		opponentEditorRef.current = editor;
	};

	useEffect(() => {

	}, []);

	const updateOpponentEditor = (value) => {
		opponentEditorRef.current.setValue(value)
	};

	return (
	<>
		<Editor className={styles.Editor}
				onMount={handleEditorMount}
				defaultValue="Hello, world!"
				options={{readOnly: false}}
				onChange={(value, ev) => { updateOpponentEditor(value); }}
		/>
		<Editor className={styles.Editor}
				onMount={handleOpponentEditorMount}
				defaultValue="Hello, opponent!"
				options={{readOnly: true}}
		/>
	</>
	)
}