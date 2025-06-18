import type { MaybeRegex } from "maybe-types";
import { Buffer } from "node:buffer";
import { Writable } from "node:stream";
import { IMG_HEADER } from "../constants/define";
import { IMG_MAGIC, IMG_PATH_KEY, NPK_MAGIC } from "../constants/magic";
import { createDecoder } from "../handler/decoder";
import { Img } from "../model";
import { ByteArray } from "./byte-array";

function readPath(this: ByteArray) {
  const len = 256;
  let data = this.read(len);
  let i = 0;
  do {
    data[i] = data.readInt8(i) ^ IMG_PATH_KEY[i];
    if (data[i] === 0) {
      break;
    }
  } while (++i < len);
  data = data.slice(0, i);
  return data.toString("utf8");
}

function readImg(this: ByteArray) {
  const header = this.readObject(IMG_HEADER) as Img;

  const decode = createDecoder(header);

  let body = {};

  if (decode) {
    body = this.handle(decode) || [];
  }
  return Object.assign(header, body);
}

function validateMatch(match: MaybeRegex | ((item: Img) => boolean)) {
  if (match instanceof RegExp) {
    const regex = match;
    match = (item) => regex.test(item.path);
  } else if (typeof match !== "function") {
    const pattern = match.toString();
    match = (item) => new RegExp(pattern).test(item.path);
  }

  return match;
}

interface ExtractOptions {
  match?: MaybeRegex | ((item: Img) => boolean);
}

/***
 @author chizukicn
 @date 2019/12/6 16:56
 **/
export class Extract extends Writable {
  #match?: (item: Img) => boolean;

  data: Buffer;

  chunks: Buffer[];

  list: {
    offset: number;
    length: number;
    path: string;
  }[];

  constructor({ match }: ExtractOptions = {}) {
    super();
    this.#match = match ? validateMatch(match) : undefined;
    this.data = Buffer.alloc(0);
    this.chunks = [];
    this.list = [];
  }

  _write(chunk: Buffer, encoding: BufferEncoding, callback: () => void) {
    this.chunks.push(chunk);
    return callback();
  }

  extract() {
    const data = Buffer.concat(this.chunks);

    const ms = new ByteArray(data);

    const magic = ms.readString();

    let list: Img[] = [];

    if (magic === NPK_MAGIC) {
      const count = ms.readNumber();

      for (let i = 0; i < count; i++) {
        const offset = ms.readNumber();
        const length = ms.readNumber();
        const path = ms.handle(readPath);
        list.push({ offset, dataLength: length, path } as Img);
      }
    } else if (magic === IMG_MAGIC) {
      list.push({
        offset: 0,
        dataLength: data.length,
        path: ""
      } as Img
      );
    }

    list = list.filter((item) => this.match(item));

    for (let i = 0; i < list.length; i++) {
      ms.reset(list[i].offset);
      const body = ms.handle(readImg);
      list[i] = new Img(Object.assign(list[i], body));
    }

    return list;
  }

  match(item: Img) {
    return !this.#match || this.#match(item);
  }

  end(chunk: any, cb?: () => void): this;
  end(chunk: any, encoding: BufferEncoding, cb?: () => void): this;
  end(chunk: any, encoding?: BufferEncoding | (() => void), cb?: () => void): this {
    let callback: (() => void) | undefined;
    if (typeof encoding === "function") {
      callback = encoding;
      encoding = undefined;
    } else {
      callback = cb;
    }
    if (chunk) {
      if (typeof chunk === "string") {
        encoding = encoding ?? "utf8";
      } else {
        encoding = encoding ?? "binary";
      }
      this.write(chunk, encoding);
    }
    this.emit("finish", this.extract());
    callback && callback();
    return this;
  }
}
