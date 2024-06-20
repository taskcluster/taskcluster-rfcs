# RFC 192 - `minCapacity` ensures workers do not get unnecessarily killed
* Comments: [#192](https://github.com/taskcluster/taskcluster-rfcs/pull/192)
* Proposed by: @JohanLorenzo

# Summary

`worker-manager` allows `minCapacity` to be set, ensuring a certain number of workers
are available at any given time. Unlike what current happens now, these workers
shouldn't be killed unless `minCapacity` is exceeded.

## Motivation - why now?

As far as I can remember, the current behavior has always existed. This year, the
Engineering Effectiveness org is optimizing the cost of the Firefox CI instance.
[Bug 1899511](https://bugzilla.mozilla.org/show_bug.cgi?id=1899511) made a change that
actually uncovered the problem with the current behavior: workers gets killed after 2
minuted and a new one gets spawned.


# Details

In the current implementation, workers are in charge of knowning when they have to shut
down. Given the fact `docker-worker` is officially not supported anymore and we can't
cut a new release and use it, let's change what config `worker-manager` gives to all
workers, `docker-worker` included.

## When `minCapacity` is exceeded

In this case, nothing should change. `worker-manager` sends the same config to workers
as it always did.

## When `minCapacity` is not yet met

Here, `worker-manager` should increase `afterIdleSeconds` to a much higher value (e.g.:
24 hours). This way, workers remain online long enough and we don't kill them too often.
In case one of these long-lived workers get killed by an external factor (say: the
cloud provider reclaims the spot instance), then `minCapacity` won't be met an a new
long-lived one will be created.

### What if we deploy new worker images?

Long-lived workers will have to be killed if there's a change in their config, including
their image.

### What if short-lived workers are taken into account in `minCapacity`?

When this happens, the short-lived worker will eventually get killed, making the number
of workers below `minCapacity`. Then, `worker-manager` will spawn a new long-lived one.

## How to ensure these behaviors are correctly implemented?

We should leverage telemetry to know how long workers live and what config they got
from `worker-manager`. This will help us find any gaps in this plan.


# Implementation

TODO
