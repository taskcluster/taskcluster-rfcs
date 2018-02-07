# RFC 91 - Store infra configuration in a distinct repo that does not ride trains
* Comments: [#91](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/91)
* Initially Proposed by: @djmitche


## Motivation

We have a handful of things that we often change, and that change globally, not in a ride-the-trains fashion:

 * worker-type names
 * server fingerprints (e.g., the hg server)
 * AMI IDs (like AMI sets -- and maybe we don't use this repo, depending on @walac's deployment process)
 * VPC configuration (subnetIds per region, security groups by name per region, etc.)
 * project configuration (does it do nightlies, do we listen for pushes, etc.)
 * resource URLs (tooltool, pypi, etc.)
 * worker implementations (is workerType X a docker-worker or tc-worker/docker-engine?)
 * allocations between worker types for transitions (like the buildbot-to-TC transition of the mac minis)
 * scopes accorded to each scm level [added 10/3]

I think we can store all of this in a repo for which everything -- inbound, central, beta, release, esr -- just looks at the latest commit for the current state.  This would allow us to land changes that take effect immediately across projects, without having to uplift them.

## Details

*Repo Name*: https://hg.mozilla.org/build/ci-configuration
*Repo Permissions*: initially `scm_level_3`, but we could lock this down further to releng/relops/tc. We will require review like most repos, but not the merge-to-production of the puppetagain repo.

### File structure

No subdirectories - everything is in the top level.  The temptation to make a subdirectory and have dynamically named files (like one file per project) should indicate this isn't the right place for that config.

Data is divided into files of mostly-unrelated information -- VPC config over here, project config over there -- each in a `.yml` file.  The file should begin with a nice big comment explaining what it means and how it's interpreted.

### In-tree Usage

Tasks that need this data (mostly decision/action/cron, but maybe some other things too) will use to check out this repository to a predictable location.  We'll define some commonly-available function to open, parse, and return a file -- something like `get_ci_configuration("worker-types")`.

[edit 9/29] Other out-of-tree tools, such as hooks that might need one piece of data quickly, might instead pull a raw file from the repo (similar to what we do with `.taskcluster.yml` now).

### Lifetime Management

[edit 9/29] Stuff in this repo will need to live until no branch still refers to it -- including ESR.  So, files should live "forever", although they can be commented to indicate "not used after Firefox 92" or something like that to help with later spring cleaning.

### Change Log

[new 9/29] Commits to this repository can be reflected in https://wiki.mozilla.org/ReleaseEngineering/Maintenance to indicate the timeline of infrastructure changes.

### Getting Started

[new 9/29] We'll start by moving project configuration into this repo, then begin to migrate other data as time allows and needs dictate.

## Not Covered

There's [work afoot](https://bugzilla.mozilla.org/show_bug.cgi?id=1381870) to move a bunch of Taskcluster configuration (scopes, roles, hooks, etc.) to be defined and managed in-tree.  As automation, that stuff belongs in-tree, although it may pull some data from this repository (such as the list of projects).