function mainLoop () {
  for (let left = 5; left > 0; left--) {
    FloatyInstance.setFloatyInfo({ x: 100, y: config.device_height / 2 }, 'Hello, this will dismiss in ' + left + ' second', { textSize: 20 - left })
    FloatyInstance.setFloatyTextColor(colors.toString(Math.random() * 0xFFFFFF & 0xFFFFFF))
    sleep(1000)
  }
  FloatyInstance.setFloatyInfo({ x: config.device_width / 2, y: config.device_height / 2 }, 'GoodBye')
  FloatyInstance.setFloatyTextColor(colors.toString(Math.random() * 0xFFFFFF & 0xFFFFFF))
  sleep(3000)
}

function testLogs () {
  let length = 1000
  let start = new Date().getTime()
  let thread1 = threads.start(function () {
    let count = 0
    while(count++ < length) {
      logInfo('this is thread 1, count: '+ count)
    }
  })

  let thread2 = threads.start(function () {
    let count = 0
    while(count++ < length) {
      logInfo('this is thread 2, count: '+ count)
    }
  })

  thread1.join()
  thread2.join()
  infoLog(['all threads done! cost: {}ms', new Date().getTime() -  start])

  debugForDev('this is a develop log')
  debugInfo('this is a debug log')
  logInfo('this is a log log')
  infoLog('this is a info log')
  warnInfo('this is a warn log')
  errorInfo('this is a error log')
}
function MainExecutor() {

  this.exec = function () {
    // 执行主要业务逻辑
    // 演示功能，主流程自行封装
    testLogs()
    mainLoop()
  }
}
module.exports = new MainExecutor()