# RFC 189 - Batch APIs for task definition, status and index path
* Comments: [#189](https://github.com/taskcluster/taskcluster-rfcs/pull/189)
* Proposed by: @Alphare and @ahal

# Summary

Add API endpoints to query the definition, status or index paths of multiple
tasks in a single call.

## Motivation

When looking at Decision task profiles in Gecko, it was noticed that nearly 70%
of the runtime (representing ~3 minutes) was spent waiting on queries to two
Taskcluster APIs:

1. `/task/<taskId>/status`
2. `/task/<indexPath>`

Each individual call is fairly quick, but Gecko Taskgraph's optimization phase
can make thousands of these requests. Creating an API that can return all the
information Taskgraph needs in a handful of API requests would greatly speed up
the overall time the Queue and Index services spend looking things up in the
database, as well as the time Gecko Decision tasks spend waiting on the
network.

Note: Taskgraph doesn't actually use the `task/<taskId>` endpoint here, but
this endpoint is adjacent to the other two, so for consistency it may make
sense to implement a batch API for that as well.

### Proof of Concept

A proof of concept was created whereby the requests to Taskcluster were simulated
such that all data could be obtained in a single API call. The overal Decision task
time was reduced by ~3 minutes.

# Details

The following new APIs will be created:

## `queue.tasks([<taskId>])`

- Endpoint: `/tasks`
- HTTP GET:
    - Request body consisting of a JSON object:
        ```
        {
            "taskIds": [<taskId>]
        }
        ```
    - Response body:
        ```
        {
            "tasks": {
                <taskId>: <same format as `queue.task(<taskId>)`>
            },
            "continuationToken": <continuation token>
        }
        ```

## `queue.statuses([<taskId>])`

- Endpoint: `/tasks/status`
- HTTP GET:
    - Request body consisting of a JSON object:
        ```
        {
            "taskIds": [<taskId>]
        }
        ```
    - Response body:
        ```
        {
            "statuses": {
                <taskId>: <same format as `queue.status(<taskId>)`>
            },
            "continuationToken": <continuation token>
        }
        ```

## `index.findTasksAtIndexes([<indexPath>])`

- Endpoint `/tasks/indexes`
- HTTP GET:
    - Request body consisting of a JSON object:
        ```
        {
            "indexes": [<indexPath>]
        }
        ```
    - Response body:
        ```
        {
            "tasks": [<same format as `index.findTask(<indexPath>)`>]
            "continuationToken": <continuation token>
        }
        ```

Each endpoint will return up to 1000 results. If this number is exceeded, a
`continuationToken` will be provided.

There are no compatibility or security concerns, all new APIs are essentially
wrapping existing APIs.

## Open Questions

1. Do we bother implementing `/tasks` as well even though Taskgraph wouldn't
   benefit much?
2. Should `/tasks/indexes` also allow listing multiple tasks under multiple
   namespaces? Or should we enforce index paths pointing to specific tasks?
3. Should we bother with continuationTokens? Or simply set a limit and force
   consumers to chunk their own task ids and index paths if they exceed the
   limit?

# Implementation

<Once the RFC is decided, these links will provide readers a way to track the
implementation through to completion, and to know if they are running a new
enough version to take advantage of this change.  It's fine to update this
section using short PRs or pushing directly to master after the RFC is
decided>

* [Original feature request issue](https://github.com/taskcluster/taskcluster/issues/6738)

# Addendum

1. Command used for Gecko profiling:
   ```
   py-spy record -F --idle --format speedscope -o output.json -- ./mach taskgraph morphed -p taskcluster/test/params/mc-onpush.yml
   ```
2. Profiling results: ![20231211_10h54m47s_grim](https://github.com/taskcluster/taskcluster/assets/9445758/62c400cc-a125-4f08-b7dd-c8bc9a9e9a6d)
3. Proof of concept profiling results: ![20231211_10h55m01s_grim](https://github.com/taskcluster/taskcluster/assets/9445758/1849c8a1-fcc0-403b-acaf-ea997c875505)
