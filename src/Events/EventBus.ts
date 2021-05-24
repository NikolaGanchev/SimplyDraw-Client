export const EVENTS = {
    CANVAS_DOWNLOAD_REQUEST: "CANVAS_DOWNLOAD_REQUEST",
    DRAWING_COLOR_CHANGE_REQUEST: "DRAWING_COLOR_CHANGE_REQUEST",
    LINE_WIDTH_CHANGE_REQUEST: "LINE_WIDTH_CHANGE_REQUEST",
    LINE_CAP_CHANGE_REQUEST: "LINE_CAP_CHANGE_REQUEST",
    ACTIVATE_ERASER_REQUEST: "ACTIVATE_ERASER_REQUEST",
    DISABLE_ERASER_REQUEST: "DISABLE_ERASER_REQUEST",
    FULL_ERASE_REQUEST: "FULL_ERASE_REQUEST",
    UNDO_LAST_ACTION_REQUEST: "UNDO_LAST_ACTION_REQUEST",
    REDO_FUTURE_ACTION_REQUEST: "REDO_FUTURE_ACTION_REQUEST",
    FLOOD_FILL_ACTIVATE_REQUEST: "FLOOD_FILL_ACTIVATE_REQUEST",
    FLOOD_FILL_DISABLE_REQUEST: "FLOOD_FILL_DISABLE_REQUEST",
    START_SERVER_CONNECTION_REQUEST: "START_SERVER_CONNECTION_REQUEST",
    SUCCESSFUL_SERVER_CONNECTION: "SUCCESSFUL_SERVER_CONNECTION",
    CREATE_ROOM_REQUEST: "CREATE_ROOM_REQUEST",
    JOIN_ROOM_REQUEST: "JOIN_ROOM_REQUEST",
    ROOM_CREATED: "ROOM_CREATED",
    JOINED_ROOM: "JOINED_ROOM",
    NEW_USER_JOINED: "NEW_USER_JOINED",
    EVENT_CACHE_SYNC: "EVENT_CACHE_SYNC",
    DRAW_EVENT: "DRAW_EVENT",
    SEND_DRAW_EVENT_REQUEST: "SEND_DRAW_EVENT_REQUEST",
    REMOTE_UNDO_REQUEST: "REMOTE_UNDO_REQUEST",
    REMOTE_REDO_REQUEST: "REMOTE_REDO_REQUEST",
    RESET_STATE_EVENT: "RESET_STATE_EVENT",
    BECAME_HOST_EVENT: "BECAME_HOST_EVENT"
};

class EventBus {

    private listeners: Map<string, Array<Event>> = new Map()
    EVENTS = EVENTS;

    constructor() {
        this.listeners = new Map();
    }

    subscribe(eventName: string, callback: any, key = "") {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName)!.push(new Event(callback, key));
        }
        else {
            this.listeners.set(eventName, [new Event(callback, key)]);
        }
    }

    unsubscribe(eventName: string, key: string) {
        console.log(this.listeners);
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName)?.forEach((e: Event) => {
                if (e.key === key) {
                    this.listeners.get(eventName)!.splice(this.listeners.get(eventName)!.indexOf(e), 1);
                }
            })
        }

        console.log(this.listeners);
    }

    unsubscribeAll(keyToCheck: string) {
        for (let [key, value] of this.listeners) {
            for (let e of value) {
                if (e.key === keyToCheck) {
                    value.splice(value.indexOf(e), 1);
                }
            }
            this.listeners.set(key, value);
        }
    }

    dispatchEvent(eventName: string, ...callbackArgs: any[]) {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName)?.forEach(event => {
                event.callback(...callbackArgs);
            });
        }
        else {
            return;
        }
    }
}

class Event {
    key: string;
    callback: Function;

    constructor(callback: any, key: string = "") {
        this.key = key;
        this.callback = callback;
    }
}

export default new EventBus();