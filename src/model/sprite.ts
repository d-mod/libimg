import zlib from "zlib";
import type { ReadStream } from "fs";
import { createWriteStream } from "fs";
import type { Writable } from "stream";
import { PNG } from "pngjs";
import { ColorBits, CompressMode } from "../constants";
import { ByteArray } from "../stream";
import type { DDS, TextureInfo } from "../handler/types";
import type { Img } from "./img";

function read16BitColor(this: ReadStream, bits: ColorBits) {
  if (bits === ColorBits.ARGB_8888) {
    return this.read(4);
  }
  let a = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  const [right, left] = this.read(2);
  switch (bits) {
    case ColorBits.ARGB_1555:
      a = (right >> 7);
      r = (right >> 2) & 0x1F;
      g = ((left >> 5) | (right & 3) << 3);
      b = (left & 0x1F);
      a = (a * 0xFF);
      r = (r << 3 | r >> 2);
      g = (g << 3 | g >> 2);
      b = (b << 3 | b >> 2);
      break;
    case ColorBits.ARGB_4444:
      a = (right & 0xF0);
      r = ((right & 0xF) << 4);
      g = (left & 0xF0);
      b = ((left & 0xF) << 4);
      break;
    default:
      break;
  }

  return Buffer.from([r, g, b, a]);
}

function read32BitColor(this: ReadStream, bits: ColorBits) {
  let [b, g, r, a] = this.read(4);
  let left = 0;
  let right = 0;
  switch (bits) {
    case ColorBits.ARGB_1555:
      a = (a >> 7) & 0xFF;
      r = (r >> 3) & 0xFF;
      g = (g >> 3) & 0xFF;
      b = (b >> 3) & 0xFF;
      left = (((g & 7) << 5) | b) & 0xFF;
      right = ((a << 7) | (r << 2) | (g >> 3)) & 0xFF;
      break;
    case ColorBits.ARGB_4444:
      left = (g | (b >> 4)) & 0xFF;
      right = (a | (r >> 4)) & 0xFF;
      break;
  }
  return Buffer.from([left, right]);
}

export function toHex(color: Buffer) {
  return color.toString("hex");
}

export function convertTo32Bits(data: Buffer, bits: ColorBits) {
  const ms = new ByteArray(data);

  const len = data.length * 2;

  const buf: Buffer[] = [];

  for (let i = 0; i < len; i += 4) {
    const color = ms.handle(read16BitColor, bits) as Buffer;
    buf.push(color);
  }

  return Buffer.concat(buf);
}

export function convertTo16Bits(data: Buffer, bits: ColorBits) {
  const ms = new ByteArray(data);

  const len = data.length / 2;

  const buf: Buffer[] = [];

  for (let i = 0; i < len; i += 2) {
    const color = ms.handle(read32BitColor, bits);
    buf.push(color);
  }

  return Buffer.concat(buf);
}

function convertFromPalette(data: Buffer, palette: Buffer) {
  const buf: Buffer[] = [];

  const len = data.length;
  const count = palette.length;

  for (let i = 0; i < len; i++) {
    const index = data[i] % count;
    let color = palette.slice(index * 4, (index + 1) * 4);
    const [b, g, r, a] = color;
    color = Buffer.from([r, g, b, a]);
    buf.push(color);
  }
  return Buffer.concat(buf);
}

function convertArbgToRgba(data: Buffer) {
  const buf = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = data.slice(i, i + 4);
    buf.writeInt32LE((a << 24) | (r << 16) | (g << 8) | b, i);
  }
  return buf;
}

interface SpriteOptions extends Partial<Sprite> {
  palettes?: Buffer[]
}

export class Sprite {
  index = 0;
  data: Buffer;
  dataLength: number;
  width: number;
  height: number;
  colorBits: ColorBits;
  compressMode: CompressMode;
  count: number;
  targetIndex = -1;
  frameWidth: number;
  frameHeight: number;
  x: number;
  y: number;

  textureInfo?: TextureInfo;

  parent?: Img;

  readonly palette?: Buffer;

  get texture(): DDS | null {
    const parent = this.parent;
    if (parent) {
      const textures = parent.textures;
      if (textures) {
        return textures[this.textureInfo?.index ?? 0];
      }
    }
    return null;
  }

  constructor(options: SpriteOptions) {
    this.width = options.width ?? 1;
    this.height = options.height ?? 1;
    this.colorBits = options.colorBits ?? ColorBits.ARGB_1555;
    this.compressMode = options.compressMode ?? CompressMode.NONE;
    this.dataLength = options.dataLength ?? 0;
    this.count = options.count ?? 1;
    this.targetIndex = options.targetIndex ?? -1;
    this.frameWidth = options.frameWidth ?? 1;
    this.frameHeight = options.frameHeight ?? 1;
    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.data = options.data ?? Buffer.alloc(this.width * this.height * 4);
  }

  decode() {
    const { colorBits, compressMode, palette } = this;
    let data = this.data;
    if (compressMode === CompressMode.ZLIB) {
      data = zlib.inflateSync(data);
    }
    if (palette?.length) {
      data = convertFromPalette(data, palette);
    } else if (colorBits < ColorBits.ARGB_8888) {
      data = convertTo32Bits(data, colorBits);
    } else {
      data = convertArbgToRgba(data);
    }

    return data;
  }

  static encode(options: SpriteOptions) {
    const { compressMode = CompressMode.NONE, colorBits = ColorBits.ARGB_1555 } = options;
    let data = options.data ?? Buffer.alloc(0);
    if (compressMode === CompressMode.ZLIB) {
      data = zlib.deflateSync(data);
    }
    if (colorBits < ColorBits.ARGB_8888) {
      data = convertTo16Bits(data, colorBits);
    }
    options.data = data;
    options.dataLength = data.length;
    return new Sprite(options);
  }

  toPng(target: string | Writable): Promise < void > {
    return new Promise((resolve, reject) => {
      const data = this.decode();
      const width = this.width;
      const height = this.height;
      target = typeof target === "string" ? createWriteStream(target) : target;

      const png = new PNG({
        width,
        height
      });
      png.data = data;
      png.pack().pipe(target).on("finish", resolve).on("error", reject);
    });
  }
}
