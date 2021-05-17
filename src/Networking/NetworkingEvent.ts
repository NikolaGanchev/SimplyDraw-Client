import { NetworkingEvents } from "./NetworkingEvents";

export default interface NetworkingEvent {
    type: NetworkingEvents;
    payload: any;
}