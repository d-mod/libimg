import {Writable} from "stream"
import Img from "../model/img"
import {createDecoder} from "../handler/decoder"
import {IMG_HEADER} from "../constants/define"
import {IMG_MAGIC, IMG_PATH_KEY, NPK_MAGIC} from "../constants/magic"
import {ByteArray} from "./byte-array"

function readPath() {
    const len = 256
    let data = this.read(len)
    let i = 0
    do {
        data[i] = data.readInt8(i) ^ IMG_PATH_KEY[i]
        if (data[i] === 0) {
            break
        }
    } while (++i < len)
    data = data.slice(0, i)
    return data.toString("utf8")
}

function readImg() {

    let header = this.readObject(IMG_HEADER)

    let decode = createDecoder(header)

    let body = {}

    if (decode) {
        body = this.handle(decode) || []
    }
    return new Img(Object.assign(header, body))

}

function validateMatch(match) {
    if (match) {
        if (match instanceof RegExp) {
            let regex = match
            match = item => regex.test(item.path)
        } else if (typeof match !== "function") {
            let pattern = match.toString()
            match = item => new RegExp(pattern).test(item.path)
        }
    }
    return match
}

/***
 @author kritsu
 @date 2019/12/6 16:56
 **/
export class Extract extends Writable {
    constructor({match} = {}) {
        super()
        this._match = validateMatch(match)
        this.data = Buffer.alloc(0)
        this.chunks = []
    }


    _write(chunk, encoding, callback) {
        this.chunks.push(chunk)
        return callback()
    }

    extract() {
        let data = Buffer.concat(this.chunks)

        let ms = new ByteArray(data)


        let magic = ms.readString()


        let list = []

        if (magic === NPK_MAGIC) {
            let count = ms.readNumber()

            for (let i = 0; i < count; i++) {
                let offset = ms.readNumber()
                let length = ms.readNumber()
                let path = ms.handle(readPath)
                list.push({offset, length, path})
            }
        } else if (magic === IMG_MAGIC) {
            list.push({
                offset: 0,
                length: data.length,
                path: ""
            })
        }


        list = list.filter(item => this.match(item))

        for (let i = 0; i < list.length; i++) {
            ms.reset(list[i].offset)
            let body = ms.handle(readImg)
            Object.assign(list[i], body)
        }

        return list
    }

    match(item) {
        return !this._match || this._match(item)
    }

    end(callback) {
        this.emit("finish", this.extract())
        callback && callback()
    }
}
