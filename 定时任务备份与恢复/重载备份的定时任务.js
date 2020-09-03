/*
 * @Author: TonyJiangWJ
 * @Date: 2020-05-18 13:28:10
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-08-27 13:52:52
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
let removeExists = true
if (removeExists) {
  for (let i = 0; i < timedTasks.size(); i++) {
    let task = timedTasks.get(i)
    taskManager[isPro ? 'removeTaskSync' : 'removeTask'](task)
  }
  for (let i = 0; i < intentTasks.size(); i++) {
    let task = intentTasks.get(i)
    taskManager[isPro ? 'removeTaskSync' : 'removeTask'](task)
  }
}

let allTasks = JSON.parse(files.read(files.cwd() + "/tasks.json"))

for (let i = 0; i < allTasks.timedTasks.length; i++) {
  let task = allTasks.timedTasks[i]
  taskManager[isPro ? 'addTaskSync' : 'addTask'](convertTimeTask(task))
}
for (let i = 0; i < allTasks.intentTasks.length; i++) {
  let task = allTasks.intentTasks[i]
  taskManager[isPro ? 'addTaskSync' : 'addTask'](convertIntentTask(task))
}

toast('done!')

//
function convertTimeTask(task) {
  let timedTask = new packageName.timing.TimedTask()
  if (task.scriptPath) {
    timedTask.setTimeFlag(task.timeFlag)
    timedTask.setDelay(task.delay)
    timedTask.setInterval(task.interval)
    timedTask.setLoopTimes(task.loopTimes)
    timedTask.setMillis(task.millis)
    timedTask.setScriptPath(task.scriptPath)
    timedTask.setScheduled(false)
  } else {
    timedTask.setTimeFlag(task.mTimeFlag)
    timedTask.setDelay(task.mDelay)
    timedTask.setInterval(task.mInterval)
    timedTask.setLoopTimes(task.mLoopTimes)
    timedTask.setMillis(task.mMillis)
    timedTask.setScriptPath(task.mScriptPath)
    timedTask.setScheduled(false)
  }
  return timedTask
}

function convertIntentTask(task) {
  let intentTask = new packageName.timing.IntentTask()
  intentTask.setScriptPath(task.mScriptPath)
  intentTask.setAction(task.mAction)
  intentTask.setCategory(task.mCategory)
  intentTask.setDataType(task.mDataType)
  intentTask.setLocal(task.mLocal)
  return intentTask
}