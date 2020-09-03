/*
 * @Author: TonyJiangWJ
 * @Date: 2020-08-27 13:53:34
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-08-27 13:54:21
 * @Description: 
 */
let packageName = context.getPackageName() === 'org.autojs.autojsm' ? org.autojs.autojsm : org.autojs.autojs
let isPro = context.getPackageName() === 'org.autojs.autojspro'
let TimedTaskManager = packageName.timing.TimedTaskManager
if (isPro) {
  packageName = com.stardust.autojs.core
  TimedTaskManager = packageName.timing.TimedTaskManager.Companion
}
let timedTasks = TimedTaskManager.getInstance().getAllTasksAsList()
let intentTasks = TimedTaskManager.getInstance().getAllIntentTasksAsList()
log('exist timedTasks: ' + JSON.stringify(timedTasks))
log('exist intentTasks: ' + JSON.stringify(intentTasks))

let taskManager = TimedTaskManager.getInstance()
for (let i = 0; i < timedTasks.size(); i++) {
  let task = timedTasks.get(i)
  taskManager[isPro ? 'removeTaskSync' : 'removeTask'](task)
}
for (let i = 0; i < intentTasks.size(); i++) {
  let task = intentTasks.get(i)
  taskManager[isPro ? 'removeTaskSync' : 'removeTask'](task)
}
toastLog('done!')