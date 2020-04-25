/*
 * @Author: TonyJiangWJ
 * @Date: 2019-11-05 09:12:00
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-04-25 16:24:29
 * @Description: 
 */

module.exports = function (__runtime__, scope) {
  if (typeof scope.WidgetUtils === 'undefined') {

    let { config: _config } = require('../config.js')(__runtime__, scope)
    let logLibExists = files.exists(pwd + '/lib/LogUtils.js')
    let {
      debugInfo, debugForDev, logInfo, infoLog, warnInfo, errorInfo, clearLogFile, appendLog, removeOldLogFiles
    } = logLibExists ? require(pwd + '/lib/LogUtils.js')(__runtime__, scope) : {
      logInfo: (str) => {
        console.log(str)
      },
      warnInfo: (str) => {
        console.warn(str)
      },
      debugInfo: (str) => {
        console.verbose(str)
      },
      infoLog: (str) => {
        console.info(str)
      },
      errorInfo: (str) => {
        console.error(str)
      },
      debugForDev: (str) => {
        console.verbose(str)
      }
    }
    /**
     * 校验控件是否存在，并打印相应日志
     * @param {String} contentVal 控件文本
     * @param {String} position 日志内容 当前所在位置是否成功进入
     * @param {Number} timeoutSetting 超时时间 默认为_config.timeout_existing
     */
    const widgetWaiting = function (contentVal, position, timeoutSetting) {
      let waitingSuccess = widgetCheck(contentVal, timeoutSetting)
      position = position || contentVal
      if (waitingSuccess) {
        debugInfo('等待控件成功：' + position)
        return true
      } else {
        errorInfo('等待控件[' + position + ']失败, 查找内容：' + contentVal)
        return false
      }
    }

    /**
     * 校验控件是否存在
     * @param {String} contentVal 控件文本
     * @param {Number} timeoutSetting 超时时间 不设置则为_config.timeout_existing
     * 超时返回false
     */
    const widgetCheck = function (contentVal, timeoutSetting) {
      let timeout = timeoutSetting || _config.timeout_existing
      let timeoutFlag = true
      let countDown = new java.util.concurrent.CountDownLatch(1)
      let matchRegex = new RegExp(contentVal)
      let descThread = threads.start(function () {
        descMatches(matchRegex).waitFor()
        let res = descMatches(matchRegex).findOne().desc()
        debugInfo('find desc ' + contentVal + " " + res)
        timeoutFlag = false
        countDown.countDown()
      })

      let textThread = threads.start(function () {
        textMatches(matchRegex).waitFor()
        let res = textMatches(matchRegex).findOne().text()
        debugInfo('find text ' + contentVal + "  " + res)
        timeoutFlag = false
        countDown.countDown()
      })

      let timeoutThread = threads.start(function () {
        sleep(timeout)
        countDown.countDown()
      })
      countDown.await()
      descThread.interrupt()
      textThread.interrupt()
      timeoutThread.interrupt()
      return !timeoutFlag
    }

    /**
     * id检测
     * @param {string|RegExp} idRegex 
     * @param {number} timeoutSetting 
     */
    const idCheck = function (idRegex, timeoutSetting) {
      let timeout = timeoutSetting || _config.timeout_existing
      let timeoutFlag = true
      let countDown = new java.util.concurrent.CountDownLatch(1)
      let idCheckThread = threads.start(function () {
        idMatches(idRegex).waitFor()
        debugInfo('find id ' + idRegex)
        timeoutFlag = false
        countDown.countDown()
      })

      let timeoutThread = threads.start(function () {
        sleep(timeout)
        countDown.countDown()
      })
      countDown.await()
      idCheckThread.interrupt()
      timeoutThread.interrupt()
      if (timeoutFlag) {
        warnInfo(['未能找到id:{}对应的控件', idRegex])
      }
      return !timeoutFlag
    }

    /**
     * 校验控件是否存在，并打印相应日志
     * @param {String} idRegex 控件文本
     * @param {String} position 日志内容 当前所在位置是否成功进入
     * @param {Number} timeoutSetting 超时时间 默认为_config.timeout_existing
     */
    const idWaiting = function (idRegex, position, timeoutSetting) {
      let waitingSuccess = idCheck(idRegex, timeoutSetting)
      position = position || idRegex
      if (waitingSuccess) {
        debugInfo('等待控件成功：' + position)
        return true
      } else {
        errorInfo('等待控件' + position + '失败， id：' + idRegex)
        return false
      }
    }

    /**
     * 根据id获取控件信息
     * @param {String|RegExp} idRegex id
     * @param {number} timeout 超时时间
     * @return 返回找到的控件，否则null
     */
    const widgetGetById = function (idRegex, timeout) {
      timeout = timeout || _config.timeout_findOne
      let target = null
      if (idCheck(idRegex, timeout)) {
        idRegex = new RegExp(idRegex)
        target = idMatches(idRegex).findOne(timeout)
      }
      return target
    }

    /**
     * 根据内容获取一个对象
     * 
     * @param {string} contentVal 
     * @param {number} timeout 
     * @param {boolean} containType 是否带回类型
     * @param {boolean} suspendWarning 是否隐藏warning信息
     */
    const widgetGetOne = function (contentVal, timeout, containType, suspendWarning) {
      let target = null
      let isDesc = false
      let waitTime = timeout || _config.timeout_findOne
      let timeoutFlag = true
      let matchRegex = new RegExp(contentVal)
      if (textMatches(matchRegex).exists()) {
        debugInfo('text ' + contentVal + ' found')
        target = textMatches(matchRegex).findOne(waitTime)
        timeoutFlag = false
      } else if (descMatches(matchRegex).exists()) {
        isDesc = true
        debugInfo('desc ' + contentVal + ' found')
        target = descMatches(matchRegex).findOne(waitTime)
        timeoutFlag = false
      } else {
        debugInfo('none of text or desc found for ' + contentVal)
      }
      // 当需要带回类型时返回对象 传递target以及是否是desc
      if (target && containType) {
        let result = {
          target: target,
          isDesc: isDesc
        }
        return result
      }
      if (timeoutFlag) {
        if (suspendWarning) {
          debugInfo('timeout for finding ' + contentVal)
        } else {
          warnInfo('timeout for finding ' + contentVal)
        }
      }
      return target
    }

    /**
     * 根据内容获取所有对象的列表
     * 
     * @param {string} contentVal 
     * @param {number} timeout 
     * @param {boolean} containType 是否传递类型
     */
    const widgetGetAll = function (contentVal, timeout, containType) {
      let target = null
      let isDesc = false
      let timeoutFlag = true
      let countDown = new java.util.concurrent.CountDownLatch(1)
      let waitTime = timeout || _config.timeout_findOne
      let matchRegex = new RegExp(contentVal)
      let findThread = threads.start(function () {
        if (textMatches(matchRegex).exists()) {
          debugInfo('text ' + contentVal + ' found')
          target = textMatches(matchRegex).untilFind()
          timeoutFlag = false
        } else if (descMatches(matchRegex).exists()) {
          isDesc = true
          debugInfo('desc ' + contentVal + ' found')
          target = descMatches(matchRegex).untilFind()
          timeoutFlag = false
        } else {
          debugInfo('none of text or desc found for ' + contentVal)
        }
        countDown.countDown()
      })
      let timeoutThread = threads.start(function () {
        sleep(waitTime)
        countDown.countDown()
        warnInfo('timeout for finding ' + contentVal)
      })
      countDown.await()
      findThread.interrupt()
      timeoutThread.interrupt()
      if (timeoutFlag && !target) {
        return null
      } else if (target && containType) {
        let result = {
          target: target,
          isDesc: isDesc
        }
        return result
      }
      return target
    }

    scope.WidgetUtils = {
      widgetWaiting: widgetWaiting,
      widgetCheck: widgetCheck,
      idWaiting: idWaiting,
      idCheck: idCheck,
      widgetGetOne: widgetGetOne,
      widgetGetAll: widgetGetAll,
      widgetGetById: widgetGetById
    }
  }
  return scope.WidgetUtils
}