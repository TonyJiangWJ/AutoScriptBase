/**
 * @Author: SilvMonFr.00 https://github.com/SuperMonster003
 * Just an insurance way of images.requestScreenCapture() to avoid infinite stuck or stalled without any hint or log
 * During this operation, permission prompt window will be confirmed (with checkbox checked if possible) automatically with effort
 * @param [params] {object}
 * @param [params.debug_info_flag] {boolean}
 * @param [params.restart_this_engine_flag=false] {boolean}
 * @param [params.restart_this_engine_params] {object}
 * @param [params.restart_this_engine_params.new_file] {string} - new engine task name with or without path or file extension name
 * <br>
 *     -- *DEFAULT* - old engine task <br>
 *     -- new file - like "hello.js", "../hello.js" or "hello"
 * @param [params.restart_this_engine_params.debug_info_flag] {boolean}
 * @param [params.restart_this_engine_params.max_restart_engine_times=3] {number} - max restart times for avoiding infinite recursion
 * @return {boolean}
 */
let { config } = require('../../config.js')(runtime, this)
function tryRequestScreenCapture(params) {
  __global__ = typeof __global__ === "undefined" ? {} : __global__;
  if (__global__._monster_$_request_screen_capture_flag) return true;

  sleep(200); // why are you always a naughty boy... how can i get along well with you...

  let _params = params || {};

  let _debugInfo = _msg => (typeof debugInfo === "undefined" ? debugInfoRaw : debugInfo)(_msg, "", _params.debug_info_flag);
  let _waitForAction = typeof waitForAction === "undefined" ? waitForActionRaw : waitForAction;
  let _messageAction = typeof messageAction === "undefined" ? messageActionRaw : messageAction;
  let _clickAction = typeof clickAction === "undefined" ? clickActionRaw : clickAction;
  let _restartThisEngine = typeof restartThisEngine === "undefined" ? restartThisEngineRaw : restartThisEngine;
  let _getSelector = typeof getSelector === "undefined" ? getSelectorRaw : getSelector;

  let sel = _getSelector();

  _params.restart_this_engine_flag = typeof _params.restart_this_engine_flag === "undefined" ? true : !!_params.restart_this_engine_flag;
  _params.restart_this_engine_params = _params.restart_this_engine_params || {};
  _params.restart_this_engine_params.max_restart_engine_times = _params.restart_this_engine_params.max_restart_engine_times || 3;

  _debugInfo("开始申请截图权限");

  __global__._monster_$_request_screen_capture_flag = true;
  _debugInfo("已存储截图权限申请标记");

  _debugInfo("已开启弹窗监测线程");
  let _thread_prompt = threads.start(function () {
      let _kw_no_longer_prompt = type => sel.pickup(id("com.android.systemui:id/remember"), "kw_req_capt_no_longer_prompt", type);
      let _kw_sure_btn = type => sel.pickup(new RegExp(config.capture_permission_button || 'START NOW|立即开始|允许'), "", type);

      if (_waitForAction(_kw_sure_btn, 5000)) {
          if (_waitForAction(_kw_no_longer_prompt, 1000)) {
              _debugInfo("勾选\"不再提示\"复选框");
              _clickAction(_kw_no_longer_prompt(), "widget");
          }
          if (_waitForAction(_kw_sure_btn, 2000)) {
              let _node = _kw_sure_btn();
              let _btn_click_action_str = "点击\"" + _kw_sure_btn("txt") + "\"按钮";

              _debugInfo(_btn_click_action_str);
              _clickAction(_node, "widget");

              if (!_waitForAction(() => !_kw_sure_btn(), 1000)) {
                  _debugInfo("尝试click()方法再次" + _btn_click_action_str);
                  _clickAction(_node, "click");
              }
          }
      }
  });

  let _thread_monitor = threads.start(function () {
      if (_waitForAction(() => !!_req_result, 2000, 500)) {
          _thread_prompt.interrupt();
          return _debugInfo("截图权限申请结果: " + _req_result);
      }
      if (!__global__._monster_$_debug_info_flag) {
          __global__._monster_$_debug_info_flag = true;
          _debugInfo("开发者测试模式已自动开启", 3);
      }
      if (_params.restart_this_engine_flag) {
          _debugInfo("截图权限申请结果: 失败", 3);
          if (_restartThisEngine(_params.restart_this_engine_params)) return;
      }
      _messageAction("截图权限申请失败", 9, 1, 0, 1);
  });

  let _req_result = images.requestScreenCapture(false);
  sleep(300);

  _thread_monitor.join(2400);
  _thread_monitor.interrupt();
  return _req_result;

  // raw function(s) //

  function getSelectorRaw() {
      let classof = o => Object.prototype.toString.call(o).slice(8, -1);
      let sel = selector();
      sel.__proto__ = {
          pickup: (filter) => {
              if (classof(filter) === "JavaObject") {
                  if (filter.toString().match(/UiObject/)) return filter;
                  return filter.findOnce() || null;
              }
              if (typeof filter === "string") return desc(filter).findOnce() || text(filter).findOnce() || null;
              if (classof(filter) === "RegExp") return descMatches(filter).findOnce() || textMatches(filter).findOnce() || null;
              return null;
          },
      };
      return sel;
  }

  function debugInfoRaw(msg, info_flag) {
      if (info_flag) console.verbose((msg || "").replace(/^(>*)( *)/, ">>" + "$1 "));
  }

  function waitForActionRaw(cond_func, time_params) {
      let _cond_func = cond_func;
      if (!cond_func) return true;
      let classof = o => Object.prototype.toString.call(o).slice(8, -1);
      if (classof(cond_func) === "JavaObject") _cond_func = () => cond_func.exists();
      let _check_time = typeof time_params === "object" && time_params[0] || time_params || 10000;
      let _check_interval = typeof time_params === "object" && time_params[1] || 200;
      while (!_cond_func() && _check_time >= 0) {
          sleep(_check_interval);
          _check_time -= _check_interval;
      }
      return _check_time >= 0;
  }

  function clickActionRaw(kw) {
      let classof = o => Object.prototype.toString.call(o).slice(8, -1);
      let _kw = classof(_kw) === "Array" ? kw[0] : kw;
      let _key_node = classof(_kw) === "JavaObject" && _kw.toString().match(/UiObject/) ? _kw : _kw.findOnce();
      if (!_key_node) return;
      let _bounds = _key_node.bounds();
      click(_bounds.centerX(), _bounds.centerY());
      return true;
  }

  function messageActionRaw(msg, msg_level, toast_flag) {
      let _msg = msg || " ";
      if (msg_level && msg_level.toString().match(/^t(itle)?$/)) {
          return messageActionRaw("[ " + msg + " ]", 1, toast_flag);
      }
      let _msg_level = typeof +msg_level === "number" ? +msg_level : -1;
      toast_flag && toast(_msg);
      if (_msg_level === 0) return console.verbose(_msg) || true;
      if (_msg_level === 1) return console.log(_msg) || true;
      if (_msg_level === 2) return console.info(_msg) || true;
      if (_msg_level === 3) return console.warn(_msg) || false;
      if (_msg_level >= 4) {
          console.error(_msg);
          _msg_level >= 8 && exit();
      }
  }

  function restartThisEngineRaw(params) {
      let _params = params || {};
      let _my_engine = engines.myEngine();

      let _max_restart_engine_times_argv = _my_engine.execArgv.max_restart_engine_times;
      let _max_restart_engine_times_params = _params.max_restart_engine_times;
      let _max_restart_engine_times;
      let _instant_run_flag = !!_params.instant_run_flag;
      if (typeof _max_restart_engine_times_argv === "undefined") {
          if (typeof _max_restart_engine_times_params === "undefined") _max_restart_engine_times = 1;
          else _max_restart_engine_times = +_max_restart_engine_times_params;
      } else _max_restart_engine_times = +_max_restart_engine_times_argv;

      if (!_max_restart_engine_times) return;

      let _file_name = _params.new_file || _my_engine.source.toString();
      if (_file_name.match(/^\[remote]/)) return ~console.error("远程任务不支持重启引擎") && exit();
      let _file_path = files.path(_file_name.match(/\.js$/) ? _file_name : (_file_name + ".js"));
      engines.execScriptFile(_file_path, {
          arguments: {
              max_restart_engine_times: _max_restart_engine_times - 1,
              instant_run_flag: _instant_run_flag,
          },
      });
      _my_engine.forceStop();
  }
}

module.exports = tryRequestScreenCapture