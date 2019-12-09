/***
 @author kritsu
 @date 2019/12/8 23:06
 **/
export class ByteArray {


    get offset() {
        return this._offset || -1
    }

    set offset(val) {
        val = Math.min(val, this.length - 1)
        val = Math.max(0, val)
        this._offset = val
    }

    get length() {
        return this.data.length
    }

    constructor(data) {
        this.data = Buffer.isBuffer(data) ? data : Buffer.from(data)
        this._offset = 0
    }

    handle(callback) {
        return callback.apply(this)
    }

    readArray(define, len) {
        let array = []
        for (let i = 0; i < len; i++) {
            array.push(this.readObject(define))
        }
        return array
    }

    readObject(define, obj = {}) {
        Object.entries(define).forEach(([key, value]) => obj[key] = this[`read${value}`]())
        return obj
    }

    readNumber(size = 4) {
        let buf = this.read(size)
        let rs = 0;
        for (let i = 0; i < buf.length; i++) {
            rs |= (buf[i] & 0xff) << (i * 8);
        }
        return rs
    }

    read(size) {
        let start = this.offset
        let end = this.skip(size)
        return this.data.slice(start, end)
    }

    readString() {
        let i = -1
        let start = this.offset
        let offset = this.offset
        do {
            i = this.data[offset++]
        } while (i !== 0 && offset < this.length)
        this.offset = offset
        return this.data.toString("utf8", start, offset - 1)
    }

    reset(offset = 0) {
        this.offset = offset
    }

    skip(len) {
        return this.offset += len
    }
}
