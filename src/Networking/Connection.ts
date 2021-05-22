import SimplePeer from "simple-peer";

export default class Connection {
    from: string;
    name: string;
    peer: SimplePeer.Instance;
    id: string;

    constructor(from: string, name: string, peer: SimplePeer.Instance, id: string) {
        this.from = from;
        this.name = name;
        this.peer = peer;
        this.id = id;
    }
}