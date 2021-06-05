import { NetworkingEvents } from "../Networking/NetworkingEvents";

// Protected events are ones the host shouldn't do
export const PROTECTED_EVENTS: NetworkingEvents[] = [
    NetworkingEvents.NEW_MEMBER_JOINED,
    NetworkingEvents.EVENT_CACHE_SYNC,
    NetworkingEvents.MEMBERS_SYNC,
    NetworkingEvents.MEMBER_LEFT,
    NetworkingEvents.MUTED_STATE_CHANGE,
    NetworkingEvents.MEMBER_NAME_CHANGE,
    NetworkingEvents.KICK_EVENT,
    NetworkingEvents.RESIZE_EVENT
]