# RFC 0160 - Worker Resource Monitoring
* Comments: [#<number>](https://github.com/taskcluster/taskcluster-rfcs/pull/160)
* Proposed by: @srfraser

# Summary

A worker should monitor the system resources used by its task payloads and record the data in a way that can be analysed by
existing data tools.

## Motivation

There is an active program to reduce costs in CI infrastructure, and more information is required about whether tasks are running on appropriately sized instances. The instance sizing also relates to developer efficiency and the time spent waiting for results, as well as the end-to-end time of releases.

While AWS offers a [cost optimizer](https://console.aws.amazon.com/compute-optimizer/home?region=us-east-1#/dashboard), there are workers in GCP and Azure, requiring cloud-agnostic data collection.

The worker should record samples of CPU times (system, user, iowait), Virtual and Swap memory usage, Available memory on the system, Disk IO and Network IO.

For example:

Task A is running on an workerType that provides 8 cores and 16Gb memory, and this will let us discover that Task A is single threaded, or only uses 8Gb memory. We can either then increase concurrency or reduce the instance size.

Task B may be running on the same workerType as task A, but may use 1 core and 1.8Gb of memory, implying that a higher concurrency is effective.

Task C may use the full memory of a worker, which may be efficient in terms of instance sizing but we could then highlight it as a relevant variable if the task needs to take less time.

In all cases we would get a record of the resource impact of any payload changes, providing more information to developers.

Since we already record task timing and cost data in BigQuery, that would be the ideal downstream location for this data. We already have an ingestion route for the live log in order to collect test suite timing data, and this could be the route for resource usage artifact ingestion.

The downstream analysis would report on other tasks that would be affected by changes and inform whether changing an existing workerType's specification or creation of a new workerType is safer. We also plan on tooling to run experiments to measure the effects of changes.


# Details

Querying system-wide cpu and memory information isn't as useful, given that an instance can have multiple tasks running. So where possible, recording per-process stats is the goal. `psutil` and equivalents often have helper functions to allow quick discovery of all the process's children, and most platforms allow collection of per-process cpu times and memory usage.

Disk and Network IO are valuable metrics to collect, with the caveats that only Linux has good support for these. Even querying per-process on Linux the data is system-wide, so we should be careful how that is presented, and not sum the data points along with the cpu times.



Outline:

1. Add code to the existing generic-worker and docker-worker
2. Every 1 second, a sample will be taken:
   a. Determine the number of processes being run by a task's payload
   b. Sum CPU and memory usage for each of those processes
   c. Record system-wide available memory at this timestamp
   d. Record Disk and Network IO
   e. Write sample out to temporary file, along with a timestamp (in case of worker error)
3. On receiving SIGKILL
   a. Clean up temporary file and exit.
4. On receiving SIGTERM or SIGINT
   a. Process temporary file into output format
   b. Add system information such as number of logical and physical cores, total memory, platform type (Windows, Linux, Mac)
   c. Write to artifact area
   d. Clean up temporary file and exit.


### Option 1: Build functionality into Go and JavaScript workers

Pros:

1. Self-contained feature, with no additional deployment needed.
2. Go has a [psutil equivalent](https://godoc.org/github.com/shirou/gopsutil) with all the required functionality

Cons:

1. It's not clear if JavaScript has a psutil equivalent with the functionality
2. Two separate code paths will need to be kept in sync to produce the same format output

### Option 2: A separate tool deployed to all workers

Pros:

1. We can use the Go psutil features

Cons:

1. Each worker will depend on a separate binary being deployed.

There is a prototype stored at [https://github.com/srfraser/moztaskmonitor/](https://github.com/srfraser/moztaskmonitor/) from an initial concept that would be closer to Option 2, but it can be used as a starting point for either.

It is not expected that there will be significant performance overhead. Some resource monitoring is already done by task payloads, and once that's disabled the performance impact should be similar.

# Output Format

The Go psutil library can serialize more data than this quite easily, but here are the minimum values that would be useful.

```
Schema({
    Required('start'): int, # Epoch time of earliest sample
    Required('end'): int,   # Epoch time of last sample
    Required('system_info'): {
        Required("total_vmem"): int,  # Total Virtual Memory in Bytes
        Required("total_swap"): int,  # Total Swap in Bytes
        Required("cpu_logical_count"): int,  # Logical/Hyperthreaded cores
        Required("cpu_physical_count"): int,  # Physical CPU cores
        Required("system"): Any("windows", "linux", "macosx")
    },
    Required('samples'): [
        {
            Required("timestamp"): int,  # Epoch time
            Required("memory"): {
                Required("vms"): int,  # Sum of all per-process values, absolute as the diff won't help.
                Required("rss"): int,  #
                Required("available"): int  # Available vmem, system-wide
            },
            Required("cpu"): {
                Required("user"): int,   # Sum of all per-process times, diffed from previous sample.
                Required("system"): int,
                Required("iowait"): int
            },
            Required("disk"): {
                Required("readCount"): int,  # System values, diffed from previous sample
                Required("writeCount"): int,
                Required("readBytes"): int,
                Required("writeBytes"): int
            },
            Required("network"): {
                Required("bytesSent"): int, # System values, diffed from previous sample
                Required("bytesRecv"): int,
                Required("packetsSent"): int,
                Required("packetsRecv"): int
            }
        }
    ]
})
```

# Implementation


* <link to tracker bug, issue, etc.>
* <...>
* Implemented in Taskcluster version ...
