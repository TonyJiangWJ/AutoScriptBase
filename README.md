# 简介

- 本项目是用于快速构建AutoJS自动化脚本项目的模板框架
- 目前已实现的功能如下：
  - 图形化配置，基于Vue开发的可视化界面 `可视化配置`，适合无安卓开发基础的前端人员编写界面
  - 多脚本执行调度，防止多个不同脚本抢占前台 `RunningQueueDispatcher`
  - 封装了支持多脚本锁的 `LockableStorage`，阻塞写入并返回写入成功与否，达到锁互斥的目的
  - 封装了基于文本、ID控件正则查找工具 `WidgetUtils`，支持控件等待，批量获取匹配控件等等
  - 日志工具 `LogUtils`，可以保存日志到文件，支持日志级别 error\warn\info\log\debug，不同级别日志控制台中不同颜色显示，且开启日志文件后写入到不同的文件中。
    - 日志支持同步写入文件和异步写入文件两种方式，写这个仅仅是想要实现双缓冲异步写入这么个东西
    - 异步方式的日志文件不是立马刷新到文件的，在脚本完全执行完毕之后才会完全写入
    - 因此如果需要性能则选择启用异步方式，否则使用同步就行。
  - 日志文件查看工具 `查看日志.js` 可以查看当前脚本执行时所创建的日志信息 用于分析问题
  - 支持 `github release api` 的脚本手动更新功能，支持自动检测更新，如需自动执行更新可以修改相关代码实现
  - 支持自动判断Root和无障碍的自动化执行操作 `Automator`
  - 封装了一个文本悬浮窗工具 `FloatyUtil`
  - 支持自动解锁设备，也支持扩展自定义解锁
  - 支持模拟手势自动锁定屏幕，同时支持扩展自定义锁屏代码
  - 支持支付宝手势解锁
  - 支持通过代码添加定时任务 `Timers` 来自作者 [SuperMonster003](https://github.com/SuperMonster003)
  - 支持自动点击授权截图权限 `TryRequestScreenCapture` 来自作者 [SuperMonster003](https://github.com/SuperMonster003)
  - 支持配置信息导入和导出以及配置信息加密
  - 支持通过ADB授权之后自动开启无障碍功能，具体如何使用ADB请自行Google或Baidu。不同的软件请自行替换包名: Pro版为 `org.autojs.autojspro` 可以通过 `context.getPackageName()` 获取

  ```shell
  adb shell pm grant org.autojs.autojs android.permission.WRITE_SECURE_SETTINGS
  ```

  - [ADB的详细使用介绍](./resources/doc/ADB授权脚本自动开启无障碍权限.md)
  - 封装了常用方法 `CommonFunction` 如保存运行时数据，倒计时延迟等等
  - `lib/autojs-tools.dex` 中封装了更新用的一些Java方法，用于优化脚本执行性能，源码见[auto-js-tools](https://github.com/TonyJiangWJ/auto-js-tools)
  - 执行 `unit/获取当前页面的布局信息.js` 可以查看当前页面中的控件文本以及id信息 方便开发脚本
- 具体使用详见各个js文件中的说明信息

## 目前基于此项目实现的脚本

- [蚂蚁森林脚本传送门](https://github.com/TonyJiangWJ/Ant-Forest)
- [蚂蚁庄园脚本传送门](https://github.com/TonyJiangWJ/Ant-Manor)
- [聚合签到脚本传送门](https://github.com/TonyJiangWJ/Unify-Sign)

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
    let mainExecutor = require('./core/MainExecutor.js')

    //....main.js 中的共有代码可以酌情修改 或者直接不动也可以

    // 开发模式不包裹异常捕捉，方便查看错误信息
    if (config.develop_mode) {
      mainExecutor.exec()
    } else {
      try {
        mainExecutor.exec()
      } catch (e) {
        commonFunctions.setUpAutoStart(1)
        errorInfo('执行异常, 1分钟后重新开始' + e)
        commonFunctions.printExceptionStack(e)
      }
    }

    //....

  ```

- 4. 将修改完成后的代码带文件夹全部放到手机根目录`/脚本/`下 如 `/脚本/AutoScriptBase/`
- 5. 打开AutoJS软件，下拉刷新就能看到`AutoScriptBase`，点击进入然后运行 `main.js` 即可
  - 5.1 脚本执行依赖于无障碍服务，请在自动弹出界面中打开AutoJS的无障碍权限，或者直接通过ADB赋权让脚本自动获取无障碍权限
  - 5.2 另外其他需要的应用权限有 `后台弹出界面` `显示悬浮窗` `修改系统配置（可选）` 等

## 开发辅助

- 在线取色工具：[图片base64取色](https://tonyjiangwj.gitee.io/statics/pic_base64.html)
- 在线多点取色路径生成: [多点取色辅助工具](https://tonyjiangwj.gitee.io/statics/multi_color_assist.html)
- 解锁功能扩展辅助：`unit/获取锁屏界面控件信息.js`
- 图片实时二值化等 `test/visual_test/可视化测试工具.js` 目前只有一个功能，按运行后的提示来操作就行
- 可视化配置工具，基于webvie和vue框架实现，H5内容在vue_configs下，新增配置项可以只修改`vue_configs/js/commponets/configuration.js` 和 `config.js` 两个文件，其他作为公用的可以不关注。如果会vue那么可以随你所想进行修改
- 控件可视化辅助工具 电脑上浏览器打开 控件可视化/index.html 按界面提示操作
- ![96f32786b6142f8bb4e44f7b1706afcb_689323151505_v_1667630351524368_1](https://user-images.githubusercontent.com/11325805/200108292-4097b77b-954f-4739-b80a-b10281d93b8c.gif)

## lib下的js说明

- [WIKI_FOR_LIBS](./resources/doc/WIKI_FOR_LIBS.md)
