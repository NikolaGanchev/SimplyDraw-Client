import Color from "../Color";

export default class Path {
    lineWidth: number;
    lineCap: CanvasLineCap;
    color: Color;
    positions: Array<{ x: number, y: number }>;

    constructor(lineWidth: number, lineCap: CanvasLineCap, color: Color) {
        this.lineWidth = lineWidth;
        this.lineCap = lineCap;
        this.color = color;
        this.positions = [];
    }
}