let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
config.save_log_file = false
config.show_debug_log = true
let _commonFunctions = singletonRequire('CommonFunction')
let resourceMonitor = require('../lib/ResourceMonitor.js')(runtime, global)
let { logInfo, errorInfo, warnInfo, debugInfo, infoLog } = singletonRequire('LogUtils')
let FloatyInstance = singletonRequire('FloatyUtil')
let paddleOcr = singletonRequire('PaddleOcrUtil')
// let imgBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAKAAAAB5CAYAAAC+/irKAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAOGSURBVHic7dzZcptAFADRIZX//2XyRJlQLLPcS4/kPo+xxTK0GEByllLKWiTIH3oD9LsZoFAGKJQBCmWAQhmgUAYolAEK9ZfegBHr+vMMfVkWcEv+N+t2Rdr28Wz/7n52lBrg/kBsog7I2bKzl/l2TKPjd7U/o/tRO/bruj6uK20KzggkU832vrlPI+ta1/X29TMdG68Bv0zL2Slz+bW/nxLgTO+wXsuydE1Vx33vGYvoOK72ZTSmq/FpGbfpb0JaLmhHXrO3f92yLMNR1VwL9S77znGdZ/sStew7d/sffgaMHMDRZc10Jn57W2rPTllTdu16Uq8Bv/URRM9+1bymdoq7W0fvpcOd3u2qiTB0Cp7pjLNpmf5aXC0z+tFT5LTZY/RNcba8/TLCzoBXG9q7wSMPc8kz79l1V43oA13rbj0R4T/d/KRMwZ8+9e4HiHieljl+2Y9papez/XvIFDzj1LvXMw0/7dNMN1u967kbk6upP3pbwx/DRLx7o0790YN1NZ1EnrGyzn69Y7FtT9Z0PBxg9ruXms6fAt7/fCRCavao2d7j89BS2m6yavYt/aM4cnreD0zLduxvoGa7no34ZGX0rrx2WTXrGQqw5zrpkz4of9Ib+N1rjjdAo9dh1N11rZRPQp4i237vSfYD1Qijj5vORI3f7PGV8gu+DfPGoM94YGeIL/0aMPMMNeNBnUn2A+SaZbcco6vfHb4LftqIlrsm+mOnzf6uNnN7ej4ffnrdDOPXIv3rWMeongb9zc9t78xyIFvGr/fmjviq2ObrrwHfNku40bKuKaf/Quom4h3cijwzzKLn2z1Nz1zLB/z/gG/8tVrvxTXxxnhLbXwjx+cjAiwl708MR826XRFa3pS94/AxAeo7eRMilAEKZYBCGaBQBiiUAQplgEIZoFAGKJQBCmWAQhmgUAYolAEKZYBCGaBQBiiUAQplgEIZoFAGKJQBCmWAQhmgUAYolAEKZYBCGaBQBiiUAQplgEIZoFAGKJQBCmWAQhmgUAYolAEKZYBCGaBQBiiUAQplgEIZoFAGKJQBCmWAQhmgUAYolAEKZYBCGaBQBiiUAQplgEIZoFAGKJQBCmWAQhmgUAYolAEKZYBCGaBQBiiUAQplgEIZoFAGKJQBCmWAQhmgUAYolAEKZYBCGaBQBiiUAQplgEIZoFAGKJQBCmWAQhmgUAYolAEK9Q/W9a7JL4eydAAAAABJRU5ErkJggg=='
let imgBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAKAAAAB5CAYAAAC+/irKAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAANhSURBVHic7dtJbqVAEABRsPr+V8YrJIQYasgkqtzxpN60zfAhKKbvdVmWbZEgP/QK6P9mgEIZoFAGKJQBCmWAQhmgUAYolAEKNXWA27Yt2zbmi5xR12s065L8Ku68I9Z1HXq+EY7r1rpe27ZVTdsSfMu67cu5mvbpZ3f+Va9BodlGgJL1zYz8avmlIbdu66zIa+Y79Sn4a1kHVcl8ny43Rhr9a6UEONvol+ltW5DbKnr0O86v9HOlnYJptaeXs33auw1ZE07Nupx/77ycu3m9zb8n9Nbr7ZLPHT4CRh7R+2mndp7777euy3GjPV1st6xT6XKf/i9CTUQ109Wur9eAsH2HzXwdd1ZzKg49BV8dLfT1YO+p+ErtHWn0qPGVnkddx33/tA/SRsDeI5sOt9X5844QV0tIEc9ZS0bCsAAzg6n98L07/fhZZj0Qenz5uCnlLniEo/6o5TRc+vgk+7NGv/FpvVvOijJkBIxeuYj5ZYQRdUdcKiK+2vXL2m77v7PwEfDLC37SCDdYtaKeRUbqDnDknVB6J3Y37T7dm4w7bWL0u3O3LSLeT6c/B7x6kj+6twfRVz+LfgB/t5xRtI6mZ10j4Ns3ON6me7umyhhVRtyZR1HxzRDxsvzhd8Ffidyxs0QTaahXcRmj3yw7MTO+kbdB1wjY8kT9abpR7iyPp+ov1mfEx1hfzHNZgFMw8V6UvIOklzPK9ryTHuAoo9psnrZZxtfzS+cXHfRQ14ClRr5Yr/2iavYyevR8EbXUNHfBX4+iGRv7ahmZf83Wc2DW/AFSj/Q/y4zQejpqXU7U30qMNDLXiHjjUXyQLBMEqO999W0fAxRqypsQ/R0GKJQBCmWAQhmgUAYolAEKZYBCGaBQBiiUAQplgEIZoFAGKJQBCmWAQhmgUAYolAEKZYBCGaBQBiiUAQplgEIZoFAGKJQBCmWAQhmgUAYolAEKZYBCGaBQBiiUAQplgEIZoFAGKJQBCmWAQhmgUAYolAEKZYBCGaBQBiiUAQplgEIZoFAGKJQBCmWAQhmgUAYolAEKZYBCGaBQBiiUAQplgEIZoFAGKJQBCmWAQhmgUAYolAEKZYBCGaBQBiiUAQplgEIZoFAGKJQBCmWAQhmgUAYolAEKZYBCGaBQBiiUAQplgEL9AuNpheaN0m71AAAAAElFTkSuQmCC'

let img = images.fromBase64(imgBase64)
let result = ''
let start = new Date()
img = images.resize(img, [parseInt(img.width * 2), parseInt(img.height * 2)])
img = images.fromBase64(images.toBase64(images.resize(img, [parseInt(img.width * 2), parseInt(img.height * 2)])))
result = $ocr.recognizeText(img)
console.log('$ocr识别:' + JSON.stringify(result) + '耗时：' + (new Date() - start) + 'ms')
start = new Date()
result = paddleOcr.recognize(img)
debugInfo('paddleOcr 识别结果：' + result + '耗时：' + (new Date() - start) + 'ms')
if (result) {
  result = result.replace(/\n/g, '').replace(/\s/g, '')
}

debugInfo(['使用paddleOcr识别倒计时时间文本: {}', result])
img.recycle()

sleep(3000)
let source = engines.myEngine().getSource() + ''
let count = engines.myEngine().execArgv.count || 0
if (count++ < 100) {
  debugInfo(['第{}次运行 当前引擎id：{}', count, engines.myEngine().id])
  engines.execScriptFile(source, { path: source.substring(0, source.lastIndexOf('/')), arguments: { count: count } })
}