import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import IconButton from "./IconButton";
import GroupIcon from './resources/group-fill.svg';
import ResponsiveContentModal from "./ResponsiveContentModal";
import HCaptcha from '@hcaptcha/react-hcaptcha';
import EventBus, { EVENTS } from "./Events/EventBus";
import { SocketContext } from './SocketContext';
import RoomOption from "./RoomOptions";

export default function GroupConnectComponent(props: any) {
    const [showModal, setShowModal] = useState(false);
    const [t] = useTranslation("common");
    const [header, setHeader] = useState(t("group.setup.headers.captcha"));
    const [innerContent, setInnerContent] = useState((
        <HCaptcha sitekey="10000000-ffff-ffff-ffff-000000000001" onVerify={onVerifyCaptcha} />
    ));
    const { key, setKey }: any = useContext(SocketContext);

    function onClick() {
        setShowModal(true);
    }

    function onVerifyCaptcha(token: any) {
        EventBus.dispatchEvent(EVENTS.START_SERVER_CONNECTION_REQUEST, token);
    }

    function createRoom() {
        EventBus.dispatchEvent(EVENTS.CREATE_ROOM_REQUEST);
        EventBus.subscribe(EVENTS.ROOM_CREATED, (localKey: string) => {
            setInnerContent(
                (
                    <div>{t("group.setup.rooms.create.instructions")} <br></br> <span className="text-xl"><b>{localKey}</b></span></div>
                )
            );
            setHeader(t("group.setup.rooms.create.success"));
        });
    }

    function joinRoom() {

    }

    EventBus.subscribe(EVENTS.SUCCESSFUL_SERVER_CONNECTION, () => {
        setHeader(t("group.setup.headers.room"))
        setInnerContent((<div>
            <RoomOption header={t("group.setup.rooms.create.header")} text={t("group.setup.rooms.create.text")} onClick={createRoom}></RoomOption>
            <RoomOption header={t("group.setup.rooms.join.header")} text={t("group.setup.rooms.join.text")} onClick={() => { }}></RoomOption>
        </div>))
    });

    return (
        <div>
            <IconButton icon={GroupIcon} onClick={onClick}></IconButton>
            {(showModal) ?
                (<ResponsiveContentModal header={header} onResponse={() => { setShowModal(false) }}>{innerContent}</ResponsiveContentModal>)
                :
                (null)
            }
        </div >
    );
}