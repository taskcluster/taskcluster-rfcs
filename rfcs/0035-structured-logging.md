# RFC 35 - Structured Logging
* Comments: [#35](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/35)
* Proposed by: @jhford (originator), @djmitche, @imbstack (author of this document)

# Summary

We will replace most functions of taskcluster-lib-monitor, taskcluster-task-analysis, and our debug
logs in our services/workers with structured log output. This output can be ingested and
post-processed by any system we desire.

## Motivation

We have many ways of monitoring/logging/reporting our services and workers. Chief among them are as follows:

* Papertrail for stdout from our services and workers.
  * Mostly comprises `console.log` and `debug` in js and various `fmt.Sprintf` from golang.
* Sentry for various errors/warnings that arise in our services.
* Audit logs (which are sent off to kinesis) for some structured logs that are related to security.
* SignalFX for metrics which we send to them via statsum.
* Historical task analysis

Each of these has positive and negative aspects and generally make sense for the job they are being
called on to perform. However, this proliferation of formats has major drawbacks.

* We have a lot of code to support all of these systems.
* The knowledge of how to interact with these systems is in a silo with only 1-2 people on the team
  having knowledge of how we interact with them.
* Correlating events across these disparate sources is difficult and time consuming.
* Using debug logs for anything even vaguely important is dangerous. In attempting to debug other
  issues, a developer can inadvertently turn off important logs.
* In the context of redeployability, we would either have to require any group maintaining their own
  installation to either run Sentry/statsum/SignalFX or forego monitoring completely.
* Debug logs need to be carefully crafted to include any information necessary rather than just having
  this information appended by default

# Details

In the discussion of this rfc, we have defined 6 broad classes of logging:

1. Trying to figure out what happened in some production issue
2. Sending subsets of the log flow to various consumers (fraud pipeline, audit logging, etc.)
3. Searching for events matching a particular pattern
4. Detailed tracing of a test failure or other finely-detailed issue
5. Monitoring and metrics for various elements of our system
6. Analysis of usage patterns

We can handle all of these cases with structured logging.

It is important to note that cases 1, 3 and 4 can all include logs from libraries not created
by the taskcluster team. They all use node's debug logging directly. We cannot (at least at the
time of this writing) globally override debug module output to be structured so we will always have
at least some unstructured output. We can always post-process the output and stick it into a field
of an object but we will have multi-line logging such as stack traces split across multiple objects
in that case. This is probably acceptable.

Some of these classes will require some guarantees about the format of our output. We will need to
have a system in place for ensuring that we do not log invalid lines for audit logs for example.

In addition, some of these logs must/should be accessible to users of Taskcluster and not just
administrators. For instance usage pattern analysis and some subset of audit logs may be of interest.

## Debugging Production Issue

In this case we will want to use both logs we output ourselves and those of our supporting libraries.
In general, the format of these logs may be ad hoc and not necessarily controlled by us. Allowing
humans to scan these logs directly (with the help of tooling) is important. Only in rare cases of
longstanding difficult-to-debug issues will anyone need to query these logs in a programmatic way.
The expected use case is that we will receive an alert of unexpected behavior and go to these logs to
find what was happening at the time of the issue. Being able to correlate events in these logs to
web requests and RabbitMQ messages will be necessary.

These logs should not be publicly accessible as secrets may leak into these logs from time to time
although this should be avoided.

## Fraud Detection and Audit Logs



# Open Questions

<what isn't decided yet? remove this section when it is empty, and then go to
the final comment phase>

# Implementation

<once the RFC is decided, these links will provide readers a way to track the
implementation through to completion>

* <link to tracker bug, issue, etc.>
* <...>
