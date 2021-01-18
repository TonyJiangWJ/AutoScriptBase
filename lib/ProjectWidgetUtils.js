let { config: _config, storage_name: _storage_name } = require('../config.js')(runtime, this)
let singletonRequire = require('./SingletonRequirer.js')(runtime, this)
let {
  debugInfo, debugForDev, logInfo, infoLog, warnInfo, errorInfo
} = singletonRequire('LogUtils')
let _commonFunctions = singletonRequire('CommonFunction')

let _BaseWidgetUtils = require('./BaseWidgetUtils.js')

const ProjectWidgetUtils = function () {
  _BaseWidgetUtils.call(this)
  // 自定义的控件操作写在此处

}
ProjectWidgetUtils.prototype = Object.create(_BaseWidgetUtils.prototype)
ProjectWidgetUtils.prototype.constructor = ProjectWidgetUtils

module.exports = ProjectWidgetUtils