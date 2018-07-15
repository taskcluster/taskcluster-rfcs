# RFC 124 - Worker Manager
* Comments: [#124](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/124)
* Proposed by: @jhford

# Summary
Taskcluster was originally designed with a single Queue instance in the world.
This single Queue would be used to coordinate all tasks from all Taskcluster
users.  Isolation between different users of Taskcluster would be provided by
using different provisioners and workers.

Over time, the deployment model of Taskcluster has changed to being a
redeployable software system.  The idea of having one Queue and many users has
migrated towards having one Queue for each Taskcluster environment.  For the
Firefox-CI use case, this means possibly having a full production cluster
alongside one or more staging clusters.

There has also been difficulty in building coherent and reliable worker
management tools which span more than one cloud.  The Queue is the single
coordinating system of Taskcluster, but is not an expert at managing workers.
The systems which *are* experts at worker management do not have a
programmatically discoverable API.

We would like to change the architecture of Taskcluster to have a new component
called the worker manager.  This new component would take over the worker
management responsibilities from the Queue as well as providing a single API to
manage workers.

The worker manager would be a single instance per cluster.  It would be
responsible for all facets of worker management.  It would be responsible for:

- storing worker configurations for a cluster
- storing documentation for workers
- storing payload schema for workers
- providing apis to manage workers
- provisioning through providers and bidding strategies
- providing credentials to workers as appropriate for their hosting environment

We have a category of 'unprovisioned' workers.  These workers are ones
which aren't created by an automatic provisioner.  These workers will also need
the facilities provided by the worker manager, but do not have their capacity
managed by a system.

## Motivation
Taskcluster is growing and becoming redeployable.  We would like to be able to
move into more cloud providers without having to reinvent the wheel each time.
We would also like managing a cluster to be a pleasant experience.  We would
like a single, discoverable, reliable, programmatically usable API to manage
workers.

# Details
The worker manager will be a single component per cluster.  The worker manager
will have a single, static, reserved provisionerId of `worker-manager`.  All managed
instances will use this provisionerId, regardless of whether they are provisioned.

Workers which do not use automated provisioning will be first class citizens in
the worker manager, but use of the worker manager will not be mandatory.  Tasks
for other provisionerIds will still be run, but will not have any of the
management capabilities from the worker manager.  We will build tooling around
the worker manager and not other systems as a core part of Taskcluster.

## Terminology
Terminology is often a source of confusion.  This section will clarify the meaning of
the presented words *in this document*.  It is not intended to be an agreement on general
usage of the terms outside the scope of this document.

- Provisioner: (old term) a system which provides complete management of a pool
  of workers from a specific cloud provider.  Example: aws-provisioner
- Provider: (new term) a system which knows how to create and destroy workers.
  Does not understand concepts like capacity.  Essentially something which
  wraps a cloud's instance management APIs.  Similar in scope to existing
  service ec2-manager
- Cloud: the complete resources offered by a service providers.  Example: AWS
- Region: regardless of the specific name used by a cloud, this is the largest
  unit of tenancy for which it remains cost free, low latency and high speed to
  make network connections.  This maps to the AWS/EC2 region concept
- Capacity: name for the number of tasks which can run concurrently on a
  worker.  This is used for planning how many instances must be created.  Each
  unit of capacity offsets one unit of pending in the Queue's pendingTask
  concept
- Scaling Ratio: the ratio of pending tasks to running workers which the worker
  manager will try to maintain.  Used for hard-to-provision systems or
  heavy-burst loads so that workers are not started before demand is really
  there
- Worker: this is the name for a system which is running a Taskcluster worker
  program.  A worker is roughly equivalent to an EC2 instance running a worker
  program.
- Worker Program: This is a program which pulls tasks off the task Queue and
  runs them.  This term refers to the codebase, like generic-worker
- Worker Image: This is a snapshot of a specific machine before it is booted.
  Used with broad equivalence to the AMI (Amazon Machine Image) term
- Worker Id: The cloud specified resource identifier for a worker.  In AWS, it
  is the instanceId field, example: i-abcdef0123456789
- Worker Group: The cloud specified resource identifier for the region.  In AWS,
  it is the region's programmatic name, example: us-east-1
- Worker Configuration: (new term) this is an entry in the worker manager's
  API.  It will have an identifier, and that identifier will only be used
  within the worker manager
- Worker Type: (new term) name of a pool of workers as used by the Queue.
  Exclusively an identifier.  May have more than one worker Type for a given
  worker configuration.  

## Architecture Overview
The worker manager will be comprised of a Taskcluster API, a service to listen
to Queue messages, a set of providers, a set of bidding strategies, and
credential generation.  It will be implemented in Node.js using standard
Taskcluster services libraries.

There is no intent to create a full Taskcluster service for each pluggable
component.  The interchange between pluggable components and the main worker
manager will be through Javascript method calling.  It is the discretion of the
component's author whether the full component runs in the Worker Manager's
process or if it functions as a bridge to an external service.  These
components are intended to be developed as part of the worker manager codebase.

## API
The worker manager will expose APIs to control workers.  These include terminating
instances and listing running workers.  There will also be APIs which operate
on whole worker configurations and worker types.  These APIs will be standard
Taskcluster APIs and will use scopes which are categorized by worker configuration
and worker type.

### Worker State
Worker manager will also provide worker state APIs.  These APIs will show
information like the last task runs for a given worker type, worker
configuration or worker.  The data backing this information will be received
from the Queue over RabbitMQ.  The worker manager will track outcomes.  The
only information from the Queue stored in this service will be the task run
outcome, task id and run id.  All other information will be available through
the Queue.

### Worker Configuration
The worker manager will provide facilities for configuring Workers.  There will
be a set of Taskcluster APIs for creating and managing worker configurations.
Each worker configuration will specify global options like the maximum global
capacity units, the scaling ratio and the list of worker types for which this
worker configuration can be used.

Worker configurations will also have per-providers options.  Each provider's
options section will be able to override global options, like max capacity.
This would be used to say "We want to have 1000 Capacity, but no more than 100
from hardware".  Each provider a worker configuration can use would also have a
section for provider-specific configuration.  This would store things like
which worker image to use.  A more concrete example is that this section would
store the AMI to use for an EC2 Worker.

All levels of worker type configurations (e.g. global, per worker-type,
per-provider) will support a `disabled: true` which will disable that section
of the configuration.  The least specific disable will take priority.  This
value will only block creation of new resources, not disable management of
existing resources.

Each edit of a worker-configuration will only be atomic to the
worker-configuration level.

### Multiple Worker Types for one Worker Configuration
There are a lot of worker types which have identical configuration other than
their worker type.  In order to support having more than one worker type for a
given worker configuration, the worker configuration will have a list of worker
types for which it can provide capacity for.  This will be a list in the
configuration document.  Each entry in the list is either a string or an object
which overrides global worker configuration options like max capacity for that
specific worker type.  For configuration which is a range or value, the most
restrictive will be used.

Each worker type must be globally unique to a single worker configuration.

### Documentation and Payload Schemata
Each worker type and worker configuration might have documentation and payloads
associated with them.

The schema will be exposed as any other value in the worker configuration to
the JSON document as an option like any other, but will be treated as an opaque
JSON-Schema document.  If overridden in a more specific configuration section,
the most specific complete document will be used.  Accessing the payload schema
by worker type will be supported.

Documentation will be supported through a second API endpoint.  Documentation
will be a markdown document.  No secondary documents will be stored along with
the markdown.  If documentation requires images or other content, it can be
embedded with data uris, or hosted externally.  Documentation can be provided
for worker configurations as well as worker types.  No templating will be
supported.

Documentation can be requested by worker configuration, or by worker type.
When requesting by worker configuration, only the worker configuration
documentation will be shown.  When requesting documentation for a worker type,
the worker type documentation will be show, then a header similar to "# General
Worker Configuration Documentation" followed by the worker configuration
documentation.

## Provisioning with Worker Manager
The worker manager will take over provisioning from the ad-hoc provisioners
which exist today.  Provisioning can broadly be broken into two components:
bidding and allocation.

Bidding operates on Taskcluster concepts.  It takes into account the amount of
pending work, the number of running workers, and worker configuration then
decides how much capacity should be created.

Allocation happens when workers need to be created.  It's the mechanics of how
to create a worker for a given worker type.  Allocation operates purely on
cloud provider concepts.

The worker manager will have bidding strategies and providers.  The bidding
strategies will provide different ways to decide whether new capacity is
needed.  Providers will understand how to suggest bids for a given capacity
requirement as well as allocating the selected bids.

The bidding strategy will be configurable in the worker configuration by
setting the identifier of the strategy for that worker configuration.
Providers will be configured globally.  Each worker configuration will need to
opt in to each provider as well as give provider specific configuration.

### Bidding
Bidding strategies will take as inputs the current worker type state, the
recent history of a worker type, the worker configuration and the amount of
work pending from the Queue.  They will calculate the number of capacity units
which are needed.  If that number is greater than zero, they will request bids
from the providers.

The bid request will be the number of capacity units needed.  The bid response
will be a list of bids from each configured provider.  These bids will have
standard response entries as well as an opaque data field which the provider
will use the complete the bid if it is selected.  The standard response entries
will be things like the amount of capacity for that bid, a price per capacity
unit in the bid and a rating of how reliable the provider thinks the bid will
be.  The bidding strategy will pass the selected bid to the provider for
allocation.  The default bidding strategy will match the current
aws-provisioner algorithm.

In order to support development of experimental bidding strategies, a bidding
strategy which can forward each request to an external service will be
provided.  Providers do not need to be implemented directly inside of the
worker manager, but can instead act as a bridge to an external service.

## Credentials
Taskcluster credentials will be given out by the worker manager.  These
credentials will be used to obtain trusted credentials onto workers which boot
from worker images which have no embedded credentials.  Each cloud or
datacenter will have its own unique requirements and the specifics should be
implemented in the providers.

One special case is machines which are self-hosted in data centers.  These
machines do not have any management APIs from which to derive credentials, so a
different approach is needed.  A small server will run in the data center which
will expose an API to workers in the data center.  It will determine the IP
address of the requester, then do a forward and reverse dns lookup to determine
the host name of the machine.  The server will then request credentials from the
main worker manager through a Taskcluster-scope protected API and forward them
onto the worker.

# Open Questions
- Will we deprecate provisionerId? -- separate RFC?
- Email Provisioning strategy -- Email a mailing list when a worker type needs
  more capacity?
- Keep multiple worker types for one worker config?
- Will we use RabbitMQ messages for worker status and outcomes or will we have
  the Queue call into the worker manager to update worker information?
- Will providers use identifiers that embed the cloud (e.g. ec2_us-west-1) or
  will we create a cloud level identifier in configuration?

<what isn't decided yet? remove this section when it is empty, and then go to
the final comment phase>

# Implementation

<once the RFC is decided, these links will provide readers a way to track the
implementation through to completion>

* <link to tracker bug, issue, etc.>
* <...>
