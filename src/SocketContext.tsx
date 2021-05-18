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
            answerJoinRequest(from, signal, name, peer);
        });
    }

    function createRoom() {
        socket.emit("createroom");

        socket.on("roomcreated", (res: any) => {
            setKey(res.id);
            isHost = true;
            EventBus.dispatchEvent(EVENTS.ROOM_CREATED, res.id);
            EventBus.subscribe(EVENTS.SEND_DRAW_EVENT_REQUEST, (drawEvent: DrawEvent) => {
                sendDrawEvent(drawEvent);
            });
        });
    }

    function joinRoom(code: string, name: string) {
        const peer = new Peer({ initiator: true, trickle: false });
        setName(name);
        peer.on('signal', (data) => {
            socket.emit('joinroom', { userToCall: code, signalData: data, from: socket.id, name });
        });

        socket.on('joinAccepted', (signal) => {
            isHost = false;
            peer.signal(signal);
            host = peer;

            peer.on("data", (data) => {
                console.log("received event");
                let networkingEvent: NetworkingEvent = JSON.parse(data);
                consumeEvent(networkingEvent);
            });

            peer.on("error", (err) => {
                console.log(err);
            })

            EventBus.dispatchEvent(EVENTS.JOINED_ROOM);

            EventBus.subscribe(EVENTS.SEND_DRAW_EVENT_REQUEST, (drawEvent: DrawEvent) => {
                sendDrawEvent(drawEvent);
            });

            EventBus.subscribe(EVENTS.UNDO_LAST_ACTION_REQUEST, (drawEvent: DrawEvent) => {
                let obj: NetworkingEvent = {
                    type: NetworkingEvents.UNDO_EVENT,
                    payload: null
                }
                sendNetworkingEvent(obj);
            });

            EventBus.subscribe(EVENTS.REDO_FUTURE_ACTION_REQUEST, (drawEvent: DrawEvent) => {
                let obj: NetworkingEvent = {
                    type: NetworkingEvents.REDO_EVENT,
                    payload: null
                }
                sendNetworkingEvent(obj);
            });
        });

    }

    function answerJoinRequest(from: string, signal: any, name: string, peer: Peer.Instance) {
        peer.on('signal', (data) => {
            socket.emit('answerJoinRequest', { signal: data, to: from });
        });

        peer.signal(signal);

        peer.on("connect", () => {
            let connection = new Connection(from, signal, name, peer);
            connections.push(connection);
            setConnections(connections);
            let obj: NetworkingEvent = {
                type: NetworkingEvents.NEW_USER_JOINED,
                payload: connection.name
            }

            broadcast(connections, connection.from, obj);

            let objEventCache: NetworkingEvent = {
                type: NetworkingEvents.EVENT_CACHE_SYNC,
                payload: EventCache
            }

            connection.peer.send(JSON.stringify(objEventCache));

            setConnections(connections);

            peer.on("data", (data) => {
                let networkingEvent: NetworkingEvent = JSON.parse(data);
                if (networkingEvent.type === NetworkingEvents.DRAW_EVENT) {
                    broadcast(connections, from, networkingEvent);
                }
                consumeEvent(networkingEvent);
            })

            peer.on("close", () => {
                console.log(connections);
                connections.splice(connections.indexOf(connection), 1);
                console.log(connections);
            });

            EventBus.subscribe(EVENTS.UNDO_LAST_ACTION_REQUEST, (drawEvent: DrawEvent) => {
                let obj: NetworkingEvent = {
                    type: NetworkingEvents.UNDO_EVENT,
                    payload: null
                }
                broadcastToAll(connections, obj);
            });

            EventBus.subscribe(EVENTS.REDO_FUTURE_ACTION_REQUEST, (drawEvent: DrawEvent) => {
                let obj: NetworkingEvent = {
                    type: NetworkingEvents.REDO_EVENT,
                    payload: null
                }
                broadcastToAll(connections, obj);
            });
        })



        peer.on('error', (err) => {
            console.log(connections);
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
                console.log("received event cache");
                if (isHost) break;
                EventBus.dispatchEvent(EVENTS.EVENT_CACHE_SYNC, networkingEvent.payload);
                break;
            }
            case NetworkingEvents.DRAW_EVENT: {
                EventBus.dispatchEvent(EVENTS.DRAW_EVENT, networkingEvent.payload);
                break;
            }
            case NetworkingEvents.UNDO_EVENT: {
                EventBus.dispatchEvent(EVENTS.REMOTE_UNDO_REQUEST);
                break;
            }
            case NetworkingEvents.REDO_EVENT: {
                EventBus.dispatchEvent(EVENTS.REMOTE_REDO_REQUEST);
                break;
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

        sendNetworkingEvent(obj);
    }

    function sendNetworkingEvent(networkingEvent: NetworkingEvent) {
        if (connections.length === 0 && (host === null || host === undefined)) return;

        if (isHost) {
            broadcastToAll(connections, networkingEvent);
        }
        else {
            host?.send(JSON.stringify(networkingEvent));
        }

    }

    return (<SocketContext.Provider value={{ key, startServerConnection, createRoom, joinRoom, sendDrawEvent }}>{children}</SocketContext.Provider>)
}

export { ContextProvider, SocketContext };