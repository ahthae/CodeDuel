import { useRef } from "react";
import { MathJax } from "better-react-mathjax";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "./ui/button";
import styles from "./ProblemDescription.module.css";

function ProblemDescription({problem}) {
    return (
<>
    <Card className="p-4 text-sm">
        <CardHeader>
            <h1 className="text-2xl text-center">{problem?.name}</h1>
        </CardHeader>
        <CardContent>
            <MathJax inline>
                <div className={styles.problemDescription} dangerouslySetInnerHTML={{__html: problem?.description}}></div>
            </MathJax>
        </CardContent>
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
    <CardFooter>
        <Button onClick={handleSubmit} className="w-full">Submit</Button>
    </CardFooter>
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