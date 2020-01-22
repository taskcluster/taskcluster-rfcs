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

Object data should not pass through the service (meaning in Kubernetes) for upload or download. It's fine for data to flow through other servers that are located closer to workers (for example to mirror data).

## API

### Creation
Consists of multiple stages:
1. `POST /object/:name` - object service creates a URL and/or a request and returns it. 
All necessary information (such as the origin of the request - like cloud, region, etc.) will get passed in the body of the request.
2. `PUT ...` - makes the request obtained at the step 1, or uses the URL obtained at the step 1. This sends in the data to the cloud provider.
This request is made to a cloud provider, using the cloud provider's API, so the data itself goes from the caller directly to the service provider.

### Retrieval
`GET /object/:name`
I think we can protect the retrieval of private objects by scopes, whereas public ones won’t be protected.

### Updating
No such endpoint. We don't want the objects to be updatable for security reasons.

###Deletion
`DELETE /object/:name`
The initial idea was not to have this endpoint. However, without it the destructive action will be difficult to do and will take more time. 
If our goal is to save money, maybe this action should be easier and faster to do.

# Implementation

The project will mainly be tracked [here](https://github.com/taskcluster/taskcluster/projects/5)