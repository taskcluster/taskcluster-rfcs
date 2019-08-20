# RFC 124 - Worker Manager
* Comments: [#124](https://github.com/taskcluster/taskcluster-rfcs/pull/124)
* Proposed by: @jhford

# Summary
Taskcluster was originally designed with a single Queue instance in the world.
This is the
[taskcluster-queue](https://github.com/taskcluster/taskcluster-queue) codebase.
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

The worker manager will be a single instance per cluster, as are the Queue and
Auth currently.  It would be responsible for all facets of worker management.
It would be responsible for:

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

The worker manager will replace aws-provisioner and the worker management
related endpoints which exist in the Queue.  The ec2-manager project will be
adapted to work with the worker manager.

## Motivation
Taskcluster is growing and becoming redeployable.  We would like to be able to
move into more cloud providers without having to reinvent the wheel each time.
We would also like managing a cluster to be a pleasant experience.  We would
like a single, discoverable, reliable, programmatically usable API to manage
workers.

# Details
The worker manager will be a single component per cluster.  The worker manager
will have a single, static, reserved provisionerId of `worker-manager`.  All
managed instances will use this provisionerId, regardless of whether they are
provisioned.

Workers which do not use automated provisioning will be first class citizens in
the worker manager.  Use of the worker manager will not be mandatory.  Tasks
for other provisionerIds will continue to be run.  We will build tooling around
the worker manager and not other systems as a core part of Taskcluster.

## Terminology
Terminology is often a source of confusion.  This section will clarify the
meaning of the presented words *in this document*.  It is not intended to be an
agreement on general usage of the terms outside the scope of this document.

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
  implementation.  A worker is roughly equivalent to an EC2 instance running a
  worker implementation.
- Worker Implementation: This is a program which pulls tasks off the task Queue
  and runs them.  This term refers to the codebase, like generic-worker
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

## Worker State
Worker manager will also provide worker state APIs.  These APIs will show
information like the last task runs for a given worker type, worker
configuration or worker.  The data backing this information will be received
from the Queue over RabbitMQ.  The worker manager will track outcomes.  The
only information from the Queue stored in this service will be the task run
outcome, task id and run id.  All other information will be available through
the Queue.

## Worker Configuration
The worker manager will provide facilities for configuring Workers.  There will
be a set of Taskcluster APIs for creating and managing worker configurations.
All JSON documents presented in this section will be considered illustrative of
the idea and are not intended as a formal specification.

Worker configurations will be a list of worker types and a list of rules
specified in a JSON document.  Each rule will have conditions, values and a
description.  The rules will be evaluated in the order of the rules list.

Each rule set will be used to construct the internal configurations for each
worker.  These configurations will be used by bidding strategies and providers
as their native format.  The evaluation will begin with an empty object and
each rule will write its values into that object.  Later rules can overwrite
previous rules or can delete values from previous rules.

This logic should be implemented as a standalone JavaScript library to allow
reuse in tools which do automated worker configuration management as well as
easier contributions to the rule set evaluation logic.

Each edit of a worker configuration rule set will be atomic to precisely the
worker configuration rule set.  Rules are intended to be building blocks rather
than large blocks of configuration.  They must also be deterministic, such that
they can be cached with invalidation only needed when a rule set is modified.

Each worker type must be unique globally among all worker configurations.
This will mean that any edits to a worker configuration which add new worker
types will have to check all existing worker configurations to ensure there are
no duplicated names.

### Rule ID
Each rule will have an identifier.  These identifiers are free-form and must be
unique within each worker configuration, but can be duplicated across worker
configurations.  These identifiers are intended to be used by systems which
perform automated edits of worker configurations.

An example is an AMI build process.  If there's a rule called `ec2-ami` which
defines nothing more than the images to be used, the AMI build process knows
which rule needs to be edited for the new image.

### Conditions
Each rule's conditions can be `null` or a mapping of condition names to a
string or a list of strings.  The `null` value signifies that there are no
conditions for the rule, and thus universally applicable.

For condition objects, each property name will be the condition name to match
against and each value will be a string or a list of strings.  A string value
will be used as input to a glob-pattern matching system to check if it is a
match for the presented option.  The specifics of how the pattern matching
works will be determined by the pattern matching system selected during
implementation.

In the list of strings case, each string will follow the interpretation rules
as specified for a single string.  If any string pattern in the list of strings
matches, the entire condition will be considered to be satisfied.

Each provider will be able to present its own list of conditions as well as the
values for each evaluation possibility.  Each provider will only provide its
conditions when it is a possibility for a `provider` condition.  This is meant
to support cases where a provider must allow for more specific configuration
than known in the overall worker manager system.  A specific example is that an
EC2 provider will need to provide the ability to specify an `availbilityZone`
condition to support different subnets in each availability zone.

The number and complexity of provider specified conditions shall be kept to a
minimum.  They should only be used when absolutely needed and are only
appropriate to describe limitations of the cloud for which they are used.

The general conditions presented initially will be:

* provider
* worker type
* region

It is acknowledged that new general conditions may use names already used by
providers.  This is a trade off made to enable a simpler configuration
structure.

### Values
When a condition is satisfied, the values will be deeply assigned against the
internal configuration.  A special value of `null` will be used to signify that
any value previously stored at that property should be deleted.

When the evaluation of the rule set is completed, the configuration will be
checked to ensure that all mandatory properties are present.  The relevant
provider will also be given a copy of the configuration to ensure that it is
satisfied that the internal configuration is complete and valid.

### Description
Each rule will have a description.  This is to help make the configuration
easier to read as well as encouraging building configurations as building
blocks so that each rule can have a succinct summary.  Accordingly, no
accommodations for extremely long descriptions will be made.

### Example
This is an example worker configuration with an ID of "build" written in Javascript instead
of true JSON for brevity and syntactically valid comments.

```javascript
{
  workerTypes: ['build-opt', 'build-dbg'],
  rules: [
    {
      ruleId: "basic-options",
      conditions: null,
      values: {
        scalingRatio: 1,
        owner: "build-team@my-open-source-project.com",
        description: "configuration for builds",
      },
      description: "Basic worker options",
    },
    {
      ruleId: "ec2-ami",
      conditions: [{
        provider: "ec2",
        region: "us-east-1"
      }],
      values: {
        ec2: {
          ImageId: "ami-12345abcdef",
        }
      },
      description: "Configure EC2 AMI images to be used",
    },
    {
      ruleId: "us-east-1a subnets",
      conditions: [{
        provider: "ec2",
        region: "us-east-1",
        availabilityZone: "us-east-1a",
      }],
      values: {
        ec2: {
          SubnetID: "sn-302433abcdef"
        }
      },
      description: "us-east-1a needs own subnet for inter-vpc communication",
    }
  ]
}
```

If this rule set were evaluated for `provider=ec2`, `region=us-east-1` and 
`availabilityZone=us-east-1a`, the following internal configuration would be
generated:

```javascript
{
  scalingRatio: 1,
  owner: "build-team@my-open-source-project.com",
  description: "configuration for builds",
  ec2: {
    ImageId: "ami-12345abcdef",
    SubnetID: "sn-302433abcdef",
  }
}
```

### Documentation and Payload Schemas
Each worker type and worker configuration might have documentation and payloads
associated with them.  All documentation and payload schemas will be updated
through standard Taskcluster APIs.  The responsibility for keeping the
documentation and payload schemas up to date will rest with the maintainer for
the worker configurations.

The schema will be edited as a value in the worker configuration as a standard
entry in a rule set.

Documentation will be supported through a Taskcluster API.  Documentation will
be tarball containing a [taskcluster-lib-docs
format](https://docs.taskcluster.net/docs/reference/libraries/taskcluster-lib-docs/docs/format)
hierarchy.  Integration with the docs site for the Taskcluster instance is
desired but considered out of scope for this RFC.

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

Multiple providers can be configured using the same code, but using different
identifiers.  This would allow the administer of a worker manager instance to
have different accounts from the same cloud configured in the same worker
manager.  This would be useful both for sharing costs among project
participants as well as worker isolation within a single Taskcluster instance.

The bidding strategy will be configurable in the worker configuration by
setting the identifier of the strategy for that worker configuration.
Providers will be configured so that they are available in all worker
configurations.  Each worker configuration will need to opt in to each provider
as well as give provider specific configuration.

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
be at being fulfilled.  The bidding strategy will pass the selected bid to the
provider for allocation.  The default bidding strategy will match the current
aws-provisioner algorithm.

In order to support development of experimental bidding strategies, a bidding
strategy which can forward each request to an external service will be
provided.  Providers do not need to be implemented directly inside of the
worker manager, but can instead act as a bridge to an external service.

### Example Bid Conversation
This is a sample conversation, written as if each part of the system is a
person speaking with each other.  This is an illustrative conversation and is
not intended as a firm part of the design.

* Worker Manager: Hey, Bidding strategy, you should run.
* Bidding Strategy: Ok.  Queue, how many pending tasks?
* Queue: 10.
* Bidding Strategy (to all providers): How much running capacity do you have?
* EC2 Provider: 2 running, 2 pending.
* GCP Provider: 1 running.
* Bidding Strategy (monologue): I see 3 running instances and 2 pending
  instances.  The first five tasks already have workers, but I should create
  capacity for the remaining five.
* Bidding Strategy (to all providers): Can any of you provide me bids for creating
  five capacity?
* EC2 Provider: I can offer you 5 m3.medium instances for $2/h or 1 i5.8xlarge
  for $20/h.  I think these are reliable, here's the details.
* GCP Provider: I can offer you a medium instance for $2.5/h.  I think these
  are reliable, here's the details.
* Bidding Strategy (monologue): I think that 5 EC2 m3.medium instances is the
  right choice.
* Bidding Strategy: EC2 Provider, I picked the 5 m3.medium instances bid.  Here's
  the details you gave me.  Thanks!
* EC2 Provider: You're welcome!

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

# Implementation
[bug 1478941](https://bugzilla.mozilla.org/show_bug.cgi?id=1478941)
