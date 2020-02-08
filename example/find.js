/***
 @author kritsu
 @date 2019/12/6 12:27
 **/
const {
  Extract,
} = require("../src")

const fs = require("fs")

const qs = require("querystring")

const path = require("path")

const q = require("q")


function find(outputPath, profession, code, excludes = []) {

  let parts = qs.parse(code)

  excludes.forEach(e => delete parts[e])

  parts = Object.entries(parts)

  let array = []

  let defer = q.defer()


  parts.forEach(([key, value]) => {
    const f = getDressFileName(profession, key)
    const code1 = getNumber(value)

    const match = item => {
      let code0 = getNumber(item.path)
      if (code0 === code1) {
        return true
      }
      return code0 % 100 === 0 && Math.floor(code0 / 100) === Math.floor(code1 / 100);
    }


    fs.createReadStream(path.resolve(outputPath, f))
        .pipe(new Extract({match}))
        .on("finish", list => {
          list = list.map(e => {
            let index = code1 % 100
            e.path = replacePath(e.path, code1)
            e.paletteIndex = index
            return e
          })
          array.push(list)
          if (array.length === parts.length) {
            defer.resolve([].concat(...array))
          }
        })
  })
  return defer.promise
}

function replacePath(path, code) {
  const regex = /\d+/
  code = code.toString()
  for (let i = code.length; i < 4; i++) {
    code = "0".concat(code)
  }
  return path.replace(regex, code)
}


function getDressFileName(profession, part, type = "avatar") {
  if (!profession.endsWith("_at")) {
    profession = profession.concat("_")
  }
  return `sprite_character_${profession}equipment_${type}_${part}.NPK`
}

function getNumber(s) {
  return parseInt(s.replace(/[^\d+]/ig, ""));
}


module.exports.find = find
