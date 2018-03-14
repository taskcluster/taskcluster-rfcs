# RFC 70 - Apis should have a /internal/ route-space for internally applicable only things
* Comments: [#70](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/70)
* Initially Proposed by: @jhford

# Proposal
In the new EC2-Manager repository, I've been adding a few endpoints under `/v1/internal/` which, per the name suggest that they are for internal/diagnostics type things.

This is especially helpful when debugging systems like Heroku.  Some of these endpoints might be per-process, but some might be per-application.  For per-application ones, they are generally useful.  For per-process ones, they are sort of useful because with enough luck you might hit the webhead you're trying for.

Examples: In the EC2-manager I have `/v1/internal/sqs-stats` endpoint which tells me rough stats for the different sqs queues we use.  I have `/v1/internal/purge-queues` endpoint to simplify purging queues if needed.

Given that these are internal only endpoints, I propose we set the following restrictions:

* `/v1/internal` is reserved for internal endpoints
* All internal endpoints require a scope which starts like `taskcluster-internals:<service>:....`.  I think these should be forced to exist outside of the normal scope space to ensure that we never accidentally give them to 'real' users.
* All internal endpoints are implicitly experimental and explicitly have *zero* guarantees or thought to backwards compat
* Internal endpoints are hidden by default
* All endpoints implicitly take input of unspecified type and produce output of unspecified type