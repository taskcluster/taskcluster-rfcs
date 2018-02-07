# RFC 74 - Worker, workerType, and provisioner explorer UI
* Comments: [#74](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/74)
* Initially Proposed by: @djmitche

# Proposal
As discussed today in SF..

We need a tool for examining and manipulating running workers.  It is based on the model and data gathered in #71.  It would have the following pages:

 * a list of provisioners, linking to..
 * for a provisioner, a list of workerTypes, each with its worker count and pending count
 * an information page for a single worker, containing:
   * worker.extra and other metadata
   * action buttons (see #71)
   * recently claimed tasks and their statuses

Note that there is no page listing all workers of a worker type, and note that there is no single-workertype page.  We could add those later.