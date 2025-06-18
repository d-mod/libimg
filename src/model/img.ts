import type { Buffer } from "node:buffer";
import type { DDS } from "../handler/types";
import { ImgVersion } from "./../constants/index";

/***
 @author chizukicn
 @date 2019/12/7 22:26
 **/
import { Sprite } from "./sprite";

export interface ImgOptions {
  path: string;
  sprites: Sprite[];
  palettes: Buffer[];
  paletteIndex: number;
}

export class Img {
  sprites: Sprite[] = [];
  palettes: Buffer[] = [];
  textures: DDS[] = [];
  paletteIndex = 0;
  count = 0;
  path = "";
  indexLength = 0;
  dataLength = 0;
  version: ImgVersion = ImgVersion.VER_02;
  offset = 0;

  constructor(options: ImgOptions) {
    Object.assign(this, options);
    this.path ||= options.path;
    this.sprites ??= options.sprites;
    this.palettes ??= options.palettes;
    this.paletteIndex ??= options.paletteIndex;
    this.initSprites();
  }

  initSprites(this: Img) {
    const self = this as Img;

    this.sprites = (this.sprites || []).map((e, index) => {
      if (e instanceof Sprite) {
        return e;
      }
      const sprite = new Sprite(e);
      sprite.parent = self;
      sprite.index = index;
      const palettes = this.palettes;
      Object.defineProperty(sprite, "palette", {
        get() {
          if (self.paletteIndex < palettes.length) {
            return palettes[self.paletteIndex];
          }
          return null;
        }
      });
      return sprite;
    });

    // 将有链接的贴图置换为链接对应的
    this.sprites.forEach((sprite, index) => {
      if (sprite.targetIndex !== -1) {
        this.sprites[index] = this.sprites[sprite.targetIndex];
      }
    });
  }

  decode(index = 0) {
    return this.sprites[index].decode();
  }
}
