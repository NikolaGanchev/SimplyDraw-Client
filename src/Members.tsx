import { NetworkContext } from "./NetworkContext";
import Member from "./Networking/Member";
import { useContext } from 'react';
import MemberComponent from "./MemberComponent";
import { Fade } from "react-awesome-reveal";

export default function Members(props: any) {

    const { members }: any = useContext(NetworkContext);

    return (
        <div>{(members) ? (
            <Fade duration={500} className="fixed right-0 flex flex-col w-24 h-full space-y-4 pr-4 overflow-y-auto overflow-x-hidden rounded-md">
                <div className="fixed right-0 flex flex-col w-24 h-full mt-12 space-y-4 pr-4 overflow-y-auto overflow-x-hidden rounded-md bg-gray-200">
                    {members.map((member: Member, i: number) => {
                        return <Fade className=""><MemberComponent member={member} key={member.id}></MemberComponent></Fade>;
                    })}
                </div>
            </Fade>
        ) :
            (null)}</div>
    );
}