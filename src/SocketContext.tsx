import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import { createContext, useContext, useEffect, useState } from 'react';
import EventBus, { EVENTS } from './Events/EventBus';
import Connection from './Networking/Connection';
import { broadcast, broadcastToAll } from './Networking/Utils';
import NetworkingEvent from './Networking/NetworkingEvent';
import { NetworkingEvents } from './Networking/NetworkingEvents';
import EventCache from './Events/EventCache';
import DrawEvent from './Events/DrawEvent';

const SocketContext = createContext({});

const ContextProvider = ({ children }: any) => {
    const [key, setKey] = useState("");
    const [me, setMe] = useState("");
    const [connectionsState, setConnections] = useState<Array<Connection>>([]);
    const [name, setName] = useState("Default");
    let isHost = false;
    let host: Peer.Instance;
    const connections: Connection[] = [];
    let socket: Socket;


    function startServerConnection(token: any) {
        socket = io("http://localhost:5000", { query: { "captchaToken": token } });

        socket.on("success", (res: any) => {
            EventBus.dispatchEvent(EVENTS.SUCCESSFUL_SERVER_CONNECTION);
        });

        socket.on('joinroom', ({ from, signal, name }: any) => {
            // Check if websockets did't send the request more than one time
            if (connectionsContain(connections, from)) return;

            const peer = new Peer({ initiator: false, trickle: false });
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
            isHost = true;
            EventBus.dispatchEvent(EVENTS.ROOM_CREATED, res.id);
        });
    }

    function joinRoom(code: string, name: string) {
        const peer = new Peer({ initiator: true, trickle: false });
        setName(name);
        peer.on('signal', (data) => {
            socket.emit('joinroom', { userToCall: code, signalData: data, from: socket.id, name });
        });

        peer.on("data", (data) => {
            let networkingEvent: NetworkingEvent = JSON.parse(data);
            consumeEvent(networkingEvent);
        })

        socket.on('joinAccepted', (signal) => {
            isHost = false;
            peer.signal(signal);
            host = peer;

            EventBus.dispatchEvent(EVENTS.JOINED_ROOM)
        });

    }

    function answerJoinRequest(connection: Connection) {

        connection.peer.on('signal', (data) => {
            socket.emit('answerJoinRequest', { signal: data, to: connection.from });
        });

        connection.peer.signal(connection.signal);

        connection.peer.on("connect", () => {
            let obj: NetworkingEvent = {
                type: NetworkingEvents.NEW_USER_JOINED,
                payload: connection.name
            }

            // For an unknown reason, websockets decide to send more than one request for connection
            // This means that more than the required peers are created
            // The invalid peers raise an error if you try to send something to them
            // So here the error is caught and the faulty peer is removed from the connection array
            // This has been largely mitigated by the connectionsContain function
            // However I'm still not exactly sure if it is 100% so I'm leaving this here
            // The issue has now been resolved, so in a future commit this comment will be removed
            broadcast(connections, connection.from, obj);

            let objEventCache: NetworkingEvent = {
                type: NetworkingEvents.EVENT_CACHE_SYNC,
                payload: EventCache
            }

            connection.peer.send(JSON.stringify(objEventCache));

            setConnections(connections);
        })

        connection.peer.on("data", (data) => {
            let networkingEvent: NetworkingEvent = JSON.parse(data);
            if (networkingEvent.type === NetworkingEvents.DRAW_EVENT) {
                broadcast(connections, connection.from, networkingEvent);
            }
            consumeEvent(networkingEvent);
        })
    }

    function consumeEvent(networkingEvent: NetworkingEvent) {
        switch (networkingEvent.type) {
            case NetworkingEvents.NEW_USER_JOINED: {
                if (isHost) break;
                EventBus.dispatchEvent(EVENTS.NEW_USER_JOINED, networkingEvent.payload);
                break;
            }
            case NetworkingEvents.EVENT_CACHE_SYNC: {
                if (isHost) break;
                EventBus.dispatchEvent(EVENTS.EVENT_CACHE_SYNC, networkingEvent.payload);
                break;
            }
            case NetworkingEvents.DRAW_EVENT: {
                EventBus.dispatchEvent(EVENTS.DRAW_EVENT, networkingEvent.payload);
            }
        }
    }

    function connectionsContain(connectionsArr: Connection[], socketId: string) {
        let set = new Set();
        connectionsArr.forEach((con) => {
            set.add(con.from);
        });

        return set.has(socketId);
    }

    function sendDrawEvent(drawEvent: DrawEvent) {
        let obj: NetworkingEvent = {
            type: NetworkingEvents.DRAW_EVENT,
            payload: drawEvent
        }

        if (connections.length === 0 && (host === null || host === undefined)) return;

        if (isHost) {
            broadcastToAll(connections, obj);
        }
        else {
            host?.send(JSON.stringify(obj));
        }

    }

    return (<SocketContext.Provider value={{ key, startServerConnection, createRoom, joinRoom, sendDrawEvent }}>{children}</SocketContext.Provider>)
}

export { ContextProvider, SocketContext };