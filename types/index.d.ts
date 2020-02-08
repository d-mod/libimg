declare module "libimg" {

    import {Transform, Writable} from "stream"

    enum ColorBits {
        ARGB_1555 = 0x0e,
        ARGB_4444 = 0x0f,
        ARGB_8888 = 0x10,
        LINK = 0x11,
        DXT_1 = 0x12,
        DXT_3 = 0x13,
        DXT_5 = 0x14
    }

    enum ImgVersion {
        VER_01 = 0x01,
        VER_02 = 0x02,
        VER_04 = 0x04,
        VER_05 = 0x05,
        VER_06 = 0x06
    }

    enum CompressMode {
        NONE = 0x05,
        ZLIB = 0x06,
        DDS_ZLIB = 0x07
    }

    const IMG_HEADER: {
        magic: string,
        indexLength: string,
        placeholder: string,
        version: string,
        count: string
    }

    const SPRITE_BODY: {
        compressMode: string,
        width: string,
        height: string,
        length: string,
        x: string,
        y: string,
        frameWidth: string,
        frameHeight: string
    }

    export const NPK_MAGIC = "NeoplePack_Bill"

    export const IMG_MAGIC = "Neople Img File"

    export const IMG_PATH_KEY: string


    class Sprite {
        colorBits: ColorBits
        compressMode: CompressMode
        targetIndex: number
        data: Buffer
        length: number
        width: number
        height: number
        x: number
        y: number
        frameWidth: number
        frameHeight: number
    }


    class Img {
        path: string
        version: ImgVersion
        count: number
        palettes: any[]
        paletteIndex: number
        sprites: Sprite[]
        indexLength: number
        length: number
    }

    class Extract extends Writable {
        constructor(options)
    }


    class Pack extends Transform {

        constructor(list: Img[])

        add(...items: Img[]): void

        writeObject(define, object): void

        writeString(chunk: string, encoding?: string, split?: boolean): void

        writeNumber(number: number, size?: number): void

        finalize(): void
    }

    class Merge {
        constructor(list: Img[])

        add(...items: Img[])

        finalize(): Img
    }

    function createEncoder(header): Function;

    function createDecoder(header): Function;
}

