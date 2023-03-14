import { ImgVersion } from "./../constants/index";
/***
 @author kritsu
 @date 2019/12/7 22:26
 **/
import { Sprite } from "./sprite";

export interface ImgOptions {
  sprites: Sprite[]
  palettes: Buffer[]
  paletteIndex: number
}

export default class Img {
  sprites: Sprite[] = [];
  palettes: Buffer[] = [];
  paletteIndex = 0;
  count = 0;
  path = "";
  length = 0;
  indexLength = 0;
  dataLength = 0;
  version: ImgVersion = ImgVersion.VER_02;
  offset = 0;

  constructor(options: ImgOptions) {
    Object.assign(this, options);
    this.palettes = this.palettes || [];
    this.paletteIndex = 0;
    this.initSprites();
  }

  initSprites(this: Img) {
    this.sprites = (this.sprites || []).map(e => {
      if (e instanceof Sprite) {
        return e;
      }
      const sprite = new Sprite(e);
      const palettes = this.palettes;
      const self = this as Img;
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
      if (sprite.targetIndex !== undefined) {
        this.sprites[index] = this.sprites[sprite.targetIndex];
      }
    });
  }

  decode(index = 0) {
    return this.sprites[index].decode();
  }
}
