import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { createContext, useContext, useEffect, useState } from 'react';
import EventBus, { EVENTS } from './Events/EventBus';

const SocketContext = createContext({});

const ContextProvider = ({ children }: any) => {
    const [key, setKey] = useState("Default");

    useEffect(() => {
        EventBus.subscribe(EVENTS.START_SERVER_CONNECTION_REQUEST, (token: any) => {
            const socket = io("http://localhost:5000", { query: { "captchaToken": token } });

            socket.on("success", (res: any) => {
                EventBus.dispatchEvent(EVENTS.SUCCESSFUL_SERVER_CONNECTION);
            });

            EventBus.subscribe(EVENTS.CREATE_ROOM_REQUEST, () => {
                socket.emit("createroom");
            });

            socket.on("roomcreated", (res) => {
                setKey(res.id);
                console.log(key);
                EventBus.dispatchEvent(EVENTS.ROOM_CREATED, res.id);
            })
        });
    }, []);

    function createRoom(id: string) {

    }

    function connectToGroup() {

    }

    function inviteToGroup() {

    }

    function leaveGroup() {

    }

    return (<SocketContext.Provider value={{ key }}>{children}</SocketContext.Provider>)
}

export { ContextProvider, SocketContext };