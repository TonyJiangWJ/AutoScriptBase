let singletoneRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let runningQueueDispatcher = singletoneRequire('RunningQueueDispatcher')

runningQueueDispatcher.showDispatchStatus()
runningQueueDispatcher.clearAll()

