/*
 * @Author: TonyJiangWJ
 * @Date: 2020-04-25 13:39:19
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-04-25 15:31:13
 * @Description: 
 */
let runningQueueDispatcher = require('../../lib/RunningQueueDispatcher.js')(runtime, this)
let commonFunctions = require('../../lib/CommonFunction.js')(runtime, this)

runningQueueDispatcher.addRunningTask()
runningQueueDispatcher.showDispatchStatus()
log('task2 start')
let count = 15
while (count-- > 0) {
  let content = 'Task2 Running count:' + count
  commonFunctions.showMiniFloaty(content, 500 - count * 10, 600 - count * 10, '#ff0000')
  sleep(1000)
}
log('task2 end')
runningQueueDispatcher.showDispatchStatus()
runningQueueDispatcher.removeRunningTask()