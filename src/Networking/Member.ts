import Avataaar from "../utils/Avataaar";

export default class Member {
    id: string;
    name: string;
    avatar: Avataaar;
    isMuted: boolean;

    constructor(id: string, name: string, avatar: Avataaar, isMuted = false) {
        this.id = id;
        this.name = name;
        this.avatar = avatar;
        this.isMuted = isMuted;
    }
}