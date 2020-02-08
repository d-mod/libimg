/***
 @author kritsu
 @date 2019/12/6 12:29
 **/
import {VER_02, VER_04, VER_06} from "../constants/version"
import {ARGB_8888, LINK} from "../constants/color-bits"
import {SPRITE_BODY} from "../constants/define"
import {COMPRESS_NONE} from "../constants/compress-mode"


function second({count}) {
    return function () {
        let sprites = []

        for (let i = 0; i < count || 0; i++) {
            let sprite = {}
            sprite.colorBits = this.readNumber()
            sprites.push(sprite)
            if (sprite.colorBits === LINK) {
                sprite.targetIndex = this.readNumber()
                continue
            }
            this.readObject(SPRITE_BODY, sprite)
        }

        for (let sprite of sprites) {
            if (sprite.colorBits === LINK) {
                continue
            }
            if (sprite.compressMode === COMPRESS_NONE) {
                sprite.length = sprite.width * sprite.height * (sprite.colorBits === ARGB_8888 ? 4 : 2)
            }
            sprite.data = this.read(sprite.length);
        }
        return {sprites}
    }
}

function fourth({count}) {
    let base = second({count})
    return function () {
        let paletteSize = this.readNumber()
        let palette = this.read(paletteSize)

        let palettes = [palette]

        let body = base.call(this)
        Object.assign(body, {palettes})
        return body
    }
}

function sixth({count}) {
    let base = second({count})
    return function () {
        let paletteCount = this.readNumber()
        let palettes = []
        for (let i = 0; i < paletteCount; i++) {
            let paletteSize = this.readNumber()
            let palette = this.read(paletteSize * 4)
            palettes.push(palette)
        }
        let body = base.call(this)
        Object.assign(body, {palettes})
        return body
    }
}


export const Handlers = {
    [VER_02]: second,
    [VER_04]: fourth,
    [VER_06]: sixth
}


export function createDecoder(header) {
    let {version = 0} = header
    let handle = Handlers[version]
    if (handle) {
        return handle(header)
    }
    throw new Error(`Not Found Handler By VER:${version}`)
}
