# RFC 0128 - Provide docs/standards about client/worker/proxy interactions in redeployable taskcluster
* Comments: [#128](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/128)
* Proposed by: @petemoore

# 1. Summary

Changes are required for clients of taskcluster services when taskcluster
becomes redeployable.

This RFC defines:

* how taskcluster deployments will publish a manifest of their services
* how client generators will query and interpret service manifests and associated
  reference and schema documents in order to generate clients
* how the architecture of the generated clients will change
* how generated clients and client generators will be built, released and
  deployed
* how consumers of clients (workers, worker authentication proxies, command
  line tools, software libraries) must be adapted to use the new clients

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

Each service publishes a reference schema for each API it offers (referred to
as an "API reference"), which describes the API interface to the service in a
structured form.

There is a single static global manifest of all API references, hosted
[here](https://references.taskcluster.net/manifest.json).

API references are json documents which conform to one of the following json
schemas:

* [HTTP reference schema](https://schemas.taskcluster.net/base/v1/api-reference.json)
* [AMQP 0.9.1 reference schema](https://schemas.taskcluster.net/base/v1/exchanges-reference.json)

The published API references are consumed during the following activities:

* building taskcluster clients, that provide language-level programming
  interfaces to taskcluster APIs
* refreshing taskcluster docs site, that displays information about taskcluster
  APIs
* generating taskcluster command line tools, that provide command line
  interfaces to taskcluster APIs (such as `taskcluster-cli`)

Note, other lifecycle stages then in turn depend on the above stages. For
example, the following activities depend on having a built taskcluster client:

* building workers
* building task authentication proxies
* building command line tools such as those in the `generic-worker` repository
* building taskcluster services that communicate with other taskcluster services

The development workflow typically looks like this:

1. A service is implemented, which provides one or more APIs
2. When the new service is deployed, its API references are automatically
   published somewhere under https://references.taskcluster.net/ as part of the
   deployment process
3. The [services manifest](https://references.taskcluster.net/manifest.json) is
   manually updated to include the API references
4. Taskcluster clients are built and released
5. Software that interfaces with the new APIs is updated to pull in new client
   versions, and released
6. Released software is tested and deployed

### 3.1.2 Changes required

1. If a service of a taskcluster deployment provides an HTTP interface, the
   cluster should host the HTTP API reference document under
   `<TASKCLUSTER_ROOT_URL>/references/<serviceName>/<version>/api.json`
2. If a service of a taskcluster deployment provides an AMQP 0.9.1 interface,
   the cluster should host the AMQP 0.9.1 API reference document under
   `<TASKCLUSTER_ROOT_URL>/references/<serviceName>/<version>/exchanges.json`
3. A taskcluster deployment should serve a service manifest
   under `<TASKCLUSTER_ROOT_URL>/references/manifest.json` with the following
   format:

```
{
  "version" : 1,
  "references": [
    "<fully-qualified-url-to-reference-doc>",
    "<fully-qualified-url-to-reference-doc>",
    "<fully-qualified-url-to-reference-doc>",
    "<fully-qualified-url-to-reference-doc>",
    "<fully-qualified-url-to-reference-doc>",
    ....
  ]
}
```

For example, the current production taskcluster.net manifest would look like this:

```
{
  "version" : 1,
  "references": [
    "https://references.taskcluster.net/auth/v1/api.json",
    "https://references.taskcluster.net/auth/v1/exchanges.json",
    "https://references.taskcluster.net/aws-provisioner/v1/api.json",
    "https://references.taskcluster.net/aws-provisioner/v1/exchanges.json",
    "https://references.taskcluster.net/ec2-manager/v1/api.json",
    "https://references.taskcluster.net/github/v1/api.json",
    "https://references.taskcluster.net/github/v1/exchanges.json",
    "https://references.taskcluster.net/hooks/v1/api.json",
    "https://references.taskcluster.net/index/v1/api.json",
    "https://references.taskcluster.net/login/v1/api.json",
    "https://references.taskcluster.net/notify/v1/api.json",
    "https://references.taskcluster.net/pulse/v1/api.json",
    "https://references.taskcluster.net/purge-cache/v1/api.json",
    "https://references.taskcluster.net/purge-cache/v1/exchanges.json",
    "https://references.taskcluster.net/queue/v1/api.json",
    "https://references.taskcluster.net/queue/v1/exchanges.json",
    "https://references.taskcluster.net/secrets/v1/api.json",
    "https://references.taskcluster.net/treeherder/v1/exchanges.json"
  ]
}
```

However, for a taskcluster deployment with
`TASKCLUSTER_ROOT_URL='https://tc.foo'` would be served like this:

```
{
  "version" : 1,
  "references": [
    "https://tc.foo/references/auth/v1/api.json",
    "https://tc.foo/references/auth/v1/exchanges.json",
    "https://tc.foo/references/aws-provisioner/v1/api.json",
    "https://tc.foo/references/aws-provisioner/v1/exchanges.json",
    "https://tc.foo/references/ec2-manager/v1/api.json",
    "https://tc.foo/references/github/v1/api.json",
    "https://tc.foo/references/github/v1/exchanges.json",
    "https://tc.foo/references/hooks/v1/api.json",
    "https://tc.foo/references/index/v1/api.json",
    "https://tc.foo/references/login/v1/api.json",
    "https://tc.foo/references/notify/v1/api.json",
    "https://tc.foo/references/pulse/v1/api.json",
    "https://tc.foo/references/purge-cache/v1/api.json",
    "https://tc.foo/references/purge-cache/v1/exchanges.json",
    "https://tc.foo/references/queue/v1/api.json",
    "https://tc.foo/references/queue/v1/exchanges.json",
    "https://tc.foo/references/secrets/v1/api.json",
    "https://tc.foo/references/treeherder/v1/exchanges.json"
  ]
}
```

How this list is generated by taskcluster is compiled and served by
taskcluster-references is not the concern of this RFC, but it is recommended
that it is generated in a flexible way that allows custom deployments to
augment the list.

There are several benefits of including the fully qualified URLs here, rather
than providing only the version number (`v1`), the type (`api` / `exchanges`)
and the service name (`queue`, `auth`, ...):

* teams that deploy their own taskcluster environments, are able to include
  additional references for programming interfaces not covered by the core
  platform (for example, maybe it is desired to provide APIs for talking with
  databases, other messaging buses, monitoring tools, ...)
* no assumption is made that additional APIs are uniquely identifiable with a
  version string and a name (so long as you publish an api reference
  *somewhere* you can include it)
* if client generators are not able to understand a reference (because it
  implements a schema they are not familiar with) they can ignore it; perhaps
  the docs site will be able to display it, or something else will be consuming
  the reference
* nothing in this specification needs to change if new reference formats are
  introduced
* no redundancy in the data - if the API manifest provided information that is
  already in the API reference itself, potentially the data may not concur

This is a "keep it simple" approach that allows other parts of the system to
adapt without this part being affected (i.e. is not brittle). The API manifest
simply says "these are the APIs I declare, here is where you can fetch their
references, and they are self-describing, so go ask them". It doesn't burn in
any concerns about URL path building, or the types of reference we support.

# Open Questions

<what is not decided yet? remove this section when it is empty, and then go to
the final comment phase>

# Implementation

<once the RFC is decided, these links will provide readers a way to track the
implementation through to completion>

* <link to tracker bug, issue, etc.>
* <...>
