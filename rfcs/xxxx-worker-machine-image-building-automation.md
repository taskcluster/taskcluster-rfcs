# RFC <number> - Worker Machine Image Building Automation
* Comments: [#<number>](https://github.com/taskcluster/taskcluster-rfcs/pull/<number>)
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
    that accept a payload that take a git commit only. The script that
    script-worker runs:

      1) checks out this git commit of the community-tc-config repo
      2) checks that the commit is on the main branch
	  3) runs `tc-admin apply` against this commit, applying all changes,
         without filtering out any entities.

## Worker Image Building

See [bug 1395699](https://bugzil.la/1395699) for the original discussion of
this topic.

* We create a worker type called `proj-taskcluster/ami-builder`, which we
  deploy in ec2.
* Only github.com/mozilla/community-tc-config:main has the required scopes to
  create tasks for this worker type
* We add a policy to taskcluster-auth that restricts which clients/roles have
  the required scopes to create a task for `ami-builder`. Perhaps this should
  be a separate RFC, since we don't have a means to enforce policies in
  taskcluster-auth at the moment.
* This worker type runs script-worker, and accepts a payload that only contains
  a provisioner ID and worker type name and executes a script which is
  hard-wired into the worker, passing it the worker type name, and git commit of
  community-tc-config to build from
* The worker type is *manually* secured with a chain of trust gpg key by a
  trusted employee
* Access to ami-builder workers is restricted to only a small whitelist of
  trusted employees
* The public chain of trust key of ami-builder is published to one or more
  public places
* The script which the worker runs:
  * generates the AMIs (EC2) and/or the machine image (GCP)
  * cleans up old images, snapshots, and other outdated cloud objects
  * generates a private CoT key on the AMI
  * publishes the public key as an artifact of the task (which is signed by
    chain-of-trust using the ami-builder private key)
  * publishes the new public key of the given worker type to a public place
    (e.g. the existing CoT key repo) using credentials manually burned into the
    ami-builder worker (not accessible from the task)

The idea of the above is that we reduce the problem of needing to manually
handle every AMI change with human intervention, to only needing human
intervention for rotating the `ami-builder` private key or credentials for
publishing public keys. Updates to the ami-builder process should be much less
frequent than the business-as-usual task of updating worker AMIs for other
worker types. By isolating the manual work to the ami-builder key, you in
effect secure all other keys with this single key, which you protect with
maximum security. It doesn't matter that the process to update this key is
heavily manual and involved, since it will happen much less frequently. You
then are trusting your entire system with a much more guarded process, rather
than guarding it with a process which happens frequently, and could include
human error (e.g. if a PR is merged that shouldn't have been).

In order to access the "most trusted" private key, which is the ami-builder CoT
private key, an attacker would need to gain shell access to the machine, which
is secured both physically, and virtually behind a VPN, firewall, ssh controls,
etc.

If taskcluster was compromised, there would still be no way from having
taskcluster credentials to get read or write access to the ami-builder private
key. Since this key is used to secure all other worker type keys, it is
therefore not possible to compromise the chain-of-trust checks through a
taskcluster compromise.

The reason I favour this approach over introducing pull requests for every AMI
change, is that it is a non-trivial task for a human to validate the content of
the PR. If an attacker manages to submit a pull request with a different public
key, it is not possible for a manual PR approver to infer this. A cleverly
timed PR that substituted an expected PR (that was intercepted/cancelled etc)
could therefore be approved by a user that had no way to validate the content
of the change. This is even more of a problem, the more frequently changes
occur.

We could enforce something like a 30 day lifetime for the ami-builder CoT key,
in order to ensure it is frequently rotated.

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
