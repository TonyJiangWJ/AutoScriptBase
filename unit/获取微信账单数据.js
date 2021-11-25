importClass(java.util.concurrent.LinkedBlockingQueue)
importClass(java.util.concurrent.ThreadPoolExecutor)
importClass(java.util.concurrent.TimeUnit)
importClass(java.util.concurrent.CountDownLatch)
importClass(java.util.concurrent.ThreadFactory)
importClass(java.util.concurrent.Executors)
importClass(com.stardust.autojs.core.graphics.ScriptCanvas)

let currentEngine = engines.myEngine()
let runningEngines = engines.all()
let runningSize = runningEngines.length
let currentSource = currentEngine.getSource() + ''
if (runningSize > 1) {
  runningEngines.forEach(engine => {
    let compareEngine = engine
    let compareSource = compareEngine.getSource() + ''
    if (currentEngine.id !== compareEngine.id && compareSource === currentSource) {
      // 强制关闭同名的脚本
      compareEngine.forceStop()
    }
  })
}
device.keepScreenDim()
let { config, storage_name: _storage_name } = require('../config.js')(runtime, this)
config.device_height = config.device_height || 2340
config.device_width = config.device_width || 1080
let sRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let automator = sRequire('Automator')
let { debugInfo, warnInfo, errorInfo, infoLog, logInfo, debugForDev } = sRequire('LogUtils')
let commonFunction = sRequire('CommonFunction')
let widgetUtils = sRequire('WidgetUtils')

config.show_debug_log = true
let runningQueueDispatcher = sRequire('RunningQueueDispatcher')
commonFunction.autoSetUpBangOffset(true)
runningQueueDispatcher.addRunningTask()
let offset = config.bang_offset

let SCALE_RATE = config.scaleRate || 1
let cvt = (v) => parseInt(v * SCALE_RATE)

let window = floaty.rawWindow(
  <canvas id="canvas" layout_weight="1" />
);

window.setSize(config.device_width, config.device_height)
window.setTouchable(false)

let threadPool = new ThreadPoolExecutor(4, 4, 60,
  TimeUnit.SECONDS, new LinkedBlockingQueue(16),
  new ThreadFactory({
    newThread: function (runnable) {
      let thread = Executors.defaultThreadFactory().newThread(runnable)
      thread.setName('wechat-bill-' + thread.getName())
      return thread
    }
  })
)
let isRunning = true


let displayInfos = []
/*
threadPool.execute(function () {
  while (displayInfos.length === 0) {
    let contents = widgetUtils.widgetGetAll('.*\\d+月\\d+日.*', null, true)
    if (contents && contents.target && contents.target.length > 0) {
      let isDesc = contents.isDesc
      contents = contents.target
      debugInfo(['找到了文本内容总数：{}', contents.length], true)
      let exists = {}
      let validList = contents.filter(v => {
        let key = v.bounds().centerX() + '_' + v.bounds().centerY()
        if (exists[key]) {
          return false
        }
        exists[key] = true
        return v.bounds().centerY() < config.device_height && v.visibleToUser()
      })
      validList.forEach(target => {
        displayInfos.push({ content: isDesc ? target.desc() : target.text(), bounds: target.bounds() })
      })
      debugInfo(['有效信息数：{}', validList.length], true)
      debugInfo(['有效信息：{}', JSON.stringify(displayInfos)])

    } else {
      debugInfo(['未找到内容'], true)
    }
    sleep(1000)
  }
})
 */

let canDraw = false

/**
 * 根据label标题获取内容
 * 
 * @param {*} labelContent 
 * @param {*} timeout 
 * @returns 
 */
function getContentByLabel (labelContent, timeout) {
  let labelWidget = widgetUtils.widgetGetOne(labelContent, timeout)
  if (labelWidget) {
    let label = labelWidget.desc() || labelWidget.text()
    let contentWidget = labelWidget.parent().child(1)
    let contentStr = contentWidget.desc() || contentWidget.text()
    return { content: contentStr, bounds: contentWidget.bounds(), label: label, target: contentWidget, labelTarget: labelWidget }
  }
  return null
}

/**
 * 根据label标题获取内容
 * 
 * @param {*} labelContent 
 * @param {*} timeout 
 * @returns 
 */
function getContentByLabelSub (labelContent, timeout) {
  let labelWidget = widgetUtils.widgetGetOne(labelContent, timeout)
  if (labelWidget) {
    let label = labelWidget.desc() || labelWidget.text()
    let contentWidget = labelWidget.parent().child(1).child(0)
    let contentStr = contentWidget.desc() || contentWidget.text()
    return { content: contentStr, bounds: contentWidget.bounds(), label: label, target: contentWidget, labelTarget: labelWidget }
  }
  return null
}

threadPool.execute(function () {
  try {
    let payStat = getContentByLabel('当前状态')
    if (payStat) {
      let root = payStat.target
        .parent()// 20
        .parent()// 19
        .child(0)// 20-0
      displayInfos.push({ content: root.desc() || root.text(), bounds: root.bounds(), label: '标题' })
      displayInfos.push(payStat)
      let timeout = 400
      displayInfos.push(getContentByLabel('商品', timeout))
      displayInfos.push(getContentByLabel('(支付|转账)时间', timeout))
      displayInfos.push(getContentByLabelSub('支付方式', timeout))
      displayInfos.push(getContentByLabel('(交易|转账)单号', timeout))
      displayInfos.push(getContentByLabel('商户单号', timeout))
      displayInfos.push(getContentByLabel('商户全称', timeout))
      displayInfos.push(getContentByLabel('转账说明', timeout))
      displayInfos.push(getContentByLabel('收款时间', timeout))
      // 收款
      displayInfos.push(getContentByLabel('收款方备注', timeout))
      displayInfos = displayInfos.filter(v => v !== null)
      canDraw = true
    }
  } catch (e) {
    errorInfo('执行异常' + e)
    commonFunction.printExceptionStack(e)
  }
})

window.canvas.on("draw", function (canvas) {
  if (!isRunning) {
    return
  }
  try {
    // 清空内容
    canvas.drawColor(0xFFFFFF, android.graphics.PorterDuff.Mode.CLEAR)
    let Typeface = android.graphics.Typeface
    let paint = new Paint()
    paint.setStrokeWidth(1)
    paint.setTextSize(20)
    paint.setTypeface(Typeface.DEFAULT_BOLD)
    paint.setTextAlign(Paint.Align.LEFT)
    paint.setAntiAlias(true)
    paint.setStrokeJoin(Paint.Join.ROUND)
    paint.setDither(true)

    if (canDraw && displayInfos.length > 0) {
      displayInfos.forEach(display => {
        if (display.bounds.centerY() > config.device_height) {
          return
        }
        drawText(display.label + ': ' + display.content, { x: display.bounds.centerX(), y: display.bounds.centerY() }, canvas, paint, '#00ff00')
      })
    } else {
      drawText('加载中。。。', { x: config.device_width / 2, y: config.device_height / 2 }, canvas, paint, '#00ff00')
    }
  } catch (e) {
    commonFunction.printExceptionStack(e)
    exitAndClean()
  }
})

let lastChangedTime = new Date().getTime()
threads.start(function () {
  toastLog('按音量上键关闭，音量下切换模式')
  events.observeKey()
  events.on("key_down", function (keyCode, event) {
    if (keyCode === 24) {
      exitAndClean()
    } else if (keyCode === 25) {
      // 设置最低间隔200毫秒，避免修改太快
      if (new Date().getTime() - lastChangedTime > 200) {
        lastChangedTime = new Date().getTime()
      }
    }
  })
})

setInterval(function () {
  // 保持启动 半分钟一次设置当前脚本的前台运行
  runningQueueDispatcher.renewalRunningTask()
}, 30000)

function exitAndClean () {
  if (!isRunning) {
    return
  }
  isRunning = false
  if (window !== null) {
    window.canvas.removeAllListeners()
    toastLog('close in 1 seconds')
    setTimeout(function () {
      window.close()
      exit()
    }, 1000)
  } else {
    exit()
  }
}

commonFunction.registerOnEngineRemoved(function () {
  runningQueueDispatcher.removeRunningTask()
  device.cancelKeepingAwake()
  isRunning = false
  threadPool.shutdown()
  debugInfo(['等待线程池关闭:{}', threadPool.awaitTermination(5, TimeUnit.SECONDS)])
  if (config.auto_start_rain) {
    // 执行结束后关闭自动启动
    var configStorage = storages.create(_storage_name)
    configStorage.put("auto_start_rain", false)
  }
})

// ---------------------

function convertArrayToRect (a) {
  // origin array left top width height
  // left top right bottom
  return new android.graphics.Rect(a[0], a[1] + offset, (a[0] + a[2]), (a[1] + offset + a[3]))
}

function drawRectAndText (desc, position, colorStr, canvas, paint) {
  let color = colors.parseColor(colorStr)

  paint.setStrokeWidth(1)
  paint.setStyle(Paint.Style.STROKE)
  // 反色
  paint.setARGB(255, 255 - (color >> 16 & 0xff), 255 - (color >> 8 & 0xff), 255 - (color & 0xff))
  canvas.drawRect(convertArrayToRect(position), paint)
  paint.setARGB(255, color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff)
  paint.setStrokeWidth(1)
  paint.setTextSize(20)
  paint.setStyle(Paint.Style.FILL)
  canvas.drawText(desc, position[0], position[1] + offset, paint)
  paint.setTextSize(10)
  paint.setStrokeWidth(1)
  paint.setARGB(255, 0, 0, 0)
}

function drawText (text, position, canvas, paint, colorStr) {
  colorStr = colorStr || '#0000ff'
  let color = colors.parseColor(colorStr)
  paint.setARGB(255, color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff)
  paint.setStrokeWidth(1)
  paint.setStyle(Paint.Style.FILL)
  canvas.drawText(text, position.x, position.y + offset, paint)
}

function randomSleep (sleepTime) {
  sleep(1000 + ~~(Math.random() * sleepTime))
}

function getRandom (min, max) {
  return min + ~~(Math.random() * max * 10 % (max - min))
}