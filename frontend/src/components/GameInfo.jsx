import Cookies from "js-cookie";
import { useEffect, useRef, useState } from "react";
import styles from "./Game.module.css";

export default function GameInfo({problemId, onSubmit}) {
    const [problem, setProblem] = useState(null);
    const descriptionRef = useRef();

    useEffect(()=>{
        const fetchProblem = async () => {
            const result = await (await fetch(`/api/problem/${problemId}`, {
                headers: { 'X-CSRF-Token': Cookies.get("csrf_access_token") },
                credentials: 'include'
            })).json();

            if (!ignore) {
                setProblem(result);
            }
        };

        let ignore = false;
        if (problemId) { fetchProblem(); }
        return () => { ignore = true; }
    }, [problemId]);

    const handleSubmit = () => {
        onSubmit();
    };

    return (
<>
    <button type="button" onClick={handleSubmit}>Submit</button>
    <div className={styles.problemPanel}>
        <h1>{problem?.name}</h1>
        <div ref={descriptionRef} dangerouslySetInnerHTML={{ __html: problem?.description }}></div>
    </div>

    <div className={styles.opponentPanel}></div>
</>
    )
}