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
import { VALID_VALUES } from './utils/ValidValues';
import { PROTECTED_EVENTS } from './utils/ProtectedEvents';

const NetworkContext = createContext({});

const ContextProvider = ({ children }: any) => {
    const [t] = useTranslation("common");
    const [key, setKey] = useState("");
    const [me, setMe] = useState<Member>();
    const [name, setName] = useState<string>("Default");
    const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
    const [members, setMembers] = useState<Member[]>();
    const [isHostState, setIsHostState] = useState(false);
    const [isMuteByDefault, setIsMuteByDefault] = useState(false);
    const isMuteByDefaultRef = useRef(false);
    let internalMembers = useRef<Member[]>([]);
    const mutedIds = useRef<string[]>([]);
    const meRef = useRef<Member>();
    const isHost = useRef<boolean>(false);
    let host = useRef<Peer.Instance | null>(null);
    const connections = useRef<Connection[]>([]);
    let socket = useRef<Socket | null>(null);
    const EVENT_BUS_KEY = "EVENT_BUS_KEY";

    // Can't use i18n above since the language hasn't been changed yet
    useEffect(() => {
        setName(t("group.members.host"));
    }, [])

    function startServerConnection(token: any) {
        socket.current = io("http://localhost:5000", { query: { "captchaToken": token } });

        socket.current.once("success", (res: any) => {
            EventBus.dispatchEvent(EVENTS.SUCCESSFUL_SERVER_CONNECTION);
        });

        socket.current.on('joinroom', ({ from, signal, name }: any) => {
            // Check if websockets did't send the request more than one time
            if (connectionsContain(connections.current, from) || !isHost.current) return;

            if (name > VALID_VALUES.MAX_NAME_SIZE) return;

            const peer = new Peer({ initiator: false, trickle: false });
            answerJoinRequest(from, signal, name, peer);
        });

    }

    function createRoom() {
        socket.current?.emit("createroom");

        socket.current?.once("roomcreated", (res: any) => {
            handleRoomCreation(res.id);
        });
    }



    function joinRoom(code: string, name: string) {
        const peer = new Peer({ initiator: true, trickle: false });

        setName(name);

        peer.on('signal', (data) => {
            socket.current?.emit('joinroom', { userToCall: code, signalData: data, from: socket.current.id, name });
        });

        socket.current?.once('joinAccepted', (signal) => {
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

        socket.current?.once("joinTrySuccessful", (res: any) => {
            if (res.code === code) {
                console.log("success");
                socket.current?.emit("joinTrySuccessful", { code });
            }
        })

        socket.current?.once("garbageCollected", () => {
            EventBus.dispatchEvent(EVENTS.ERROR, new Error(t("error.room.garbageCollected")));
            leaveRoom();
        });

        socket.current?.once("noSuchCode", () => {
            EventBus.dispatchEvent(EVENTS.ERROR, new Error(t("error.room.noSuchCode")));
            leaveRoom();
        });

        socket.current?.once("tooManyInRoom", () => {
            EventBus.dispatchEvent(EVENTS.ERROR, new Error(t("error.room.tooManyInRoom")));
            leaveRoom();
        });

        socket.current?.once("hostMigration", () => {
            if (isHost.current) return;
            leaveRoom();

            joinRoom(code, name);
        });

        socket.current?.once("becomeHost", () => {
            let currentName = meRef.current?.name;
            leaveRoom();
            EventBus.dispatchEvent(EVENTS.BECAME_HOST_EVENT);
            handleRoomCreation(code, currentName);
        });
    }

    function answerJoinRequest(from: string, signal: any, name: string, peer: Peer.Instance) {


        peer.on('signal', (data) => {
            socket.current?.emit('answerJoinRequest', { signal: data, to: from });
        });

        peer.signal(signal);

        peer.once("connect", () => {
            // Add connection object to array

            let connection = new Connection(from, name, peer, nanoid(10));
            connections.current.push(connection);

            // Notify other members
            socket.current?.emit("memberJoin", { from: connection.from })

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

        // Would just do toggleMute(member, isMuteByDefault.current) but the toggleMute operation searches and updates the state too much
        // and sends too many networking requests to notify everyone of the new state
        // to justify the two lines of code less
        if (isMuteByDefaultRef.current) {
            toggleMute(member, true);
        }

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

        EventBus.subscribe(EVENTS.UNDO_LAST_ACTION_REQUEST, onUndoRequest, EVENT_BUS_KEY);

        EventBus.subscribe(EVENTS.REDO_FUTURE_ACTION_REQUEST, onRedoRequest, EVENT_BUS_KEY);
    }

    // Handlers
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
        socket.current?.once("garbageCollected", () => {
            EventBus.dispatchEvent(EVENTS.ERROR, new Error(t("error.room.garbageCollected")));
            onDisbandRoom();
        });

        EventBus.dispatchEvent(EVENTS.ROOM_CREATED, code);

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

    function handleLeaveRoom() {
        leaveRoom();
        socket.current = null;
        EventBus.dispatchEvent(EVENTS.RESET_STATE_EVENT);
    }

    // Actions

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

    function disbandRoom() {
        socket.current?.emit("disbandRoom");
        onDisbandRoom();
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

    function kick(member: Member) {
        if (isHost.current && connections.current && internalMembers.current) {
            let networkingEvent = {
                type: NetworkingEvents.KICK_EVENT,
                payload: null
            }

            connections.current[getConnectionIndexById(connections.current, member.id)].peer.send(JSON.stringify(networkingEvent));
            connections.current[getConnectionIndexById(connections.current, member.id)].peer.removeAllListeners("data");
            connections.current[getConnectionIndexById(connections.current, member.id)].peer.destroy();
        }
    }

    function leaveRoom() {
        commonReset();
    }

    function resetState() {

        connections.current.forEach((con: Connection) => {
            con.peer.removeAllListeners("data");
            con.peer.destroy();
        })

        commonReset();

        socket.current = null;
        EventBus.dispatchEvent(EVENTS.RESET_STATE_EVENT);
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

    function toggleMuteByDefault(muteByDefault: boolean) {
        setIsMuteByDefault(muteByDefault);
        isMuteByDefaultRef.current = muteByDefault;
    }

    function resize(ratio: number) {
        if (isHost.current) {
            let resizeEvent = {
                type: NetworkingEvents.RESIZE_EVENT,
                payload: ratio
            }

            broadcastToAll(connections.current, resizeEvent);
        }
    }

    // Senders

    // Notify members of the new user
    function notifyOfNewMember(member: Member, connection: Connection) {
        let newUserJoinedEvent: NetworkingEvent = {
            type: NetworkingEvents.NEW_MEMBER_JOINED,
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

    function sendDrawEvent(drawEvent: DrawEvent) {
        let obj: NetworkingEvent = {
            type: NetworkingEvents.DRAW_EVENT,
            payload: drawEvent
        }

        sendNetworkingEvent(obj);
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

    function sendNetworkingEvent(networkingEvent: NetworkingEvent) {
        if (connections.current.length === 0 && (host.current === null || host.current === undefined)) return;

        if (isHost.current) {
            broadcastToAll(connections.current, networkingEvent);
        }
        else {
            host?.current?.send(JSON.stringify(networkingEvent));
        }
    }

    // Events

    function onDataHost(data: any, connection: Connection) {
        // Check if member is muted
        if (mutedIds.current.includes(connection.id)) {
            return;
        }

        let networkingEvent: NetworkingEvent = JSON.parse(data);

        // Host shouldn't continue with protected events
        if (PROTECTED_EVENTS.includes(networkingEvent.type)) return;

        if (networkingEvent.type == NetworkingEvents.MEMBER_NAME_CHANGE) {
            let index = getMemberIndexById(internalMembers.current, connection.id);
            let member = internalMembers.current[index];
            if (member.id !== connection.id) {
                return;
            }
        }

        // If event should be sent to other members, do so
        if (networkingEvent.type === NetworkingEvents.DRAW_EVENT || NetworkingEvents.REDO_EVENT || NetworkingEvents.UNDO_EVENT || NetworkingEvents.MEMBER_NAME_CHANGE) {
            broadcast(connections.current, connection.from, networkingEvent);
        }

        // Consume the event 
        consumeEvent(networkingEvent, connection);
    }

    function onMemberLeave(connection: Connection, member: Member) {

        connections.current.splice(connections.current.indexOf(connection), 1);
        let memberLeftEvent: NetworkingEvent = {
            type: NetworkingEvents.MEMBER_LEFT,
            payload: member
        }

        removeMember(member);

        socket.current?.emit("memberLeave", { from: connection.from });
        broadcastToAll(connections.current, memberLeftEvent);
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

    function onDisbandRoom() {
        if (isHost.current) {
            resetState();
        }
    }

    // Simply consumes events; networking shouldn't be done in this function
    function consumeEvent(networkingEvent: NetworkingEvent, connection: Connection | null = null) {
        switch (networkingEvent.type) {
            case NetworkingEvents.NEW_MEMBER_JOINED: {
                if (networkingEvent.payload.name > VALID_VALUES.MAX_NAME_SIZE || networkingEvent.payload.id.length != VALID_VALUES.ID_LENGTH) return;
                EventBus.dispatchEvent(EVENTS.NEW_MEMBER_JOINED, networkingEvent.payload);
                addMember(networkingEvent.payload);
                break;
            }
            case NetworkingEvents.EVENT_CACHE_SYNC: {
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
                internalMembers.current = networkingEvent.payload;
                setMembers([...networkingEvent.payload]);
                let me = internalMembers.current[internalMembers.current.length - 1]
                setMe(me);
                meRef.current = me;
                break;
            }
            case NetworkingEvents.MEMBER_LEFT: {
                let mem = networkingEvent.payload;
                removeMember(mem);
                break;
            }
            case NetworkingEvents.MUTED_STATE_CHANGE: {
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
                changeMemberName(networkingEvent.payload.member, networkingEvent.payload.newName);
                break;
            }
            case NetworkingEvents.KICK_EVENT: {
                handleLeaveRoom();
                EventBus.dispatchEvent(EVENTS.ERROR, new Error(t("group.members.kick.error")));
                break;
            }
            case NetworkingEvents.RESIZE_EVENT: {
                EventBus.dispatchEvent(EVENTS.RESIZE_EVENT, networkingEvent.payload);
                break;
            }
        }
    }

    // State manipulators

    function connectionsContain(connectionsArr: Connection[], socketId: string) {
        let set = new Set();
        connectionsArr.forEach((con) => {
            set.add(con.from);
        });

        return set.has(socketId);
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

    function getConnectionIndexById(connectionArray: Connection[], id: string): number {
        if (!connectionArray) return -1;
        let index = -1;
        for (let i = 0; i < connectionArray.length; i++) {
            if (connectionArray[i].id == id) {
                index = i;
                break;
            }
        }

        return index;
    }

    function commonReset() {
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
        host.current?.removeAllListeners("data");
        host.current?.destroy();
        host.current = null;
        connections.current.length = 0;
        meRef.current = undefined;
        mutedIds.current.length = 0;
        EventBus.unsubscribeAll(EVENT_BUS_KEY);
    }

    return (<NetworkContext.Provider value={{ key, startServerConnection, createRoom, joinRoom, sendDrawEvent, hasJoinedRoom, members, toggleMute, isHostState, me, changeName, disbandRoom, leaveRoom, handleLeaveRoom, kick, resize, isMuteByDefault, toggleMuteByDefault }}>{children}</NetworkContext.Provider>)
}

export { ContextProvider, NetworkContext };