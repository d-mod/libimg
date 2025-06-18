import type { Img } from "../src/model/img";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Extract } from "../src";

function getNumber(s: string) {
  return Number.parseInt(s.replace(/[^\d+]/g, ""));
}
(async () => {
  const createMatch = (code1: number) => {
    return (item: Img) => {
      const code0 = getNumber(item.path);
      if (code0 === code1) {
        return true;
      }
      return code0 % 100 === 0 && Math.floor(code0 / 100) === Math.floor(code1 / 100);
    };
  };
  fs.createReadStream(path.resolve(process.cwd(), "sprite_character_swordman_equipment_avatar_pants.NPK"))
    .pipe(new Extract({
      match: createMatch(5603)
    }))
    .on("finish", (list: Img[]) => {
      const sprite = list[0].sprites[0];
      sprite.toPng(path.resolve(process.cwd(), "test-data/test.png"));
    });
})();
