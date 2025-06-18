import type { Buffer } from "node:buffer";
import type { Img } from "../model";
import type { ByteArray } from "../stream";
import type { Sprite } from "./../model/sprite";
import type { DDS, TextureInfo } from "./types";

import { ColorBits, CompressMode, ImgVersion } from "../constants";
import { DDS_HEADER, SPRITE_BODY, TEXTURE_INFO } from "../constants/define";

function second(img: Img) {
  return function (this: ByteArray) {
    const sprites: Sprite[] = [];
    const count = img.count ?? 0;

    for (let i = 0; i < count; i++) {
      const sprite = {} as Sprite;
      sprite.index = i;
      sprite.colorBits = this.readNumber();
      sprites.push(sprite);
      if (sprite.colorBits === ColorBits.LINK) {
        sprite.targetIndex = this.readNumber();
        continue;
      }
      this.readObject(SPRITE_BODY, sprite);
    }
    for (const sprite of sprites) {
      if (sprite.colorBits === ColorBits.LINK) {
        continue;
      }
      if (sprite.compressMode === CompressMode.NONE) {
        sprite.dataLength = sprite.width * sprite.height * ((sprite.colorBits === ColorBits.ARGB_8888) ? 4 : 2);
      }
      sprite.data = this.read(sprite.dataLength);
    }
    return { sprites } as Img;
  };
}

function fourth(img: Img) {
  const base = second(img);
  return function (this: ByteArray) {
    const paletteSize = this.readNumber();
    const palette = this.read(paletteSize * 4);

    const palettes = [palette];

    const body = base.call(this);
    return { ...body, palettes } as Img;
  };
}

function sixth(img: Img) {
  const base = second(img);
  return function (this: ByteArray) {
    const paletteCount = this.readNumber();
    const palettes: Buffer[] = [];
    for (let i = 0; i < paletteCount; i++) {
      const paletteSize = this.readNumber();
      const palette = this.read(paletteSize * 4);
      palettes.push(palette);
    }
    const body = base.call(this);
    return { ...body, palettes } as Img;
  };
}

/**
 *
 * @param img
 */
export function fifth(img: Img) {
  return function (this: ByteArray) {
    const ddsCount = this.readNumber();
    img.dataLength = this.readNumber();
    const paletteSize = this.readNumber();
    const palette = this.read(paletteSize * 4);
    const palettes = [palette];
    const ddsList: DDS[] = this.readArray(DDS_HEADER, ddsCount);

    const normalSprites: Sprite[] = [];
    const sprites: Sprite[] = [];

    for (let i = 0; i < img.count; i++) {
      const sprite = {} as Sprite;
      sprite.index = i;
      sprite.colorBits = this.readNumber();
      sprites.push(sprite);
      if (sprite.colorBits === ColorBits.LINK) {
        sprite.targetIndex = this.readNumber();
        continue;
      }
      this.readObject(SPRITE_BODY, sprite);
      if (sprite.colorBits < ColorBits.LINK && sprite.dataLength !== 0) {
        normalSprites.push(sprite);
        continue;
      }
      const info = this.readObject(TEXTURE_INFO) as TextureInfo;
      sprite.textureInfo = info;
    }
    for (const dds of ddsList) {
      dds.data = this.read(dds.length);
    }
    for (const sprite of normalSprites) {
      sprite.data = this.read(sprite.dataLength);
    }

    img.palettes = palettes;
    img.textures = ddsList;

    return img;
  };
}

export const Handlers = {
  [ImgVersion.VER_02]: second,
  [ImgVersion.VER_04]: fourth,
  [ImgVersion.VER_05]: fifth,
  [ImgVersion.VER_06]: sixth
} as { [key: number]: (img: Img) => (this: ByteArray) => Img };

export function createDecoder(header: Img) {
  const { version = 0 as ImgVersion } = header;
  const handle = Handlers[version];
  if (handle) {
    return handle(header);
  }
  throw new Error(`Not Found Handler By VER:${version}`);
}
