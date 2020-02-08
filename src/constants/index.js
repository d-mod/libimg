/***
 @author kritsu
 @date 2019/12/9 21:57
 **/

export * from "./magic"

export * from "./define"

export const ColorBits = {
    ARGB_1555: 0x0e,
    ARGB_4444: 0x0f,
    ARGB_8888: 0x10,
    LINK: 0x11,
    DXT_1: 0x12,
    DXT_3: 0x13,
    DXT_5: 0x14
}


export const CompressMode = {
    NONE: 0x05,
    ZLIB: 0x06,
    DDS_ZLIB: 0x07
}

export const ImgVersion = {
    VER_01: 0x01,
    VER_02: 0x02,
    VER_04: 0x04,
    VER_05: 0x05,
    VER_06: 0x06
}

