import SimplePeer from "simple-peer";

export default class Connection {
    from: string;
    signal: any;
    name: string;
    peer: SimplePeer.Instance;

    constructor(from: string, signal: any, name: string, peer: SimplePeer.Instance) {
        this.from = from;
        this.signal = signal;
        this.name = name;
        this.peer = peer;
    }
}