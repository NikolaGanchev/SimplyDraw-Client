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
    FLOOD_FILL_DISABLE_REQUEST: "FLOOD_FILL_DISABLE_REQUEST"
};

class EventBus {

    private listeners: Map<string, Array<any>> = new Map()
    EVENTS = EVENTS;

    constructor() {
        this.listeners = new Map();
    }

    subscribe(eventName: string, callback: any) {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName)!.push(callback);
        }
        else {
            this.listeners.set(eventName, [callback]);
        }
    }

    dispatchEvent(eventName: string, ...callbackArgs: any[]) {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName)?.forEach(callback => {
                callback(...callbackArgs);
            })
        }
        else {
            return;
        }
    }
}

export default new EventBus();