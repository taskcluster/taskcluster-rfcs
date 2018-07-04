# RFC 105 - Display documentation and payload schemas for each workerType
* Comments: [#105](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/105)
* Initially Proposed by: @djmitche

# Summary

Each [workerType](https://tools.taskcluster.net/provisioners/aws-provisioner-v1/worker-types)
can be made up of instances running a different kind of worker (different
implementation, or different version or configuration of the same
implementation).  Rather than try to document all workers in [the reference
section](https://docs.taskcluster.net/reference) and leave users to guess what
implementation, version, and configuration are running on a particular
workerType, we would like to "declare" this information to the queue and
display it in the tools interface.

## Motivation

Users currently find it difficult to tell what kind of task they should
construct for a given workerType. There is no way other than asking someone or
guessing to figure out what implementation or configuration a particular
workerType uses.

# Details

This will require:
 * Modifying the queue to accept this sort of declaration
 * Modifying workers to declare this information to the queue
 * Writing documentation (based on the existing, partial documentation) for workers
 * Modifying the tools site to display this information (perhaps moving the list of workers to a new subpage)

# Open Questions

 * Is this a lot of data to transfer to the queue on a regular basis; how can we cut that down somehow?
 * How does this handle deployments of new workerTypes?

# Implementation

* <link to tracker bug, issue, etc.>
* <...>
