# RFC 188 - Adding a batched "label to task status" endpoint
* Comments: [#188](https://github.com/taskcluster/taskcluster-rfcs/pull/188)
* Proposed by: @Alphare

# Summary

Add an endpoint to query the latest status for a given task label, for each
label in a provided list.

## Motivation

When looking at profiles with the following command in the `mozilla-unified`
repo:

`py-spy record -F --idle --format speedscope -o output.json -- ./mach taskgraph morphed -p taskcluster/test/params/mc-onpush.yml`

I saw that the majority (near 70%) of the time was spent on the optimization
step, as the screenshot below shows:

![20231211_10h54m47s_grim](https://github.com/taskcluster/taskcluster/assets/9445758/62c400cc-a125-4f08-b7dd-c8bc9a9e9a6d)

Further investigating, it turns out that basically all of this time is spent
waiting on the network doing `read()` calls. Basically, for every task, there
is one call to `find_task_id`, then one call to `status_task`, the goal
of which is to get the status of the latest task that corresponds to a label.
In our case, this corresponds to 900+ API calls, incurring a massive performance
cost to the client, and I'm guessing it's not negligible from the server's
standpoint. (Why some of those calls take multiple seconds I have no idea,
it might be worth investigating separately.)

## Proof of concept

To see if my intuition was correct, I've recorded the mapping of
`label -> status` and replayed the command with the mapping acquired from a
JSON file to simulate a (very) fast single API call that would give the
right structure. The optimization step goes down to 2 seconds from 2+ minutes,
as shown in the screenshot below:

![20231211_10h55m01s_grim](https://github.com/taskcluster/taskcluster/assets/9445758/1849c8a1-fcc0-403b-acaf-ea997c875505)

# Details

Implementation details:

- New API endpoint `/status`
- HTTP GET:
    - Request body consisting of a JSON object:
        ```
        {
            "labels": <list of labels, not sorted, non-unique>
        }
        ```
    - Response body:
        ```
        {
            "mapping": {
                <label>: <status of latest task for label>
            },
            "continuationToken": <continuation token>
        }
        ```

This changes the behavior of the program slightly since the task statuses
are queried all at once and not during the optimization process. This is not
a problem since the same "race condition" of observing a new status for
any given task exists in the current code, just much slower. I would argue
that making this a single step also makes debugging easier.

There are no compatibility or security concerns.

I'm a little blurry on how the database is currently laid out, but I've had
a couple of discussions with maintainers that will have opinions on how to
implement the query server-side.

# Implementation

<Once the RFC is decided, these links will provide readers a way to track the
implementation through to completion, and to know if they are running a new
enough version to take advantage of this change.  It's fine to update this
section using short PRs or pushing directly to master after the RFC is
decided>

* [Original feature request issue](https://github.com/taskcluster/taskcluster/issues/6738)
