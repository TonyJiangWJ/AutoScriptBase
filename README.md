
# 简介

- 本项目是用于快速构建AutoJS自动化脚本项目的模板框架
- 目前已实现的功能如下：
  - 图形化配置
  - 多脚本执行调度，防止多个不同脚本抢占前台 `RunningQueueDispatcher`
  - 封装了支持多脚本锁的 `LockableStorage`，阻塞写入并返回写入成功与否，达到锁互斥的目的
  - 封装了基于文本、ID控件正则查找工具 `WidgetUtils`，支持控件等待，批量获取匹配控件等等
  - 日志工具 `LogUtils`，可以保存日志到文件，支持日志级别 error\warn\info\log\debug，不同级别日志控制台中不同颜色显示，且开启日志文件后写入到不同的文件中。
  - 支持 `github release api` 的脚本手动更新功能
  - 支持自动判断Root和无障碍的自动化执行操作 `Automator`
  - 封装了一个文本悬浮窗工具 `FloatyUtil`
  - 支持自动解锁设备，也支持扩展自定义解锁
  - 支持模拟手势自动锁定屏幕，同时支持扩展自定义锁屏代码
  - 支持支付宝手势解锁
  - 支持通过代码添加定时任务 `Timers` 来自作者 [SuperMonster003](https://github.com/SuperMonster003)
  - 支持自动点击授权截图权限 `TryRequestScreenCapture` 来自作者 [SuperMonster003](https://github.com/SuperMonster003)
  - 支持配置信息导入和导出以及配置信息加密
  - 支持通过ADB授权之后自动开启无障碍功能
  - 封装了常用方法 `CommonFunction` 如保存运行时数据，倒计时延迟等等
  - `lib/autojs-tools.dex` 中封装了更新用的一些Java方法，用于优化脚本执行性能，源码见[auto-js-tools](https://github.com/TonyJiangWJ/auto-js-tools)
- 具体使用详见各个js文件中的说明信息

## 目前基于此项目实现的脚本

- [蚂蚁森林脚本传送门](https://github.com/TonyJiangWJ/Ant-Forest)
- [蚂蚁庄园脚本传送门](https://github.com/TonyJiangWJ/Ant-Manor)
- [京东签到脚本传送门](https://github.com/TonyJiangWJ/JingDongBeans)
- [支付宝会员积分签到脚本传送门](https://github.com/TonyJiangWJ/JingDongBeans)

## 开发说明

- 1. 下载本仓库
- 2. 修改config.js中的 `CONFIG_STORAGE_NAME` 和 `PROJECT_NAME`

  ```javascript
    // 不同项目需要设置不同的storageName，不然会导致配置信息混乱
    let CONFIG_STORAGE_NAME = 'autoscript_version'
    let PROJECT_NAME = 'AutoJS 脚手架'
  ```

- 3. 开发一个主业务逻辑代码，替换 `main.js` 中的 `mainLoop()` 方法
  比如创建 `core/MainRunner.js` 内容参考如下

  ```javascript
    function MainRunner() {

      this.exec = function () {
        // 执行主要业务逻辑
      }
    }
    module.exports = new MainRunner()
  ```

  再在 `main.js` 中调用:

  ```javascript
    let mainRunner = require('./core/MainRunner.js')

    //....main.js 中的共有代码可以酌情修改 或者直接不动也可以

    // 开发模式不包裹异常捕捉，方便查看错误信息
    if (config.develop_mode) {
      mainRunner.exec()
    } else {
      try {
        mainRunner.exec()
      } catch (e) {
        commonFunctions.setUpAutoStart(1)
        errorInfo('执行异常, 1分钟后重新开始' + e)
      }
    }

    //....

  ```

## lib下的js说明

- 待补充
