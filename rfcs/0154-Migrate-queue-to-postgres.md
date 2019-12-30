# RFC 154 - Migrate Taskcluster to postgres
* Updates: RFC [65](https://github.com/taskcluster/taskcluster-rfcs/blob/master/rfcs/0065-Migrate-queue-to-postgres.md)
* Obsoletes: None
* Comments: [#154](https://github.com/taskcluster/taskcluster-rfcs/pull/154)
* Initially Proposed by: @jonasfj

# Summary

Taskcluster currently uses Azure's
[table storage](https://azure.microsoft.com/en-us/services/storage/tables/),
[queue storage](https://azure.microsoft.com/en-us/services/storage/queues/),
and [blob storage](https://azure.microsoft.com/en-us/services/storage/blobs/)
as the data-storage backend. For example, the Queue service currently uses a
bunch of Azure tables to handle tasks, dependencies, artifacts, and so on. This
project involves refactoring Taskcluster to use a Postgres backend as the
data-storage backend, instead.

# Motivation
* Azure doesn't allow joins. Postgres allows more sophisticated querying.
* Postgres can index by other than the primary key.
  * A shared base of indexed data can allow services to make smarter decisions and
    save money on provisioning and data storage.
* Azure is unreliable with frequent failures and inscrutible rate-limiting. While we are resilient
to these errors, they do cause inefficiency and sometimes cascading failures.
* Storing data in postgres will enable features users desire:
  * Queue introspection (Azure doesn't allow introspection of queues).
    * What tasks are pending right now?
    * How many tasks are [actually pending and not cancelled](https://bugzilla.mozilla.org/show_bug.cgi?id=1434851)?
  * Integration of task-related and worker-related status.
    * The approach we've taken with Azure doesn't allow tables to read from
      other tables.
    * What tasks has this worker performed?
  * Ad-hoc analytics.
    * How much compute time do we use per push?
    * What do we pay for wpt?
  * More sophisticated dependency resolution [in the case of task failure](https://bugzilla.mozilla.org/show_bug.cgi?id=1443503#c8)
  * Dynamically change task priorities.

# Details

## Transition

The transition to Postgres will be done in two steps:
1. Transfer the data from Azure to Postgres without data loss. This will not aim
   at normalizing the data but rather prioritize a safe and easy transition.  In
   other words, the data will be backed by Postgres, but still behaving like
   Azure.
2. Go fully into normalized SQL tables.

Upon completion of step 1, deployers of Taskcluster will need to provide a DB
URL (maybe several) then run a script to "load" data from Azure to Postgres
during a downtime.

There will be a version of Taskcluster that supports Postgres and not Azure,
with the previous version supporting Azure and not Postgres. So upgrading to
that version is something that happens in a downtime.

## Schema Migration

Taskcluster will handle schema migrations and will have
all migrations tested with sample data to ensure we get the expected schema. In
addition, there will be one schema for the whole monorepo, so that schema
updates happen atomically across all services.

## Backups and Restores

Teams operating Taskcluster will rely on the cloud provider's backup system to
handle backups and restores.

## DB Version Upgrades Compatibility

When deploying a new version of Taskcluster, any necessary database upgrades
*must* be applied before any services are upgraded.  Taskcluster will maintain
the invariant that services expecting database version S can interoperate with a
database at version V as long as V >= S.

This invariant is maintained through careful attention to the definitions of the
stored procedures (user-defined functions). These stored procedures are changed
as necessary during the upgrade process, such that a procedure operates
identically before and after the ugprade: identical arguments, identical return
type, and correct behavior.

_Example 1:_ If an upgrade factors a single table into two tables, then a
procedure which previously queried from the single table would be rewritten
during the ugprade to perform a join over the two new tables, returning
appropriate results in the same format as before the upgrade.

_Example 2:_ If you have a query that returns column foo, but in the next
version your code wants to know the value of column bar as well, then a new
stored procedure will need to be introduced to return both columns and stop
using the existing stored procedure that returned the single column. That new
stored procedure is then deployed before the code that uses it is deployed.

A consequence of this design is that "procedures are forever" -- an upgrade can
never delete a stored procedure. At worst, when a feature is removed, a stored
procedure can be rewritten to return an empty result or perform no action.

## Ad-hoc Queries

Direct SQL access to the database is *not allowed*. Taskcluster will allow
ad-hoc queries on the data-set via stored procedures with access controlled by
Postgres permissions. This feature will most likely be done after step 2 of the
transition.

## Permissions

Taskcluster will manage permissions to tables/schemas and deployers will manage
user accounts. The deployment will have an "admin" postgres user/password
(configured in Kubernetes), and on install/upgrade we'll use the admin user to
create a non-admin user for each service, with appropriate GRANTs for that
service's access. Deployers of Taskcluster will pick the passwords for all the
non-admin users (configured in Kubernetes). It's up to the deployer to create
strong distinct passwords. This will be done as part of the pre-deployment
migration process.

# Implementaion

* Project tracker: https://github.com/taskcluster/taskcluster/projects/3