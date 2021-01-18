
let { config, storage_name: _storage_name } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let storageFactory = singletonRequire('StorageFactory')
let RUNTIME_STORAGE = _storage_name + "_runtime"

let DISMISS_AWAIT_DIALOG = 'dismissAwaitDialog'
let TIMER_AUTO_START = "timerAutoStart"
let READY = 'ready_engine'

storageFactory.initFactoryByKey(DISMISS_AWAIT_DIALOG, { dismissReason: '' })
storageFactory.initFactoryByKey(TIMER_AUTO_START, { array: [] })
storageFactory.initFactoryByKey(READY, { engineId: -1 })

let storageNames = [
  DISMISS_AWAIT_DIALOG,
  TIMER_AUTO_START,
  READY
]

let storage = storages.create(RUNTIME_STORAGE)
storageNames.forEach(key => {
  console.log(key + ': ' + storage.get(key))
  console.log('storageFactory: ' + JSON.stringify(storageFactory.getValueByKey(key, true)))
  // 清空数据
  // storage.put(key, null)
})

