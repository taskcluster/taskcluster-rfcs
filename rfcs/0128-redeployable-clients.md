# RFC 0128 - Provide docs/standards about client/worker/proxy interactions in redeployable taskcluster
* Comments: [#128](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/128)
* Proposed by: @petemoore

# 1. Summary

Changes are required for clients of taskcluster services when taskcluster
becomes redeployable.

This RFC serves to define the standards by which taskcluster deployments will
publish a manifest of their service definitions, how client generators will
query and interpret this manifest and associated reference and schema documents
in order to generate clients, what the architectural changes to generated
clients will be, how users of those clients (workers, worker authentication
proxies, command line tools, software libraries) will be adapted in order to
use the new clients, and how generated clients and client generators will be
built, released and deployed.

This entails changes to the way workers will share deployment / authentication
proxy configuration information with tasks, versioning of the API / Event
reference schemas, versioning of the services definitions based on those API
and Event reference schemas, and the possibility for clients to connect to
different taskcluster deployments.

## 2. Motivation

This RFC is needed in order to support the redeployability project (multiple
deployments of taskcluster rather than just a single global deployment under
taskcluster.net domain).

# 3. Details

## 3.1. Publishing API schemas ("references")

### 3.1.1 Current situation

Taskcluster services currently provide either one or two of the following types
of interface (API):

* HTTP (mostly RESTful)
* AMQP 0.9.1 (provided via mozilla pulse, a customised RabbitMQ deployment)

Each service publishes a schema for each API it offers (referred to as an "API
reference"), detailing the specifics of the API.

There is a global manifest of all API references, hosted
[here](https://references.taskcluster.net/manifest.json).

API references are json documents which conform to one of the following json
schemas:

* [HTTP reference schema](https://schemas.taskcluster.net/base/v1/api-reference.json)
* [AMQP 0.9.1 reference schema](https://schemas.taskcluster.net/base/v1/exchanges-reference.json)

The published API references are consumed by the following lifecycle stages:

* building taskcluster clients, that provide language-level programming interfaces to taskcluster APIs
* refreshing taskcluster docs site, that displays information about taskcluster APIs
* generating taskcluster command line tools, that provide command line interfaces to taskcluster APIs

Note, other lifecycle stages then in turn depend on the above stages. For
example, building workers depends on building a taskcluster client, as does
building task authentication proxies, and other command line tools. Building
taskcluster services depends on first building a taskcluster client to enable
the service to communicate with other taskcluster services.

The taskcluster platform delivery process currently respects the dependencies
between lifecycle stages as follows:

1. A service is implemented, which provides one or more APIs
2. When the service is deployed, its API references are automatically
   published somewhere under https://references.taskcluster.net/ as part of the
   deployment process
3. The [services manifest file](https://references.taskcluster.net/manifest.json) is manually updated to include the  API references

....
.... (WIP)
....

### 3.1.2 Changes required

# Open Questions

<what isn't decided yet? remove this section when it is empty, and then go to
the final comment phase>

# Implementation

<once the RFC is decided, these links will provide readers a way to track the
implementation through to completion>

* <link to tracker bug, issue, etc.>
* <...>
