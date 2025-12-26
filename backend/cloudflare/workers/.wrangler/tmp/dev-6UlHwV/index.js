var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
var init_utils = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name(notImplementedClass, "notImplementedClass");
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance2;
var init_performance = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry = class {
      static {
        __name(this, "PerformanceEntry");
      }
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
      static {
        __name(this, "PerformanceMark");
      }
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    };
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceResourceTiming");
      }
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    PerformanceObserverEntryList = class {
      static {
        __name(this, "PerformanceObserverEntryList");
      }
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    };
    Performance = class {
      static {
        __name(this, "Performance");
      }
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw createNotImplementedError("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin) {
          return _performanceNow();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
      }
      getEntriesByType(type) {
        return this._entries.filter((e) => e.entryType === type);
      }
      mark(name, options) {
        const entry = new PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw createNotImplementedError("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    };
    PerformanceObserver = class {
      static {
        __name(this, "PerformanceObserver");
      }
      __unenv__ = true;
      static supportedEntryTypes = [];
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw createNotImplementedError("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    };
    performance2 = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    globalThis.performance = performance2;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default;
var init_noop = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";
var _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console, _times, _stdoutErrorHandler, _stderrErrorHandler;
var init_console = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole, assert, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, console_default;
var init_console2 = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
      debug: debug2,
      dir: dir2,
      dirxml: dirxml2,
      error: error2,
      group: group2,
      groupCollapsed: groupCollapsed2,
      groupEnd: groupEnd2,
      info: info2,
      log: log2,
      profile: profile2,
      profileEnd: profileEnd2,
      table: table2,
      time: time2,
      timeEnd: timeEnd2,
      timeLog: timeLog2,
      timeStamp: timeStamp2,
      trace: trace2,
      warn: warn2
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
      const now = Date.now();
      const seconds = Math.trunc(now / 1e3);
      const nanos = now % 1e3 * 1e6;
      if (startTime) {
        let diffSeconds = seconds - startTime[0];
        let diffNanos = nanos - startTime[0];
        if (diffNanos < 0) {
          diffSeconds = diffSeconds - 1;
          diffNanos = 1e9 + diffNanos;
        }
        return [diffSeconds, diffNanos];
      }
      return [seconds, nanos];
    }, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint") });
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class {
      static {
        __name(this, "ReadStream");
      }
      fd;
      isRaw = false;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
    };
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream;
var init_write_stream = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class {
      static {
        __name(this, "WriteStream");
      }
      fd;
      columns = 80;
      rows = 24;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      clearLine(dir3, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env2) {
        return 1;
      }
      hasColors(count3, env2) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      write(str, encoding, cb) {
        if (str instanceof Uint8Array) {
          str = new TextDecoder().decode(str);
        }
        try {
          console.log(str);
        } catch {
        }
        cb && typeof cb === "function" && cb();
        return false;
      }
    };
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION;
var init_node_version = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
      static {
        __name(this, "Process");
      }
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      // --- event emitter ---
      emitWarning(warning, type, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      // --- stdio (lazy initializers) ---
      #stdin;
      #stdout;
      #stderr;
      get stdin() {
        return this.#stdin ??= new ReadStream(0);
      }
      get stdout() {
        return this.#stdout ??= new WriteStream(1);
      }
      get stderr() {
        return this.#stderr ??= new WriteStream(2);
      }
      // --- cwd ---
      #cwd = "/";
      chdir(cwd2) {
        this.#cwd = cwd2;
      }
      cwd() {
        return this.#cwd;
      }
      // --- dummy props and getters ---
      arch = "";
      platform = "";
      argv = [];
      argv0 = "";
      execArgv = [];
      execPath = "";
      title = "";
      pid = 200;
      ppid = 100;
      get version() {
        return `v${NODE_VERSION}`;
      }
      get versions() {
        return { node: NODE_VERSION };
      }
      get allowedNodeEnvironmentFlags() {
        return /* @__PURE__ */ new Set();
      }
      get sourceMapsEnabled() {
        return false;
      }
      get debugPort() {
        return 0;
      }
      get throwDeprecation() {
        return false;
      }
      get traceDeprecation() {
        return false;
      }
      get features() {
        return {};
      }
      get release() {
        return {};
      }
      get connected() {
        return false;
      }
      get config() {
        return {};
      }
      get moduleLoadList() {
        return [];
      }
      constrainedMemory() {
        return 0;
      }
      availableMemory() {
        return 0;
      }
      uptime() {
        return 0;
      }
      resourceUsage() {
        return {};
      }
      // --- noop methods ---
      ref() {
      }
      unref() {
      }
      // --- unimplemented methods ---
      umask() {
        throw createNotImplementedError("process.umask");
      }
      getBuiltinModule() {
        return void 0;
      }
      getActiveResourcesInfo() {
        throw createNotImplementedError("process.getActiveResourcesInfo");
      }
      exit() {
        throw createNotImplementedError("process.exit");
      }
      reallyExit() {
        throw createNotImplementedError("process.reallyExit");
      }
      kill() {
        throw createNotImplementedError("process.kill");
      }
      abort() {
        throw createNotImplementedError("process.abort");
      }
      dlopen() {
        throw createNotImplementedError("process.dlopen");
      }
      setSourceMapsEnabled() {
        throw createNotImplementedError("process.setSourceMapsEnabled");
      }
      loadEnvFile() {
        throw createNotImplementedError("process.loadEnvFile");
      }
      disconnect() {
        throw createNotImplementedError("process.disconnect");
      }
      cpuUsage() {
        throw createNotImplementedError("process.cpuUsage");
      }
      setUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
      }
      hasUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
      }
      initgroups() {
        throw createNotImplementedError("process.initgroups");
      }
      openStdin() {
        throw createNotImplementedError("process.openStdin");
      }
      assert() {
        throw createNotImplementedError("process.assert");
      }
      binding() {
        throw createNotImplementedError("process.binding");
      }
      // --- attached interfaces ---
      permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
      report = {
        directory: "",
        filename: "",
        signal: "SIGUSR2",
        compact: false,
        reportOnFatalError: false,
        reportOnSignal: false,
        reportOnUncaughtException: false,
        getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
        writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
      };
      finalization = {
        register: /* @__PURE__ */ notImplemented("process.finalization.register"),
        unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
        registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
      };
      memoryUsage = Object.assign(() => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
      // --- undefined props ---
      mainModule = void 0;
      domain = void 0;
      // optional
      send = void 0;
      exitCode = void 0;
      channel = void 0;
      getegid = void 0;
      geteuid = void 0;
      getgid = void 0;
      getgroups = void 0;
      getuid = void 0;
      setegid = void 0;
      seteuid = void 0;
      setgid = void 0;
      setgroups = void 0;
      setuid = void 0;
      // internals
      _events = void 0;
      _eventsCount = void 0;
      _exiting = void 0;
      _maxListeners = void 0;
      _debugEnd = void 0;
      _debugProcess = void 0;
      _fatalException = void 0;
      _getActiveHandles = void 0;
      _getActiveRequests = void 0;
      _kill = void 0;
      _preload_modules = void 0;
      _rawDebug = void 0;
      _startProfilerIdleNotifier = void 0;
      _stopProfilerIdleNotifier = void 0;
      _tickCallback = void 0;
      _disconnect = void 0;
      _handleQueue = void 0;
      _pendingMessage = void 0;
      _channel = void 0;
      _send = void 0;
      _linkedBinding = void 0;
    };
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, workerdProcess, isWorkerdProcessV2, unenvProcess, exit, features, platform, env, hrtime3, nextTick, _channel, _disconnect, _events, _eventsCount, _handleQueue, _maxListeners, _pendingMessage, _send, assert2, disconnect, mainModule, _debugEnd, _debugProcess, _exiting, _fatalException, _getActiveHandles, _getActiveRequests, _kill, _linkedBinding, _preload_modules, _rawDebug, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, abort, addListener, allowedNodeEnvironmentFlags, arch, argv, argv0, availableMemory, binding, channel, chdir, config, connected, constrainedMemory, cpuUsage, cwd, debugPort, dlopen, domain, emit, emitWarning, eventNames, execArgv, execPath, exitCode, finalization, getActiveResourcesInfo, getegid, geteuid, getgid, getgroups, getMaxListeners, getuid, hasUncaughtExceptionCaptureCallback, initgroups, kill, listenerCount, listeners, loadEnvFile, memoryUsage, moduleLoadList, off, on, once, openStdin, permission, pid, ppid, prependListener, prependOnceListener, rawListeners, reallyExit, ref, release, removeAllListeners, removeListener, report, resourceUsage, send, setegid, seteuid, setgid, setgroups, setMaxListeners, setSourceMapsEnabled, setuid, setUncaughtExceptionCaptureCallback, sourceMapsEnabled, stderr, stdin, stdout, throwDeprecation, title, traceDeprecation, umask, unref, uptime, version, versions, _process, process_default;
var init_process2 = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    workerdProcess = getBuiltinModule("node:process");
    isWorkerdProcessV2 = globalThis.Cloudflare.compatibilityFlags.enable_nodejs_process_v2;
    unenvProcess = new Process({
      env: globalProcess.env,
      // `hrtime` is only available from workerd process v2
      hrtime: isWorkerdProcessV2 ? workerdProcess.hrtime : hrtime,
      // `nextTick` is available from workerd process v1
      nextTick: workerdProcess.nextTick
    });
    ({ exit, features, platform } = workerdProcess);
    ({
      env: (
        // Always implemented by workerd
        env
      ),
      hrtime: (
        // Only implemented in workerd v2
        hrtime3
      ),
      nextTick: (
        // Always implemented by workerd
        nextTick
      )
    } = unenvProcess);
    ({
      _channel,
      _disconnect,
      _events,
      _eventsCount,
      _handleQueue,
      _maxListeners,
      _pendingMessage,
      _send,
      assert: assert2,
      disconnect,
      mainModule
    } = unenvProcess);
    ({
      _debugEnd: (
        // @ts-expect-error `_debugEnd` is missing typings
        _debugEnd
      ),
      _debugProcess: (
        // @ts-expect-error `_debugProcess` is missing typings
        _debugProcess
      ),
      _exiting: (
        // @ts-expect-error `_exiting` is missing typings
        _exiting
      ),
      _fatalException: (
        // @ts-expect-error `_fatalException` is missing typings
        _fatalException
      ),
      _getActiveHandles: (
        // @ts-expect-error `_getActiveHandles` is missing typings
        _getActiveHandles
      ),
      _getActiveRequests: (
        // @ts-expect-error `_getActiveRequests` is missing typings
        _getActiveRequests
      ),
      _kill: (
        // @ts-expect-error `_kill` is missing typings
        _kill
      ),
      _linkedBinding: (
        // @ts-expect-error `_linkedBinding` is missing typings
        _linkedBinding
      ),
      _preload_modules: (
        // @ts-expect-error `_preload_modules` is missing typings
        _preload_modules
      ),
      _rawDebug: (
        // @ts-expect-error `_rawDebug` is missing typings
        _rawDebug
      ),
      _startProfilerIdleNotifier: (
        // @ts-expect-error `_startProfilerIdleNotifier` is missing typings
        _startProfilerIdleNotifier
      ),
      _stopProfilerIdleNotifier: (
        // @ts-expect-error `_stopProfilerIdleNotifier` is missing typings
        _stopProfilerIdleNotifier
      ),
      _tickCallback: (
        // @ts-expect-error `_tickCallback` is missing typings
        _tickCallback
      ),
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      arch,
      argv,
      argv0,
      availableMemory,
      binding: (
        // @ts-expect-error `binding` is missing typings
        binding
      ),
      channel,
      chdir,
      config,
      connected,
      constrainedMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      domain: (
        // @ts-expect-error `domain` is missing typings
        domain
      ),
      emit,
      emitWarning,
      eventNames,
      execArgv,
      execPath,
      exitCode,
      finalization,
      getActiveResourcesInfo,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getMaxListeners,
      getuid,
      hasUncaughtExceptionCaptureCallback,
      initgroups: (
        // @ts-expect-error `initgroups` is missing typings
        initgroups
      ),
      kill,
      listenerCount,
      listeners,
      loadEnvFile,
      memoryUsage,
      moduleLoadList: (
        // @ts-expect-error `moduleLoadList` is missing typings
        moduleLoadList
      ),
      off,
      on,
      once,
      openStdin: (
        // @ts-expect-error `openStdin` is missing typings
        openStdin
      ),
      permission,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      reallyExit: (
        // @ts-expect-error `reallyExit` is missing typings
        reallyExit
      ),
      ref,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      send,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setMaxListeners,
      setSourceMapsEnabled,
      setuid,
      setUncaughtExceptionCaptureCallback,
      sourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      throwDeprecation,
      title,
      traceDeprecation,
      umask,
      unref,
      uptime,
      version,
      versions
    } = isWorkerdProcessV2 ? workerdProcess : unenvProcess);
    _process = {
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exit,
      finalization,
      features,
      getBuiltinModule,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      nextTick,
      on,
      off,
      once,
      pid,
      platform,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      // @ts-expect-error old API
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    };
    process_default = _process;
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// src/utils/jwt.utils.ts
var jwt_utils_exports = {};
__export(jwt_utils_exports, {
  generateToken: () => generateToken,
  verifyToken: () => verifyToken
});
function getJwtSecret(env2) {
  if (!env2.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return env2.JWT_SECRET;
}
function base64urlEncode(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return atob(str);
}
async function generateToken(userId, type, env2) {
  console.log("[generateToken] Generating token for userId:", userId, "type:", type);
  const secret = getJwtSecret(env2);
  const now = Math.floor(Date.now() / 1e3);
  const exp = type === "access" ? now + 900 : now + 2592e3;
  console.log("[generateToken] Token lifetime:", type === "access" ? "15min" : "30days", "iat:", now, "exp:", exp);
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const payload = {
    userId,
    type,
    iat: now,
    exp,
    iatMs: Date.now(),
    // millisecond precision for uniqueness
    nonce: Math.random().toString(36).substring(2, 11)
    // 9-char random nonce
  };
  const headerEncoded = base64urlEncode(JSON.stringify(header));
  const payloadEncoded = base64urlEncode(JSON.stringify(payload));
  const message = `${headerEncoded}.${payloadEncoded}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  const signatureEncoded = base64urlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );
  const fullToken = `${message}.${signatureEncoded}`;
  console.log("[generateToken] Token generated, length:", fullToken.length, "first 30 chars:", fullToken.substring(0, 30));
  return fullToken;
}
async function verifyToken(token, env2) {
  try {
    const secret = getJwtSecret(env2);
    const parts = token.split(".");
    console.log("[verifyToken] Token parts count:", parts.length);
    if (parts.length !== 3) {
      console.log("[verifyToken] Invalid token format (expected 3 parts)");
      return null;
    }
    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
    const payloadDecoded = base64urlDecode(payloadEncoded);
    console.log("[verifyToken] Decoded payload string:", payloadDecoded.substring(0, 200));
    const message = `${headerEncoded}.${payloadEncoded}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signature = Uint8Array.from(
      base64urlDecode(signatureEncoded),
      (c) => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      new TextEncoder().encode(message)
    );
    console.log("[verifyToken] Signature valid:", valid);
    if (!valid) {
      console.log("[verifyToken] Signature verification failed");
      return null;
    }
    const payload = JSON.parse(payloadDecoded);
    console.log("[verifyToken] Parsed payload:", JSON.stringify(payload, null, 2));
    const nowSec = Math.floor(Date.now() / 1e3);
    console.log("[verifyToken] Current time:", nowSec, "Token exp:", payload.exp, "Remaining:", payload.exp - nowSec, "sec");
    if (payload.exp < nowSec) {
      console.log("[verifyToken] Token expired");
      return null;
    }
    console.log("[verifyToken] Token verified successfully, type:", payload.type, "userId:", payload.userId);
    return payload;
  } catch (error3) {
    console.error("[verifyToken] Exception during verification:", error3);
    console.error("[verifyToken] Error details:", error3 instanceof Error ? error3.message : String(error3));
    return null;
  }
}
var init_jwt_utils = __esm({
  "src/utils/jwt.utils.ts"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(getJwtSecret, "getJwtSecret");
    __name(base64urlEncode, "base64urlEncode");
    __name(base64urlDecode, "base64urlDecode");
    __name(generateToken, "generateToken");
    __name(verifyToken, "verifyToken");
  }
});

// src/utils/response.utils.ts
function jsonResponse(success, data, errorCode, status = 200) {
  return new Response(
    JSON.stringify(
      success ? { success: true, data } : { success: false, error: { code: errorCode || "UNKNOWN", message: errorCode || "error" } }
    ),
    { status, headers: { "Content-Type": "application/json" } }
  );
}
var init_response_utils = __esm({
  "src/utils/response.utils.ts"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(jsonResponse, "jsonResponse");
  }
});

// node_modules/crypt/crypt.js
var require_crypt = __commonJS({
  "node_modules/crypt/crypt.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    (function() {
      var base64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", crypt = {
        // Bit-wise rotation left
        rotl: /* @__PURE__ */ __name(function(n, b) {
          return n << b | n >>> 32 - b;
        }, "rotl"),
        // Bit-wise rotation right
        rotr: /* @__PURE__ */ __name(function(n, b) {
          return n << 32 - b | n >>> b;
        }, "rotr"),
        // Swap big-endian to little-endian and vice versa
        endian: /* @__PURE__ */ __name(function(n) {
          if (n.constructor == Number) {
            return crypt.rotl(n, 8) & 16711935 | crypt.rotl(n, 24) & 4278255360;
          }
          for (var i = 0; i < n.length; i++)
            n[i] = crypt.endian(n[i]);
          return n;
        }, "endian"),
        // Generate an array of any length of random bytes
        randomBytes: /* @__PURE__ */ __name(function(n) {
          for (var bytes = []; n > 0; n--)
            bytes.push(Math.floor(Math.random() * 256));
          return bytes;
        }, "randomBytes"),
        // Convert a byte array to big-endian 32-bit words
        bytesToWords: /* @__PURE__ */ __name(function(bytes) {
          for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
            words[b >>> 5] |= bytes[i] << 24 - b % 32;
          return words;
        }, "bytesToWords"),
        // Convert big-endian 32-bit words to a byte array
        wordsToBytes: /* @__PURE__ */ __name(function(words) {
          for (var bytes = [], b = 0; b < words.length * 32; b += 8)
            bytes.push(words[b >>> 5] >>> 24 - b % 32 & 255);
          return bytes;
        }, "wordsToBytes"),
        // Convert a byte array to a hex string
        bytesToHex: /* @__PURE__ */ __name(function(bytes) {
          for (var hex = [], i = 0; i < bytes.length; i++) {
            hex.push((bytes[i] >>> 4).toString(16));
            hex.push((bytes[i] & 15).toString(16));
          }
          return hex.join("");
        }, "bytesToHex"),
        // Convert a hex string to a byte array
        hexToBytes: /* @__PURE__ */ __name(function(hex) {
          for (var bytes = [], c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
          return bytes;
        }, "hexToBytes"),
        // Convert a byte array to a base-64 string
        bytesToBase64: /* @__PURE__ */ __name(function(bytes) {
          for (var base64 = [], i = 0; i < bytes.length; i += 3) {
            var triplet = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
            for (var j = 0; j < 4; j++)
              if (i * 8 + j * 6 <= bytes.length * 8)
                base64.push(base64map.charAt(triplet >>> 6 * (3 - j) & 63));
              else
                base64.push("=");
          }
          return base64.join("");
        }, "bytesToBase64"),
        // Convert a base-64 string to a byte array
        base64ToBytes: /* @__PURE__ */ __name(function(base64) {
          base64 = base64.replace(/[^A-Z0-9+\/]/ig, "");
          for (var bytes = [], i = 0, imod4 = 0; i < base64.length; imod4 = ++i % 4) {
            if (imod4 == 0) continue;
            bytes.push((base64map.indexOf(base64.charAt(i - 1)) & Math.pow(2, -2 * imod4 + 8) - 1) << imod4 * 2 | base64map.indexOf(base64.charAt(i)) >>> 6 - imod4 * 2);
          }
          return bytes;
        }, "base64ToBytes")
      };
      module.exports = crypt;
    })();
  }
});

// node_modules/charenc/charenc.js
var require_charenc = __commonJS({
  "node_modules/charenc/charenc.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var charenc = {
      // UTF-8 encoding
      utf8: {
        // Convert a string to a byte array
        stringToBytes: /* @__PURE__ */ __name(function(str) {
          return charenc.bin.stringToBytes(unescape(encodeURIComponent(str)));
        }, "stringToBytes"),
        // Convert a byte array to a string
        bytesToString: /* @__PURE__ */ __name(function(bytes) {
          return decodeURIComponent(escape(charenc.bin.bytesToString(bytes)));
        }, "bytesToString")
      },
      // Binary encoding
      bin: {
        // Convert a string to a byte array
        stringToBytes: /* @__PURE__ */ __name(function(str) {
          for (var bytes = [], i = 0; i < str.length; i++)
            bytes.push(str.charCodeAt(i) & 255);
          return bytes;
        }, "stringToBytes"),
        // Convert a byte array to a string
        bytesToString: /* @__PURE__ */ __name(function(bytes) {
          for (var str = [], i = 0; i < bytes.length; i++)
            str.push(String.fromCharCode(bytes[i]));
          return str.join("");
        }, "bytesToString")
      }
    };
    module.exports = charenc;
  }
});

// node_modules/is-buffer/index.js
var require_is_buffer = __commonJS({
  "node_modules/is-buffer/index.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = function(obj) {
      return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer);
    };
    function isBuffer(obj) {
      return !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
    }
    __name(isBuffer, "isBuffer");
    function isSlowBuffer(obj) {
      return typeof obj.readFloatLE === "function" && typeof obj.slice === "function" && isBuffer(obj.slice(0, 0));
    }
    __name(isSlowBuffer, "isSlowBuffer");
  }
});

// node_modules/md5/md5.js
var require_md5 = __commonJS({
  "node_modules/md5/md5.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    (function() {
      var crypt = require_crypt(), utf8 = require_charenc().utf8, isBuffer = require_is_buffer(), bin = require_charenc().bin, md5 = /* @__PURE__ */ __name(function(message, options) {
        if (message.constructor == String)
          if (options && options.encoding === "binary")
            message = bin.stringToBytes(message);
          else
            message = utf8.stringToBytes(message);
        else if (isBuffer(message))
          message = Array.prototype.slice.call(message, 0);
        else if (!Array.isArray(message) && message.constructor !== Uint8Array)
          message = message.toString();
        var m = crypt.bytesToWords(message), l = message.length * 8, a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
        for (var i = 0; i < m.length; i++) {
          m[i] = (m[i] << 8 | m[i] >>> 24) & 16711935 | (m[i] << 24 | m[i] >>> 8) & 4278255360;
        }
        m[l >>> 5] |= 128 << l % 32;
        m[(l + 64 >>> 9 << 4) + 14] = l;
        var FF = md5._ff, GG = md5._gg, HH = md5._hh, II = md5._ii;
        for (var i = 0; i < m.length; i += 16) {
          var aa = a, bb = b, cc = c, dd = d;
          a = FF(a, b, c, d, m[i + 0], 7, -680876936);
          d = FF(d, a, b, c, m[i + 1], 12, -389564586);
          c = FF(c, d, a, b, m[i + 2], 17, 606105819);
          b = FF(b, c, d, a, m[i + 3], 22, -1044525330);
          a = FF(a, b, c, d, m[i + 4], 7, -176418897);
          d = FF(d, a, b, c, m[i + 5], 12, 1200080426);
          c = FF(c, d, a, b, m[i + 6], 17, -1473231341);
          b = FF(b, c, d, a, m[i + 7], 22, -45705983);
          a = FF(a, b, c, d, m[i + 8], 7, 1770035416);
          d = FF(d, a, b, c, m[i + 9], 12, -1958414417);
          c = FF(c, d, a, b, m[i + 10], 17, -42063);
          b = FF(b, c, d, a, m[i + 11], 22, -1990404162);
          a = FF(a, b, c, d, m[i + 12], 7, 1804603682);
          d = FF(d, a, b, c, m[i + 13], 12, -40341101);
          c = FF(c, d, a, b, m[i + 14], 17, -1502002290);
          b = FF(b, c, d, a, m[i + 15], 22, 1236535329);
          a = GG(a, b, c, d, m[i + 1], 5, -165796510);
          d = GG(d, a, b, c, m[i + 6], 9, -1069501632);
          c = GG(c, d, a, b, m[i + 11], 14, 643717713);
          b = GG(b, c, d, a, m[i + 0], 20, -373897302);
          a = GG(a, b, c, d, m[i + 5], 5, -701558691);
          d = GG(d, a, b, c, m[i + 10], 9, 38016083);
          c = GG(c, d, a, b, m[i + 15], 14, -660478335);
          b = GG(b, c, d, a, m[i + 4], 20, -405537848);
          a = GG(a, b, c, d, m[i + 9], 5, 568446438);
          d = GG(d, a, b, c, m[i + 14], 9, -1019803690);
          c = GG(c, d, a, b, m[i + 3], 14, -187363961);
          b = GG(b, c, d, a, m[i + 8], 20, 1163531501);
          a = GG(a, b, c, d, m[i + 13], 5, -1444681467);
          d = GG(d, a, b, c, m[i + 2], 9, -51403784);
          c = GG(c, d, a, b, m[i + 7], 14, 1735328473);
          b = GG(b, c, d, a, m[i + 12], 20, -1926607734);
          a = HH(a, b, c, d, m[i + 5], 4, -378558);
          d = HH(d, a, b, c, m[i + 8], 11, -2022574463);
          c = HH(c, d, a, b, m[i + 11], 16, 1839030562);
          b = HH(b, c, d, a, m[i + 14], 23, -35309556);
          a = HH(a, b, c, d, m[i + 1], 4, -1530992060);
          d = HH(d, a, b, c, m[i + 4], 11, 1272893353);
          c = HH(c, d, a, b, m[i + 7], 16, -155497632);
          b = HH(b, c, d, a, m[i + 10], 23, -1094730640);
          a = HH(a, b, c, d, m[i + 13], 4, 681279174);
          d = HH(d, a, b, c, m[i + 0], 11, -358537222);
          c = HH(c, d, a, b, m[i + 3], 16, -722521979);
          b = HH(b, c, d, a, m[i + 6], 23, 76029189);
          a = HH(a, b, c, d, m[i + 9], 4, -640364487);
          d = HH(d, a, b, c, m[i + 12], 11, -421815835);
          c = HH(c, d, a, b, m[i + 15], 16, 530742520);
          b = HH(b, c, d, a, m[i + 2], 23, -995338651);
          a = II(a, b, c, d, m[i + 0], 6, -198630844);
          d = II(d, a, b, c, m[i + 7], 10, 1126891415);
          c = II(c, d, a, b, m[i + 14], 15, -1416354905);
          b = II(b, c, d, a, m[i + 5], 21, -57434055);
          a = II(a, b, c, d, m[i + 12], 6, 1700485571);
          d = II(d, a, b, c, m[i + 3], 10, -1894986606);
          c = II(c, d, a, b, m[i + 10], 15, -1051523);
          b = II(b, c, d, a, m[i + 1], 21, -2054922799);
          a = II(a, b, c, d, m[i + 8], 6, 1873313359);
          d = II(d, a, b, c, m[i + 15], 10, -30611744);
          c = II(c, d, a, b, m[i + 6], 15, -1560198380);
          b = II(b, c, d, a, m[i + 13], 21, 1309151649);
          a = II(a, b, c, d, m[i + 4], 6, -145523070);
          d = II(d, a, b, c, m[i + 11], 10, -1120210379);
          c = II(c, d, a, b, m[i + 2], 15, 718787259);
          b = II(b, c, d, a, m[i + 9], 21, -343485551);
          a = a + aa >>> 0;
          b = b + bb >>> 0;
          c = c + cc >>> 0;
          d = d + dd >>> 0;
        }
        return crypt.endian([a, b, c, d]);
      }, "md5");
      md5._ff = function(a, b, c, d, x, s, t) {
        var n = a + (b & c | ~b & d) + (x >>> 0) + t;
        return (n << s | n >>> 32 - s) + b;
      };
      md5._gg = function(a, b, c, d, x, s, t) {
        var n = a + (b & d | c & ~d) + (x >>> 0) + t;
        return (n << s | n >>> 32 - s) + b;
      };
      md5._hh = function(a, b, c, d, x, s, t) {
        var n = a + (b ^ c ^ d) + (x >>> 0) + t;
        return (n << s | n >>> 32 - s) + b;
      };
      md5._ii = function(a, b, c, d, x, s, t) {
        var n = a + (c ^ (b | ~d)) + (x >>> 0) + t;
        return (n << s | n >>> 32 - s) + b;
      };
      md5._blocksize = 16;
      md5._digestsize = 16;
      module.exports = function(message, options) {
        if (message === void 0 || message === null)
          throw new Error("Illegal argument " + message);
        var digestbytes = crypt.wordsToBytes(md5(message, options));
        return options && options.asBytes ? digestbytes : options && options.asString ? bin.bytesToString(digestbytes) : crypt.bytesToHex(digestbytes);
      };
    })();
  }
});

// node-built-in-modules:crypto
import libDefault from "crypto";
var require_crypto = __commonJS({
  "node-built-in-modules:crypto"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault;
  }
});

// node-built-in-modules:zlib
import libDefault2 from "zlib";
var require_zlib = __commonJS({
  "node-built-in-modules:zlib"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault2;
  }
});

// node_modules/agora-token/src/AccessToken2.js
var require_AccessToken2 = __commonJS({
  "node_modules/agora-token/src/AccessToken2.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var crypto2 = require_crypto();
    var zlib = require_zlib();
    var VERSION_LENGTH = 3;
    var APP_ID_LENGTH = 32;
    var getVersion = /* @__PURE__ */ __name(() => {
      return "007";
    }, "getVersion");
    var Service = class {
      static {
        __name(this, "Service");
      }
      constructor(service_type) {
        this.__type = service_type;
        this.__privileges = {};
      }
      __pack_type() {
        let buf = new ByteBuf();
        buf.putUint16(this.__type);
        return buf.pack();
      }
      __pack_privileges() {
        let buf = new ByteBuf();
        buf.putTreeMapUInt32(this.__privileges);
        return buf.pack();
      }
      service_type() {
        return this.__type;
      }
      add_privilege(privilege, expire) {
        this.__privileges[privilege] = expire;
      }
      pack() {
        return Buffer.concat([this.__pack_type(), this.__pack_privileges()]);
      }
      unpack(buffer) {
        let bufReader = new ReadByteBuf(buffer);
        this.__privileges = bufReader.getTreeMapUInt32();
        return bufReader;
      }
    };
    var kRtcServiceType = 1;
    var ServiceRtc = class extends Service {
      static {
        __name(this, "ServiceRtc");
      }
      constructor(channel_name, uid) {
        super(kRtcServiceType);
        this.__channel_name = channel_name;
        this.__uid = uid === 0 ? "" : `${uid}`;
      }
      pack() {
        let buffer = new ByteBuf();
        buffer.putString(this.__channel_name).putString(this.__uid);
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        this.__channel_name = bufReader.getString();
        this.__uid = bufReader.getString();
        return bufReader;
      }
    };
    ServiceRtc.kPrivilegeJoinChannel = 1;
    ServiceRtc.kPrivilegePublishAudioStream = 2;
    ServiceRtc.kPrivilegePublishVideoStream = 3;
    ServiceRtc.kPrivilegePublishDataStream = 4;
    var kRtmServiceType = 2;
    var ServiceRtm = class extends Service {
      static {
        __name(this, "ServiceRtm");
      }
      constructor(user_id) {
        super(kRtmServiceType);
        this.__user_id = user_id || "";
      }
      pack() {
        let buffer = new ByteBuf();
        buffer.putString(this.__user_id);
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        this.__user_id = bufReader.getString();
        return bufReader;
      }
    };
    ServiceRtm.kPrivilegeLogin = 1;
    var kFpaServiceType = 4;
    var ServiceFpa = class extends Service {
      static {
        __name(this, "ServiceFpa");
      }
      constructor() {
        super(kFpaServiceType);
      }
      pack() {
        return super.pack();
      }
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        return bufReader;
      }
    };
    ServiceFpa.kPrivilegeLogin = 1;
    var kChatServiceType = 5;
    var ServiceChat = class extends Service {
      static {
        __name(this, "ServiceChat");
      }
      constructor(user_id) {
        super(kChatServiceType);
        this.__user_id = user_id || "";
      }
      pack() {
        let buffer = new ByteBuf();
        buffer.putString(this.__user_id);
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        this.__user_id = bufReader.getString();
        return bufReader;
      }
    };
    ServiceChat.kPrivilegeUser = 1;
    ServiceChat.kPrivilegeApp = 2;
    var kApaasServiceType = 7;
    var ServiceApaas = class extends Service {
      static {
        __name(this, "ServiceApaas");
      }
      constructor(roomUuid, userUuid, role) {
        super(kApaasServiceType);
        this.__room_uuid = roomUuid || "";
        this.__user_uuid = userUuid || "";
        this.__role = role || -1;
      }
      pack() {
        let buffer = new ByteBuf();
        buffer.putString(this.__room_uuid);
        buffer.putString(this.__user_uuid);
        buffer.putInt16(this.__role);
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        this.__room_uuid = bufReader.getString();
        this.__user_uuid = bufReader.getString();
        this.__role = bufReader.getInt16();
        return bufReader;
      }
    };
    ServiceApaas.PRIVILEGE_ROOM_USER = 1;
    ServiceApaas.PRIVILEGE_USER = 2;
    ServiceApaas.PRIVILEGE_APP = 3;
    var AccessToken2 = class _AccessToken2 {
      static {
        __name(this, "AccessToken2");
      }
      constructor(appId, appCertificate, issueTs, expire) {
        this.appId = appId;
        this.appCertificate = appCertificate;
        this.issueTs = issueTs || (/* @__PURE__ */ new Date()).getTime() / 1e3;
        this.expire = expire;
        this.salt = Math.floor(Math.random() * 99999999) + 1;
        this.services = {};
      }
      __signing() {
        let signing = encodeHMac(new ByteBuf().putUint32(this.issueTs).pack(), this.appCertificate);
        signing = encodeHMac(new ByteBuf().putUint32(this.salt).pack(), signing);
        return signing;
      }
      __build_check() {
        let is_uuid = /* @__PURE__ */ __name((data) => {
          if (data.length !== APP_ID_LENGTH) {
            return false;
          }
          let buf = Buffer.from(data, "hex");
          return !!buf;
        }, "is_uuid");
        const { appId, appCertificate, services } = this;
        if (!is_uuid(appId) || !is_uuid(appCertificate)) {
          return false;
        }
        if (Object.keys(services).length === 0) {
          return false;
        }
        return true;
      }
      add_service(service) {
        this.services[service.service_type()] = service;
      }
      build() {
        if (!this.__build_check()) {
          return "";
        }
        let signing = this.__signing();
        let signing_info = new ByteBuf().putString(this.appId).putUint32(this.issueTs).putUint32(this.expire).putUint32(this.salt).putUint16(Object.keys(this.services).length).pack();
        Object.values(this.services).forEach((service) => {
          signing_info = Buffer.concat([signing_info, service.pack()]);
        });
        let signature = encodeHMac(signing, signing_info);
        let content = Buffer.concat([new ByteBuf().putString(signature).pack(), signing_info]);
        let compressed = zlib.deflateSync(content);
        return `${getVersion()}${Buffer.from(compressed).toString("base64")}`;
      }
      from_string(origin_token) {
        let origin_version = origin_token.substring(0, VERSION_LENGTH);
        if (origin_version !== getVersion()) {
          return false;
        }
        let origin_content = origin_token.substring(VERSION_LENGTH, origin_token.length);
        let buffer = zlib.inflateSync(new Buffer(origin_content, "base64"));
        let bufferReader = new ReadByteBuf(buffer);
        let signature = bufferReader.getString();
        this.appId = bufferReader.getString();
        this.issueTs = bufferReader.getUint32();
        this.expire = bufferReader.getUint32();
        this.salt = bufferReader.getUint32();
        let service_count = bufferReader.getUint16();
        let remainBuf = bufferReader.pack();
        for (let i = 0; i < service_count; i++) {
          let bufferReaderService = new ReadByteBuf(remainBuf);
          let service_type = bufferReaderService.getUint16();
          let service = new _AccessToken2.kServices[service_type]();
          remainBuf = service.unpack(bufferReaderService.pack()).pack();
          this.services[service_type] = service;
        }
      }
    };
    var encodeHMac = /* @__PURE__ */ __name(function(key, message) {
      return crypto2.createHmac("sha256", key).update(message).digest();
    }, "encodeHMac");
    var ByteBuf = /* @__PURE__ */ __name(function() {
      var that = {
        buffer: Buffer.alloc(1024),
        position: 0
      };
      that.buffer.fill(0);
      that.pack = function() {
        var out = Buffer.alloc(that.position);
        that.buffer.copy(out, 0, 0, out.length);
        return out;
      };
      that.putUint16 = function(v) {
        that.buffer.writeUInt16LE(v, that.position);
        that.position += 2;
        return that;
      };
      that.putUint32 = function(v) {
        that.buffer.writeUInt32LE(v, that.position);
        that.position += 4;
        return that;
      };
      that.putInt32 = function(v) {
        that.buffer.writeInt32LE(v, that.position);
        that.position += 4;
        return that;
      };
      that.putInt16 = function(v) {
        that.buffer.writeInt16LE(v, that.position);
        that.position += 2;
        return that;
      };
      that.putBytes = function(bytes) {
        that.putUint16(bytes.length);
        bytes.copy(that.buffer, that.position);
        that.position += bytes.length;
        return that;
      };
      that.putString = function(str) {
        return that.putBytes(Buffer.from(str));
      };
      that.putTreeMap = function(map) {
        if (!map) {
          that.putUint16(0);
          return that;
        }
        that.putUint16(Object.keys(map).length);
        for (var key in map) {
          that.putUint16(key);
          that.putString(map[key]);
        }
        return that;
      };
      that.putTreeMapUInt32 = function(map) {
        if (!map) {
          that.putUint16(0);
          return that;
        }
        that.putUint16(Object.keys(map).length);
        for (var key in map) {
          that.putUint16(key);
          that.putUint32(map[key]);
        }
        return that;
      };
      return that;
    }, "ByteBuf");
    var ReadByteBuf = /* @__PURE__ */ __name(function(bytes) {
      var that = {
        buffer: bytes,
        position: 0
      };
      that.getUint16 = function() {
        var ret = that.buffer.readUInt16LE(that.position);
        that.position += 2;
        return ret;
      };
      that.getUint32 = function() {
        var ret = that.buffer.readUInt32LE(that.position);
        that.position += 4;
        return ret;
      };
      that.getInt16 = function() {
        var ret = that.buffer.readUInt16LE(that.position);
        that.position += 2;
        return ret;
      };
      that.getString = function() {
        var len = that.getUint16();
        var out = Buffer.alloc(len);
        that.buffer.copy(out, 0, that.position, that.position + len);
        that.position += len;
        return out;
      };
      that.getTreeMapUInt32 = function() {
        var map = {};
        var len = that.getUint16();
        for (var i = 0; i < len; i++) {
          var key = that.getUint16();
          var value = that.getUint32();
          map[key] = value;
        }
        return map;
      };
      that.pack = function() {
        let length = that.buffer.length;
        var out = Buffer.alloc(length);
        that.buffer.copy(out, 0, that.position, length);
        return out;
      };
      return that;
    }, "ReadByteBuf");
    AccessToken2.kServices = {};
    AccessToken2.kServices[kApaasServiceType] = ServiceApaas;
    AccessToken2.kServices[kChatServiceType] = ServiceChat;
    AccessToken2.kServices[kFpaServiceType] = ServiceFpa;
    AccessToken2.kServices[kRtcServiceType] = ServiceRtc;
    AccessToken2.kServices[kRtmServiceType] = ServiceRtm;
    module.exports = {
      AccessToken2,
      kApaasServiceType,
      kChatServiceType,
      kFpaServiceType,
      kRtcServiceType,
      kRtmServiceType,
      ServiceApaas,
      ServiceChat,
      ServiceFpa,
      ServiceRtc,
      ServiceRtm
    };
  }
});

// node_modules/agora-token/src/ApaasTokenBuilder.js
var require_ApaasTokenBuilder = __commonJS({
  "node_modules/agora-token/src/ApaasTokenBuilder.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var md5 = require_md5();
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceApaas = require_AccessToken2().ServiceApaas;
    var ServiceChat = require_AccessToken2().ServiceChat;
    var ServiceRtm = require_AccessToken2().ServiceRtm;
    var ApaasTokenBuilder = class {
      static {
        __name(this, "ApaasTokenBuilder");
      }
      /**
       * build user room token
       * @param appId             The App ID issued to you by Agora. Apply for a new App ID from
       *                          Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate    Certificate of the application that you registered in
       *                          the Agora Dashboard. See Get an App Certificate.
       * @param roomUuid          The room's id, must be unique.
       * @param userUuid          The user's id, must be unique.
       * @param role              The user's role.
       * @param expire            represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                          Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The user room token.
       */
      static buildRoomUserToken(appId, appCertificate, roomUuid, userUuid, role, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let chatUserId = md5(userUuid);
        let apaasService = new ServiceApaas(roomUuid, userUuid, role);
        accessToken.add_service(apaasService);
        let rtmService = new ServiceRtm(userUuid);
        rtmService.add_privilege(ServiceRtm.kPrivilegeLogin, expire);
        accessToken.add_service(rtmService);
        let chatService = new ServiceChat(chatUserId);
        chatService.add_privilege(ServiceChat.kPrivilegeUser, expire);
        accessToken.add_service(chatService);
        return accessToken.build();
      }
      /**
       * build user token
       * @param appId             The App ID issued to you by Agora. Apply for a new App ID from
       *                          Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate    Certificate of the application that you registered in
       *                          the Agora Dashboard. See Get an App Certificate.
       * @param userUuid          The user's id, must be unique.
       * @param expire            represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                          Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The user token.
       */
      static buildUserToken(appId, appCertificate, userUuid, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let apaasService = new ServiceApaas("", userUuid);
        apaasService.add_privilege(ServiceApaas.PRIVILEGE_USER, expire);
        accessToken.add_service(apaasService);
        return accessToken.build();
      }
      /**
       * build app token
       * @param appId          The App ID issued to you by Agora. Apply for a new App ID from
       *                       Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       *                       the Agora Dashboard. See Get an App Certificate.
       * @param expire         represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                       Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The app token.
       */
      static buildAppToken(appId, appCertificate, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let apaasService = new ServiceApaas();
        apaasService.add_privilege(ServiceApaas.PRIVILEGE_APP, expire);
        accessToken.add_service(apaasService);
        return accessToken.build();
      }
    };
    module.exports.ApaasTokenBuilder = ApaasTokenBuilder;
  }
});

// node_modules/agora-token/src/ChatTokenBuilder.js
var require_ChatTokenBuilder = __commonJS({
  "node_modules/agora-token/src/ChatTokenBuilder.js"(exports) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceChat = require_AccessToken2().ServiceChat;
    var ChatTokenBuilder = class {
      static {
        __name(this, "ChatTokenBuilder");
      }
      /**
       * Build the Chat user token.
       *
       * @param appId The App ID issued to you by Agora. Apply for a new App ID from
       * Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       * the Agora Dashboard. See Get an App Certificate.
       * @param userUuid The user's id, must be unique.
       * @param expire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The Chat User token.
       */
      static buildUserToken(appId, appCertificate, userUuid, expire) {
        const token = new AccessToken(appId, appCertificate, null, expire);
        const serviceChat = new ServiceChat(userUuid);
        serviceChat.add_privilege(ServiceChat.kPrivilegeUser, expire);
        token.add_service(serviceChat);
        return token.build();
      }
      /**
       * Build the Chat App token.
       *
       * @param appId The App ID issued to you by Agora. Apply for a new App ID from
       * Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       * the Agora Dashboard. See Get an App Certificate.
       * @param expire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The Chat App token.
       */
      static buildAppToken(appId, appCertificate, expire) {
        const token = new AccessToken(appId, appCertificate, null, expire);
        const serviceChat = new ServiceChat();
        serviceChat.add_privilege(ServiceChat.kPrivilegeApp, expire);
        token.add_service(serviceChat);
        return token.build();
      }
    };
    exports.ChatTokenBuilder = ChatTokenBuilder;
  }
});

// node_modules/agora-token/src/EducationTokenBuilder.js
var require_EducationTokenBuilder = __commonJS({
  "node_modules/agora-token/src/EducationTokenBuilder.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var md5 = require_md5();
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceApaas = require_AccessToken2().ServiceApaas;
    var ServiceChat = require_AccessToken2().ServiceChat;
    var ServiceRtm = require_AccessToken2().ServiceRtm;
    var EducationTokenBuilder = class {
      static {
        __name(this, "EducationTokenBuilder");
      }
      /**
       * build user room token
       * @param appId             The App ID issued to you by Agora. Apply for a new App ID from
       *                          Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate    Certificate of the application that you registered in
       *                          the Agora Dashboard. See Get an App Certificate.
       * @param roomUuid          The room's id, must be unique.
       * @param userUuid          The user's id, must be unique.
       * @param role              The user's role.
       * @param expire            represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                          Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The user room token.
       */
      static buildRoomUserToken(appId, appCertificate, roomUuid, userUuid, role, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let chatUserId = md5(userUuid);
        let apaasService = new ServiceApaas(roomUuid, userUuid, role);
        accessToken.add_service(apaasService);
        let rtmService = new ServiceRtm(userUuid);
        rtmService.add_privilege(ServiceRtm.kPrivilegeLogin, expire);
        accessToken.add_service(rtmService);
        let chatService = new ServiceChat(chatUserId);
        chatService.add_privilege(ServiceChat.kPrivilegeUser, expire);
        accessToken.add_service(chatService);
        return accessToken.build();
      }
      /**
       * build user token
       * @param appId             The App ID issued to you by Agora. Apply for a new App ID from
       *                          Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate    Certificate of the application that you registered in
       *                          the Agora Dashboard. See Get an App Certificate.
       * @param userUuid          The user's id, must be unique.
       * @param expire            represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                          Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The user token.
       */
      static buildUserToken(appId, appCertificate, userUuid, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let apaasService = new ServiceApaas("", userUuid);
        apaasService.add_privilege(ServiceApaas.PRIVILEGE_USER, expire);
        accessToken.add_service(apaasService);
        return accessToken.build();
      }
      /**
       * build app token
       * @param appId          The App ID issued to you by Agora. Apply for a new App ID from
       *                       Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       *                       the Agora Dashboard. See Get an App Certificate.
       * @param expire         represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                       Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The app token.
       */
      static buildAppToken(appId, appCertificate, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let apaasService = new ServiceApaas();
        apaasService.add_privilege(ServiceApaas.PRIVILEGE_APP, expire);
        accessToken.add_service(apaasService);
        return accessToken.build();
      }
    };
    module.exports.EducationTokenBuilder = EducationTokenBuilder;
  }
});

// node_modules/agora-token/src/FpaTokenBuilder.js
var require_FpaTokenBuilder = __commonJS({
  "node_modules/agora-token/src/FpaTokenBuilder.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceFpa = require_AccessToken2().ServiceFpa;
    var FpaTokenBuilder = class {
      static {
        __name(this, "FpaTokenBuilder");
      }
      /**
       * Build the FPA token.
       * @param appId The App ID issued to you by Agora. Apply for a new App ID from
       * Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       * the Agora Dashboard. See Get an App Certificate.
       * @return The FPA token.
       */
      static buildToken(appId, appCertificate) {
        let token = new AccessToken(appId, appCertificate, 0, 24 * 3600);
        let serviceFpa = new ServiceFpa();
        serviceFpa.add_privilege(ServiceFpa.kPrivilegeLogin, 0);
        token.add_service(serviceFpa);
        return token.build();
      }
    };
    module.exports.FpaTokenBuilder = FpaTokenBuilder;
  }
});

// node_modules/agora-token/src/RtcTokenBuilder2.js
var require_RtcTokenBuilder2 = __commonJS({
  "node_modules/agora-token/src/RtcTokenBuilder2.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceRtc = require_AccessToken2().ServiceRtc;
    var ServiceRtm = require_AccessToken2().ServiceRtm;
    var Role = {
      /**
       * RECOMMENDED. Use this role for a voice/video call or a live broadcast, if
       * your scenario does not require authentication for
       * [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication).
       */
      PUBLISHER: 1,
      /**
       * Only use this role if your scenario require authentication for
       * [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication).
       *
       * @note In order for this role to take effect, please contact our support team
       * to enable authentication for Hosting-in for you. Otherwise, Role_Subscriber
       * still has the same privileges as Role_Publisher.
       */
      SUBSCRIBER: 2
    };
    var RtcTokenBuilder2 = class {
      static {
        __name(this, "RtcTokenBuilder");
      }
      /**
       * Builds an RTC token using an Integer uid.
       * @param {*} appId  The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the AgoraRTC session in the string format. The string length must be less than 64 bytes. Supported character scopes are:
       * - The 26 lowercase English letters: a to z.
       * - The 26 uppercase English letters: A to Z.
       * - The 10 digits: 0 to 9.
       * - The space.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} uid User ID. A 32-bit unsigned integer with a value ranging from 1 to (2^32-1).
       * @param {*} role See #userRole.
       * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
       * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication). In order for this role to take effect, please contact our support team to enable authentication for Co-host for you. Otherwise, Role_Subscriber still has the same privileges as Role_Publisher.
       * @param {*} tokenExpire epresented by the number of seconds elapsed since now. If, for example, you want to access the Agora Service within 10 minutes after the token is generated, set tokenExpire as 600(seconds)
       * @param {*} privilegeExpire represented by the number of seconds elapsed since now. If, for example, you want to enable your privilege for 10 minutes, set privilegeExpire as 600(seconds).
       * @return The RTC Token.
       */
      static buildTokenWithUid(appId, appCertificate, channelName, uid, role, tokenExpire, privilegeExpire = 0) {
        return this.buildTokenWithUserAccount(
          appId,
          appCertificate,
          channelName,
          uid,
          role,
          tokenExpire,
          privilegeExpire
        );
      }
      /**
       * Builds an RTC token with account.
       * @param {*} appId  The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the AgoraRTC session in the string format. The string length must be less than 64 bytes. Supported character scopes are:
       * - The 26 lowercase English letters: a to z.
       * - The 26 uppercase English letters: A to Z.
       * - The 10 digits: 0 to 9.
       * - The space.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} account The user account.
       * @param {*} role See #userRole.
       * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
       * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication). In order for this role to take effect, please contact our support team to enable authentication for Co-host for you. Otherwise, Role_Subscriber still has the same privileges as Role_Publisher.
       * @param {*} tokenExpire epresented by the number of seconds elapsed since now. If, for example, you want to access the Agora Service within 10 minutes after the token is generated, set tokenExpire as 600(seconds)
       * @param {*} privilegeExpire represented by the number of seconds elapsed since now. If, for example, you want to enable your privilege for 10 minutes, set privilegeExpire as 600(seconds).
       * @return The RTC Token.
       */
      static buildTokenWithUserAccount(appId, appCertificate, channelName, account, role, tokenExpire, privilegeExpire = 0) {
        let token = new AccessToken(appId, appCertificate, 0, tokenExpire);
        let serviceRtc = new ServiceRtc(channelName, account);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, privilegeExpire);
        if (role == Role.PUBLISHER) {
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, privilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, privilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, privilegeExpire);
        }
        token.add_service(serviceRtc);
        return token.build();
      }
      /**
       * Generates an RTC token with the specified privilege.
       *
       * This method supports generating a token with the following privileges:
       * - Joining an RTC channel.
       * - Publishing audio in an RTC channel.
       * - Publishing video in an RTC channel.
       * - Publishing data streams in an RTC channel.
       *
       * The privileges for publishing audio, video, and data streams in an RTC channel apply only if you have
       * enabled co-host authentication.
       *
       * A user can have multiple privileges. Each privilege is valid for a maximum of 24 hours.
       * The SDK triggers the onTokenPrivilegeWillExpire and onRequestToken callbacks when the token is about to expire
       * or has expired. The callbacks do not report the specific privilege affected, and you need to maintain
       * the respective timestamp for each privilege in your app logic. After receiving the callback, you need
       * to generate a new token, and then call renewToken to pass the new token to the SDK, or call joinChannel to re-join
       * the channel.
       *
       * @note
       * Agora recommends setting a reasonable timestamp for each privilege according to your scenario.
       * Suppose the expiration timestamp for joining the channel is set earlier than that for publishing audio.
       * When the token for joining the channel expires, the user is immediately kicked off the RTC channel
       * and cannot publish any audio stream, even though the timestamp for publishing audio has not expired.
       *
       * @param appId The App ID of your Agora project.
       * @param appCertificate The App Certificate of your Agora project.
       * @param channelName The unique channel name for the Agora RTC session in string format. The string length must be less than 64 bytes. The channel name may contain the following characters:
       * - All lowercase English letters: a to z.
       * - All uppercase English letters: A to Z.
       * - All numeric characters: 0 to 9.
       * - The space character.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param uid The user ID. A 32-bit unsigned integer with a value range from 1 to (2^32 - 1). It must be unique. Set uid as 0, if you do not want to authenticate the user ID, that is, any uid from the app client can join the channel.
       * @param tokenExpire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set tokenExpire as 600(seconds).
       * @param joinChannelPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to join channel and expect stay in the channel for 10 minutes, set joinChannelPrivilegeExpire as 600(seconds).
       * @param pubAudioPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish audio privilege for 10 minutes, set pubAudioPrivilegeExpire as 600(seconds).
       * @param pubVideoPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish video privilege for 10 minutes, set pubVideoPrivilegeExpire as 600(seconds).
       * @param pubDataStreamPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish data stream privilege for 10 minutes, set pubDataStreamPrivilegeExpire as 600(seconds).
       * @return The RTC Token
       */
      static buildTokenWithUidAndPrivilege(appId, appCertificate, channelName, uid, tokenExpire, joinChannelPrivilegeExpire, pubAudioPrivilegeExpire, pubVideoPrivilegeExpire, pubDataStreamPrivilegeExpire) {
        return this.BuildTokenWithUserAccountAndPrivilege(
          appId,
          appCertificate,
          channelName,
          uid,
          tokenExpire,
          joinChannelPrivilegeExpire,
          pubAudioPrivilegeExpire,
          pubVideoPrivilegeExpire,
          pubDataStreamPrivilegeExpire
        );
      }
      /**
       * Generates an RTC token with the specified privilege.
       *
       * This method supports generating a token with the following privileges:
       * - Joining an RTC channel.
       * - Publishing audio in an RTC channel.
       * - Publishing video in an RTC channel.
       * - Publishing data streams in an RTC channel.
       *
       * The privileges for publishing audio, video, and data streams in an RTC channel apply only if you have
       * enabled co-host authentication.
       *
       * A user can have multiple privileges. Each privilege is valid for a maximum of 24 hours.
       * The SDK triggers the onTokenPrivilegeWillExpire and onRequestToken callbacks when the token is about to expire
       * or has expired. The callbacks do not report the specific privilege affected, and you need to maintain
       * the respective timestamp for each privilege in your app logic. After receiving the callback, you need
       * to generate a new token, and then call renewToken to pass the new token to the SDK, or call joinChannel to re-join
       * the channel.
       *
       * @note
       * Agora recommends setting a reasonable timestamp for each privilege according to your scenario.
       * Suppose the expiration timestamp for joining the channel is set earlier than that for publishing audio.
       * When the token for joining the channel expires, the user is immediately kicked off the RTC channel
       * and cannot publish any audio stream, even though the timestamp for publishing audio has not expired.
       *
       * @param appId The App ID of your Agora project.
       * @param appCertificate The App Certificate of your Agora project.
       * @param channelName The unique channel name for the Agora RTC session in string format. The string length must be less than 64 bytes. The channel name may contain the following characters:
       * - All lowercase English letters: a to z.
       * - All uppercase English letters: A to Z.
       * - All numeric characters: 0 to 9.
       * - The space character.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param userAccount The user account.
       * @param tokenExpire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set tokenExpire as 600(seconds).
       * @param joinChannelPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to join channel and expect stay in the channel for 10 minutes, set joinChannelPrivilegeExpire as 600(seconds).
       * @param pubAudioPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish audio privilege for 10 minutes, set pubAudioPrivilegeExpire as 600(seconds).
       * @param pubVideoPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish video privilege for 10 minutes, set pubVideoPrivilegeExpire as 600(seconds).
       * @param pubDataStreamPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish data stream privilege for 10 minutes, set pubDataStreamPrivilegeExpire as 600(seconds).
       * @return The RTC Token.
       */
      static BuildTokenWithUserAccountAndPrivilege(appId, appCertificate, channelName, account, tokenExpire, joinChannelPrivilegeExpire, pubAudioPrivilegeExpire, pubVideoPrivilegeExpire, pubDataStreamPrivilegeExpire) {
        let token = new AccessToken(appId, appCertificate, 0, tokenExpire);
        let serviceRtc = new ServiceRtc(channelName, account);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, joinChannelPrivilegeExpire);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, pubAudioPrivilegeExpire);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, pubVideoPrivilegeExpire);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, pubDataStreamPrivilegeExpire);
        token.add_service(serviceRtc);
        return token.build();
      }
      /**
       * Build an RTC and RTM token with account.
       * @param {*} appId  The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the AgoraRTC session in the string format. The string length must be less than 64 bytes. Supported character scopes are:
       * - The 26 lowercase English letters: a to z.
       * - The 26 uppercase English letters: A to Z.
       * - The 10 digits: 0 to 9.
       * - The space.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} account The user account.
       * @param {*} role See #userRole.
       * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
       * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication). In order for this role to take effect, please contact our support team to enable authentication for Co-host for you. Otherwise, Role_Subscriber still has the same privileges as Role_Publisher.
       * @param {*} tokenExpire epresented by the number of seconds elapsed since now. If, for example, you want to access the Agora Service within 10 minutes after the token is generated, set tokenExpire as 600(seconds)
       * @param {*} privilegeExpire represented by the number of seconds elapsed since now. If, for example, you want to enable your privilege for 10 minutes, set privilegeExpire as 600(seconds).
       * @return The RTC and RTM Token.
       */
      static buildTokenWithRtm(appId, appCertificate, channelName, account, role, tokenExpire, privilegeExpire = 0) {
        let token = new AccessToken(appId, appCertificate, 0, tokenExpire);
        let serviceRtc = new ServiceRtc(channelName, account);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, privilegeExpire);
        if (role == Role.PUBLISHER) {
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, privilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, privilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, privilegeExpire);
        }
        token.add_service(serviceRtc);
        let serviceRtm = new ServiceRtm(account);
        serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, tokenExpire);
        token.add_service(serviceRtm);
        return token.build();
      }
      /**
       * Build an RTC and RTM token with account.
       * @param {*} appId  The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the AgoraRTC session in the string format. The string length must be less than 64 bytes. Supported character scopes are:
       * - The 26 lowercase English letters: a to z.
       * - The 26 uppercase English letters: A to Z.
       * - The 10 digits: 0 to 9.
       * - The space.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} rtcAccount The RTC user's account, max length is 255 Bytes.
       * @param {*} rtcRole See #userRole.
       * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
       * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication). In order for this role to take effect, please contact our support team to enable authentication for Co-host for you. Otherwise, Role_Subscriber still has the same privileges as Role_Publisher.
       * @param {*} rtcTokenExpire epresented by the number of seconds elapsed since now. If, for example, you want to access the Agora Service within 10 minutes after the token is generated, set tokenExpire as 600(seconds)
       * @param {*} joinChannelPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to join channel and expect stay in the channel for 10 minutes, set joinChannelPrivilegeExpire as 600(seconds).
       * @param {*} pubAudioPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish audio privilege for 10 minutes, set pubAudioPrivilegeExpire as 600(seconds).
       * @param {*} pubVideoPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish video privilege for 10 minutes, set pubVideoPrivilegeExpire as 600(seconds).
       * @param {*} pubDataStreamPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish data stream privilege for 10 minutes, set pubDataStreamPrivilegeExpire as 600(seconds).
       * @param {*} rtmUserId: The RTM user's account, max length is 255 Bytes.
       * @param {*} rtmTokenExpire: represented by the number of seconds elapsed since now. If, for example,
       * you want to access the Agora Service within 10 minutes after the token is generated, set rtmTokenExpire as 600(seconds).
       * * @return The RTC and RTM Token.
       */
      static buildTokenWithRtm2(appId, appCertificate, channelName, rtcAccount, rtcRole, rtcTokenExpire, joinChannelPrivilegeExpire, pubAudioPrivilegeExpire, pubVideoPrivilegeExpire, pubDataStreamPrivilegeExpire, rtmUserId, rtmTokenExpire) {
        let token = new AccessToken(appId, appCertificate, 0, rtcTokenExpire);
        let serviceRtc = new ServiceRtc(channelName, rtcAccount);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, joinChannelPrivilegeExpire);
        if (rtcRole == Role.PUBLISHER) {
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, pubAudioPrivilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, pubVideoPrivilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, pubDataStreamPrivilegeExpire);
        }
        token.add_service(serviceRtc);
        let serviceRtm = new ServiceRtm(rtmUserId);
        serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, rtmTokenExpire);
        token.add_service(serviceRtm);
        return token.build();
      }
    };
    module.exports.RtcTokenBuilder = RtcTokenBuilder2;
    module.exports.Role = Role;
  }
});

// node_modules/agora-token/src/RtmTokenBuilder2.js
var require_RtmTokenBuilder2 = __commonJS({
  "node_modules/agora-token/src/RtmTokenBuilder2.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceRtm = require_AccessToken2().ServiceRtm;
    var RtmTokenBuilder = class {
      static {
        __name(this, "RtmTokenBuilder");
      }
      /**
       * Build the RTM token.
       *
       * @param appId The App ID issued to you by Agora. Apply for a new App ID from
       * Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       * the Agora Dashboard. See Get an App Certificate.
       * @param userId The user's account, max length is 64 Bytes.
       * @param expire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The RTM token.
       */
      static buildToken(appId, appCertificate, userId, expire) {
        let token = new AccessToken(appId, appCertificate, null, expire);
        let serviceRtm = new ServiceRtm(userId);
        serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, expire);
        token.add_service(serviceRtm);
        return token.build();
      }
    };
    module.exports.RtmTokenBuilder = RtmTokenBuilder;
  }
});

// node_modules/agora-token/index.js
var require_agora_token = __commonJS({
  "node_modules/agora-token/index.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = {
      ApaasTokenBuilder: require_ApaasTokenBuilder().ApaasTokenBuilder,
      ChatTokenBuilder: require_ChatTokenBuilder().ChatTokenBuilder,
      EducationTokenBuilder: require_EducationTokenBuilder().EducationTokenBuilder,
      FpaTokenBuilder: require_FpaTokenBuilder().FpaTokenBuilder,
      RtcRole: require_RtcTokenBuilder2().Role,
      RtcTokenBuilder: require_RtcTokenBuilder2().RtcTokenBuilder,
      RtmTokenBuilder: require_RtmTokenBuilder2().RtmTokenBuilder
    };
  }
});

// src/handlers/live-feed.handler.ts
var live_feed_handler_exports = {};
__export(live_feed_handler_exports, {
  batchLiveStats: () => batchLiveStats,
  getLiveByCategory: () => getLiveByCategory,
  getLiveFeed: () => getLiveFeed,
  getTrendingLive: () => getTrendingLive,
  searchLiveStreams: () => searchLiveStreams
});
var getLiveFeed, getTrendingLive, getLiveByCategory, searchLiveStreams, batchLiveStats;
var init_live_feed_handler = __esm({
  "src/handlers/live-feed.handler.ts"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_response_utils();
    init_jwt_utils();
    getLiveFeed = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
      try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const cursor = url.searchParams.get("cursor");
        const followingOnly = url.searchParams.get("followingOnly") === "true";
        const category = url.searchParams.get("category");
        let userId = null;
        const authHeader = request.headers.get("Authorization");
        if (authHeader?.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          try {
            const payload = await verifyToken(token, env2);
            if (payload) {
              userId = payload.userId;
            }
          } catch (e) {
          }
        }
        let query = `
      SELECT 
        ls.id,
        ls.title,
        ls.creator_id as creatorId,
        u.username as creatorName,
        u.avatar_url as creatorAvatarUrl,
        ls.thumbnail_url as thumbnailUrl,
        ls.viewer_count as viewerCount,
        ls.is_live as isLive,
        ls.started_at as startedAt,
        ls.category,
        ls.metadata
      FROM live_streams ls
      JOIN users u ON ls.creator_id = u.id
      WHERE ls.is_live = 1
    `;
        const params = [];
        if (followingOnly && userId) {
          query += ` AND ls.creator_id IN (
        SELECT followed_id FROM followers WHERE follower_id = ?
      )`;
          params.push(userId);
        }
        if (category) {
          query += ` AND ls.category = ?`;
          params.push(category);
        }
        if (cursor) {
          query += ` AND ls.started_at < ?`;
          params.push(cursor);
        }
        query += ` ORDER BY ls.viewer_count DESC, ls.started_at DESC LIMIT ?`;
        params.push(limit + 1);
        const stmt = env2.DB.prepare(query).bind(...params);
        const result = await stmt.all();
        const items = result.results || [];
        const hasMore = items.length > limit;
        const nextCursor = hasMore ? items[limit - 1].startedAt : null;
        const feedItems = items.slice(0, limit);
        if (userId) {
          const creatorIds = feedItems.map((item) => item.creatorId);
          const followingStmt = env2.DB.prepare(`
        SELECT followed_id FROM followers WHERE follower_id = ? AND followed_id IN (${creatorIds.map(() => "?").join(",")})
      `).bind(userId, ...creatorIds);
          const followingResult = await followingStmt.all();
          const followingSet = new Set(followingResult.results?.map((r) => r.followed_id));
          feedItems.forEach((item) => {
            item.isFollowing = followingSet.has(item.creatorId);
          });
        }
        return jsonResponse(true, {
          items: feedItems,
          nextCursor,
          hasMore,
          totalCount: items.length,
          metadata: {
            followingOnly,
            category
          }
        });
      } catch (error3) {
        console.error("Get live feed error:", error3);
        return jsonResponse(false, null, "FEED_ERROR", 500);
      }
    }, "getLiveFeed");
    getTrendingLive = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
      try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const query = `
      SELECT 
        ls.id,
        ls.title,
        ls.creator_id as creatorId,
        u.username as creatorName,
        u.avatar_url as creatorAvatarUrl,
        ls.thumbnail_url as thumbnailUrl,
        ls.viewer_count as viewerCount,
        ls.is_live as isLive,
        ls.started_at as startedAt,
        ls.category,
        ls.metadata,
        (ls.viewer_count * 1.0 + COALESCE(le.like_count, 0) * 2.0 + COALESCE(le.share_count, 0) * 3.0) as engagement_score
      FROM live_streams ls
      JOIN users u ON ls.creator_id = u.id
      LEFT JOIN (
        SELECT 
          stream_id,
          COUNT(CASE WHEN event_type = 'like' THEN 1 END) as like_count,
          COUNT(CASE WHEN event_type = 'share' THEN 1 END) as share_count
        FROM live_events
        WHERE created_at > datetime('now', '-1 hour')
        GROUP BY stream_id
      ) le ON ls.id = le.stream_id
      WHERE ls.is_live = 1
      ORDER BY engagement_score DESC, ls.viewer_count DESC
      LIMIT ?
    `;
        const stmt = env2.DB.prepare(query).bind(limit);
        const result = await stmt.all();
        return jsonResponse(true, {
          items: result.results || [],
          metadata: {
            type: "trending",
            calculatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      } catch (error3) {
        console.error("Get trending live error:", error3);
        return jsonResponse(false, null, "TRENDING_ERROR", 500);
      }
    }, "getTrendingLive");
    getLiveByCategory = /* @__PURE__ */ __name(async (request, env2, _ctx, params) => {
      try {
        const category = params?.category;
        if (!category) {
          return jsonResponse(false, null, "CATEGORY_REQUIRED", 400);
        }
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const query = `
      SELECT 
        ls.id,
        ls.title,
        ls.creator_id as creatorId,
        u.username as creatorName,
        u.avatar_url as creatorAvatarUrl,
        ls.thumbnail_url as thumbnailUrl,
        ls.viewer_count as viewerCount,
        ls.is_live as isLive,
        ls.started_at as startedAt,
        ls.category,
        ls.metadata
      FROM live_streams ls
      JOIN users u ON ls.creator_id = u.id
      WHERE ls.is_live = 1 AND ls.category = ?
      ORDER BY ls.viewer_count DESC, ls.started_at DESC
      LIMIT ?
    `;
        const stmt = env2.DB.prepare(query).bind(category, limit);
        const result = await stmt.all();
        return jsonResponse(true, {
          items: result.results || [],
          category,
          totalCount: result.results?.length || 0
        });
      } catch (error3) {
        console.error("Get live by category error:", error3);
        return jsonResponse(false, null, "CATEGORY_ERROR", 500);
      }
    }, "getLiveByCategory");
    searchLiveStreams = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
      try {
        const url = new URL(request.url);
        const query = url.searchParams.get("q");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        if (!query) {
          return jsonResponse(false, null, "QUERY_REQUIRED", 400);
        }
        const searchQuery = `
      SELECT 
        ls.id,
        ls.title,
        ls.creator_id as creatorId,
        u.username as creatorName,
        u.avatar_url as creatorAvatarUrl,
        ls.thumbnail_url as thumbnailUrl,
        ls.viewer_count as viewerCount,
        ls.is_live as isLive,
        ls.started_at as startedAt,
        ls.category,
        ls.metadata
      FROM live_streams ls
      JOIN users u ON ls.creator_id = u.id
      WHERE ls.is_live = 1 
        AND (
          ls.title LIKE ? 
          OR u.username LIKE ?
          OR ls.category LIKE ?
        )
      ORDER BY ls.viewer_count DESC
      LIMIT ?
    `;
        const searchTerm = `%${query}%`;
        const stmt = env2.DB.prepare(searchQuery).bind(searchTerm, searchTerm, searchTerm, limit);
        const result = await stmt.all();
        return jsonResponse(true, {
          items: result.results || [],
          query,
          totalCount: result.results?.length || 0
        });
      } catch (error3) {
        console.error("Search live streams error:", error3);
        return jsonResponse(false, null, "SEARCH_ERROR", 500);
      }
    }, "searchLiveStreams");
    batchLiveStats = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
      try {
        const body = await request.json();
        const { streamIds } = body;
        if (!streamIds || !Array.isArray(streamIds) || streamIds.length === 0) {
          return jsonResponse(false, null, "STREAM_IDS_REQUIRED", 400);
        }
        const placeholders = streamIds.map(() => "?").join(",");
        const query = `
      SELECT 
        id,
        viewer_count as viewerCount,
        is_live as isLive,
        started_at as startedAt
      FROM live_streams
      WHERE id IN (${placeholders})
    `;
        const stmt = env2.DB.prepare(query).bind(...streamIds);
        const result = await stmt.all();
        const stats = {};
        (result.results || []).forEach((row) => {
          stats[row.id] = {
            viewerCount: row.viewerCount,
            isLive: row.isLive === 1,
            startedAt: row.startedAt
          };
        });
        return jsonResponse(true, { stats });
      } catch (error3) {
        console.error("Batch live stats error:", error3);
        return jsonResponse(false, null, "BATCH_STATS_ERROR", 500);
      }
    }, "batchLiveStats");
  }
});

// .wrangler/tmp/bundle-NeqK1P/middleware-loader.entry.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// .wrangler/tmp/bundle-NeqK1P/middleware-insertion-facade.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/index.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/router.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/utils/otel.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function startSpan(name, tags) {
  return { name, start: Date.now(), tags };
}
__name(startSpan, "startSpan");
async function endSpan(env2, span, endpoint) {
  const duration = Date.now() - span.start;
  try {
    if (endpoint) {
      await env2.DB.prepare("INSERT INTO latency_samples (id, endpoint, p50, p95, ts) VALUES (?1, ?2, ?3, ?4, ?5)").bind(crypto.randomUUID(), endpoint, duration, duration, Date.now()).run();
    }
  } catch (_) {
  }
}
__name(endSpan, "endSpan");
async function instrumentRequest(env2, endpoint, fn) {
  const span = startSpan(endpoint);
  try {
    const res = await fn();
    return res;
  } finally {
    await endSpan(env2, span, endpoint);
  }
}
__name(instrumentRequest, "instrumentRequest");

// src/middleware/auth.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_jwt_utils();

// src/utils/firebase-admin.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var publicKeysCache = null;
async function getFirebasePublicKeys(_env) {
  const now = Date.now();
  if (publicKeysCache && publicKeysCache.expiresAt > now) {
    return publicKeysCache.keys;
  }
  try {
    const response = await fetch(
      "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase public keys: ${response.status}`);
    }
    const jwks = await response.json();
    const keys = {};
    for (const k of jwks.keys) {
      if (k.kid) keys[k.kid] = k;
    }
    const cacheControl = response.headers.get("cache-control");
    const maxAge = cacheControl?.match(/max-age=(\d+)/)?.[1];
    const ttl = maxAge ? parseInt(maxAge) * 1e3 : 24 * 60 * 60 * 1e3;
    publicKeysCache = {
      keys,
      expiresAt: now + ttl
    };
    return keys;
  } catch (error3) {
    console.error("Error fetching Firebase public keys:", error3);
    throw error3;
  }
}
__name(getFirebasePublicKeys, "getFirebasePublicKeys");
async function verifyFirebaseToken(idToken, env2) {
  const span = startSpan("firebase.verifyToken");
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      console.error("Invalid Firebase token format");
      return null;
    }
    const headerStr = atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"));
    const header = JSON.parse(headerStr);
    const kid = header.kid;
    if (!kid) {
      console.error("Firebase token missing kid");
      return null;
    }
    const payloadStr = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadStr);
    const now = Math.floor(Date.now() / 1e3);
    if (payload.exp < now) {
      console.error("Firebase token expired");
      return null;
    }
    if (payload.iat > now + 60) {
      console.error("Firebase token issued in future");
      return null;
    }
    if (env2.FIREBASE_PROJECT_ID && payload.aud !== env2.FIREBASE_PROJECT_ID) {
      console.error("Firebase token audience mismatch");
      return null;
    }
    const publicKeys = await getFirebasePublicKeys(env2);
    const publicKeyJwk = publicKeys[kid];
    if (!publicKeyJwk) {
      console.error(`Firebase public key not found for kid: ${kid}`);
      return null;
    }
    try {
      const cryptoKey = await crypto.subtle.importKey(
        "jwk",
        publicKeyJwk,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"]
      );
      const dataToVerify = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
      const signatureBytes = Uint8Array.from(atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
      const isValid = await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        signatureBytes,
        dataToVerify
      );
      if (!isValid) {
        console.error("Firebase token signature invalid");
        return null;
      }
    } catch (sigErr) {
      console.error("Firebase token signature verification failed:", sigErr);
      return null;
    }
    return {
      userId: payload.user_id,
      email: payload.email,
      emailVerified: payload.email_verified || false,
      provider: payload.firebase.sign_in_provider
    };
  } catch (error3) {
    console.error("Error verifying Firebase token:", error3);
    return null;
  } finally {
    await endSpan(env2, span, "firebase.verifyToken");
  }
}
__name(verifyFirebaseToken, "verifyFirebaseToken");
async function getOrCreateUserFromFirebase(env2, firebaseUser) {
  const span = startSpan("firebase.getOrCreateUser");
  try {
    const existingUser = await env2.DB.prepare(
      "SELECT id, username, email FROM users WHERE firebase_uid = ?1"
    ).bind(firebaseUser.userId).first();
    if (existingUser) {
      return existingUser;
    }
    const userId = crypto.randomUUID();
    const username = `user_${userId.substring(0, 8)}`;
    const email = firebaseUser.email || `${userId}@firebase.local`;
    const displayName = firebaseUser.email?.split("@")[0] || username;
    await env2.DB.prepare(
      `INSERT INTO users (
        id, username, email, password_hash, display_name, 
        firebase_uid, email_verified, followers_count, following_count, 
        likes_count, is_verified, is_premium, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, ?, ?)`
    ).bind(
      userId,
      username,
      email,
      "",
      // No password for Firebase users
      displayName,
      firebaseUser.userId,
      firebaseUser.emailVerified ? 1 : 0,
      Date.now(),
      Date.now()
    ).run();
    console.log(`Created new user from Firebase: ${userId}`, {
      provider: firebaseUser.provider,
      email: firebaseUser.email
    });
    return {
      id: userId,
      username,
      email
    };
  } catch (error3) {
    console.error("Error getting/creating user from Firebase:", error3);
    return null;
  } finally {
    await endSpan(env2, span, "firebase.getOrCreateUser");
  }
}
__name(getOrCreateUserFromFirebase, "getOrCreateUserFromFirebase");
function extractFirebaseToken(authHeader) {
  if (!authHeader) {
    return null;
  }
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return authHeader;
}
__name(extractFirebaseToken, "extractFirebaseToken");

// src/middleware/auth.ts
function requireAuth(handler) {
  return async (request, env2, ctx, params) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Missing authorization header"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const token = extractFirebaseToken(authHeader);
    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid authorization header format"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    try {
      const firebaseUser = await verifyFirebaseToken(token, env2);
      if (firebaseUser) {
        const user = await getOrCreateUserFromFirebase(env2, firebaseUser);
        if (user) {
          request.userId = user.id;
          request.user = user;
          return handler(request, env2, ctx, params);
        }
      }
    } catch (firebaseError) {
      console.log("Firebase verification failed; will attempt JWT fallback");
    }
    try {
      const payload = await verifyToken(token, env2);
      if (payload) {
        request.userId = payload.userId;
        return handler(request, env2, ctx, params);
      }
    } catch (jwtError) {
      console.log("JWT verification failed");
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired token"
        }
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  };
}
__name(requireAuth, "requireAuth");
function optionalAuth(handler) {
  return async (request, env2, ctx, params) => {
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      const token = extractFirebaseToken(authHeader);
      if (token) {
        try {
          const firebaseUser = await verifyFirebaseToken(token, env2);
          if (firebaseUser) {
            const user = await getOrCreateUserFromFirebase(env2, firebaseUser);
            if (user) {
              request.userId = user.id;
              request.user = user;
            }
          }
        } catch {
          try {
            const payload = await verifyToken(token, env2);
            if (payload) {
              request.userId = payload.userId;
            }
          } catch {
          }
        }
      }
    }
    return handler(request, env2, ctx, params);
  };
}
__name(optionalAuth, "optionalAuth");
function rateLimit(maxAttempts, windowSeconds) {
  return (handler) => {
    return async (request, env2, ctx, params) => {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const key = `ratelimit:${ip}:${request.url}`;
      const currentStr = await env2.RATE_LIMIT.get(key);
      const current = currentStr ? parseInt(currentStr) : 0;
      if (current >= maxAttempts) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: `Too many requests. Try again in ${windowSeconds} seconds.`
            }
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      await env2.RATE_LIMIT.put(key, (current + 1).toString(), {
        expirationTtl: windowSeconds
      });
      return handler(request, env2, ctx, params);
    };
  };
}
__name(rateLimit, "rateLimit");

// src/handlers/auth.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/services/db.service.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var DatabaseService = class {
  constructor(env2) {
    this.env = env2;
  }
  static {
    __name(this, "DatabaseService");
  }
  // User operations
  async createUser(user) {
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const fullUser = {
      id,
      ...user,
      followersCount: 0,
      followingCount: 0,
      likesCount: 0,
      isVerified: false,
      isPremium: false,
      createdAt: now,
      updatedAt: now
    };
    try {
      await this.env.DB.prepare(
        `INSERT INTO users (id, username, email, password_hash, display_name, bio, avatar_url, 
         followers_count, following_count, likes_count, is_verified, is_premium, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        fullUser.username,
        fullUser.email,
        fullUser.passwordHash,
        fullUser.displayName,
        fullUser.bio || null,
        fullUser.avatarUrl || null,
        0,
        0,
        0,
        false,
        false,
        now,
        now
      ).run();
      return fullUser;
    } catch (error3) {
      console.error("D1 createUser error:", error3);
      throw error3;
    }
  }
  async getUserByEmail(email) {
    try {
      const result = await this.env.DB.prepare(
        "SELECT * FROM users WHERE email = ?"
      ).bind(email).first();
      if (!result) return null;
      return this.mapDbRowToUser(result);
    } catch (error3) {
      console.error("D1 getUserByEmail error:", error3);
      return null;
    }
  }
  async getUserById(id) {
    try {
      const result = await this.env.DB.prepare(
        "SELECT * FROM users WHERE id = ?"
      ).bind(id).first();
      if (!result) return null;
      return this.mapDbRowToUser(result);
    } catch (error3) {
      console.error("D1 getUserById error:", error3);
      return null;
    }
  }
  // Video operations
  async createVideo(video) {
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const fullVideo = {
      id,
      ...video,
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      processingStatus: "pending",
      createdAt: now,
      updatedAt: now
    };
    try {
      await this.env.DB.prepare(
        `INSERT INTO videos (id, user_id, title, description, video_url, thumbnail_url, 
         duration, width, height, views_count, likes_count, comments_count, shares_count, 
         hashtags, processing_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        fullVideo.userId,
        fullVideo.title,
        fullVideo.description || null,
        fullVideo.videoUrl,
        fullVideo.thumbnailUrl,
        fullVideo.duration,
        fullVideo.width,
        fullVideo.height,
        0,
        0,
        0,
        0,
        fullVideo.hashtags ? JSON.stringify(fullVideo.hashtags) : null,
        "pending",
        now,
        now
      ).run();
      return fullVideo;
    } catch (error3) {
      console.error("D1 createVideo error:", error3);
      throw error3;
    }
  }
  async getVideosForFeed(limit = 20, cursor) {
    try {
      const query = cursor ? `SELECT * FROM videos WHERE processing_status = 'ready' AND created_at < ? 
           ORDER BY created_at DESC LIMIT ?` : `SELECT * FROM videos WHERE processing_status = 'ready' 
           ORDER BY created_at DESC LIMIT ?`;
      const stmt = cursor ? this.env.DB.prepare(query).bind(cursor, limit) : this.env.DB.prepare(query).bind(limit);
      const result = await stmt.all();
      return result.results.map((row) => this.mapDbRowToVideo(row));
    } catch (error3) {
      console.error("D1 getVideosForFeed error:", error3);
      return [];
    }
  }
  // Helper methods
  mapDbRowToUser(row) {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      displayName: row.display_name,
      bio: row.bio,
      avatarUrl: row.avatar_url,
      followersCount: row.followers_count || 0,
      followingCount: row.following_count || 0,
      likesCount: row.likes_count || 0,
      isVerified: Boolean(row.is_verified),
      isPremium: Boolean(row.is_premium),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
  mapDbRowToVideo(row) {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      videoUrl: row.video_url,
      thumbnailUrl: row.thumbnail_url,
      duration: row.duration,
      width: row.width,
      height: row.height,
      viewsCount: row.views_count || 0,
      likesCount: row.likes_count || 0,
      commentsCount: row.comments_count || 0,
      sharesCount: row.shares_count || 0,
      hashtags: row.hashtags ? JSON.parse(row.hashtags) : void 0,
      processingStatus: row.processing_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
};

// src/utils/hash.utils.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordData = encoder.encode(password);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const saltArray = Array.from(salt);
  const saltHex = saltArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `$pbkdf2$${saltHex}$${hashHex}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, hash) {
  if (hash.startsWith("$pbkdf2$")) {
    const parts = hash.split("$");
    if (parts.length !== 4) return false;
    const saltHex = parts[2];
    const storedHashHex = parts[3];
    const salt = new Uint8Array(
      saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 1e5,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex === storedHashHex;
  }
  if (hash.startsWith("$sha256$")) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `$sha256$${hashHex}` === hash;
  }
  return false;
}
__name(verifyPassword, "verifyPassword");

// src/handlers/auth.handler.ts
init_jwt_utils();
var register = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body.username || !body.email || !body.password || !body.displayName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing required fields"
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const db = new DatabaseService(env2);
    const existingUser = await db.getUserByEmail(body.email);
    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "USER_EXISTS",
            message: "User with this email already exists"
          }
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const passwordHash = await hashPassword(body.password);
    const user = await db.createUser({
      username: body.username,
      email: body.email,
      passwordHash,
      displayName: body.displayName,
      followersCount: 0,
      followingCount: 0,
      likesCount: 0,
      isVerified: false,
      isPremium: false
    });
    const accessToken = await generateToken(user.id, "access", env2);
    const refreshToken = await generateToken(user.id, "refresh", env2);
    const { passwordHash: _, ...userWithoutPassword } = user;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: userWithoutPassword,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error3) {
    console.error("Register error:", error3);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to register user"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "register");
var login = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body.email || !body.password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email and password are required"
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const db = new DatabaseService(env2);
    const user = await db.getUserByEmail(body.email);
    if (!user) {
      const failKey = `authfail:${body.email.toLowerCase()}`;
      const failuresRaw = await env2.RATE_LIMIT.get(failKey);
      const failures = failuresRaw ? Number.parseInt(failuresRaw, 10) : 0;
      const newFailures = failures + 1;
      await env2.RATE_LIMIT.put(failKey, newFailures.toString(), { expirationTtl: 1800 });
      if (newFailures >= 10) {
        await env2.RATE_LIMIT.put(`lock:${body.email.toLowerCase()}`, "1", { expirationTtl: 1800 });
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const lock = await env2.RATE_LIMIT.get(`lock:${body.email.toLowerCase()}`);
    if (lock) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "ACCOUNT_LOCKED",
            message: "Too many failed attempts. Try again later."
          }
        }),
        { status: 423, headers: { "Content-Type": "application/json" } }
      );
    }
    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      const failKey = `authfail:${body.email.toLowerCase()}`;
      const failuresRaw = await env2.RATE_LIMIT.get(failKey);
      const failures = failuresRaw ? Number.parseInt(failuresRaw, 10) : 0;
      const newFailures = failures + 1;
      await env2.RATE_LIMIT.put(failKey, newFailures.toString(), { expirationTtl: 1800 });
      if (newFailures >= 10) {
        await env2.RATE_LIMIT.put(`lock:${body.email.toLowerCase()}`, "1", { expirationTtl: 1800 });
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const accessToken = await generateToken(user.id, "access", env2);
    const refreshToken = await generateToken(user.id, "refresh", env2);
    await env2.RATE_LIMIT.delete(`authfail:${body.email.toLowerCase()}`);
    await env2.RATE_LIMIT.delete(`lock:${body.email.toLowerCase()}`);
    const { passwordHash: _, ...userWithoutPassword } = user;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: userWithoutPassword,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error3) {
    console.error("Login error:", error3);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to login"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "login");
var logout = /* @__PURE__ */ __name(async (_request, _env, _ctx, _params) => {
  return new Response(
    JSON.stringify({
      success: true,
      data: { message: "Logged out successfully" }
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}, "logout");
var refresh = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  try {
    console.log("[refresh] Starting refresh token handler");
    console.log("[refresh] env.JWT_SECRET exists:", !!env2.JWT_SECRET);
    console.log("[refresh] env keys:", Object.keys(env2));
    const body = await request.json().catch(() => ({}));
    const refreshToken = body.refreshToken;
    console.log("[refresh] Received refreshToken:", refreshToken ? `${refreshToken.substring(0, 20)}...` : "MISSING");
    if (!refreshToken) {
      console.log("[refresh] Validation failed: no refreshToken provided");
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "refreshToken required" }
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("[refresh] Verifying token...");
    const payload = await verifyToken(refreshToken, env2);
    console.log("[refresh] Token verification result:", payload ? `userId=${payload.userId}, type=${payload.type}` : "NULL");
    if (!payload || payload.type !== "refresh") {
      console.log("[refresh] Token invalid or wrong type");
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Invalid refresh token" }
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("[refresh] Generating new tokens for userId:", payload.userId);
    const newAccess = await generateToken(payload.userId, "access", env2);
    console.log("[refresh] Generated new access token:", newAccess ? `${newAccess.substring(0, 20)}...` : "FAILED");
    const newRefresh = await generateToken(payload.userId, "refresh", env2);
    console.log("[refresh] Generated new refresh token:", newRefresh ? `${newRefresh.substring(0, 20)}...` : "FAILED");
    return new Response(
      JSON.stringify({
        success: true,
        data: { tokens: { accessToken: newAccess, refreshToken: newRefresh } }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error3) {
    console.error("[refresh] Exception caught:", error3);
    console.error("[refresh] Error stack:", error3 instanceof Error ? error3.stack : "No stack");
    console.error("[refresh] Error message:", error3 instanceof Error ? error3.message : String(error3));
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to refresh token" }
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}, "refresh");

// src/handlers/feed.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/services/feed.service.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var FeedService = class {
  constructor(env2) {
    this.env = env2;
  }
  static {
    __name(this, "FeedService");
  }
  /**
   * Get personalized For You feed with AI-based ranking
   * Algorithm factors:
   * - User engagement history (likes, comments, shares, watch time)
   * - Content freshness (recency bias)
   * - Creator diversity (avoid single-creator dominance)
   * - Trending signals (viral content boost)
   * - User preferences and interests
   */
  async getForYouFeed(userId, limit = 20, cursor) {
    try {
      if (userId) {
        return await this.getPersonalizedFeed(userId, limit, cursor);
      }
      return await this.getTrendingFeed(limit, cursor);
    } catch (error3) {
      console.error("Get For You feed error:", error3);
      throw error3;
    }
  }
  /**
   * Personalized feed for authenticated users
   */
  async getPersonalizedFeed(userId, limit, cursor) {
    const query = `
      WITH user_engagement AS (
        SELECT 
          video_id,
          COUNT(*) as engagement_count
        FROM (
          SELECT video_id FROM likes WHERE user_id = ?
          UNION ALL
          SELECT video_id FROM comments WHERE user_id = ?
        )
        GROUP BY video_id
      ),
      user_following AS (
        SELECT following_id FROM followers WHERE follower_id = ?
      ),
      video_scores AS (
        SELECT 
          v.id,
          v.user_id,
          v.title,
          v.description,
          v.video_url,
          v.thumbnail_url,
          v.duration,
          v.views_count,
          v.likes_count,
          v.comments_count,
          v.shares_count,
          v.created_at,
          u.username,
          u.display_name,
          u.avatar_url,
          u.is_verified,
          -- Engagement score (40% weight)
          (v.likes_count * 3 + v.comments_count * 5 + v.shares_count * 7) * 0.4 AS engagement_score,
          -- Freshness score (30% weight) - decay over time
          (1.0 / (1.0 + (julianday('now') - julianday(v.created_at)) / 7.0)) * 0.3 AS freshness_score,
          -- Following boost (20% weight)
          CASE WHEN uf.following_id IS NOT NULL THEN 0.2 ELSE 0 END AS following_score,
          -- Viral potential (10% weight)
          CASE 
            WHEN v.views_count > 0 THEN 
              ((v.likes_count + v.comments_count * 2.0) / v.views_count) * 0.1
            ELSE 0
          END AS viral_score
        FROM videos v
        LEFT JOIN users u ON v.user_id = u.id
        LEFT JOIN user_following uf ON v.user_id = uf.following_id
        LEFT JOIN user_engagement ue ON v.id = ue.video_id
        WHERE 
          v.processing_status = 'completed'
          AND ue.video_id IS NULL  -- Exclude already engaged videos
          AND v.user_id != ?  -- Exclude own videos
      )
      SELECT 
        *,
        (engagement_score + freshness_score + following_score + viral_score) AS total_score
      FROM video_scores
      ORDER BY total_score DESC, created_at DESC, id DESC
      LIMIT ?
    `;
    const prepared = this.env.DB.prepare(
      cursor ? query.replace(
        "WHERE \n          v.processing_status = 'completed'\n          AND ue.video_id IS NULL  -- Exclude already engaged videos\n          AND v.user_id != ?  -- Exclude own videos",
        "WHERE \n          v.processing_status = 'completed'\n          AND ue.video_id IS NULL  -- Exclude already engaged videos\n          AND v.user_id != ?  -- Exclude own videos\n          AND v.created_at < ?"
      ) : query
    );
    const results = cursor ? await prepared.bind(userId, userId, userId, userId, cursor, limit + 1).all() : await prepared.bind(userId, userId, userId, userId, limit + 1).all();
    const hasMore = results.results.length > limit;
    const videos = results.results.slice(0, limit).map(this.mapVideoRow);
    return {
      videos,
      cursor: hasMore ? videos.at(-1)?.createdAt ?? null : null
    };
  }
  /**
   * Trending feed for anonymous users
   */
  async getTrendingFeed(limit, cursor) {
    const query = `
      SELECT 
        v.id,
        v.user_id,
        v.title,
        v.description,
        v.video_url,
        v.thumbnail_url,
        v.duration,
        v.views_count,
        v.likes_count,
        v.comments_count,
        v.shares_count,
        v.created_at,
        u.username,
        u.display_name,
        u.avatar_url,
        u.is_verified,
        -- Trending score: engagement rate \xD7 freshness
        ((v.likes_count + v.comments_count * 2 + v.shares_count * 3) / (1.0 + v.views_count)) *
        (1.0 / (1.0 + (julianday('now') - julianday(v.created_at)) / 3.0)) AS trending_score
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE 
        v.processing_status = 'completed'
        AND v.created_at > datetime('now', '-7 days')  -- Only last 7 days
      ORDER BY trending_score DESC, v.created_at DESC, v.id DESC
      LIMIT ?
    `;
    const prepared = this.env.DB.prepare(
      cursor ? query.replace(
        "WHERE \n        v.processing_status = 'completed'\n        AND v.created_at > datetime('now', '-7 days')  -- Only last 7 days",
        "WHERE \n        v.processing_status = 'completed'\n        AND v.created_at > datetime('now', '-7 days')  -- Only last 7 days\n        AND v.created_at < ?"
      ) : query
    );
    const results = cursor ? await prepared.bind(cursor, limit + 1).all() : await prepared.bind(limit + 1).all();
    const hasMore = results.results.length > limit;
    const videos = results.results.slice(0, limit).map(this.mapVideoRow);
    return {
      videos,
      cursor: hasMore ? videos.at(-1)?.createdAt ?? null : null
    };
  }
  /**
   * Get Following feed (chronological from followed users)
   */
  async getFollowingFeed(userId, limit = 20, cursor) {
    const query = `
      SELECT 
        v.id,
        v.user_id,
        v.title,
        v.description,
        v.video_url,
        v.thumbnail_url,
        v.duration,
        v.views_count,
        v.likes_count,
        v.comments_count,
        v.shares_count,
        v.created_at,
        u.username,
        u.display_name,
        u.avatar_url,
        u.is_verified
      FROM videos v
      INNER JOIN followers f ON v.user_id = f.following_id
      LEFT JOIN users u ON v.user_id = u.id
      WHERE 
        f.follower_id = ?
        AND v.processing_status = 'completed'
      ORDER BY v.created_at DESC, v.id DESC
      LIMIT ?
    `;
    const prepared = this.env.DB.prepare(
      cursor ? query.replace(
        "WHERE \n        f.follower_id = ?\n        AND v.processing_status = 'completed'",
        "WHERE \n        f.follower_id = ?\n        AND v.processing_status = 'completed'\n        AND v.created_at < ?"
      ) : query
    );
    const results = cursor ? await prepared.bind(userId, cursor, limit + 1).all() : await prepared.bind(userId, limit + 1).all();
    const hasMore = results.results.length > limit;
    const videos = results.results.slice(0, limit).map(this.mapVideoRow);
    return {
      videos,
      cursor: hasMore ? videos.at(-1)?.createdAt ?? null : null
    };
  }
  /**
   * Map database row to video object
   */
  mapVideoRow(row) {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      videoUrl: row.video_url,
      thumbnailUrl: row.thumbnail_url,
      duration: row.duration,
      viewsCount: row.views_count || 0,
      likesCount: row.likes_count || 0,
      commentsCount: row.comments_count || 0,
      sharesCount: row.shares_count || 0,
      createdAt: row.created_at,
      creator: {
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        isVerified: Boolean(row.is_verified)
      }
    };
  }
  /**
   * Update video engagement metrics (for feed ranking)
   */
  async updateEngagementMetrics(videoId) {
    try {
      await this.env.DB.prepare(
        `UPDATE videos 
         SET engagement_score = (likes_count * 3 + comments_count * 5 + shares_count * 7)
         WHERE id = ?`
      ).bind(videoId).run();
    } catch (error3) {
      console.error("Update engagement metrics error:", error3);
    }
  }
};

// src/services/cache.service.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var CacheService = class {
  constructor(env2) {
    this.env = env2;
  }
  static {
    __name(this, "CacheService");
  }
  // Cache TTL strategies (in seconds)
  TTL = {
    HOT: 60,
    // 1 minute - frequently changing data
    FEED: 300,
    // 5 minutes - feed data
    PROFILE: 600,
    // 10 minutes - user profiles
    STATIC: 3600,
    // 1 hour - relatively static data
    LONG: 86400
    // 24 hours - rarely changing data
  };
  /**
   * Get cached value
   */
  async get(key) {
    try {
      const value = await this.env.CACHE.get(key, "json");
      return value;
    } catch (error3) {
      console.error("Cache get error:", error3);
      return null;
    }
  }
  /**
   * Set cached value with TTL
   */
  async set(key, value, ttl = this.TTL.FEED) {
    try {
      await this.env.CACHE.put(key, JSON.stringify(value), {
        expirationTtl: ttl
      });
    } catch (error3) {
      console.error("Cache set error:", error3);
    }
  }
  /**
   * Delete cached value
   */
  async delete(key) {
    try {
      await this.env.CACHE.delete(key);
    } catch (error3) {
      console.error("Cache delete error:", error3);
    }
  }
  /**
   * Cache user profile
   */
  async cacheUserProfile(userId, profile3) {
    await this.set(`user:${userId}`, profile3, this.TTL.PROFILE);
  }
  /**
   * Get cached user profile
   */
  async getUserProfile(userId) {
    return await this.get(`user:${userId}`);
  }
  /**
   * Cache video metadata
   */
  async cacheVideo(videoId, video) {
    await this.set(`video:${videoId}`, video, this.TTL.STATIC);
  }
  /**
   * Get cached video
   */
  async getVideo(videoId) {
    return await this.get(`video:${videoId}`);
  }
  /**
   * Cache For You feed
   */
  async cacheFeed(userId, videos) {
    const key = userId ? `feed:foryou:${userId}` : "feed:foryou:anonymous";
    await this.set(key, videos, this.TTL.FEED);
  }
  /**
   * Get cached feed
   */
  async getFeed(userId) {
    const key = userId ? `feed:foryou:${userId}` : "feed:foryou:anonymous";
    return await this.get(key);
  }
  /**
   * Invalidate user cache (on profile update)
   */
  async invalidateUser(userId) {
    await this.delete(`user:${userId}`);
  }
  /**
   * Invalidate video cache (on update/delete)
   */
  async invalidateVideo(videoId) {
    await this.delete(`video:${videoId}`);
  }
  /**
   * Invalidate feed cache (on new video upload)
   */
  async invalidateFeed(userId) {
    const key = userId ? `feed:foryou:${userId}` : "feed:foryou:anonymous";
    await this.delete(key);
  }
  /**
   * Get or set with cache-aside pattern
   */
  async getOrSet(key, fetchFn, ttl = this.TTL.FEED) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }
    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }
};

// src/utils/otel_wrapper.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function withSpan(handler, name) {
  return async (request, env2, ctx, params) => {
    const spanName = name || `${request.method} ${new URL(request.url).pathname}`;
    return instrumentRequest(env2, spanName, () => handler(request, env2, ctx, params));
  };
}
__name(withSpan, "withSpan");

// src/handlers/feed.handler.ts
var parseFeedQuery = /* @__PURE__ */ __name((url) => {
  const rawLimit = url.searchParams.get("limit");
  let limit = Number.parseInt(rawLimit ?? "20", 10);
  if (!Number.isFinite(limit)) limit = 20;
  if (limit < 5) limit = 5;
  if (limit > 50) limit = 50;
  const cursor = url.searchParams.get("cursor") || void 0;
  if (cursor && !/^[-:TZ0-9.]+$/.test(cursor)) {
    return { limit };
  }
  return { limit, cursor };
}, "parseFeedQuery");
var forYouCore = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  try {
    const url = new URL(request.url);
    const { limit, cursor } = parseFeedQuery(url);
    const authHeader = request.headers.get("Authorization");
    let userId = null;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { verifyToken: verifyToken2 } = await Promise.resolve().then(() => (init_jwt_utils(), jwt_utils_exports));
        const payload = await verifyToken2(authHeader.substring(7), env2);
        userId = payload?.userId || null;
      } catch {
      }
    }
    const cache = new CacheService(env2);
    const feedService = new FeedService(env2);
    if (!userId) {
      const cached = await cache.getFeed(null);
      if (cached) {
        return new Response(
          JSON.stringify({
            success: true,
            data: { videos: cached, cursor: null }
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }
    const result = await feedService.getForYouFeed(userId, limit, cursor);
    console.log("[obs.feed.forYou]", JSON.stringify({ ts: Date.now(), authed: !!userId, limit, hasCursor: !!cursor, count: result.videos.length }));
    if (!userId && result.videos.length > 0) {
      _ctx?.waitUntil(cache.cacheFeed(null, result.videos));
    }
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (_error) {
    console.error("[obs.feed.forYou.error]", JSON.stringify({ ts: Date.now(), code: "INTERNAL_ERROR", message: "Failed to load feed" }));
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to load feed"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "forYouCore");
var forYou = withSpan(forYouCore, "feed.forYou");
var followingCore = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const { verifyToken: verifyToken2 } = await Promise.resolve().then(() => (init_jwt_utils(), jwt_utils_exports));
    const payload = await verifyToken2(authHeader.substring(7), env2);
    if (!payload) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid token"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const url = new URL(request.url);
    const { limit, cursor } = parseFeedQuery(url);
    const feedService = new FeedService(env2);
    const result = await feedService.getFollowingFeed(payload.userId, limit, cursor ?? void 0);
    console.log("[obs.feed.following]", JSON.stringify({ ts: Date.now(), user: !!payload.userId, limit, hasCursor: !!cursor, count: result.videos.length }));
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (_error) {
    console.error("[obs.feed.following.error]", JSON.stringify({ ts: Date.now(), code: "INTERNAL_ERROR", message: "Failed to load following feed" }));
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to load following feed"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "followingCore");
var following = withSpan(followingCore, "feed.following");

// src/handlers/video.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/services/storage.service.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var StorageService = class {
  constructor(env2) {
    this.env = env2;
  }
  static {
    __name(this, "StorageService");
  }
  /**
   * Upload file to R2 bucket
   * @param key - Object key (path) in bucket
   * @param data - File data as ArrayBuffer, ReadableStream, or string
   * @param contentType - MIME type
   */
  async upload(key, data, contentType) {
    try {
      await this.env.R2.put(key, data, {
        httpMetadata: {
          contentType
        }
      });
      return `https://storage.spaktok.com/${key}`;
    } catch (error3) {
      console.error("R2 upload error:", error3);
      throw new Error("Failed to upload file");
    }
  }
  /**
   * Upload video with multiple quality versions
   */
  async uploadVideo(videoId, videoData, contentType = "video/mp4") {
    const key = `videos/${videoId}/original.mp4`;
    const url = await this.upload(key, videoData, contentType);
    return { url, key };
  }
  /**
   * Upload thumbnail image
   */
  async uploadThumbnail(videoId, thumbnailData, contentType = "image/jpeg") {
    const key = `thumbnails/${videoId}/thumb.jpg`;
    const url = await this.upload(key, thumbnailData, contentType);
    return { url, key };
  }
  /**
   * Upload user avatar
   */
  async uploadAvatar(userId, avatarData, contentType = "image/jpeg") {
    const key = `avatars/${userId}/avatar.jpg`;
    const url = await this.upload(key, avatarData, contentType);
    return { url, key };
  }
  /**
   * Get file from R2
   */
  async get(key) {
    try {
      return await this.env.R2.get(key);
    } catch (error3) {
      console.error("R2 get error:", error3);
      return null;
    }
  }
  /**
   * Delete file from R2
   */
  async delete(key) {
    try {
      await this.env.R2.delete(key);
    } catch (error3) {
      console.error("R2 delete error:", error3);
      throw new Error("Failed to delete file");
    }
  }
  /**
   * Generate presigned URL for direct upload (future enhancement)
   */
  async generateUploadUrl(key, expiresIn = 3600) {
    return `https://api.spaktok.com/upload?key=${encodeURIComponent(key)}`;
  }
};

// src/services/analytics.service.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var AnalyticsService = class {
  constructor(env2) {
    this.env = env2;
  }
  static {
    __name(this, "AnalyticsService");
  }
  /**
   * Log API request metrics
   */
  async logRequest(endpoint, method, statusCode, duration, userId) {
    if (!this.env.ANALYTICS) return;
    try {
      await this.env.ANALYTICS.writeDataPoint({
        blobs: [endpoint, method, statusCode.toString()],
        doubles: [duration],
        indexes: [userId || "anonymous"]
      });
    } catch (error3) {
      console.error("Analytics logging error:", error3);
    }
  }
  /**
   * Log video view
   */
  async logVideoView(videoId, userId) {
    if (!this.env.ANALYTICS) return;
    try {
      await this.env.ANALYTICS.writeDataPoint({
        blobs: ["video_view", videoId],
        doubles: [Date.now()],
        indexes: [userId || "anonymous"]
      });
    } catch (error3) {
      console.error("Analytics logging error:", error3);
    }
  }
  /**
   * Log video upload
   */
  async logVideoUpload(videoId, userId, fileSize, duration) {
    if (!this.env.ANALYTICS) return;
    try {
      await this.env.ANALYTICS.writeDataPoint({
        blobs: ["video_upload", videoId, userId],
        doubles: [fileSize, duration],
        indexes: [userId]
      });
    } catch (error3) {
      console.error("Analytics logging error:", error3);
    }
  }
  /**
   * Log user action (like, comment, follow)
   */
  async logUserAction(action, userId, targetId) {
    if (!this.env.ANALYTICS) return;
    try {
      await this.env.ANALYTICS.writeDataPoint({
        blobs: [action, userId, targetId],
        doubles: [Date.now()],
        indexes: [userId]
      });
    } catch (error3) {
      console.error("Analytics logging error:", error3);
    }
  }
};

// src/services/video-processing.service.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var VideoProcessingService = class {
  constructor(env2) {
    this.env = env2;
  }
  static {
    __name(this, "VideoProcessingService");
  }
  TRANSCODING_PROFILES = [
    {
      quality: "360p",
      resolution: { width: 640, height: 360 },
      bitrate: 8e5,
      fps: 30
    },
    {
      quality: "720p",
      resolution: { width: 1280, height: 720 },
      bitrate: 25e5,
      fps: 30
    },
    {
      quality: "1080p",
      resolution: { width: 1920, height: 1080 },
      bitrate: 5e6,
      fps: 60
    },
    {
      quality: "4k",
      resolution: { width: 3840, height: 2160 },
      bitrate: 2e7,
      fps: 60
    }
  ];
  THUMBNAIL_CONFIG = {
    positions: [0, 25, 50, 75, 100],
    sizes: [
      { width: 320, height: 180, name: "small" },
      { width: 640, height: 360, name: "medium" },
      { width: 1280, height: 720, name: "large" }
    ]
  };
  /**
   * Start video processing pipeline
   * Returns immediately, processing happens asynchronously
   */
  async startProcessing(videoId, userId, sourceUrl, originalSize) {
    const job = {
      videoId,
      userId,
      sourceUrl,
      originalSize,
      startTime: (/* @__PURE__ */ new Date()).toISOString(),
      status: "pending"
    };
    await this.env.CACHE.put(
      `processing:${videoId}`,
      JSON.stringify(job),
      { expirationTtl: 3600 }
      // 1 hour
    );
    await this.env.DB.prepare(
      "UPDATE videos SET processing_status = ?, updated_at = ? WHERE id = ?"
    ).bind("processing", (/* @__PURE__ */ new Date()).toISOString(), videoId).run();
  }
  /**
   * Process video with GPU transcoding
   * This is a placeholder - actual implementation would use:
   * - Cloudflare Stream API
   * - GPU Workers for transcoding
   * - ffmpeg with GPU acceleration
   */
  async transcodeVideo(videoId, sourceUrl) {
    try {
      const variants = this.TRANSCODING_PROFILES.map((profile3) => ({
        quality: profile3.quality,
        url: `${sourceUrl.replace(".mp4", "")}_${profile3.quality}.mp4`,
        size: Math.floor(this.estimateSize(profile3))
      }));
      const duration = 60;
      await this.env.DB.prepare(
        `INSERT INTO video_variants (video_id, quality, url, size, created_at)
         VALUES ${variants.map(() => "(?, ?, ?, ?, ?)").join(", ")}`
      ).bind(
        ...variants.flatMap((v) => [
          videoId,
          v.quality,
          v.url,
          v.size,
          (/* @__PURE__ */ new Date()).toISOString()
        ])
      ).run();
      return { variants, duration };
    } catch (error3) {
      console.error("Transcoding error:", error3);
      throw error3;
    }
  }
  /**
   * Generate thumbnails at key positions
   */
  async generateThumbnails(videoId, _sourceUrl) {
    try {
      const thumbnails = [];
      for (const position of this.THUMBNAIL_CONFIG.positions) {
        for (const size of this.THUMBNAIL_CONFIG.sizes) {
          thumbnails.push({
            position,
            url: `https://cdn.spaktok.com/thumbnails/${videoId}/p${position}_${size.name}.jpg`,
            size: size.name
          });
        }
      }
      const selected = thumbnails.find((t) => t.position === 25 && t.size === "large").url;
      await this.env.DB.prepare(
        "UPDATE videos SET thumbnail_url = ? WHERE id = ?"
      ).bind(selected, videoId).run();
      return { thumbnails, selected };
    } catch (error3) {
      console.error("Thumbnail generation error:", error3);
      throw error3;
    }
  }
  /**
   * Extract video metadata
   */
  async extractMetadata(videoId, _sourceUrl) {
    try {
      const metadata = {
        duration: 60,
        width: 1080,
        height: 1920,
        fps: 60,
        codec: "h264",
        bitrate: 5e6,
        size: 375e5
        // ~37.5 MB for 60s
      };
      await this.env.DB.prepare(
        `UPDATE videos SET 
         duration = ?, width = ?, height = ?, 
         updated_at = ?
         WHERE id = ?`
      ).bind(
        metadata.duration,
        metadata.width,
        metadata.height,
        (/* @__PURE__ */ new Date()).toISOString(),
        videoId
      ).run();
      return metadata;
    } catch (error3) {
      console.error("Metadata extraction error:", error3);
      throw error3;
    }
  }
  /**
   * Complete processing pipeline
   */
  async completeProcessing(videoId) {
    try {
      const video = await this.env.DB.prepare(
        "SELECT video_url FROM videos WHERE id = ?"
      ).bind(videoId).first();
      if (!video) {
        throw new Error("Video not found");
      }
      const sourceUrl = video.video_url;
      const metadata = await this.extractMetadata(videoId, sourceUrl);
      const { variants, duration } = await this.transcodeVideo(videoId, sourceUrl);
      const { thumbnails, selected } = await this.generateThumbnails(videoId, sourceUrl);
      await this.env.DB.prepare(
        `UPDATE videos SET 
         processing_status = ?,
         duration = ?,
         thumbnail_url = ?,
         updated_at = ?
         WHERE id = ?`
      ).bind(
        "completed",
        duration,
        selected,
        (/* @__PURE__ */ new Date()).toISOString(),
        videoId
      ).run();
      await this.env.CACHE.delete(`processing:${videoId}`);
      await this.logProcessingComplete(videoId, metadata, variants.length, thumbnails.length);
    } catch (error3) {
      console.error("Complete processing error:", error3);
      await this.failProcessing(videoId, error3);
    }
  }
  /**
   * Mark processing as failed
   */
  async failProcessing(videoId, error3) {
    await this.env.DB.prepare(
      "UPDATE videos SET processing_status = ? WHERE id = ?"
    ).bind("failed", videoId).run();
    await this.env.CACHE.put(
      `processing:error:${videoId}`,
      JSON.stringify({ error: String(error3), timestamp: (/* @__PURE__ */ new Date()).toISOString() }),
      { expirationTtl: 86400 }
      // 24 hours
    );
  }
  /**
   * Get processing status
   */
  async getProcessingStatus(videoId) {
    const jobData = await this.env.CACHE.get(`processing:${videoId}`);
    return jobData ? JSON.parse(jobData) : null;
  }
  /**
   * Log processing analytics
   */
  async logProcessingComplete(videoId, metadata, variantCount, thumbnailCount) {
    await this.env.DB.prepare(
      `INSERT INTO video_processing_logs (
        video_id, duration, variants_created, thumbnails_created,
        original_size, processing_time, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      videoId,
      metadata.duration,
      variantCount,
      thumbnailCount,
      metadata.size,
      0,
      // Calculate from start time
      (/* @__PURE__ */ new Date()).toISOString()
    ).run();
  }
  /**
   * Estimate transcoded file size
   */
  estimateSize(profile3) {
    return profile3.bitrate * 60 / 8;
  }
};

// src/middleware.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/utils/guard.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/utils/region_age_policy.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var DEFAULT_REGION_AGE_POLICY = {
  "US": { minimumAge: 13, policyName: "COPPA", notes: "Children Online Privacy Protection Act" },
  "EU": { minimumAge: 16, residencyRequired: true, policyName: "GDPR", notes: "General Data Protection Regulation" },
  "UK": { minimumAge: 13, residencyRequired: true, policyName: "DSA", notes: "Digital Services Act" },
  "CA": { minimumAge: 13, policyName: "PIPEDA" },
  "BR": { minimumAge: 12, policyName: "LGPD" },
  "IN": { minimumAge: 18, policyName: "IT Rules" },
  "RU": { minimumAge: 14, policyName: "FZ-152" },
  "CN": { minimumAge: 14, policyName: "PIPL" },
  "KR": { minimumAge: 14, policyName: "PIPA" },
  "JP": { minimumAge: 13, policyName: "APPI" },
  "GLOBAL": { minimumAge: 13, policyName: "Default" }
};
async function loadRegionAgePolicy(env2) {
  try {
    if (env2.CONFIG) {
      const raw = await env2.CONFIG.get("REGION_AGE_POLICY", "json");
      if (raw && typeof raw === "object") return raw;
    }
  } catch {
  }
  return DEFAULT_REGION_AGE_POLICY;
}
__name(loadRegionAgePolicy, "loadRegionAgePolicy");
function resolveUserRegion({ ip: _ip, locale, profileRegion }) {
  if (profileRegion) return profileRegion;
  if (locale && locale.length >= 2) return locale.slice(-2).toUpperCase();
  return "GLOBAL";
}
__name(resolveUserRegion, "resolveUserRegion");
function getMinimumAgeForRegion(policy, region) {
  return policy[region]?.minimumAge ?? policy["GLOBAL"].minimumAge;
}
__name(getMinimumAgeForRegion, "getMinimumAgeForRegion");
function isResidencyRequired(policy, region) {
  return !!policy[region]?.residencyRequired;
}
__name(isResidencyRequired, "isResidencyRequired");

// src/utils/guard.ts
async function ensureMinimumAgeRegionAware(env2, userId, userContext) {
  const policy = await loadRegionAgePolicy(env2);
  const region = resolveUserRegion(userContext);
  const requiredAge = getMinimumAgeForRegion(policy, region);
  const residencyRequired = isResidencyRequired(policy, region);
  const policyName = policy[region]?.policyName;
  let requiredClass = "u13";
  if (requiredAge >= 18) requiredClass = "u18";
  else if (requiredAge >= 16) requiredClass = "u16";
  if (requiredAge >= 21) requiredClass = "adult";
  const allowed = await ensureMinimumAge(env2, userId, requiredClass);
  return { allowed, requiredAge, region, residencyRequired, policyName };
}
__name(ensureMinimumAgeRegionAware, "ensureMinimumAgeRegionAware");
async function ensureMinimumAge(env2, userId, requiredClass) {
  try {
    let row = await env2.DB.prepare("SELECT ageClass, verified FROM age_verification WHERE userId=?1").bind(userId).first();
    if (!row) {
      try {
        row = await env2.DB.prepare("SELECT ageClass, verified FROM age_verification WHERE user_id=?1").bind(userId).first();
      } catch {
      }
    }
    if (!row) return false;
    const order = ["u13", "u16", "u18", "adult"];
    const idxUser = order.indexOf(String(row.ageClass || ""));
    const idxReq = order.indexOf(requiredClass);
    if (idxUser < 0 || idxReq < 0) return false;
    return idxUser >= idxReq && (row.verified === 1 || row.verified === true);
  } catch {
    return false;
  }
}
__name(ensureMinimumAge, "ensureMinimumAge");
async function isCountryRestricted(env2, countryCode) {
  try {
    const row = await env2.DB.prepare("SELECT active FROM restricted_countries WHERE code=?1").bind(countryCode).first();
    return !!row && row.active === 1;
  } catch {
    return false;
  }
}
__name(isCountryRestricted, "isCountryRestricted");

// src/middleware.ts
init_jwt_utils();
var GLOBAL_RATE_LIMIT = 100;
var LOGIN_RATE_LIMIT = 5;
var REGISTER_RATE_LIMIT = 3;
var corsMiddleware = /* @__PURE__ */ __name(async (request, env2) => {
  const origin = env2.FRONTEND_ORIGIN || "*";
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Actor, X-Request-ID, X-Flow-ID",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  return null;
}, "corsMiddleware");
var rateLimitMiddleware = /* @__PURE__ */ __name(async (request, env2) => {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const url = new URL(request.url);
  const path = url.pathname;
  let limit = GLOBAL_RATE_LIMIT;
  let bucket = "global";
  if (path.startsWith("/auth/login")) {
    limit = LOGIN_RATE_LIMIT;
    bucket = "login";
  } else if (path.startsWith("/auth/register")) {
    limit = REGISTER_RATE_LIMIT;
    bucket = "register";
  }
  const key = `rate:${bucket}:${ip}`;
  const current = await env2.RATE_LIMIT.get(key);
  const count3 = current ? Number.parseInt(current, 10) : 0;
  if (count3 >= limit) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests, slow down",
          bucket,
          limit
        }
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60"
        }
      }
    );
  }
  await env2.RATE_LIMIT.put(key, (count3 + 1).toString(), { expirationTtl: 60 });
  return null;
}, "rateLimitMiddleware");
async function requireAuth2(request, env2) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid authorization header"
        }
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  const token = authHeader.substring(7);
  if (env2.FIREBASE_PROJECT_ID) {
    try {
      const firebaseUser = await verifyFirebaseToken(token, env2);
      if (firebaseUser) {
        const user = await getOrCreateUserFromFirebase(env2, firebaseUser);
        if (user) {
          return {
            userId: user.id,
            type: "access",
            iat: Math.floor(Date.now() / 1e3),
            exp: Math.floor(Date.now() / 1e3) + 3600
          };
        }
      }
    } catch (error3) {
      console.debug("Firebase token verification failed, trying Workers JWT:", error3);
    }
  }
  try {
    const payload = await verifyToken(token, env2);
    if (payload?.type !== "access") {
      throw new Error("Invalid token type");
    }
    return payload;
  } catch (error3) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired token"
        }
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(requireAuth2, "requireAuth");
async function applyMiddleware(request, env2, ctx) {
  const corsSpan = startSpan("middleware.cors");
  const corsResult = await corsMiddleware(request, env2, ctx);
  await endSpan(env2, corsSpan, "cors");
  if (corsResult) return corsResult;
  const rateSpan = startSpan("middleware.rate");
  const rateLimitResult = await rateLimitMiddleware(request, env2, ctx);
  await endSpan(env2, rateSpan, "rateLimit");
  if (rateLimitResult) return rateLimitResult;
  const geo = request.headers.get("CF-IPCountry");
  if (geo) {
    const restricted = await isCountryRestricted(env2, geo);
    if (restricted) {
      return new Response(JSON.stringify({ success: false, error: { code: "REGION_BLOCKED", message: "Service not available in your country" } }), { status: 451, headers: { "Content-Type": "application/json" } });
    }
  }
  return null;
}
__name(applyMiddleware, "applyMiddleware");
function addCorsHeaders(response, env2) {
  const origin = env2?.FRONTEND_ORIGIN || "*";
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", origin);
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Actor, X-Request-ID, X-Flow-ID");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
__name(addCorsHeaders, "addCorsHeaders");

// src/handlers/video.handler.ts
var uploadCore = /* @__PURE__ */ __name(async (request, env2, ctx, _params) => {
  if (!env2?.DB) {
    return new Response(
      JSON.stringify({ success: false, error: { code: "ENV_MISCONFIG", message: "DB binding missing" } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!env2?.R2) {
    return new Response(
      JSON.stringify({ success: false, error: { code: "ENV_MISCONFIG", message: "R2 binding missing" } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  const ageCheck = await ensureMinimumAgeRegionAware(env2, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
  if (!ageCheck.allowed) {
    return new Response(
      JSON.stringify({ success: false, error: { code: "AGE_RESTRICTED", message: "User does not meet regional minimum age requirements for uploading." } }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const formData = await request.formData();
    const videoFile = formData.get("video");
    const title2 = formData.get("title");
    const description = formData.get("description");
    const hashtagsStr = formData.get("hashtags");
    if (!videoFile || !title2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Video file and title are required"
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const videoId = crypto.randomUUID();
    const storage = new StorageService(env2);
    const db = new DatabaseService(env2);
    const cache = new CacheService(env2);
    const analytics = new AnalyticsService(env2);
    const videoBuffer = await videoFile.arrayBuffer();
    const { url: videoUrl } = await storage.uploadVideo(
      videoId,
      videoBuffer,
      videoFile.type
    );
    const thumbnailUrl = `https://storage.spaktok.com/thumbnails/${videoId}/thumb.jpg`;
    let hashtags = void 0;
    if (hashtagsStr) {
      try {
        hashtags = JSON.parse(hashtagsStr);
      } catch {
        hashtags = void 0;
      }
    }
    const video = await db.createVideo({
      userId,
      title: title2,
      description: description || void 0,
      videoUrl,
      thumbnailUrl,
      // Provide sensible defaults for required counters and status; duration will be updated by processing pipeline
      duration: 0,
      likesCount: 0,
      viewsCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      processingStatus: "pending",
      width: 1080,
      height: 1920,
      hashtags
    });
    ctx.waitUntil(
      analytics.logVideoUpload(videoId, userId, videoBuffer.byteLength, 0)
    );
    ctx.waitUntil(cache.invalidateFeed(null));
    const processingService = new VideoProcessingService(env2);
    ctx.waitUntil(
      processingService.startProcessing(videoId, userId, videoUrl, videoBuffer.byteLength).then(() => processingService.completeProcessing(videoId)).catch((error3) => {
        console.error("Video processing failed:", error3);
        processingService.failProcessing(videoId, error3);
      })
    );
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          video,
          message: "Video uploaded successfully. Processing in progress.",
          processingStatus: "pending"
        }
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error3) {
    console.error("Video upload error:", error3);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to upload video"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "uploadCore");
var upload = withSpan(uploadCore, "video.upload");
var get = /* @__PURE__ */ __name(async (request, env2, ctx, params) => {
  try {
    const videoId = params.id;
    if (!env2?.DB) {
      return new Response(JSON.stringify({ success: false, error: { code: "ENV_MISCONFIG", message: "DB binding missing" } }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    if (!videoId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Video ID is required"
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const cache = new CacheService(env2);
    const db = new DatabaseService(env2);
    const analytics = new AnalyticsService(env2);
    let video = await cache.getVideo(videoId);
    if (!video) {
      const result = await env2.DB.prepare(
        "SELECT * FROM videos WHERE id = ?"
      ).bind(videoId).first();
      if (!result) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Video not found"
            }
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      video = result;
      ctx.waitUntil(cache.cacheVideo(videoId, video));
    }
    ctx.waitUntil(analytics.logVideoView(videoId));
    return new Response(
      JSON.stringify({
        success: true,
        data: { video }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error3) {
    console.error("Get video error:", error3);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve video"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "get");
var like = /* @__PURE__ */ __name(async (request, env2, ctx, params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  const videoId = params.id;
  if (!env2?.DB) {
    return new Response(JSON.stringify({ success: false, error: { code: "ENV_MISCONFIG", message: "DB binding missing" } }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  try {
    await env2.DB.prepare(
      "INSERT OR IGNORE INTO likes (user_id, video_id, created_at) VALUES (?, ?, ?)"
    ).bind(userId, videoId, (/* @__PURE__ */ new Date()).toISOString()).run();
    await env2.DB.prepare(
      "UPDATE videos SET likes_count = likes_count + 1 WHERE id = ?"
    ).bind(videoId).run();
    const cache = new CacheService(env2);
    ctx.waitUntil(cache.invalidateVideo(videoId));
    const analytics = new AnalyticsService(env2);
    ctx.waitUntil(analytics.logUserAction("like", userId, videoId));
    return new Response(
      JSON.stringify({
        success: true,
        data: { message: "Video liked successfully" }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error3) {
    console.error("Like video error:", error3);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to like video"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "like");
var unlike = /* @__PURE__ */ __name(async (request, env2, ctx, params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  const videoId = params.id;
  if (!env2?.DB) {
    return new Response(JSON.stringify({ success: false, error: { code: "ENV_MISCONFIG", message: "DB binding missing" } }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  try {
    await env2.DB.prepare(
      "DELETE FROM likes WHERE user_id = ? AND video_id = ?"
    ).bind(userId, videoId).run();
    await env2.DB.prepare(
      "UPDATE videos SET likes_count = likes_count - 1 WHERE id = ? AND likes_count > 0"
    ).bind(videoId).run();
    const cache = new CacheService(env2);
    ctx.waitUntil(cache.invalidateVideo(videoId));
    return new Response(
      JSON.stringify({
        success: true,
        data: { message: "Video unliked successfully" }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error3) {
    console.error("Unlike video error:", error3);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to unlike video"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "unlike");
var addComment = /* @__PURE__ */ __name(async (request, env2, ctx, params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  const videoId = params.id;
  if (!env2?.DB) {
    return new Response(JSON.stringify({ success: false, error: { code: "ENV_MISCONFIG", message: "DB binding missing" } }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  try {
    const body = await request.json().catch(() => ({}));
    if (!body.content) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Comment content is required"
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const commentId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env2.DB.prepare(
      `INSERT INTO comments (id, video_id, user_id, content, likes_count, replies_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, 0, ?, ?)`
    ).bind(commentId, videoId, userId, body.content, now, now).run();
    await env2.DB.prepare(
      "UPDATE videos SET comments_count = comments_count + 1 WHERE id = ?"
    ).bind(videoId).run();
    const cache = new CacheService(env2);
    ctx.waitUntil(cache.invalidateVideo(videoId));
    const analytics = new AnalyticsService(env2);
    ctx.waitUntil(analytics.logUserAction("comment", userId, videoId));
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          comment: {
            id: commentId,
            videoId,
            userId,
            content: body.content,
            likesCount: 0,
            repliesCount: 0,
            createdAt: now,
            updatedAt: now
          }
        }
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error3) {
    console.error("Add comment error:", error3);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to add comment"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "addComment");
var getProcessingStatus = /* @__PURE__ */ __name(async (request, env2, _ctx, params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const videoId = params.id;
  if (!env2?.DB) {
    return new Response(JSON.stringify({ success: false, error: { code: "ENV_MISCONFIG", message: "DB binding missing" } }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  try {
    const processingService = new VideoProcessingService(env2);
    const status = await processingService.getProcessingStatus(videoId);
    const video = await env2.DB.prepare(
      "SELECT processing_status, duration, thumbnail_url FROM videos WHERE id = ?"
    ).bind(videoId).first();
    if (!video) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Video not found" }
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          videoId,
          processingStatus: video.processing_status,
          duration: video.duration,
          thumbnailUrl: video.thumbnail_url,
          jobStatus: status
        }
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error3) {
    console.error("Get processing status error:", error3);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to get status" }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "getProcessingStatus");

// src/handlers/user.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var me = /* @__PURE__ */ __name(async (request, env2, ctx, params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const cache = new CacheService(env2);
    const db = new DatabaseService(env2);
    let user = await cache.getUserProfile(userId);
    if (!user) {
      user = await db.getUserById(userId);
      if (!user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "User not found"
            }
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      ctx.waitUntil(cache.cacheUserProfile(userId, user));
    }
    const { passwordHash, ...userWithoutPassword } = user;
    return new Response(
      JSON.stringify({
        success: true,
        data: { user: userWithoutPassword }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error3) {
    console.error("Get current user error:", error3);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get user profile"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "me");
var get2 = /* @__PURE__ */ __name(async (request, env2, ctx, params) => {
  try {
    const userId = params.id;
    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "User ID is required"
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const cache = new CacheService(env2);
    const db = new DatabaseService(env2);
    let user = await cache.getUserProfile(userId);
    if (!user) {
      user = await db.getUserById(userId);
      if (!user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "User not found"
            }
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      ctx.waitUntil(cache.cacheUserProfile(userId, user));
    }
    const { passwordHash, ...userWithoutPassword } = user;
    return new Response(
      JSON.stringify({
        success: true,
        data: { user: userWithoutPassword }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error3) {
    console.error("Get user error:", error3);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get user profile"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "get");
var update = /* @__PURE__ */ __name(async (request, env2, ctx, params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const currentUserId = authResult.userId;
  const targetUserId = params.id;
  if (currentUserId !== targetUserId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You can only update your own profile"
        }
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  try {
    const body = await request.json();
    const updates = [];
    const values = [];
    if (body.displayName) {
      updates.push("display_name = ?");
      values.push(body.displayName);
    }
    if (body.bio !== void 0) {
      updates.push("bio = ?");
      values.push(body.bio);
    }
    if (body.avatarUrl) {
      updates.push("avatar_url = ?");
      values.push(body.avatarUrl);
    }
    if (updates.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "No fields to update"
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    updates.push("updated_at = ?");
    values.push((/* @__PURE__ */ new Date()).toISOString());
    values.push(targetUserId);
    await env2.DB.prepare(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...values).run();
    const cache = new CacheService(env2);
    ctx.waitUntil(cache.invalidateUser(targetUserId));
    const db = new DatabaseService(env2);
    const user = await db.getUserById(targetUserId);
    if (!user) {
      throw new Error("Failed to retrieve updated user");
    }
    const { passwordHash, ...userWithoutPassword } = user;
    return new Response(
      JSON.stringify({
        success: true,
        data: { user: userWithoutPassword }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error3) {
    console.error("Update user error:", error3);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update user profile"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "update");
var follow = /* @__PURE__ */ __name(async (request, env2, ctx, params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const followerId = authResult.userId;
  const followingId = params.id;
  if (followerId === followingId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "You cannot follow yourself"
        }
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  try {
    await env2.DB.prepare(
      "INSERT OR IGNORE INTO followers (follower_id, following_id, created_at) VALUES (?, ?, ?)"
    ).bind(followerId, followingId, (/* @__PURE__ */ new Date()).toISOString()).run();
    await env2.DB.prepare(
      "UPDATE users SET following_count = following_count + 1 WHERE id = ?"
    ).bind(followerId).run();
    await env2.DB.prepare(
      "UPDATE users SET followers_count = followers_count + 1 WHERE id = ?"
    ).bind(followingId).run();
    const cache = new CacheService(env2);
    ctx.waitUntil(Promise.all([
      cache.invalidateUser(followerId),
      cache.invalidateUser(followingId)
    ]));
    const analytics = new AnalyticsService(env2);
    ctx.waitUntil(analytics.logUserAction("follow", followerId, followingId));
    return new Response(
      JSON.stringify({
        success: true,
        data: { message: "Followed successfully" }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error3) {
    console.error("Follow user error:", error3);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to follow user"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "follow");
var unfollow = /* @__PURE__ */ __name(async (request, env2, ctx, params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const followerId = authResult.userId;
  const followingId = params.id;
  try {
    await env2.DB.prepare(
      "DELETE FROM followers WHERE follower_id = ? AND following_id = ?"
    ).bind(followerId, followingId).run();
    await env2.DB.prepare(
      "UPDATE users SET following_count = following_count - 1 WHERE id = ? AND following_count > 0"
    ).bind(followerId).run();
    await env2.DB.prepare(
      "UPDATE users SET followers_count = followers_count - 1 WHERE id = ? AND followers_count > 0"
    ).bind(followingId).run();
    const cache = new CacheService(env2);
    ctx.waitUntil(Promise.all([
      cache.invalidateUser(followerId),
      cache.invalidateUser(followingId)
    ]));
    return new Response(
      JSON.stringify({
        success: true,
        data: { message: "Unfollowed successfully" }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error3) {
    console.error("Unfollow user error:", error3);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to unfollow user"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "unfollow");

// src/handlers/ads.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/services/ads.service.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var AdsService = class {
  constructor(env2) {
    this.env = env2;
  }
  static {
    __name(this, "AdsService");
  }
  // Numeric coercion helpers
  coercePositiveInt(input, max = 1e8) {
    const n = Number(input);
    if (!Number.isFinite(n)) return 0;
    const i = Math.trunc(n);
    if (i <= 0) return 0;
    if (i > max) return max;
    return i;
  }
  coerceNonNegativeFloat(input, max = 1e9) {
    const n = Number(input);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, max);
  }
  /**
   * Get ads to display for a user (AI-powered selection)
   */
  async getAdsForUser(userId, placement, limit = 4) {
    limit = Math.max(1, Math.min(10, this.coercePositiveInt(limit, 10)));
    const user = await this.env.DB.prepare(
      "SELECT age, gender, country, city, interests FROM users WHERE id = ?"
    ).bind(userId).first();
    if (!user) return [];
    const engagementLevel = await this.calculateUserEngagementLevel(userId);
    const creatives = await this.env.DB.prepare(
      `SELECT c.*
       FROM ad_creatives c
       JOIN ad_campaigns cam ON c.campaign_id = cam.id
       JOIN ad_targeting t ON cam.id = t.campaign_id
       WHERE c.status = 'approved'
         AND cam.status = 'active'
         AND cam.budget_remaining > 0
         AND datetime(cam.start_date) <= datetime('now')
         AND datetime(cam.end_date) >= datetime('now')
         AND (t.age_min IS NULL OR t.age_min <= ?1)
         AND (t.age_max IS NULL OR t.age_max >= ?2)
         AND (t.engagement_level = ?3 OR t.engagement_level = 'all')
       ORDER BY cam.bid_amount DESC, RANDOM()
       LIMIT ?4`
    ).bind(user.age || 25, user.age || 25, engagementLevel, limit).all();
    for (const creative of creatives.results) {
      await this.trackImpression({
        creativeId: creative.id,
        campaignId: creative.campaign_id,
        userId,
        placement,
        format: creative.format,
        position: 0
      });
    }
    return creatives.results;
  }
  /**
   * Get adaptive ad layout (grid vs fullscreen)
   * Returns optimal format based on user behavior and available budget
   */
  async getAdaptiveAdLayout(userId, scrollPosition) {
    const isFullscreenSlot = scrollPosition % 10 === 0;
    if (isFullscreenSlot) {
      const fullscreenAds = await this.getPremiumFullscreenAds(userId, 1);
      if (fullscreenAds.length > 0) {
        return { format: "fullscreen", ads: fullscreenAds };
      }
    }
    const gridAds = await this.getGridAds(userId, 4);
    return { format: "grid", ads: gridAds };
  }
  /**
   * Get premium fullscreen ads (highest bidders)
   */
  async getPremiumFullscreenAds(userId, limit = 1) {
    limit = Math.max(1, Math.min(3, this.coercePositiveInt(limit, 3)));
    const user = await this.env.DB.prepare(
      "SELECT age, gender, country FROM users WHERE id = ?"
    ).bind(userId).first();
    if (!user) return [];
    const creatives = await this.env.DB.prepare(
      `SELECT c.*, cam.bid_amount
       FROM ad_creatives c
       JOIN ad_campaigns cam ON c.campaign_id = cam.id
       JOIN ad_targeting t ON cam.id = t.campaign_id
       WHERE c.format = 'fullscreen'
         AND c.status = 'approved'
         AND cam.status = 'active'
         AND cam.budget_remaining > cam.bid_amount
         AND datetime(cam.start_date) <= datetime('now')
         AND datetime(cam.end_date) >= datetime('now')
         AND (t.age_min IS NULL OR t.age_min <= ?)
         AND (t.age_max IS NULL OR t.age_max >= ?)
       ORDER BY cam.bid_amount DESC
       LIMIT ?`
    ).bind(user.age || 25, user.age || 25, limit).all();
    return creatives.results;
  }
  /**
   * Get grid ads (4 per view, lower cost entry point)
   */
  async getGridAds(userId, limit = 4) {
    limit = Math.max(1, Math.min(8, this.coercePositiveInt(limit, 8)));
    const user = await this.env.DB.prepare(
      "SELECT age, gender, interests FROM users WHERE id = ?"
    ).bind(userId).first();
    if (!user) return [];
    const creatives = await this.env.DB.prepare(
      `SELECT c.*, cam.bid_amount
       FROM ad_creatives c
       JOIN ad_campaigns cam ON c.campaign_id = cam.id
       WHERE c.format = 'grid'
         AND c.status = 'approved'
         AND cam.status = 'active'
         AND cam.budget_remaining > 0
         AND datetime(cam.start_date) <= datetime('now')
         AND datetime(cam.end_date) >= datetime('now')
       ORDER BY cam.bid_amount DESC, RANDOM()
       LIMIT ?`
    ).bind(limit).all();
    return creatives.results.map((creative, index) => ({
      ...creative,
      layoutPosition: index % 4 + 1
    }));
  }
  /**
   * Track ad impression
   */
  async trackImpression(data) {
    const impressionId = crypto.randomUUID();
    const campaign = await this.env.DB.prepare(
      "SELECT pricing_model, bid_amount FROM ad_campaigns WHERE id = ?"
    ).bind(data.campaignId).first();
    if (!campaign) return;
    let cost = 0;
    if (campaign.pricing_model === "cpm") {
      cost = this.coerceNonNegativeFloat(campaign.bid_amount) / 1e3;
    }
    await this.env.DB.prepare(
      `INSERT INTO ad_impressions (
        id, creative_id, campaign_id, user_id,
        placement, format, position, cost_usd,
        viewed, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    ).bind(
      impressionId,
      data.creativeId,
      data.campaignId,
      data.userId,
      data.placement,
      data.format,
      this.coercePositiveInt(data.position, 1e3),
      this.coerceNonNegativeFloat(cost, 1e6),
      (/* @__PURE__ */ new Date()).toISOString()
    ).run();
    await this.env.DB.prepare(
      `UPDATE ad_campaigns 
       SET impressions = impressions + 1,
           budget_spent = budget_spent + ?,
           budget_remaining = budget_remaining - ?
       WHERE id = ?`
    ).bind(this.coerceNonNegativeFloat(cost, 1e6), this.coerceNonNegativeFloat(cost, 1e6), data.campaignId).run();
    await this.env.DB.prepare(
      "UPDATE ad_creatives SET impressions = impressions + 1 WHERE id = ?"
    ).bind(data.creativeId).run();
  }
  /**
   * Track ad click
   */
  async trackClick(impressionId, userId) {
    const impression = await this.env.DB.prepare(
      "SELECT creative_id, campaign_id, cost_usd FROM ad_impressions WHERE id = ?"
    ).bind(impressionId).first();
    if (!impression) return;
    const campaign = await this.env.DB.prepare(
      "SELECT pricing_model, bid_amount FROM ad_campaigns WHERE id = ?"
    ).bind(impression.campaign_id).first();
    if (!campaign) return;
    let additionalCost = 0;
    if (campaign.pricing_model === "cpc") {
      additionalCost = this.coerceNonNegativeFloat(campaign.bid_amount);
    }
    await this.env.DB.prepare(
      "UPDATE ad_impressions SET clicked = 1, cost_usd = cost_usd + ? WHERE id = ?"
    ).bind(this.coerceNonNegativeFloat(additionalCost, 1e6), impressionId).run();
    await this.env.DB.prepare(
      `UPDATE ad_campaigns 
       SET clicks = clicks + 1,
           budget_spent = budget_spent + ?,
           budget_remaining = budget_remaining - ?
       WHERE id = ?`
    ).bind(this.coerceNonNegativeFloat(additionalCost, 1e6), this.coerceNonNegativeFloat(additionalCost, 1e6), impression.campaign_id).run();
    const creative = await this.env.DB.prepare(
      "SELECT impressions, clicks FROM ad_creatives WHERE id = ?"
    ).bind(impression.creative_id).first();
    const impressions = this.coercePositiveInt(creative?.impressions ?? 0, 1e9);
    const prevClicks = Number(creative?.clicks ?? 0) || 0;
    const clicks = this.coercePositiveInt(prevClicks + 1, 1e9);
    const ctr = impressions > 0 ? clicks / impressions * 100 : 0;
    await this.env.DB.prepare(
      `UPDATE ad_creatives 
       SET clicks = clicks + 1,
           ctr = ?
       WHERE id = ?`
    ).bind(this.coerceNonNegativeFloat(ctr, 100), impression.creative_id).run();
  }
  /**
   * Calculate user engagement level (for targeting)
   */
  async calculateUserEngagementLevel(userId) {
    const activity = await this.env.DB.prepare(
      `SELECT 
         (SELECT COUNT(*) FROM video_likes WHERE user_id = ? AND created_at > datetime('now', '-7 days')) as likes,
         (SELECT COUNT(*) FROM comments WHERE user_id = ? AND created_at > datetime('now', '-7 days')) as comments,
         (SELECT COUNT(*) FROM shares WHERE user_id = ? AND created_at > datetime('now', '-7 days')) as shares
      `
    ).bind(userId, userId, userId).first();
    if (!activity) return "low";
    const totalEngagements = activity.likes + activity.comments + activity.shares;
    if (totalEngagements > 50) return "high";
    if (totalEngagements > 10) return "medium";
    return "low";
  }
  /**
   * Get recommended pricing for advertiser based on goals
   */
  async getRecommendedPricing(targetAudience, format, duration) {
    const baseCPM = format === "grid" ? 2.5 : 5;
    const ta = this.coercePositiveInt(targetAudience, 1e9);
    const dur = this.coercePositiveInt(duration, 365);
    const estimatedImpressions = ta * dur * 3;
    const recommendedBudget = estimatedImpressions / 1e3 * baseCPM;
    const avgCTR = format === "grid" ? 0.02 : 0.04;
    const estimatedClicks = Math.round(estimatedImpressions * avgCTR);
    let tierName = "starter";
    if (recommendedBudget > 1e4) tierName = "premium";
    else if (recommendedBudget > 1e3) tierName = "growth";
    return {
      tierName,
      minBudget: Math.max(100, recommendedBudget * 0.5),
      recommendedBudget: Math.round(recommendedBudget),
      estimatedImpressions,
      estimatedClicks
    };
  }
  /**
   * Create new ad campaign
   */
  async createCampaign(data) {
    const campaignId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const budgetTotal = this.coerceNonNegativeFloat(data.budgetTotal, 1e9);
    const budgetDaily = this.coerceNonNegativeFloat(data.budgetDaily, 1e9);
    const bidAmount = this.coerceNonNegativeFloat(data.bidAmount, 1e6);
    await this.env.DB.prepare(
      `INSERT INTO ad_campaigns (
        id, advertiser_id, name, budget_total, budget_daily,
        budget_remaining, pricing_model, bid_amount,
        start_date, end_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(
      campaignId,
      data.advertiserId,
      data.name,
      budgetTotal,
      budgetDaily,
      budgetTotal,
      data.pricingModel,
      bidAmount,
      data.startDate,
      data.endDate,
      now,
      now
    ).run();
    return campaignId;
  }
  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId) {
    const campaign = await this.env.DB.prepare(
      "SELECT * FROM ad_campaigns WHERE id = ?"
    ).bind(campaignId).first();
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    const clicks = this.coercePositiveInt(campaign.clicks, 1e12);
    const impressions = this.coercePositiveInt(campaign.impressions, 1e12);
    const ctr = impressions ? clicks / impressions * 100 : 0;
    const roi = campaign.budget_spent ? this.coerceNonNegativeFloat(campaign.conversions * 10 / campaign.budget_spent, 1e6) : 0;
    return {
      impressions,
      clicks,
      conversions: this.coercePositiveInt(campaign.conversions, 1e12),
      ctr,
      spent: this.coerceNonNegativeFloat(campaign.budget_spent, 1e12),
      remaining: this.coerceNonNegativeFloat(campaign.budget_remaining, 1e12),
      roi
    };
  }
};

// src/utils/legal_telemetry.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
async function logLegalEvent(env2, event) {
  const span = startSpan("legal.logEvent", { eventType: event.eventType, userId: event.userId });
  try {
    await env2.DB.prepare(
      `INSERT INTO legal_audit_log (user_id, event_type, details, ip_address, user_agent, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      event.userId,
      event.eventType,
      JSON.stringify(event.details),
      event.ipAddress || "unknown",
      event.userAgent || "unknown",
      event.timestamp
    ).run();
    const key = `legal:${event.userId}:${event.eventType}:${event.timestamp}`;
    await env2.CACHE.put(key, JSON.stringify(event), { expirationTtl: 2592e3 });
    console.log(`[LEGAL] ${event.eventType} for user ${event.userId}`, event.details);
  } catch (error3) {
    console.error("Failed to log legal event:", error3);
  } finally {
    await endSpan(env2, span, "legal.log");
  }
}
__name(logLegalEvent, "logLegalEvent");
async function logConsentChange(env2, userId, consentType, granted, request) {
  await logLegalEvent(env2, {
    userId,
    eventType: granted ? "consent_granted" : "consent_withdrawn",
    details: { consentType, granted },
    ipAddress: request.headers.get("CF-Connecting-IP") || void 0,
    userAgent: request.headers.get("User-Agent") || void 0,
    timestamp: Date.now()
  });
}
__name(logConsentChange, "logConsentChange");
async function logDataAccess(env2, userId, resourceType, resourceId, request) {
  await logLegalEvent(env2, {
    userId,
    eventType: "data_accessed",
    details: { resourceType, resourceId, accessTime: (/* @__PURE__ */ new Date()).toISOString() },
    ipAddress: request.headers.get("CF-Connecting-IP") || void 0,
    userAgent: request.headers.get("User-Agent") || void 0,
    timestamp: Date.now()
  });
}
__name(logDataAccess, "logDataAccess");
async function logDataErasure(env2, userId, resourceTypes, totalRecordsDeleted) {
  await logLegalEvent(env2, {
    userId,
    eventType: "data_erased",
    details: {
      resourceTypes,
      totalRecordsDeleted,
      erasureTime: (/* @__PURE__ */ new Date()).toISOString()
    },
    timestamp: Date.now()
  });
}
__name(logDataErasure, "logDataErasure");
async function logAgeVerification(env2, userId, ageClass, verificationMethod, request) {
  await logLegalEvent(env2, {
    userId,
    eventType: "age_verified",
    details: { ageClass, verificationMethod, verifiedAt: (/* @__PURE__ */ new Date()).toISOString() },
    ipAddress: request.headers.get("CF-Connecting-IP") || void 0,
    userAgent: request.headers.get("User-Agent") || void 0,
    timestamp: Date.now()
  });
}
__name(logAgeVerification, "logAgeVerification");
async function logRestrictedAccess(env2, userId, reason, regionOrCountry, requiredAge, request) {
  await logLegalEvent(env2, {
    userId,
    eventType: "restricted_access",
    details: { reason, region: regionOrCountry, requiredAge, blockedAt: (/* @__PURE__ */ new Date()).toISOString() },
    ipAddress: request?.headers.get("CF-Connecting-IP") || void 0,
    userAgent: request?.headers.get("User-Agent") || void 0,
    timestamp: Date.now()
  });
}
__name(logRestrictedAccess, "logRestrictedAccess");

// src/handlers/ads.handler.ts
function jsonSuccess(data, message = "Success") {
  return new Response(JSON.stringify({
    success: true,
    data,
    message
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
__name(jsonSuccess, "jsonSuccess");
function jsonError(message, code = "INTERNAL_ERROR", status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: { code, message }
  }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(jsonError, "jsonError");
var getAdsForFeed = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const url = new URL(request.url);
    const ageCheck = await ensureMinimumAgeRegionAware(env2, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
    if (!ageCheck.allowed) {
      await logRestrictedAccess(env2, userId, "ads", ageCheck.region, ageCheck.requiredAge, request);
      return jsonError("Age verification required for ad viewing", "AGE_RESTRICTED", 403);
    }
    const scrollPosition = Number.parseInt(url.searchParams.get("position") || "0", 10);
    const adsService = new AdsService(env2);
    const { format, ads } = await adsService.getAdaptiveAdLayout(userId, scrollPosition);
    return jsonSuccess({
      format,
      ads,
      count: ads.length
    }, "Ads retrieved successfully");
  } catch (error3) {
    return jsonError(error3.message);
  }
}, "getAdsForFeed");
var trackImpression = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const raw = await request.json().catch(() => null);
    const body = raw && typeof raw === "object" ? raw : {};
    const { creativeId, campaignId, placement, format, position } = body;
    if (!creativeId || !campaignId) {
      return jsonError("Missing required fields", "VALIDATION_ERROR", 400);
    }
    const adsService = new AdsService(env2);
    await adsService.trackImpression({
      creativeId,
      campaignId,
      userId,
      placement: placement || "feed",
      format: format === "fullscreen" ? "fullscreen" : "grid",
      position: Number(position ?? 0)
    });
    console.log("[obs.ads.impression]", JSON.stringify({ ts: Date.now(), hasCreative: !!creativeId, hasCampaign: !!campaignId, format: format === "fullscreen" ? "fullscreen" : "grid", position: Number(position ?? 0) }));
    return jsonSuccess(null, "Impression tracked");
  } catch (error3) {
    return jsonError(error3.message);
  }
}, "trackImpression");
var trackClick = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const raw = await request.json().catch(() => null);
    const body = raw && typeof raw === "object" ? raw : {};
    const { impressionId } = body;
    if (!impressionId) {
      return jsonError("Missing impression ID", "VALIDATION_ERROR", 400);
    }
    const adsService = new AdsService(env2);
    await adsService.trackClick(impressionId, userId);
    console.log("[obs.ads.click]", JSON.stringify({ ts: Date.now(), hasImpressionId: !!impressionId }));
    return jsonSuccess(null, "Click tracked");
  } catch (error3) {
    return jsonError(error3.message);
  }
}, "trackClick");
var createCampaign = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  const ageCheck = await ensureMinimumAgeRegionAware(env2, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
  if (!ageCheck.allowed || ageCheck.requiredAge < 18) {
    await logRestrictedAccess(env2, userId, "ad_campaign_creation", ageCheck.region, ageCheck.requiredAge, request);
    return jsonError("You must be 18 or older to create ad campaigns", "AGE_RESTRICTED", 403);
  }
  try {
    const raw = await request.json().catch(() => null);
    const body = raw && typeof raw === "object" ? raw : {};
    const {
      name,
      budgetTotal,
      budgetDaily,
      pricingModel,
      bidAmount,
      startDate,
      endDate
    } = body;
    if (!name || budgetTotal == null || budgetDaily == null || !pricingModel || bidAmount == null) {
      return jsonError("Missing required fields", "VALIDATION_ERROR", 400);
    }
    if (Number(budgetTotal) < 100) {
      return jsonError("Minimum budget is $100", "VALIDATION_ERROR", 400);
    }
    if (Number(budgetDaily) > Number(budgetTotal)) {
      return jsonError("Daily budget cannot exceed total budget", "VALIDATION_ERROR", 400);
    }
    const advertiser = await env2.DB.prepare(
      "SELECT id, status FROM advertisers WHERE user_id = ?"
    ).bind(userId).first();
    if (!advertiser) {
      return jsonError("Advertiser account required", "UNAUTHORIZED", 403);
    }
    if (advertiser.status !== "approved") {
      return jsonError("Advertiser account not approved", "FORBIDDEN", 403);
    }
    const adsService = new AdsService(env2);
    const campaignId = await adsService.createCampaign({
      advertiserId: advertiser.id,
      name,
      budgetTotal: Number(budgetTotal),
      budgetDaily: Number(budgetDaily),
      pricingModel,
      bidAmount: Number(bidAmount),
      startDate: startDate || (/* @__PURE__ */ new Date()).toISOString(),
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
    });
    return jsonSuccess({ campaignId }, "Campaign created successfully");
  } catch (error3) {
    return jsonError(error3.message);
  }
}, "createCampaign");
var getCampaignAnalytics = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  const campaignId = String(_params.campaignId || "");
  try {
    const campaign = await env2.DB.prepare(
      `SELECT c.id FROM ad_campaigns c
       JOIN advertisers a ON c.advertiser_id = a.id
       WHERE c.id = ? AND a.user_id = ?`
    ).bind(campaignId, userId).first();
    if (!campaign) {
      return jsonError("Campaign not found or access denied", "NOT_FOUND", 404);
    }
    const adsService = new AdsService(env2);
    const analytics = await adsService.getCampaignAnalytics(campaignId);
    return jsonSuccess({ analytics }, "Analytics retrieved");
  } catch (error3) {
    return jsonError(error3.message);
  }
}, "getCampaignAnalytics");
var getRecommendedPricing = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  try {
    const url = new URL(request.url);
    const targetAudience = Number.parseInt(url.searchParams.get("audience") || "10000", 10);
    const format = url.searchParams.get("format") || "grid";
    const duration = Number.parseInt(url.searchParams.get("days") || "30", 10);
    const adsService = new AdsService(env2);
    const pricing = await adsService.getRecommendedPricing(
      targetAudience,
      format,
      duration
    );
    return jsonSuccess({ pricing }, "Pricing recommendation generated");
  } catch (error3) {
    return jsonError(error3.message);
  }
}, "getRecommendedPricing");
var createAdvertiserAccount = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const raw = await request.json().catch(() => null);
    const body = raw && typeof raw === "object" ? raw : {};
    const { companyName, companyWebsite, businessType, billingEmail } = body;
    if (!companyName || !billingEmail) {
      return jsonError("Company name and billing email required", "VALIDATION_ERROR", 400);
    }
    const existing = await env2.DB.prepare(
      "SELECT id FROM advertisers WHERE user_id = ?"
    ).bind(userId).first();
    if (existing) {
      return jsonError("Advertiser account already exists", "CONFLICT", 409);
    }
    const advertiserId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env2.DB.prepare(
      `INSERT INTO advertisers (
        id, user_id, company_name, company_website,
        business_type, billing_email, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(
      advertiserId,
      userId,
      companyName,
      companyWebsite || "",
      businessType || "small",
      billingEmail,
      now,
      now
    ).run();
    return jsonSuccess(
      { advertiserId },
      "Advertiser account created - pending approval"
    );
  } catch (error3) {
    return jsonError(error3.message);
  }
}, "createAdvertiserAccount");
var getPricingTiers = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  try {
    const tiers = await env2.DB.prepare(
      "SELECT * FROM ad_pricing_tiers WHERE is_active = 1 ORDER BY tier_level ASC"
    ).all();
    return jsonSuccess({ tiers: tiers.results }, "Pricing tiers retrieved");
  } catch (error3) {
    return jsonError(error3.message);
  }
}, "getPricingTiers");
var uploadCreative = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const raw = await request.json().catch(() => null);
    const body = raw && typeof raw === "object" ? raw : {};
    const {
      campaignId,
      format,
      mediaUrl,
      mediaType,
      headline,
      description,
      callToAction,
      destinationUrl
    } = body;
    if (!campaignId || !format || !mediaUrl || !headline || !callToAction || !destinationUrl) {
      return jsonError("Missing required fields", "VALIDATION_ERROR", 400);
    }
    const campaign = await env2.DB.prepare(
      `SELECT c.id FROM ad_campaigns c
       JOIN advertisers a ON c.advertiser_id = a.id
       WHERE c.id = ? AND a.user_id = ?`
    ).bind(campaignId, userId).first();
    if (!campaign) {
      return jsonError("Campaign not found or access denied", "NOT_FOUND", 404);
    }
    const creativeId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env2.DB.prepare(
      `INSERT INTO ad_creatives (
        id, campaign_id, format, media_url, media_type,
        headline, description, call_to_action, destination_url,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(
      creativeId,
      campaignId,
      format ?? "grid",
      mediaUrl,
      mediaType,
      headline,
      description || "",
      callToAction,
      destinationUrl,
      now,
      now
    ).run();
    return jsonSuccess(
      { creativeId },
      "Creative uploaded - pending approval"
    );
  } catch (error3) {
    return jsonError(error3.message);
  }
}, "uploadCreative");
var getAdvertiserDashboard = /* @__PURE__ */ __name(async (request, env2, _ctx, _params) => {
  const authResult = await requireAuth2(request, env2);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const advertiser = await env2.DB.prepare(
      "SELECT * FROM advertisers WHERE user_id = ?"
    ).bind(userId).first();
    if (!advertiser) {
      return jsonError("Advertiser account not found", "NOT_FOUND", 404);
    }
    const campaigns = await env2.DB.prepare(
      `SELECT 
         COUNT(*) as total_campaigns,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_campaigns,
         SUM(impressions) as total_impressions,
         SUM(clicks) as total_clicks,
         SUM(budget_spent) as total_spent,
         SUM(budget_remaining) as total_remaining
       FROM ad_campaigns
       WHERE advertiser_id = ?`
    ).bind(advertiser.id).first();
    const recentCampaigns = await env2.DB.prepare(
      `SELECT id, name, status, budget_total, budget_spent,
              impressions, clicks, created_at
       FROM ad_campaigns
       WHERE advertiser_id = ?
       ORDER BY created_at DESC
       LIMIT 5`
    ).bind(advertiser.id).all();
    return jsonSuccess({
      advertiser: {
        id: advertiser.id,
        companyName: advertiser.company_name,
        status: advertiser.status,
        totalSpent: advertiser.total_spent,
        averageCTR: advertiser.average_ctr
      },
      summary: campaigns,
      recentCampaigns: recentCampaigns.results
    }, "Dashboard data retrieved");
  } catch (error3) {
    return jsonError(error3.message);
  }
}, "getAdvertiserDashboard");

// src/handlers/live.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_response_utils();

// src/utils/fraud_detection.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
async function ensureFraudTables(env2) {
  try {
    await env2.DB.prepare("CREATE TABLE IF NOT EXISTS gift_anomalies (userId TEXT, giftType TEXT, giftValue INTEGER, zScore REAL, mean REAL, stdDev REAL, timestamp INTEGER, ipAddress TEXT, deviceId TEXT)").run();
  } catch (e) {
  }
}
__name(ensureFraudTables, "ensureFraudTables");
async function detectGiftFraud(env2, userId, giftValue, context2) {
  const reasons = [];
  let riskScore = 0;
  try {
    await ensureFraudTables(env2);
    const recentGifts = await env2.DB.prepare(
      "SELECT COUNT(*) as count FROM gift_events WHERE userId = ? AND ts > ?"
    ).bind(userId, Date.now() - 6e4).first();
    const giftCount = recentGifts?.count || 0;
    if (giftCount >= 30) {
      reasons.push("RATE_LIMIT_EXCEEDED");
      riskScore += 40;
    }
    const stats = await env2.DB.prepare(
      `SELECT AVG(value) as mean, COUNT(*) as count FROM gift_events 
       WHERE userId = ? AND ts > ?`
    ).bind(userId, Date.now() - 864e5 * 30).first();
    if (stats && stats.count > 5) {
      const mean = stats.mean || 0;
      const varQuery = await env2.DB.prepare(
        `SELECT AVG((value - ?)*(value - ?)) as variance FROM gift_events 
         WHERE userId = ? AND ts > ?`
      ).bind(mean, mean, userId, Date.now() - 864e5 * 30).first();
      const variance = varQuery?.variance || 0;
      const stdDev = Math.sqrt(variance);
      const zScore = stdDev > 0 ? Math.abs((giftValue - mean) / stdDev) : 0;
      if (zScore > 3) {
        reasons.push("STATISTICAL_ANOMALY");
        riskScore += 30;
        await env2.DB.prepare(
          `INSERT INTO gift_anomalies (userId, giftValue, zScore, mean, stdDev, timestamp, ipAddress, deviceId)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          userId,
          giftValue,
          zScore,
          mean,
          stdDev,
          Date.now(),
          context2.ipAddress || "unknown",
          context2.deviceId || "unknown"
        ).run();
      }
    }
    if (context2.ipAddress) {
      const ipGifts = await env2.DB.prepare(
        "SELECT COUNT(DISTINCT userId) as userCount FROM gift_events WHERE ipAddress = ? AND ts > ?"
      ).bind(context2.ipAddress, Date.now() - 36e5).first();
      const userCount = ipGifts?.userCount || 0;
      if (userCount > 10) {
        reasons.push("IP_MULTIPLE_ACCOUNTS");
        riskScore += 25;
      }
    }
    if (context2.deviceId) {
      const deviceGifts = await env2.DB.prepare(
        "SELECT COUNT(DISTINCT userId) as userCount FROM gift_events WHERE deviceId = ? AND ts > ?"
      ).bind(context2.deviceId, Date.now() - 36e5).first();
      const userCount = deviceGifts?.userCount || 0;
      if (userCount > 5) {
        reasons.push("DEVICE_MULTIPLE_ACCOUNTS");
        riskScore += 25;
      }
    }
    if (context2.recipientId) {
      const circularGift = await env2.DB.prepare(
        `SELECT COUNT(*) as count FROM gift_events 
         WHERE userId = ? AND receiverId = ? AND ts > ?`
      ).bind(context2.recipientId, userId, Date.now() - 864e5).first();
      const circularCount = circularGift?.count || 0;
      if (circularCount > 0) {
        reasons.push("CIRCULAR_GIFTING");
        riskScore += 20;
      }
    }
    const userAge = await env2.DB.prepare(
      "SELECT created_at FROM users WHERE id = ?"
    ).bind(userId).first();
    if (userAge && userAge.created_at) {
      const accountAge = Date.now() - new Date(userAge.created_at).getTime();
      const daysSinceCreation = accountAge / 864e5;
      if (daysSinceCreation < 1 && giftValue > 500) {
        reasons.push("NEW_ACCOUNT_HIGH_VALUE");
        riskScore += 30;
      }
    }
    return {
      suspicious: reasons.length > 0,
      riskScore: Math.min(riskScore, 100),
      reasons,
      shouldBlock: riskScore >= 70
      // Block at 70+ risk score
    };
  } catch (error3) {
    console.error("Fraud detection error:", error3);
    return {
      suspicious: false,
      riskScore: 0,
      reasons: ["DETECTION_ERROR"],
      shouldBlock: false
    };
  }
}
__name(detectGiftFraud, "detectGiftFraud");

// src/handlers/live.handler.ts
function getStub(env2, streamId) {
  if (!env2.LIVE_STREAM) throw new Error("LIVE_STREAM Durable Object not bound");
  const id = env2.LIVE_STREAM.idFromName(streamId);
  return env2.LIVE_STREAM.get(id);
}
__name(getStub, "getStub");
async function joinStream(request, env2) {
  const url = new URL(request.url);
  const streamId = url.pathname.split("/")[2];
  const userId = url.searchParams.get("userId");
  if (!userId) return jsonResponse(false, null, "MISSING_USER", 400);
  const ageCheck = await ensureMinimumAgeRegionAware(env2, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
  if (!ageCheck.allowed) {
    await logRestrictedAccess(env2, userId, "live_stream_join", ageCheck.region, ageCheck.requiredAge, request);
    return jsonResponse(false, null, "AGE_RESTRICTED", 403);
  }
  const span = startSpan("live.join", { streamId });
  try {
    await logDataAccess(env2, userId, "live_stream", streamId, request);
    const stub = getStub(env2, streamId);
    const res = await stub.fetch(`https://do/${streamId}/join?userId=${encodeURIComponent(userId)}`, { method: "POST" });
    return res;
  } finally {
    await endSpan(env2, span, "live.join");
  }
}
__name(joinStream, "joinStream");
async function leaveStream(request, env2) {
  const url = new URL(request.url);
  const streamId = url.pathname.split("/")[2];
  const userId = url.searchParams.get("userId");
  if (!userId) return jsonResponse(false, null, "MISSING_USER", 400);
  const span = startSpan("live.leave", { streamId });
  try {
    const stub = getStub(env2, streamId);
    const res = await stub.fetch(`https://do/${streamId}/leave?userId=${encodeURIComponent(userId)}`, { method: "POST" });
    return res;
  } finally {
    await endSpan(env2, span, "live.leave");
  }
}
__name(leaveStream, "leaveStream");
async function sendStreamGift(request, env2) {
  const url = new URL(request.url);
  const streamId = url.pathname.split("/")[2];
  const body = await request.json().catch(() => ({}));
  const userId = body.userId;
  const giftType = body.giftType;
  if (!giftType) return jsonResponse(false, null, "MISSING_GIFT_TYPE", 400);
  if (!userId) return jsonResponse(false, null, "MISSING_USER", 400);
  const ageCheck = await ensureMinimumAgeRegionAware(env2, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
  if (!ageCheck.allowed) {
    await logRestrictedAccess(env2, userId, "live_stream_gift", ageCheck.region, ageCheck.requiredAge, request);
    return jsonResponse(false, null, "AGE_RESTRICTED", 403);
  }
  const giftValueMap = { rose: 10, diamond: 100, rocket: 500, star: 50, gold: 250 };
  const giftValue = giftValueMap[giftType] || 10;
  const fraudResult = await detectGiftFraud(env2, userId, giftValue, {
    ipAddress: request.headers.get("cf-connecting-ip") || void 0,
    deviceId: request.headers.get("x-device-id") || void 0,
    recipientId: streamId
    // treating stream as recipient context for circular gifting detection
  });
  if (fraudResult.shouldBlock) {
    return jsonResponse(false, { reasons: fraudResult.reasons }, "FRAUD_BLOCKED", 429);
  }
  if (fraudResult.reasons.includes("RATE_LIMIT_EXCEEDED")) {
    return jsonResponse(false, { reasons: fraudResult.reasons }, "RATE_LIMIT_EXCEEDED", 429);
  }
  const span = startSpan("live.gift", { streamId, riskScore: fraudResult.riskScore });
  try {
    const stub = getStub(env2, streamId);
    const res = await stub.fetch(`https://do/${streamId}/gift`, { method: "POST", body: JSON.stringify({ giftType, value: giftValue, fraudRisk: fraudResult.riskScore }), headers: { "Content-Type": "application/json" } });
    return res;
  } finally {
    await endSpan(env2, span, "live.gift");
  }
}
__name(sendStreamGift, "sendStreamGift");
async function getStreamState(request, env2) {
  const url = new URL(request.url);
  const streamId = url.pathname.split("/")[2];
  const span = startSpan("live.state", { streamId });
  try {
    const stub = getStub(env2, streamId);
    const res = await stub.fetch(`https://do/${streamId}/state`, { method: "GET" });
    return res;
  } finally {
    await endSpan(env2, span, "live.state");
  }
}
__name(getStreamState, "getStreamState");
async function updatePresence(request, env2) {
  const url = new URL(request.url);
  const streamId = url.pathname.split("/")[2];
  const body = await request.json().catch(() => ({}));
  const userId = body.userId;
  const status = body.status || "online";
  if (!userId) return jsonResponse(false, null, "MISSING_USER", 400);
  const span = startSpan("live.presence", { streamId });
  try {
    const stub = getStub(env2, streamId);
    const res = await stub.fetch(`https://do/${streamId}/presence`, { method: "POST", body: JSON.stringify({ userId, status }), headers: { "Content-Type": "application/json" } });
    return res;
  } finally {
    await endSpan(env2, span, "live.presence");
  }
}
__name(updatePresence, "updatePresence");

// src/handlers/compliance.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_response_utils();
async function recordConsent(request, env2) {
  const body = await request.json().catch(() => ({}));
  const userId = body.userId;
  const scopes = body.scopes || [];
  const version2 = body.version || "v1";
  const region = body.region || "global";
  if (!userId || !Array.isArray(scopes) || scopes.length === 0) {
    return jsonResponse(false, null, "INVALID_CONSENT", 400);
  }
  try {
    for (const scope of scopes) {
      await env2.DB.prepare("INSERT INTO consent_log (subject, scope, version, ts, region) VALUES (?1, ?2, ?3, ?4, ?5)").bind(userId, scope, version2, Date.now(), region).run();
      await logConsentChange(env2, userId, scope, true, request);
    }
    return jsonResponse(true, { recorded: scopes.length });
  } catch (error_) {
    return jsonResponse(false, { reason: error_.message || "ERROR" }, "CONSENT_WRITE_FAILED", 500);
  }
}
__name(recordConsent, "recordConsent");
async function getConsent(_request, env2, _ctx, _params) {
  const userId = _params.userId;
  const result = await env2.DB.prepare("SELECT scope, version, ts, region FROM consent_log WHERE subject = ?1").bind(userId).all();
  return jsonResponse(true, { entries: result.results });
}
__name(getConsent, "getConsent");
async function withdrawConsent(request, env2, _ctx, params) {
  const userId = params.userId;
  const body = await request.json().catch(() => ({}));
  const scopes = body.scopes || [];
  if (!Array.isArray(scopes) || scopes.length === 0) return jsonResponse(false, null, "INVALID_SCOPES", 400);
  try {
    for (const scope of scopes) {
      await env2.DB.prepare("DELETE FROM consent_log WHERE subject = ?1 AND scope = ?2").bind(userId, scope).run();
      await logConsentChange(env2, userId, scope, false, request);
    }
    return jsonResponse(true, { removed: scopes.length });
  } catch (error_) {
    return jsonResponse(false, { reason: error_.message || "ERROR" }, "CONSENT_WITHDRAW_FAILED", 500);
  }
}
__name(withdrawConsent, "withdrawConsent");
async function eraseUserData(_request, env2, _ctx, _params) {
  const userId = _params.userId;
  const reqId = crypto.randomUUID();
  await env2.DB.prepare("INSERT INTO erase_requests (id, user_id, status, initiated_at) VALUES (?1, ?2, ?3, ?4)").bind(reqId, userId, "processing", Date.now()).run();
  try {
    await env2.DB.prepare("BEGIN").run();
    try {
      await env2.DB.prepare("DELETE FROM consent_log WHERE subject = ?1").bind(userId).run();
      await env2.DB.prepare("DELETE FROM payment_events WHERE user_id = ?1").bind(userId).run();
      await env2.DB.prepare("DELETE FROM gift_events WHERE sender_id = ?1 OR receiver_id = ?1").bind(userId).run();
      await env2.DB.prepare("DELETE FROM referral_activations WHERE referred_user_id = ?1").bind(userId).run();
      await env2.DB.prepare("DELETE FROM referral_codes WHERE owner_user_id = ?1").bind(userId).run();
      await env2.DB.prepare("DELETE FROM age_verification WHERE user_id = ?1 OR userId = ?1").bind(userId).run();
      await env2.DB.prepare("DELETE FROM feed_cache WHERE user_id = ?1").bind(userId).run().catch(() => {
      });
      await env2.DB.prepare("DELETE FROM ad_impressions WHERE user_id = ?1").bind(userId).run().catch(() => {
      });
      await env2.DB.prepare("DELETE FROM ad_clicks WHERE user_id = ?1").bind(userId).run().catch(() => {
      });
      await env2.DB.prepare("DELETE FROM comments WHERE user_id = ?1").bind(userId).run().catch(() => {
      });
      await env2.DB.prepare("DELETE FROM messages WHERE sender_id = ?1 OR receiver_id = ?1").bind(userId).run().catch(() => {
      });
      await env2.DB.prepare("DELETE FROM videos WHERE user_id = ?1").bind(userId).run().catch(() => {
      });
      await env2.DB.prepare("COMMIT").run();
    } catch (error_) {
      await env2.DB.prepare("ROLLBACK").run();
      throw error_;
    }
    await env2.DB.prepare("UPDATE erase_requests SET status = ?1, completed_at = ?2 WHERE id = ?3").bind("completed", Date.now(), reqId).run();
    await logDataErasure(env2, userId, ["consent", "payments", "gifts", "referrals", "age_verification", "feed_cache", "ads", "comments", "messages", "videos"], 0);
    return jsonResponse(true, { status: "completed", requestId: reqId });
  } catch (e) {
    await env2.DB.prepare("UPDATE erase_requests SET status = ?1, failure_reason = ?2 WHERE id = ?3").bind("failed", e.message || "ERROR", reqId).run();
    return jsonResponse(false, null, "COMPLIANCE_ERASE_FAILED", 500);
  }
}
__name(eraseUserData, "eraseUserData");
async function recordAgeVerification(request, env2) {
  const body = await request.json().catch(() => ({}));
  const userId = body.userId;
  const ageClass = body.ageClass;
  const verified = !!body.verified;
  if (!userId || !ageClass) return jsonResponse(false, null, "INVALID_AGE_DATA", 400);
  await logAgeVerification(env2, userId, ageClass, body.method || "self-reported", request);
  try {
    await env2.DB.prepare("INSERT OR REPLACE INTO age_verification (userId, ageClass, verified, ts) VALUES (?1, ?2, ?3, ?4)").bind(userId, ageClass, verified ? 1 : 0, Date.now()).run();
    return jsonResponse(true, { userId, ageClass, verified });
  } catch (e) {
    const msg = String(e.message || "");
    if (/no such table/i.test(msg)) {
      try {
        await env2.DB.prepare("CREATE TABLE IF NOT EXISTS age_verification (userId TEXT PRIMARY KEY, ageClass TEXT, verified INTEGER, ts INTEGER)").run();
        await env2.DB.prepare("INSERT OR REPLACE INTO age_verification (userId, ageClass, verified, ts) VALUES (?1, ?2, ?3, ?4)").bind(userId, ageClass, verified ? 1 : 0, Date.now()).run();
        return jsonResponse(true, { userId, ageClass, verified, autoCreated: true });
      } catch (error_) {
        return jsonResponse(false, { reason: error_.message || "ERROR" }, "AGE_VERIFICATION_FAILED", 500);
      }
    }
    return jsonResponse(false, { reason: msg }, "AGE_VERIFICATION_FAILED", 500);
  }
}
__name(recordAgeVerification, "recordAgeVerification");
async function auditUserCompliance(_req, env2, _ctx, params) {
  const userId = params.userId;
  try {
    const consent = await env2.DB.prepare("SELECT scope, version, ts, region FROM consent_log WHERE subject=?1 ORDER BY ts DESC LIMIT 100").bind(userId).all();
    const age = await env2.DB.prepare("SELECT ageClass, verified, ts FROM age_verification WHERE user_id=?1 OR userId=?1").bind(userId).first();
    const erase = await env2.DB.prepare("SELECT id, status, initiated_at, completed_at, failure_reason FROM erase_requests WHERE user_id=?1 ORDER BY initiated_at DESC LIMIT 20").bind(userId).all();
    const anomalies = await env2.DB.prepare("SELECT COUNT(*) as cnt FROM gift_anomalies WHERE user_id=?1").bind(userId).first();
    const tax = await env2.DB.prepare("SELECT country_code, tax_class, updated_at FROM user_tax_profile WHERE user_id=?1").bind(userId).first();
    const region = await env2.DB.prepare("SELECT region_code, residency_version, updated_at FROM user_region_meta WHERE user_id=?1").bind(userId).first();
    return jsonResponse(true, {
      consent: consent.results || [],
      ageVerification: age || null,
      eraseRequests: erase.results || [],
      anomalyCount: anomalies?.cnt || 0,
      taxProfile: tax || null,
      regionProfile: region || null
    });
  } catch (error_) {
    return jsonResponse(false, { reason: error_.message || "ERROR" }, "AUDIT_FAILED", 500);
  }
}
__name(auditUserCompliance, "auditUserCompliance");

// src/handlers/metrics.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_response_utils();
async function getEconomySummary(_req, env2) {
  const span = startSpan("getEconomySummary");
  try {
    const gifts = await env2.DB.prepare("SELECT COUNT(*) as count, SUM(value) as totalValue FROM gift_events").all();
    const payments = await env2.DB.prepare("SELECT COUNT(*) as count, SUM(amount) as totalAmount FROM payment_events").all();
    return jsonResponse(true, {
      gifts: gifts.results?.[0] || {},
      payments: payments.results?.[0] || {}
    });
  } finally {
    await endSpan(env2, span, "getEconomySummary");
  }
}
__name(getEconomySummary, "getEconomySummary");
async function getTopGifters(_req, env2) {
  const span = startSpan("getTopGifters");
  try {
    const top = await env2.DB.prepare("SELECT userId, SUM(value) as totalValue FROM gift_events GROUP BY userId ORDER BY totalValue DESC LIMIT 25").all();
    return jsonResponse(true, { top: top.results });
  } finally {
    await endSpan(env2, span, "getTopGifters");
  }
}
__name(getTopGifters, "getTopGifters");
async function getLatencySnapshot(_req, env2) {
  const span = startSpan("getLatencySnapshot");
  try {
    const latest = await env2.DB.prepare("SELECT endpoint, p50, p95, ts FROM latency_samples ORDER BY ts DESC LIMIT 50").all();
    return jsonResponse(true, { samples: latest.results });
  } finally {
    await endSpan(env2, span, "getLatencySnapshot");
  }
}
__name(getLatencySnapshot, "getLatencySnapshot");
async function getSubscriptionSummary(_req, env2) {
  const span = startSpan("getSubscriptionSummary");
  try {
    const plans = await env2.DB.prepare("SELECT code, name, price_cents, interval FROM subscription_plans").all();
    const subs = await env2.DB.prepare('SELECT plan_code, COUNT(*) as cnt FROM user_subscriptions WHERE status="active" GROUP BY plan_code').all();
    return jsonResponse(true, { plans: plans.results, activeCounts: subs.results });
  } finally {
    await endSpan(env2, span, "getSubscriptionSummary");
  }
}
__name(getSubscriptionSummary, "getSubscriptionSummary");

// src/handlers/perf-telemetry.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_response_utils();
async function postPerfTelemetry(req, env2) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ success: false, error: { code: "INVALID_PAYLOAD", message: "Body must be JSON object" } }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS perf_telemetry (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        device_ts TEXT,
        frame_times TEXT, -- JSON array
        network_latencies TEXT, -- JSON array
        errors TEXT, -- JSON array
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    const deviceTs = typeof body.deviceTs === "string" ? body.deviceTs : (/* @__PURE__ */ new Date()).toISOString();
    const frameTimes = Array.isArray(body.frameTimes) ? JSON.stringify(body.frameTimes) : JSON.stringify([]);
    const networkLatencies = Array.isArray(body.networkLatencies) ? JSON.stringify(body.networkLatencies) : JSON.stringify([]);
    const errors = Array.isArray(body.errors) ? JSON.stringify(body.errors) : JSON.stringify([]);
    await env2.DB.prepare(`
      INSERT INTO perf_telemetry (device_ts, frame_times, network_latencies, errors)
      VALUES (?1, ?2, ?3, ?4)
    `).bind(deviceTs, frameTimes, networkLatencies, errors).run();
    return jsonResponse(true, { received: true });
  } catch (error3) {
    console.error("[PerfTelemetry] Error:", error3);
    return new Response(
      JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to store telemetry" } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(postPerfTelemetry, "postPerfTelemetry");

// src/utils/telemetry_exporter.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
async function exportTelemetry(env2) {
  const span = startSpan("telemetry.export");
  try {
    const now = Date.now();
    const since = now - 24 * 3600 * 1e3;
    const giftsRow = await env2.DB.prepare("SELECT COUNT(*) as c FROM gift_events WHERE created_at > ?1").bind(since).first();
    const payoutRow = await env2.DB.prepare('SELECT COUNT(*) as c FROM payment_events WHERE event_type = "payout_pending" AND created_at > ?1').bind(since).first();
    const consentRow = await env2.DB.prepare('SELECT COUNT(*) as c FROM consent_log WHERE created_at > datetime(?1, "unixepoch", "subsec")').bind(since / 1e3).first();
    let avgLatency;
    let p50;
    let p95;
    try {
      const lat = await env2.DB.prepare("SELECT AVG(latency_ms) as avgLatency FROM latency_samples WHERE ts > ?1").bind(since).first();
      avgLatency = lat?.avgLatency;
      const dist = await env2.DB.prepare("SELECT latency_ms FROM latency_samples WHERE ts > ?1 ORDER BY latency_ms").bind(since).all();
      const arr = dist.results?.map((r) => r.latency_ms).filter((n) => typeof n === "number") || [];
      if (arr.length) {
        const idx50 = Math.floor(arr.length * 0.5);
        const idx95 = Math.floor(arr.length * 0.95);
        p50 = arr[idx50];
        p95 = arr[idx95];
      }
    } catch {
    }
    return {
      ts: now,
      giftsToday: giftsRow?.c || 0,
      payoutRequestsToday: payoutRow?.c || 0,
      consentWritesToday: consentRow?.c || 0,
      avgApiLatencyMs: avgLatency,
      p50LatencyMs: p50,
      p95LatencyMs: p95
    };
  } finally {
    await endSpan(env2, span, "telemetry");
  }
}
__name(exportTelemetry, "exportTelemetry");
async function recordLatencySample(env2, path, latencyMs) {
  try {
    await env2.DB.prepare("CREATE TABLE IF NOT EXISTS latency_samples (ts INTEGER, path TEXT, latency_ms INTEGER)").run();
    await env2.DB.prepare("INSERT INTO latency_samples (ts, path, latency_ms) VALUES (?1, ?2, ?3)").bind(Date.now(), path, latencyMs).run();
  } catch (e) {
  }
}
__name(recordLatencySample, "recordLatencySample");

// src/handlers/subscription.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_response_utils();
async function createPlan(request, env2) {
  const span = startSpan("subscription.createPlan");
  try {
    const body = await request.json().catch(() => ({}));
    const { code, name, priceCents, interval, features: features2 } = body;
    if (!code || !name || !priceCents || !interval || !Array.isArray(features2)) {
      return jsonResponse(false, null, "INVALID_PLAN_DATA", 400);
    }
    await env2.DB.prepare("INSERT INTO subscription_plans (code, name, price_cents, interval, features) VALUES (?1, ?2, ?3, ?4, ?5)").bind(code, name, priceCents, interval, JSON.stringify(features2)).run();
    return jsonResponse(true, { code });
  } catch (e) {
    return jsonResponse(false, null, "PLAN_CREATE_FAILED", 500);
  } finally {
    await endSpan(env2, span, "subscription.createPlan");
  }
}
__name(createPlan, "createPlan");
async function listPlans(_req, env2) {
  const span = startSpan("subscription.listPlans");
  try {
    const rs = await env2.DB.prepare("SELECT code, name, price_cents, interval, features, active FROM subscription_plans WHERE active=1").all();
    const raw = rs.results || [];
    const plans = raw.map((p) => ({ ...p, features: JSON.parse(String(p.features || "[]")) }));
    return jsonResponse(true, { plans });
  } catch (e) {
    return jsonResponse(false, null, "PLAN_LIST_FAILED", 500);
  } finally {
    await endSpan(env2, span, "subscription.listPlans");
  }
}
__name(listPlans, "listPlans");
async function subscribe(request, env2) {
  const span = startSpan("subscription.subscribe");
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, planCode } = body;
    if (!userId || !planCode) return jsonResponse(false, null, "INVALID_SUBSCRIBE", 400);
    const ageCheck = await ensureMinimumAgeRegionAware(env2, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
    if (!ageCheck.allowed || ageCheck.requiredAge < 18) {
      return jsonResponse(false, null, "AGE_RESTRICTED", 403);
    }
    await logDataAccess(env2, userId, "subscription", planCode, request);
    const plan = await env2.DB.prepare("SELECT code, interval FROM subscription_plans WHERE code=?1 AND active=1").bind(planCode).first();
    if (!plan) return jsonResponse(false, null, "PLAN_NOT_FOUND", 404);
    const expires = computeExpiry(String(plan.interval || "monthly"));
    await env2.DB.prepare("INSERT INTO user_subscriptions (user_id, plan_code, expires_at) VALUES (?1, ?2, ?3)").bind(userId, planCode, expires).run();
    return jsonResponse(true, { userId, planCode, expiresAt: expires });
  } catch (e) {
    return jsonResponse(false, null, "SUBSCRIBE_FAILED", 500);
  } finally {
    await endSpan(env2, span, "subscription.subscribe");
  }
}
__name(subscribe, "subscribe");
async function mySubscription(request, env2) {
  const span = startSpan("subscription.mySubscription");
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return jsonResponse(false, null, "MISSING_USER", 400);
    const sub = await env2.DB.prepare('SELECT plan_code, status, expires_at FROM user_subscriptions WHERE user_id=?1 AND status="active" ORDER BY started_at DESC LIMIT 1').bind(userId).first();
    if (!sub) return jsonResponse(true, { active: false });
    return jsonResponse(true, { active: true, planCode: sub.plan_code, expiresAt: sub.expires_at });
  } catch (e) {
    return jsonResponse(false, null, "SUB_LOOKUP_FAILED", 500);
  } finally {
    await endSpan(env2, span, "subscription.mySubscription");
  }
}
__name(mySubscription, "mySubscription");
async function cancelSubscription(request, env2) {
  const span = startSpan("subscription.cancel");
  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body;
    if (!userId) return jsonResponse(false, null, "MISSING_USER", 400);
    await env2.DB.prepare('UPDATE user_subscriptions SET status="canceled", canceled_at=?2 WHERE user_id=?1 AND status="active"').bind(userId, Date.now()).run();
    return jsonResponse(true, { canceled: true });
  } catch (e) {
    return jsonResponse(false, null, "SUB_CANCEL_FAILED", 500);
  } finally {
    await endSpan(env2, span, "subscription.cancel");
  }
}
__name(cancelSubscription, "cancelSubscription");
async function checkFeatureGate(request, env2) {
  const span = startSpan("subscription.featureGate");
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const feature = url.searchParams.get("feature");
    if (!userId || !feature) return jsonResponse(false, null, "MISSING_PARAMS", 400);
    const sub = await env2.DB.prepare('SELECT plan_code FROM user_subscriptions WHERE user_id=?1 AND status="active" ORDER BY started_at DESC LIMIT 1').bind(userId).first();
    if (!sub) return jsonResponse(true, { allowed: false, reason: "NO_SUBSCRIPTION" });
    const plan = await env2.DB.prepare("SELECT features FROM subscription_plans WHERE code=?1").bind(sub.plan_code).first();
    if (!plan) return jsonResponse(true, { allowed: false, reason: "PLAN_NOT_FOUND" });
    const features2 = JSON.parse(String(plan.features || "[]"));
    const allowed = features2.includes(feature);
    if (allowed) {
      await env2.DB.prepare("INSERT INTO feature_usage (user_id, feature_code) VALUES (?1, ?2)").bind(userId, feature).run();
    }
    return jsonResponse(true, { allowed });
  } catch (e) {
    return jsonResponse(false, null, "FEATURE_CHECK_FAILED", 500);
  } finally {
    await endSpan(env2, span, "subscription.featureGate");
  }
}
__name(checkFeatureGate, "checkFeatureGate");
function computeExpiry(interval) {
  const now = Date.now();
  const ms = interval === "annual" ? 365 * 24 * 3600 * 1e3 : 30 * 24 * 3600 * 1e3;
  return new Date(now + ms).toISOString();
}
__name(computeExpiry, "computeExpiry");

// src/handlers/creator.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_response_utils();
async function getCreatorAnalytics(_req, env2, _ctx, params) {
  const span = startSpan("creator.analytics");
  try {
    const userId = params.userId;
    const gifts = await env2.DB.prepare("SELECT COUNT(*) as giftCount, SUM(value) as giftValue FROM gift_events WHERE receiver_id=?1 OR receiverId=?1").bind(userId).first();
    const payments = await env2.DB.prepare("SELECT COUNT(*) as paymentCount, SUM(amount) as paymentTotal FROM payment_events WHERE user_id=?1").bind(userId).first();
    const subs = await env2.DB.prepare('SELECT COUNT(*) as activeSubs FROM user_subscriptions WHERE plan_code IN (SELECT code FROM subscription_plans) AND user_id=?1 AND status="active"').bind(userId).first();
    return jsonResponse(true, { gifts, payments, subscriptions: subs });
  } catch (e) {
    return jsonResponse(false, null, "CREATOR_ANALYTICS_FAILED", 500);
  } finally {
    await endSpan(env2, span, "creator.analytics");
  }
}
__name(getCreatorAnalytics, "getCreatorAnalytics");

// src/handlers/payout.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_response_utils();

// src/utils/payout_validation.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var MIN_PAYOUT_CENTS = 2e3;
var MAX_DAILY_PAYOUT_CENTS = 1e6;
var COOLDOWN_PERIOD_MS = 864e5;
async function validatePayoutRequest(env2, userId, amountCents) {
  const span = startSpan("payout.validate", { userId, amountCents });
  try {
    if (amountCents < MIN_PAYOUT_CENTS) {
      return {
        allowed: false,
        reason: "BELOW_MINIMUM",
        minimumBalance: MIN_PAYOUT_CENTS
      };
    }
    const balanceResult = await env2.DB.prepare(
      `SELECT SUM(
        CASE 
          WHEN event_type = 'gift_received' THEN amount_cents 
          WHEN event_type = 'payout_completed' THEN -amount_cents
          ELSE 0 
        END
      ) as balance FROM payment_events WHERE user_id = ?`
    ).bind(userId).first();
    const balance = balanceResult?.balance || 0;
    if (balance < amountCents) {
      return {
        allowed: false,
        reason: "INSUFFICIENT_BALANCE",
        balance
      };
    }
    const pendingResult = await env2.DB.prepare(
      `SELECT COUNT(*) as count FROM payment_events 
       WHERE user_id = ? AND event_type = 'payout_pending' AND created_at > ?`
    ).bind(userId, Date.now() - COOLDOWN_PERIOD_MS).first();
    if ((pendingResult?.count || 0) > 0) {
      return {
        allowed: false,
        reason: "PENDING_PAYOUT_EXISTS"
      };
    }
    const todayStart = (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0);
    const dailyResult = await env2.DB.prepare(
      `SELECT SUM(amount_cents) as daily_total FROM payment_events 
       WHERE user_id = ? AND event_type IN ('payout_pending', 'payout_completed') 
       AND created_at > ?`
    ).bind(userId, todayStart).first();
    const dailyTotal = dailyResult?.daily_total || 0;
    const remainingDaily = MAX_DAILY_PAYOUT_CENTS - dailyTotal;
    if (amountCents > remainingDaily) {
      return {
        allowed: false,
        reason: "DAILY_LIMIT_EXCEEDED",
        dailyLimit: MAX_DAILY_PAYOUT_CENTS,
        remainingDaily
      };
    }
    const kycResult = await env2.DB.prepare(
      `SELECT kyc_status FROM payment_events 
       WHERE user_id = ? AND event_type = 'kyc_submitted' 
       ORDER BY created_at DESC LIMIT 1`
    ).bind(userId).first();
    const kycStatus = kycResult?.kyc_status || "not_submitted";
    if (kycStatus !== "approved" && amountCents >= 1e4) {
      return {
        allowed: false,
        reason: "KYC_REQUIRED"
      };
    }
    return {
      allowed: true,
      balance,
      remainingDaily
    };
  } finally {
    await endSpan(env2, span, "payout.validate");
  }
}
__name(validatePayoutRequest, "validatePayoutRequest");
async function detectPayoutFraud(env2, userId, amountCents) {
  const span = startSpan("payout.fraudCheck", { userId, amountCents });
  const reasons = [];
  try {
    const recentPayouts = await env2.DB.prepare(
      `SELECT COUNT(*) as count, SUM(amount_cents) as total 
       FROM payment_events 
       WHERE user_id = ? AND event_type IN ('payout_pending', 'payout_completed') 
       AND created_at > ?`
    ).bind(userId, Date.now() - 36e5).first();
    if ((recentPayouts?.count || 0) >= 3) {
      reasons.push("RAPID_WITHDRAWAL_PATTERN");
    }
    const balanceResult = await env2.DB.prepare(
      `SELECT SUM(
        CASE 
          WHEN event_type = 'gift_received' THEN amount_cents 
          WHEN event_type = 'payout_completed' THEN -amount_cents
          ELSE 0 
        END
      ) as balance FROM payment_events WHERE user_id = ?`
    ).bind(userId).first();
    const balance = balanceResult?.balance || 0;
    const withdrawalPercent = amountCents / balance * 100;
    if (withdrawalPercent >= 95) {
      reasons.push("FULL_BALANCE_DRAIN");
    }
    const recentGifts = await env2.DB.prepare(
      `SELECT COUNT(*) as count, SUM(amount_cents) as total 
       FROM payment_events 
       WHERE user_id = ? AND event_type = 'gift_received' 
       AND created_at > ?`
    ).bind(userId, Date.now() - 864e5).first();
    const giftTotal = recentGifts?.total || 0;
    if (giftTotal >= amountCents * 0.9 && (recentGifts?.count || 0) <= 2) {
      reasons.push("SUSPICIOUS_GIFT_PATTERN");
    }
    const accountAge = await env2.DB.prepare(
      `SELECT MIN(created_at) as first_activity 
       FROM payment_events WHERE user_id = ?`
    ).bind(userId).first();
    const accountAgeMs = Date.now() - (accountAge?.first_activity || Date.now());
    const accountAgeDays = accountAgeMs / 864e5;
    if (accountAgeDays < 7 && amountCents >= 5e3) {
      reasons.push("NEW_ACCOUNT_LARGE_WITHDRAWAL");
    }
    return {
      suspicious: reasons.length > 0,
      reasons
    };
  } finally {
    await endSpan(env2, span, "payout.fraudCheck");
  }
}
__name(detectPayoutFraud, "detectPayoutFraud");
async function logPayoutAttempt(env2, userId, amountCents, validationResult, fraudCheck) {
  try {
    await env2.DB.prepare(
      `INSERT INTO payment_events 
       (user_id, event_type, amount_cents, metadata, created_at) 
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      userId,
      "payout_attempt",
      amountCents,
      JSON.stringify({ validationResult, fraudCheck }),
      Date.now()
    ).run();
  } catch (error3) {
    console.error("Failed to log payout attempt:", error3);
  }
}
__name(logPayoutAttempt, "logPayoutAttempt");

// src/handlers/payout.handler.ts
async function requestPayout(request, env2) {
  const span = startSpan("payout.request");
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId;
    const amountCents = body.amountCents || body.amount;
    if (!userId || !amountCents || amountCents <= 0) {
      return jsonResponse(false, null, "INVALID_PAYOUT", 400);
    }
    const ageCheck = await ensureMinimumAgeRegionAware(env2, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
    if (!ageCheck.allowed || ageCheck.requiredAge < 18) {
      await logRestrictedAccess(env2, userId, "payout_request", ageCheck.region, ageCheck.requiredAge, request);
      return jsonResponse(false, null, "AGE_RESTRICTED_PAYOUT", 403);
    }
    const validation = await validatePayoutRequest(env2, userId, amountCents);
    if (!validation.allowed) {
      return jsonResponse(false, {
        reason: validation.reason,
        balance: validation.balance,
        minimumBalance: validation.minimumBalance,
        dailyLimit: validation.dailyLimit,
        remainingDaily: validation.remainingDaily
      }, validation.reason || "VALIDATION_FAILED", 400);
    }
    const fraudCheck = await detectPayoutFraud(env2, userId, amountCents);
    await logPayoutAttempt(env2, userId, amountCents, validation, fraudCheck);
    const status = fraudCheck.suspicious ? "review" : "pending";
    const id = crypto.randomUUID();
    await env2.DB.prepare(
      "INSERT INTO payment_events (id, user_id, event_type, amount_cents, status, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id,
      userId,
      "payout_pending",
      amountCents,
      status,
      JSON.stringify({ fraudReasons: fraudCheck.reasons }),
      Date.now()
    ).run();
    return jsonResponse(true, {
      id,
      status,
      suspicious: fraudCheck.suspicious,
      reasons: fraudCheck.reasons,
      balance: validation.balance,
      remainingDaily: validation.remainingDaily
    });
  } catch (e) {
    console.error("Payout request error:", e);
    return jsonResponse(false, null, "PAYOUT_ERROR", 500);
  } finally {
    await endSpan(env2, span, "payout.request");
  }
}
__name(requestPayout, "requestPayout");
async function getLedger(request, env2) {
  const span = startSpan("payout.ledger");
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split("/")[3];
    if (!userId) return jsonResponse(false, null, "MISSING_USER", 400);
    const rs = await env2.DB.prepare("SELECT id, event_type, amount, status, created_at FROM payment_events WHERE user_id=?1 ORDER BY created_at DESC LIMIT 100").bind(userId).all();
    return jsonResponse(true, { events: rs.results || [] });
  } catch (_) {
    return jsonResponse(false, null, "LEDGER_ERROR", 500);
  } finally {
    await endSpan(env2, span, "payout.ledger");
  }
}
__name(getLedger, "getLedger");
async function submitKyc(request, env2) {
  const span = startSpan("payout.kyc");
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId;
    const country = body.country;
    if (!userId || !country) return jsonResponse(false, null, "INVALID_KYC", 400);
    const id = crypto.randomUUID();
    await env2.DB.prepare("INSERT INTO payment_events (id, user_id, event_type, amount, status) VALUES (?1, ?2, ?3, ?4, ?5)").bind(id, userId, "hold", 0, "pending").run();
    return jsonResponse(true, { kycId: id, status: "pending" });
  } catch (_) {
    return jsonResponse(false, null, "KYC_ERROR", 500);
  } finally {
    await endSpan(env2, span, "payout.kyc");
  }
}
__name(submitKyc, "submitKyc");

// src/handlers/referral.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_response_utils();
function generateCode() {
  return Math.random().toString(36).substring(2, 8);
}
__name(generateCode, "generateCode");
async function createCode(request, env2) {
  const span = startSpan("referral.create");
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId;
    if (!userId) return jsonResponse(false, null, "MISSING_USER", 400);
    const ageCheck = await ensureMinimumAgeRegionAware(env2, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
    if (!ageCheck.allowed) {
      await logRestrictedAccess(env2, userId, "referral_code_creation", ageCheck.region, ageCheck.requiredAge, request);
      return jsonResponse(false, null, "AGE_RESTRICTED", 403);
    }
    const code = generateCode();
    await env2.DB.prepare("INSERT INTO referral_codes (code, owner_user_id) VALUES (?1, ?2)").bind(code, userId).run();
    return jsonResponse(true, { code });
  } catch (e) {
    return jsonResponse(false, null, "CODE_ERROR", 500);
  } finally {
    await endSpan(env2, span, "referral.create");
  }
}
__name(createCode, "createCode");
async function activateCode(request, env2) {
  const span = startSpan("referral.activate");
  try {
    const body = await request.json().catch(() => ({}));
    const code = body.code;
    const referredUserId = body.userId;
    if (!code || !referredUserId) return jsonResponse(false, null, "INVALID_ACTIVATION", 400);
    const ageCheck = await ensureMinimumAgeRegionAware(env2, referredUserId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
    if (!ageCheck.allowed) {
      await logRestrictedAccess(env2, referredUserId, "referral_activation", ageCheck.region, ageCheck.requiredAge, request);
      return jsonResponse(false, null, "AGE_RESTRICTED", 403);
    }
    const existing = await env2.DB.prepare("SELECT code FROM referral_codes WHERE code=?1").bind(code).first();
    if (!existing) return jsonResponse(false, null, "CODE_NOT_FOUND", 404);
    await env2.DB.prepare("INSERT INTO referral_activations (code, referred_user_id) VALUES (?1, ?2)").bind(code, referredUserId).run();
    await env2.DB.prepare("UPDATE referral_codes SET activations_count = activations_count + 1 WHERE code=?1").bind(code).run();
    return jsonResponse(true, { code, activated: true });
  } catch (_) {
    return jsonResponse(false, null, "ACTIVATION_ERROR", 500);
  } finally {
    await endSpan(env2, span, "referral.activate");
  }
}
__name(activateCode, "activateCode");
async function getStats(request, env2) {
  const span = startSpan("referral.stats");
  try {
    const url = new URL(request.url);
    const code = url.pathname.split("/")[3];
    if (!code) return jsonResponse(false, null, "MISSING_CODE", 400);
    const ref2 = await env2.DB.prepare("SELECT code, owner_user_id, activations_count, created_at FROM referral_codes WHERE code=?1").bind(code).first();
    if (!ref2) return jsonResponse(false, null, "CODE_NOT_FOUND", 404);
    const activations = await env2.DB.prepare("SELECT referred_user_id, created_at FROM referral_activations WHERE code=?1 ORDER BY created_at DESC LIMIT 100").bind(code).all();
    return jsonResponse(true, { code: ref2.code, owner: ref2.owner_user_id, activations_count: ref2.activations_count, activations: activations.results || [] });
  } catch (_) {
    return jsonResponse(false, null, "STATS_ERROR", 500);
  } finally {
    await endSpan(env2, span, "referral.stats");
  }
}
__name(getStats, "getStats");

// src/handlers/stripe-webhook.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_response_utils();

// src/services/coins.service.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var COIN_PACKAGES = [
  { id: "coins_100", coins: 100, priceUSD: 0.99, priceCents: 99, bonusCoins: 0, popularityRank: 1 },
  { id: "coins_500", coins: 500, priceUSD: 4.49, priceCents: 449, bonusCoins: 50, popularityRank: 2 },
  { id: "coins_1000", coins: 1e3, priceUSD: 8.99, priceCents: 899, bonusCoins: 150, popularityRank: 3 },
  { id: "coins_2500", coins: 2500, priceUSD: 19.99, priceCents: 1999, bonusCoins: 500, popularityRank: 4 },
  { id: "coins_5000", coins: 5e3, priceUSD: 39.99, priceCents: 3999, bonusCoins: 1200, popularityRank: 5 },
  { id: "coins_10000", coins: 1e4, priceUSD: 74.99, priceCents: 7499, bonusCoins: 3e3, popularityRank: 6 }
];
function generateTransactionId() {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
__name(generateTransactionId, "generateTransactionId");
function validateCoinAmount(amount) {
  return amount > 0 && amount <= 1e6 && Number.isInteger(amount);
}
__name(validateCoinAmount, "validateCoinAmount");
function coercePositiveInt(input, max = 1e6) {
  const n = Number(input);
  if (!Number.isFinite(n)) return 0;
  const i = Math.trunc(n);
  if (i <= 0) return 0;
  if (i > max) return max;
  return i;
}
__name(coercePositiveInt, "coercePositiveInt");
var CoinsService = class {
  constructor(env2) {
    this.env = env2;
  }
  static {
    __name(this, "CoinsService");
  }
  /**
   * Get user's current coin balance
   */
  async getBalance(userId) {
    const span = startSpan("coins.getBalance");
    try {
      const result = await this.env.DB.prepare(
        `SELECT 
           coin_balance as balance,
           total_earned,
           total_spent,
           total_purchased,
           updated_at as lastUpdated
         FROM users 
         WHERE id = ?1`
      ).bind(userId).first("object");
      if (!result) {
        throw new Error("User not found");
      }
      return {
        userId,
        balance: Number(result.balance ?? 0),
        totalEarned: Number(result.total_earned ?? 0),
        totalSpent: Number(result.total_spent ?? 0),
        totalPurchased: Number(result.total_purchased ?? 0),
        lastUpdated: Number(result.lastUpdated ?? Date.now())
      };
    } finally {
      await endSpan(this.env, span, "coins.getBalance");
    }
  }
  /**
   * Credit coins to user (from purchase)
   * ATOMIC operation with transaction logging
   */
  async creditCoins(userId, amount, type, metadata) {
    const span = startSpan("coins.credit");
    try {
      amount = coercePositiveInt(amount);
      if (!validateCoinAmount(amount)) {
        throw new Error("Invalid coin amount");
      }
      const currentBalance = await this.getBalance(userId);
      const newBalance = currentBalance.balance + amount;
      const transactionId = generateTransactionId();
      const now = Date.now();
      const begin = this.env.DB.prepare("BEGIN");
      const commit = this.env.DB.prepare("COMMIT");
      const rollback = this.env.DB.prepare("ROLLBACK");
      await begin.run();
      try {
        await this.env.DB.prepare(
          `UPDATE users 
           SET coin_balance = ?1,
               total_purchased = total_purchased + ?2,
               updated_at = ?3
           WHERE id = ?4`
        ).bind(newBalance, type === "purchase" ? amount : 0, now, userId).run();
        await this.env.DB.prepare(
          `INSERT INTO coin_transactions 
           (id, user_id, amount, type, balance_before, balance_after, metadata, created_at, stripe_charge_id)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
        ).bind(
          transactionId,
          userId,
          amount,
          type,
          currentBalance.balance,
          newBalance,
          JSON.stringify(metadata || {}),
          now,
          metadata?.stripeChargeId || null
        ).run();
        await commit.run();
      } catch (error_) {
        await rollback.run();
        throw error_;
      }
      if (this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["coin_credit", type, userId],
          doubles: [amount, newBalance],
          indexes: [this.env.ENVIRONMENT]
        });
      }
      console.log(`Credited ${amount} coins to user ${userId}. New balance: ${newBalance}`);
      return {
        id: transactionId,
        userId,
        amount,
        type,
        balanceBefore: currentBalance.balance,
        balanceAfter: newBalance,
        metadata,
        createdAt: now,
        stripeChargeId: metadata?.stripeChargeId
      };
    } finally {
      await endSpan(this.env, span, "coins.credit");
    }
  }
  /**
   * Debit coins from user (for gifts, etc.)
   * ATOMIC operation with balance check
   */
  async debitCoins(userId, amount, type, metadata) {
    const span = startSpan("coins.debit");
    try {
      amount = coercePositiveInt(amount);
      if (!validateCoinAmount(amount)) {
        throw new Error("Invalid coin amount");
      }
      const currentBalance = await this.getBalance(userId);
      if (currentBalance.balance < amount) {
        throw new Error("Insufficient coin balance");
      }
      const newBalance = currentBalance.balance - amount;
      const transactionId = generateTransactionId();
      const now = Date.now();
      const begin = this.env.DB.prepare("BEGIN");
      const commit = this.env.DB.prepare("COMMIT");
      const rollback = this.env.DB.prepare("ROLLBACK");
      await begin.run();
      try {
        await this.env.DB.prepare(
          `UPDATE users 
           SET coin_balance = ?1,
               total_spent = total_spent + ?2,
               updated_at = ?3
           WHERE id = ?4`
        ).bind(newBalance, amount, now, userId).run();
        await this.env.DB.prepare(
          `INSERT INTO coin_transactions 
           (id, user_id, amount, type, balance_before, balance_after, metadata, created_at, related_user_id, gift_id)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
        ).bind(
          transactionId,
          userId,
          -amount,
          // Negative for debit
          type,
          currentBalance.balance,
          newBalance,
          JSON.stringify(metadata || {}),
          now,
          metadata?.relatedUserId || null,
          metadata?.giftId || null
        ).run();
        await commit.run();
      } catch (error_) {
        await rollback.run();
        throw error_;
      }
      if (this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["coin_debit", type, userId],
          doubles: [amount, newBalance],
          indexes: [this.env.ENVIRONMENT]
        });
      }
      console.log(`Debited ${amount} coins from user ${userId}. New balance: ${newBalance}`);
      return {
        id: transactionId,
        userId,
        amount: -amount,
        type,
        balanceBefore: currentBalance.balance,
        balanceAfter: newBalance,
        metadata,
        createdAt: now,
        relatedUserId: metadata?.relatedUserId,
        giftId: metadata?.giftId
      };
    } finally {
      await endSpan(this.env, span, "coins.debit");
    }
  }
  /**
   * Transfer coins between users (for gifts)
   * ATOMIC operation - both debit and credit in single transaction
   */
  async transferCoins(fromUserId, toUserId, amount, giftId, videoId) {
    const span = startSpan("coins.transfer");
    try {
      const debitTx = await this.debitCoins(fromUserId, amount, "gift_sent", {
        relatedUserId: toUserId,
        giftId,
        videoId
      });
      const creditTx = await this.creditCoins(toUserId, amount, "reward", {
        relatedUserId: fromUserId,
        giftId,
        videoId
      });
      return { debit: debitTx, credit: creditTx };
    } finally {
      await endSpan(this.env, span, "coins.transfer");
    }
  }
  /**
   * Get transaction history with pagination
   */
  async getTransactionHistory(userId, limit = 50, offset = 0) {
    const span = startSpan("coins.getHistory");
    try {
      limit = Math.max(10, Math.min(100, Math.trunc(Number(limit)) || 50));
      offset = Math.max(0, Math.trunc(Number(offset)) || 0);
      const results = await this.env.DB.prepare(
        `SELECT 
           id, user_id, amount, type, 
           balance_before, balance_after, 
           metadata, created_at, stripe_charge_id,
           related_user_id, gift_id
         FROM coin_transactions
         WHERE user_id = ?1
         ORDER BY created_at DESC
         LIMIT ?2 OFFSET ?3`
      ).bind(userId, limit, offset).all();
      return results.results.map((row) => ({
        id: row.id,
        userId: row.user_id,
        amount: row.amount,
        type: row.type,
        balanceBefore: row.balance_before,
        balanceAfter: row.balance_after,
        metadata: row.metadata ? JSON.parse(row.metadata) : void 0,
        createdAt: row.created_at,
        stripeChargeId: row.stripe_charge_id,
        relatedUserId: row.related_user_id,
        giftId: row.gift_id
      }));
    } finally {
      await endSpan(this.env, span, "coins.getHistory");
    }
  }
  /**
   * Get coin packages available for purchase
   */
  getCoinPackages() {
    return COIN_PACKAGES;
  }
  /**
   * Validate and get package details
   */
  getPackageById(packageId) {
    return COIN_PACKAGES.find((pkg) => pkg.id === packageId) || null;
  }
};
function createCoinsService(env2) {
  return new CoinsService(env2);
}
__name(createCoinsService, "createCoinsService");

// src/handlers/stripe-webhook.handler.ts
async function verifyStripeSignature(payload, signature, secret) {
  try {
    const encoder = new TextEncoder();
    const signatureParts = signature.split(",");
    let timestamp = "";
    let expectedSignature = "";
    for (const part of signatureParts) {
      const [key2, value] = part.split("=");
      if (key2 === "t") timestamp = value;
      if (key2 === "v1") expectedSignature = value;
    }
    if (!timestamp || !expectedSignature) {
      return false;
    }
    const signedPayload = `${timestamp}.${payload}`;
    const signedData = encoder.encode(signedPayload);
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, signedData);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const computedSignature = signatureArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    if (computedSignature.length !== expectedSignature.length) {
      return false;
    }
    let mismatch = 0;
    for (let i = 0; i < computedSignature.length; i++) {
      if (computedSignature[i] !== expectedSignature[i]) {
        mismatch++;
      }
    }
    return mismatch === 0;
  } catch (error3) {
    console.error("Stripe signature verification failed:", error3);
    return false;
  }
}
__name(verifyStripeSignature, "verifyStripeSignature");
async function handleStripeWebhook(request, env2) {
  const span = startSpan("stripe.webhook");
  try {
    if (!env2.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return jsonResponse(false, null, "WEBHOOK_NOT_CONFIGURED", 500);
    }
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return jsonResponse(false, null, "MISSING_SIGNATURE", 400);
    }
    const isValid = await verifyStripeSignature(
      payload,
      signature,
      env2.STRIPE_WEBHOOK_SECRET
    );
    if (!isValid) {
      console.error("Invalid Stripe webhook signature");
      return jsonResponse(false, null, "INVALID_SIGNATURE", 401);
    }
    const event = JSON.parse(payload);
    const eventType = event.type;
    const eventData = event.data.object;
    console.log(`Received Stripe webhook: ${eventType}`, {
      id: event.id,
      objectId: eventData.id
    });
    switch (eventType) {
      case "charge.succeeded":
        await handleChargeSucceeded(env2, eventData);
        break;
      case "charge.failed":
        await handleChargeFailed(env2, eventData);
        break;
      case "transfer.created":
        await handleTransferCreated(env2, eventData);
        break;
      case "transfer.paid":
        await handleTransferPaid(env2, eventData);
        break;
      case "transfer.failed":
        await handleTransferFailed(env2, eventData);
        break;
      case "payout.paid":
        await handlePayoutPaid(env2, eventData);
        break;
      case "payout.failed":
        await handlePayoutFailed(env2, eventData);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error3) {
    console.error("Stripe webhook error:", error3);
    return jsonResponse(false, null, "WEBHOOK_ERROR", 500);
  } finally {
    await endSpan(env2, span, "stripe.webhook");
  }
}
__name(handleStripeWebhook, "handleStripeWebhook");
async function handleChargeSucceeded(env2, charge) {
  const userId = charge.metadata?.userId;
  const amountCents = charge.amount;
  const chargeId = charge.id;
  const productType = charge.metadata?.productType;
  const packageId = charge.metadata?.packageId;
  if (!userId) {
    console.error("Charge missing userId in metadata:", chargeId);
    return;
  }
  try {
    await env2.DB.prepare(
      `UPDATE payment_events 
       SET status = 'completed', 
           metadata = json_set(metadata, '$.stripeChargeId', ?2),
           updated_at = ?3
       WHERE user_id = ?1 
         AND event_type = 'purchase' 
         AND amount_cents = ?4
         AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`
    ).bind(userId, chargeId, Date.now(), amountCents).run();
    if (productType === "coins") {
      const coinsService = createCoinsService(env2);
      const coinPackage = packageId ? coinsService.getPackageById(packageId) : null;
      let totalCoins = 0;
      if (coinPackage) {
        totalCoins = coinPackage.coins + (coinPackage.bonusCoins || 0);
      } else {
        totalCoins = charge.metadata?.coins ? parseInt(charge.metadata.coins) : 0;
      }
      if (totalCoins > 0) {
        await coinsService.creditCoins(
          userId,
          totalCoins,
          "purchase",
          {
            stripeChargeId: chargeId,
            packageId,
            amountCents,
            bonusCoins: coinPackage?.bonusCoins || 0,
            purchaseDate: Date.now()
          }
        );
        console.log(`\u2705 Charge succeeded for user ${userId}: ${totalCoins} coins credited`, {
          chargeId,
          packageId,
          amountCents,
          baseCoins: coinPackage?.coins || 0,
          bonusCoins: coinPackage?.bonusCoins || 0
        });
      } else {
        console.error("\u274C No coins to credit for charge:", chargeId);
      }
    } else if (productType === "premium") {
      await env2.DB.prepare(
        `UPDATE users 
         SET premium_status = 'active',
             premium_tier = ?1,
             premium_expires_at = ?2,
             updated_at = ?3
         WHERE id = ?4`
      ).bind(
        charge.metadata?.tier || "vip",
        Date.now() + 30 * 24 * 60 * 60 * 1e3,
        // 30 days
        Date.now(),
        userId
      ).run();
      console.log(`\u2705 Premium subscription activated for user ${userId}`, {
        chargeId,
        tier: charge.metadata?.tier || "vip"
      });
    } else {
      console.warn(`\u26A0\uFE0F Unknown product type: ${productType} for charge ${chargeId}`);
    }
  } catch (error3) {
    console.error("\u274C Error handling charge.succeeded:", error3);
    throw error3;
  }
}
__name(handleChargeSucceeded, "handleChargeSucceeded");
async function handleChargeFailed(env2, charge) {
  const userId = charge.metadata?.userId;
  const chargeId = charge.id;
  const failureCode = charge.failure_code;
  const failureMessage = charge.failure_message;
  if (!userId) {
    console.error("Failed charge missing userId:", chargeId);
    return;
  }
  try {
    await env2.DB.prepare(
      `UPDATE payment_events 
       SET status = 'failed',
           metadata = json_set(
             metadata, 
             '$.stripeChargeId', ?2,
             '$.failureCode', ?3,
             '$.failureMessage', ?4
           ),
           updated_at = ?5
       WHERE user_id = ?1
         AND event_type = 'purchase'
         AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`
    ).bind(userId, chargeId, failureCode, failureMessage, Date.now()).run();
    console.log(`Charge failed for user ${userId}:`, {
      chargeId,
      failureCode,
      failureMessage
    });
  } catch (error3) {
    console.error("Error handling charge.failed:", error3);
  }
}
__name(handleChargeFailed, "handleChargeFailed");
async function handleTransferCreated(env2, transfer) {
  const userId = transfer.metadata?.userId;
  const transferId = transfer.id;
  const amountCents = transfer.amount;
  if (!userId) {
    console.error("Transfer missing userId:", transferId);
    return;
  }
  try {
    await env2.DB.prepare(
      `UPDATE payment_events 
       SET status = 'processing',
           metadata = json_set(metadata, '$.stripeTransferId', ?2),
           updated_at = ?3
       WHERE user_id = ?1
         AND event_type = 'payout_pending'
         AND amount_cents = ?4
         AND status IN ('pending', 'review')
       ORDER BY created_at DESC
       LIMIT 1`
    ).bind(userId, transferId, Date.now(), amountCents).run();
    console.log(`Transfer created for user ${userId}:`, {
      transferId,
      amountCents
    });
  } catch (error3) {
    console.error("Error handling transfer.created:", error3);
  }
}
__name(handleTransferCreated, "handleTransferCreated");
async function handleTransferPaid(env2, transfer) {
  const userId = transfer.metadata?.userId;
  const transferId = transfer.id;
  if (!userId) {
    console.error("Transfer paid missing userId:", transferId);
    return;
  }
  try {
    await env2.DB.prepare(
      `UPDATE payment_events 
       SET status = 'completed',
           updated_at = ?2
       WHERE user_id = ?1
         AND metadata LIKE '%' || ?3 || '%'
         AND event_type = 'payout_pending'
       LIMIT 1`
    ).bind(userId, Date.now(), transferId).run();
    console.log(`Transfer paid for user ${userId}:`, { transferId });
  } catch (error3) {
    console.error("Error handling transfer.paid:", error3);
  }
}
__name(handleTransferPaid, "handleTransferPaid");
async function handleTransferFailed(env2, transfer) {
  const userId = transfer.metadata?.userId;
  const transferId = transfer.id;
  const failureCode = transfer.failure_code;
  const failureMessage = transfer.failure_message;
  if (!userId) {
    console.error("Transfer failed missing userId:", transferId);
    return;
  }
  try {
    await env2.DB.prepare(
      `UPDATE payment_events 
       SET status = 'failed',
           metadata = json_set(
             metadata,
             '$.failureCode', ?2,
             '$.failureMessage', ?3
           ),
           updated_at = ?4
       WHERE user_id = ?1
         AND metadata LIKE '%' || ?5 || '%'
         AND event_type = 'payout_pending'
       LIMIT 1`
    ).bind(userId, failureCode, failureMessage, Date.now(), transferId).run();
    const result = await env2.DB.prepare(
      `SELECT amount_cents FROM payment_events 
       WHERE user_id = ?1 
         AND metadata LIKE '%' || ?2 || '%'
       LIMIT 1`
    ).bind(userId, transferId).first();
    if (result && result.amount_cents) {
      await env2.DB.prepare(
        `UPDATE users 
         SET balance_cents = balance_cents + ?1,
             updated_at = ?2
         WHERE id = ?3`
      ).bind(result.amount_cents, Date.now(), userId).run();
    }
    console.log(`Transfer failed for user ${userId}:`, {
      transferId,
      failureCode,
      failureMessage
    });
  } catch (error3) {
    console.error("Error handling transfer.failed:", error3);
  }
}
__name(handleTransferFailed, "handleTransferFailed");
async function handlePayoutPaid(_env, payout) {
  const payoutId = payout.id;
  const amountCents = payout.amount;
  try {
    console.log("Payout paid:", {
      payoutId,
      amountCents,
      arrivalDate: payout.arrival_date
    });
  } catch (error3) {
    console.error("Error handling payout.paid:", error3);
  }
}
__name(handlePayoutPaid, "handlePayoutPaid");
async function handlePayoutFailed(_env, payout) {
  const payoutId = payout.id;
  const failureCode = payout.failure_code;
  const failureMessage = payout.failure_message;
  try {
    console.error("Payout failed:", {
      payoutId,
      failureCode,
      failureMessage
    });
  } catch (error3) {
    console.error("Error handling payout.failed:", error3);
  }
}
__name(handlePayoutFailed, "handlePayoutFailed");

// src/handlers/agora.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_response_utils();

// src/services/agora.service.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_agora_token = __toESM(require_agora_token());
var AgoraService = class {
  static {
    __name(this, "AgoraService");
  }
  appId;
  appCertificate;
  defaultExpiry;
  tokenCache;
  constructor(appId, appCertificate, defaultExpiry = 43200) {
    if (!appId || !appCertificate) {
      throw new Error("Agora credentials required: appId and appCertificate");
    }
    this.appId = appId;
    this.appCertificate = appCertificate;
    this.defaultExpiry = defaultExpiry;
    this.tokenCache = /* @__PURE__ */ new Map();
  }
  /**
   * Generate Agora RTC token
   */
  async generateToken(params) {
    const {
      channelName,
      uid,
      role = "publisher",
      expirySeconds = this.defaultExpiry
    } = params;
    if (!channelName) {
      throw new Error("channelName is required");
    }
    if (uid === void 0 || uid === null) {
      throw new Error("uid is required");
    }
    if (!["publisher", "subscriber"].includes(role)) {
      throw new Error('role must be "publisher" or "subscriber"');
    }
    const numericUid = typeof uid === "string" ? parseInt(uid, 10) : uid;
    if (isNaN(numericUid) || numericUid < 0 || numericUid > 2 ** 32 - 1) {
      throw new Error("uid must be a valid number between 0 and 4294967295");
    }
    const cacheKey = `${channelName}:${numericUid}:${role}`;
    const cached = this.tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() + 3e5) {
      return {
        token: cached.token,
        uid: numericUid,
        expiresAt: cached.expiresAt,
        channelName
      };
    }
    const agoraRole = role === "subscriber" ? import_agora_token.RtcRole.SUBSCRIBER : import_agora_token.RtcRole.PUBLISHER;
    const currentTimeInSeconds = Math.floor(Date.now() / 1e3);
    const privilegeExpiredTs = currentTimeInSeconds + expirySeconds;
    const expiresAtMs = privilegeExpiredTs * 1e3;
    const token = import_agora_token.RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelName,
      numericUid,
      agoraRole,
      privilegeExpiredTs
    );
    this.tokenCache.set(cacheKey, {
      token,
      expiresAt: expiresAtMs
    });
    this.cleanupCache();
    return {
      token,
      uid: numericUid,
      expiresAt: expiresAtMs,
      channelName
    };
  }
  /**
   * Renew an existing token
   */
  async renewToken(params) {
    const cacheKey = `${params.channelName}:${params.uid}:${params.role || "publisher"}`;
    this.tokenCache.delete(cacheKey);
    return this.generateToken(params);
  }
  /**
   * Check if Agora is properly configured
   */
  isConfigured() {
    return !!(this.appId && this.appCertificate);
  }
  /**
   * Get health status
   */
  getHealth() {
    return {
      status: "ok",
      configured: this.isConfigured(),
      cacheSize: this.tokenCache.size
    };
  }
  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.tokenCache.entries()) {
      if (value.expiresAt <= now) {
        this.tokenCache.delete(key);
      }
    }
    if (this.tokenCache.size > 1e3) {
      const entries = Array.from(this.tokenCache.entries());
      entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      const toRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.tokenCache.delete(entries[i][0]);
      }
    }
  }
};

// src/handlers/agora.handler.ts
var cachedService = null;
function getAgoraService(env2) {
  if (cachedService) return cachedService;
  if (!env2.AGORA_APP_ID || !env2.AGORA_APP_CERTIFICATE) {
    throw new Error("Agora not configured");
  }
  cachedService = new AgoraService(
    env2.AGORA_APP_ID,
    env2.AGORA_APP_CERTIFICATE
  );
  return cachedService;
}
__name(getAgoraService, "getAgoraService");
async function parseJson(request) {
  try {
    return await request.json();
  } catch (error3) {
    return null;
  }
}
__name(parseJson, "parseJson");
async function generateToken2(request, env2) {
  const span = startSpan("agora.generateToken");
  try {
    if (!env2.AGORA_APP_ID || !env2.AGORA_APP_CERTIFICATE) {
      return jsonResponse(false, null, "AGORA_NOT_CONFIGURED", 503);
    }
    const body = await parseJson(request);
    if (!body) {
      return jsonResponse(false, null, "INVALID_BODY", 400);
    }
    const channelName = body.channelName;
    const uidRaw = body.uid;
    const role = body.role || "publisher";
    const uid = uidRaw === void 0 ? void 0 : Number(uidRaw);
    try {
      const service = getAgoraService(env2);
      const result = await service.generateToken({
        channelName,
        uid,
        role
      });
      return jsonResponse(true, result, null, 200);
    } catch (error3) {
      const message = error3?.message || "Failed to generate token";
      const isRateLimit = message.toLowerCase().includes("rate limit");
      const code = isRateLimit ? 429 : 400;
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "AGORA_TOKEN_ERROR",
            message
          }
        }),
        {
          status: code,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  } finally {
    await endSpan(env2, span, "agora.generateToken");
  }
}
__name(generateToken2, "generateToken");
async function renewToken(request, env2) {
  const span = startSpan("agora.renewToken");
  try {
    if (!env2.AGORA_APP_ID || !env2.AGORA_APP_CERTIFICATE) {
      return jsonResponse(false, null, "AGORA_NOT_CONFIGURED", 503);
    }
    const body = await parseJson(request);
    if (!body) {
      return jsonResponse(false, null, "INVALID_BODY", 400);
    }
    const channelName = body.channelName;
    const uidRaw = body.uid;
    const role = body.role || "publisher";
    const uid = uidRaw === void 0 ? void 0 : Number(uidRaw);
    try {
      const service = getAgoraService(env2);
      const result = await service.renewToken({
        channelName,
        uid,
        role
      });
      return jsonResponse(true, result, null, 200);
    } catch (error3) {
      const message = error3?.message || "Failed to renew token";
      const isRateLimit = message.toLowerCase().includes("rate limit");
      const code = isRateLimit ? 429 : 400;
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "AGORA_TOKEN_ERROR",
            message
          }
        }),
        {
          status: code,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  } finally {
    await endSpan(env2, span, "agora.renewToken");
  }
}
__name(renewToken, "renewToken");
async function health(_request, env2) {
  try {
    if (!env2.AGORA_APP_ID || !env2.AGORA_APP_CERTIFICATE) {
      return jsonResponse(false, null, "AGORA_NOT_CONFIGURED", 503);
    }
    const service = getAgoraService(env2);
    return jsonResponse(true, service.getHealth());
  } catch (error3) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "AGORA_HEALTH_ERROR",
          message: error3?.message || "Failed to get Agora health"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(health, "health");

// src/handlers/agora.test.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_response_utils();
async function testAgoraToken(request, env2) {
  try {
    if (!env2.AGORA_APP_ID || !env2.AGORA_APP_CERTIFICATE) {
      return jsonResponse(false, null, "AGORA_NOT_CONFIGURED", 503);
    }
    const body = await request.json().catch(() => null);
    if (!body) {
      return jsonResponse(false, null, "INVALID_BODY", 400);
    }
    const { channelName, uid, role = "publisher" } = body;
    if (!channelName || !uid) {
      return jsonResponse(false, null, "Missing channelName or uid", 400);
    }
    const service = new AgoraService(
      env2.AGORA_APP_ID,
      env2.AGORA_APP_CERTIFICATE
    );
    const result = await service.generateToken({
      channelName,
      uid,
      role
    });
    return jsonResponse(true, result, null, 200);
  } catch (error3) {
    return jsonResponse(false, null, error3?.message || "Test failed", 500);
  }
}
__name(testAgoraToken, "testAgoraToken");

// src/handlers/device-telemetry.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
async function receiveDeviceMetrics(req, env2) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    if (items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: { code: "INVALID_PAYLOAD", message: "Empty payload" } }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const first = items[0];
    if (!first.deviceId || !first.platform || !first.metrics) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INVALID_PAYLOAD", message: "Missing required fields" }
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS device_metrics (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        device_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        app_version TEXT,
        session_id TEXT,
        startup_time_ms INTEGER,
        auth_latency_ms INTEGER,
        ws_connect_time_ms INTEGER,
        first_message_rtt_ms INTEGER,
        token_rotation_latency_ms INTEGER,
        operation TEXT,
        status_code INTEGER,
        error TEXT,
        timestamp TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    await env2.DB.prepare("BEGIN").run();
    for (const itm of items) {
      await env2.DB.prepare(`
        INSERT INTO device_metrics (
          device_id,
          platform,
          app_version,
          session_id,
          startup_time_ms,
          auth_latency_ms,
          ws_connect_time_ms,
          first_message_rtt_ms,
          token_rotation_latency_ms,
          operation,
          status_code,
          error,
          timestamp
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
      `).bind(
        itm.deviceId,
        itm.platform,
        itm.appVersion || null,
        itm.sessionId || null,
        itm.metrics.startupTimeMs || null,
        itm.metrics.authLatencyMs || null,
        itm.metrics.wsConnectTimeMs || null,
        itm.metrics.firstMessageRttMs || null,
        itm.metrics.tokenRotationLatencyMs || null,
        itm.metrics.operation || null,
        itm.metrics.statusCode || null,
        itm.metrics.error || null,
        itm.timestamp
      ).run();
    }
    await env2.DB.prepare("COMMIT").run();
    try {
      const sample = items[0];
      console.log("[DeviceTelemetry]", {
        device: `${sample.platform}/${(sample.deviceId || "").substring(0, 8)}`,
        metrics: sample.metrics,
        count: items.length
      });
    } catch {
    }
    return new Response(
      JSON.stringify({ success: true, data: { received: true, count: items.length } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error3) {
    console.error("[DeviceTelemetry] Error:", error3);
    try {
      await env2.DB.prepare("ROLLBACK").run();
    } catch {
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to store metrics" }
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(receiveDeviceMetrics, "receiveDeviceMetrics");
async function getDeviceMetricsAggregates(_req, env2) {
  try {
    const since = Date.now() - 24 * 3600 * 1e3;
    const sinceDate = new Date(since).toISOString();
    const aggregates = await env2.DB.prepare(`
      SELECT
        platform,
        COUNT(*) as sample_count,
        AVG(auth_latency_ms) as avg_auth_latency,
        AVG(ws_connect_time_ms) as avg_ws_connect,
        AVG(first_message_rtt_ms) as avg_first_msg_rtt,
        AVG(token_rotation_latency_ms) as avg_token_rotation,
        COUNT(DISTINCT device_id) as unique_devices,
        COUNT(DISTINCT session_id) as unique_sessions
      FROM device_metrics
      WHERE created_at > ?1
      GROUP BY platform
    `).bind(sinceDate).all();
    const latencyDist = await env2.DB.prepare(`
      SELECT auth_latency_ms, ws_connect_time_ms, first_message_rtt_ms
      FROM device_metrics
      WHERE created_at > ?1 AND auth_latency_ms IS NOT NULL
      ORDER BY auth_latency_ms
    `).bind(sinceDate).all();
    const authLatencies = latencyDist.results?.map((r) => r.auth_latency_ms).filter((n) => n) || [];
    const p50Auth = authLatencies[Math.floor(authLatencies.length * 0.5)] || null;
    const p95Auth = authLatencies[Math.floor(authLatencies.length * 0.95)] || null;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          aggregates: aggregates.results,
          percentiles: {
            auth_p50: p50Auth,
            auth_p95: p95Auth
          },
          period: "24h"
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error3) {
    console.error("[DeviceTelemetry] Aggregates error:", error3);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to get aggregates" }
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(getDeviceMetricsAggregates, "getDeviceMetricsAggregates");

// src/handlers/auth.sync.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_response_utils();
async function syncUser(req, env2) {
  try {
    if (!env2?.DB) {
      return new Response(JSON.stringify({ success: false, error: { code: "ENV_MISCONFIG", message: "DB binding missing" } }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "Missing token" } }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    const fbUser = await verifyFirebaseToken(token, env2);
    if (!fbUser) {
      return new Response(JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid Firebase token" } }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    const body = await req.json().catch(() => ({}));
    const uid = body?.uid || fbUser.uid;
    const email = body?.email || fbUser.email || null;
    const username = body?.username || null;
    const displayName = body?.displayName || null;
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        username TEXT,
        display_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    const existing = await env2.DB.prepare("SELECT id FROM users WHERE id = ?1").bind(uid).first();
    if (!existing) {
      await env2.DB.prepare("INSERT INTO users (id, email, username, display_name) VALUES (?1, ?2, ?3, ?4)").bind(uid, email, username, displayName).run();
    } else {
      await env2.DB.prepare("UPDATE users SET email = ?2, username = ?3, display_name = ?4 WHERE id = ?1").bind(uid, email, username, displayName).run();
    }
    return jsonResponse(true, { synced: true, uid });
  } catch (error3) {
    console.error("[auth.sync] Error:", error3);
    return new Response(JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to sync user" } }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
__name(syncUser, "syncUser");

// src/ws/chat.websocket.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var rooms = /* @__PURE__ */ new Map();
function getRoom(id) {
  let r = rooms.get(id);
  if (!r) {
    r = /* @__PURE__ */ new Set();
    rooms.set(id, r);
  }
  return r;
}
__name(getRoom, "getRoom");
var handleChatWebSocket = /* @__PURE__ */ __name(async (request, env2, _ctx, params) => {
  try {
    let sendError2 = function(code, message) {
      server.send(JSON.stringify({ type: "error", code, message }));
      try {
        server.close(code, message);
      } catch {
      }
    };
    var sendError = sendError2;
    __name(sendError2, "sendError");
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket", { status: 400 });
    }
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const rlKey = `ws:ratelimit:${ip}:${params.roomId || "latencyroom"}`;
    const currentStr = await env2.RATE_LIMIT.get(rlKey);
    const current = currentStr ? Number.parseInt(currentStr, 10) : 0;
    if (current >= 60) {
      return new Response(JSON.stringify({ success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many websocket upgrades. Try again later." } }), { status: 429, headers: { "Content-Type": "application/json" } });
    }
    await env2.RATE_LIMIT.put(rlKey, String(current + 1), { expirationTtl: 60 });
    const roomId = params.roomId || "latencyroom";
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    const room = getRoom(roomId);
    const MAX_MSG_BYTES = 2048;
    const MAX_CHAT_LEN = 256;
    const PRESENCE_TTL = 60;
    const TYPING_TTL = 5;
    const presenceKey = /* @__PURE__ */ __name((uid, room2) => `presence:${room2}:${uid}`, "presenceKey");
    const typingKey = /* @__PURE__ */ __name((uid, room2) => `typing:${room2}:${uid}`, "typingKey");
    const setPresence = /* @__PURE__ */ __name(async (uid) => {
      if (!uid) return;
      await env2.RATE_LIMIT.put(presenceKey(uid, roomId), String(Date.now()), { expirationTtl: PRESENCE_TTL });
      if (env2.ANALYTICS) {
        env2.ANALYTICS.writeDataPoint({ blobs: ["presence_update", roomId], doubles: [1], indexes: [env2.ENVIRONMENT] });
      }
    }, "setPresence");
    const setTyping = /* @__PURE__ */ __name(async (uid) => {
      if (!uid) return;
      await env2.RATE_LIMIT.put(typingKey(uid, roomId), String(Date.now()), { expirationTtl: TYPING_TTL });
      if (env2.ANALYTICS) {
        env2.ANALYTICS.writeDataPoint({ blobs: ["typing_update", roomId], doubles: [1], indexes: [env2.ENVIRONMENT] });
      }
    }, "setTyping");
    const clearPresence = /* @__PURE__ */ __name(async (uid) => {
      if (!uid) return;
      await env2.RATE_LIMIT.delete(presenceKey(uid, roomId));
    }, "clearPresence");
    const clearTyping = /* @__PURE__ */ __name(async (uid) => {
      if (!uid) return;
      await env2.RATE_LIMIT.delete(typingKey(uid, roomId));
    }, "clearTyping");
    let authed = false;
    let userContext = {};
    const handleRateLimit = /* @__PURE__ */ __name(async (ipAddr, roomKey) => {
      const msgKey = `ws:msg:${ipAddr}:${roomKey}`;
      const msgStr = await env2.RATE_LIMIT.get(msgKey);
      const msgCount = msgStr ? Number.parseInt(msgStr, 10) : 0;
      if (msgCount > 300) {
        sendError2(429, "Message rate exceeded");
        return false;
      }
      await env2.RATE_LIMIT.put(msgKey, String(msgCount + 1), { expirationTtl: 60 });
      return true;
    }, "handleRateLimit");
    const isValidRole = /* @__PURE__ */ __name((role) => /^ROLE_(ADMIN|OPS|USER)$/.test(role), "isValidRole");
    const isOversized = /* @__PURE__ */ __name((data) => {
      try {
        const size = typeof data === "string" ? new TextEncoder().encode(data).byteLength : data?.byteLength ?? 0;
        return size > MAX_MSG_BYTES;
      } catch {
        return false;
      }
    }, "isOversized");
    const parseJSON = /* @__PURE__ */ __name((raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }, "parseJSON");
    const validateAuth = /* @__PURE__ */ __name((raw) => {
      const auth = parseJSON(raw);
      if (!auth) return { ok: false, code: 400, msg: "Malformed auth payload" };
      if (!auth.token || typeof auth.token !== "string" || auth.token.length > 512) return { ok: false, code: 401, msg: "Invalid token" };
      if (!auth.role || typeof auth.role !== "string" || !isValidRole(auth.role)) return { ok: false, code: 401, msg: "Invalid role" };
      if (typeof auth.twofa !== "boolean") return { ok: false, code: 401, msg: "Missing auth fields" };
      if (auth.token.length < 8) return { ok: false, code: 401, msg: "Invalid token" };
      return { ok: true, auth };
    }, "validateAuth");
    const ALLOWED_ORIGINS2 = [
      "https://spaktok.com",
      "https://app.spaktok.com",
      "https://admin.spaktok.com"
    ];
    const validateOrigin = /* @__PURE__ */ __name((originHeader) => {
      if (!originHeader) return false;
      return ALLOWED_ORIGINS2.includes(originHeader) || env2.NODE_ENV !== "production" && originHeader.startsWith("http://localhost");
    }, "validateOrigin");
    const validateMsg = /* @__PURE__ */ __name((msg) => {
      if (!["ping", "chat", "admin", "ops", "support"].includes(msg.type)) return { ok: false, code: 403, msg: "Invalid message type" };
      if (msg.type === "chat") {
        if (typeof msg.payload !== "string" || msg.payload.length === 0 || msg.payload.length > MAX_CHAT_LEN) return { ok: false, code: 400, msg: "Invalid chat payload" };
      }
      if (msg.type === "ping" && msg.payload && typeof msg.payload !== "number") return { ok: false, code: 400, msg: "Invalid ping payload" };
      return { ok: true };
    }, "validateMsg");
    const handlePing = /* @__PURE__ */ __name(() => {
      try {
        server.send(JSON.stringify({ type: "pong", ts: Date.now() }));
      } catch {
      }
    }, "handlePing");
    const broadcastChat = /* @__PURE__ */ __name((payload) => {
      for (const ws of room) {
        if (ws === server) continue;
        try {
          ws.send(JSON.stringify({ type: "chat", payload, context: userContext }));
        } catch {
          room.delete(ws);
        }
      }
    }, "broadcastChat");
    const processAuthedMessage = /* @__PURE__ */ __name(async (raw) => {
      const msg = parseJSON(raw);
      if (!msg) {
        sendError2(400, "Malformed message");
        return;
      }
      const v = validateMsg(msg);
      if (!v.ok) {
        sendError2(v.code, v.msg);
        return;
      }
      if (msg.type === "admin" && userContext.role !== "ROLE_ADMIN") {
        sendError2(403, "Admin access denied");
        return;
      }
      if (msg.type === "ops" && userContext.role !== "ROLE_OPS") {
        sendError2(403, "Ops access denied");
        return;
      }
      if (msg.type === "ping") {
        handlePing();
        await setPresence(userContext.userId);
        return;
      }
      if (msg.type === "chat") {
        broadcastChat(msg.payload);
        return;
      }
      if (msg.type === "support" && msg.payload === "typing") {
        await setTyping(userContext.userId);
        return;
      }
      server.send(JSON.stringify({ type: msg.type, payload: msg.payload, context: userContext }));
    }, "processAuthedMessage");
    server.addEventListener("message", async (ev) => {
      if (ev.origin && !ALLOWED_ORIGINS2.includes(ev.origin)) {
        sendError2(1008, "Origin not allowed");
        return;
      }
      const roomKey = params.roomId || roomId;
      if (!await handleRateLimit(ip, roomKey)) return;
      const data = ev.data;
      if (isOversized(data)) {
        sendError2(413, "Payload too large");
        return;
      }
      const raw = String(data || "").trim();
      if (!raw) return;
      if (!authed) {
        const res = validateAuth(raw);
        if (!res.ok) {
          sendError2(res.code, res.msg);
          return;
        }
        const auth = res.auth;
        authed = true;
        userContext = { userId: String(auth.token ?? "").slice(0, 8), role: auth.role, twofa: auth.twofa };
        room.add(server);
        await setPresence(userContext.userId);
        server.send(JSON.stringify({ type: "welcome", roomId, connections: room.size, ts: Date.now(), context: userContext }));
        return;
      }
      await processAuthedMessage(raw);
    });
    server.addEventListener("close", async () => {
      room.delete(server);
      await clearPresence(userContext.userId);
      await clearTyping(userContext.userId);
    });
    return new Response(null, { status: 101, webSocket: client });
  } catch (e) {
    console.error("WebSocket setup error", e);
    return new Response(JSON.stringify({ success: false, error: "WEBSOCKET_INIT_FAILED", message: String(e.message || "error") }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}, "handleChatWebSocket");

// src/handlers/chat.handler.unified.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/core/unified-pipeline.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var RequestPriority = /* @__PURE__ */ ((RequestPriority2) => {
  RequestPriority2[RequestPriority2["CRITICAL"] = 0] = "CRITICAL";
  RequestPriority2[RequestPriority2["HIGH"] = 1] = "HIGH";
  RequestPriority2[RequestPriority2["NORMAL"] = 2] = "NORMAL";
  RequestPriority2[RequestPriority2["LOW"] = 3] = "LOW";
  return RequestPriority2;
})(RequestPriority || {});
var UnifiedPipeline = class {
  static {
    __name(this, "UnifiedPipeline");
  }
  env;
  ctx;
  context;
  constructor(env2, ctx, request) {
    this.env = env2;
    this.ctx = ctx;
    const url = new URL(request.url);
    const headers = /* @__PURE__ */ new Map();
    request.headers.forEach((value, key) => headers.set(key, value));
    this.context = {
      id: crypto.randomUUID(),
      traceId: request.headers.get("x-trace-id") ?? `trace-${Date.now()}`,
      priority: this.determinePriority(request),
      stages: [],
      metadata: /* @__PURE__ */ new Map(),
      method: request.method,
      path: url.pathname,
      headers
    };
  }
  // ========================================================================
  // STAGE EXECUTION
  // ========================================================================
  async execute(handler) {
    try {
      await this.executeStage("ingress" /* INGRESS */, async () => {
        this.context.metadata.set("requestTime", Date.now());
        this.context.metadata.set("userAgent", this.context.headers.get("user-agent"));
      });
      await this.executeStage("validation" /* VALIDATION */, async () => {
        if (!this.context.path || !this.context.method) {
          throw new Error("Invalid request: missing path or method");
        }
      });
      await this.executeStage("auth" /* AUTH */, async () => {
        const authHeader = this.context.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
          this.context.token = authHeader.slice(7);
        }
      });
      await this.executeStage("routing" /* ROUTING */, async () => {
        this.context.metadata.set("route", this.determineRoute(this.context.path));
      });
      let cachedResponse = null;
      await this.executeStage("cache_check" /* CACHE_CHECK */, async () => {
        const cacheKey = this.generateCacheKey();
        if (this.isCacheable()) {
          cachedResponse = await this.env.CACHE.match(cacheKey);
          if (cachedResponse) {
            this.context.cachedResponse = true;
          }
        }
      });
      if (cachedResponse) {
        this.context.response = cachedResponse;
        await this.executeStage("egress" /* EGRESS */, () => Promise.resolve());
        return cachedResponse;
      }
      await this.executeStage("rate_limit" /* RATE_LIMIT */, async () => {
        const rateLimitKey = `rl:${this.context.userId || this.context.headers.get("x-forwarded-for")}`;
        const current = await this.env.KV.get(rateLimitKey);
        const count3 = current ? parseInt(current) + 1 : 1;
        if (count3 > 1e3) {
          throw new Error("Rate limit exceeded");
        }
        await this.env.KV.put(rateLimitKey, count3.toString(), { expirationTtl: 60 });
      });
      await this.executeStage("execution" /* EXECUTION */, async () => {
        this.context.response = await handler(this.context);
      });
      await this.executeStage("cache_store" /* CACHE_STORE */, async () => {
        if (this.isCacheable() && this.context.response) {
          const cacheKey = this.generateCacheKey();
          const cacheControl = this.getCacheControl();
          const cachedResponse2 = new Response(this.context.response.body, {
            status: this.context.response.status,
            headers: {
              ...Object.fromEntries(this.context.response.headers),
              "cache-control": cacheControl
            }
          });
          this.ctx.waitUntil(this.env.CACHE.put(cacheKey, cachedResponse2));
        }
      });
      await this.executeStage("telemetry" /* TELEMETRY */, async () => {
        this.emitMetrics();
      });
      await this.executeStage("egress" /* EGRESS */, async () => {
        if (!this.context.response) {
          throw new Error("Handler did not produce response");
        }
      });
      return this.context.response;
    } catch (error3) {
      return this.handleError(error3);
    }
  }
  async executeStage(stage, fn) {
    const startTime = performance.now();
    const metrics = {
      name: stage,
      startTime
    };
    try {
      await fn();
      metrics.endTime = performance.now();
      metrics.duration = metrics.endTime - startTime;
    } catch (error3) {
      metrics.error = error3.message;
      metrics.duration = performance.now() - startTime;
      throw error3;
    } finally {
      this.context.stages.push(metrics);
    }
  }
  // ========================================================================
  // UTILITY METHODS
  // ========================================================================
  determinePriority(request) {
    const path = new URL(request.url).pathname;
    if (path.includes("/chat/") || path.includes("/live/")) {
      return 0 /* CRITICAL */;
    }
    if (path.includes("/feed") || path.includes("/reels")) {
      return 1 /* HIGH */;
    }
    if (path.includes("/user") || path.includes("/auth")) {
      return 2 /* NORMAL */;
    }
    return 3 /* LOW */;
  }
  determineRoute(path) {
    if (path.includes("/chat")) return "chat";
    if (path.includes("/live")) return "live";
    if (path.includes("/feed")) return "feed";
    if (path.includes("/reels")) return "reels";
    if (path.includes("/video")) return "video";
    if (path.includes("/user")) return "user";
    return "unknown";
  }
  isCacheable() {
    if (this.context.method !== "GET") return false;
    if (this.context.path.includes("/auth")) return false;
    if (this.context.path.includes("/chat/ws")) return false;
    if (this.context.path.includes("/live/ws")) return false;
    return true;
  }
  generateCacheKey() {
    const user = this.context.userId || "anonymous";
    return `cache:${user}:${this.context.method}:${this.context.path}`;
  }
  getCacheControl() {
    const route2 = this.context.metadata.get("route");
    const cacheStrategies = {
      "chat": "max-age=0, must-revalidate",
      // No cache for real-time
      "live": "max-age=0, must-revalidate",
      // No cache for real-time
      "feed": "max-age=300, stale-while-revalidate=3600",
      // 5 min cache
      "reels": "max-age=3600, stale-while-revalidate=86400",
      // 1 hour cache
      "video": "max-age=86400",
      // 24 hour cache
      "user": "max-age=300, stale-while-revalidate=3600"
      // 5 min cache
    };
    return cacheStrategies[route2] || "max-age=60";
  }
  emitMetrics() {
    const totalDuration = this.context.stages.reduce(
      (sum, s) => sum + (s.duration || 0),
      0
    );
    const metrics = {
      requestId: this.context.id,
      traceId: this.context.traceId,
      totalDuration: totalDuration.toFixed(2),
      priority: RequestPriority[this.context.priority],
      route: this.context.metadata.get("route"),
      cached: this.context.cachedResponse,
      stages: this.context.stages.map((s) => ({
        name: s.name,
        duration: s.duration?.toFixed(2),
        error: s.error
      }))
    };
    console.log(JSON.stringify({
      level: "INFO",
      type: "PIPELINE_METRICS",
      ...metrics,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }));
    if (totalDuration > 1e3 || this.context.error) {
      console.error(JSON.stringify({
        level: "WARN",
        type: "SLOW_REQUEST",
        ...metrics,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }));
    }
  }
  handleError(error3) {
    console.error(JSON.stringify({
      level: "ERROR",
      type: "PIPELINE_ERROR",
      requestId: this.context.id,
      traceId: this.context.traceId,
      error: error3.message,
      stack: error3.stack,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }));
    const statusCode = error3.message.includes("Rate limit") ? 429 : error3.message.includes("Unauthorized") ? 401 : error3.message.includes("Not found") ? 404 : 500;
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: this.getErrorCode(statusCode),
          message: error3.message,
          requestId: this.context.id
        }
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  getErrorCode(status) {
    const codes = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      429: "RATE_LIMITED",
      500: "INTERNAL_ERROR"
    };
    return codes[status] || "UNKNOWN_ERROR";
  }
  // ========================================================================
  // PUBLIC API
  // ========================================================================
  getContext() {
    return this.context;
  }
  setUserId(userId) {
    this.context.userId = userId;
  }
  addMetadata(key, value) {
    this.context.metadata.set(key, value);
  }
  getMetrics() {
    const totalDuration = this.context.stages.reduce(
      (sum, s) => sum + (s.duration || 0),
      0
    );
    return {
      totalDuration,
      stages: this.context.stages,
      priority: RequestPriority[this.context.priority]
    };
  }
};

// src/handlers/chat.handler.unified.ts
var handleChatRequest = /* @__PURE__ */ __name(async (request, env2, ctx) => {
  const pipeline = new UnifiedPipeline(env2, ctx, request);
  return pipeline.execute(async (pipelineCtx) => {
    const authResult = await requireAuth2(request, env2);
    if (authResult instanceof Response) return authResult;
    const userId = authResult.userId;
    pipelineCtx.metadata.set("userId", userId);
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/v1/, "");
    if (path.startsWith("/chat/conversations")) {
      return handleGetConversations(request, env2, userId, pipelineCtx);
    }
    if (path.startsWith("/chat/messages")) {
      if (request.method === "GET") {
        return handleGetMessages(request, env2, userId, pipelineCtx);
      }
      if (request.method === "POST") {
        return handleSendMessage(request, env2, userId, ctx, pipelineCtx);
      }
    }
    if (path.startsWith("/chat/typing")) {
      return handleTypingIndicator(request, env2, userId, pipelineCtx);
    }
    if (path.startsWith("/chat/presence")) {
      return handlePresence(request, env2, userId, pipelineCtx);
    }
    if (path.startsWith("/chat/read")) {
      return handleMarkAsRead(request, env2, userId, pipelineCtx);
    }
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  });
}, "handleChatRequest");
async function handleGetConversations(_request, env2, userId, pipelineCtx) {
  try {
    const conversations = await env2.DB.prepare(
      `SELECT 
        c.id, c.user1_id, c.user2_id, c.last_message_content,
        c.last_message_at, c.unread_count, c.created_at,
        u1.username as user1_username, u1.avatar_url as user1_avatar,
        u2.username as user2_username, u2.avatar_url as user2_avatar
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.last_message_at DESC
      LIMIT 50`
    ).bind(userId, userId).all();
    const participantIds = /* @__PURE__ */ new Set();
    conversations.results.forEach((conv) => {
      participantIds.add(conv.user1_id);
      participantIds.add(conv.user2_id);
    });
    const presenceMap = /* @__PURE__ */ new Map();
    for (const id of participantIds) {
      const presenceData = await env2.KV.get(`presence:${id}`);
      if (presenceData) {
        presenceMap.set(id, JSON.parse(presenceData));
      } else {
        presenceMap.set(id, {
          status: "offline",
          lastSeen: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    const result = conversations.results.map((conv) => {
      const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
      const presence = presenceMap.get(otherUserId);
      return {
        id: conv.id,
        participant: {
          id: otherUserId,
          username: conv.user1_id === userId ? conv.user2_username : conv.user1_username,
          avatar: conv.user1_id === userId ? conv.user2_avatar : conv.user1_avatar,
          presence: presence || { status: "offline", lastSeen: (/* @__PURE__ */ new Date()).toISOString() }
        },
        lastMessage: {
          content: conv.last_message_content,
          timestamp: conv.last_message_at
        },
        unreadCount: conv.unread_count,
        createdAt: conv.created_at
      };
    });
    pipelineCtx.metadata.set("conversationCount", result.length);
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error3) {
    throw new Error(`Get conversations failed: ${error3.message}`);
  }
}
__name(handleGetConversations, "handleGetConversations");
async function handleGetMessages(request, env2, userId, pipelineCtx) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId");
    if (!conversationId) {
      return new Response(JSON.stringify({ error: "Missing conversationId" }), {
        status: 400
      });
    }
    const convCheck = await env2.DB.prepare(
      "SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)"
    ).bind(conversationId, userId, userId).all();
    if (!convCheck.results.length) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403
      });
    }
    const messages = await env2.DB.prepare(
      `SELECT * FROM messages 
       WHERE conversation_id = ? 
       ORDER BY created_at DESC 
       LIMIT 100`
    ).bind(conversationId).all();
    pipelineCtx.metadata.set("messageCount", messages.results.length);
    return new Response(JSON.stringify({ success: true, data: messages.results }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error3) {
    throw new Error(`Get messages failed: ${error3.message}`);
  }
}
__name(handleGetMessages, "handleGetMessages");
async function handleSendMessage(request, env2, userId, ctx, pipelineCtx) {
  try {
    const body = await request.json();
    const { conversationId, content, type = "text", mediaUrl } = body;
    if (!conversationId || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }
    const messageId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env2.DB.prepare(
      `INSERT INTO messages (id, conversation_id, sender_id, content, type, media_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(messageId, conversationId, userId, content, type, mediaUrl, now).run();
    await env2.DB.prepare(
      `UPDATE conversations 
       SET last_message_content = ?, last_message_at = ?
       WHERE id = ?`
    ).bind(content, now, conversationId).run();
    if (env2.CHAT_ROOM) {
      const roomId = env2.CHAT_ROOM.idFromName(`conv-${conversationId}`);
      const stub = env2.CHAT_ROOM.get(roomId);
      ctx.waitUntil(
        stub.fetch(new Request("https://internal/broadcast", {
          method: "POST",
          body: JSON.stringify({
            type: "message",
            conversationId,
            messageId,
            senderId: userId,
            content,
            messageType: type,
            timestamp: now
          })
        }))
      );
    }
    pipelineCtx.metadata.set("messageSent", true);
    pipelineCtx.metadata.set("messageId", messageId);
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: messageId,
          status: "sent",
          timestamp: now
        }
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error3) {
    throw new Error(`Send message failed: ${error3.message}`);
  }
}
__name(handleSendMessage, "handleSendMessage");
async function handleTypingIndicator(request, env2, userId, pipelineCtx) {
  try {
    const body = await request.json();
    const { conversationId, isTyping } = body;
    const key = `typing:${conversationId}:${userId}`;
    if (isTyping) {
      await env2.KV.put(key, "true", { expirationTtl: 5 });
    } else {
      await env2.KV.delete(key);
    }
    pipelineCtx.metadata.set("typingUpdated", true);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error3) {
    throw new Error(`Typing indicator failed: ${error3.message}`);
  }
}
__name(handleTypingIndicator, "handleTypingIndicator");
async function handlePresence(request, env2, userId, pipelineCtx) {
  try {
    const body = await request.json();
    const { status } = body;
    await env2.KV.put(
      `presence:${userId}`,
      JSON.stringify({
        status,
        lastSeen: (/* @__PURE__ */ new Date()).toISOString()
      }),
      { expirationTtl: 3600 }
    );
    pipelineCtx.metadata.set("presenceUpdated", true);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error3) {
    throw new Error(`Presence update failed: ${error3.message}`);
  }
}
__name(handlePresence, "handlePresence");
async function handleMarkAsRead(request, env2, userId, pipelineCtx) {
  try {
    const body = await request.json();
    const { conversationId, messageId } = body;
    await env2.DB.prepare(
      "UPDATE messages SET status = ? WHERE id = ? AND conversation_id = ?"
    ).bind("read", messageId, conversationId).run();
    await env2.DB.prepare(
      "UPDATE conversations SET unread_count = 0 WHERE id = ? AND user2_id = ?"
    ).bind(conversationId, userId).run();
    pipelineCtx.metadata.set("markedAsRead", true);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error3) {
    throw new Error(`Mark as read failed: ${error3.message}`);
  }
}
__name(handleMarkAsRead, "handleMarkAsRead");

// src/handlers/backend-proxy.handler.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var proxyBackend = /* @__PURE__ */ __name(async (request, env2, _ctx, params) => {
  const backendOriginRaw = (env2.BACKEND_ORIGIN || "http://localhost:5000").replace(/\/$/, "");
  const allowedBackendOrigins = /* @__PURE__ */ new Set([
    "https://api.spaktok.internal",
    "http://localhost:5000"
  ]);
  if (!allowedBackendOrigins.has(backendOriginRaw)) {
    return new Response(JSON.stringify({ ok: false, code: "ORIGIN_NOT_ALLOWED", message: "Proxy disabled for origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const backendOrigin = backendOriginRaw;
  const rawTargetPath = params?.path ? `/${params.path}` : "/";
  let targetPath;
  try {
    const decoded = decodeURIComponent(rawTargetPath);
    const safePathPattern = /^\/[a-zA-Z0-9/_.-]*$/;
    const hasProtocol = decoded.includes("://") || decoded.startsWith("//");
    const hasTraversal = decoded.includes("..");
    if (hasProtocol || hasTraversal || !safePathPattern.test(decoded)) {
      return new Response(
        JSON.stringify({ ok: false, code: "INVALID_TARGET", message: "Unsupported path" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    targetPath = decoded || "/";
  } catch {
    return new Response(JSON.stringify({ ok: false, code: "INVALID_TARGET", message: "Malformed path" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const allowedTargets = {
    "/": "/",
    "/api": "/api",
    "/api/health": "/api/health",
    "/api/status": "/api/status",
    "/health": "/health",
    "/status": "/status",
    "/metrics": "/metrics"
  };
  const mappedTarget = allowedTargets[targetPath];
  if (!mappedTarget) {
    return new Response(JSON.stringify({ ok: false, code: "NOT_ALLOWED", message: "Path not permitted" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(
    JSON.stringify({ ok: false, code: "PROXY_DISABLED", message: "Backend proxy disabled in hardened build" }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}, "proxyBackend");

// src/router.ts
var routes = [];
function addRoute(method, path, handler) {
  const paramNames = [];
  const pattern = path.replace(/\//g, "\\/").replace(/:(\w+)/g, (_, name) => {
    paramNames.push(name);
    return "([^/]+)";
  });
  routes.push({
    method: method.toUpperCase(),
    pattern: new RegExp(`^${pattern}$`),
    handler,
    paramNames
  });
}
__name(addRoute, "addRoute");
async function route(path, method, request, env2, ctx) {
  for (const route2 of routes) {
    if (route2.method !== method.toUpperCase()) continue;
    const match = path.match(route2.pattern);
    if (!match) continue;
    const params = {};
    for (let i = 0; i < route2.paramNames.length; i++) {
      params[route2.paramNames[i]] = match[i + 1];
    }
    const endpointTag = `route:${route2.method}:${route2.pattern.source}`;
    return await instrumentRequest(env2, endpointTag, () => route2.handler(request, env2, ctx, params));
  }
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Endpoint not found"
      }
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" }
    }
  );
}
__name(route, "route");
function setupRoutes() {
  addRoute("GET", "/", async () => {
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          name: "Spaktok API",
          version: "1.0.0",
          status: "running",
          timestamp: Date.now()
        }
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  });
  const healthHandler = /* @__PURE__ */ __name(async () => {
    return new Response(
      JSON.stringify({
        success: true,
        data: { status: "healthy", timestamp: Date.now() }
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }, "healthHandler");
  addRoute("GET", "/health", healthHandler);
  addRoute("GET", "/healthz", healthHandler);
  addRoute("POST", "/auth/register", rateLimit(5, 300)(register));
  addRoute("POST", "/auth/login", rateLimit(5, 300)(login));
  addRoute("POST", "/auth/refresh", rateLimit(20, 300)(refresh));
  addRoute("POST", "/auth/logout", requireAuth(logout));
  addRoute("GET", "/feed/foryou", optionalAuth(forYou));
  addRoute("GET", "/feed/following", requireAuth(following));
  const liveFeedHandlers = (init_live_feed_handler(), __toCommonJS(live_feed_handler_exports));
  addRoute("GET", "/feed/live", optionalAuth(liveFeedHandlers.getLiveFeed));
  addRoute("GET", "/feed/live/trending", optionalAuth(liveFeedHandlers.getTrendingLive));
  addRoute("GET", "/feed/live/category/:category", optionalAuth(liveFeedHandlers.getLiveByCategory));
  addRoute("GET", "/feed/live/search", optionalAuth(liveFeedHandlers.searchLiveStreams));
  addRoute("POST", "/live/batch-stats", optionalAuth(liveFeedHandlers.batchLiveStats));
  addRoute("POST", "/videos/upload", requireAuth(upload));
  addRoute("GET", "/videos/:id", optionalAuth(get));
  addRoute("GET", "/videos/:id/processing-status", requireAuth(getProcessingStatus));
  addRoute("POST", "/videos/:id/like", requireAuth(like));
  addRoute("DELETE", "/videos/:id/like", requireAuth(unlike));
  addRoute("POST", "/videos/:id/comments", requireAuth(addComment));
  addRoute("GET", "/users/me", requireAuth(me));
  addRoute("GET", "/users/:id", optionalAuth(get2));
  addRoute("PATCH", "/users/:id", requireAuth(update));
  addRoute("POST", "/users/:id/follow", requireAuth(follow));
  addRoute("DELETE", "/users/:id/unfollow", requireAuth(unfollow));
  addRoute("GET", "/chat/conversations", requireAuth(handleChatRequest));
  addRoute("GET", "/chat/messages", requireAuth(handleChatRequest));
  addRoute("POST", "/chat/messages", requireAuth(handleChatRequest));
  addRoute("POST", "/chat/typing", requireAuth(handleChatRequest));
  addRoute("POST", "/chat/presence", requireAuth(handleChatRequest));
  addRoute("GET", "/chat/presence", requireAuth(handleChatRequest));
  addRoute("POST", "/chat/read", requireAuth(handleChatRequest));
  addRoute("GET", "/ads/feed", optionalAuth(getAdsForFeed));
  addRoute("POST", "/ads/impression", optionalAuth(trackImpression));
  addRoute("POST", "/ads/click", optionalAuth(trackClick));
  addRoute("GET", "/ads/pricing/tiers", requireAuth(getPricingTiers));
  addRoute("GET", "/ads/pricing/recommend", requireAuth(getRecommendedPricing));
  addRoute("POST", "/advertisers/register", requireAuth(createAdvertiserAccount));
  addRoute("GET", "/advertisers/dashboard", requireAuth(getAdvertiserDashboard));
  addRoute("POST", "/advertisers/campaigns", requireAuth(createCampaign));
  addRoute("GET", "/advertisers/campaigns/:campaignId/analytics", requireAuth(getCampaignAnalytics));
  addRoute("POST", "/advertisers/campaigns/:campaignId/creatives", requireAuth(uploadCreative));
  addRoute("POST", "/live/:streamId/join", requireAuth(joinStream));
  addRoute("POST", "/live/:streamId/leave", requireAuth(leaveStream));
  addRoute("POST", "/live/:streamId/gift", requireAuth(sendStreamGift));
  addRoute("GET", "/live/:streamId/state", optionalAuth(getStreamState));
  addRoute("POST", "/live/:streamId/presence", requireAuth(updatePresence));
  addRoute("POST", "/compliance/consent", requireAuth(recordConsent));
  addRoute("GET", "/compliance/consent/:userId", requireAuth(getConsent));
  addRoute("DELETE", "/compliance/consent/:userId", requireAuth(withdrawConsent));
  addRoute("DELETE", "/compliance/erase/:userId", requireAuth(eraseUserData));
  addRoute("POST", "/compliance/age", requireAuth(recordAgeVerification));
  addRoute("GET", "/metrics/economy/summary", requireAuth(getEconomySummary));
  addRoute("GET", "/metrics/economy/gifts/top", requireAuth(getTopGifters));
  addRoute("GET", "/metrics/perf/latency", requireAuth(getLatencySnapshot));
  addRoute("GET", "/metrics/economy/subscriptions", requireAuth(getSubscriptionSummary));
  addRoute("POST", "/metrics/perf/latency", optionalAuth(postPerfTelemetry));
  addRoute("GET", "/creator/:userId/analytics", requireAuth(getCreatorAnalytics));
  addRoute("GET", "/compliance/audit/:userId", requireAuth(auditUserCompliance));
  addRoute("POST", "/subscriptions/plans", requireAuth(createPlan));
  addRoute("GET", "/subscriptions/plans", optionalAuth(listPlans));
  addRoute("POST", "/subscriptions/subscribe", requireAuth(subscribe));
  addRoute("POST", "/subscriptions/cancel", requireAuth(cancelSubscription));
  addRoute("GET", "/subscriptions/me", requireAuth(mySubscription));
  addRoute("GET", "/subscriptions/feature", requireAuth(checkFeatureGate));
  addRoute("POST", "/payouts/request", requireAuth(requestPayout));
  addRoute("GET", "/payouts/ledger/:userId", requireAuth(getLedger));
  addRoute("POST", "/payouts/kyc", requireAuth(submitKyc));
  addRoute("POST", "/referral/code", requireAuth(createCode));
  addRoute("POST", "/referral/activate", requireAuth(activateCode));
  addRoute("GET", "/referral/stats/:code", requireAuth(getStats));
  addRoute("POST", "/agora/token", requireAuth(generateToken2));
  addRoute("POST", "/agora/renew-token", requireAuth(renewToken));
  addRoute("GET", "/agora/health", health);
  addRoute("POST", "/agora/test-token", testAgoraToken);
  addRoute("GET", "/backend/health", proxyBackend);
  addRoute("POST", "/backend/ai-job", proxyBackend);
  addRoute("POST", "/backend/compliance-log", proxyBackend);
  addRoute("POST", "/webhooks/stripe", handleStripeWebhook);
  addRoute("GET", "/metrics/telemetry", requireAuth(async (_req, env2) => {
    const snap = await exportTelemetry(env2);
    return new Response(JSON.stringify({ success: true, data: snap }), { headers: { "Content-Type": "application/json" } });
  }));
  addRoute("POST", "/metrics/device", requireAuth(receiveDeviceMetrics));
  addRoute("GET", "/metrics/device/aggregates", requireAuth(getDeviceMetricsAggregates));
  addRoute("POST", "/auth/sync", requireAuth(syncUser));
  addRoute("GET", "/chat/ws/:roomId", requireAuth(handleChatWebSocket));
  addRoute("GET", "/chat/regions/stats", requireAuth(async (_req, env2) => {
    if (!env2.CHAT_ROOM) return new Response(JSON.stringify({ success: false, error: { code: "CONFIG_ERROR", message: "CHAT_ROOM binding missing" } }), { status: 500, headers: { "Content-Type": "application/json" } });
    const id = env2.CHAT_ROOM.idFromName("global-chat");
    const stub = env2.CHAT_ROOM.get(id);
    const res = await stub.fetch("https://do/global-chat/stats");
    return res;
  }));
}
__name(setupRoutes, "setupRoutes");

// src/index.ts
init_jwt_utils();

// src/utils/runtime_telemetry.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
async function emitRuntimeTelemetry(env2, payload, ctx) {
  const url = env2.AI_RUNTIME_INGEST_URL;
  if (!url) return;
  const body = {
    ...payload,
    timestamp: payload.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
    environment: env2.AI_RUNTIME_ENVIRONMENT || env2.ENVIRONMENT || "dev"
  };
  const headers = { "Content-Type": "application/json" };
  if (env2.AI_RUNTIME_TOKEN) headers["Authorization"] = `Bearer ${env2.AI_RUNTIME_TOKEN}`;
  const task = fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  }).catch(() => void 0);
  if (ctx) {
    ctx.waitUntil(task);
  } else {
    await task;
  }
}
__name(emitRuntimeTelemetry, "emitRuntimeTelemetry");

// src/durable/live_stream.do.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var LiveStream = class {
  constructor(state, env2) {
    this.state = state;
    this.env = env2;
  }
  static {
    __name(this, "LiveStream");
  }
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const span = startSpan("LiveStream.fetch", { path });
    const executionId = crypto.randomUUID();
    await emitRuntimeTelemetry(this.env, {
      worker_id: "w_cf_durable_live_stream",
      execution_id: executionId,
      event: "START",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      duration_ms: null,
      error_code: null,
      error_message: null,
      environment: "dev"
    });
    const startedAt = Date.now();
    const returnWithTelemetry = /* @__PURE__ */ __name(async (resp, ok, errorCode) => {
      await emitRuntimeTelemetry(this.env, {
        worker_id: "w_cf_durable_live_stream",
        execution_id: executionId,
        event: ok ? "SUCCESS" : "FAILURE",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        duration_ms: Date.now() - startedAt,
        error_code: ok ? null : errorCode || "UNKNOWN_ERROR",
        error_message: ok ? null : errorCode ? `LiveStream operation failed: ${errorCode}` : "Unknown error",
        environment: "dev"
      });
      return resp;
    }, "returnWithTelemetry");
    try {
      const stored = await this.load();
      if (path.endsWith("/join")) {
        const userId = url.searchParams.get("userId");
        if (!userId) return await returnWithTelemetry(this.json(false, null, "MISSING_USER", 400), false, "MISSING_USER");
        if (!stored.viewers.includes(userId)) stored.viewers.push(userId);
        stored.presence[userId] = { lastSeen: Date.now(), status: "online" };
        stored.version++;
        await this.save(stored);
        return await returnWithTelemetry(this.json(true, { viewerCount: stored.viewers.length, version: stored.version }), true);
      }
      if (path.endsWith("/leave")) {
        const userId = url.searchParams.get("userId");
        if (!userId) return await returnWithTelemetry(this.json(false, null, "MISSING_USER", 400), false, "MISSING_USER");
        stored.viewers = stored.viewers.filter((v) => v !== userId);
        delete stored.presence[userId];
        stored.version++;
        await this.save(stored);
        return await returnWithTelemetry(this.json(true, { viewerCount: stored.viewers.length, version: stored.version }), true);
      }
      if (path.endsWith("/gift")) {
        const body = await request.json().catch(() => ({}));
        const giftType = body.giftType;
        if (!giftType) return await returnWithTelemetry(this.json(false, null, "MISSING_GIFT_TYPE", 400), false, "MISSING_GIFT_TYPE");
        stored.gifts[giftType] = (stored.gifts[giftType] || 0) + 1;
        stored.version++;
        await this.save(stored);
        return await returnWithTelemetry(this.json(true, { gifts: stored.gifts, version: stored.version }), true);
      }
      if (path.endsWith("/presence")) {
        const body = await request.json().catch(() => ({}));
        const userId = body.userId;
        const status = body.status || "online";
        if (!userId) return await returnWithTelemetry(this.json(false, null, "MISSING_USER", 400), false, "MISSING_USER");
        stored.presence[userId] = { lastSeen: Date.now(), status };
        stored.version++;
        await this.save(stored);
        return await returnWithTelemetry(this.json(true, { presence: stored.presence[userId], version: stored.version }), true);
      }
      if (path.endsWith("/state")) {
        const sinceParam = url.searchParams.get("since");
        const since = sinceParam ? parseInt(sinceParam, 10) : void 0;
        if (since !== void 0 && since === stored.version) {
          return await returnWithTelemetry(this.json(true, { diff: {}, version: stored.version }), true);
        }
        const diff = {
          viewers: stored.viewers.length,
          gifts: stored.gifts,
          presence: Object.keys(stored.presence).length
        };
        return await returnWithTelemetry(this.json(true, { diff, version: stored.version }), true);
      }
      return await returnWithTelemetry(this.json(false, null, "NOT_FOUND", 404), false, "NOT_FOUND");
    } finally {
      await endSpan(this.env, span, "livestream");
    }
  }
  async load() {
    const raw = await this.state.storage.get("state");
    if (!raw) return { viewers: [], presence: {}, gifts: {}, version: 0 };
    try {
      const parsed = JSON.parse(raw);
      if (parsed.version === void 0) parsed.version = 0;
      return parsed;
    } catch {
      return { viewers: [], presence: {}, gifts: {}, version: 0 };
    }
  }
  async save(state) {
    await this.state.storage.put("state", JSON.stringify(state));
  }
  json(success, data, errorCode, status = 200) {
    return new Response(
      JSON.stringify(success ? { success: true, data } : { success: false, error: { code: errorCode || "ERROR", message: errorCode || "error" } }),
      { status, headers: { "Content-Type": "application/json" } }
    );
  }
};

// src/do/chat-room.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var ALLOWED_ORIGINS = ["https://spaktok.com", "https://app.spaktok.com", "http://localhost:3000"];
var ChatRoom = class {
  static {
    __name(this, "ChatRoom");
  }
  connections = /* @__PURE__ */ new Set();
  regionCounts = /* @__PURE__ */ new Map();
  latencyBuckets = /* @__PURE__ */ new Map();
  latencySeries = /* @__PURE__ */ new Map();
  // time-series for predictive modeling
  bucketThresholds = [20, 50, 100, 200, 500];
  // ms boundaries
  maxSeriesLength = 300;
  // cap per region
  predictiveWindow = 30;
  // samples window for trend calculation
  p95Threshold = 150;
  // ms
  connectionHotThreshold = 0.8;
  // 80% of total
  // State/env are provided by runtime; constructor not used.
  // Default constructor retained by runtime; explicit logic not required.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(_state, _env) {
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/stats")) {
      console.log("[obs.do.chat.stats]", JSON.stringify({ ts: Date.now(), path: url.pathname }));
      return this.statsResponse();
    }
    const origin = request.headers.get("Origin");
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(JSON.stringify({ success: false, error: { code: "ORIGIN_NOT_ALLOWED", origin } }), { status: 403, headers: { "Content-Type": "application/json" } });
    }
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response(JSON.stringify({ success: false, error: { code: "EXPECTED_UPGRADE", message: "Expected websocket upgrade or /stats" } }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    return this.handleUpgrade(request);
  }
  handleUpgrade(request) {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    const region = request.cf?.colo || "global";
    const roomId = new URL(request.url).pathname.split("/").pop() || "default";
    const meta = { ws: server, region, roomId, joinedAt: Date.now() };
    this.connections.add(meta);
    console.log("[obs.do.chat.join]", JSON.stringify({ ts: Date.now(), room: roomId, region, total: this.connections.size }));
    this.regionCounts.set(region, (this.regionCounts.get(region) || 0) + 1);
    server.send(`welcome|connections=${this.connections.size}|region=${region}|room=${roomId}`);
    const handlePing = /* @__PURE__ */ __name((serverWs, regionStr, clientTsRaw) => {
      if (clientTsRaw) {
        const clientTs = Number.parseInt(clientTsRaw, 10);
        if (!Number.isNaN(clientTs)) {
          const upstreamLatency = Date.now() - clientTs;
          this.recordLatency(regionStr, upstreamLatency);
          try {
            serverWs.send(`ping|${clientTs}|${upstreamLatency}`);
          } catch {
          }
          return;
        }
      }
      try {
        serverWs.send("ping");
      } catch {
      }
    }, "handlePing");
    server.addEventListener("message", (evt) => {
      if (evt.origin && !ALLOWED_ORIGINS.includes(evt.origin)) {
        try {
          server.close(1008, "Origin not allowed");
        } catch {
        }
        return;
      }
      const raw = String(evt.data || "").trim();
      if (!raw) return;
      try {
        const count3 = server._msgc || 0;
        if (count3 > 600) {
          try {
            server.send(JSON.stringify({ type: "error", code: "RATE_LIMIT_EXCEEDED", message: "Too many messages" }));
          } catch {
          }
          try {
            server.close(429, "Too many messages");
          } catch {
          }
          return;
        }
        server._msgc = count3 + 1;
      } catch {
      }
      if (raw.startsWith("ping")) {
        const parts = raw.split("|");
        handlePing(server, region, parts[1]);
        return;
      }
      const envelope = JSON.stringify({ payload: raw, ts: Date.now(), region, room: roomId, globalConnections: this.connections.size });
      console.log("[obs.do.chat.broadcast]", JSON.stringify({ ts: Date.now(), room: roomId, region, size: this.connections.size }));
      for (const c of this.connections) {
        try {
          c.ws.send(envelope);
        } catch {
          this.connections.delete(c);
        }
      }
    });
    server.addEventListener("close", () => {
      this.connections.delete(meta);
      this.regionCounts.set(region, Math.max(0, (this.regionCounts.get(region) || 1) - 1));
      console.log("[obs.do.chat.leave]", JSON.stringify({ ts: Date.now(), room: roomId, region, total: this.connections.size }));
    });
    return new Response(null, { status: 101, webSocket: client });
  }
  recordLatency(region, ms) {
    let hist = this.latencyBuckets.get(region);
    if (!hist) {
      hist = { buckets: new Array(this.bucketThresholds.length + 1).fill(0), samples: 0, sum: 0, max: 0 };
      this.latencyBuckets.set(region, hist);
    }
    let idx = this.bucketThresholds.findIndex((t) => ms < t);
    if (idx === -1) idx = this.bucketThresholds.length;
    hist.buckets[idx]++;
    hist.samples++;
    hist.sum += ms;
    if (ms > hist.max) hist.max = ms;
    let series = this.latencySeries.get(region);
    if (!series) {
      series = [];
      this.latencySeries.set(region, series);
    }
    series.push({ ts: Date.now(), ms });
    if (series.length > this.maxSeriesLength) series.splice(0, series.length - this.maxSeriesLength);
  }
  computeP95(region) {
    const series = this.latencySeries.get(region);
    if (!series || series.length === 0) return 0;
    const sorted = series.map((s) => s.ms).sort((a, b) => a - b);
    const idx = Math.floor(sorted.length * 0.95);
    return sorted[idx];
  }
  buildSuggestions() {
    const total = this.connections.size;
    if (total === 0) return [];
    const suggestions = [];
    const pickTarget = /* @__PURE__ */ __name((exclude) => {
      for (const [r2, c2] of this.regionCounts.entries()) {
        if (r2 === exclude) continue;
        const p95Target = this.computeP95(r2);
        const share = c2 / total;
        if (p95Target < 80 && share < 0.2) return r2;
      }
      return void 0;
    }, "pickTarget");
    for (const [region, count3] of this.regionCounts.entries()) {
      const pct = count3 / total;
      const hist = this.latencyBuckets.get(region);
      const avg = hist?.samples ? hist.sum / hist.samples : 0;
      const p95 = this.computeP95(region);
      const needsAction = pct > 0.5 && avg > 100 || p95 > this.p95Threshold;
      if (!needsAction) continue;
      const target = pickTarget(region);
      const msg = target ? `Shift ~20% traffic from ${region} to ${target} (avg ${avg.toFixed(1)}ms, p95 ${p95}ms).` : `Scale out edge capacity for ${region} (avg ${avg.toFixed(1)}ms, p95 ${p95}ms, ${Math.round(pct * 100)}% load).`;
      suggestions.push(msg);
    }
    return suggestions;
  }
  predictiveHotspot(region) {
    const series = this.latencySeries.get(region);
    if (!series || series.length < this.predictiveWindow * 2) return false;
    const recent = series.slice(-this.predictiveWindow);
    const prev = series.slice(-this.predictiveWindow * 2, -this.predictiveWindow);
    const avgRecent = recent.reduce((a, b) => a + b.ms, 0) / recent.length;
    const avgPrev = prev.reduce((a, b) => a + b.ms, 0) / prev.length;
    const growth = avgRecent - avgPrev;
    const projectedP95 = this.computeP95(region) + growth;
    return growth > 15 && projectedP95 > this.p95Threshold;
  }
  regionAlerts(region, totalConnections) {
    const count3 = this.regionCounts.get(region) || 0;
    const pct = totalConnections ? count3 / totalConnections : 0;
    const p95 = this.computeP95(region);
    const hotspot = p95 > this.p95Threshold || pct > this.connectionHotThreshold;
    const predictive = this.predictiveHotspot(region);
    const reasons = [];
    if (p95 > this.p95Threshold) reasons.push(`p95 ${p95}ms > ${this.p95Threshold}ms threshold`);
    if (pct > this.connectionHotThreshold) reasons.push(`connection share ${(pct * 100).toFixed(1)}% > ${(this.connectionHotThreshold * 100).toFixed(0)}% threshold`);
    if (predictive) reasons.push("trend suggests imminent hotspot (growth & projected p95)");
    const findCandidate = /* @__PURE__ */ __name(() => {
      for (const [r2] of this.regionCounts.entries()) {
        if (r2 === region) continue;
        const p95c = this.computeP95(r2);
        const pctc = totalConnections ? (this.regionCounts.get(r2) || 0) / totalConnections : 0;
        if (p95c < 80 && pctc < 0.25) return r2;
      }
      return void 0;
    }, "findCandidate");
    let recommendation;
    if (hotspot || predictive) {
      const cand = findCandidate();
      recommendation = cand ? `shift 15-25% traffic to ${cand}` : "provision additional edge capacity or enable autoscale";
    }
    return { hotspot, predictive, reasons, recommendation, p95 };
  }
  async statsResponse() {
    const regions = {};
    const total = this.connections.size;
    for (const [region, count3] of this.regionCounts.entries()) {
      const hist = this.latencyBuckets.get(region);
      const avg = hist?.samples ? hist.sum / hist.samples : 0;
      const max = hist?.max || 0;
      const buckets = hist ? hist.buckets : new Array(this.bucketThresholds.length + 1).fill(0);
      const p95 = this.computeP95(region);
      const alerts = this.regionAlerts(region, total);
      const series = (this.latencySeries.get(region) || []).slice(-50);
      regions[region] = { connections: count3, latency: { buckets, thresholds: this.bucketThresholds, avg, max, p95, samples: hist?.samples || 0 }, alerts, series };
    }
    const payload = { regions, totalConnections: total, suggestions: this.buildSuggestions(), generatedAt: Date.now() };
    return new Response(JSON.stringify({ success: true, data: payload }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
};

// src/index.ts
setupRoutes();
var src_default = {
  async fetch(request, env2, ctx) {
    const startTime = Date.now();
    const executionId = crypto.randomUUID();
    const reqId = request.headers.get("x-request-id") ?? crypto.randomUUID();
    const flowId = request.headers.get("x-flow-id") ?? `flow-${Date.now()}`;
    const complianceTrace = request.headers.get("x-compliance-trace") ?? `cmp-${Date.now()}`;
    const flowCompliance = request.headers.get("x-flow-compliance") ?? "true";
    const tracedHeaders = new Headers(request.headers);
    tracedHeaders.set("x-request-id", reqId);
    tracedHeaders.set("x-flow-id", flowId);
    tracedHeaders.set("x-compliance-trace", complianceTrace);
    tracedHeaders.set("x-flow-compliance", flowCompliance);
    const tracedRequest = new Request(request, { headers: tracedHeaders });
    try {
      console.log(JSON.stringify({
        layer: "CF",
        reqId,
        flowId,
        complianceTrace,
        flowCompliance,
        method: tracedRequest.method,
        url: tracedRequest.url
      }));
      await emitRuntimeTelemetry(env2, {
        worker_id: "w_cf_worker_main",
        execution_id: executionId,
        event: "START",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        duration_ms: null,
        error_code: null,
        error_message: null,
        environment: "dev"
      }, ctx);
      const upgradeHeader = tracedRequest.headers.get("Upgrade")?.toLowerCase();
      const url = new URL(tracedRequest.url);
      const rawPath = url.pathname.replace(/^\/v1/, "");
      if (upgradeHeader === "websocket" && rawPath.startsWith("/chat/ws/")) {
        const authHeader = tracedRequest.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "Missing auth" } }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        try {
          const token = authHeader.slice(7);
          const payload = await verifyToken(token, env2);
          if (payload?.type !== "access") throw new Error("Invalid token");
        } catch {
          return new Response(JSON.stringify({ success: false, error: { code: "INVALID_TOKEN", message: "Token verification failed" } }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        const parts = rawPath.split("/");
        const roomId = parts[3] || "latencyroom";
        if (roomId === "latencyroom") {
          const params = { roomId };
          return await handleChatWebSocket(tracedRequest, env2, ctx, params);
        }
        if (!env2.CHAT_ROOM) {
          return new Response(JSON.stringify({ success: false, error: { code: "CONFIG_ERROR", message: "CHAT_ROOM namespace missing" } }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
        const id = env2.CHAT_ROOM.idFromName("global-chat");
        const stub = env2.CHAT_ROOM.get(id);
        return await stub.fetch(tracedRequest);
      }
      const middlewareResult = await applyMiddleware(tracedRequest, env2, ctx);
      if (middlewareResult) return addCorsHeaders(middlewareResult, env2);
      const path = rawPath;
      const method = tracedRequest.method;
      const response = await route(path, method, tracedRequest, env2, ctx);
      if (response.status === 101 && response.webSocket) {
        const duration2 = Date.now() - startTime;
        try {
          await recordLatencySample(env2, path, duration2);
        } catch {
        }
        return response;
      }
      const duration = Date.now() - startTime;
      const newHeaders = new Headers(response.headers);
      newHeaders.set("X-Response-Time", `${duration}ms`);
      const cacheControl = cacheDirectiveForPath(path);
      if (cacheControl) {
        newHeaders.set("Cache-Control", cacheControl);
      }
      const newResponse = new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
      try {
        await recordLatencySample(env2, path, duration);
      } catch {
      }
      if (env2.ANALYTICS) {
        try {
          env2.ANALYTICS.writeDataPoint({
            blobs: [path, method, response.status.toString()],
            doubles: [duration],
            indexes: [env2.ENVIRONMENT]
          });
        } catch {
        }
      }
      const tracedResponse = addCorsHeaders(newResponse, env2);
      tracedResponse.headers.set("x-request-id", reqId);
      tracedResponse.headers.set("x-flow-id", flowId);
      tracedResponse.headers.set("x-compliance-trace", complianceTrace);
      tracedResponse.headers.set("x-flow-compliance", flowCompliance);
      await emitRuntimeTelemetry(env2, {
        worker_id: "w_cf_worker_main",
        execution_id: executionId,
        event: "SUCCESS",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        duration_ms: Date.now() - startTime,
        error_code: null,
        error_message: null,
        environment: "dev"
      }, ctx);
      return tracedResponse;
    } catch (error3) {
      console.error("Worker error:", error3);
      await emitRuntimeTelemetry(env2, {
        worker_id: "w_cf_worker_main",
        execution_id: executionId,
        event: "FAILURE",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        duration_ms: Date.now() - startTime,
        error_code: "WORKER_ERROR",
        error_message: error3 instanceof Error ? error3.message : "unknown_error",
        environment: "dev"
      }, ctx);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred"
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};
function cacheDirectiveForPath(path) {
  if (path === "/health" || path === "/healthz" || path.startsWith("/backend/health") || path.startsWith("/integration") || path.startsWith("/auth") || path.startsWith("/compliance") || path.startsWith("/backend/compliance-log")) {
    return "no-store, no-cache, must-revalidate";
  }
  if (path.startsWith("/feed/")) {
    return "public, max-age=30, stale-while-revalidate=120";
  }
  return null;
}
__name(cacheDirectiveForPath, "cacheDirectiveForPath");

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError2;

// .wrangler/tmp/bundle-NeqK1P/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-NeqK1P/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  ChatRoom,
  LiveStream,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
/*! Bundled license information:

is-buffer/index.js:
  (*!
   * Determine if an object is a Buffer
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   *)
*/
//# sourceMappingURL=index.js.map
