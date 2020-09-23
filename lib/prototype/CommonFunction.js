/*
 * @Author: TonyJiangWJ
 * @Date: 2020-04-25 20:16:09
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-09-23 23:57:25
 * @Description: 通用工具
 */
importClass(android.content.Context)
importClass(android.provider.Settings)
importClass(java.io.StringWriter)
importClass(java.io.StringReader)
importClass(java.io.PrintWriter)
importClass(java.io.BufferedReader)
importClass(java.lang.StringBuilder)

let { config: _config, storage_name: _storage_name, project_name } = require('../../config.js')(runtime, this)
let singletonRequire = require('../SingletonRequirer.js')(runtime, this)
let Timers = singletonRequire('Timers')
let _runningQueueDispatcher = singletonRequire('RunningQueueDispatcher')
let _FloatyInstance = singletonRequire('FloatyUtil')
let automator = singletonRequire('Automator')
let FileUtils = singletonRequire('FileUtils')
let _logUtils = singletonRequire('LogUtils')
let formatDate = require('../DateUtil.js')
let RUNTIME_STORAGE = _storage_name + "_runtime"
let DISMISS_AWAIT_DIALOG = 'dismissAwaitDialog'
let TIMER_AUTO_START = "timerAutoStart"

let lifecycleDeamonThreadPool = null
let lifecycleCallbacks = []
if (!_config.is_pro) {
  importClass(com.stardust.autojs.ScriptEngineService)
  importClass(com.stardust.autojs.engine.ScriptEngineManager)
} else {
  _config.isRunning = true
  importClass(java.util.concurrent.LinkedBlockingQueue)
  importClass(java.util.concurrent.ThreadPoolExecutor)
  importClass(java.util.concurrent.TimeUnit)
  importClass(java.util.concurrent.ThreadFactory)
  importClass(java.util.concurrent.Executors)
  let ENGINE_ID = engines.myEngine().id
  // Pro版因为无法注册脚本生命周期回调，创建一个单独的线程来监听当前脚本是否已经执行完毕
  lifecycleDeamonThreadPool = new ThreadPoolExecutor(1, 1, 60, TimeUnit.SECONDS, new LinkedBlockingQueue(10), new ThreadFactory({
    newThread: function (runnable) {
      let thread = Executors.defaultThreadFactory().newThread(runnable)
      thread.setName(ENGINE_ID + '-lifecycle-deamon-' + thread.getName())
      return thread
    }
  }))
  lifecycleDeamonThreadPool.execute(function () {
    let count = 0
    while (_config.isRunning) {
      // 每五秒检测一次isRunning
      sleep(5000)
      if (count++ % 5) {
        // 每25秒执行一次，其实在LogUtils中已经有了校验，这里增加判断，冗余一下
        let currentEngine = engines.all().filter(engine => engine.id === ENGINE_ID)
        _config.isRunning = currentEngine && currentEngine.length > 0
      }
    }
    console.verbose('脚本已经中止执行，执行生命周期回调')
    // 脚本已经结束，执行callbacks
    if (lifecycleCallbacks && lifecycleCallbacks.length > 0) {
      lifecycleCallbacks.forEach(callback => {
        callback()
      })
    }
    // 新建线程 关闭线程池
    new Thread(new java.lang.Runnable({
      run: function () {
        try {
          lifecycleDeamonThreadPool.shutdown()
          let flag = lifecycleDeamonThreadPool.awaitTermination(5, java.util.concurrent.TimeUnit.SECONDS)
          console.verbose('lifecycleDeamon线程池关闭：' + flag)
        } catch (e) {
          console.error('关闭lifecycleDeamon线程池异常:' + e)
        } finally {
          lifecycleDeamonThreadPool = null
        }
      }
    })).start()
  })
}

function CommonFunctions () {

  /**
   * 自动设置刘海的偏移量
   */
  this.autoSetUpBangOffset = function () {
    if (_config.auto_set_bang_offset || _config.updated_temp_flag_1325) {
      let DETECT_COLOR = '#10FF1F'
      let window = floaty.rawWindow(
        <frame id="container" gravity="center" bg="#10FF1F">
          <horizontal margin="10 0" gravity="center">
            <text id="text" text="TEXT FLOATY" textSize="10sp" />
          </horizontal>
        </frame>
      )
      window.setPosition(100, 0)
      // 等待悬浮窗初始化
      sleep(300)
      let offset = null
      let limit = 10
      while (!offset && offset !== 0 && limit-- > 0) {
        let screen = this.checkCaptureScreenPermission()
        if (screen) {
          let point = images.findColor(screen, DETECT_COLOR, { region: [80, 0, 100, 300], threshold: 1 })
          if (point && images.detectsColor(screen, DETECT_COLOR, point.x + 20, point.y) && images.detectsColor(screen, DETECT_COLOR, point.x + 30, point.y)) {
            offset = point.y
            ui.run(function () {
              window.text.setText('刘海偏移量为：' + offset + ' 自动关闭悬浮窗')
            })
            _logUtils.debugInfo(['自动设置刘海偏移量为：{}', offset])
            sleep(500)
            debugInfo('关闭悬浮窗')
            window.close()
            let configStorage = storages.create(_storage_name)
            // 设为负值
            _config.bang_offset = -offset
            configStorage.put('bang_offset', _config.bang_offset)
            configStorage.put('auto_set_bang_offset', false)
            configStorage.put('updated_temp_flag_1325', false)
          } else {
            sleep(100)
          }
        }
      }
      if (limit <= 0) {
        _logUtils.warnInfo('无法自动检测刘海高度，请确认是否开启了深色模式？')
      }
    }
  }

  /**
   * 脚本引擎退出成功后回调，将callback从生命周期回调中移除
   * 
   * @param {Object} callback 待移除的callback对象
   * @param {String} desc 过程描述
   */
  this.removeCallback = function(callback, desc) {
    let removeThreads = new java.lang.Thread(new java.lang.Runnable({
      run: function () {
        // 避免并发修改异常
        _logUtils.debugForDev(['unregisterEngineLifecycleCallback {}', desc])
        try {
          ScriptEngineService.getInstance().unregisterEngineLifecycleCallback(callback)
        } catch (e) {
          _logUtils.errorInfo(['{} 移除异常：' + e, desc])
        }
        _logUtils.debugForDev(['unregisterEngineLifecycleCallback {} done', desc])
      }
    }))
    let start = new Date().getTime()
    try {
      removeThreads.start()
    } catch (e) {
      _logUtils.errorInfo(['{} fucked', desc])
    }
    _logUtils.debugForDev(['{} cost: {}ms', desc, new Date().getTime() -  start])
  }

  /**
   * 注册生命周期回调，在退出时执行func
   * @param {function} func 回调方法
   * @param {String} desc 过程描述
   */
  this.registerOnEngineRemoved = function (func, desc) {
    desc = desc || 'common func'
    if (!_config.is_pro) {
      // 监听运行周期，脚本结束后执行 func
      let engineService = ScriptEngineService.getInstance()
      let _this = this
      let myEngineId = engines.myEngine().id
      engineService.registerEngineLifecycleCallback(
        new ScriptEngineManager.EngineLifecycleCallback({
          onEngineCreate: function (engine) {
          },
          onEngineRemove: function (engine) {
            if (engine.id === myEngineId) {
              func()
              // 回调成功后将当前callback注销
              _this.removeCallback(this, desc)
            }
          }
        })
      )
    } else {
      // _logUtils.errorInfo('Pro版暂无法实现生命周期监听，请尽量使用免费版！')
      lifecycleCallbacks.push(func)
    }
  }

  /**
   * 校验是否已经拥有无障碍权限 没有自动获取 前提是获取了adb权限
   * 原作者：MrChen 原始代码来自Pro商店
   * adb授权方法：开启usb调试并使用adb工具连接手机，执行 adb shell pm grant org.autojs.autojspro android.permission.WRITE_SECURE_SETTINGS
   * 取消授权 adb shell pm revoke org.autojs.autojspro android.permission.WRITE_SECURE_SETTINGS
   * 其中免费版包名为 org.autojs.autojs
   * @param {boolean} force 是否强制启用
   */
  this.checkAccessibilityService = function (force) {
    let packageName = this.getAutoJsPackage()
    let requiredService = packageName + '/com.stardust.autojs.core.accessibility.AccessibilityService'
    try {
      let enabledServices = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
      _logUtils.debugInfo(['当前已启用无障碍功能的服务:{}', enabledServices])
      var service = null
      if (enabledServices.indexOf(requiredService) < 0) {
        service = enabledServices + ':' + requiredService
      } else if (force) {
        // 如果强制开启
        service = enabledServices
      }
      if (service) {
        Settings.Secure.putString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES, service)
        Settings.Secure.putString(context.getContentResolver(), Settings.Secure.ACCESSIBILITY_ENABLED, '1')
        _logUtils.infoLog('成功开启AutoJS的辅助服务', true)
      }

      return true
    } catch (e) {
      this.printExceptionStack(e)
      _logUtils.warnInfo('\n请确保已给予 WRITE_SECURE_SETTINGS 权限\n\n授权代码已复制，请使用adb工具连接手机执行(重启不失效)\n\n', true)
      let shellScript = 'adb shell pm grant ' + packageName + ' android.permission.WRITE_SECURE_SETTINGS'
      _logUtils.warnInfo('adb 脚本 已复制到剪切板：[' + shellScript + ']')
      setClip(shellScript)
      return false
    }
  }

  /**
   * 校验截图权限，权限失效则重新启动，根据参数释放任务队列
   * @param {number} errorLimit 失败尝试次数
   * @param {boolean} releaseLock 是否在失败后释放任务队列
   */
  this.checkCaptureScreenPermission = function (errorLimit, releaseLock) {
    let screen = null
    let start = new Date().getTime()
    if (!_config.async_waiting_capture) {
      debugInfo('同步获取截图')
      screen = captureScreen()
    } else {
      errorLimit = errorLimit || 3
      // 获取截图 用于判断是否可收取
      let errorCount = 0
      do {
        let waitResult = this.waitFor(function () {
          let max_try = 10
          while (!screen && max_try-- > 0) {
            screen = captureScreen()
          }
        }, _config.capture_waiting_time || 500)
        if (!screen) {
          _logUtils.warnInfo([
            '获取截图失败 {} {} count:{}',
            !waitResult ? '等待截图超时' + ((errorCount++ == errorLimit - 1) ? ', 建议将获取截图超时时间加长' : '') : '获取截图为NULL',
            errorCount < errorLimit ? '再试一次' : '',
            errorCount
          ])
        }
      } while (!screen && errorCount < errorLimit)
      if (!screen) {
        _logUtils.errorInfo(['获取截图失败多次[{}], 可能已经没有了截图权限，重新执行脚本', errorCount], true)
        automator.back()
        if (releaseLock) {
          _runningQueueDispatcher.removeRunningTask(true)
        } else {
          // 用于取消下一次运行的dialog
          this.getAndUpdateDismissReason('capture-screen-error')
        }
        _runningQueueDispatcher.executeTargetScript(FileUtils.getRealMainScriptPath())
        exit()
      }
    }
    _logUtils.debugInfo(['获取截图耗时：{}ms', new Date().getTime() - start])
    return screen
  }

  this.getAutoJsPackage = function () {
    return context.getPackageName()
  }

  this.getAndUpdateDismissReason = function (newVal) {
    let storedDismissDialogInfo = this.getTodaysRuntimeStorage(DISMISS_AWAIT_DIALOG)
    let oldVal = storedDismissDialogInfo.dismissReason
    storedDismissDialogInfo.dismissReason = newVal
    this.updateRuntimeStorage(DISMISS_AWAIT_DIALOG, storedDismissDialogInfo)
    return oldVal
  }

  /**
   * 启动package
   * @param packageName 需要启动的package名称
   */
  this.launchPackage = function (packageName, reopen) {
    _logUtils.debugInfo(['准备{}打开package: {}', reopen ? '重新' : '', packageName])
    let currentRunning = currentPackage()
    app.launchPackage(packageName)
    sleep(1000)
    currentRunning = currentPackage()
    let waitCount = 3
    while (currentRunning !== packageName && waitCount-- > 0) {
      _logUtils.debugInfo(['未进入{}，继续等待 当前所在：{}', packageName, currentRunning])
      sleep(1000)
      currentRunning = currentPackage()
    }
    _logUtils.debugInfo(['进入[{}] {}', packageName, (packageName === currentRunning ? '成功' : '失败')])
  }

  this.minimize = function () {
    _logUtils.debugInfo(['直接返回最小化'])
    try {
      let maxRepeat = 10
      while (maxRepeat-- > 0 && (automator.clickBack() || automator.clickClose())) {
        sleep(500)
      }
    } catch (e) {
      errorInfo('尝试返回失败' + e)
      this.printExceptionStack(e)
    }
    back()
  }


  /**
   * @param checkDismissReason 是否校验跳过弹窗
   */
  this.showDialogAndWait = function (checkDismissReason) {
    // 显示悬浮窗之前关闭按键监听，避免操作不当导致界面卡死
    events.removeAllKeyDownListeners('volume_down')
    if (checkDismissReason) {
      let dismissReason = this.getAndUpdateDismissReason('')
      if (dismissReason) {
        _logUtils.debugInfo(['不再展示延迟对话框，{}', dismissReason])
        return
      }
    }

    let continueRunning = true
    let terminate = false
    let showDialog = true
    let lock = threads.lock()
    let complete = lock.newCondition()
    let that = this
    lock.lock()
    threads.start(function () {

      let sleepCount = _config.delayStartTime || 5
      let confirmDialog = dialogs.build({
        title: '即将开始' + project_name,
        content: '将在' + sleepCount + '秒内开始',
        positive: '立即开始',
        positiveColor: '#f9a01c',
        negative: '终止',
        negativeColor: 'red',
        neutral: '延迟五分钟',
        cancelable: false
      })
        .on('positive', () => {
          lock.lock()
          complete.signal()
          lock.unlock()
          showDialog = false
          confirmDialog.dismiss()
        })
        .on('negative', () => {
          continueRunning = false
          terminate = true
          lock.lock()
          complete.signal()
          lock.unlock()
          showDialog = false
          confirmDialog.dismiss()
        })
        .on('neutral', () => {
          continueRunning = false
          lock.lock()
          complete.signal()
          lock.unlock()
          showDialog = false
          confirmDialog.dismiss()
        })
        .show()
      _logUtils.debugInfo(['isShowing：{} isCanceled: {}', confirmDialog.isShowing(), confirmDialog.isCancelled()])
      // 注册当脚本中断时隐藏弹出框
      that.registerOnEngineRemoved(function () {
        _logUtils.infoLog('生命周期结束，准备关闭弹窗')
        if (confirmDialog) {
          confirmDialog.dismiss()
        }
      })
      while (sleepCount-- > 0 && showDialog) {
        sleep(1000)
        confirmDialog.setContent('将在' + sleepCount + '秒内开始')
      }
      confirmDialog.setContent('即将开始')
      sleep(500)
      lock.lock()
      complete.signal()
      lock.unlock()
      confirmDialog.dismiss()
    })
    complete.await()
    lock.unlock()
    if (terminate) {
      _logUtils.warnInfo('中止执行')
      if (_config.auto_set_brightness) {
        device.setBrightnessMode(1)
      }
      this.cancelAllTimedTasks()
      _runningQueueDispatcher.removeRunningTask()
      exit()
    }
    if (continueRunning) {
      _logUtils.logInfo('立即开始')
    } else {
      _logUtils.logInfo('延迟五分钟后开始')
      if (_config.auto_set_brightness) {
        device.setBrightnessMode(1)
      }
      this.setUpAutoStart(5)
      _runningQueueDispatcher.removeRunningTask()
      exit()
    }
  }

  /**
   * 关闭悬浮窗并将floatyWindow置为空，在下一次显示时重新新建悬浮窗 因为close之后的无法再次显示
   */
  this.closeFloatyWindow = function () {
    _FloatyInstance.close()
  }

  this.showMiniFloaty = function (text, x, y, color) {
    _FloatyInstance.setFloatyInfo(
      { x: x || _config.min_floaty_x || 150, y: y || _config.min_floaty_y || 20 },
      text,
      { textSize: _config.min_floaty_text_size || 8 }
    )
    _FloatyInstance.setFloatyTextColor(color || _config.min_floaty_color || '#00FF00')
  }

  /**
   * 显示悬浮窗 根据配置自动显示mini悬浮窗和可关闭悬浮窗，目前来说不推荐使用可关闭悬浮窗
   * @param text {String} 悬浮窗文字内容
   */
  this.showTextFloaty = function (text) {
    this.showMiniFloaty(text)
  }

  /**
   * 监听音量下键延迟执行
   **/
  this.listenDelayStart = function () {
    let _this = this
    threads.start(function () {
      _logUtils.infoLog('即将开始，按音量下键延迟五分钟执行', true)
      sleep(2000)
      _logUtils.debugInfo('after setMaxListeners')
      events.observeKey()
      _logUtils.debugInfo('after observeKey')
      events.onceKeyDown('volume_down', function (event) {
        if (_config.auto_set_brightness) {
          device.setBrightnessMode(1)
        }
        _logUtils.warnInfo('延迟五分钟后启动脚本', true)
        _this.setUpAutoStart(5)
        engines.myEngine().forceStop()
        _runningQueueDispatcher.removeRunningTask()
        events.removeAllListeners()
        events.recycle()
        exit()
      })
      _logUtils.debugInfo('after setOnceKeyDown')
    })
  }

  this.commonDelay = function (minutes, text) {
    _logUtils.debugInfo('倒计时' + minutes)
    if (typeof text === 'undefined' || text === '') {
      text = '距离下次运行还有['
    }

    minutes = typeof minutes != null ? minutes : 0
    if (minutes === 0) {
      return
    }
    let startTime = new Date().getTime()
    let timestampGap = minutes * 60000
    let i = 0
    let delayLogStampPoint = -1
    let delayLogGap = 0
    let showSeconds = false
    for (; ;) {
      let now = new Date().getTime()
      if (now - startTime > timestampGap) {
        break
      }
      i = (now - startTime) / 60000
      let left = minutes - i
      if (!showSeconds) {
        delayLogGap = i - delayLogStampPoint
        // 半分钟打印一次日志
        if (delayLogGap >= 0.5) {
          delayLogStampPoint = i
          let content = this.formatString('{}{}]分', text, left.toFixed(2))
          this.showTextFloaty(content)
          _logUtils.debugInfo(content)
        }
        // 剩余一分钟时显示为秒
        if (showSeconds === false && left <= 1) {
          this.listenDelayStart()
          showSeconds = true
        }
        sleep(500)
      } else {
        let content = this.formatString('{}{}]秒', text, (left * 60).toFixed(0))
        this.showTextFloaty(content)
        sleep(1000)
      }
    }
  }

  /**
   * 根据传入key创建当日缓存
   */
  this.createTargetStore = function (key, today) {
    if (key === DISMISS_AWAIT_DIALOG) {
      return this.createDismissAwaitDialogStore(today)
    }
  }

  this.createDismissAwaitDialogStore = function (today) {
    let initStore = {
      dismissReason: '',
      date: today
    }
    let runtimeStorages = storages.create(RUNTIME_STORAGE)
    runtimeStorages.put(DISMISS_AWAIT_DIALOG, JSON.stringify(initStore))
    return initStore
  }

  /**
   * 获取当天的缓存信息，不存在时创建一个初始值
   * @param key {String} key名称
   */
  this.getTodaysRuntimeStorage = function (key) {
    let today = formatDate(new Date(), 'yyyy-MM-dd')
    let runtimeStorages = storages.create(RUNTIME_STORAGE)
    let existStoreObjStr = runtimeStorages.get(key)
    if (existStoreObjStr) {
      try {
        let existStoreObj = JSON.parse(existStoreObjStr)
        if (existStoreObj.date === today) {
          return existStoreObj
        }
      } catch (e) {
        _logUtils.debugInfo(["解析JSON数据失败, key:{} value:{} error:{}", key, existStoreObjStr, e])
      }
    }

    let newStore = this.createTargetStore(key, today)
    return newStore
  }

  /**
   * 通用更新缓存方法
   * @param key {String} key值名称
   * @param valObj {Object} 存值对象
   */
  this.updateRuntimeStorage = function (key, valObj) {
    let runtimeStorages = storages.create(RUNTIME_STORAGE)
    runtimeStorages.put(key, JSON.stringify(valObj))
  }

  this.parseToZero = function (value) {
    return (!value || isNaN(value)) ? 0 : parseInt(value)
  }


  this.isEmpty = function (val) {
    return val === null || typeof val === 'undefined' || val === ''
  }

  this.isEmptyArray = function (array) {
    return array === null || typeof array === 'undefined' || array.length === 0
  }

  this.isNotEmpty = function (val) {
    return !this.isEmpty(val) && !this.isEmptyArray(val)
  }

  this.addOpenPlacehold = function (content) {
    content = "<<<<<<<" + (content || "") + ">>>>>>>"
    _logUtils.appendLog(content)
    console.verbose(content)
  }

  this.addClosePlacehold = function (content) {
    content = ">>>>>>>" + (content || "") + "<<<<<<<"
    _logUtils.appendLog(content)
    console.verbose(content)
  }

  /**
   * @deprecated: see RunningQueueDispatcher$addRunningTask
   * 校验是否重复运行 如果重复运行则关闭当前脚本
   */
  this.checkDuplicateRunning = function () {
    let currentEngine = engines.myEngine()
    let runningEngines = engines.all()
    let runningSize = runningEngines.length
    let currentSource = currentEngine.getSource() + ''
    _logUtils.debugInfo('当前脚本信息 id:' + currentEngine.id + ' source:' + currentSource + ' 运行中脚本数量：' + runningSize)
    if (runningSize > 1) {
      runningEngines.forEach(engine => {
        let compareEngine = engine
        let compareSource = compareEngine.getSource() + ''
        _logUtils.debugInfo('对比脚本信息 id:' + compareEngine.id + ' source:' + compareSource)
        if (currentEngine.id !== compareEngine.id && compareSource === currentSource) {
          _logUtils.warnInfo('脚本正在运行中 退出当前脚本：' + currentSource, true)
          _runningQueueDispatcher.removeRunningTask(true)
          engines.myEngine().forceStop()
          exit()
        }
      })
    }
  }

  /**
   * 关闭运行中的脚本 关闭全部同源脚本
   */
  this.killRunningScript = function () {
    let runningEngines = engines.all()
    let runningSize = runningEngines.length
    let mainScriptJs = FileUtils.getRealMainScriptPath()
    if (runningSize > 1) {
      runningEngines.forEach(engine => {
        let compareEngine = engine
        let compareSource = compareEngine.getSource() + ''
        _logUtils.debugInfo('对比脚本信息 id:' + compareEngine.id + ' source:' + compareSource)
        if (compareSource === mainScriptJs) {
          _logUtils.warnInfo(['关闭运行中脚本：id[{}]', compareEngine.id], true)
          engine.forceStop()
        }
      })
    }
  }

  /**
   * 杀死重复运行的同源脚本
   */
  this.killDuplicateScript = function () {
    let currentEngine = engines.myEngine()
    let runningEngines = null
    while (runningEngines === null) {
      // engines.all()有并发问题，尝试多次获取
      try {
        runningEngines = engines.all()
      } catch (e) {
        sleep(200)
      }
    }
    let runningSize = runningEngines.length
    let currentSource = currentEngine.getSource() + ''
    _logUtils.debugInfo('当前脚本信息 id:' + currentEngine.id + ' source:' + currentSource + ' 运行中脚本数量：' + runningSize)
    if (runningSize > 1) {
      runningEngines.forEach(engine => {
        let compareEngine = engine
        let compareSource = compareEngine.getSource() + ''
        _logUtils.debugInfo('对比脚本信息 id:' + compareEngine.id + ' source:' + compareSource)
        if (currentEngine.id !== compareEngine.id && compareSource === currentSource) {
          _logUtils.warnInfo(['currentId：{} 退出运行中的同源脚本id：{}', currentEngine.id, compareEngine.id])
          // 直接关闭同源的脚本，暂时可以无视锁的存在
          engine.forceStop()
        }
      })
    }
  }

  /**
   * 设置指定时间后自动启动main脚本
   */
  this.setUpAutoStart = function (minutes) {
    // 先移除所有已设置的定时任务
    this.cancelAllTimedTasks()
    let mainScriptJs = FileUtils.getRealMainScriptPath()
    let millis = new Date().getTime() + minutes * 60 * 1000
    _logUtils.infoLog('预订[' + minutes + ']分钟后的任务，时间戳:' + millis)
    // 预定一个{minutes}分钟后的任务
    let task = Timers.addDisposableTask({
      path: mainScriptJs,
      date: millis
    })
    _logUtils.debugInfo("定时任务预定成功: " + task.id)
    this.recordTimedTask(task)
  }

  this.recordTimedTask = function (task) {
    let runtimeStorage = storages.create(RUNTIME_STORAGE)
    let autoStartListStr = runtimeStorage.get(TIMER_AUTO_START)
    let array = []
    if (autoStartListStr) {
      array = JSON.parse(autoStartListStr)
    }
    array.push(task)
    runtimeStorage.put(TIMER_AUTO_START, JSON.stringify(array))
  }

  this.showAllAutoTimedTask = function () {
    let runtimeStorage = storages.create(RUNTIME_STORAGE)
    let autoStartListStr = runtimeStorage.get(TIMER_AUTO_START)
    if (autoStartListStr) {
      let array = JSON.parse(autoStartListStr)
      if (array && array.length > 0) {
        array.forEach(task => {
          _logUtils.logInfo([
            '定时任务 mId: {} 目标执行时间: {} 剩余时间: {}秒',
            task.mId, formatDate(new Date(task.mMillis), 'yyyy-MM-dd HH:mm:ss'), ((task.mMillis - new Date().getTime()) / 1000.0).toFixed(0)
          ])
        })
      }
    } else {
      _logUtils.logInfo('当前没有自动设置的定时任务')
    }
  }

  this.cancelAllTimedTasks = function () {
    let runtimeStorage = storages.create(RUNTIME_STORAGE)
    let autoStartListStr = runtimeStorage.get(TIMER_AUTO_START)
    if (autoStartListStr) {
      let array = JSON.parse(autoStartListStr)
      if (array && array.length > 0) {
        array.forEach(task => {
          _logUtils.debugInfo('撤销自动任务：' + JSON.stringify(task))
          if (task.mId) {
            Timers.removeTimedTask(task.mId)
          }
        })
      }
    }
    // 将task队列置为空
    runtimeStorage.put(TIMER_AUTO_START, '')
  }

  /**
   * 杀死当前APP 仅适用于MIUI10+ 全面屏手势操作
   */
  this.killCurrentApp = function () {
    recents()
    sleep(1000)
    gesture(320, [240, 1000], [800, 1000])
  }

  this.waitFor = function (action, timeout) {
    let countDown = new java.util.concurrent.CountDownLatch(1)
    let actionSuccess = false
    let actionThread = null
    let that = this
    try {
      let start = new Date().getTime()
      actionThread = threads.start(function () {
        try {
          action()
          actionSuccess = true
        } catch (e) {
          _logUtils.warnInfo('action执行异常' + e)
          that.printExceptionStack(e)
        } finally {
          countDown.countDown()
        }
        _logUtils.debugInfo(['action执行结束: {} 耗时：{}ms', actionSuccess, new Date().getTime() - start])
      })
      let waitResult = countDown.await(timeout, java.util.concurrent.TimeUnit.MILLISECONDS)
      _logUtils.debugForDev(['waitFor方法执行完毕，action result: {}, wait result: {} cost time: {}ms', actionSuccess, waitResult, new Date().getTime() - start])
      if (!waitResult) {
        _logUtils.warnInfo(['等待操作超时, 操作时间: {}ms', new Date().getTime() - start])
      }
    } catch (e) {
      this.printExceptionStack(e)
    } finally {
      if (actionThread !== null) {
        actionThread.interrupt()
      }
    }
    return actionSuccess
  }

  this.createQueue = function (size) {
    let queue = []
    for (let i = 0; i < size; i++) {
      queue.push(i)
    }
    return queue
  }

  this.getQueueDistinctSize = function (queue) {
    return queue.reduce((a, b) => {
      if (a.indexOf(b) < 0) {
        a.push(b)
      }
      return a
    }, []).length
  }

  this.pushQueue = function (queue, size, val) {
    if (queue.length >= size) {
      queue.shift()
    }
    queue.push(val)
  }

  /**
  * eg. params '参数名：{} 参数内容：{}', name, value
  *     result '参数名：name 参数内容：value'
  * 格式化字符串，定位符{}
  */
  this.formatString = function () {
    let originContent = []
    for (let arg in arguments) {
      originContent.push(arguments[arg])
    }
    if (originContent.length === 1) {
      return originContent[0]
    }
    let marker = originContent[0]
    let args = originContent.slice(1)
    let regex = /(\{\})/g
    let matchResult = marker.match(regex)
    if (matchResult && args && matchResult.length > 0 && matchResult.length === args.length) {
      args.forEach((item, idx) => {
        marker = marker.replace('{}', item)
      })
      return marker
    } else {
      console.error('参数数量不匹配' + arguments)
      return arguments
    }
  }

  this.printExceptionStack = function (e) {
    if (e) {
      _logUtils.errorInfo(['fileName:{} line:{} typeof e:{}', e.fileName, e.lineNumber, typeof e])
      let throwable = null
      if (e.javaException) {
        throwable = e.javaException
      } else if (e.rhinoException) {
        throwable = e.rhinoException
      }
      if (throwable) {
        let scriptTrace = new StringBuilder(e.message == null ? '' : e.message + '\n');
        let stringWriter = new StringWriter()
        let writer = new PrintWriter(stringWriter)
        throwable.printStackTrace(writer)
        writer.close()
        let bufferedReader = new BufferedReader(new StringReader(stringWriter.toString()))
        let line
        while ((line = bufferedReader.readLine()) != null) {
          scriptTrace.append("\n").append(line)
        }
        _logUtils.errorInfo(scriptTrace.toString())
      } else {
        let funcs = Object.getOwnPropertyNames(e)
        for (let idx in funcs) {
          let func_name = funcs[idx]
          console.verbose(func_name)
        }

      }
    }
  }
}

module.exports = new CommonFunctions()