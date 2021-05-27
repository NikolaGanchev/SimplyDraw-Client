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
import { nanoid } from 'nanoid'

const SocketContext = createContext({});

const ContextProvider = ({ children }: any) => {
    const [key, setKey] = useState("");
    const [me, setMe] = useState<Member>();
    const [connectionsState, setConnections] = useState<Array<Connection>>([]);
    const [name, setName] = useState("Default");
    const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
    const [members, setMembers] = useState<Member[]>();
    const [isHostState, setIsHostState] = useState(false);
    let internalMembers: Member[] = [];
    let isHost = false;
    let host: Peer.Instance | null;
    const connections: Connection[] = [];
    let socket: Socket | null;
    const EVENT_BUS_KEY = "EVENT_BUS_KEY";
    let mutedIds: string[] = [];

    function startServerConnection(token: any) {
        socket = io("http://localhost:5000", { query: { "captchaToken": token } });

        socket.once("success", (res: any) => {
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
        socket?.emit("createroom");

        socket?.once("roomcreated", (res: any) => {
            setKey(res.id);
            isHost = true;
            setIsHostState(true);
            EventBus.dispatchEvent(EVENTS.ROOM_CREATED, res.id);
            EventBus.subscribe(EVENTS.SEND_DRAW_EVENT_REQUEST, (drawEvent: DrawEvent) => {
                sendDrawEvent(drawEvent);
            }, EVENT_BUS_KEY);
            let member = new Member(nanoid(10), name, new Avataaar);
            setMe(member);
            addMember(member);

            EventBus.subscribe(EVENTS.UNDO_LAST_ACTION_REQUEST, (drawEvent: DrawEvent) => {
                let obj: NetworkingEvent = {
                    type: NetworkingEvents.UNDO_EVENT,
                    payload: null
                }
                broadcastToAll(connections, obj);
            }, EVENT_BUS_KEY);

            EventBus.subscribe(EVENTS.REDO_FUTURE_ACTION_REQUEST, (drawEvent: DrawEvent) => {
                let obj: NetworkingEvent = {
                    type: NetworkingEvents.REDO_EVENT,
                    payload: null
                }
                broadcastToAll(connections, obj);
            }, EVENT_BUS_KEY);
        });

        socket?.once("garbageCollected", () => {
            disbandRoom();
        });
    }

    function disbandRoom() {
        if (isHost) {
            resetState();
        }
    }

    function leaveRoom() {
        isHost = false;
        setIsHostState(false);
        setKey("");
        setMe(undefined);
        setConnections([]);
        setHasJoinedRoom(false);
        setMembers([]);
        internalMembers = [];
        host = null;
        connections.length = 0;
        EventBus.unsubscribeAll(EVENT_BUS_KEY);
    }

    function resetState() {
        setKey("");
        setMe(undefined);
        setConnections([]);
        setHasJoinedRoom(false);
        setMembers(undefined);
        internalMembers = [];
        isHost = false;
        setIsHostState(false);
        host = null;
        connections.length = 0;
        socket = null;
        EventBus.unsubscribeAll(EVENT_BUS_KEY);
        EventBus.dispatchEvent(EVENTS.RESET_STATE_EVENT);
    }

    function joinRoom(code: string, name: string) {
        const peer = new Peer({ initiator: true, trickle: false });
        setName(name);
        peer.on('signal', (data) => {
            socket?.emit('joinroom', { userToCall: code, signalData: data, from: socket.id, name });
        });

        socket?.once('joinAccepted', (signal) => {
            isHost = false;
            setIsHostState(false);
            peer.signal(signal);
            peer.once("connect", () => {
                setUpConnectionAsClient(peer);
            });

            setKey(code);

            peer.on("error", (err) => {
                console.error(err);
            });
        });

        socket?.once("hostMigration", () => {
            if (isHost) return;
            leaveRoom();

            joinRoom(code, name);
        });

        socket?.once("becomeHost", () => {
            leaveRoom();
            EventBus.dispatchEvent(EVENTS.BECAME_HOST_EVENT);
            setKey(code);
            isHost = true;
            setIsHostState(true);
            EventBus.dispatchEvent(EVENTS.ROOM_CREATED, code);
            EventBus.subscribe(EVENTS.SEND_DRAW_EVENT_REQUEST, (drawEvent: DrawEvent) => {
                sendDrawEvent(drawEvent);
            }, EVENT_BUS_KEY);

            let member = new Member(nanoid(10), name, new Avataaar);
            setMe(member);
            addMember(member);

            EventBus.subscribe(EVENTS.UNDO_LAST_ACTION_REQUEST, (drawEvent: DrawEvent) => {
                let obj: NetworkingEvent = {
                    type: NetworkingEvents.UNDO_EVENT,
                    payload: null
                }
                broadcastToAll(connections, obj);
            }, EVENT_BUS_KEY);

            EventBus.subscribe(EVENTS.REDO_FUTURE_ACTION_REQUEST, (drawEvent: DrawEvent) => {
                let obj: NetworkingEvent = {
                    type: NetworkingEvents.REDO_EVENT,
                    payload: null
                }
                broadcastToAll(connections, obj);
            }, EVENT_BUS_KEY);
        });
    }

    function answerJoinRequest(from: string, signal: any, name: string, peer: Peer.Instance) {
        peer.on('signal', (data) => {
            socket?.emit('answerJoinRequest', { signal: data, to: from });
        });

        peer.signal(signal);

        peer.once("connect", () => {
            let connection = new Connection(from, name, peer, nanoid(10));
            connections.push(connection);
            setConnections([...connections]);

            socket?.emit("memberJoin", { from: connection.from, name: connection.name, id: connection.id })

            setUpConnectionAsHost(connection);
        });



        peer.on('error', (err) => {
            console.error(err);
        });
    }

    function setUpConnectionAsHost(connection: Connection) {

        // Creating member
        let member = new Member(connection.id, connection.name, new Avataaar());
        addMember(member);

        // Notify members of the new user
        let newUserJoinedEvent: NetworkingEvent = {
            type: NetworkingEvents.NEW_USER_JOINED,
            payload: member
        }

        broadcast(connections, connection.from, newUserJoinedEvent);

        // Sync EventCache with the new member
        let objEventCache: NetworkingEvent = {
            type: NetworkingEvents.EVENT_CACHE_SYNC,
            payload: EventCache
        }

        connection.peer.send(JSON.stringify(objEventCache));

        // Sync members with the new member
        let objMembers: NetworkingEvent = {
            type: NetworkingEvents.MEMBERS_SYNC,
            payload: internalMembers
        }

        connection.peer.send(JSON.stringify(objMembers));

        // Setting up connections
        setConnections(connections);


        // Setting up peer listeners
        connection.peer.on("data", (data) => {
            if (mutedIds.indexOf(connection.id) !== -1) {
                return;
            }
            let networkingEvent: NetworkingEvent = JSON.parse(data);
            if (networkingEvent.type === NetworkingEvents.DRAW_EVENT || NetworkingEvents.REDO_EVENT || NetworkingEvents.UNDO_EVENT) {
                broadcast(connections, connection.from, networkingEvent);
            }
            consumeEvent(networkingEvent);
        })

        connection.peer.once("close", () => {
            connections.splice(connections.indexOf(connection), 1);
            let newUserJoinedEvent: NetworkingEvent = {
                type: NetworkingEvents.MEMBER_LEFT,
                payload: member
            }

            removeMember(member);

            socket?.emit("memberLeave", { from: connection.from, name: connection.name, id: connection.id });
            broadcastToAll(connections, newUserJoinedEvent);
        });

    }

    function setUpConnectionAsClient(peer: Peer.Instance) {
        // Setting up peer listeners
        peer.on("data", (data) => {
            let networkingEvent: NetworkingEvent = JSON.parse(data);
            consumeEvent(networkingEvent);
        });

        peer.once("close", () => {
            peer.removeAllListeners("data");
            // Host migration should happen automatically
        });

        // Setting up context and EventBus listeners
        host = peer;

        setHasJoinedRoom(true);

        EventBus.dispatchEvent(EVENTS.JOINED_ROOM);

        EventBus.subscribe(EVENTS.SEND_DRAW_EVENT_REQUEST, (drawEvent: DrawEvent) => {
            sendDrawEvent(drawEvent);
        }, EVENT_BUS_KEY);
        EventBus.subscribe(EVENTS.UNDO_LAST_ACTION_REQUEST, (drawEvent: DrawEvent) => {
            let obj: NetworkingEvent = {
                type: NetworkingEvents.UNDO_EVENT,
                payload: null
            }
            sendNetworkingEvent(obj);
        }, EVENT_BUS_KEY);

        EventBus.subscribe(EVENTS.REDO_FUTURE_ACTION_REQUEST, (drawEvent: DrawEvent) => {
            let obj: NetworkingEvent = {
                type: NetworkingEvents.REDO_EVENT,
                payload: null
            }
            sendNetworkingEvent(obj);
        }, EVENT_BUS_KEY);
    }

    function consumeEvent(networkingEvent: NetworkingEvent) {
        switch (networkingEvent.type) {
            case NetworkingEvents.NEW_USER_JOINED: {
                if (isHost) break;
                EventBus.dispatchEvent(EVENTS.NEW_USER_JOINED, networkingEvent.payload);
                addMember(networkingEvent.payload);
                break;
            }
            case NetworkingEvents.EVENT_CACHE_SYNC: {
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
                internalMembers = networkingEvent.payload;
                setMembers([...networkingEvent.payload]);
                setMe(internalMembers[internalMembers.length - 1]);
                break;
            }
            case NetworkingEvents.MEMBER_LEFT: {
                if (isHost) break;
                let mem = networkingEvent.payload;
                removeMember(mem);
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
        if (hasMember(member)) return;
        internalMembers.push(member);
        setMembers([...internalMembers]);
    }

    function removeMember(member: Member) {
        internalMembers.splice(internalMembers.indexOf(member));
        setMembers([...internalMembers]);
    }

    function hasMember(member: Member) {
        for (let m of internalMembers) {
            if (m == member) {
                return true;
            }
        }

        return false;
    }

    function getMemberIndexByIdFromState(id: string): number {
        if (!members) return -1;
        let index = -1;
        for (let i = 0; i < members.length; i++) {
            if (members[i].id == id) {
                index = i;
                break;
            }
        }

        return index;
    }

    function toggleMute(member: Member, isMuted: boolean) {
        if (!members) return;
        members[members.indexOf(member)].isMuted = isMuted;
        if (isMuted) {
            mutedIds.push(members[members.indexOf(member)].id);
        }
        else {
            mutedIds.splice(mutedIds.indexOf(members[members.indexOf(member)].id), 1);
        }
        setMembers([...members]);
    }

    return (<SocketContext.Provider value={{ key, startServerConnection, createRoom, joinRoom, sendDrawEvent, hasJoinedRoom, members, toggleMute, isHostState }}>{children}</SocketContext.Provider>)
}

export { ContextProvider, SocketContext };