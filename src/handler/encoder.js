/***
 @author kritsu
 @date 2019/12/8 11:48
 **/
import {VER_02, VER_04, VER_06} from "../constants/version"
import {LINK} from "../constants/color-bits"
import {SPRITE_BODY} from "../constants/define"

function second(item) {
    return function () {
        for (let sprite of item.sprites) {
            this.writeNumber(sprite.colorBits)
            if (sprite.colorBits === LINK) {
                this.writeNumber(sprite.targetIndex)
                continue
            }
            this.writeObject(SPRITE_BODY, sprite)
        }

        for (let sprite of item.sprites) {
            if (sprite.colorBits === LINK) {
                continue
            }
            this.write(sprite.data)
        }
    }
}

function fourth(item) {
    let {palettes} = item
    let base = second(item)
    return function () {
        if (palettes.length > 0) {
            this.writeNumber(palettes[0].length)
            this.write(palettes[0])
        }
        base.call(this)
    }
}

function sixth(item) {
    let {palettes} = item
    let base = second(item)
    return function () {
        let paletteCount = palettes.length
        this.writeNumber(paletteCount)
        for (let i = 0; i < paletteCount; i++) {
            this.writeNumber(palettes[i].length / 4)
            this.write(palettes[i])
        }
        base.call(this)
    }
}


export const Handlers = {
    [VER_02]: second,
    [VER_04]: fourth,
    [VER_06]: sixth
}


export function createEncoder(header) {
    let {version = 0} = header
    let handle = Handlers[version]
    if (handle) {
        return handle(header)
    }
    throw new Error(`Not Found Handler By VER:${version}`)
}
