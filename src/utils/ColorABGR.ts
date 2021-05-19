import Color from "./Color";

export default class ColorARBG {
    r: number;
    b: number;
    g: number;
    a: number;

    constructor(a: number = 255, b: number, g: number, r: number,) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    static fromRGBA(color: Color): ColorARBG {
        return new ColorARBG(color.a, color.b, color.g, color.r);
    }

    abgrToString() {
        return `rgba(${this.r}, ${this.b}, ${this.g}, ${this.a})`;
    }

    abgrToDecimalNumber(): number {
        let r = this.r & 0xFF;
        let g = this.g & 0xFF;
        let b = this.b & 0xFF;
        let a = this.a & 0xFF;

        let rgba = (a << 24) + (b << 16) + (g << 8) + (r);

        return rgba;
    }
}