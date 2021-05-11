import Line from './Line';
import Path from './Path';
import DrawEvent from './DrawEvent';
import { DrawEventType } from './DrawEventType';

class EventCache {
    pastEvents: Array<DrawEvent> = [];
    futureEvents: Array<DrawEvent> = [];
    readonly LIMIT = 10;

    constructor() { };

    addEvent(drawEvent: DrawEvent | null) {
        if (this.pastEvents.length > 10) {
            this.pastEvents.shift();
        }

        if (drawEvent === null || drawEvent === undefined) return;


        this.pastEvents.push(drawEvent);

        this.futureEvents.length = 0;

        console.log("EVENT ADDED" + JSON.stringify(drawEvent));
    }

    rewindEvent() {
        if (this.pastEvents.length === 0) return;

        const event: DrawEvent | undefined = this.pastEvents.pop();

        if (event === undefined) throw ("Undefined event");

        if (event === null) this.rewindEvent();

        this.futureEvents.push(event);

        return event;
    }

    travelToEvent() {
        if (this.futureEvents.length === 0) return;

        const event: DrawEvent | undefined = this.futureEvents.pop();

        if (event === undefined) throw ("Undefined event");

        this.pastEvents.push(event);

        return event!!;
    }
};

export default new EventCache();