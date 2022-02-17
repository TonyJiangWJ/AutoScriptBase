let { config: _config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunction = singletonRequire('CommonFunction')
// 李跳跳
_config.other_accessisibility_services = 'com.whatsbug.litiaotiao/com.whatsbug.litiaotiao.MyAccessibilityService'
toastLog(commonFunction.getEnabledAccessibilityServices())
commonFunction.disableAccessibilityAndRestart(true)

toastLog(commonFunction.checkAccessibilityService(true))