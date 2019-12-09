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
            let index = this.paletteIndex
            Object.defineProperty(sprite, "palette", {
                get() {
                    if (index < palettes.length) {
                        return palettes[index]
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

    }

    static create(options) {
        let img = new Img(options)
        return img
    }

}
