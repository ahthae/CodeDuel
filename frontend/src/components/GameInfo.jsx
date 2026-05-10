import { useRef } from "react";
import { MathJax } from "better-react-mathjax";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import styles from "./Game.module.css";

export default function GameInfo({problem, onSubmit}) {
    const descriptionRef = useRef();

    const handleSubmit = () => {
        onSubmit();
    };

    return (
<>
    <Tabs defaultValue="problem">
        <TabsList className="w-full">
            <TabsTrigger value="problem">Problem</TabsTrigger>
            <TabsTrigger value="testCases">Test Cases</TabsTrigger>
        </TabsList>
        <TabsContent value="problem" className={styles.problemPanel}>
            <h1 className="text-2xl text-center">{problem?.name}</h1>
            <MathJax inline>
                <div ref={descriptionRef} dangerouslySetInnerHTML={{__html: problem?.description}}></div>
            </MathJax>
        </TabsContent>
    </Tabs>
    {/* <Button onClick={handleSubmit}>Submit</Button> */}

    {/* <div className={styles.opponentPanel}></div> */}
</>
    )
}