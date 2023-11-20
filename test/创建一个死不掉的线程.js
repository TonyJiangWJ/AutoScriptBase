/*
 * @Author: TonyJiangWJ
 * @Date: 2020-09-22 21:42:38
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2023-09-07 17:19:48
 * @Description: 这其实是AutoJS 4.1的bug，这种类似的bug存在大量内存泄漏，魔改版本已经修复了这个问题 大约能存活一分钟
 */
new java.lang.Thread(new java.lang.Runnable({
  run: function () {
    // 一小时后停止
    let targetStop = new Date().getTime() + 3600000
    while (new Date().getTime() < targetStop) {
      try {
        console.verbose('我是不死的小强')
        sleep(1000)
      } catch (e) {
        console.error('线程执行异常' + e)
      }
    }
  }
})).start()