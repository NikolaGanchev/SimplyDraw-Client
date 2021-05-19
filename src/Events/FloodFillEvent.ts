import Color from "../utils/Color";
import Position from "./Position";

export default class FloodFillEvent {
    startingPixel: Position;
    fillColor: Color;

    constructor(startingPixel: Position, fillColor: Color) {
        this.startingPixel = startingPixel;
        this.fillColor = fillColor;
    }
}