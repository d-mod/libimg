import type { Img } from "../model/img";
import { Buffer } from "node:buffer";
import { ColorBits, CompressMode, ImgVersion } from "../constants";
import { Sprite } from "../model";
import queues from "./queues";

interface MergeItem {
  data: Buffer;
  width: number;
  height: number;
  x: number;
  y: number;
}

/***
 @author chizukicn
 @date 2020/2/8 18:23
 **/
export class Merge {
  private list: Img[] = [];

  constructor(items: Img[] = []) {
    this.list = [];
    this.add(...items);
  }

  add(...items: Img[]) {
    this.list.push(...items);
    this.list.sort(compare);
  }

  finalize() {
    const list = this.list;
    let count = 0;
    const version = ImgVersion.VER_02;

    for (const item of list) {
      if (item.count > count) {
        count = item.count;
      }
    }

    const sprites = Array.from({ length: count });

    for (let i = 0; i < count; i++) {
      let width = 1;
      let height = 1;
      let frameWidth = 0;
      let frameHeight = 0;
      let x = 800;
      let y = 600;
      let colorBits = ColorBits.ARGB_8888;
      let compressMode = CompressMode.NONE;

      for (const item of list) {
        if (i >= item.count) {
          continue;
        }
        const source = item.sprites[i];
        if (source.frameWidth > frameWidth) {
          frameWidth = source.frameWidth;
        }
        if (source.frameHeight > frameHeight) {
          frameHeight = source.frameHeight;
        }
        if (source.width * source.height === 1 && source.compressMode === CompressMode.NONE) {
          continue;
        }
        if (source.width + source.x > width) {
          width = source.width + source.x;
        }
        if (source.height + source.y > height) {
          height = source.height + source.y;
        }
        if (source.x < x) {
          x = source.x;
        }
        if (source.y < y) {
          y = source.y;
        }
        if (source.colorBits > colorBits && source.colorBits < ColorBits.LINK) {
          colorBits = source.colorBits;
        }
      }
      width -= x;
      height -= y;
      width = Math.max(width, 1);
      height = Math.max(height, 1);
      if (width * height > 1) {
        compressMode = CompressMode.ZLIB;
      }

      const images: MergeItem[] = [];

      for (const item of list) {
        if (i >= item.count) {
          continue;
        }
        const sprite = item.sprites[i];
        const data = sprite.decode();
        const { width, height } = sprite;
        images.push({
          data,
          x: sprite.x - x,
          y: sprite.y - y,
          width,
          height
        }); // 绘制贴图
      }
      const data = draw(width, height, images);
      sprites[i] = Sprite.encode({
        data,
        width,
        height,
        x,
        y,
        frameWidth,
        frameHeight,
        colorBits,
        compressMode
      });
    }

    return {
      count,
      version,
      sprites
    };
  }
}

function draw(width: number, height: number, list: MergeItem[] = []) {
  const data = Buffer.alloc(width * height * 4);

  for (const image of list) {
    const pixels = image.data;

    // 将多个rgba数组和x,y坐标转换为像素点,如果该像素点为0即透明则不绘制
    for (let i = 0; i < pixels.length; i += 4) {
      const x = i / 4 % image.width + image.x;
      const y = Math.floor(i / 4 / image.width) + image.y;
      if (x < 0 || x >= width || y < 0 || y >= height) {
        continue;
      }
      const index = (y * width + x) * 4;
      if (pixels[i + 3] === 0) {
        continue;
      }
      data[index] = pixels[i];
      data[index + 1] = pixels[i + 1];
      data[index + 2] = pixels[i + 2];
      data[index + 3] = pixels[i + 3];
    }
  }
  return data;
}

function compare(a: Img, b: Img) {
  const index1 = indexOf(a.path);
  const index2 = indexOf(b.path);
  return index1 - index2;
}

export function indexOf(key: string) {
  key = key.substring(key.indexOf("_") + 1);
  key = key.replace(".img", ""); // 去除.img后缀
  const regex = /\d+/g;
  const matches = key.match(regex);
  let suf = 0;
  if (matches) {
    for (let i = 0; i < matches.length; i++) {
      // 移除数字序号
      key = key.replace(matches[i], "");
      if (i > 0) {
        // 获取数字序号
        suf = Number.parseInt(matches[i]);
      }
    }
  }
  if (queues[key] !== undefined) {
    return queues[key] + suf;
  }
  return -1;
}
