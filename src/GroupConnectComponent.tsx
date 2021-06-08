import React, { useState, useContext, useRef } from "react";
import { useTranslation } from "react-i18next";
import SvgIconButton from "./SvgIconButton";
import GroupIcon from './resources/GroupFill';
import ResponsiveContentModal from "./ResponsiveContentModal";
import HCaptcha from '@hcaptcha/react-hcaptcha';
import EventBus, { EVENTS } from "./Events/EventBus";
import { NetworkContext } from './NetworkContext';
import RoomOption from "./RoomOptions";
import { VALID_VALUES } from "./utils/ValidValues";

export default function GroupConnectComponent(props: any) {
    const [showModal, setShowModal] = useState(false);
    const [t] = useTranslation("common");
    const [header, setHeader] = useState(t("group.setup.headers.captcha"));
    const inputRef = useRef<HTMLInputElement>(null);
    const [isCaptcha, setIsCaptcha] = useState(true);
    const [joinRoomCode, setJoinRoomCode] = useState("");
    const [isCreateRoom, setIsCreateRoom] = useState(false);
    const [isChoose, setIsChoose] = useState(false);
    const [isJoinRoom, setIsJoinRoom] = useState(false);
    const { key, startServerConnection, createRoom, joinRoom, hasJoinedRoom, changeName, me, disbandRoom,
        handleLeaveRoom, isMuteByDefault, toggleMuteByDefault }: any = useContext(NetworkContext);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const createNameInputRef = useRef<HTMLInputElement>(null);

    function onClick() {
        setShowModal(true);
    }

    function onVerifyCaptcha(token: any) {
        startServerConnection(token);
    }

    function handleCreateRoom() {
        createRoom();
        EventBus.subscribe(EVENTS.ROOM_CREATED, (localKey: string) => {
            setIsChoose(false);
            setIsCreateRoom(true);
            setHeader(t("group.setup.rooms.create.success"));
        });
    }

    function handleJoinRoom() {
        setHeader(t("group.setup.rooms.join.header"));
        setIsChoose(false);
        setIsJoinRoom(true);
    }

    function handleCodeChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (event.target.value.match("^(?:[a-zA-Z]|)+$") != null) {
            setJoinRoomCode(event.target.value.toUpperCase())
        }
    }

    function submitCode() {
        if (inputRef && inputRef.current && nameInputRef && nameInputRef.current) {
            let value = inputRef.current.value;
            let name = nameInputRef.current.value;
            joinRoom(value, name);
        }
    }

    function resetState() {
        setHeader(t("group.setup.headers.captcha"));
        setIsCaptcha(true);
        setIsChoose(false);
        setIsCreateRoom(false);
        setIsJoinRoom(false);
        setJoinRoomCode("");
    }

    EventBus.subscribe(EVENTS.SUCCESSFUL_SERVER_CONNECTION, () => {
        setHeader(t("group.setup.headers.room"))
        setIsCaptcha(false);
        setIsChoose(true);
    });

    EventBus.subscribe(EVENTS.RESET_STATE_EVENT, () => {
        resetState();
    });

    EventBus.subscribe(EVENTS.BECAME_HOST_EVENT, () => {
        setIsJoinRoom(false);
        setIsChoose(false);
        setIsCreateRoom(true);
        setHeader(t("group.setup.rooms.create.success"));
    });

    function onToggleMuteByDefault(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target) {
            toggleMuteByDefault(e.target.checked);
        }
    }

    return (
        <div>
            <SvgIconButton icon={GroupIcon} onClick={onClick} tooltip={t("tooltip.rooms")}></SvgIconButton>
            {(showModal) ?
                (<ResponsiveContentModal header={header} onResponse={() => { setShowModal(false) }}>
                    {isCaptcha ?
                        (
                            <HCaptcha sitekey="d4e70c8e-3026-4940-8d7c-a40d5daf0d62" onVerify={onVerifyCaptcha} />
                        ) : (null)}

                    {isChoose ?
                        (
                            <div>
                                <RoomOption header={t("group.setup.rooms.create.header")} text={t("group.setup.rooms.create.text")} onClick={handleCreateRoom}></RoomOption>
                                <RoomOption header={t("group.setup.rooms.join.header")} text={t("group.setup.rooms.join.text")} onClick={handleJoinRoom}></RoomOption>
                            </div>
                        ) : (null)}
                    {isCreateRoom ?
                        (
                            <div>
                                <div>{t("group.setup.rooms.create.instructions")} </div>
                                <span className="text-xl"><b>{key}</b></span>
                                <br></br>
                                <input type="text" maxLength={VALID_VALUES.MAX_NAME_SIZE} className="p-3 border-2 border-black rounded-md" ref={createNameInputRef} placeholder={t("group.setup.placeholder.name")} defaultValue={me.name}></input>
                                <button className="bg-green-400 rounded-md p-3 ml-3 mt-3" onClick={() => { if (createNameInputRef.current) { changeName(createNameInputRef.current.value) } }}>{t("group.setup.rooms.create.name")}</button>
                                <br></br>
                                <label>
                                    {t("group.members.mute.default.title")}
                                    <input type="checkbox" checked={isMuteByDefault} onChange={onToggleMuteByDefault} className="place-self-center ml-2 align-middle"></input>
                                </label>
                                <br></br>
                                <span className="text-sm">{t("group.members.mute.default.explanation")}</span>
                                <br></br>
                                <button className="bg-red-400 rounded-md p-3 mt-3" onClick={disbandRoom}>{t("group.setup.rooms.disband")}</button>
                            </div>
                        ) : (null)}
                    {isJoinRoom ?
                        (
                            <div><input type="text" maxLength={VALID_VALUES.MAX_NAME_SIZE} className="p-3 border-2 border-black rounded-md" ref={nameInputRef} placeholder={t("group.setup.placeholder.name")} defaultValue={(me) ? me.name : ""}></input>
                                <button className="bg-green-400 rounded-md p-3 ml-3 disabled:opacity-60" onClick={() => { if (nameInputRef.current) { changeName(nameInputRef.current.value) } }} disabled={!hasJoinedRoom}>{t("group.setup.rooms.join.name")}</button>
                                <br></br>
                                <input value={joinRoomCode} type="text" maxLength={6} onChange={handleCodeChange} className="p-3 border-2 border-black rounded-md" ref={inputRef} placeholder={t("group.setup.placeholder.code")} disabled={hasJoinedRoom}></input>
                                <button className="bg-green-400 rounded-md p-3 ml-3 mt-3 disabled:opacity-60" onClick={submitCode} disabled={hasJoinedRoom}>{t("group.setup.rooms.join.button")}</button>
                                <br></br>
                                <button className="bg-red-400 rounded-md p-3 mt-3 disabled:opacity-60" onClick={handleLeaveRoom} disabled={!hasJoinedRoom}>{t("group.setup.rooms.leave")}</button>
                            </div>
                        ) : (null)}
                    {hasJoinedRoom ?
                        (
                            <div>
                                <div> {t("group.setup.rooms.join.success")}</div>
                            </div>
                        ) : (null)}
                </ResponsiveContentModal>)
                :
                (null)
            }
        </div >
    );
}