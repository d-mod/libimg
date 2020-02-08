/***
 @author kritsu
 @date 2020/2/7 14:40
 **/

const fs = require("fs")
const {Pack, merge} = require("../src")
const {find} = require("./find")


const outputPath = "D:\\WeGame\\games\\地下城与勇士\\ImagePacks2"

const code = "hair=11500&neck=16502&coat=8203&skin=0011&pants=18202&shoes=17503"

const profession = "gunner"
{
  (async () => {
    let list = await find(outputPath, profession, code)
    const img = merge(list)
    img.path = "test.img"
    const packer = new Pack([img])
    packer.pipe(fs.createWriteStream("D:/t.npk"))
    packer.finalize()
  })()
}
