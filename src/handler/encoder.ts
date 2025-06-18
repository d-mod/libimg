import type { Img } from "../model";
import type { Pack } from "../stream";
/***
 @author chizukicn
 @date 2019/12/8 11:48
 **/
import { ColorBits, ImgVersion } from "../constants";
import { SPRITE_BODY } from "../constants/define";

function second(item: Img) {
  return function (this: Pack) {
    for (const sprite of item.sprites) {
      this.writeNumber(sprite.colorBits);
      if (sprite.colorBits === ColorBits.LINK) {
        this.writeNumber(sprite.targetIndex);
        continue;
      }
      this.writeObject(SPRITE_BODY, sprite);
    }

    for (const sprite of item.sprites) {
      if (sprite.colorBits === ColorBits.LINK) {
        continue;
      }
      this.write(sprite.data);
    }
  };
}

function fourth(item: Img) {
  const { palettes } = item;
  const base = second(item);
  return function (this: Pack) {
    if (palettes.length > 0) {
      this.writeNumber(palettes[0].length);
      this.write(palettes[0]);
    }
    base.call(this);
  };
}

function sixth(item: Img) {
  const { palettes } = item;
  const base = second(item);
  return function (this: Pack) {
    const paletteCount = palettes.length;
    this.writeNumber(paletteCount);
    for (let i = 0; i < paletteCount; i++) {
      this.writeNumber(palettes[i].length / 4);
      this.write(palettes[i]);
    }
    base.call(this);
  };
}

export const Handlers = {
  [ImgVersion.VER_02]: second,
  [ImgVersion.VER_04]: fourth,
  [ImgVersion.VER_06]: sixth
} as Record<ImgVersion, (item: Img) => (this: Pack) => void>;

export function createEncoder(header: Img) {
  const { version = 0 as ImgVersion } = header;
  const handle = Handlers[version];
  if (handle) {
    return handle(header);
  }
  throw new Error(`Not Found Handler By VER:${version}`);
}
