###
 # @Author: TonyJiangWJ
 # @Date: 2020-04-27 09:15:51
 # @Last Modified by: TonyJiangWJ
 # @Last Modified time: 2020-05-07 11:16:36
 # @Description: 
 ###
#!/bin/bash
## 同步修改的js文件到指定目录

error() {
  echo "\033[31m $1 \033[0m"
}

sync_file() {
  targetJs=$1
  targetDir=$2
  if [ -n "$targetJs" ] && (test -e $targetJs) ; then
    if [ -n "$targetDir" ] && (test -e $targetDir) ; then
      echo "sync '$targetJs' to '$targetDir'"
      exec_cmd="cp $targetJs $targetDir/$targetJs"
      echo "exec '$exec_cmd'"
      $($exec_cmd)
      echo 'done'
    else
      error "$targetDir is not exists"
    fi
  else
    error "$targetJs is not exists"
  fi
}

# 目标项目文件夹
target_dirs=( "../Ant-Forest" "../Ant-Manor" "../Unify-Sign" )
# 可同步文件 目前除了CommonFunction和WidgetUtil有个性化实现外，其他几个都一样
target_files=(
  # "lib/prototype/RunningQueueDispatcher.js"
  # "lib/prototype/FloatyUtil.js"
  # "lib/prototype/Timers.js"
  # "lib/prototype/AlipayUnlocker.js"
  # "lib/prototype/FileUtils.js"
  # "lib/prototype/LockableStorage.js"
  # "lib/prototype/LogUtils.js"
  # "lib/prototype/TryRequestScreenCapture.js"
  # "lib/prototype/Automator.js"
  # "extends/LockScreen-demo.js"
  # "extends/LockScreen.js"
  # "test/TestLockScreen.js"
  # "unit/获取当前页面的布局信息.js"
  # "resources/for_update/autojs-tools.dex"
  # "lib/autojs-tools.dex"
  # "lib/color-region-center.dex"
  # "lib/SingletonRequirer.js"
  # "lib/DateUtil.js"
  # "lib/Unlock.js"
  "lib/BaseCommonFunctions.js"
  "lib/BaseWidgetUtils.js"
)
# 定义target_files下标，mac下的bash无法使用dict 暂时这么写
running_queue_dispatcher=0
floaty_util=1
timers=2
alipay_unlocker=3
file_utils=4
lockable_storage=5
log_utils=6
try_request_screen_capture=7

# 根据target_fiels的数组下标同步指定文件
sync_target_with_idx() {
  target_js_idx=$1
  target_js=${target_files[$target_js_idx]}
  for target_dir in ${target_dirs[@]}; do
    sync_file $target_js $target_dir
  done
}

# 同步所有文件
sync_all_target_files() {
  for target_file in ${target_files[@]}; do
    for target_dir in ${target_dirs[@]}; do
      sync_file $target_file $target_dir
    done
  done
}

# sync_target_with_idx $running_queue_dispatcher

sync_all_target_files
# sync_target_with_idx 
