/***
 @author kritsu
 @date 2019/12/6 16:27
 **/

export const NUMBER = "Number" as const;

export const STRING = "String" as const;

export type DefineType = typeof NUMBER | typeof STRING;

export const SPRITE_BODY = {
  compressMode: NUMBER,
  width: NUMBER,
  height: NUMBER,
  dataLength: NUMBER,
  x: NUMBER,
  y: NUMBER,
  frameWidth: NUMBER,
  frameHeight: NUMBER
};

export const IMG_HEADER = {
  magic: STRING,
  indexLength: NUMBER,
  placeholder: NUMBER,
  version: NUMBER,
  count: NUMBER
};

export const DDS_HEADER = {
  version: NUMBER,
  type: NUMBER,
  index: NUMBER,
  dataLength: NUMBER,
  uncompressedLength: NUMBER,
  width: NUMBER,
  height: NUMBER
};

export const TEXTURE_INFO = {
  unknown: NUMBER,
  index: NUMBER,
  left: NUMBER,
  top: NUMBER,
  right: NUMBER,
  bottom: NUMBER,
  rotate: NUMBER
};
