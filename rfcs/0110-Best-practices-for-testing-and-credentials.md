# RFC 110 - Best Practices for testing and Credentials
* Comments: [#110](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/110)
* Proposed by: @djmitche

# Summary

Taskcluster repositories should pass their tests "out of the box": `git clone`, `yarn install --frozen-lockfile`, and `yarn test` should result in a successful test run.

This is simple for test suites that do not require credentials [1].
Otherwise, we must find a way to give useful test results when no credentials are available, while ensuring that all tests get run before code goes into production.

Briefly, this proposal suggests a uniform approach to skipping tests that require external services by default, but ensuring that all of those tests run in CI wherever possible.
To minimze the loss of test coverage from skipped tests, it suggests use of mocks for external services and running tests against both mocks and actual services, when possible.

<sub>[1] or otherwise access external services; such services generally require credentials.</sub>

*NOTE*: this RFC only applies to JavaScript libraries and services.

## Motivation

The testing situation for the Taskcluster services and libraries varies widely from repo to repo, so it is difficult to know what to expect when developing a pull request.
for some repositories, `yarn test` does not work out of the box, leading to confusion and friction for contributors.
For others, we have had misconfigurations that fail to run all tests on pull requests or pushes to master, allowing deployment of code to production with failing tests.

The goals of this proposal, then, are:

* A consistent approach to testing across Taskcluster repositories, with a common set of supporting tools
* Repositories that are approachable for new contributors
* Confidence that production code has passed *all* tests

# Details

The bulk of this proposal is to document new best practices, as described below.
The final best-practices documents would be developed in concert with utilities to support them (in `taskcluster-lib-testing`, for example), and follow the usual review process.

Once those best practices and libraries are done, the work that would remain is to upgrade all services and libraries to follow them, and to develop new mocks for the remaining un-mocked external services.

## Best Practices (outline)

### Installation

Services with a lockfile should suggest that contributors run `yarn install --frozen-lockfile`, while libraries should use `yarn`; after that, run `yarn test`.

### Credential Management

Tests should be capable of fetching credentials needed to access external services either from an on-disk file (for local development) or the Taskcluster-Secrets service vi Taskcluster-Proxy (for use in CI).
It should be easy to tell if a specific kind of credential (for example, pulse or AWS) is available.

#### Getting Credentials

Team members and dedicated contributors will want to know how to set up a full set of credentials for themselves.
Include a section in the README describing how to find or generate credentials for each service.

For Taskcluster credentials, include the necessary credentials in a role named `project:taskcluster:tests:<projectName>` (e.g., `project:taskcluster:tests:taskcluster-queue`).
Then instruct users to run `eval $(taskcluster-cli signin --scopes assume:project:taskcluster:tests:$PROJECT)` to get the scopes to run the tests, noting that they must themselves have the given role or this won't work.

#### Hard Dependencies

Some services and libraries depend completely on external services.
For example, azure libraries naturally require an Azure account to test against; and pulse libraries will naturally require an AMQP server.
Similarly, services with database backends cannot be realistically tested without access to a database server.

In such cases, it is OK for the tests to refuse to run at all without configuration for the external services.
Instead, `yarn test` should fail immediately with a clear message suggesting how to set up access.
In some cases, this can be accomplished with a `docker` command (e.g., to run RabbitMQ or Postgres); others might require a free-tier account at a hosted service.

The rest of this document does not apply to such cases.

### Test Organization

Test cases that require access to an external service should also be able to run against a mock version of that external service, and should be written such that each test case runs twice, once in each condition.
When the service credentials are not available, the "real" conditions should be skipped.
The mock condition test cases should always run.
If `NO_TEST_SKIP` is set and necessary service credentials are not available, the tests should fail.
All of this will be supported by utilities in `taskcluster-lib-testing`.

Some external dependencies are too expensive or complex to test against.
For example, the AWS EC2 APIs are difficult to use in testing, and problems with tests could easily become very expensive.
In such cases, it's OK to only test against mocks.

In the default configuration, where possible, tests should output only the pass/fail status of each test case (Mocha's default output).
Any additional diagnostic output should be handled with debug logging or otherwise disabled by default.

### CI Configuration

Tests should run in Taskcluster (via Taskcluster-Github) against both pull requests and pushes to the master branch.

The master branch should be configured with access to a full complement of credentials, so that it can run all tests.
Depending on the sensitivity of the credentials, pull requests may have access to none, some, or all of the credentials.
For example, Taskcluster credentials granting access only to create tasks in a testing workerType, with no attached workers, are safe to expose to pull requests; AWS credentials are not.

The Taskcluster-Github configuration should set `NO_TEST_SKIP=1` on the master branch and, if credentials are available, for pull requests.
This will prevent tests from being silently skipped on master due to a misconfiguration.

*NOTE*: even with better testing, green tests are never enough to guarantee a successful production deploy.
No amount of automation can substitute for careful thought and manual pre- and post-deployment verification.

# Open Questions

# Implementation

* [[RFC 0110] Implement testing best-practices](https://bugzilla.mozilla.org/show_bug.cgi?id=1446966)
