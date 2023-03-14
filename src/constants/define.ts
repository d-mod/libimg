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
  length: NUMBER,
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

