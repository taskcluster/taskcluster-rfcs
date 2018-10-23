# RFC 0128 - Provide docs/standards about client/worker/proxy interactions in redeployable taskcluster
* Comments: [#128](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/128)
* Proposed by: @petemoore

# 1. Summary

Changes are required for clients of taskcluster services when taskcluster
becomes redeployable.

This RFC defines:

* how taskcluster deployments will publish a manifest of their API references
* how client generators will query and interpret service manifests and associated
  reference and schema documents in order to generate clients
* how the architecture of the generated clients will change
* how generated clients and client generators will be built, released and
  deployed
* how consumers of clients (workers, worker authentication proxies, command
  line tools, software libraries) must be adapted to use the new clients

This entails changes to the way workers will share deployment / authentication
proxy configuration information with tasks, versioning of the API / Event
reference schemas, versioning of the API references manifest based on those
HTTP and AMQP reference schemas, and the possibility for clients to connect to
different taskcluster deployments.

## 2. Motivation

This RFC is needed in order to support the redeployability project (multiple
deployments of taskcluster rather than just a single global deployment under
taskcluster.net domain).

# 3. Details

## 3.1 The development lifecycle of APIs

Taskcluster services may publish reference schemas for each API they offer
(referred to as an "API reference"). The API reference describes a given API
interface to the service in a structured form.

There is a single API manifest which lists all API references, hosted at
[https://references.taskcluster.net/manifest.json].

API references are json documents which conform to a reference schemas. The
currently existing reference schemas are these:

* [HTTP reference schema](https://schemas.taskcluster.net/base/v1/api-reference.json)
* [AMQP 0.9.1 reference schema](https://schemas.taskcluster.net/base/v1/exchanges-reference.json)

This list may be augmented in future, or indeed custom taskcluster deployments
may wish to provide their own reference schemas which are not understood or
used by the core taskcluster platform.

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
3. The [API references
   manifest](https://references.taskcluster.net/manifest.json) is manually
   updated to include the API references
4. Taskcluster clients are built and released
5. Software that interfaces with the new APIs is updated to pull in new client
   versions, and released
6. Released software is tested and deployed

## 3.2 Changes to publishing API manifest

1. If a service of a taskcluster deployment provides a HTTP interface, the
   cluster may host the HTTP API reference document under
   `<TASKCLUSTER_ROOT_URL>/references/<serviceName>/<version>/http.json`
2. If a service of a taskcluster deployment provides an AMQP 0.9.1 interface,
   the cluster may host the AMQP 0.9.1 API reference document under
   `<TASKCLUSTER_ROOT_URL>/references/<serviceName>/<version>/amqp.json`
3. A taskcluster deployment must serve the API references manifest under
   `<TASKCLUSTER_ROOT_URL>/references/manifest.json` with the following format:

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
    "https://references.taskcluster.net/auth/v1/http.json",
    "https://references.taskcluster.net/auth/v1/amqp.json",
    "https://references.taskcluster.net/aws-provisioner/v1/http.json",
    "https://references.taskcluster.net/aws-provisioner/v1/amqp.json",
    "https://references.taskcluster.net/ec2-manager/v1/http.json",
    "https://references.taskcluster.net/github/v1/http.json",
    "https://references.taskcluster.net/github/v1/amqp.json",
    "https://references.taskcluster.net/hooks/v1/http.json",
    "https://references.taskcluster.net/index/v1/http.json",
    "https://references.taskcluster.net/login/v1/http.json",
    "https://references.taskcluster.net/notify/v1/http.json",
    "https://references.taskcluster.net/pulse/v1/http.json",
    "https://references.taskcluster.net/purge-cache/v1/http.json",
    "https://references.taskcluster.net/purge-cache/v1/amqp.json",
    "https://references.taskcluster.net/queue/v1/http.json",
    "https://references.taskcluster.net/queue/v1/amqp.json",
    "https://references.taskcluster.net/secrets/v1/http.json",
    "https://references.taskcluster.net/treeherder/v1/amqp.json"
  ]
}
```

However, for a taskcluster deployment with
`TASKCLUSTER_ROOT_URL='https://tc.foo'` would be served like this:

```
{
  "version" : 1,
  "references": [
    "https://tc.foo/references/auth/v1/http.json",
    "https://tc.foo/references/auth/v1/amqp.json",
    "https://tc.foo/references/aws-provisioner/v1/http.json",
    "https://tc.foo/references/aws-provisioner/v1/amqp.json",
    "https://tc.foo/references/ec2-manager/v1/http.json",
    "https://tc.foo/references/github/v1/http.json",
    "https://tc.foo/references/github/v1/amqp.json",
    "https://tc.foo/references/hooks/v1/http.json",
    "https://tc.foo/references/index/v1/http.json",
    "https://tc.foo/references/login/v1/http.json",
    "https://tc.foo/references/notify/v1/http.json",
    "https://tc.foo/references/pulse/v1/http.json",
    "https://tc.foo/references/purge-cache/v1/http.json",
    "https://tc.foo/references/purge-cache/v1/amqp.json",
    "https://tc.foo/references/queue/v1/http.json",
    "https://tc.foo/references/queue/v1/amqp.json",
    "https://tc.foo/references/secrets/v1/http.json",
    "https://tc.foo/references/treeherder/v1/amqp.json"
  ]
}
```

How this list is generated by taskcluster is compiled and served by
taskcluster-references is not the concern of this RFC, but it is recommended
that it is generated in a flexible way that allows custom deployments to
augment the list. No doubt the implementation will use taskcluster-lib-urls to
generate the URL paths, rather than requiring the consumer of this library to
use taskcluster-lib-urls. This keeps the involvement of taskcluster-lib-urls as
high up in the stack as possible, which makes the lower parts of the stack more
generic/flexible with fewer concerns.

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
adapt without this part being affected (i.e. reduces brittleness). The API
manifest simply says "these are the APIs I declare, here is where you can fetch
their references, and they are self-describing, so go ask them". It doesn't
burn in any concerns about URL path building, or the types of reference we
support.

## Changes to HTTP references format

The `api-reference.json` document currently served
http://schemas.taskcluster.net/base/v1/api-reference.json from should be served
from `<TASKCLUSTER_ROOT_URL>/schemas/base/v1/http-reference.json`.

* All `entries[*].input` and `entries[*].output` properties should be URLs
  relative to `<taskclusterRootURL>/schemas/<serviceName>`

(This has already been implemented across most services)

## Changes to AMQP references format

The `api-reference.json` document currently served
http://schemas.taskcluster.net/base/v1/api-reference.json from should be served
from `<TASKCLUSTER_ROOT_URL>/schemas/base/v1/amqp-reference.json`.

* All `entries[*].schema` properties should be URLs relative to
  `<taskclusterRootURL>/schemas/<serviceName>`

(This has already been implemented across most services)

## Changes to publication of API references and schemas

The implementation must serve the described resources under the given URLs set
out in this document. The author is not concerned with how a service declares
its API references to the platform during build/deploy stages in order that the
references are included in the API references manifest, that is a matter for
the implementor.

The author considers it reasonable though, that there could be an API endpoint
that enables services to register their API references with the taskcluster
platform when they start up. An advantage of this approach (rather than burning
this information into the build/deploy steps) is that a taskcluster platform
can evolve, with parties able to declare new services at runtime, that aren't
necessarily able to affect the taskcluster build/deploy steps.

For example, in an organisation where there is a taskcluster deployment team
looking after a deployment, they may wish to grant scopes to another team who
are developing additional services which plug into the core taskcluster
deployment. By granting this other team the scopes to declare API references,
the team can work autonomously in developing new services, without the
taskcluster deployment team needing to restart or rebuild their taskcluster
deployment. The second team can make their API references available and modify
them as they see fit while the taskcluster core platform is running without any
maintenance overhead.

But we may wish to implement such a thing in a future PR - for the time being,
the author does not care about the publish mechanism, only that the content is
eventually served.

## Changes to taskcluster client building procedure

### All language clients (go, java, node.js, python)

The build process for these clients should be moved into a standalone tool that
requires a `TASKCLUSTER_ROOT_URL` to be specified to build the client for. It
will then query the API References manifest in order to determine all the APIs
it needs to build, and from there build packages for each API reference it
finds.

Please note, the built client will retain NO REFERENCES to the client it was
built from, other than as comments as a reference. The value of the
`TASKCLUSTER_ROOT_URL` at build time is simply to freeze the API references and
schemas to a given set. A client can be built against one taskcluster
deployment, but calling code may choose to use that client to talk to a
different cluster. It is the responsibility of the caller to ensure that the
methods he/she calls are compatible with the deployment he/she connects to.

The API reference for a service must declare the `$schema` json schema property
to say which API reference it implements. If this matches an API reference that
the client builder knows how to build, it will build a source code package for
it in a local directory. If not, it may either skip it with a warning message,
or throw an error.

This code for the code generator will live in a taskcluster repo, and only
needs to be updated when the code generation process changes, not when service
API definitions change.

### Language clients wihtout type code generation (node.js, python)

The clients that do not dynamically generate code still need to retain
information from the API references and schemas. Those clients should be
shipped together with a set of references and schemas, but provide the facility
for these references and schemas to be refetched from a taskcluster deployment
(specified by a taskcluster root URL).

## Changes to taskcluster client features and configuration

Constructors for clients should require the rootURL to be explicitly provided,
i.e. no default. This is in order to ensure that the choice of deployed cluster
to connect to is an active one. The client may provide a utility methods to fetch
TASKCLUSTER_ROOT_URL from the environment, but it should not be assumed that if
this environment variable exists, that it should be used. Rather, code that calls
the taskcluster client should have to explicitly declare they wish to do so, for
example:

```
queue := queue.NewFromEnvVars()
```

This is important because not all code will want to configure settings based on
environment variables, for example workers that take their configuration from
configuration files.

## Changes to adding taskcluster client as a service dependency

When upgrading to the new client, care will need to be taken to ensure that
taskcluster root URL is passed into the client. In addition, the
references/schemas that the client reads dynamically should also be a
dependency of the project, which may be either frozen references/schemas,
fetched from a language package, or fetched dynamically during build/CI from a
taskcluster deployment.

## Changes to projects that depend on a taskcluster client

Those that depend on a client with generated code based on the content of the
API references and schemas, should either run the code generation tool inside
their project on an ad hoc basis, and check in the generated code, or should
run it as part of their build/ci procedure.

All code that uses any of the new clients will need to explicitly pass in a
root URL in a constructor, or explicitly call a method to fetch
`TASKCLUSTER_ROOT_URL` from the environment.

## Changes to `taskcluster-proxy` and its configuration

The taskcluster proxy should require an additional property to start up, which
is the root url of the deployment it should talk to. This should be a mandatory
property, and no default should be supplied, so the user is forced to make an
active choice about which environment they wish the proxy to connect to.

## Changes to workers

* Workers that are started by a provisioner should fetch `TASKCLUSTER_ROOT_URL`
  from provisioner on start up
* Workers should require a new config property for taskcluster root URL in
  their config, and refuse to run if they do not have it and can't fetch it
  from provisioner configuration (no default allowed)
* Workers should pass `TASKCLUSTER_ROOT_URL` environment variable to all task
  processes they create.
* Workers should pass `TASKCLUSTER_ROOT_URL` to `taskcluster-proxy` when
  starting it up

## Changes to tasks that use `taskcluster-proxy`

* Tasks that made API calls directly to taskcluster-proxy, and not via a
  taskcluster client (e.g. using curl directly) should still work, since the
  proxy knows which taskcluster root url to use from how it was invoked by the
  worker. 

## Changes to tasks that use a taskcluster-client

If these tasks use an old taskcluster-client, no changes required. Tasks using
a new taskcluster client should make sure to set the TASKCLSUTER_ROOT_URL based
on the env var given to them from the worker.

## Changes to `taskcluster-lib-urls`

* Method `ServicesManifest` should be renamed to `APIReferencesManifest`.
* The following new methods should be added, e.g. for go client:

```go
func HTTPReference(rootURL string, version string) string
func AMQPReference(rootURL string, version string) string
```

These will return absolute urls to the `*-reference.json` documents.

## Changes to building docs site

The author has no knowledge of this process, and leaves it up to the
implementor to decide.

## Changes to taskcluster platform development lifecycle

The author has no knowledge of this process, and leaves it up to the
implementor to decide.

# Open Questions

<what is not decided yet? remove this section when it is empty, and then go to
the final comment phase>

# Implementation

<once the RFC is decided, these links will provide readers a way to track the
implementation through to completion>

* <link to tracker bug, issue, etc.>
* <...>
