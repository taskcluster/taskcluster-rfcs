# RFC 0161 - Intelligent worker cycling on worker pool update
* Comments: [#161](https://github.com/taskcluster/taskcluster-rfcs/pull/161)
* Proposed by: @petemoore

# Summary

Workers of a worker pool should be gracefully and automatically refreshed or
decommissioned if they are no longer consistent with the most recent worker
pool definition.

## Motivation

Without checks and balances in place, worker pools may contain outdated workers
whose configuration no longer reflects the most recent worker pool definition,
for an unbounded period of time.

With intelligent worker cycling, we can ensure that workers with outdated
configuration are swiftly removed from worker pools.

# Details

The responsibility for keeping workers up-to-date is split between Worker
Manager (for ensuring that provider launch configuration of workers is valid)
and the workers, responsible for refreshing `workerConfig` on reregisterWorker
calls.

This RFC involves changes to both Worker Manager and Worker-Managed-spawned
workers (via Worker Runner):

* Worker Manager will keep a record of the launch parameters it used for all
  workers that it spawns
* Worker Manager will track changes to Worker Pool definitions that affect
  launch configurations of workers
* When Worker Manager receives a `workermanager.registerWorker` or
  `workermanager.reregisterWorker` call from a worker whose launch
  configuration is determined to be from a previous version of the current
  worker pool definition, it will assess whether its launch configuration is
  still valid against the latest worker pool definition, and if not, return a
  HTTP 410 status code with a message body explaining that the worker's launch
  configuration is no longer conformant.
* Worker Manager will include (the most recent) `workerConfig` in
  `workermanager.reregisterWorker` responses for workers with up-to-date launch
  configurations (`workermanager.registerWorker` already includes `workerConfig`)
* Workers (via Worker Runner) will refresh their configs from successful
  `workermanager.reregisterWorker` calls, or gracefully shutdown when receiving
  a HTTP 410 status code from either `workermanager.registerWorker` or
  `workermanager.reregisterWorker`
  

## Worker Manager changes

Depending on the provider, Worker Pools contain different data. Regardless, the
logic to decide if a worker pool launch configuration has changed is the same:

* If Worker Manager can determine that the parameters used to launch an
  existing running worker (instance type, disk sizes, region, ...) from a
  previous version of the worker pool definition are still a valid combination
  of parameters against the latest worker pool configuration, responses to
  `workermanager.registerWorker` or `workermanager.reregisterWorker` will be
  treated as before, and the worker will not be earmarked for decommission.
* Otherwise, if Worker Manager is either unable to determine if the launch
  parameters of a given worker are still valid, or is able to determine that
  they are no longer consisten with the latest worker pool definition, it should:

    * Respond to `workermanager.registerWorker` and `workermanager.reregisterWorker`
      calls with an HTTP 410 response status code
    * Terminate the worker (in the case of non-static workers) as soon as
      possible, but _no earlier_ than 15 minutes after the worker's current
      credentials have expired
    * Quarantine the worker (in case of static workers) as soon as possible,
      but _no earlier_ than 15 minutes after the worker's current credentials
      have expired. Note, currently this will have no effect, since static worker
      pools do not contain environment state, but this will allow us to include
      environment state in static worker pool definitions in future, which can be
      compared to data provided by the worker in `workermanager.registerWorker`
      calls. This way, static workers with outdated state may be automatically
      decommissioned. Note, there is currently no means to provide a quarantine
      reason in `queue.quarantineWorker`, but if that becomes available, in future
      it should be used to record the reason. 

* Worker Manager should return the _most recent_ worker pool `workerConfig` for
  a worker in the `reregisterWorker` response, like it already does for
  `registerWorker`.

## Worker changes

The only supported way to run taskcluster-developed workers under Worker
Manager is via Worker Runner. However, if you are running your own worker
implementations under Worker Manager that do not work with Worker Runner
(scriptworker?) then either the following changes will also be needed in your
worker implementations, or you will need to adapt your worker implementations
to run under Worker Runner.

* Workers should explicitly check for an HTTP 410 response from
  `workermanager.registerWorker` and `workermanager.reregisterWorker` calls,
  and if they receive it, shutdown or stop in the same manner they would if
  they had exceeded their idle timeout period, or had completed all of their
  available tasks. Note, the worker process, or worker runner process should
  exit with a dedicated exit code to signal that they stopped because they
  are no longer considered current by worker manager.
* Workers should refresh their own config from the
  `workermanager.reregisterWorker` API call responses, with the same mechanics
  that they use to update their configuration from `workermanager.registerWorker`
  calls. If they are unable, for any reason, to refresh their own configuration,
  they should act in the same way they would as if they had received a 410
  HTTP response code from `workermanager.reregisterWorker`, but with a different
  dedicated process exit code.
  

# Implementation

This section is to be completed on approval of the RFC.
