import { MathJax } from "better-react-mathjax";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import { Button } from "./ui/button";
import styles from "./ProblemDescription.module.css";

function ProblemDescription({problem, gameId}) {
    return (
<>
    <Card className="p-4 text-sm">
        <CardHeader>
            <h1 className="text-2xl text-center">{problem?.name ?? "Waiting for players..."}</h1>
        </CardHeader>
    {problem?.id ? (
        <CardContent>
            <MathJax inline>
                <div className={styles.problemDescription} dangerouslySetInnerHTML={{__html: problem?.description}}></div>
            </MathJax>
        </CardContent>
    ) : (
        <CardContent>
            <p className="text-center">Invite you friends! They can use the game ID to join the game:</p>
            <h2 className="text-center font-mono">{gameId}</h2>
        </CardContent>
    )}
    </Card>
</>
    );
}

function TestCaseResults({results}) {
    return (
<>
    <Card>
        <CardContent className="space-y-4">
            {results?.map((result, i) => 
                    <div key={result.test_case_id} className="flex">
                        <h2 className="grow text-sm font-bold">Test case {i+1}</h2>
                        <div className="grow">
                            <span className={"text-sm "+(result.status.id === 3 ? "text-constructive" : "text-destructive")}>{result.status.description}</span> 
                        </div>
                        <Button className="w-12">Info</Button>
                    </div>
            )}
        </CardContent>
    </Card>
</>
    );
}

function TestCases({problem, onSubmit}) {
	const testCases = problem?.test_cases ?? [];
    return (
		<Card className="p-4 text-sm">
			<CardContent className="space-y-4">
				{testCases.length === 0 ? (
					<p className="opacity-60">No test cases available</p>
				) : (
					testCases.map((tc, i) => (
						<div key={tc.id}>
							<h3 className="font-bold mb-2">Test case {i + 1}</h3>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<p className="opacity-60 mb-1 text-xs">Input</p>
									<pre className="bg-slate-800 p-2 rounded text-xs whitespace-pre-wrap">
										{tc.input}
									</pre>
								</div>
								<div>
									<p className="opacity-60 mb-1 text-xs">Expected Output</p>
									<pre className="bg-slate-800 p-2 rounded text-xs whitespace-pre-wrap">
										{tc.output}
									</pre>
								</div>
							</div>
						</div>
					))
				)}
			</CardContent>
			<CardFooter>
				<Button onClick={onSubmit} className="w-full">Submit</Button>
			</CardFooter>
		</Card>
	);
}

export default function GameInfo({gameId, problem, testCaseResults, onSubmit}) {
    const [tab, setTab] = useState("problem");
    function handleSubmit() {
        setTab("results");
        onSubmit();
    }
    return (
<Tabs value={tab} onValueChange={(value)=>setTab(value)} className="p-3">
    <TabsList className="w-full h-9">
        <TabsTrigger value="problem">Problem</TabsTrigger>
        <TabsTrigger value="testCases">Test Cases</TabsTrigger>
        <TabsTrigger value="results">Test Case Results</TabsTrigger>
        <TabsTrigger value="opponent">Opponent</TabsTrigger>
    </TabsList>
    <TabsContent value="problem">
        <ProblemDescription gameId={gameId} problem={problem}/>
    </TabsContent>
    <TabsContent value="testCases">
		<TestCases problem={problem} onSubmit={handleSubmit}/>
    </TabsContent>
    <TabsContent value="results">
        <TestCaseResults results={testCaseResults}/>
    </TabsContent>
    <TabsContent value="opponent">
        {/* <div className={styles.opponentPanel}></div> */}
    </TabsContent>
</Tabs>
    );
}