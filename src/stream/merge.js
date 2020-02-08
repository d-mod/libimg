import queues from "./queues"
import {ColorBits, CompressMode, ImgVersion} from "../constants"
import {Sprite} from "../model"

/***
 @author kritsu
 @date 2020/2/8 18:23
 **/
export class Merge {
    constructor(items = []) {
        this.list = []
        this.add(...items)
    }

    add(...items) {
        this.list.push(...items)
        this.list.sort(compare)
    }

    finalize() {
        const list = this.list.reverse()
        let count = 0
        let version = ImgVersion.VER_02

        for (let item of list) {
            if (item.count > count) {
                count = item.count
            }
        }


        let sprites = new Array(count)


        for (let i = 0; i < count; i++) {

            let width = 1, height = 1
            let frameWidth = 0, frameHeight = 0
            let x = 800, y = 600
            let colorBits = ColorBits.ARGB_8888
            let compressMode = CompressMode.NONE

            for (let item of list) {
                if (i >= item.count) {
                    continue
                }
                let source = item.sprites[i]
                if (source.frameWidth > frameWidth) {
                    frameWidth = source.frameWidth;
                }
                if (source.frameHeight > frameHeight) {
                    frameHeight = source.frameHeight;
                }
                if (source.width * source.height === 1 && source.compressMode === COMPRESS_NONE) {
                    continue
                }
                if (source.width + source.x > width) {
                    width = source.width + source.x
                }
                if (source.height + source.y > height) {
                    height = source.height + source.y
                }
                if (source.x < x) {
                    x = source.x
                }
                if (source.y < y) {
                    y = source.y
                }
                if (source.colorBits > colorBits && source.colorBits < LINK) {
                    colorBits = source.colorBits
                }
            }
            width -= x
            height -= y
            width = Math.max(width, 1)
            height = Math.max(height, 1)
            if (width * height > 1) {
                compressMode = CompressMode.ZLIB
            }


            let images = []

            for (let item of list) {
                if (i >= item.count) {
                    continue
                }
                let source = item.sprites[i]
                let data = source.decode()
                let {width, height} = source
                images.push({
                    data,
                    x: source.x - x,
                    y: source.y - y,
                    width,
                    height
                }); //绘制贴图
            }
            let data = draw(width, height, images)
            sprites[i] = Sprite.encode({
                data,
                width,
                height,
                x,
                y,
                frameWidth,
                frameHeight,
                colorBits,
                compressMode,
            })
        }

        return {
            count,
            version,
            sprites
        }
    }

}

function draw(width, height, list = []) {
    let data = Buffer.alloc(width * height * 4)

    for (let image of list) {
        let pixels = image.data

        for (let j = 0; j < image.height; j++) {

            if (j + image.y < 0 || j + image.y >= height) {
                continue
            }

            let s1 = (image.x + (image.y + j) * width) * 4

            let s2 = j * image.width * 4


            for (let i = 0; i < image.width; i++) {
                if (i + image.x < 0 || i + image.x >= width) {
                    continue
                }

                let point = s1 + i * 4
                let rgba = data.readInt32LE(point)

                if (rgba === 0) {
                    pixels.copy(data, point, s2 + i * 4, s2 + i * 4 + 4)
                }
            }
        }

    }
    return data
}

function compare(a, b) {
    const index1 = indexOf(a.path)
    const index2 = indexOf(b.path)
    if (index1 === index2) {
        return 0;
    }
    if (index1 < index2) {
        return 1;
    }
    return -1;
}

function indexOf(key) {
    key = key.substring(key.indexOf("_") + 1);
    key = key.replace(".img", ""); //去除.img后缀
    let regex = /\d+/g
    let matches = key.match(regex)
    let suf = 0;
    for (let i = 0; i < matches.length; i++) {
        //移除数字序号
        key = key.replace(matches[i], "");
        if (i > 0) {
            suf = parseInt(matches[i]);
        }
    }
    if (queues[key]) {
        return queues[key] + suf;
    }
    return -1;
}
