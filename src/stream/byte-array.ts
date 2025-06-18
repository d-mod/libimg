import type { Fn } from "maybe-types";
import type { DefineType } from "./../constants/define";
import { Buffer } from "node:buffer";

export class ByteArray {
  #offset = 0;

  data: Buffer;

  get offset() {
    return this.#offset || -1;
  }

  set offset(val) {
    val = Math.min(val, this.length - 1);
    val = Math.max(0, val);
    this.#offset = val;
  }

  get length() {
    return this.data.length;
  }

  constructor(data: Buffer) {
    this.data = Buffer.isBuffer(data) ? data : Buffer.from(data);
    this.#offset = 0;
  }

  handle<R, T extends any[]>(callback: Fn<R, T>, ...args: T): R {
    return callback.apply(this, args);
  }

  readArray(define: Record<string, DefineType>, len: number) {
    const array = [];
    for (let i = 0; i < len; i++) {
      array.push(this.readObject(define));
    }
    return array;
  }

  readObject<T extends Record<string, any> = object>(define: Record<string, DefineType>, obj: T = {} as T) {
    Object.entries(define).forEach(([key, value]) => obj[key as keyof T] = this[`read${value}`]() as any);
    return obj;
  }

  readNumber(size = 4) {
    const buf = this.read(size);
    let rs = 0;
    for (let i = 0; i < buf.length; i++) {
      rs |= (buf[i] & 0xFF) << (i * 8);
    }
    return rs;
  }

  read(size: number) {
    const start = this.offset;
    const end = this.skip(size);
    return this.data.slice(start, end);
  }

  readString() {
    let i = -1;
    const start = this.offset;
    let offset = this.offset;
    do {
      i = this.data[offset++];
    } while (i !== 0 && offset < this.length);
    this.offset = offset;
    return this.data.toString("utf8", start, offset - 1);
  }

  reset(offset = 0) {
    this.offset = offset;
  }

  skip(len: number) {
    return this.offset += len;
  }
}
