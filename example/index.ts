import type { Img } from "../src/model/img";
import { Merge } from "../src";
import { find } from "./find";

const outputPath = "F:\\WeGameApps\\地下城与勇士：创新世纪\\ImagePacks2";

const code = "pants=5603";

const profession = "swordman";

(async () => {
  const start = performance.now();
  const list = await find(outputPath, profession, code);
  const img = new Merge(list).finalize() as Img;
  img.path = "test.img";
  const first = img.sprites[0];

  first.toPng("./test-data/test.png");

  // eslint-disable-next-line no-console
  console.info(`${performance.now() - start}ms`);
})();
