import Avataaar from "../utils/Avataaar";

export default class Member {
    id: string;
    name: string;
    avatar: Avataaar;

    constructor(id: string, name: string, avatar: Avataaar) {
        this.id = id;
        this.name = name;
        this.avatar = avatar;
    }
}