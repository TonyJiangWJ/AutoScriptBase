/*
 * @Author: TonyJiangWJ
 * @Date: 2019-12-09 20:42:08
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-09-22 21:22:27
 * @Description: 
 */
'ui';

let currentEngine = engines.myEngine().getSource() + ''
let isRunningMode = currentEngine.endsWith('/config.js') && typeof module === 'undefined'
let is_pro = Object.prototype.toString.call(com.stardust.autojs.core.timing.TimedTask.Companion).match(/Java(Class|Object)/)
let default_config = {
  password: '',
  is_alipay_locked: false,
  alipay_lock_password: '',
  timeout_unlock: 1000,
  timeout_findOne: 1000,
  timeout_existing: 8000,
  // 异步等待截图，当截图超时后重新获取截图 默认开启
  async_waiting_capture: true,
  capture_waiting_time: 500,
  show_debug_log: true,
  show_engine_id: false,
  develop_mode: false,
  auto_lock: false,
  lock_x: 150,
  lock_y: 970,
  // 锁屏启动关闭提示框
  dismiss_dialog_if_locked: true,
  request_capture_permission: true,
  // 是否保存日志文件，如果设置为保存，则日志文件会按时间分片备份在logback/文件夹下
  save_log_file: true,
  async_save_log_file: true,
  back_size: '100',
  // 通话状态监听
  enable_call_state_control: false,
  // 单脚本模式 是否只运行一个脚本 不会同时使用其他的 开启单脚本模式 会取消任务队列的功能。
  // 比如同时使用蚂蚁庄园 则保持默认 false 否则设置为true 无视其他运行中的脚本
  single_script: false,
  // 是否使用模拟的滑动，如果滑动有问题开启这个 当前默认关闭 经常有人手机上有虚拟按键 然后又不看文档注释的
  useCustomScrollDown: true,
  // 排行榜列表下滑速度 200毫秒 不要太低否则滑动不生效 仅仅针对useCustomScrollDown=true的情况
  scrollDownSpeed: 200,
  bottomHeight: 200,
  
  // 延迟启动时延 5秒 悬浮窗中进行的倒计时时间
  delayStartTime: 5,
  device_width: device.width,
  device_height: device.height,
  // 是否是AutoJS Pro  需要屏蔽部分功能，暂时无法实现：生命周期监听等 包括通话监听
  is_pro: is_pro,
  auto_set_bang_offset: true,
  bang_offset: 0
}
// 不同项目需要设置不同的storageName，不然会导致配置信息混乱
let CONFIG_STORAGE_NAME = 'autoscript_version'
let PROJECT_NAME = 'AutoJS 脚手架'
let config = {}
let storageConfig = storages.create(CONFIG_STORAGE_NAME)
Object.keys(default_config).forEach(key => {
  let storedVal = storageConfig.get(key)
  if (typeof storedVal !== 'undefined') {
    config[key] = storedVal
  } else {
    config[key] = default_config[key]
  }
})


if (!isRunningMode) {
  if (config.device_height <= 10 || config.device_width <= 10) {
    if (!currentEngine.endsWith('/config.js')) {
      toastLog('请先运行config.js并输入设备宽高')
      exit()
    }
  }
  module.exports = function (__runtime__, scope) {
    if (typeof scope.config_instance === 'undefined') {
      scope.config_instance = {
        config: config,
        default_config: default_config,
        storage_name: CONFIG_STORAGE_NAME,
        project_name: PROJECT_NAME
      }
    }
    return scope.config_instance
  }
} else {


  importClass(android.text.TextWatcher)
  importClass(android.widget.AdapterView)
  importClass(android.view.View)
  importClass(android.view.MotionEvent)
  importClass(java.util.concurrent.LinkedBlockingQueue)
  importClass(java.util.concurrent.ThreadPoolExecutor)
  importClass(java.util.concurrent.TimeUnit)
  let loadingDialog = null

  let _hasRootPermission = files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su")
  
  let AesUtil = require('./lib/AesUtil.js')
  
  let setScrollDownUiVal = function () {

    ui.delayStartTimeInpt.text(config.delayStartTime + '')


    ui.useCustomScrollDownChkBox.setChecked(config.useCustomScrollDown)
    ui.scrollDownContainer.setVisibility(config.useCustomScrollDown ? View.VISIBLE : View.INVISIBLE)
    ui.bottomHeightContainer.setVisibility(config.useCustomScrollDown ? View.VISIBLE : View.GONE)
    ui.scrollDownSpeedInpt.text(config.scrollDownSpeed + '')
    ui.bottomHeightInpt.text(config.bottomHeight + '')

  }


  let inputDeviceSize = function () {
    return Promise.resolve().then(() => {
      return dialogs.rawInput('请输入设备宽度：', config.device_width + '')
    }).then(x => {
      if (x) {
        let xVal = parseInt(x)
        if (isFinite(xVal) && xVal > 0) {
          config.device_width = xVal
        } else {
          toast('输入值无效')
        }
      }
    }).then(() => {
      return dialogs.rawInput('请输入设备高度：', config.device_height + '')
    }).then(y => {
      if (y) {
        let yVal = parseInt(y)
        if (isFinite(yVal) && yVal > 0) {
          config.device_height = yVal
        } else {
          toast('输入值无效')
        }
      }
    })
  }

  let setDeviceSizeText = function () {
    ui.deviceSizeText.text(config.device_width + 'px ' + config.device_height + 'px')
  }

  let resetUiValues = function () {
    config.device_width = config.device_width > 0 ? config.device_width : 1
    config.device_height = config.device_height > 0 ? config.device_height : 1
    
    // 基本配置
    ui.password.text(config.password + '')
    ui.alipayLockPasswordInpt.text(config.alipay_lock_password + '')
    ui.isAlipayLockedChkBox.setChecked(config.is_alipay_locked)
    ui.alipayLockPasswordContainer.setVisibility(config.is_alipay_locked ? View.VISIBLE : View.GONE)


    ui.showDebugLogChkBox.setChecked(config.show_debug_log)
    ui.saveLogFileChkBox.setChecked(config.save_log_file)
    ui.asyncSaveLogFileChkBox.setChecked(config.async_save_log_file)
    ui.fileSizeInpt.text(config.back_size + '')
    ui.fileSizeContainer.setVisibility(config.save_log_file ? View.VISIBLE : View.GONE)
    ui.asyncSaveLogFileChkBox.setVisibility(config.save_log_file ? View.VISIBLE : View.GONE)
    ui.showEngineIdChkBox.setChecked(config.show_engine_id)
    ui.developModeChkBox.setChecked(config.develop_mode)    
    ui.requestCapturePermissionChkBox.setChecked(config.request_capture_permission)
    
    ui.lockX.text(config.lock_x + '')
    ui.lockXSeekBar.setProgress(parseInt(config.lock_x / config.device_width * 100))
    ui.lockY.text(config.lock_y + '')
    ui.lockYSeekBar.setProgress(parseInt(config.lock_y / config.device_height * 100))
    ui.autoLockChkBox.setChecked(config.auto_lock)
    ui.lockPositionContainer.setVisibility(config.auto_lock && !_hasRootPermission ? View.VISIBLE : View.INVISIBLE)
    ui.lockDescNoRoot.setVisibility(!_hasRootPermission ? View.VISIBLE : View.INVISIBLE)
    
    ui.dismissDialogIfLockedChkBox.setChecked(config.dismiss_dialog_if_locked)
    ui.enableCallStateControlChkBox.setChecked(config.enable_call_state_control)

    ui.timeoutUnlockInpt.text(config.timeout_unlock + '')
    ui.timeoutFindOneInpt.text(config.timeout_findOne + '')
    ui.timeoutExistingInpt.text(config.timeout_existing + '')
    ui.captureWaitingTimeInpt.text(config.capture_waiting_time + '')
    ui.asyncWaitingCaptureChkBox.setChecked(config.async_waiting_capture)
    ui.asyncWaitingCaptureContainer.setVisibility(config.async_waiting_capture ? View.VISIBLE : View.GONE)
    // 进阶配置
    ui.singleScriptChkBox.setChecked(config.single_script)
    setScrollDownUiVal()
    
    setDeviceSizeText()
  }

  threads.start(function () {
    loadingDialog = dialogs.build({
      title: "加载中...",
      progress: {
        max: -1
      },
      cancelable: false
    }).show()
    setTimeout(function () {
      loadingDialog.dismiss()
    }, 3000)
  })

  let TextWatcherBuilder = function (textCallback) {
    return new TextWatcher({
      onTextChanged: (text) => {
        textCallback(text + '')
      },
      beforeTextChanged: function (s) { }
      ,
      afterTextChanged: function (s) { }
    })
  }

  let SpinnerItemSelectedListenerBuilder = function (selectedCallback) {
    return new AdapterView.OnItemSelectedListener({
      onItemSelected: function (parentView, selectedItemView, position, id) {
        selectedCallback(position)
      },
      onNothingSelected: function (parentView) {}
    })
  }

  setTimeout(function () {
    let start = new Date().getTime()
    ui.layout(

      <drawer>
        <vertical>
          <appbar>
            <toolbar id="toolbar" title="运行配置" />
            <tabs id="tabs" />
          </appbar>
          <viewpager id="viewpager">
            <frame>
              <ScrollView>
                <vertical padding="24 0">
                  {/* 锁屏密码 */}
                  <horizontal gravity="center">
                    <text text="锁屏密码：" />
                    <input id="password" inputType="textPassword" layout_weight="80" />
                  </horizontal>
                  <checkbox id="isAlipayLockedChkBox" text="支付宝是否锁定" />
                  <horizontal gravity="center" id="alipayLockPasswordContainer">
                    <text text="支付宝手势密码对应的九宫格数字：" textSize="10sp" />
                    <input id="alipayLockPasswordInpt" inputType="textPassword" layout_weight="80" />
                  </horizontal>
                  <horizontal w="*" h="1sp" bg="#cccccc" margin="5 5"></horizontal>
                  <horizontal gravity="center">
                    <text text="设备宽高：" textColor="black" textSize="16sp" />
                    <text id="deviceSizeText" text="" />
                    <button id="changeDeviceSizeBtn" >修改</button>
                  </horizontal>
                  <horizontal w="*" h="1sp" bg="#cccccc" margin="5 5"></horizontal>
                  <text text="刘海屏或者挖孔屏悬浮窗显示位置和实际目测位置不同，需要施加一个偏移量一般是负值，脚本运行时会自动设置：" textSize="12sp" margin="10 5"/>
                  <horizontal padding="10 10" gravity="center">
                    <text text="当前自动设置的刘海偏移量为：" textSize="12sp" layout_weight="60" />
                    <text id="bangOffsetText" textSize="12sp" layout_weight="40" />
                  </horizontal>
                  <horizontal w="*" h="1sp" bg="#cccccc" margin="5 5"></horizontal>
                  {/* 脚本延迟启动 */}
                  <horizontal gravity="center">
                    <text text="延迟启动时间（秒）:" />
                    <input layout_weight="70" inputType="number" id="delayStartTimeInpt" layout_weight="70" />
                  </horizontal>
                  {/* 是否显示debug日志 */}
                  <checkbox id="showDebugLogChkBox" text="是否显示debug日志" />
                  <checkbox id="showEngineIdChkBox" text="是否在控制台中显示脚本引擎id" />
                  <checkbox id="developModeChkBox" text="是否启用开发模式" />
                  <checkbox id="saveLogFileChkBox" text="是否保存日志到文件" />
                  <checkbox id="asyncSaveLogFileChkBox" text="异步保存日志到文件" />
                  <horizontal padding="10 0" id="fileSizeContainer" gravity="center" layout_weight="75">
                    <text text="文件滚动大小：" layout_weight="20" />
                    <input id="fileSizeInpt" textSize="14sp" layout_weight="80" />
                    <text text="kb" />
                  </horizontal>
                  {/* 是否自动点击授权录屏权限 */}
                  <checkbox id="requestCapturePermissionChkBox" text="是否需要自动授权截图权限" />
                  <horizontal w="*" h="1sp" bg="#cccccc" margin="5 0"></horizontal>
                  {/* 收集一轮后自动锁屏 */}
                  <vertical id="lockDescNoRoot">
                    <text text="锁屏功能仅限于下拉状态栏中有锁屏按钮的情况下可用" textSize="12sp" />
                    <text text="实在想用可以自行修改Automator中的lockScreen方法" textSize="12sp" />
                  </vertical>
                  <horizontal gravity="center">
                    <checkbox id="autoLockChkBox" text="是否自动锁屏" />
                    <vertical padding="10 0" id="lockPositionContainer" gravity="center" layout_weight="75">
                      <horizontal margin="10 0" gravity="center">
                        <text text="x:" />
                        <seekbar id="lockXSeekBar" progress="20" layout_weight="80" />
                        <text id="lockX" />
                      </horizontal>
                      <horizontal margin="10 0" gravity="center">
                        <text text="y:" />
                        <seekbar id="lockYSeekBar" progress="20" layout_weight="80" />
                        <text id="lockY" />
                      </horizontal>
                      <button id="showLockPointConfig" >手动输入坐标</button>
                    </vertical>
                  </horizontal>
                  {/* 是否锁屏启动关闭弹框提示 */}
                  <checkbox id="dismissDialogIfLockedChkBox" text="锁屏启动关闭弹框提示" />
                  <text text="通话状态监听需要授予AutoJS软件获取通话状态的权限" textSize="12sp" />
                  <checkbox id="enableCallStateControlChkBox" text="是否在通话时停止脚本" />
                  {/* 基本不需要修改的 */}
                  <horizontal w="*" h="1sp" bg="#cccccc" margin="5 0"></horizontal>
                  <horizontal gravity="center">
                    <text text="解锁超时（ms）:" />
                    <input id="timeoutUnlockInpt" inputType="number" layout_weight="60" />
                  </horizontal>
                  <horizontal gravity="center">
                    <text text="查找控件超时（ms）:" />
                    <input id="timeoutFindOneInpt" inputType="number" layout_weight="60" />
                  </horizontal>
                  <horizontal gravity="center">
                    <text text="校验控件是否存在超时（ms）:" />
                    <input id="timeoutExistingInpt" inputType="number" layout_weight="60" />
                  </horizontal>
                  <text text="偶尔通过captureScreen获取截图需要等待很久，或者一直阻塞无法进行下一步操作，建议开启异步等待，然后设置截图等待时间(默认500ms,需自行调试找到合适自己设备的数值)。失败多次后脚本会自动重启，重新获取截图权限" textSize="10dp" />
                  <checkbox id="asyncWaitingCaptureChkBox" text="是否异步等待截图" />
                  <horizontal gravity="center" id="asyncWaitingCaptureContainer">
                    <text text="获取截图等待时间（ms）:" />
                    <input id="captureWaitingTimeInpt" inputType="number" layout_weight="60" />
                  </horizontal>
                </vertical>
              </ScrollView>
            </frame >
            <frame>
              <ScrollView id="parentScrollView2">
                <vertical padding="24 12">
                  {/* 单脚本使用，无视多任务队列 */}
                  <text text="当需要使用多个脚本时不要勾选（如同时使用我写的蚂蚁庄园脚本），避免抢占前台" textSize="9sp" />
                  <checkbox id="singleScriptChkBox" text="是否单脚本运行" />
                  

                  {/* 使用模拟手势来实现上下滑动 */}
                  <horizontal gravity="center">
                    <checkbox id="useCustomScrollDownChkBox" text="是否启用模拟滑动" layout_weight="40" />
                    <horizontal layout_weight="60" id="scrollDownContainer">
                      <text text="滑动速度（ms）" />
                      <input layout_weight="70" inputType="number" id="scrollDownSpeedInpt" />
                    </horizontal>
                  </horizontal>
                  {/* 虚拟按键高度 */}
                  <horizontal gravity="center" id="bottomHeightContainer">
                    <text text="模拟滑动距离底部的高度，默认200即可" />
                    <input layout_weight="70" inputType="number" id="bottomHeightInpt" />
                  </horizontal>
                  <horizontal w="*" h="1sp" bg="#cccccc" margin="5 0"></horizontal>
                </vertical>
              </ScrollView>
            </frame>
            <frame>
              <ScrollView>
                <vertical padding="12 24">
                  
                </vertical>
              </ScrollView>
            </frame>
          </viewpager>
        </vertical>
      </drawer>
    )

    // 创建选项菜单(右上角)
    ui.emitter.on("create_options_menu", menu => {
      menu.add("全部重置为默认")
      menu.add("从配置文件导入")
      menu.add("导出到配置文件")
    })
    // 监听选项菜单点击
    ui.emitter.on("options_item_selected", (e, item) => {
      let local_config_path = files.cwd() + '/local_config.cfg'
      let runtime_store_path = files.cwd() + '/runtime_store.cfg'
      let aesKey = device.getAndroidId()
      switch (item.getTitle()) {
        case "全部重置为默认":
          confirm('确定要将所有配置重置为默认值吗？').then(ok => {
            if (ok) {
              Object.keys(default_config).forEach(key => {
                let defaultValue = default_config[key]
                config[key] = defaultValue
                storageConfig.put(key, defaultValue)
              })
              log('重置默认值')
              resetUiValues()
            }
          })
          break
        case "从配置文件导入":
          confirm('确定要从local_config.cfg中读取配置吗？').then(ok => {
            if (ok) {
              try {
                if (files.exists(local_config_path)) {
                  let refillConfigs = function (configStr) {
                    let local_config = JSON.parse(configStr)
                    Object.keys(default_config).forEach(key => {
                      let defaultValue = local_config[key]
                      if (typeof defaultValue === 'undefined') {
                        defaultValue = default_config[key]
                      }
                      config[key] = defaultValue
                      storageConfig.put(key, defaultValue)
                    })
                    resetUiValues()
                  }
                  let configStr = AesUtil.decrypt(files.read(local_config_path), aesKey)
                  if (!configStr) {
                    toastLog('local_config.cfg解密失败, 请尝试输入秘钥')
                    dialogs.rawInput('请输入秘钥，可通过device.getAndroidId()获取')
                      .then(key => {
                        if (key) {
                          key = key.trim()
                          configStr = AesUtil.decrypt(files.read(local_config_path), key)
                          if (configStr) {
                            refillConfigs(configStr)
                          } else {
                            toastLog('秘钥不正确，无法解析')
                          }
                        }
                      })
                  } else {
                    refillConfigs(configStr)
                  }
                } else {
                  toastLog('local_config.cfg不存在无法导入')
                }
              } catch (e) {
                toastLog(e)
              }
            }
          })
          break
        case "导出到配置文件":
          confirm('确定要将配置导出到local_config.cfg吗？此操作会覆盖已有的local_config数据').then(ok => {
            if (ok) {
              Object.keys(default_config).forEach(key => {
                console.verbose(key + ': ' + config[key])
              })
              try {
                let configString = AesUtil.encrypt(JSON.stringify(config), aesKey)
                files.write(local_config_path, configString)
                toastLog('配置信息导出成功，刷新目录即可，local_config.cfg内容已加密仅本机可用，除非告知秘钥')
              } catch (e) {
                toastLog(e)
              }

            }
          })
          break
      }
      e.consumed = true
    })
    activity.setSupportActionBar(ui.toolbar)

    ui.viewpager.setTitles(['基本配置', '进阶配置', '控件文本配置'])
    ui.tabs.setupWithViewPager(ui.viewpager)
    if (config.device_height <= 10 || config.device_width <= 10) {
      inputDeviceSize().then(() => resetUiValues())
    } else {
      resetUiValues()
    }
    

    ui.changeDeviceSizeBtn.on('click', () => {
      inputDeviceSize().then(() => setDeviceSizeText())
    })

    

    ui.showDebugLogChkBox.on('click', () => {
      config.show_debug_log = ui.showDebugLogChkBox.isChecked()
    })

    ui.showEngineIdChkBox.on('click', () => {
      config.show_engine_id = ui.showEngineIdChkBox.isChecked()
    })

    ui.developModeChkBox.on('click', () => {
      config.develop_mode = ui.developModeChkBox.isChecked()
    })

    ui.saveLogFileChkBox.on('click', () => {
      config.save_log_file = ui.saveLogFileChkBox.isChecked()
      ui.fileSizeContainer.setVisibility(config.save_log_file ? View.VISIBLE : View.GONE)
      ui.asyncSaveLogFileChkBox.setVisibility(config.save_log_file ? View.VISIBLE : View.GONE)
    })

    ui.asyncSaveLogFileChkBox.on('click', () => {
      config.async_save_log_file = ui.asyncSaveLogFileChkBox.isChecked()
    })

    ui.requestCapturePermissionChkBox.on('click', () => {
      config.request_capture_permission = ui.requestCapturePermissionChkBox.isChecked()
    })

    ui.dismissDialogIfLockedChkBox.on('click', () => {
      config.dismiss_dialog_if_locked = ui.dismissDialogIfLockedChkBox.isChecked()
    })

    ui.enableCallStateControlChkBox.on('click', () => {
      config.enable_call_state_control = ui.enableCallStateControlChkBox.isChecked()
    })

    ui.asyncWaitingCaptureChkBox.on('click', () => {
      config.async_waiting_capture = ui.asyncWaitingCaptureChkBox.isChecked()
      ui.asyncWaitingCaptureContainer.setVisibility(config.async_waiting_capture ? View.VISIBLE : View.GONE)
    })

    ui.autoLockChkBox.on('click', () => {
      let checked = ui.autoLockChkBox.isChecked()
      config.auto_lock = checked
      ui.lockPositionContainer.setVisibility(checked && !_hasRootPermission ? View.VISIBLE : View.INVISIBLE)
    })

    ui.lockXSeekBar.on('touch', () => {
      let precent = ui.lockXSeekBar.getProgress()
      let trueVal = parseInt(precent * config.device_width / 100)
      ui.lockX.text('' + trueVal)
      config.lock_x = trueVal
    })

    ui.lockYSeekBar.on('touch', () => {
      let precent = ui.lockYSeekBar.getProgress()
      let trueVal = parseInt(precent * config.device_height / 100)
      ui.lockY.text('' + trueVal)
      config.lock_y = trueVal
    })

    ui.showLockPointConfig.on('click', () => {
      Promise.resolve().then(() => {
        return dialogs.rawInput('请输入X坐标：', config.lock_x + '')
      }).then(x => {
        if (x) {
          let xVal = parseInt(x)
          if (isFinite(xVal)) {
            config.lock_x = xVal
          } else {
            toast('输入值无效')
          }
        }
      }).then(() => {
        return dialogs.rawInput('请输入Y坐标：', config.lock_y + '')
      }).then(y => {
        if (y) {
          let yVal = parseInt(y)
          if (isFinite(yVal)) {
            config.lock_y = yVal
          } else {
            toast('输入值无效')
          }
        }
      }).then(() => {
        ui.lockX.text(config.lock_x + '')
        ui.lockXSeekBar.setProgress(parseInt(config.lock_x / config.device_width * 100))
        ui.lockY.text(config.lock_y + '')
        ui.lockYSeekBar.setProgress(parseInt(config.lock_y / config.device_height * 100))
      })
    })

    ui.password.addTextChangedListener(
      TextWatcherBuilder(text => { config.password = text + '' })
    )

    ui.alipayLockPasswordInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.alipay_lock_password = text + '' })
    )

    ui.isAlipayLockedChkBox.on('click', () => {
      config.is_alipay_locked = ui.isAlipayLockedChkBox.isChecked()
      ui.alipayLockPasswordContainer.setVisibility(config.is_alipay_locked ? View.VISIBLE : View.GONE)
    })


    ui.timeoutUnlockInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.timeout_unlock = parseInt(text) })
    )

    ui.timeoutFindOneInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.timeout_findOne = parseInt(text) })
    )

    ui.timeoutExistingInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.timeout_existing = parseInt(text) })
    )

    ui.captureWaitingTimeInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.capture_waiting_time = parseInt(text) })
    )

    ui.fileSizeInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.back_size = parseInt(text) })
    )

    // 进阶配置
    ui.singleScriptChkBox.on('click', () => {
      config.single_script = ui.singleScriptChkBox.isChecked()
    })
    ui.scrollDownSpeedInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.scrollDownSpeed = parseInt(text) })
    )

    ui.useCustomScrollDownChkBox.on('click', () => {
      config.useCustomScrollDown = ui.useCustomScrollDownChkBox.isChecked()
      ui.scrollDownContainer.setVisibility(config.useCustomScrollDown ? View.VISIBLE : View.INVISIBLE)
      ui.bottomHeightContainer.setVisibility(config.useCustomScrollDown ? View.VISIBLE : View.GONE)
    })

    ui.bottomHeightInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.bottomHeight = parseInt(text) })
    )

    ui.delayStartTimeInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.delayStartTime = parseInt(text) })
    )
    
    console.verbose('界面初始化耗时' + (new Date().getTime() - start) + 'ms')
    setTimeout(function () {
      if (loadingDialog !== null) {
        loadingDialog.dismiss()
      }
    }, 500)
  }, 500)

  ui.emitter.on('pause', () => {
    Object.keys(default_config).forEach(key => {
      let newVal = config[key]
      if (typeof newVal !== 'undefined') {
        storageConfig.put(key, newVal)
      } else {
        storageConfig.put(key, default_config[key])
      }
    })
  })
}
