import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import AvataaarComponent from "./AvataaarComponent";
import Member from "./Networking/Member";
import ResponsiveContentModal from "./ResponsiveContentModal";
import { SocketContext } from "./SocketContext";

export default function MemberComponent(props: any) {
    const [member, setMember] = useState<Member>(props.member);
    const [showDetails, setShowDetails] = useState(false);
    const [t] = useTranslation("common");

    const { isHostState, toggleMute, me }: any = useContext(SocketContext);

    function onToggle(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target) {
            toggleMute(member, e.target.checked);
        }
    }

    return (
        <div>
            {(showDetails) ?
                (<ResponsiveContentModal header={member.name} onResponse={() => { setShowDetails(false) }}>
                    <AvataaarComponent avatar={member.avatar}></AvataaarComponent>
                    {(member.isMuted) ?
                        (<span>{member.name + t("group.members.isMuted")}</span>)
                        :
                        (<span>{member.name + t("group.members.isNotMuted")}</span>)
                    }
                    {(isHostState && member.id !== me.id) ?
                        (
                            <div>
                                <label>
                                    {t("group.members.mute.title")}
                                    <input type="checkbox" checked={member.isMuted} onChange={onToggle}></input>

                                </label>
                                <br></br>
                                <span className="text-sm">{t("group.members.mute.explanation")}</span>
                            </div>
                        )
                        :
                        (null)}
                </ResponsiveContentModal>)
                :
                (null)
            }
            <div className="relative w-24 h-24 flex flex-col place-items-center place-content-center mr-2 cursor-pointer" onClick={() => { setShowDetails(true) }}>
                <AvataaarComponent avatar={member.avatar}></AvataaarComponent>
                <span className="absolute select-none" style={{ top: '5.625rem' }}>{member.name}</span>
            </div>
        </div>
    );
}