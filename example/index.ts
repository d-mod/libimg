/***
 @author kritsu
 @date 2020/2/7 14:40
 **/

import { Merge } from "../src";
import type Img from "../src/model/img";
import { find } from "./find";

const outputPath = "E:\\WeGameApps\\地下城与勇士\\ImagePacks2";

const code = "hair=11200&coat=17000&skin=0000&pants=5603&shoes=9900";

const profession = "swordman";

(async () => {
  const start = performance.now();
  const list = await find(outputPath, profession, code);
  const img = new Merge(list).finalize() as Img;
  img.path = "test.img";
  const first = img.sprites[0];

  first.toPng("D:/test.png");

  // eslint-disable-next-line no-console
  console.info(`${performance.now() - start}ms`);
})();

