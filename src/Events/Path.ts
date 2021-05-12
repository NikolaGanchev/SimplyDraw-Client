import Color from "../Color";
import Position from "./Position";

export default class Path {
    lineWidth: number;
    lineCap: CanvasLineCap;
    color: Color;
    positions: Array<Position>;

    constructor(lineWidth: number, lineCap: CanvasLineCap, color: Color) {
        this.lineWidth = lineWidth;
        this.lineCap = lineCap;
        this.color = color;
        this.positions = [];
    }
}