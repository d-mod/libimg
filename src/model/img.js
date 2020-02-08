/***
 @author kritsu
 @date 2019/12/7 22:26
 **/
import {Sprite} from "./sprite"

export default class Img {
    constructor(options) {
        Object.assign(this, options)
        this.palettes = this.palettes || []
        this.paletteIndex = 0
        this.initSprites()
    }

    initSprites() {
        this.sprites = (this.sprites || []).map(e => {
            if (e instanceof Sprite) {
                return e
            }
            let sprite = new Sprite(e)
            let palettes = this.palettes
            const parent = this
            Object.defineProperty(sprite, "palette", {
                get() {
                    if (parent.paletteIndex < palettes.length) {
                        return palettes[parent.paletteIndex]
                    }
                    return null
                }
            })
            return sprite
        })

        //将有链接的贴图置换为链接对应的
        this.sprites.forEach((sprite, index) => {
            if (sprite.targetIndex !== undefined) {
                this.sprites[index] = this.sprites[sprite.targetIndex]
            }
        })

    }

    decode(index) {
        return this.sprites[index].decode()
    }

    static create(options) {
        return new Img(options)
    }

}
