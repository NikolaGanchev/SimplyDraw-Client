import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
    const [name, setName] = useState("Default");
    const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
    const [members, setMembers] = useState<Member[]>();
    const [isHostState, setIsHostState] = useState(false);
    let internalMembers = useRef<Member[]>([]);
    const mutedIds = useRef<string[]>([]);
    const meRef = useRef<Member>();
    let isHost = false;
    let host: Peer.Instance | null;
    const connections = useRef<Connection[]>([]);
    let socket: Socket | null;
    const EVENT_BUS_KEY = "EVENT_BUS_KEY";


    function startServerConnection(token: any) {
        socket = io("http://localhost:5000", { query: { "captchaToken": token } });

        socket.once("success", (res: any) => {
            EventBus.dispatchEvent(EVENTS.SUCCESSFUL_SERVER_CONNECTION);
        });

        socket.on('joinroom', ({ from, signal, name }: any) => {
            // Check if websockets did't send the request more than one time
            if (connectionsContain(connections.current, from)) return;

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
                broadcastToAll(connections.current, obj);
            }, EVENT_BUS_KEY);

            EventBus.subscribe(EVENTS.REDO_FUTURE_ACTION_REQUEST, (drawEvent: DrawEvent) => {
                let obj: NetworkingEvent = {
                    type: NetworkingEvents.REDO_EVENT,
                    payload: null
                }
                broadcastToAll(connections.current, obj);
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
        setHasJoinedRoom(false);
        setMembers([]);
        internalMembers.current.length = 0;
        host = null;
        connections.current.length = 0;
        EventBus.unsubscribeAll(EVENT_BUS_KEY);
    }

    function resetState() {
        setKey("");
        setMe(undefined);
        setHasJoinedRoom(false);
        setMembers(undefined);
        internalMembers.current.length = 0;
        isHost = false;
        setIsHostState(false);
        host = null;
        connections.current.length = 0;
        socket = null;
        mutedIds.current.length = 0;
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
                broadcastToAll(connections.current, obj);
            }, EVENT_BUS_KEY);

            EventBus.subscribe(EVENTS.REDO_FUTURE_ACTION_REQUEST, (drawEvent: DrawEvent) => {
                let obj: NetworkingEvent = {
                    type: NetworkingEvents.REDO_EVENT,
                    payload: null
                }
                broadcastToAll(connections.current, obj);
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
            connections.current.push(connection);

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

        broadcast(connections.current, connection.from, newUserJoinedEvent);

        // Sync EventCache with the new member
        let objEventCache: NetworkingEvent = {
            type: NetworkingEvents.EVENT_CACHE_SYNC,
            payload: EventCache
        }

        connection.peer.send(JSON.stringify(objEventCache));

        // Sync members with the new member
        let objMembers: NetworkingEvent = {
            type: NetworkingEvents.MEMBERS_SYNC,
            payload: internalMembers.current
        }

        connection.peer.send(JSON.stringify(objMembers));

        // Setting up peer listeners
        connection.peer.on("data", (data) => {
            console.log(JSON.stringify(mutedIds.current));
            if (mutedIds.current.includes(connection.id)) {
                return;
            }
            let networkingEvent: NetworkingEvent = JSON.parse(data);
            if (networkingEvent.type === NetworkingEvents.DRAW_EVENT || NetworkingEvents.REDO_EVENT || NetworkingEvents.UNDO_EVENT) {
                broadcast(connections.current, connection.from, networkingEvent);
            }
            consumeEvent(networkingEvent);
        })

        connection.peer.once("close", () => {
            connections.current.splice(connections.current.indexOf(connection), 1);
            let newUserJoinedEvent: NetworkingEvent = {
                type: NetworkingEvents.MEMBER_LEFT,
                payload: member
            }

            removeMember(member);

            socket?.emit("memberLeave", { from: connection.from, name: connection.name, id: connection.id });
            broadcastToAll(connections.current, newUserJoinedEvent);
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
                internalMembers.current = networkingEvent.payload;
                setMembers([...networkingEvent.payload]);
                let me = internalMembers.current[internalMembers.current.length - 1]
                setMe(me);
                meRef.current = me;
                break;
            }
            case NetworkingEvents.MEMBER_LEFT: {
                if (isHost) break;
                let mem = networkingEvent.payload;
                removeMember(mem);
                break;
            }
            case NetworkingEvents.MUTED_STATE_CHANGE: {
                if (isHost) break;
                let isMuted = networkingEvent.payload.isMuted;
                let member: Member = networkingEvent.payload.member;
                toggleMute(member, isMuted);
                console.log(JSON.stringify(networkingEvent) + "\n ----------- \n" + JSON.stringify(meRef.current));
                if (meRef.current && member.id === meRef.current.id) {
                    EventBus.dispatchEvent(EVENTS.MUTED_STATE_CHANGE, isMuted);
                }
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
        if (connections.current.length === 0 && (host === null || host === undefined)) return;

        if (isHost) {
            broadcastToAll(connections.current, networkingEvent);
        }
        else {
            host?.send(JSON.stringify(networkingEvent));
        }

    }

    function addMember(member: Member) {
        if (hasMember(member)) return;
        internalMembers.current.push(member);
        setMembers([...internalMembers.current]);
    }

    function removeMember(member: Member) {
        internalMembers.current.splice(internalMembers.current.indexOf(member));
        setMembers([...internalMembers.current]);
    }

    function hasMember(member: Member) {
        for (let m of internalMembers.current) {
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

    function sendMutedState(member: Member, isMuted: boolean) {
        let event: NetworkingEvent = {
            type: NetworkingEvents.MUTED_STATE_CHANGE,
            payload: {
                isMuted: isMuted,
                member: member
            }
        }

        broadcastToAll(connections.current, event);
    }

    function toggleMute(member: Member, isMuted: boolean) {
        if (!members) return;
        members[members.indexOf(member)].isMuted = isMuted;

        if (isMuted && !mutedIds.current.includes(member.id)) {
            let id = members[members.indexOf(member)].id;
            mutedIds.current.push(id);
        }
        else {
            mutedIds.current.splice(mutedIds.current.indexOf(members[members.indexOf(member)].id));
            console.log(JSON.stringify(mutedIds.current));
        }

        sendMutedState(member, isMuted);

        setMembers([...members]);
    }

    return (<SocketContext.Provider value={{ key, startServerConnection, createRoom, joinRoom, sendDrawEvent, hasJoinedRoom, members, toggleMute, isHostState, me }}>{children}</SocketContext.Provider>)
}

export { ContextProvider, SocketContext };