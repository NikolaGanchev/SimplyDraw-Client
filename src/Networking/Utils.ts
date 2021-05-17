import Connection from "./Connection";

export function broadcast(connections: Connection[], sender: string, obj: any) {
    connections.forEach((connection) => {
        if (connection.from !== sender) {
            connection.peer.send(JSON.stringify(obj));
        }
    });
}

export function broadcastToAll(connections: Connection[], obj: any) {
    connections.forEach((connection) => {
        connection.peer.send(JSON.stringify(obj));
    });
}