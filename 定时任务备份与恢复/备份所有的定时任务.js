/*
 * @Author: TonyJiangWJ
 * @Date: 2020-05-18 13:28:10
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2025-01-03 14:14:33
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

log('timedTasks: ' + JSON.stringify(timedTasks))
log('intentTasks: ' + JSON.stringify(intentTasks))
let tasks = {
  timedTasks: timedTasks,
  intentTasks: intentTasks
}

files.write(files.cwd() + "/tasks.json", JSON.stringify(tasks))
toast('done!')