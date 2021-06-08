import { NetworkContext } from "./NetworkContext";
import Member from "./Networking/Member";
import { useContext } from 'react';
import MemberComponent from "./MemberComponent";
import { Fade } from "react-awesome-reveal";

export default function Members(props: any) {

    const { members }: any = useContext(NetworkContext);

    return (
        <div>{(members) ? (
            <Fade duration={500} className="fixed right-0 flex flex-col w-24 h-full space-y-4 pr-4 overflow-y-auto overflow-x-hidden rounded-md bg-gray-200 z-20">
                <div className="fixed right-0 flex flex-col w-24 h-full space-y-4 pr-4 overflow-y-auto overflow-x-hidden rounded-md bg-gray-200 z-20">
                    {members.map((member: Member, i: number) => {
                        return <Fade><MemberComponent member={member} key={member.id}></MemberComponent></Fade>;
                    })}
                </div>
            </Fade>
        ) :
            (null)}</div>
    );
}