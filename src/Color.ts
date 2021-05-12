export default class Color {
    r: number;
    g: number;
    b: number;
    a: number;

    constructor(r: number, g: number, b: number, a: number = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    rgbaToString() {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }

    rgbaToDecimalNumber(): number {
        let r = this.r & 0xFF;
        let g = this.g & 0xFF;
        let b = this.b & 0xFF;
        let a = this.a & 0xFF;

        let rgba = (r << 24) + (g << 16) + (b << 8) + (a);

        return rgba;
    }
}