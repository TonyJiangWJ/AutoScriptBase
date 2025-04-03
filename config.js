/*
 * @Author: TonyJiangWJ
 * @Date: 2019-12-09 20:42:08
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2025-03-28 15:34:15
 * @Description: 
 */
require('./lib/Runtimes.js')(global)
let default_config = {
  github_url: 'https://github.com/TonyJiangWJ/AutoScriptBase',
  // github release url 用于检测更新状态
  github_latest_url: '',
  thread_name_prefix: 'autoscript_',
}
// 不同项目需要设置不同的storageName，不然会导致配置信息混乱
let CONFIG_STORAGE_NAME = 'autoscript_version'
let PROJECT_NAME = 'AutoJS 脚手架'
// 公共扩展
let config = require('./config_ex.js')(default_config, CONFIG_STORAGE_NAME, PROJECT_NAME)

config.exportIfNeeded(module, null)