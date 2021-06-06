import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import AvataaarComponent from "./AvataaarComponent";
import Member from "./Networking/Member";
import ResponsiveContentModal from "./ResponsiveContentModal";
import { NetworkContext } from "./NetworkContext";

export default function MemberComponent(props: any) {
    const [member, setMember] = useState<Member>(props.member);
    const [showDetails, setShowDetails] = useState(false);
    const [t] = useTranslation("common");

    const { isHostState, toggleMute, me, kick }: any = useContext(NetworkContext);

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
                                    <input type="checkbox" checked={member.isMuted} onChange={onToggle} className="place-self-center ml-2 align-middle"></input>

                                </label>
                                <br></br>
                                <span className="text-sm">{t("group.members.mute.explanation")}</span>
                                <br></br>
                                <button className="bg-red-400 rounded-md p-3 mt-3" onClick={() => { kick(member) }}>{t("group.members.kick.title")}</button>
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
                <span className="absolute select-none wrap break-words w-24 text-center" style={{ top: '5.625rem' }}>{member.name}</span>
            </div>
        </div>
    );
}