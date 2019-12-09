/***
 @author kritsu
 @date 2019/12/7 20:10
 **/
export const NPK_MAGIC = "NeoplePack_Bill"

export const IMG_MAGIC = "Neople Img File"

export const IMG_PATH_KEY = initKey();


function initKey() {
    let temp = "puchikon@neople dungeon and fighter "
    let key = Buffer.alloc(256);
    key.write(temp)

    let ds = ['D', 'N', 'F']
    for (let i = temp.length; i < 255; i++) {
        key.write(ds[i % 3], i);
    }
    key.write('\0', 255)
    return key
}
