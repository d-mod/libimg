import type { Buffer } from "node:buffer";

export interface DDS {
  version: number;
  type: number;
  index: number;
  length: number;
  uncompressedLength: number;
  width: number;
  height: number;
  data: Buffer;
}

export interface TextureInfo {
  unknown: number;
  index: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  rotate: number;
}
