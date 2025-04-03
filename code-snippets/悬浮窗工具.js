/*
 * @Author: TonyJiangWJ
 * @Date: 2024-12-17 13:47:00
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2024-12-17 14:10:41
 * @Description: 
 *  这是一个代码片段也可以说是一个代码模板，可以在这个文件中修改代码逻辑，节省时间
 *  当前为一个简单的带悬浮按钮的示例 具体见代码中的注释
 */


let { config } = require('../config.js')(runtime, global)
// config.buddha_like_mode = false
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, global)
let { logInfo, errorInfo, warnInfo, debugInfo, infoLog, debugForDev, clearLogFile, flushAllLogs } = singletonRequire('LogUtils')
let floatyInstance = singletonRequire('FloatyUtil')
floatyInstance.enableLog()
let commonFunctions = singletonRequire('CommonFunction')
let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let runningQueueDispatcher = singletonRequire('RunningQueueDispatcher')
let TouchController = require('../lib/TouchController.js')
let logFloaty = singletonRequire('LogFloaty')
let warningFloaty = singletonRequire('WarningFloaty')
let ocrUtil = require('../lib/LocalOcrUtil.js')
let formatDate = require('../lib/DateUtil.js')

infoLog(['当前使用的OCR类型为：{} 是否启用：{}', ocrUtil.type, ocrUtil.enabled])
let unlocker = require('../lib/Unlock.js')
// 回收图像资源
let resourceMonitor = require('../lib/ResourceMonitor.js')(runtime, global)

logInfo('======加入任务队列，并关闭重复运行的脚本=======')
runningQueueDispatcher.addRunningTask()

// 注册自动移除运行中任务
commonFunctions.registerOnEngineRemoved(function () {
  if (config.auto_lock === true && unlocker.needRelock() === true) {
    debugInfo('重新锁定屏幕')
    automator.lockScreen()
    unlocker.saveNeedRelock(true)
  }
  config.resetBrightness && config.resetBrightness()
  debugInfo('校验并移除已加载的dex')
  if (typeof destoryPool != 'undefined') {
    destoryPool()
  }
  // 移除运行中任务
  runningQueueDispatcher.removeRunningTask(true, false,
    () => {
      // 保存是否需要重新锁屏
      unlocker.saveNeedRelock()
      config.isRunning = false
    }
  )
}, 'main')

if (!commonFunctions.ensureAccessibilityEnabled()) {
  errorInfo('获取无障碍权限失败')
  exit()
}

unlocker.exec()
commonFunctions.listenDelayStart()
commonFunctions.requestScreenCaptureOrRestart()

let data = {
  _clickExecuting: false,
  set clickExecuting (val) {
    threadPool.execute(function () {
      if (val) {
        logFloaty.logQueue.push('点击执行中，请稍等', '#888888')
      } else {
        logFloaty.logQueue.push('执行完毕', '#888888')
      }
    })
    this._clickExecuting = val
  },
  get clickExecuting () {
    return this._clickExecuting
  },
  btnDrawables: {}
}
let count = 0
// 启动UI形式，支持手动执行更多功能，定义按钮样式文字 以及点击操作行为
let btns = [
  {
    id: 'change_text',
    text: '文字内容修改',
    textSize: 6,
    onClick: function () {
      // 对按钮样式和文本的修改需要在ui线程中执行
      ui.run(() => {
        window.change_text.setText('文字内容修改' + (++count))
        // 修改按钮样式 id 按钮id handler:样式修改回调默认修改按钮颜色和边框样色 color 按钮颜色  storkColor 边框颜色
        changeButtonStyle('change_text', null, '#FF753A', '#FF753A')
      })
    }
  },
  {
    id: 'exit',
    color: '#EB393C',
    rippleColor: '#C2292C',
    text: '退出脚本',
    onClick: function () {
      exit()
    }
  }
]

// ======以下代码尽量不要修改=====

importClass(android.graphics.drawable.GradientDrawable)
importClass(android.graphics.drawable.RippleDrawable)
importClass(android.content.res.ColorStateList)
importClass(java.util.concurrent.LinkedBlockingQueue)
importClass(java.util.concurrent.ThreadPoolExecutor)
importClass(java.util.concurrent.TimeUnit)
importClass(java.util.concurrent.ThreadFactory)
importClass(java.util.concurrent.Executors)
let threadPool = new ThreadPoolExecutor(2, 2, 60, TimeUnit.SECONDS, new LinkedBlockingQueue(16),
  new ThreadFactory({
    newThread: function (runnable) {
      let thread = Executors.defaultThreadFactory().newThread(runnable)
      thread.setName('sea-operator-' + thread.getName())
      return thread
    }
  })
)
function destoryPool () {
  threadPool && threadPool.shutdown()
}
let window = floaty.rawWindow(
  `<horizontal>
    <vertical padding="1">
   ${btns.map(btn => {
    return `<vertical padding="1"><button id="${btn.id}" text="${btn.text}" textSize="${btn.textSize ? btn.textSize : 12}sp" w="*" h="30" marginTop="5" marginBottom="5" /></vertical>`
  }).join('\n')
  }</vertical>
  </horizontal>`
)

function setButtonStyle (btnId, color, rippleColor) {
  let shapeDrawable = new GradientDrawable();
  shapeDrawable.setShape(GradientDrawable.RECTANGLE);
  // 设置圆角大小，或者直接使用setCornerRadius方法
  // shapeDrawable.setCornerRadius(20); // 调整这里的数值来控制圆角的大小
  let radius = util.java.array('float', 8)
  for (let i = 0; i < 8; i++) {
    radius[i] = 20
  }
  shapeDrawable.setCornerRadii(radius); // 调整这里的数值来控制圆角的大小
  shapeDrawable.setColor(colors.parseColor(color || '#3FBE7B')); // 按钮的背景色
  shapeDrawable.setPadding(10, 10, 10, 10); // 调整这里的数值来控制按钮的内边距
  // shapeDrawable.setStroke(5, colors.parseColor('#FFEE00')); // 调整这里的数值来控制按钮的边框宽度和颜色
  data.btnDrawables[btnId] = shapeDrawable
  let btn = window[btnId]
  btn.setShadowLayer(10, 5, 5, colors.parseColor('#888888'))
  btn.setBackground(new RippleDrawable(ColorStateList.valueOf(colors.parseColor(rippleColor || '#27985C')), shapeDrawable, null))
}

/**
 * 修改按钮样式
 * 
 * @param {string} btnId 按钮id
 * @param {function} handler 样式修改回调方法，参数为按钮的shapeDrawable，默认修改按钮颜色和边框样色
 * @param {string} color 按钮颜色
 * @param {string} storkColor 边框颜色
 */
function changeButtonStyle (btnId, handler, color, storkColor) {
  handler = handler || function (shapeDrawable) {
    color && shapeDrawable.setColor(colors.parseColor(color))
    storkColor && shapeDrawable.setStroke(5, colors.parseColor(storkColor))
  }
  handler(data.btnDrawables[btnId])
}

ui.run(() => {
  window.setPosition(config.device_width * 0.1, config.device_height * 0.5)
})
btns.forEach(btn => {
  ui.run(() => {
    if (typeof btn.render == 'function') {
      btn.render(window[btn.id])
    } else {
      setButtonStyle(btn.id, btn.color, btn.rippleColor)
    }
  })
  if (btn.onClick) {
    window[btn.id].on('click', () => {
      // region 点击操作执行中，对于collect_friends触发终止，等待执行结束
      if (data.clickExecuting) {
        if (btn.handleExecuting) {
          btn.handleExecuting()
          return
        }
        threadPool.execute(function () {
          logFloaty.pushLog('点击执行中，请稍等')
        })
        return
      }
      data.clickExecuting = true
      // endregion
      threadPool.execute(function () {
        try {
          btn.onClick()
        } catch (e) {
          errorInfo(['点击执行异常：{} {}', e, e.message], true)
        } finally {
          data.clickExecuting = false
        }
      })
    })
  }
})

// 退出按钮可以长按进行拖动
window.exit.setOnTouchListener(new TouchController(window, () => {
  exit()
}, () => {
  changeButtonStyle('exit', null, '#FF753A', '#FFE13A')
}, () => {
  changeButtonStyle('exit', (drawable) => {
    drawable.setColor(colors.parseColor('#EB393C'))
    drawable.setStroke(0, colors.parseColor('#3FBE7B'))
  })
}).createListener())
