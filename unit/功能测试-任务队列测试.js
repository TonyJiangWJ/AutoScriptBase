/*
 * @Author: TonyJiangWJ
 * @Date: 2020-04-25 13:39:19
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-04-25 15:28:55
 * @Description: 
 */
let runningQueueDispatcher = require('../lib/RunningQueueDispatcher.js')(runtime, this)

runningQueueDispatcher.showDispatchStatus()
runningQueueDispatcher.addRunningTask()
sleep(500)
runningQueueDispatcher.showDispatchStatus()
runningQueueDispatcher.addRunningTask()
sleep(500)
runningQueueDispatcher.showDispatchStatus()
runningQueueDispatcher.removeRunningTask()
sleep(500)
runningQueueDispatcher.showDispatchStatus()
// runningQueueDispatcher.clearAll()

