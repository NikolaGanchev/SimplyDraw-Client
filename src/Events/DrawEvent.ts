import Color from "../Color";
import { DrawEventType } from "./DrawEventType";
import Path from "./Path";

export default class DrawEvent {
    type: DrawEventType;
    payload: any = new Path(10, "round", new Color(0, 0, 0, 1));

    constructor(type: DrawEventType) {
        this.type = type;
    }
}