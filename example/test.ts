import type { Img } from "../src";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Extract } from "../src";

const GAME_DIR = "F:\\WeGameApps\\地下城与勇士：创新世纪\\ImagePacks2";

fs.createReadStream(path.resolve(GAME_DIR, "sprite_character_gunblader_equipment_avatar_face.NPK"))
  .pipe(new Extract({
    match: (item) => {
      return item.path.includes("sprite/character/gunblader/equipment/avatar/face/gb_face5402b.img");
    }
  }))
  .on("finish", (list: Img[]) => {
    const sprite = list[0].sprites[0];

    sprite.toPng(path.resolve(process.cwd(), "./test-data/test.png"));
  });
