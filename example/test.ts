import fs from "fs";
import path from "path";
import type { Img } from "../src";
import { Extract } from "../src";
const GAME_DIR = "E:\\WeGameApps\\地下城与勇士\\ImagePacks2";

fs.createReadStream(path.resolve(GAME_DIR, "sprite_character_gunblader_equipment_avatar_face.NPK"))
  .pipe(new Extract({
    match: (item) => {
      return item.path.includes("sprite/character/gunblader/equipment/avatar/face/gb_face5402b.img");
    }
  })).on("finish", (list: Img[]) => {
    const sprite = list[0].sprites[0];

    sprite.toPng(path.resolve(process.cwd(), "./test-data/test.png"));
  });
