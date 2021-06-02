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
import { useTranslation } from 'react-i18next';

const SocketContext = createContext({});

const ContextProvider = ({ children }: any) => {
    const [key, setKey] = useState("");
    const [me, setMe] = useState<Member>();
    const [name, setName] = useState("Default");
    const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
    const [members, setMembers] = useState<Member[]>();
    const [isHostState, setIsHostState] = useState(false);
    const [t] = useTranslation("common");
    let internalMembers = useRef<Member[]>([]);
    const mutedIds = useRef<string[]>([]);
    const meRef = useRef<Member>();
    const isHost = useRef<boolean>(false);
    let host = useRef<Peer.Instance | null>(null);
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
            handleRoomCreation(res.id);
        });
    }

    function handleRoomCreation(code: string, selfName: string = name) {
        let member = new Member(nanoid(10), selfName, new Avataaar());

        // Set state
        isHost.current = true;
        setIsHostState(true);
        setKey(code);
        setMe(member);
        addMember(member);
        meRef.current = member;

        // Event listeners
        socket?.once("garbageCollected", () => {
            EventBus.dispatchEvent(EVENTS.ERROR, new Error(t("error.room.garbageCollected")));
            disbandRoom();
        });

        EventBus.dispatchEvent(EVENTS.ROOM_CREATED, code);

        EventBus.subscribe(EVENTS.SEND_DRAW_EVENT_REQUEST, (drawEvent: DrawEvent) => {
            sendDrawEvent(drawEvent);
        }, EVENT_BUS_KEY);

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
    }

    function joinRoom(code: string, name: string) {
        const peer = new Peer({ initiator: true, trickle: false });

        setName(name);

        peer.on('signal', (data) => {
            socket?.emit('joinroom', { userToCall: code, signalData: data, from: socket.id, name });
        });

        socket?.once('joinAccepted', (signal) => {
            isHost.current = false;
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

        socket?.once("noSuchCode", () => {
            EventBus.dispatchEvent(EVENTS.ERROR, new Error(t("error.room.noSuchCode")));
            leaveRoom();
        });

        socket?.once("tooManyInRoom", () => {
            EventBus.dispatchEvent(EVENTS.ERROR, new Error(t("error.room.tooManyInRoom")));
            leaveRoom();
        });

        socket?.once("hostMigration", () => {
            if (isHost.current) return;
            leaveRoom();

            joinRoom(code, name);
        });

        socket?.once("becomeHost", () => {
            leaveRoom();
            EventBus.dispatchEvent(EVENTS.BECAME_HOST_EVENT);
            handleRoomCreation(code, meRef.current?.name);
        });
    }

    function answerJoinRequest(from: string, signal: any, name: string, peer: Peer.Instance) {
        peer.on('signal', (data) => {
            socket?.emit('answerJoinRequest', { signal: data, to: from });
        });

        peer.signal(signal);

        peer.once("connect", () => {
            // Add connection object to array
            let connection = new Connection(from, name, peer, nanoid(10));
            connections.current.push(connection);

            // Notify other members
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

        notifyOfNewMember(member, connection)

        sendEventCache(connection);

        sendMembers(connection);

        // Setting up peer listeners
        connection.peer.on("data", (data) => {
            onDataHost(data, connection);
        })

        connection.peer.once("close", () => {
            onMemberLeave(connection, member);
        });
    }

    function setUpConnectionAsClient(peer: Peer.Instance) {
        // Setting up context 
        host.current = peer;
        setHasJoinedRoom(true);
        EventBus.dispatchEvent(EVENTS.JOINED_ROOM);

        // Setting up peer listeners
        peer.on("data", (data) => {
            onDataClient(data);
        });

        // Host migration should happen automatically
        peer.once("close", () => {
            peer.removeAllListeners("data");
        });

        // EventBus listeners

        EventBus.subscribe(EVENTS.SEND_DRAW_EVENT_REQUEST, (drawEvent: DrawEvent) => {
            sendDrawEvent(drawEvent);
        }, EVENT_BUS_KEY);

        EventBus.subscribe(EVENTS.UNDO_LAST_ACTION_REQUEST, onUndoRequest, EVENT_BUS_KEY);

        EventBus.subscribe(EVENTS.REDO_FUTURE_ACTION_REQUEST, onRedoRequest, EVENT_BUS_KEY);
    }

    // Notify members of the new user
    function notifyOfNewMember(member: Member, connection: Connection) {
        let newUserJoinedEvent: NetworkingEvent = {
            type: NetworkingEvents.NEW_USER_JOINED,
            payload: member
        }

        broadcast(connections.current, connection.from, newUserJoinedEvent);
    }

    // Sync EventCache with the new member
    function sendEventCache(connection: Connection) {
        let objEventCache: NetworkingEvent = {
            type: NetworkingEvents.EVENT_CACHE_SYNC,
            payload: EventCache
        }

        connection.peer.send(JSON.stringify(objEventCache));
    }

    // Sync members with the new member
    function sendMembers(connection: Connection) {
        let objMembers: NetworkingEvent = {
            type: NetworkingEvents.MEMBERS_SYNC,
            payload: internalMembers.current
        }

        connection.peer.send(JSON.stringify(objMembers));
    }

    function onDataHost(data: any, connection: Connection) {
        // Check if member is muted
        if (mutedIds.current.includes(connection.id)) {
            return;
        }

        let networkingEvent: NetworkingEvent = JSON.parse(data);

        // If event should be sent to other members, do so
        if (networkingEvent.type === NetworkingEvents.DRAW_EVENT || NetworkingEvents.REDO_EVENT || NetworkingEvents.UNDO_EVENT) {
            broadcast(connections.current, connection.from, networkingEvent);
        }

        // Consume the event 
        consumeEvent(networkingEvent, connection);
    }

    function onMemberLeave(connection: Connection, member: Member) {
        connections.current.splice(connections.current.indexOf(connection), 1);
        let userLeftEvent: NetworkingEvent = {
            type: NetworkingEvents.MEMBER_LEFT,
            payload: member
        }

        removeMember(member);

        socket?.emit("memberLeave", { from: connection.from, name: connection.name, id: connection.id });
        broadcastToAll(connections.current, userLeftEvent);
    }

    function onDataClient(data: any) {
        let networkingEvent: NetworkingEvent = JSON.parse(data);
        consumeEvent(networkingEvent);
    }

    function onUndoRequest() {
        let obj: NetworkingEvent = {
            type: NetworkingEvents.UNDO_EVENT,
            payload: null
        }
        sendNetworkingEvent(obj);
    }

    function onRedoRequest() {
        let obj: NetworkingEvent = {
            type: NetworkingEvents.REDO_EVENT,
            payload: null
        }
        sendNetworkingEvent(obj);
    }

    function changeName(newName: string) {
        if (!meRef.current) return;
        if (meRef.current.isMuted) {
            EventBus.dispatchEvent(EVENTS.ERROR, new Error(t("error.muted.name")));
            return;
        }

        meRef.current.name = newName;

        changeMemberName(meRef.current, newName);

        sendNameChangeEvent(meRef.current, newName);
    }

    function changeMemberName(member: Member, newName: string) {
        let index = getMemberIndexById(internalMembers.current, member.id);

        if (internalMembers.current) {
            internalMembers.current[index].name = newName;
            setMembers([...internalMembers.current]);
            let member = Object.assign({}, meRef.current);
            setMe(member);
        }
    }

    function sendNameChangeEvent(member: Member, newName: string) {
        let networkingEvent: NetworkingEvent = {
            type: NetworkingEvents.MEMBER_NAME_CHANGE,
            payload: {
                member: member,
                newName: newName
            }
        };

        sendNetworkingEvent(networkingEvent);
    }

    function disbandRoom() {
        if (isHost.current) {
            resetState();
        }
    }

    function leaveRoom() {
        if (meRef.current && meRef.current.isMuted) {
            toggleMute(meRef.current, false);
            EventBus.dispatchEvent(EVENTS.MUTED_STATE_CHANGE, false);
        }
        isHost.current = false;
        setIsHostState(false);
        setKey("");
        setMe(undefined);
        setHasJoinedRoom(false);
        setMembers([]);
        internalMembers.current.length = 0;
        host.current = null;
        meRef.current = undefined;
        connections.current.length = 0;
        EventBus.unsubscribeAll(EVENT_BUS_KEY);
    }

    function resetState() {
        if (meRef.current && meRef.current.isMuted) {
            toggleMute(meRef.current, false);
            EventBus.dispatchEvent(EVENTS.MUTED_STATE_CHANGE, false);
        }
        setKey("");
        setMe(undefined);
        setHasJoinedRoom(false);
        setMembers(undefined);
        internalMembers.current.length = 0;
        isHost.current = false;
        setIsHostState(false);
        host.current = null;
        connections.current.length = 0;
        socket = null;
        meRef.current = undefined;
        mutedIds.current.length = 0;
        EventBus.unsubscribeAll(EVENT_BUS_KEY);
        EventBus.dispatchEvent(EVENTS.RESET_STATE_EVENT);
    }

    function consumeEvent(networkingEvent: NetworkingEvent, connection: Connection | null = null) {
        switch (networkingEvent.type) {
            case NetworkingEvents.NEW_USER_JOINED: {
                if (isHost.current) break;
                EventBus.dispatchEvent(EVENTS.NEW_USER_JOINED, networkingEvent.payload);
                addMember(networkingEvent.payload);
                break;
            }
            case NetworkingEvents.EVENT_CACHE_SYNC: {
                if (isHost.current) break;
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
                if (isHost.current) break;
                internalMembers.current = networkingEvent.payload;
                setMembers([...networkingEvent.payload]);
                let me = internalMembers.current[internalMembers.current.length - 1]
                setMe(me);
                meRef.current = me;
                break;
            }
            case NetworkingEvents.MEMBER_LEFT: {
                if (isHost.current) break;
                let mem = networkingEvent.payload;
                removeMember(mem);
                break;
            }
            case NetworkingEvents.MUTED_STATE_CHANGE: {
                if (isHost.current) break;
                let isMuted = networkingEvent.payload.isMuted;
                let member: Member = networkingEvent.payload.member;
                toggleMute(member, isMuted);
                if (meRef.current && member.id === meRef.current.id) {
                    EventBus.dispatchEvent(EVENTS.MUTED_STATE_CHANGE, isMuted);
                }
                break;
            }
            case NetworkingEvents.MEMBER_NAME_CHANGE: {
                if (!internalMembers.current) return;
                if (isHost.current && connection) {
                    let index = getMemberIndexById(internalMembers.current, connection.id);
                    let member = internalMembers.current[index];
                    if (member.id == connection.id) {
                        changeMemberName(member, networkingEvent.payload.newName);
                        sendNetworkingEvent(networkingEvent);
                    }
                }
                else if (!isHost.current && !connection) {
                    changeMemberName(networkingEvent.payload.member, networkingEvent.payload.newName);
                }
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
        if (connections.current.length === 0 && (host.current === null || host.current === undefined)) return;

        if (isHost.current) {
            broadcastToAll(connections.current, networkingEvent);
        }
        else {
            host?.current?.send(JSON.stringify(networkingEvent));
        }
    }

    function addMember(member: Member) {
        if (hasMember(member)) return;
        internalMembers.current.push(member);
        setMembers([...internalMembers.current]);
    }

    function removeMember(member: Member) {
        if (mutedIds.current && mutedIds.current.includes(member.id)) {
            mutedIds.current.splice(mutedIds.current.indexOf(member.id), 1);
        }
        internalMembers.current.splice(internalMembers.current.indexOf(member), 1);
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

    function getMemberIndexById(memberArray: Member[], id: string): number {
        if (!memberArray) return -1;
        let index = -1;
        for (let i = 0; i < memberArray.length; i++) {
            if (memberArray[i].id == id) {
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
        if (!internalMembers.current) return;
        let index = getMemberIndexById(internalMembers.current, member.id);
        internalMembers.current[index].isMuted = isMuted;


        if (meRef.current && meRef.current.id === member.id) {
            meRef.current.isMuted = isMuted;
        }

        if (isMuted && !mutedIds.current.includes(member.id)) {
            let id = member.id;
            mutedIds.current.push(id);
        }
        else {
            mutedIds.current.splice(mutedIds.current.indexOf(internalMembers.current[index].id));
        }

        sendMutedState(member, isMuted);

        setMembers([...internalMembers.current]);
    }

    return (<SocketContext.Provider value={{ key, startServerConnection, createRoom, joinRoom, sendDrawEvent, hasJoinedRoom, members, toggleMute, isHostState, me, meRef, changeName }}>{children}</SocketContext.Provider>)
}

export { ContextProvider, SocketContext };