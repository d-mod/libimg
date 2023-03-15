import { Transform } from "stream";
import crypto from "crypto";
import { IMG_MAGIC, IMG_PATH_KEY, NPK_MAGIC } from "../constants/magic";
import { IMG_HEADER } from "../constants/define";
import { createEncoder } from "../handler/encoder";
import { ColorBits, ImgVersion } from "../constants";
import type { Img } from "../model";
import type { DefineType } from "./../constants/define";

function writePath(path: string) {
  const data = Buffer.alloc(256);
  data.write(path, 0, "utf8");
  for (let i = 0; i < 256; i++) {
    data[i] = (data[i] ^ IMG_PATH_KEY[i]) & 0xFF;
  }
  return data;
}

function crc32(data: Buffer) {
  const hash = crypto.createHash("sha256");
  hash.update(data.subarray(0, data.length - data.length % 17));
  return hash.digest();
}

/***
 @author kritsu
 @date 2019/12/6 16:56
 **/
export class Pack extends Transform {
  list: Img[];

  constructor(list: Img[] = []) {
    super();
    this.list = list;
  }

  add(...item: Img[]) {
    this.list.push(...item);
  }

  writeObject(define: Record<string, DefineType>, obj = {}) {
    Object.entries(define).forEach(([key, value]) => {
      this[`write${value}`](obj[key as keyof typeof obj]);
    });
    return this;
  }

  writeString(str: string, encoding: BufferEncoding = "utf8", split = true) {
    this.write(str, encoding);
    if (split) {
      this.write("\0");
    }
    return this;
  }

  writeNumber(num: number, size = 4) {
    const buf = Buffer.alloc(size);
    for (let i = 0; i < buf.length; i++) {
      buf[i] = (num >> (i * 8));
    }
    return this.write(buf);
  }

  finalize() {
    for (const img of this.list) {
      let indexLength = 0;
      let dataLength = 0;
      for (const sprite of img.sprites) {
        indexLength += 8;
        if (sprite.colorBits !== ColorBits.LINK) {
          indexLength += 28;
          dataLength += sprite.data.length;
        }
      }
      if (img.version === ImgVersion.VER_06) {
        dataLength += 4;
      }
      if (img.palettes) {
        for (const palette of img.palettes) {
          dataLength += palette.length + 4;
        }
      }
      img.indexLength = indexLength;
      img.dataLength = dataLength + indexLength + 32;
    }

    const count = this.list.length;
    let lastLength = 0;
    let position = 52 + count * 264;
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        position += lastLength;
      }
      this.list[i].offset = position;
      lastLength = this.list[i].dataLength;
    }

    this.pause();
    this.writeString(NPK_MAGIC);

    this.writeNumber(count);

    for (const item of this.list) {
      this.writeNumber(item.offset);
      this.writeNumber(item.dataLength);
      this.write(writePath(item.path));
    }

    const header = this.read();

    this.resume();

    this.write(crc32(header));

    for (const item of this.list) {
      const obj = Object.assign({}, item, { magic: IMG_MAGIC, placeholder: 0 });
      this.writeObject(IMG_HEADER, obj);
      createEncoder(item).apply(this);
    }
    this.end();
  }

  _transform(chunk: Buffer | string, encoding: BufferEncoding, callback: () => void) {
    this.push(chunk);
    callback();
  }
}
