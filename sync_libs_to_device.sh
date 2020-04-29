###
 # @Author: TonyJiangWJ
 # @Date: 2020-04-27 10:23:36
 # @Last Modified by: TonyJiangWJ
 # @Last Modified time: 2020-04-29 15:24:41
 # @Description: 同步脚本到设备
 ###
#!/bin/bash

prefix="storage/emulated/0/脚本/"

error() {
  echo "\033[31m $1 \033[0m"
}

deviceId=$(adb devices | grep -v List | awk '{print $1}')
if [ -z "$deviceId" ]; then
  error "no device attached"
  return -1
fi
echo $deviceId


sync_file_to_device() {
  targetJs=$1
  targetDir=$2
  if [ -n "$targetJs" ] && (test -e $targetJs) ; then
    if [ -n "$targetDir" ] ; then
      adb shell test -e ${prefix}$target_dir
      exec_result=$?
      if [ $exec_result == 0 ]; then
        echo "sync '$targetJs' to '${prefix}$targetDir'"
        exec_cmd="adb push $targetJs ${prefix}$targetDir/$targetJs"
        echo "$exec_cmd"
        $exec_cmd
        echo 'done'
      else
        error "targetDir is not exist on device"
      fi
    else
      error "$targetDir is not exists"
    fi
  else
    error "$targetJs is not exists"
  fi
}

# 目标项目文件夹
target_dirs=( 
  "energy_store" 
  "蚂蚁庄园" 
  "Alipay-Credits" 
  "京东签到" 
  "AutoScriptBase" 
)
# 可同步文件
target_files=(
  "lib/prototype/RunningQueueDispatcher.js"
  "lib/prototype/FloatyUtil.js"
  "unit/获取当前页面的布局信息.js"
)

sync_target_js_to_all() {
  target_js_idx=$1
  target_js=${target_files[$target_js_idx]}
  for target_dir in ${target_dirs[@]}; do
    sync_file_to_device $target_js $target_dir
  done
}

sync_all_js_to_all() {
  for target_js in ${target_files[@]}; do
    for target_dir in ${target_dirs[@]}; do
      sync_file_to_device $target_js $target_dir
    done
  done
}

sync_all_to_target_dir() {
  target_dir_idx=$1
  for target_js in ${target_files[@]}; do
    target_dir=${target_dirs[$target_dir_idx]}
    sync_file_to_device $target_js $target_dir
  done
}

# 复制指定文件到所有目标路径
# sync_target_js_to_all 0
# 复制所有文件到所有目标路径
sync_all_to_target_dir 4
# 复制指定文件到指定目录
#sync_file_to_device ${target_files[0]} ${target_dirs[0]}