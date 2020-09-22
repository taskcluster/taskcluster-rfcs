# RFC 164 - Worker Machine Image Building Automation
* Comments: [#164](https://github.com/taskcluster/taskcluster-rfcs/pull/164)
* Proposed by: @petemoore

# Summary

This RFC is about automating the rollout of config/worker changes to the
community-tc deployment of taskcluster.

Despite taskcluster being a CI/CD tool itself, the mechanics of applying
changes to the running platform can be onerous. This RFC aims to simplify the
process by enabling changes to be applied by simply merging PRs in the
community-tc-config github repo.

In scope:

  * config changes in community-tc-config repo (roles, clients, secrets, worker
    pool definitions, hooks, ...)
  * rebuilding machine images for workers (AMIs in AWS, machine images in GCP)
  * updating worker pool definitions to use newly built machine images

Out of scope:

  * releasing taskcluster platform
  * deploying updated taskcluster services


## Motivation

There are several gains to be made with this approach:

  1) Manually applying changes to config or manually building worker images is
     error-prone and expensive. Automated rollout is accurate and cheap.
  2) Limiting the authority to build new worker images and update taskcluster config
     to a small set of workers reduces the risk of accidental credential exposure or
     compromise, since fewer humans will have valid credentials to expose.
  3) Automated rollout is significantly quicker and has lower latency than manual
     rollout.
  4) Production configuration should remain in sync with source code, which
     otherwise cannot be guaranteed.

# Details

There are two parts to this RFC: _Config Updates_ (roles, clients, secrets,
worker pool definitions, hooks, ...), and _Worker Image Building_.

## Config Updates

Currently, config changes are applied as follows:

  * A PR is made to community-tc-config repo
  * A taskcluster team member iteratively reviews the PR until it can be merged
    (or rejects it)
  * A taskcluster team member manually runs `tc-admin` on their local machine,
    to apply the changes, sometimes filtering the entities to be applied, if
    the user determines that the current production configuration is out-of-sync
    with the current state in source control, and does not wish to "steam-roller"
    other changes of an unrelated source at the same time.

The new mode-of-operation would be as follows:

  * A PR is made to community-tc-config repo
  * A taskcluster team member iteratively reviews the PR until it can be merged
    (or rejects it)
  * Upon merge into `main` branch, a taskcluster task is triggered via the
    taskcluster-github integration (configured via a `.taskcluster.yml` in the
    repository root) that runs a script-worker task on a special worker pool
    `proj-taskcluster/tc-config`.
  * The `proj-taskcluster/tc-config` workers are locked-down script-worker workers
    that accept a payload that take a git commit SHA only. The script that
    script-worker runs:

      1) checks out this git commit of the community-tc-config repo
      2) checks that the commit is on the main branch
	  3) runs `tc-admin apply` against this commit, applying all changes,
         without filtering out any entities (no `--grep` option).

## Worker Image Building

See [bug 1395699](https://bugzil.la/1395699) for the original discussion of
this topic.

* We create a worker type called `proj-taskcluster/worker-image-builder`, which we
  deploy in ec2.
* Only github.com/mozilla/community-tc-config:main has the required scopes to
  create tasks for this worker type
* (Optional) we add a policy to taskcluster-auth that enforces that the
  following scopes:

    * `queue:create-task:highest:proj-taskcluster/worker-image-builder`
    * `queue:create-task:very-high:proj-taskcluster/worker-image-builder`
    * `queue:create-task:high:proj-taskcluster/worker-image-builder`
    * `queue:create-task:medium:proj-taskcluster/worker-image-builder`
    * `queue:create-task:low:proj-taskcluster/worker-image-builder`
    * `queue:create-task:very-low:proj-taskcluster/worker-image-builder`
    * `queue:create-task:lowest:proj-taskcluster/worker-image-builder`
    * `queue:create-task:normal:proj-taskcluster/worker-image-builder`

  can only be present in the expanded scopes of the following roles and clients:

    * role `repo:github.com/mozilla/community-tc-config:branch:main`
    * client `static/taskcluster/github`

  Note, client `static/taskcluster/queue` shouldn't require such scopes, unless
  we are forced to create the `proj-taskcluster.worker-image-builder` tasks from
  a decision task. The author is currently unaware of a reason this would be
  required.
* The worker type is *manually* secured with a chain of trust ed25519 key by a
  trusted employee
* Access to image building workers is restricted to only a small whitelist of
  trusted employees
* The public chain of trust key for the worker image builder is published to
  one or more public places
* The community-tc-config `.taskcluster.yml` file will trigger a unique task
  for each image set in the `imagesets` directory of the community-tc-config
  repo, for any __PR merge commits__ that land on the `main` branch of the repo.
  This task may be a noop (see later).
* The script which the worker-image-builder script-worker worker runs:
  * Accepts a payload that only contains an image set name, and the git commit
    SHA of a commit on the `main` branch.
  * Executes a script which is hard-wired into the worker, which determines
    whether the commit is a valid commit on the main branch, that is newer than
    the commit from which the latest version of the image set was built from, and
    whether, there are any possible changes to the image set build since the most
    recent build for that image set. For this, a reliable mechanism will be
    needed that determines which commit of community-tc-config a given imageset
    is built from. Perhaps this mapping from community-tc-config git commit SHA
    to imageset names is persisted in community-tc-config repo directly.
  * If there are changes to any files which are used to produce the image set
    images, a new image set will be built. This includes all files inside the
    imageset directory, plus the imageset building program(s) and related files.
  * New CoT keys will be generated on the image set.
  * Once built, a staging worker pool is dynamically created that uses the
    new image set, and the hook `project-taskcluster/test-<imageset>` is fired to
    test the new image set.
  * If this hook does not exist, or the hook runs but fails, _all commits_ from
	the PR are backed out and a github issue is raised which links to the
    failed hook, and provides this as a justification for the backout as an issue
    comment.
  * If all image set test hooks are successful:
	* the production image sets will be updated to refer to the new machine
	  images in `/config/imagesets.yml`, and the changes will be committed and
      pushed to the main branch directly.
    * old images, snapshots, and other outdated cloud objects will be purged
	* The CoT public keys will be published as a task artifact (which is signed
	  by chain-of-trust using the worker image builder private key)
	* The public key(s) of the image sets will be published to a public place
	  (e.g. the existing CoT key repo) using credentials manually burned into
      the worker-image-builder worker

## Security considerations

In order to access the "most trusted" private key, which is the
worker-image-builder CoT private key, an attacker would need to gain shell
access to the machine, which is secured both physically, and virtually behind a
VPN, firewall, ssh controls, etc.

If taskcluster was compromised, there would still be no way from having
taskcluster credentials to get read or write access to the worker-image-builder
private key. Since this key is used to secure all other worker type keys, it is
therefore not possible to compromise the chain-of-trust checks through a
taskcluster compromise.

We could enforce something like a 30 day lifetime for the worker-image-builder
CoT key, in order to ensure it is frequently rotated.

One other important feature required (kudos to @grenade for highlighting this)
is that rotating a key should not necessitate a tree closure during AMI roll
out. I would propose this the same way we solved this for livelog secrets - we
permit a period of time whereby two different private keys are valid. We would,
therefore, enable a second key, roll out changes, then retract original key.
This may require changes to the chain-of-trust validation process, but should
ensure no downtime during AMI roll out.


# Implementation

<Once the RFC is decided, these links will provide readers a way to track the
implementation through to completion, and to know if they are running a new
enough version to take advantage of this change.  It's fine to update this
section using short PRs or pushing directly to master after the RFC is
decided>

* <link to tracker bug, issue, etc.>
* <...>
* Implemented in Taskcluster version ...
