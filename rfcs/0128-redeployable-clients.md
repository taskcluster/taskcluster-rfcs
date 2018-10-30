# RFC 0128 - Service metadata in redeployable taskcluster

* Comments: [#128](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/128)
* Proposed by: @petemoore

# Table of contents

* [1. Summary](#1-summary)
* [2. Motivation](#2-motivation)
* [3. How API definitions are managed today (pre-redeployability)](#3-how-api-definitions-are-managed-today-pre-redeployability)
* [4. Proposed changes](#4-proposed-changes)
  * [4.1 Changes to publishing API manifest](#41-changes-to-publishing-api-manifest)
  * [4.2 Changes to API references format](#42-changes-to-api-references-format)
  * [4.3 Changes to Exchanges references format](#43-changes-to-exchanges-references-format)
  * [4.4 Changes to publication of API references and schemas](#44-changes-to-publication-of-api-references-and-schemas)
  * [4.5 Changes to taskcluster-lib-urls](#45-changes-to-taskcluster-lib-urls)
  * [4.6 Changes to taskcluster client building procedure](#46-changes-to-taskcluster-client-building-procedure)
  * [4.7 Changes to taskcluster client features and configuration](#47-changes-to-taskcluster-client-features-and-configuration)
  * [4.8 Changes to adding taskcluster client as a service dependency](#48-changes-to-adding-taskcluster-client-as-a-service-dependency)
  * [4.9 Changes to projects that depend on a taskcluster client](#49-changes-to-projects-that-depend-on-a-taskcluster-client)
  * [4.10 Changes to taskcluster-proxy and its configuration](#410-changes-to-taskcluster-proxy-and-its-configuration)
  * [4.11 Changes to workers](#411-changes-to-workers)
  * [4.12 Changes to tasks that use taskcluster-proxy](#412-changes-to-tasks-that-use-taskcluster-proxy)
  * [4.13 Changes to tasks that use a taskcluster-client](#413-changes-to-tasks-that-use-a-taskcluster-client)
  * [4.14 Changes to building docs site](#414-changes-to-building-docs-site)
  * [4.15 Changes to taskcluster platform development lifecycle](#415-changes-to-taskcluster-platform-development-lifecycle)
* [5. Implementation](#6-implementation)

# 1. Summary

Changes are required for clients of taskcluster services when taskcluster
becomes redeployable.

This RFC defines:

* how taskcluster deployments will publish an API manifest describing its
  programmable interfaces
* how taskcluster client generators will fetch and interpret an API manifest in
  order to discover references and schemas to build the clients against
* how the architecture of the generated clients will change
* how generated clients and client generators will be built, released and
  deployed
* how consumers of clients (workers, worker authentication proxies, command
  line tools, software libraries) must be adapted to use the new clients

This entails changes to the way workers will share deployment / authentication
proxy configuration information with tasks, versioning of the API / Event
reference schemas, versioning of the API references manifest based on those
API and Exchanges reference schemas, and the possibility for clients to connect to
different taskcluster deployments.

## 2. Motivation

This RFC is needed in order to support the redeployability project (multiple
deployments of taskcluster rather than just a single global deployment under
taskcluster.net domain).

## 3. How API definitions are managed today (pre-redeployability)

Taskcluster services may publish reference schemas for each API they offer
(referred to as an "API reference"). The API reference describes a given API
interface to the service in a structured form.

There is a single API manifest which lists all API references, hosted at
[https://references.taskcluster.net/manifest.json].

API references are structured json documents which describe an API that a
service provides. These json documents declare a json schema document that they
adhere to, called a reference schema. The currently referenced reference
schemas in production today are:

* [API reference schema](https://schemas.taskcluster.net/base/v1/api-reference.json)
* [Exchanges reference schema](https://schemas.taskcluster.net/base/v1/exchanges-reference.json)

This list may be augmented in future, or indeed custom taskcluster deployments
may wish to provide their own reference schemas which are not understood or
used by the core taskcluster platform.

The published API references are consumed during the following activities:

* building taskcluster clients, that provide language-level programming
  interfaces to taskcluster APIs
* refreshing `taskcluster-raw-docs` AWS S3 bucket, which is used by taskcluster
  docs site, that displays information about taskcluster APIs
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

## 4. Proposed changes

## 4.1 Changes to publishing API manifest

1. If a service of a taskcluster deployment provides an API interface, the
   cluster may host the API reference document under
   `<TASKCLUSTER_ROOT_URL>/references/<serviceName>/<version>/api.json`
2. If a service of a taskcluster deployment provides an Exchanges interface,
   the cluster may host the exchanges reference document under
   `<TASKCLUSTER_ROOT_URL>/references/<serviceName>/<version>/exchanges.json`
3. A taskcluster deployment must serve the API references manifest under
   `<TASKCLUSTER_ROOT_URL>/references/manifest.json` with the following format:

```
{
  "$schema" : "<fully-qualified-url-to-api-manifest-schema>",
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
  "$schema" : "https://schemas.taskcluster.net/base/v1/api-manifest.json",
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
  "$schema" : "https://tc.foo/schemas/base/v1/api-manifest.json",
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

## 4.2 Changes to API references format

The `api-reference.json` document currently served
http://schemas.taskcluster.net/base/v1/api-reference.json from should be served
from `<TASKCLUSTER_ROOT_URL>/schemas/base/v1/api-reference.json`.

* All `entries[*].input` and `entries[*].output` properties should be URLs
  relative to `<TASKCLUSTER_ROOT_URL>/schemas/<serviceName>`

(This has already been implemented across most services)

## 4.3 Changes to Exchanges references format

The `exchanges-reference.json` document currently served
http://schemas.taskcluster.net/base/v1/exchanges-reference.json from should be served
from `<TASKCLUSTER_ROOT_URL>/schemas/base/v1/exchanges-reference.json`.

* All `entries[*].schema` properties should be URLs relative to
  `<TASKCLUSTER_ROOT_URL>/schemas/<serviceName>`

(This has already been implemented across most services)

## 4.4 Changes to publication of API references and schemas

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

## 4.5 Changes to `taskcluster-lib-urls`

* Method `ServicesManifest` should be renamed to `APIReferencesManifest`.
* The following new methods should be added, e.g. for go client:

```go
func APIReference(rootURL string, version string) string { .... }
func ExchangesReference(rootURL string, version string) string { .... }
```

These will return absolute urls to the `*-reference.json` documents,
i.e. approximately following this logic:

```
rootURL == 'https://taskcluster.net'
  ? 'https://schemas.taskcluster.net/v1/base/{api|exchanges}-reference.json'
  : '${rootURL}/schemas/v1/base/{api|exchanges}-reference.json'
```

## 4.6 Changes to taskcluster client building procedure

For all of the supported language clients, there is a code generation step.
There are two principle reasons for having a code generation step, when
technically a client could interpret a set of references and schemas at
runtime, and not require any code generation. These reasons are:

1) For compiled lanugages (go, java) we can cause non-adherence to API
definitions in calling code to occur at compile-time, rather than at runtime,
preventing a swath of failure conditions from entering production code.

2) For all languages (both compiled and not-compiled), generated code can be
easier to program against, for example aiding code completion in IDEs, or
making available methods and data structures more easily discoverable to a user
that is coding against the library.

Note, neither of these reasons apply to a command line tool, such as
`taskcluster-cli` - it only makes sense to generate code when exposing a
language level interface via a language library, since only then is an external
party coding against that interface.

Also note, currently the node.js client only generates the `apis.js` file,
which is a wrapper around a data structure representing the frozen content of
the api references and schemas. Changing its contents requires a rebuild, as it
is javascript code, not a json document that could otherwise be stored as user
data on the filesystem (e.g. under `~/.taskcluster/apis/<version-hash>.json`).

The build process for taskclster clients should be moved into a standalone tool
that requires a `TASKCLUSTER_ROOT_URL` to be specified to build the client for.
It will then query the API References manifest in order to determine all the
APIs it needs to build, and from there build packages for each API reference it
finds. At some point in the future we may also wish to support building a
client against a set of references and schemas that have not been deployed, but
that is beyond the scope of this initial RFC.

Please note, a generated client may retain internal references to the
deployment it was built from, but a client built from a set of references and
schemas hosted at one root URL will function identically to a client built
against a different deployment which had the same references and schemas. The
value of `TASKCLUSTER_ROOT_URL` at client build time is simply used to
establish where to download the references and schemas from. Code that imports
a client may choose to interface with a different deployment to the deployment
that the client was built from. It is the responsibility of the caller to
ensure that the methods he/she calls are compatible with the deployment he/she
connects to.

The API reference for a service must declare the `$schema` json schema property
to say which API reference it implements.

The client should internally generate the urls _for the versions of the api and
exchanges references that it supports_, using the new methods described in
section 4.5.

For example, if a client generator supports version 7 exchange references, it
would construct the url for version 7 exchange references for the root url of
the environment it is building against, using e.g.:

```
exchangeV7Schema := tcurls.ExchangesReference(rootURL, 7)
```

When iterating through references listed in the API manifest, if the `$schema`
property of a reference exactly matches the url for one of the interfaces it
implements (e.g. `exchangeV7Schema` in the case above), it can infer that it
refers to the interface it knows how to generate code for, and generate it.  If
the `$schema` url does not match exactly one of the preconstructed urls it has
generated, the client generator may choose to either skip the reference and
display a warning message, or throw an error.

Note this also requires that whatever generates the `$schema` value on the back
end also uses the `taskcluster-lib-urls` library to generate it. For the
purposes of this RFC, we only stipulate that the `$schema` property should be
generated on the back end using the taskcluster-lib-urls methods, if they
apply.

The code for the code generator will live in
https://github.com/taskcluster/tc-client-generator, and therefore only needs to
be updated when the code generation process changes, not when service API
definitions change.

## 4.7 Changes to taskcluster client features and configuration

Constructors for clients should require the rootURL to be explicitly provided,
i.e. no default. This is in order to ensure that the choice of deployed cluster
to connect to is an active one. The client may provide a utility methods to fetch
`TASKCLUSTER_ROOT_URL` from the environment, but it should not be assumed that if
this environment variable exists, that it should be used. Rather, code that calls
the taskcluster client should have to explicitly declare they wish to do so, for
example:

```
queue := queue.NewFromEnvVars()
```

This is important because not all code will want to configure settings based on
environment variables, for example workers that take their configuration from
configuration files.

## 4.8 Changes to services that depend on taskcluster client

When upgrading a service to use the new client, care will need to be taken to
ensure that taskcluster root URL is passed into the client. Either the client
should be generated and checked in with the service, or a generated client
should be released and version, which the service depends on.

## 4.9 Changes to projects that depend on a taskcluster client

Most projects that depend on a client (such as workers, command line tools,
etc) should consider generating a client, and vendoring it in their source code
repository. This way they are in control of the version of the APIs that it is
built against. Alternatively, as in the case of services that depend on a
client, a global client can be versioned a nd released, and the project can
depend on a specific version of the released client. Another option is to build
the client against a deployed environment during the CI of the project, for
example, building against the production environment that the tool is to be
primarily used with. In this case, the project would depend on the client
generator, and the client generator would then build the client as part of the
CI of the project.

All code that uses any of the new clients will need to explicitly pass in a
root URL in a constructor, or explicitly call a method to fetch
`TASKCLUSTER_ROOT_URL` from the environment.

## 4.10 Changes to `taskcluster-proxy` and its configuration

The taskcluster proxy should require an additional property to start up, which
is the root url of the deployment it should talk to. This should be a mandatory
property, and no default should be supplied, so the user is forced to make an
active choice about which environment they wish the proxy to connect to.

## 4.11 Changes to workers

* Workers that are started by a provisioner should fetch `TASKCLUSTER_ROOT_URL`
  from provisioner on start up
* Workers should require a new config property for taskcluster root URL in
  their config, and refuse to run if they do not have it and can't fetch it
  from provisioner configuration (no default allowed)
* Workers should pass `TASKCLUSTER_ROOT_URL` environment variable to all task
  processes they create.
* Workers should pass `TASKCLUSTER_ROOT_URL` to `taskcluster-proxy` when
  starting it up

## 4.12 Changes to tasks that use `taskcluster-proxy`

* Tasks that made API calls directly to taskcluster-proxy, and not via a
  taskcluster client (e.g. using curl directly) should still work, since the
  proxy knows which taskcluster root url to use from how it was invoked by the
  worker. 

## 4.13 Changes to tasks that use a taskcluster-client

If these tasks use an old taskcluster-client, no changes required. Tasks using
a new taskcluster client should make sure to set the TASKCLSUTER_ROOT_URL based
on the env var given to them from the worker.

## 4.14 Changes to building docs site

The author has no knowledge of this process, and leaves it up to the
implementor to decide.

## 4.15 Changes to taskcluster platform development lifecycle

The author has no knowledge of this process, and leaves it up to the
implementor to decide.

# 6. Implementation

<once the RFC is decided, these links will provide readers a way to track the
implementation through to completion>

* <link to tracker bug, issue, etc.>
* <...>
