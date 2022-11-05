// AutoJS Pro需要改为$plugins 不过pro建议直接使用官方的那个插件 我没做测试
let $mlKitOcr = plugins.load('com.tony.mlkit.ocr')
requestScreenCapture()
let img = captureScreen()
// 识别图片中的纯文本 
let text = $mlKitOcr.recognizeText(img)
console.log('text:', text)
// 可选参数 region[x, y, w, h] 识别指定区域的文本
let textInRegion = $mlKitOcr.recognizeText(img, { region: [10, 10, 500, 1000] })
console.log('text in region:', textInRegion)
// 获取图片中文本携带位置信息
let resultList = $mlKitOcr.detect(img)
console.log('resultList:', JSON.stringify(resultList))
// 可选参数region和上面的一样
let resultListInRegion = $mlKitOcr.detect(img, { region: [10, 10, 500, 1000] })
console.log('result list in region:', JSON.stringify(resultListInRegion))
// 返回列表字段定义 返回的是一行的文本信息
/*
OcrResult {
  label: // 当前行文本信息
  bounds: // 所在区域 Rect 对象
  confidence: // 置信度 0->1
  elements: // OcrResult 行内拆分的元素
}
*/

/**
 * 区域找字
 * @param {*} img 
 * @param {*} region 
 * @param {*} regex 正则
 * @returns 
 */
function recognizeWithBounds (img, region, regex) {
  let start = new Date()
  let resultLines = $mlKitOcr.detect(img, { region: region })
    // 过滤置信度小于0.5的
    .filter(v => v.confidence > 0.5)
  // 行内元素拆分 取elements
  let result = resultLines.map(line => line.elements).reduce((a, b) => a = a.concat(b), [])
  console.log('识别文本耗时：' + (new Date() - start) + 'ms')
  if (regex) {
    regex = new RegExp(regex)
    result = result.filter(r => regex.test(r.label))
  }
  return result
}