import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import { createContext, useContext, useEffect, useState } from 'react';
import EventBus, { EVENTS } from './Events/EventBus';
import Connection from './Events/Connection';

const SocketContext = createContext({});

const ContextProvider = ({ children }: any) => {
    const [key, setKey] = useState("");
    const [me, setMe] = useState("");
    const [connectionsState, setConnections] = useState<Array<Connection>>([]);
    const [name, setName] = useState("Default");
    const [isHost, setIsHost] = useState(false);
    const [host, setHost] = useState<Peer.Instance>();
    const connections: Connection[] = [];
    let socket: Socket;


    function startServerConnection(token: any) {
        socket = io("http://localhost:5000", { query: { "captchaToken": token } });

        socket.on("success", (res: any) => {
            EventBus.dispatchEvent(EVENTS.SUCCESSFUL_SERVER_CONNECTION);
        });

        socket.on('joinroom', ({ from, signal, name }: any) => {
            const peer = new Peer({ initiator: false });
            let connection = new Connection(from, signal, name, peer);
            connections.push(connection);
            setConnections(connections);
            answerJoinRequest(connection);
        });
    }

    function createRoom() {
        socket.emit("createroom");

        socket.on("roomcreated", (res: any) => {
            setKey(res.id);
            setIsHost(true);
            EventBus.dispatchEvent(EVENTS.ROOM_CREATED, res.id);
        });
    }

    function joinRoom(code: string) {
        const peer = new Peer({ initiator: true });

        peer.on('signal', (data) => {
            socket.emit('joinroom', { userToCall: code, signalData: data, from: socket.id, name });
        });

        peer.on("data", (data) => {
            console.log(JSON.parse(data));
        })

        socket.on('joinAccepted', (signal) => {
            setIsHost(false);
            peer.signal(signal);
            setHost(peer);
        });

    }

    function answerJoinRequest(connection: Connection) {

        connection.peer.on('signal', (data) => {
            socket.emit('answerJoinRequest', { signal: data, to: connection.from });
        });

        connection.peer.signal(connection.signal);

        connection.peer.on("connect", () => {
            for (let i = connections.length - 1; i >= 0; i--) {
                let con = connections[i];
                let obj = {
                    message: "New user joined:",
                    name: connection.name
                }

                // For an unknown reason, websockets decide to send more than one request for connection
                // This means that more than the required peers are created
                // The invalid peers raise an error if you try to send something to them
                // So here the error is caught and the faulty peer is removed from the connection array
                try {
                    con.peer.send(JSON.stringify(obj));
                }
                catch (e) {
                    connections.splice(i, 0);
                }
            }
            setConnections(connections);
        })

        connection.peer.on("data", (data) => {
            console.log(JSON.parse(data));
        })
    }

    return (<SocketContext.Provider value={{ key, startServerConnection, createRoom, joinRoom }}>{children}</SocketContext.Provider>)
}

export { ContextProvider, SocketContext };