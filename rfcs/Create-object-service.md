# RFC 155 - Create an object service
* Updates: [RFC 120](https://github.com/taskcluster/taskcluster-rfcs/blob/master/rfcs/0120-artifact-service.md)
* Obsoletes: None
* Comments: [#116](https://github.com/taskcluster/taskcluster-rfcs/pull/116), [#120](https://github.com/taskcluster/taskcluster-rfcs/pull/120)
* Initially Proposed by: @jhford

# Summary
Taskcluster tasks often produce artifacts during the course of being run.
Examples include browser distribution archives, json metadata and log files.
We currently store artifacts in a single region of S3, and the service we use for that is the Queue.  

This project is to design an object management api which pulls that functionality 
out of the Queue and enables support of multiple clouds.

This RFC is to decide on what the objects service is and its interface, not
implementation details.

# Motivation

* We want to pay less, so we want to be able to store things in different regions and clouds, particularly:
  * We want to be able to switch from AWS to any other cloud provider with ease
  * We want to be able to manage ingress traffic from other cloud providers
  * We want to be able to temporarily cache artifacts in a given provider where they might be needed repeatedly (e.g. builds for testing)
* We want the Queue to be easier to understand, develop and maintain
* We want better object handling (including security, integrity and de-duplication) without
increasing complexity of the Queue codebase
* We want object management to be easier to understand, develop and maintain

# Details

This is to be implemented as a separate service which is to be included into Taskcluster monorepo.
At the time of writing, this is imagined as a 2-component mini-system: the service itself, which exposes the API,
and a CLI tool that users can install and use locally.

The service is to be implemented in such a way that it could be as easily as possible switched from Azure to Postgres.
The relational database for the service should be designed as well (in the form of an entity relationship diagram as part
of the documentation, if Postgres support will not be deployed by the time of the prototype development).

The service should be compatible with the current implementation (the object storage code in the Queue service), 
and require as little changes to the clients and workers as possible (preferably, none at all).

The service should be compatible with the Chain of Trust. At the time of writing, a new plan for ensuring artifact 
integrity is being developed. The service and the CLI tool should take the plan into account and be compatible with it.
The service should allow for flexibility in choosing artifact/object encryption methods and algorithms.

Implementation of any cross-region and/or cross-cloud functionality must be justified as far as money and time cost goes.
The service must be efficient as far the storage and network costs go, without sacrificing the time it takes to complete operations.
The former should be prioritized by default, unless the latter is impacted in such a way that any economy looses value.

## API

[See Swagger draft documentation](https://app.swaggerhub.com/apis/taskcluster/object-service/0.1.0)

# Implementation

The project will mainly be tracked [here](https://github.com/taskcluster/taskcluster/projects/5)