import Color from "./Color";

export default class ColorRBGA {
    r: number;
    b: number;
    g: number;
    a: number;

    constructor(r: number, b: number, g: number, a: number = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    static fromRGBA(color: Color) {
        return new ColorRBGA(color.r, color.b, color.g);
    }

    rbgaToString() {
        return `rgba(${this.r}, ${this.b}, ${this.g}, ${this.a})`;
    }

    rbgaToDecimalNumber(): number {
        let r = this.r & 0xFF;
        let g = this.g & 0xFF;
        let b = this.b & 0xFF;
        let a = this.a & 0xFF;

        let rgba = (r << 24) + (b << 16) + (g << 8) + (a);

        return rgba;
    }
}