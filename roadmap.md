# Taskcluster Roadmap

The next leg of our journey is to what we are calling "Taskcluster 1.0",
meaning a service that is complete and ready for use.

## Taskcluster 1.0

Like many projects, Taskcluster began as an experiment and quickly grew into an
important piece of Mozilla's infrastructure. The 1.0 effort aims to clean up
some leftovers from that growth process and fully realize some of the benefits
of Taskcluster's approach.

### Gecko

While taskcluster is designed as a general tool, its primary customer is Gecko.

 * Taskcluster Migration -- migrating from Buildbot to Taskcluster
 * Improve the user experience for developers
   * Treeherder integrations, actions, etc.
   * Task and task-group exploration
 * In-Tree Images for All Platforms -- expand the support we have for defining Linux environments in-tree to cover OS X and Windows
   * Replace all uses of Generic-Worker with Taskcluster-Worker
 * Smart optimization of in-tree taskgraphs (avoiding running unnecessary tasks)
 * Better interface for try (better way to specify expected tasks and/or better discovery of required tasks)

### Sunsetting Deprecated Features

We have built some features and services which have been superseded by better
implementations. We will work to remove the old offerings to reduce complexity
and cost.

 * taskcluster-scheduler
 * [mozilla-taskcluster](https://github.com/taskcluster/taskcluster-rfcs/issues/42)
 * [gaia-taskcluster](https://github.com/taskcluster/taskcluster-rfcs/issues/44)
 * old `createTask` without priority
 * API methods marked deprecated
 * [taskcluster-vcs](https://github.com/taskcluster/taskcluster-rfcs/issues/43)
 * InfluxDB
 * Docker images on quay.io and docker cloud
 * Docker-worker in favor of Taskcluster-Worker's Docker Engine

### Breaking Changes

While making breaking changes is always painful, it will be less painful now
than later, so we will prioritize making such changes sooner rather than later.
Of course, these will be made carefully with a migration plan in place!

 * [New index model](https://github.com/taskcluster/taskcluster-rfcs/issues/30)
 * [New artifact API](https://github.com/taskcluster/taskcluster-rfcs/issues/7)
 * [Limited redeployability](https://github.com/taskcluster/taskcluster-rfcs/issues/13) ("limited' meaning that it's suitable for creating development and staging environments, but does not support more than one active production environment)

### Taskcluster As A Service (TCaaS)

We want to position Taskcluster as a service which Gecko and related projects
use to perform their build, test, and release work.

 * Improved self-serve, reducing cases where Taskcluster team members must be involved to make a change (especially around roles and scopes)
 * Improved reliability and usability for taskcluster-github

## What We Are Not Planning

The itmes below represent tough decisisions to *not* focus the team's energy on
a particulra feature, or even to permit designs which would preclude ever
impelmenting the feature.

 * Strong support for non-Gecko-related or non-Mozilla projects
   * Self-serve support for github projects
   * Quick-start decision task templates (but note that projects can already create their own decision tasks)
   * Substantial new taskcluster-github features
 * "Redeployability" (r14y) meaning that Taskcluster could be successfully deployed and operated outside of the Firefox organization
   * (but note "limited redeployability" above)
 * Accounts - explicit administrative domains with "root" access available in each account (similar to AWS accounts)
