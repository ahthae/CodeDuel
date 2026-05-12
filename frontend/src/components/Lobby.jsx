import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import socket from '../socket'; // Assuming you have a centralized socket instance

const Lobby = ({ user }) => {
    const [roomCode, setRoomCode] = useState('');
    const [isWaiting, setIsWaiting] = useState(false);
    const navigate = useNavigate();

    // Creating a New Game
    const handleCreateRoom = () => {
        const code = Math.random().toString(36).substring(2, 6).toUpperCase();
        setRoomCode(code);
        setIsWaiting(true);
        socket.emit('join_match', { match_id: code, user_id: user.id, username: user.username });
    };

    // Joining Existing Game
    const handleJoinRoom = (e) => {
        e.preventDefault();
        const code = e.target.roomCode.value.toUpperCase();
        socket.emit('join_match', { match_id: code, user_id: user.id, username: user.username });
    };

    useEffect(() => {
        // Listen for the "Start" signal from Trey's backend logic
        socket.on('match_start', (data) => {
            // data contains opponent info and problem statement
            navigate(`/game/${roomCode || data.match_id}`, { state: data });
        });

        return () => socket.off('match_start');
    }, [navigate, roomCode]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0e14] text-white p-6">
            <h1 className="text-4xl font-bold mb-8 text-[#4a90e2]">CodeDuel Arena</h1>
            
            {!isWaiting ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
                    {/* Create Section */}
                    <div className="bg-[#161b22] p-8 rounded-lg border border-[#30363d] text-center">
                        <h2 className="text-xl mb-4">Host a Duel</h2>
                        <button 
                            onClick={handleCreateRoom}
                            className="w-full bg-[#238636] hover:bg-[#2ea043] py-3 rounded font-bold transition"
                        >
                            Create Private Room
                        </button>
                    </div>

                    {/* Join Section */}
                    <div className="bg-[#161b22] p-8 rounded-lg border border-[#30363d]">
                        <h2 className="text-xl mb-4 text-center">Join a Duel</h2>
                        <form onSubmit={handleJoinRoom} className="space-y-4">
                            <input 
                                name="roomCode"
                                placeholder="Enter 4-digit Code" 
                                className="w-full bg-[#0d1117] border border-[#30363d] p-3 rounded text-center uppercase tracking-widest"
                                maxLength="4"
                                required
                            />
                            <button className="w-full bg-[#4a90e2] hover:bg-[#357abd] py-3 rounded font-bold transition">
                                Join Match
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="bg-[#161b22] p-12 rounded-lg border border-[#4a90e2] text-center animate-pulse">
                    <h2 className="text-2xl mb-2">Room Created!</h2>
                    <div className="text-5xl font-mono font-bold text-[#4a90e2] my-6">{roomCode}</div>
                    <p className="text-gray-400">Share this code with your opponent.</p>
                    <div className="mt-8 flex items-center justify-center space-x-3">
                        <div className="w-3 h-3 bg-[#4a90e2] rounded-full animate-bounce"></div>
                        <p>Waiting for player 2...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lobby;