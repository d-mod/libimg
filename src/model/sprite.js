import {ByteArray} from "../stream"
import {ColorBits, CompressMode} from "../constants"
import zlib from "zlib"

function read16BitColor(bits) {
    let a, r, g, b = 0;
    let [left, right] = this.read(2);
    switch (bits) {
        case ColorBits.ARGB_1555:
            a = (right >> 7);
            r = (right >> 2) & 0x1f;
            g = ((left >> 5) | (right & 3) << 3);
            b = (left & 0x1f);
            a = (a * 0xff);
            r = (r << 3 | r >> 2);
            g = (g << 3 | g >> 2);
            b = (b << 3 | b >> 2);
            break;
        case ColorBits.ARGB_4444:
            a = (right & 0xf0);
            r = ((right & 0xf) << 4);
            g = (left & 0xf0);
            b = ((left & 0xf) << 4);
            break;
        default:
            break;
    }

    return Buffer.from([r, g, b, a])

}

function read32BitColor(bits) {
    let [b, g, r, a] = this.read(4)
    let left = 0, right = 0
    switch (bits) {
        case ColorBits.ARGB_1555:
            a = (a >> 7) & 0xff
            r = (r >> 3) & 0xff
            g = (g >> 3) & 0xff
            b = (b >> 3) & 0xff
            left = (((g & 7) << 5) | b) & 0xff
            right = ((a << 7) | (r << 2) | (g >> 3)) & 0xff
            break;
        case ColorBits.ARGB_4444:
            left = (g | (b >> 4)) & 0xff
            right = (a | (r >> 4)) & 0xff
            break;
    }
    return Buffer.from([left, right])
}


export function convertTo32Bits(data, bits) {


    let ms = new ByteArray(data)


    let len = data.length * 2


    let buf = []

    for (let i = 0; i < len; i += 4) {
        let color = ms.handle(read16BitColor, bits)
        buf.push(color)
    }

    return Buffer.concat(buf)
}

export function convertTo16Bits(data, bits) {


    let ms = new ByteArray(data)


    let len = data.length / 2


    let buf = []

    for (let i = 0; i < len; i += 2) {
        let color = ms.handle(read32BitColor, bits)
        buf.push(color)
    }

    return Buffer.concat(buf)
}


function convertFromPalette(data, palette) {
    let buf = []

    let len = data.length;
    let count = palette.length

    for (let i = 0; i < len; i++) {
        let index = data[i] % count
        let color = palette.slice(index * 4, (index + 1) * 4)
        let [b, g, r, a] = color
        color = Buffer.from([r, g, b, a])
        buf.push(color)
    }
    return Buffer.concat(buf)
}


function convertToPalette(data, palette) {

    let buf = Buffer.alloc(Math.floor(data.length / 4))

    for (let i = 0; i < buf.length; i++) {
        let rgba = data.readInt32LE(i * 4)
        let index = palette.indexOf(rgba)
        if (index < 0) {
            index = palette.length
            palette.push(rgba)
        }
        buf[i] = index
    }
    return buf
}

export class Sprite {
    constructor(options) {
        Object.assign(this, options)
    }

    decode() {
        let {data, colorBits, compressMode, palette} = this
        if (compressMode === CompressMode.ZLIB) {
            data = zlib.inflateSync(data)
        }
        if (palette) {
            data = convertFromPalette(data, palette)
        } else if (colorBits < ColorBits.ARGB_8888) {
            data = convertTo32Bits(data, colorBits)
        }
        return data
    }


    static encode(options) {
        let {compressMode, colorBits, data, palettes} = options
        if (compressMode === CompressMode.ZLIB) {
            data = zlib.deflateSync(data)
        }
        if (palettes) {
            data = convertToPalette(data, palettes)
            options.colorBits = ColorBits.ARGB_1555
        } else if (colorBits < ColorBits.ARGB_8888) {
            data = convertTo16Bits(data, colorBits)
        }
        options.data = data
        options.length = data.length
        return new Sprite(options)
    }

}
