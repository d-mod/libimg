/***
 @author kritsu
 @date 2019/12/6 12:27
 **/

import fs from "fs";

import qs from "querystring";

import path from "path";
import { Extract } from "../src";

import type Img from "../src/model/img";

export function find(outputPath: string, profession: string, code: string, excludes: string[] = []) {
  const parts = qs.parse(code) as Record<string, string>;

  excludes.forEach(e => delete parts[e]);

  const entries = Object.entries(parts);

  const array: Img[][] = [];

  return new Promise<Img[]>((resolve, reject) => {
    entries.forEach(([key, value]) => {
      const f = getDressFileName(profession, key);
      const code1 = getNumber(value);

      const match = (item: Img) => {
        const code0 = getNumber(item.path);
        if (code0 === code1) {
          return true;
        }
        return code0 % 100 === 0 && Math.floor(code0 / 100) === Math.floor(code1 / 100);
      };

      fs.createReadStream(path.resolve(outputPath, f))
        .pipe(new Extract({ match }))
        .on("finish", (list: Img[]) => {
          list = list.map(e => {
            const index = code1 % 100;
            e.path = replacePath(e.path, code1);
            e.paletteIndex = index;
            return e;
          });
          array.push(list);
          if (array.length === entries.length) {
            resolve(Array.from(array.flat()));
          }
        }).on("error", e => {
          reject(e);
        });
    });
  });
}

function replacePath(path: string, code: string | number) {
  const regex = /\d+/;
  code = code.toString();
  for (let i = code.length; i < 4; i++) {
    code = "0".concat(code);
  }
  return path.replace(regex, code);
}

function getDressFileName(profession: string, part: string, type = "avatar") {
  if (!profession.endsWith("_at")) {
    profession = profession.concat("_");
  }
  return `sprite_character_${profession}equipment_${type}_${part}.NPK`;
}

function getNumber(s) {
  return parseInt(s.replace(/[^\d+]/ig, ""));
}

