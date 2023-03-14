/***
 @author kritsu
 @date 2019/12/6 12:29
 **/
import { ColorBits, CompressMode, ImgVersion } from "../constants";
import { SPRITE_BODY } from "../constants/define";
import type { ByteArray } from "../stream";
import type Img from "../model/img";
import type { Sprite } from "./../model/sprite";

function second({ count }: Img) {
  return function (this: ByteArray) {
    const sprites: Sprite[] = [];

    for (let i = 0; i < count || 0; i++) {
      const sprite = {} as Sprite;
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
        sprite.length = sprite.width * sprite.height * (sprite.colorBits === ColorBits.ARGB_8888 ? 4 : 2);
      }
      sprite.data = this.read(sprite.length);
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
    Object.assign(body, { palettes });
    return body as Img;
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
    Object.assign(body, { palettes });
    return body as Img;
  };
}

export const Handlers = {
  [ImgVersion.VER_02]: second,
  [ImgVersion.VER_04]: fourth,
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
