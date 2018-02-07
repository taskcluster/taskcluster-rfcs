# RFC 105 - Display documentation and payload schemas for each workerType
* Comments: [#105](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/105)
* Initially Proposed by: @djmitche

# Proposal
Each [workerType](https://tools.taskcluster.net/provisioners/aws-provisioner-v1/worker-types) can be made up of instances running a different kind of worker (different implementation, or different version or configuration of the same implementation).  Rather than try to document all workers in [the reference section](https://docs.taskcluster.net/reference) and leave users to guess what implementation, version, and configuration are running on a particular workerType, we would like to "declare" this information to the queue and display it in the tools interface.

# Result

The result would be that a workerType Page like [aws-provisioner-v1/gecko-3-b-macosx64](https://tools.taskcluster.net/provisioners/aws-provisioner-v1/worker-types/gecko-3-b-macosx64) would include documentation for the specific implementation, version, and configuration of that worker, as well as the payload schema for that worker.  That documentation can link to the reference section for more in-depth descriptions of features, but should be a comprehensive documentation of the worker's behavior -- not just a description.

# Implementation

This will require:
 * Modifying the queue to accept this sort of declaration
 * Modifying workers to declare this information to the queue
 * Writing documentation (based on the existing, partial documentation) for workers
 * Modifying the tools site to display this information (perhaps moving the list of workers to a new subpage)