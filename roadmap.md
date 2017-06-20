# Taskcluster Roadmap

Where are we headed?

Broadly:

 * [Taskcluster-1.0](#taskcluster-10) - a clean, stable base on which to build Mozilla's automation
 * [Taskcluster as a Service](#taskcluster-as-a-service) - strong self-serve support, and enough power and flexibility to support a wide variety of projects now and into the future
 * [In-Tree Images](#in-tree-images) - support for projects to precisely define their execution environment, across operating systems
 * [Gecko Productivity](#gecko-productivity) - improvements within Gecko to improve developer productivity

## Taskcluster 1.0

Like many projects, Taskcluster began as an experiment and quickly grew into an
important piece of Mozilla's infrastructure. The 1.0 effort aims to clean up
some rough edges from that growth process and build a stable platform on which
others can confidently base their automation.

### Gecko Migration

We must finish the Taskcluster migration. Supporting both Buildbot and
Taskcluster within automation is a substantial drag on agility and
productivity, and is costly in its resource consumption.

### Sunsetting Deprecated Features

We have built some features and services which have been superseded by better
implementations. We will work to remove the old offerings to reduce complexity
and cost.

 * taskcluster-scheduler
 * [mozilla-taskcluster](https://github.com/taskcluster/taskcluster-rfcs/issues/42)
 * [gaia-taskcluster](https://github.com/taskcluster/taskcluster-rfcs/issues/44)
 * API methods marked deprecated
   * old `createTask` without priority
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

## Taskcluster As A Service

We want to position Taskcluster as a service which Gecko and related projects
use to perform their build, test, and release work.

 * Improved self-serve, reducing cases where Taskcluster team members must be involved to make a change (especially around roles and scopes)
 * Improved reliability and usability for taskcluster-github
 * Improved operational support, providing a reliable platform for others building production automation

## In-Tree Images

 * In-Tree Images for All Platforms -- expand the support we have for defining Linux environments in-tree to cover OS X and Windows
   * Replace all uses of Generic-Worker with Taskcluster-Worker

## Gecko Productivity

 * Improve the user experience for developers
   * Treeherder integrations, actions, etc.
   * Task and task-group exploration
 * Parameterized in-tree action task definitions
 * Smart optimization of in-tree taskgraphs (avoiding running unnecessary tasks)
 * Better interface for try (better way to specify expected tasks and/or better discovery of required tasks)

# What We Are Not Planning

The itmes below represent tough decisisions to *not* focus the team's energy on
a particular feature, or even to permit designs which would preclude ever
implementing the feature.

 * Strong support for non-Gecko-related or non-Mozilla projects
   * Self-serve support for github projects
   * Quick-start decision task templates (but note that projects can already create their own decision tasks)
   * Substantial new taskcluster-github features
 * "Redeployability" (r14y) meaning that Taskcluster could be successfully deployed and operated outside of the Firefox organization
   * (but note "limited redeployability" above)
 * Accounts - explicit administrative domains with "root" access available in each account (similar to AWS accounts)
