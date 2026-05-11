import React, { useState, useEffect } from 'react';
import socket from '../socket';

const OpponentStatus = ({ totalTests = 5 }) => {
    const [passedCount, setPassedCount] = useState(0);

    useEffect(() => {
        socket.on('opponent_test_update', (data) => {
            // data should be { passed: number }
            setPassedCount(data.passed);
        });
        return () => socket.off('opponent_test_update');
    }, []);

    return (
        <div className="bg-[#161b22] p-3 rounded-t-md border-b border-[#30363d] flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-300">Opponent Progress</span>
            <div className="flex space-x-1">
                {[...Array(totalTests)].map((_, i) => (
                    <div 
                        key={i}
                        className={`w-3 h-3 rounded-full ${i < passedCount ? 'bg-green-500' : 'bg-gray-700'}`}
                        title={i < passedCount ? "Passed" : "Pending"}
                    />
                ))}
            </div>
        </div>
    );
};

export default OpponentStatus;