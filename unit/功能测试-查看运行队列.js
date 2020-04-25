let singletoneRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let runningQueueDispatcher = singletoneRequire('RunningQueueDispatcher')(runtime, this)

runningQueueDispatcher.showDispatchStatus()

