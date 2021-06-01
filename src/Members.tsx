import { SocketContext } from "./SocketContext";
import { useContext } from 'react';
import Member from "./Networking/Member";
import MemberComponent from "./MemberComponent";

export default function Members(props: any) {

    return (
        <SocketContext.Consumer>
            {({ members }: any) => (
                <div>{(members) ? (
                    <div className="fixed right-0 flex flex-col w-24 h-full space-y-4 pr-4 overflow-y-auto overflow-x-hidden rounded-md bg-gray-200 z-20">
                        {members.map((member: Member, i: number) => {
                            return <MemberComponent member={member} key={i}></MemberComponent>
                        })}
                    </div>
                ) :
                    (null)}</div>

            )}
        </SocketContext.Consumer>
    );
}