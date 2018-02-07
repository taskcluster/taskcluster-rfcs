# RFC 71 - Prevent workers from using same workerId
* Comments: [#71](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/71)
* Initially Proposed by: @petemoore

# Proposal
Originating from [bug 1374978](https://bugzilla.mozilla.org/show_bug.cgi?id=1374978#c3):

What about if the provisioner continued to provide credentials, as it currently does, but instead of granting the current scopes it grants:

* `assume:worker-id:*`
* `assume:worker-type:aws-provisioner-v1/<workerType>`

it could instead grant the single scope:

* `queue:register-worker:<provisionerId>/<workerType>/<slugid>`

Then once the worker starts up, it could call `queue.registerWorker(provisionerId, workerType, slugId, workerGroup, workerId)` using the provisioner-provided credentials, and this queue call would return new temporary credentials for the worker, iff no credentials have previously been provided for this slugId (otherwise would return a HTTP 403).

The queue would need to maintain a list of "used" `aws-provisioner-v1` slugIds for at least 96 hours (since 96 hours is currently maximum lifetime of an `aws-provisioner-v1` worker). Optionally, a worker could "deregister" as a last step before terminating (on a best effort basis). Deregistering might be overkill.

Another thing I like about this approach, is that `registerWorker` is a great placeholder to provide other pertinent metadata, such as a json schema for the worker's task payload, version information about the worker (`{"name": "generic-worker", "version": "v10.0.5", ....}`). Worker registration would logically therefore only be necessary for *provisioned* workers that require temporary credentials, so people can still write their throwaway/dev workers without needing to make this call (since they can create their own credentials for the worker).

This would be a generic solution independent of provisioner (e.g. can be used by `scl3-puppet`, `aws-provisioner-v1`, `packet-net-v1`, ....), and removes on thing that all provisioners might otherwise need to implement, placing it in the queue which already is somewhat of a worker administrator.

Lastly, it somewhat simplifies the analysis of provisioned worker pools, since all workers are registered and can be easily counted (although this can be currently calculated as a side effect of task claim/reclaims and claimWork polling, counting registration/deregistration calls is simpler).