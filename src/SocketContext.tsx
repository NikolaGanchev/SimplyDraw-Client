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
import Member from './Networking/Member';
import Avataaar from './utils/Avataaar';

const SocketContext = createContext({});

const ContextProvider = ({ children }: any) => {
    const [key, setKey] = useState("");
    const [me, setMe] = useState<Member>();
    const [connectionsState, setConnections] = useState<Array<Connection>>([]);
    const [name, setName] = useState("Default");
    const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
    const [members, setMembers] = useState<Member[]>();
    let internalMembers: Member[] = [];
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
            let member = new Member(socket.id, name, new Avataaar);
            setMe(member);
            addMember(member);
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
            peer.on("connect", () => {
                setUpConnectionAsClient(peer);
                setMe(new Member(socket.id, name, new Avataaar));
            });

            peer.on("error", (err) => {
                console.log(err);
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

            let member = new Member(connection.from, name, new Avataaar);
            addMember(member);

            let obj: NetworkingEvent = {
                type: NetworkingEvents.NEW_USER_JOINED,
                payload: member
            }

            broadcast(connections, connection.from, obj);

            setUpConnectionAsHost(connection);
        });



        peer.on('error', (err) => {
            console.log(connections);
        });
    }

    function setUpConnectionAsHost(connection: Connection) {
        let objEventCache: NetworkingEvent = {
            type: NetworkingEvents.EVENT_CACHE_SYNC,
            payload: EventCache
        }

        connection.peer.send(JSON.stringify(objEventCache));

        let objMembers: NetworkingEvent = {
            type: NetworkingEvents.MEMBERS_SYNC,
            payload: internalMembers
        }

        connection.peer.send(JSON.stringify(objMembers));

        setConnections(connections);

        connection.peer.on("data", (data) => {
            let networkingEvent: NetworkingEvent = JSON.parse(data);
            if (networkingEvent.type === NetworkingEvents.DRAW_EVENT) {
                broadcast(connections, connection.from, networkingEvent);
            }
            consumeEvent(networkingEvent);
        })

        connection.peer.on("close", () => {
            connections.splice(connections.indexOf(connection), 1);
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
    }

    function setUpConnectionAsClient(peer: Peer.Instance) {
        host = peer;

        setHasJoinedRoom(true);

        peer.on("data", (data) => {
            console.log("received event");
            let networkingEvent: NetworkingEvent = JSON.parse(data);
            consumeEvent(networkingEvent);
        });

        EventBus.dispatchEvent(EVENTS.JOINED_ROOM);

        EventBus.subscribe(EVENTS.SEND_DRAW_EVENT_REQUEST, (drawEvent: DrawEvent) => {
            sendDrawEvent(drawEvent);
        });

        peer.on("close", () => {
            setHasJoinedRoom(false);
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
    }

    function consumeEvent(networkingEvent: NetworkingEvent) {
        switch (networkingEvent.type) {
            case NetworkingEvents.NEW_USER_JOINED: {
                if (isHost) break;
                EventBus.dispatchEvent(EVENTS.NEW_USER_JOINED, networkingEvent.payload);
                console.log(networkingEvent.payload);
                addMember(networkingEvent.payload);
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
            case NetworkingEvents.MEMBERS_SYNC: {
                if (isHost) break;
                console.log(networkingEvent);
                internalMembers = networkingEvent.payload;
                setMembers(networkingEvent.payload);
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

    function addMember(member: Member) {
        internalMembers.push(member);
        setMembers(internalMembers);
    }

    return (<SocketContext.Provider value={{ key, startServerConnection, createRoom, joinRoom, sendDrawEvent, hasJoinedRoom }}>{children}</SocketContext.Provider>)
}

export { ContextProvider, SocketContext };