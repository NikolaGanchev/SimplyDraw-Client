export default class DrawPathPayload {
    lineWidth: number;
    lineCap: CanvasLineCap;
    color: { r: number, g: number, b: number, a: number };
    positions: Array<{ x: number, y: number }>;

    constructor(lineWidth: number, lineCap: CanvasLineCap, color: { r: number, g: number, b: number, a: number }) {
        this.lineWidth = lineWidth;
        this.lineCap = lineCap;
        this.color = color;
        this.positions = [];
    }
}