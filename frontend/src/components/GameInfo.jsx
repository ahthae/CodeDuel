import Cookies from "js-cookie";
import { useEffect, useRef, useState } from "react";
import { MathJax } from "better-react-mathjax";
import styles from "./Game.module.css";

export default function GameInfo({problem, onSubmit}) {
    const descriptionRef = useRef();

    const handleSubmit = () => {
        onSubmit();
    };

    return (
<>
    <button type="button" onClick={handleSubmit}>Submit</button>
    <div className={styles.problemPanel}>
        <h1>{problem?.name}</h1>
        <MathJax inline>
            <div ref={descriptionRef} dangerouslySetInnerHTML={{__html: problem?.description}}></div>
        </MathJax>
    </div>

    {/* <div className={styles.opponentPanel}></div> */}
</>
    )
}