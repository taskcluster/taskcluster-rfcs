# RFC 192 - `minCapacity` ensures workers do not get unnecessarily killed
* Comments: [#192](https://github.com/taskcluster/taskcluster-rfcs/pull/192)
* Proposed by: [@JohanLorenzo](https://github.com/JohanLorenzo)

# Summary

Optimize worker pools with `minCapacity >= 1` by implementing minimum capacity workers that avoid unnecessary shutdown/restart cycles, preserving caches and reducing task wait times.

## Motivation

Currently, workers in pools with `minCapacity >= 1` exhibit wasteful behavior:

1. **Cache Loss**: Workers shut down after idle timeout (600 seconds for decision pools), losing valuable caches:
   - VCS repositories and history
   - Package manager caches (npm, pip, cargo, etc.)
   - Container images and layers

2. **Provisioning Delays**: New worker provisioning [takes ~75 seconds average for decision pools](https://taskcluster.github.io/mozilla-history/worker-metrics), during which tasks must wait

3. **Resource Waste**: The current cycle of shutdown → detection → spawn → provision → register wastes compute resources and increases task latency

4. **Violation of `minCapacity` Intent**: `minCapacity >= 1` suggests these pools should always have capacity available, but the current implementation allows temporary capacity gaps

# Details

## Current Behavior Analysis

**Affected Worker Pools:**
- Direct `minCapacity: 1`: [`infra/build-decision`](https://github.com/mozilla-releng/fxci-config/blob/43c18aab0826244e369b16a964637b6c411c7760/worker-pools.yml#L220), [`code-review/bot-gcp`](https://github.com/mozilla-releng/fxci-config/blob/43c18aab0826244e369b16a964637b6c411c7760/worker-pools.yml#L3320)
- Keyed `minCapacity: 1`: [`gecko-1/decision-gcp`, `gecko-3/decision-gcp`](https://github.com/mozilla-releng/fxci-config/blob/43c18aab0826244e369b16a964637b6c411c7760/worker-pools.yml#L976), and [pools matching `(app-services|glean|mozillavpn|mobile|mozilla|translations)-1`](https://github.com/mozilla-releng/fxci-config/blob/43c18aab0826244e369b16a964637b6c411c7760/worker-pools.yml#L1088)

**Current Implementation Issues:**
- Worker-manager enforces `minCapacity` by spawning new workers when capacity drops below threshold
- Generic-worker shuts down after `idleTimeoutSecs` regardless of `minCapacity` requirements
- Gap exists between worker shutdown and replacement detection/provisioning

## Proposed Solution

### Core Concept: `minCapacity` Workers

Workers fulfilling `minCapacity >= 1` requirements should never self-terminate. This is achieved through a two-phase implementation: Phase 1 prevents minCapacity workers from self-terminating, and Phase 2 makes worker-manager the central authority for all worker termination decisions.

### Phase 1: Prevent MinCapacity Worker Self-Termination

#### 1. Automatic Activation

**Trigger:** Automatically enabled when `minCapacity >= 1` (no configuration flag needed)

Workers spawned when `runningCapacity < minCapacity` receive `idleTimeoutSecs=0` and never self-terminate.

#### 2. Worker Config Injection

Worker-manager sets `idleTimeoutSecs=0` when spawning minCapacity workers. This makes [generic-worker never terminate by itself](https://github.com/taskcluster/taskcluster/blob/754938c53ba34aea5a50ce610272e7a275c11911/workers/generic-worker/main.go#L536-L542).

#### 3. Capacity Management

**Removing Excess Capacity:**

When `runningCapacity > minCapacity`, [worker-manager scanner identifies](https://github.com/taskcluster/taskcluster/blob/754938c53ba34aea5a50ce610272e7a275c11911/services/worker-manager/src/worker-scanner.js#L69-L76) and terminates excess workers.

**Termination logic:**
- Query [Queue API client](https://github.com/taskcluster/taskcluster/blob/754938c53ba34aea5a50ce610272e7a275c11911/services/worker-manager/src/main.js#L176-L178) to check if worker's latest task is running
- Select oldest idle workers first (by `worker.created` timestamp).
- Use the existing `removeWorker()` methods to terminate worker ([Google `removeWorker()`](https://github.com/taskcluster/taskcluster/blob/754938c53ba34aea5a50ce610272e7a275c11911/services/worker-manager/src/providers/google.js#L168-L192), [AWS `removeWorker()`](https://github.com/taskcluster/taskcluster/blob/754938c53ba34aea5a50ce610272e7a275c11911/services/worker-manager/src/providers/aws.js#L382-L418), [Azure `removeWorker()`](https://github.com/taskcluster/taskcluster/blob/754938c53ba34aea5a50ce610272e7a275c11911/services/worker-manager/src/providers/azure/index.js#L1221-L1233))


## Error Handling and Edge Cases

**Worker Lifecycle Management:**
- **Pool reconfiguration**: Capacity changes trigger worker replacement, not reconfiguration
- **Graceful transitions**: When possible, only terminate idle workers to preserve active caches
- **Resource allocation**: minCapacity workers mixed with other workers on same infrastructure

**Launch Configuration Changes:**
When a launch configuration is changed, removed, or archived, all workers created from the old configuration must be terminated and replaced:
- If a launch configuration is archived (not present in new configuration), identify all long-running workers created from it
- Terminate these workers via cloud provider APIs after checking for running tasks
- Worker-manager will spawn new workers using the updated launch configuration
- This ensures workers always run with current configuration and prevents indefinite use of outdated configurations

## Compatibility Considerations

- Automatic activation when `minCapacity >= 1` (no opt-in flag needed)
- Existing pools continue current behavior; minCapacity workers automatically stop self-terminating
- No changes to generic-worker's idle timeout mechanism

### Phase 2: Centralized Termination Authority

**Goal:** Make worker-manager the sole authority for all worker termination decisions by removing worker self-termination entirely.

#### Implementation Changes

**1. Remove Worker Idle Timeout Code**

Remove [idle timeout mechanism](https://github.com/taskcluster/taskcluster/blob/754938c53ba34aea5a50ce610272e7a275c11911/workers/generic-worker/main.go#L536-L542) from generic-worker:

Workers run indefinitely until worker-manager terminates them. This mean, worker-managers stops sending `idleTimeoutSecs` to workers at spawn time.

**2. Centralized Idle Enforcement**

Worker-manager enforces idle timeout using existing [`queueInactivityTimeout` from lifecycle configuration](https://github.com/taskcluster/taskcluster/blob/754938c53ba34aea5a50ce610272e7a275c11911/services/worker-manager/schemas/v1/worker-lifecycle.yml#L33-L50) and through idleTimeout (as specified in phase 1).

[Scanner polls](https://github.com/taskcluster/taskcluster/blob/754938c53ba34aea5a50ce610272e7a275c11911/services/worker-manager/src/worker-scanner.js#L69-L76) Queue API to track worker idle time:
- Get latest task from `worker.recentTasks`
- Call `queue.status(taskId)` to check if task is running
- Calculate idle time from task's `resolved` timestamp
- Terminate when idle time exceeds `queueInactivityTimeout`

**3. Termination Decision Factors**

Worker-manager terminates workers when:
- Idle timeout exceeded (`queueInactivityTimeout`)
- Capacity exceeds `maxCapacity`
- Capacity exceeds `minCapacity` (terminate oldest first)
- Launch configuration changed/archived
- Worker is unhealthy (provider-specific check)

All terminations check for running tasks before proceeding.

**Migration:**
Deploy as breaking change requiring simultaneous worker-manager and generic-worker updates.

# Implementation

<Once the RFC is decided, these links will provide readers a way to track the
implementation through to completion, and to know if they are running a new
enough version to take advantage of this change.  It's fine to update this
section using short PRs or pushing directly to master after the RFC is
decided>

* <link to tracker bug, issue, etc.>
* <...>
* Implemented in Taskcluster version ...
