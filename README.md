# TaskCluster RFCs


## Background

**What**: Ideas and projects of the Taskcluster Team, in one discoverable place.

**Why**: This repo serves as a place to coordinate design and architecture, so that everyone can participate and past discussions are accessible to everyone.

**How** Proposed RFCs go into [pull requests](https://github.com/taskcluster/taskcluster-rfcs/pulls), and [the repo](rfcs/) holds RFCs on which we have reached consensus.
See [mechanics](mechanics.md) for more detail.

## RFCs

<!-- GENERATED -->
| RFC     | Title                                                                                                                                                                                  |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RFC#7   | [New Artifact API](rfcs/0007-New-Artifact-API.md)                                                                                                                                      |
| RFC#8   | [JSON-e](rfcs/0008-JSON-e.md)                                                                                                                                                          |
| RFC#9   | [Switch to Auth0 for authentication, stop providing authentication to other services](rfcs/0009-Switch-to-Auth0-for-authentication-stop-providing-authentication-to-other-services.md) |
| RFC#11  | [Support QEMU in taskcluster-worker](rfcs/0011-Support-QEMU-in-taskcluster-worker.md)                                                                                                  |
| RFC#20  | [Manage pulse credentials centrally](rfcs/0020-Manage-pulse-credentials-centrally.md)                                                                                                  |
| RFC#21  | [taskcluster-livelog-proxy in production](rfcs/0021-taskcluster-livelog-proxy-in-production.md)                                                                                        |
| RFC#24  | [Decouple components from routing mechanisms](rfcs/0024-Decouple-components-from-routing-mechanisms.md)                                                                                |
| RFC#27  | [Migrate unified-logviewer to a standalone React component](rfcs/0027-Migrate-unified-logviewer-to-a-standalone-React-component.md)                                                    |
| RFC#34  | [Audit logging](rfcs/0034-Audit-logging.md)                                                                                                                                            |
| RFC#35  | [Structured Logging](rfcs/0035-structured-logging.md)                                                                                                                                  |
| RFC#43  | [Get rid of tc-vcs completely](rfcs/0043-Get-rid-of-tc-vcs-completely.md)                                                                                                              |
| RFC#44  | [Get rid of gaia-taskcluster](rfcs/0044-Get-rid-of-gaia-taskcluster.md)                                                                                                                |
| RFC#48  | [Parameterized Roles](rfcs/0048-Parameterized-Roles.md)                                                                                                                                |
| RFC#53  | [Use a git repository for retrospectives](rfcs/0053-Use-a-git-repository-for-retrospectives.md)                                                                                        |
| RFC#57  | [Refresh the manual as a readable .. well, manual for taskcluster](rfcs/0057-Refresh-the-manual-as-a-readable-well-manual-for-taskcluster.md)                                          |
| RFC#58  | [Add more `task.priority` levels](rfcs/0058-Add-more-task-priority-levels.md)                                                                                                          |
| RFC#65  | [Migrate queue to postgres](rfcs/0065-Migrate-queue-to-postgres.md)                                                                                                                    |
| RFC#66  | [Allow hooks to be triggered by pulse messages](rfcs/0066-Allow-hooks-to-be-triggered-by-pulse-messages.md)                                                                            |
| RFC#74  | [Worker, workerType, and provisioner explorer UI](rfcs/0074-Worker-workerType-and-provisioner-explorer-UI.md)                                                                          |
| RFC#75  | [Miscellaneous Workers](rfcs/0075-Miscellaneous-Workers.md)                                                                                                                            |
| RFC#76  | [Turn off the scheduler service](rfcs/0076-Turn-off-the-scheduler-service.md)                                                                                                          |
| RFC#80  | [store RFCs in files in the repository, discuss RFC through a PR](rfcs/0080-store-RFCs-in-files-in-the-repository-discuss-RFC-through-a-PR.md)                                         |
| RFC#82  | [Users should be able to administer workers across provisioner boundaries](rfcs/0082-Users-should-be-able-to-administer-workers-across-provisioner-boundaries.md)                      |
| RFC#86  | [Stage 2: provisioner, workerType, and worker metadata endpoints](rfcs/0086-Stage-2-provisioner-workerType-and-worker-metadata-endpoints.md)                                           |
| RFC#87  | [Actively manage AWS resources](rfcs/0087-Actively-manage-AWS-resources.md)                                                                                                            |
| RFC#90  | [Disabling/enabling a worker](rfcs/0090-Disabling-enabling-a-worker.md)                                                                                                                |
| RFC#91  | [Store infra configuration in a distinct repo that does not ride trains](rfcs/0091-Store-infra-configuration-in-a-distinct-repo-that-does-not-ride-trains.md)                          |
| RFC#97  | [Provisioner, worker-type & worker actions](rfcs/0097-Provisioner-worker-type-worker-actions.md)                                                                                       |
| RFC#110 | [Best Practices for testing and Credentials](rfcs/0110-Best-practices-for-testing-and-credentials.md)                                                                                  |
| RFC#120 | [object Service](rfcs/0120-artifact-service.md)                                                                                                                                        |
| RFC#124 | [Worker Manager](rfcs/0124-worker-manager.md)                                                                                                                                          |
| RFC#128 | [Service metadata in redeployable taskcluster](rfcs/0128-redeployable-clients.md)                                                                                                      |
| RFC#131 | [Implementing Checks API](rfcs/0131-Implementing-Checks-API-in-tc-github-while-preserving-Statuses-API.md)                                                                             |
| RFC#135 | [Clients and Environment Variables](rfcs/0135-client-env-vars.md)                                                                                                                      |
| RFC#136 | [Scope Expression Registration](rfcs/0136-scope-expression-registration.md)                                                                                                            |
| RFC#139 | [Increase identifier length from 20 to 38](rfcs/0139-longer-identifiers.md)                                                                                                            |
| RFC#145 | [Worker Pools and Task Queues](rfcs/0145-workerpoolid-taskqueueid.md)                                                                                                                  |
| RFC#147 | [Third-Party Login](rfcs/0147-third-party-login.md)                                                                                                                                    |
| RFC#148 | [TASKCLUSTER_WORKER_LOCATION](rfcs/0148-taskcluster-worker-location.md)                                                                                                                |
| RFC#153 | [remove the email validation for metadata.owner](rfcs/0153-remove-email-validation-for-metadata-owner.md)                                                                              |
| RFC#154 | [Migrate Taskcluster to postgres](rfcs/0154-Migrate-taskcluster-to-postgres.md)                                                                                                        |
| RFC#155 | [Create an object service](rfcs/Create-object-service.md)                                                                                                                              |
| RFC#158 | [Artifact metadata](rfcs/0158-artifact-metadata.md)                                                                                                                                    |
| RFC#163 | [ProjectId](rfcs/0163-project-id.md)                                                                                                                                                   |
| RFC#165 | [Anonymous scopes](rfcs/0165-Anonymous-scopes.md)                                                                                                                                      |
| RFC#166 | [Sign Public S3 URLs](rfcs/0166-Sign-public-S3-urls.md)                                                                                                                                |
| RFC#168 | [Process Github issue_comment events to support adhoc task creation](rfcs/0168-Trigger-Tests-Based-on-PR-Comments.md)                                                                  |
| RFC#169 | [Easy Taskcluster Setup](rfcs/0169-Easy-Taskcluster-setup.md)                                                                                                                          |
| RFC#175 | [Restricted Roles for Github Pull Requests](rfcs/0175-restricted-pull-requests.md)                                                                                                     |
| RFC#177 | [Skip CI in github integration](rfcs/0177-Skip-ci-integrations.md)                                                                                                                     |
| RFC#180 | [Github cancel previous tasks](rfcs/0180-Github-cancel-previous-tasks.md)                                                                                                              |
| RFC#182 | [Allow remote references to .taskcluster.yml files processed by Taskcluster-GitHub](rfcs/0182-taskcluster-yml-remote-references.md)                                                    |
