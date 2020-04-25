/*
 * @Author: TonyJiangWJ
 * @Date: 2020-04-23 23:33:09
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-04-25 15:28:23
 * @Description: 
 */
let lockableStorages = require('../lib/LockableStorage.js')(runtime, this)
let runningQueueDispatcher = require('../lib/RunningQueueDispatcher.js')(runtime, this)

let storge = lockableStorages.create('test_storage')
log(storge.put('yes', 'yesyes'))
log(storge.get('yes'))
runningQueueDispatcher.addRunningTask()
runningQueueDispatcher.removeRunningTask()
log('调用次数：' + lockableStorages.requireCount)
