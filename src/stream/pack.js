import {Transform} from "stream"
import {IMG_MAGIC, IMG_PATH_KEY, NPK_MAGIC} from "../constants/magic"
import crypto from "crypto"
import {IMG_HEADER} from "../constants/define"
import {createEncoder} from "../handler/encoder"
import {ColorBits, ImgVersion} from "../constants"


function writePath(path) {
    let data = Buffer.alloc(256)
    data.write(path, 0, "utf8")
    for (let i = 0; i < 256; i++) {
        data[i] = (data[i] ^ IMG_PATH_KEY[i]) & 0xff;
    }
    return data
}

function crc32(data) {
    let hash = crypto.createHash("sha256")
    hash.update(data.slice(0, data.length - data.length % 17))
    return hash.digest()
}


/***
 @author kritsu
 @date 2019/12/6 16:56
 **/
export class Pack extends Transform {


    constructor(list = []) {
        super()
        this.list = list
    }


    add(...item) {
        this.list.push(...item)
    }


    writeObject(define, obj = {}) {
        Object.entries(define).forEach(([key, value]) => {
            this[`write${value}`](obj[key])
        })
        return this
    }

    writeString(string, encoding = "utf8", split = true) {
        this.write(string, encoding)
        if (split) {
            this.write('\0')
        }
        return this
    }

    writeNumber(number, size = 4) {
        let buf = Buffer.alloc(size)
        for (let i = 0; i < buf.length; i++) {
            buf[i] = (number >> (i * 8))
        }
        return this.write(buf)
    }


    finalize() {
        for (let img of this.list) {
            let indexLength = 0
            let dataLength = 0
            for (let sprite of img.sprites) {
                indexLength += 8
                if (sprite.colorBits !== ColorBits.LINK) {
                    indexLength += 28
                    dataLength += sprite.data.length
                }
            }
            if (img.version === ImgVersion.VER_06) {
                dataLength += 4
            }
            if (img.palettes) {
                for (let palette of img.palettes) {
                    dataLength += palette.length + 4
                }
            }
            img.indexLength = indexLength
            img.length = dataLength + indexLength + 32
        }

        let count = this.list.length
        let lastLength = 0
        let position = 52 + count * 264
        for (let i = 0; i < count; i++) {
            if (i > 0) {
                if (this.list[i].colorBits === ColorBits.LINK) {
                    continue;
                }
                position += lastLength
            }
            this.list[i].offset = position
            lastLength = this.list[i].length
        }

        this.pause()
        this.writeString(NPK_MAGIC)

        this.writeNumber(count)


        for (let item of this.list) {
            this.writeNumber(item.offset)
            this.writeNumber(item.length)
            this.write(writePath(item.path))
        }

        let header = this.read()

        this.resume()

        this.write(crc32(header))

        for (let item of this.list) {
            let obj = Object.assign({}, item, {magic: IMG_MAGIC, placeholder: 0})
            this.writeObject(IMG_HEADER, obj)
            createEncoder(item).apply(this)
        }
        this.end()
    }

    _transform(chunk, encoding, callback) {
        this.push(chunk)
        callback()
    }
}
