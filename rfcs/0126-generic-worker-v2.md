# RFC 126 - Megalodon worker (a.k.a. generic-worker v2)
* Comments: [#126](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/126)
* Proposed by: @walac

# Summary

The worker is the component of Taskcluster responsible to execute the
job described in the task payload. It runs on a cloud instance or
data center server and picks its jobs from the
[queue](https://github.com/taskcluster/taskcluster-queue).

Taskcluster projects currently provides two workers:

* [docker-worker](https://github.com/taskcluster/docker-worker): executes
Taskcluster jobs inside a docker container.

* [generic-worker](https://github.com/taskcluster/generic-worker): executes
Taskcluster jobs natively in the running machine.

Although workers may run tasks in rather different environments, they share
a fair amount of features, and it is reasonable to think they could share
a common code base. Indeed this was the finality of
[taskcluster-worker](https://github.com/taskcluster/taskcluster-worker),
a worker aimed to support multiple execution environments. For reasons
explained later in this document, it failed to achieve this goal.

# Motivation

Both docker-worker and generic-worker were designed to accomplish a very
specific task and do it well, but their architecture opens little room
to support different execution environments, hence the proposal for a
ground up worker.

The initial thought was to extend generic-worker to support docker-worker
payloads. This way we could benefit from the stability of generic-worker
code base. The point is that any sane implementation of docker-worker
payload support would lead to such a heavy code change that
the "code stability" claim would no longer be true; given that
generic-worker architecture was never thought to support
multiple payloads, like taskcluster-worker did.

# Risks

## Another worker that will never reach production

Note: the critics below follow the author's view, different people
may have a different perception, and it should by no means
be accepted as an universal truth.

Our first attempt to unify workers in a single code base never reached
a state in which we could deploy to production, and it is important
to look back and see why:

* No backward compatibility. tc-worker was designed with a view of how
the world around it should be, and not based how the real world is.
This made difficulty to implement engines that would be compatible
with production environment, making infeasible to test them against
real production work loads.

* Complex architecture. It is necessary to implement up to 6 interfaces
to get a new engine running in taskcluster-worker, not to mention unnecessary
duplication of the standard library. Also the indiscriminated
use of goroutines and lock mechanisms caused intermittent, hard to debug,
deadlocks.

* Too many "nice to have" features: the worker implemented lots of features
that have no practical use, while important features, like the docker engine,
were put aside for a long time. This led to more code complexity, while it
heavily delayed its deployment.

The *goals* session pretty much summarizes the focus of the new worker to avoid
the aforementioned problems.

## New bugs

There are concerns that starting a new worker from scratch will cause new
bugs not found in the production workers. Although this is unavoidable for any
new development project, there are a few points that show it is not as a big deal
as people might think:

* This proposal isn't about throwing away what we have and start over. There are
test cases and corner cases we should definitely pay close attention in the legacy
code that we want to keep in the new code.

* The people that would develop the new worker carry the lessons learned from
the time of maintaining generic-worker and docker-worker.

* As it is backward compatible, it is easy to set up some worker types to take
production load and see how it behaves.

## Code duplication

While the new worker doesn't reach production status, we will have to maintain
a duplicated code base.

We already maintain such a duplicated with docker-worker and
generic-worker. A new worker would temporarily increase the problem, but
in long term it would end up being the only worker to maintain.

# Implementation

Note: we assume we will implement the worker in  [Go](https://golang.org)
programming language.

We call each worker payload implementation an *executor*. Each executor implements
three interfaces:

* `Feature`: a feature is a specific characteristic supported by the executor.
Example: a proxy to route requests to an external service.

* `Artifacts`: this interface is responsible to return the artifacts yielded by
a task run.

* `TaskExecutor`: this is the main interface that links the specific executor to
the worker machinery.

The core of `TaskExecutor` interaction is the
[Context](https://golang.org/pkg/context/) type. The `Prepare` method returns a
`context.Context` object, and it is used as a handle for the task. The channel
returned by `Context.Done()` signals when the task is done, and `Context.Err()`
tells if an error happened.

Here is a rough idea how the components interact:

```go
type Feature interface {
  Start(ctx context.Context) error
  Stop (ctx context.Context) error
}

type Artifacts interface {
  Names(ctx context.Context) []string
  Content(ctx context.Context, name string) (io.ReaderCloser, error)
}

type TaskExecutor interface {
  ValidatePayload(task *tcqueue.TaskClaim) error
  Prepare(task *tcqueue.TaskClaim, logger io.Writer) (context.Context, context.Cancel, error)
  TaskClaim(ctx context.Context) *tcqueue.TaskClaim
  Features(ctx context.Context) ([]Feature, error)
  Run(ctx context.Context) error
  Result(ctx context.Context) Artifacts
}

executor := NewTaskExecutor()

for {
  taskClaim := ClaimWork()

  if err := executor.ValidatePayload(taskClaim); err != nil {
    return err
  }

  ctx, cancel, err := executor.Prepare(taskClaim, logger)
  if err != nil {
    return err
  }

  func() {
    defer cancel()

    features, err := executor.Features(ctx)
    if err != nil {
      return err
    }

    for _, feature := range features {
      feature.Start(ctx)
    }

    executor.Run(ctx)
    <-ctx.Done()

    if ctx.Err() != nil {
      // task failed or exception
    }

    artifacts := executor.Names(ctx)

    for _, name := range result.Get(ctx) {
      r, _ := result.GetContent(ctx, name)
      uploadArtifact(name, r)
    }

    for _, feature := range features {
      feature.Stop(ctx)
    }
  }()
}
```

# Main Goals

* Drop-in replacement for both generic-worker and docker-worker: externals
should not notice any difference in (correct) behavior between megalodon and
the legacy workers.

* Backward compability: megalodon must support the same payload syntax of generic
and docker worker.

* Stability: with the lessons learned from generic-worker and docker-worker, we
aim to provide a rock solid worker.

* Simplicity: the main goal of megalodon is to be a drop-in replacement for
generic-worker and docker-worker. The initial stable version should strive to
that. No "nice to have" features.
