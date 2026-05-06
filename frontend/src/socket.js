import { io } from 'socket.io-client';

export const socket = io('ws://localhost:5000', {autoConnect: false, withCredentials: true});
export const socket2 = io('ws://localhost:5000', {autoConnect: false, withCredentials: true});