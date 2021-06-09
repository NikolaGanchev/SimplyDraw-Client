import DrawEvent from './DrawEvent';

class EventCache {
    pastEvents: Array<DrawEvent> = [];
    futureEvents: Array<DrawEvent> = [];

    addEvent(drawEvent: DrawEvent | null) {
        if (drawEvent === null || drawEvent === undefined) return;

        this.pastEvents.push(drawEvent);

        this.futureEvents.length = 0;
    }

    rewindEvent() {
        if (this.pastEvents.length === 0) return;

        const event: DrawEvent | undefined = this.pastEvents.pop();

        if (event === undefined) throw (new Error("Undefined event"));

        if (event === null) this.rewindEvent();

        this.futureEvents.push(event);

        return event;
    }

    travelToEvent() {
        if (this.futureEvents.length === 0) return;

        const event: DrawEvent | undefined = this.futureEvents.pop();

        if (event === undefined) throw (new Error("Undefined event"));

        this.pastEvents.push(event);

        return event!!;
    }

    set(newCache: EventCache) {
        this.futureEvents = newCache.futureEvents;
        this.pastEvents = newCache.pastEvents;
    }
};

export default new EventCache();