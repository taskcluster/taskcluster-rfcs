# RFC 65 - Migrate queue to postgres
* Comments: [#65](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/65)
* Initially Proposed by: @jonasfj

# Proposal
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

There is an initial attempt at outlining what the database schema would look at here:
https://public.etherpad-mozilla.org/p/jonasfj-queue-with-postgres