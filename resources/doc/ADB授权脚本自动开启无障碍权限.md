# 关于如何通过ADB授权脚本自动开启无障碍权限

## 什么是ADB

### 谷歌安卓开发官网解释

- Android 调试桥 (adb) 是一种功能多样的命令行工具，可让您与设备进行通信。adb 命令可用于执行各种设备操作（例如安装和调试应用），并提供对 Unix shell（可用来在设备上运行各种命令）的访问权限。它是一种客户端-服务器程序，包括以下三个组件：
  - 客户端：用于发送命令。客户端在开发计算机上运行。您可以通过发出 adb 命令从命令行终端调用客户端。
  - 守护程序 (adbd)：用于在设备上运行命令。守护程序在每个设备上作为后台进程运行。
  - 服务器：用于管理客户端与守护程序之间的通信。服务器在开发机器上作为后台进程运行。
- 更多介绍见[官网](https://developer.android.com/studio/command-line/adb?hl=zh-cn)

### 不管那么多术语

- 简而言之就是一个开发调试工具，在这里我们主要关注它的功能是用来授权

## 如何使用

### 准备工作

- 首先是下载ADB工具，解压到自己电脑上。如果想经常使用ADB可以将它加入到环境变量中，这里不做介绍。
- 下载渠道
  - [官方渠道](https://developer.android.com/studio/releases/platform-tools?hl=zh-cn)
  - [第三方渠道](https://www.androiddevtools.cn/#)
  - [或者百度](https://www.baidu.com/s?ie=UTF-8&wd=ADB%E4%B8%8B%E8%BD%BD)
- 然后手机需要进入开发者模式，并开启USB调试功能
  - 进入**设置-关于手机**-连续点击**版本号**多次（一般是7次，会有提示）开启开发者模式。小米是连续点击**MIUI版本号**。
  - 开启后进入设置-更多设置-开发者选项 找到USB调试，点击开启它，同时有些系统会有子项-USB调试（安全设置）也需要一起开启，否则授权会无效。

### 开始授权操作

- 以上步骤完成后，将手机通过USB连接到电脑上，手机上会弹框提示是否授权USB调试，点击确定即可。
- 打开电脑上的cmd、terminal或者powershell，进入到解压的ADB所在的文件夹，输入adb devices 如果一切正常会显示如下内容

  ```log
    List of devices attached
    d8cfe91f        device
  ```

- 然后输入授权命令即可，'$packageName$' 替换成实际的AutoJS包名

  ```shell
  adb shell pm grant '$packageName$' android.permission.WRITE_SECURE_SETTINGS
  ```

- 输入命令回车，无报错则执行成功，如果要撤销授权，输入如下命令即可

  ```shell
  adb shell pm revoke '$packageName$' android.permission.WRITE_SECURE_SETTINGS
  ```

### 完成授权

- 以后可以直接关闭USB调试和开发者选项，设备重启也不受影响，脚本都能够自动获取无障碍权限
- 是不是很简单~~~~
