# RFC 0191 - Worker Manager launch configurations
* Comments: [#0191](https://github.com/taskcluster/taskcluster-rfcs/pull/191)
* Proposed by: @lotas

## Summary

This proposal outlines enhancements to the worker-manager service that would address the following:

* make worker pools launch configurations first-class citizens in the worker-manager service
* balanced distribution of workers across multiple launch configurations (regions)
* dynamic adjustment of launch configuration likelihood to be provisioned based on **health metrics**

**Health metrics** - is the combination of the number of fail-to-success provisioning attempts ratio, the number of workers currently running.

## Motivation

The current worker-manager lacks the ability to deal with broken configurations, monitor the health of launch configurations and the availability of cloud resources.

This often leads to the creation of workers that are stuck in provisioning or fail to become operational, wasting resources and reducing system efficiency.

By introducing health tracking and dynamic adjustment mechanisms, we aim to optimize the provisioning process and enhance system reliability.

## Details

New entity will be introduced to worker-manager - **Launch Configuration**.
Each worker pool will have zero or more **launch configurations** associated with it.

Each **launch configuration** will be assigned a unique ID (hash of its properties), stored in the database and will be immutable (except for the status flag).

During updates of the worker pool configurations, all existing launch configurations that are not present in the new configuration will be marked as `archived`. Launch configurations that have same unique ID (hash) will be kept active. All other will be created as new launch configurations and marked as active.

### Launch Configuration weight

Provisioned workers would be associated with a specific launch configuration (`worker.launchConfigurationId`).
This will allow us to to know how many workers with this launch configuration were successfully registered and claimed work.

Each launch configuration will have a dynamic `weight` property that will be adjusted automatically based on the following events and metrics:

* total number of successful worker provisioning attempts / registrations
* total number of failed worker provisioning attempts / registrations
* has any worker claimed a task
* fail-to-success ratio over a specific time period (i.e. last hour)
* number of non-stopped workers currently running

Weight will be used to determine the likelihood of selecting a specific launch configuration for provisioning.

This will be calculated at the provisioning time.

### Making worker-manager extensible

Worker-manager will publish additional events to Pulse to allow external systems to react:

* `launch-configuration-created`
* `launch-configuration-archived`
* `launch-configuration-paused`
* `launch-configuration-resumed`
* `worker-error` (provisioning or starting up failure, will include `workerPoolId` and `launchConfigurationId`)
* `worker-running` (registered, ready for work)
* `worker-requested` (worker just requested, provisioning is starting)
* `worker-stopping` (for azure when initial stopping request comes in)
* `worker-stopped`

New API endpoints will be introduced:

* `workerManager.getLaunchConfigs(workerPoolId)` - to retrieve all launch configurations with their statuses
* `workerManager.getLaunchConfig(workerPoolId, launchConfigId)` - to retrieve specific launch configuration
* `workerManager.pauseLaunchConfig(workerPoolId, launchConfigId)` - to deactivate specific active launch configuration (time bound)
* `workerManager.resumeLaunchConfig(workerPoolId, launchConfigId)` - to resume specific active launch configuration

Last two endpoints would allow external systems to pause/resume specific launch configurations based on their own criteria.
This might be useful when dynamic adjustment of weights is not enough to prevent provisioning workers in a specific region.

Existing endpoints will continue to accept the same payload as before for backward compatibility.

### Expiry of launch configurations

During worker pool configuration updates, previous launch configurations would be marked as `archived` and kept in the database for a certain amount of time.
Usually they should be kept for as long as the workers, that were created with this configuration.
Once such workers are expired and removed from db, we can remove the launch configuration as well.

### Worker interaction

Optionally, workers might be able to call worker-manager API periodically to check if their launch configuration is still active.
This could superseed previous `deploymentId` mechanism.

### Static workers

`static` worker pool configuration differs from the regular worker pool configuration in that it does not have any launch configurations.

It is currently stored as `config.workerConfig`.
To make it consistent with the rest of the worker pools, we would move it to `config.launchConfigurations` with a single launch configuration.

Static workers could use new worker-manager API to check if their launch configuration is still active.

## Examples of weight adjusting

### Scenario 1 - no failures

No workers have been provisioned yet, and we have two launch configurations A and B.
Both of them would have the same weight - `1`, so the likelihood of selecting one of them would be `50%`.

After some time, there could be 10 workers running for config A, and 5 workers running for config B.
With this information, the weight would be adjusted to `0.33` for config A and `0.66` for config B.

### Scenario 2 - failures in some regions

There are three launch configurations A, B and C.
At some point, provisioning workers in region A fails with quota exceeded errors.
Weight of A would be adjusted proportionally to the error rate - `1 - (failed / total)`.

Note: To avoid permanently disabling launch config, we would only adjust the weight for a specific time period (i.e. *last hour*).

### Scenario 3 - new launch configurations

We want to avoid situation where workers cannot be created or started.
This can happen when configuration is broken, or there are temporary issues on the cloud provider side.

During provisioning we would check: (a) count of workers created, (b) count of workers that registered and claimed tasks, (c) count of errors *last hour*

1. No workers created yet: (a) == 0

    Lowering weight for all launch configurations would not help, as they all will have the same weight, we keep as is

2. Workers created, but none of them registered: (a) > 0, (b) == 0

    This could indicate that workers are still starting up, we don't adjust weight.
    Alternatively we could look at the creation time of those workers and after some period (30 minutes) start to lower the weight.

3. Workers created, none registered, errors exist: (a) > 0, (b) == 0, (c) > 0

    This could indicate that there are issues with the launch configuration, we would lower the weight for this launch configuration to `0` to avoid provisioning more workers

This should be sufficient to react to the most common issues that can happen during provisioning and prevent creating too many workers that are expected to fail.
It also allows to resume provisioning after error expiration timeout (last hour by default).
