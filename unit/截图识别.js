let currentEngine = engines.myEngine()
let runningEngines = engines.all()
let currentSource = currentEngine.getSource() + ''
if (runningEngines.length > 1) {
  runningEngines.forEach(compareEngine => {
    let compareSource = compareEngine.getSource() + ''
    if (currentEngine.id !== compareEngine.id && compareSource === currentSource) {
      // 强制关闭同名的脚本
      compareEngine.forceStop()
    }
  })
}
let $mlKitOcr = $mlKitOcr || (() => {
  try {
    return plugins.load('com.tony.mlkit.ocr')
  } catch (e) {
    console.warn('未安装插件' + e)
  }
})()

if (!$mlKitOcr && !$ocr) {
  toastLog('当前版本AutoJS不支持OCR且未安装插件')
  exit()
}

importClass(android.view.View)
if (!requestScreenCapture()) {
  toastLog('请求截图权限失败')
  exit()
}

sleep(1000)
// 识别结果和截图信息
let result = []
let img = null
let running = true
let capturing = true
let usePaddle = true
let displayByLine = true
/**
 * 截图并识别OCR文本信息
 */
function captureAndOcr () {
  capturing = true
  img && img.recycle()
  img = captureScreen()
  if (!img) {
    toastLog('截图失败')
  }
  let start = new Date()
  result = usePaddle ? $ocr.detect(img) : $mlKitOcr.detect(img)
  toastLog((usePaddle ? 'paddle' : 'mlkit') + '耗时' + (new Date() - start) + 'ms')
  capturing = false
}

captureAndOcr()

// 获取状态栏高度
let offset = -getStatusBarHeightCompat()

// 绘制识别结果
let window = floaty.rawWindow(
  <canvas id="canvas" layout_weight="1" />
);

// 设置悬浮窗位置
ui.post(() => {
  window.setPosition(0, offset)
  window.setSize(device.width, device.height)
  window.setTouchable(false)
})

// 操作按钮
let clickButtonWindow = floaty.rawWindow(
  <vertical>
    <button id="captureAndOcr" text="截图识别" />
    <button id="displayToggle" text="按元素显示" />
    <button id="usePaddle" text="切换为ML-KIT" />
    <button id="closeBtn" text="退出" />
  </vertical>
);
ui.run(function () {
  clickButtonWindow.setPosition(device.width / 2 - ~~(clickButtonWindow.getWidth() / 2), device.height * 0.65)
  if ($mlKitOcr && $ocr) {
    console.log('两种方式均支持')
    clickButtonWindow.usePaddle.setVisibility(View.VISIBLE)
  } else {
    console.log('仅仅支持其中一种 paddle:', !!$ocr, ' mlkit:', !!$mlKitOcr)
    clickButtonWindow.usePaddle.setVisibility(View.GONE)
  }
  clickButtonWindow.displayToggle.setVisibility(usePaddle || !$mlKitOcr ? View.GONE : View.VISIBLE)
})

let oldX, oldY
// 点击识别
clickButtonWindow.captureAndOcr.click(function () {
  result = []
  ui.run(function () {
    oldX = clickButtonWindow.getX()
    oldY = clickButtonWindow.getY()
    clickButtonWindow.setPosition(device.width, device.height)
  })
  setTimeout(() => {
    captureAndOcr()
    ui.run(function () {
      clickButtonWindow.setPosition(oldX, oldY)
    })
  }, 500)
})
// 切换显示模式
clickButtonWindow.displayToggle.click(function () {
  displayByLine = !displayByLine
  ui.run(function () {
    clickButtonWindow.displayToggle.setText(displayByLine ? '按元素显示' : '按行显示')
  })
})
// 切换显示模式
clickButtonWindow.usePaddle.click(function () {
  usePaddle = !usePaddle
  ui.run(function () {
    clickButtonWindow.displayToggle.setVisibility(usePaddle || !$mlKitOcr ? View.GONE : View.VISIBLE)
    clickButtonWindow.usePaddle.setText(usePaddle ? '切换为ML-KIT' : '切换为Paddle')
  })
})

// 点击关闭
clickButtonWindow.closeBtn.click(function () {
  exit()
})

let Typeface = android.graphics.Typeface
let paint = new Paint()
paint.setStrokeWidth(1)
paint.setTypeface(Typeface.DEFAULT_BOLD)
paint.setTextAlign(Paint.Align.LEFT)
paint.setAntiAlias(true)
paint.setStrokeJoin(Paint.Join.ROUND)
paint.setDither(true)
window.canvas.on('draw', function (canvas) {
  if (!running || capturing) {
    return
  }
  // 清空内容
  canvas.drawColor(0xFFFFFF, android.graphics.PorterDuff.Mode.CLEAR)
  let displayResult = Object.create(result)
  if (displayResult && displayResult.length > 0) {
    for (let i = 0; i < displayResult.length; i++) {
      let ocrResult = displayResult[i]
      if (usePaddle || !usePaddle && displayByLine) {
        drawRectAndText(ocrResult.label, ocrResult.bounds, '#00ff00', canvas, paint)
      } else if (ocrResult.elements) {
        for (let e = 0; e < ocrResult.elements.length; e++) {
          let element = ocrResult.elements[e]
          drawRectAndText(element.label, element.bounds, '#00ff00', canvas, paint)
        }
      }
    }
  }
})

setInterval(() => { }, 10000)
events.on('exit', () => {
  $mlKitOcr.release()
  // 标记停止 避免canvas导致闪退
  running = false
  // 撤销监听
  window.canvas.removeAllListeners()
  // 回收图片
  img && img.recycle()
})

/**
 * 绘制文本和方框
 *
 * @param {*} desc
 * @param {*} rect
 * @param {*} colorStr
 * @param {*} canvas
 * @param {*} paint
 */
function drawRectAndText (desc, rect, colorStr, canvas, paint) {
  let color = colors.parseColor(colorStr)

  paint.setStrokeWidth(1)
  paint.setStyle(Paint.Style.STROKE)
  // 反色
  paint.setARGB(255, 255 - (color >> 16 & 0xff), 255 - (color >> 8 & 0xff), 255 - (color & 0xff))
  canvas.drawRect(rect, paint)
  paint.setARGB(255, color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff)
  paint.setStrokeWidth(1)
  paint.setTextSize(20)
  paint.setStyle(Paint.Style.FILL)
  canvas.drawText(desc, rect.left, rect.top, paint)
  paint.setTextSize(10)
  paint.setStrokeWidth(1)
  paint.setARGB(255, 0, 0, 0)
}

/**
 * 获取状态栏高度
 *
 * @returns
 */
function getStatusBarHeightCompat () {
  let result = 0
  let resId = context.getResources().getIdentifier("status_bar_height", "dimen", "android")
  if (resId > 0) {
    result = context.getResources().getDimensionPixelOffset(resId)
  }
  if (result <= 0) {
    result = context.getResources().getDimensionPixelOffset(R.dimen.dimen_25dp)
  }
  return result
}




let eventStartX, eventStartY
let windowStartX = clickButtonWindow.getX()
let windowStartY = clickButtonWindow.getY()
let eventKeep = false
let eventMoving = false
let touchDownTime = new Date().getTime()

/**
 * 数组所有值平方和开方 勾股定理计算距离
 * @param {*} dx 
 * @param {*} dy 
 * @returns 
 */
function getDistance (dx, dy) {
  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}

clickButtonWindow.closeBtn.setOnTouchListener(new android.view.View.OnTouchListener((view, event) => {
  try {
    switch (event.getAction()) {
      case event.ACTION_DOWN:
        eventStartX = event.getRawX();
        eventStartY = event.getRawY();
        windowStartX = clickButtonWindow.getX();
        windowStartY = clickButtonWindow.getY();
        eventKeep = true; //按下,开启计时
        touchDownTime = new Date().getTime()
        break;
      case event.ACTION_MOVE:
        var sx = event.getRawX() - eventStartX;
        var sy = event.getRawY() - eventStartY;
        if (!eventMoving && eventKeep && getDistance(sx, sy) >= 10) {
          eventMoving = true;
        };
        if (eventMoving && eventKeep) {
          ui.post(() => {
            clickButtonWindow.setPosition(windowStartX + sx, windowStartY + sy);
          })
        };
        break;
      case event.ACTION_UP:
        if (!eventMoving && eventKeep && touchDownTime > new Date().getTime() - 1000) {
          // 时间短 点击事件
          exit()
        };
        eventKeep = false;
        touchDownTime = 0;
        eventMoving = false;
        break;
    };
  } catch (e) {
    console.error('异常' + e)
  }
  return true;
}))

