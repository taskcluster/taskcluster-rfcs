# RFC 65 - Migrate queue to postgres
* Comments: [#65](https://github.com/taskcluster/taskcluster-rfcs/pull/65)
* Initially Proposed by: @jonasfj

# Summary

The Queue service currently uses a bunch of Azure tables to handle tasks, dependencies, artifacts, and so on.

This project involves refactoring the Queue to use a Postgres backend, instead.

# Motivation

Pros:
 * We can do smarter things
   * for priority
   * task affinity
   * querying tasks
   * statistics
 * Lots of cheap hosting options:
   * aws aurora postgres
   * aws rds postgres
   * heroku postgres
   * google cloud SQL postgres
   * self-hosted postgres
   * self-hosted cockroachdb (we are close to key-value usage)
 * We can host in the same data center as our web nodes (reducing latency)

Cons:
  * It's not a hand-off auto-scaling solution
  * We can do expensive queries and bring the system down

# Details

There is an initial attempt at outlining what the database schema would look at here:
https://public.etherpad-mozilla.org/p/jonasfj-queue-with-postgres

# Implementaion

* tracker: https://bugzilla.mozilla.org/show_bug.cgi?id=1436478
