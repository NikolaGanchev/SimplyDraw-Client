import { useState } from "react";
import AvataaarComponent from "./AvataaarComponent";
import Member from "./Networking/Member";

export default function MemberComponent(props: any) {
    const [member, setMember] = useState<Member>(props.member);

    return (
        <div className="relative w-24 h-24 flex flex-col place-items-center place-content-center mr-2">
            <AvataaarComponent avatar={member.avatar}></AvataaarComponent>
            <span className="absolute select-none" style={{ top: '5.625rem' }}>{member.name}</span>
        </div>
    );
}