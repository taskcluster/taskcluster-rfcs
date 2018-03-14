# RFC 83 - Rework interactive task responsibilities
* Comments: [#83](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/83)
* Initially Proposed by: @jonasfj

# Proposal
"typically" here means, this may differ from workerType to workerType, but that workerTypes should probably do something like this and document their behavior as it's a contract.

 * declareWorkerType should publish a json-e expression for transforming a `task.payload` to an interactive task, **typically** it:
   * strips side-effects like caches
   * extends the maxRunTime
 * Workers should publish `private/interactive/sockets.json` containing `{version: 1|2, shellSocketUrl: '...', displaysUrl: '...'}`
   * Fetching `displaysUrl` returns `[{name: '...', width: ..., height: ..., socketUrl: '...'}]`, where `socketUrl` works with noVNC
   * if `version: 1`, then `shellSocketUrl` works with docker-exec-websocket-server
   * if `version: 2`, then `shellSocketUrl` works with ws-shell
   * Opening a shell with empty command: `[]`, creates a _default system shell_
   * Opening a shell with command: `['file-browser-go']` launches file-browser-go, or error if not supported
   * Opening a shell with command `['gdb', ...]` launches gdb with arguments, or error if gdb is not supported in image
 * workers should document behavior when running an interactive task, **typically**:
   * Set the environment variable `TASKCLUSTER_INTERACTIVE="true"`
   * _Default system shell_ (created with command []) is **typically** defined as:
     * Prints /etc/taskcluster-motd (if defined)
     * Sets environment variables same as in main command
   * Detects and spawns shell, in order of preference:
     * /bin/taskcluster-interactive-shell
     * `which bash` -li
     * `which sh`
     * /bin/bash -li
     * /bin/sh
     * falling back to built-in busybox sh
 * taskcluster-tools
   * looks for `private/interactive/sockets.json` and offers interactive tools, if present
   * fetches workerType specific documentation for the json-e expression and offers creation of interactive task if present

Background: https://public.etherpad-mozilla.org/p/jonasfj-in-tree-loaners

By all means, feel free to edit this comment and clean up any issues you see.