import { useRef } from "react";
import { MathJax } from "better-react-mathjax";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "./GameInfo.css";
import { Card } from "@/components/ui/card";
import { Button } from "./ui/button";

function ProblemDescription({problem}) {
    const descriptionRef = useRef();

    return (
<>
    <Card className="p-4 text-sm">
        <h1 className="text-2xl text-center">{problem?.name}</h1>
        <MathJax inline>
            <div ref={descriptionRef} dangerouslySetInnerHTML={{__html: problem?.description}}></div>
        </MathJax>
    </Card>
</>
    );
}

function TestCases({testCases, onSubmit}) {
    function handleSubmit() { 
        onSubmit();
    }

    return (
<Card>
    <Button onClick={handleSubmit}>Submit</Button>
</Card>
    );
}

export default function GameInfo({problem, onSubmit}) {
    return (
<Tabs defaultValue="problem" className="p-3">
    <TabsList className="w-full h-9">
        <TabsTrigger value="problem">Problem</TabsTrigger>
        <TabsTrigger value="testCases">Test Cases</TabsTrigger>
        <TabsTrigger value="opponent">Opponent</TabsTrigger>
    </TabsList>
    <TabsContent value="problem">
        <ProblemDescription problem={problem}/>
    </TabsContent>
    <TabsContent value="testCases">
        <TestCases onSubmit={onSubmit}/>
    </TabsContent>
    <TabsContent value="opponent">
        {/* <div className={styles.opponentPanel}></div> */}
    </TabsContent>
</Tabs>
    );
}