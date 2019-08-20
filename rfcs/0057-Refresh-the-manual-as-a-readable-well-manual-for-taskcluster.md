# RFC 57 - Refresh the manual as a readable .. well, manual for taskcluster
* Comments: [#57](https://github.com/taskcluster/taskcluster-rfcs/pull/57)
* Initially Proposed by: @djmitche


## Goal

The TC manual should be the "middle ground" between the tutorial (which focuses on "getting your hands dirty" without a lot of detail) and the reference (which is statements of facts).  The manual should
 - describe the organization and model of TC so that a reader can feel like they "understand" the system and can place the reference material in context
 - cover common scenarios that cross service boundaries (indexed artifacts at stable URLs, decision tasks, ..)
 - be readable in a linear fashion

## Rough proposed outline:

* Tasks
  * Times: created, deadline, expires
  * WorkerTypes: Covering provisionerId/workerType and task.payload being worker specific.
  * Artifacts: Covering the fact that tasks have artifacts, logs are artifacts, redirect artifacts for live logs.
  * Controlling Tasks: Covering force scheduling and cancellation as protected by schedulerId
  * Dependencies: Covering how to make task graphs, and taskGroupId protection using schedulerId
  * Granting Authority: Covering how scopes can be given to tasks... And how workers can expose these scopes to tasks through authenticating proxies. And how this can authorize a 3rd party API.
  * Messages: Covering how task.routes is used to create pulse messages
      * Indexing tasks using task.routes
      * Notifications using task.routes and task.extra
      * Integrations like Treeherder using task.routes and task.extra
  * Resolutions: Covering how tasks are resolved, when they are retried, and how little you should care.
* Task Execution
  * Queues - organized by workerType, FIFO modulo priorities, deadlines
  * Workers - the pull model, the BYOW approach, lots of implementations out there, worker scopes (NOTE: the description of worker-queue interaction, currently in the manual, should move to the reference section under tc-queue)
  * Provisioners - creating workers, inputs (queue length, ..?), potential complications, not necessary for all workers (e.g., scriptworker)
* System Design
  * Microservices
  * REST APIs
    * Authentication - scopes, clients, roles, authorized scopes, temp creds, signed URLs
    * Errors
    * Schemas and reference
  * Pulse
    * Exchange definitions
  * Design Principles
* Using Taskcluster - assorted use cases
  * Integrating with Github
  * Handling secrets
  * Scheduling tasks (meaning hooks.. what's a better way to say this?) 
  * Building Task Graphs
  * Working with Artifacts
  * Uploading to S3
  * Administration - how to use tools.tc.n, roles, clients, etc.; using tc-cli for command-line management of tasks
  * Integrating with other apps
    * Frontend apps - getting creds for a browser's user, calling APIs from a browsre
    * Backend services - calling APIs using your own credentials
    * Useful libraries (links to client libraries)

## Progress

Follow progress in https://bugzilla.mozilla.org/show_bug.cgi?id=1362074 and at https://github.com/taskcluster/taskcluster-docs/compare/master...djmitche:new-manual?expand=1