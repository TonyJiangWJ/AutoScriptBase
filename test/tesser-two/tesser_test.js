/*
 * @Author: TonyJiangWJ
 * @Date: 2020-08-05 15:59:07
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-08-05 16:11:50
 * @Description: 
 */
try {
  importClass(com.googlecode.tesseract.android.TessBaseAPI)
} catch (e) {
  toastLog('当前AutoJS不支持tess-two')
  exit()
}
importClass(java.io.File)

let dataPath = files.cwd() + '/'
let language = 'chi_sim'
let imgPath = files.cwd() + '/中文识别.jpg'
// let imgPath = files.cwd() + '/countdown.png'
let start = new Date().getTime()
let tessBaseAPI = new TessBaseAPI()
log('datapath: ' + dataPath + ' language: ' + language + ' imgPath: ' + imgPath)
tessBaseAPI.init(dataPath, language)
log('加载耗时：' +  (new Date().getTime() -  start) + 'ms')
let reco_start = new Date().getTime()
//记得要在对应的文件夹里放上要识别的图片文件，比如我这里就在sd卡根目录放了img.png
tessBaseAPI.setImage(new File(imgPath))
let result = tessBaseAPI.getUTF8Text()
//这里，你可以把result的值赋值给你的TextView
tessBaseAPI.end()
let cost = new Date().getTime() -  start
log('识别耗时：' + (new Date().getTime() -  reco_start) + 'ms')
log('总计耗时：' + cost + 'ms')
toastLog('识别结果：' + result)
