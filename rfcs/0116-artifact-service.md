# RFC 116 Artifact Service
* Comments: [#116](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/116)
* Proposed by: @jhford

# Summary

Taskcluster tasks often produce Artifacts during the course of being run.
Examples include browser archives, json metadata and log files.  We currently
store Artifacts in a single region of S3 and split management of Artifacts
between the Queue and Cloud Mirror.  This project is to take Artifact handling
out of the Queue and into its own service that takes over the responsibilities
for cross-region and cross-cloud replication.

The Artifact service should not be directly exposed to end users as a Rest API.
It will instead be a generalised API that the Queue uses to facilitate artifact
creation from tasks.  In other words, the Queue gates operations to the
Artifact service.  The service will be exposed to endusers by means of a `Location`
header value on a `300` series redirect.

The Queue will now store only the name of Artifacts and would treat the name of
an Artifact as an opaque identifier and defer all management of the actual
bytes to this system.  The Queue would also stop doing IP to Object store
mappings.

This RFC is to decide on what the Artifacts service is and its interface, not
implementation details

## Motivation

* We want the Queue to be easier to understand, develop and maintain
* We want Artifacts to be easier to understand, develop and maintain
* We want better Artifact handling without increasing complexity of the Queue
  codebase
* We want to have more clear responsibilities for our services
* We want to consolidate the handling of Artifacts into a single service
* We want to build generalised software when possible as participants of a free
  software community

# Details

* Auth might not be done with scopes and tc-auth, but a shared secret between
  Queue and Artifacts
* The Queue will block new artifacts after task resolution by not issuing new
  signed urls
* Data storage in Artifacts will be done with Postgres and not Azure Table
  Storage
* We do not intend to have an operation to list artifacts in the API
* The redirecting logic of the Artifact service will adhere to the HTTP spec
  using 300-series redirects where possible
* Where content-negotiation is impossible, the service will block creation of
  artifacts when incoming requests aren't compatible with required response
* We will support uploading artifacts to different regions so that we can
  minimize interregion transfer costs for initial object creation

## API
This API is up for debate and is only an illustrative starting point.  

### Generalised request format
There will be a concept of a generalised HTTP request.  These requests are used
to transmit metadata of an HTTP request which the artifact service requires the
client to perform.

An example usage of this format is uploading a file.  The creation endpoint of
this service will generate all of the HTTP request metadata that the uploading
worker will use to upload file.  Then the worker will match these HTTP requests
with payload bodies and run each of these requests.

The motivation for this type of flow is to support the case where the uploader
is running in a different region than this service is.  If we required all
uploads to gate through this service, we'd need to duplicate uploading effort
and perform unneeded interregion transfers.  By transmitting a list of requests
which allow the uploading to happen, we can instruct the uploader to upload
directly to the existing S3 infrastructure, but perform all signing within this
service.

A generalised request will look like:

```javascript
{
  method: 'GET',
  url: 'https://www.example.com',
  headers: {
    'user-agent': 'taskcluster',
  }
}
```

* The body will not be included, but can be described through HTTP headers in the request
* Duplicated HTTP headers will be unsupported (i.e. key -> string not key -> list of strings)
* All query string, path, fragements are contained in a fully formed `url` property

### Origins

Where present, the `origin` rest parameter in this service for will be either
an IPv4 address, IPv6 address, or an identifier.  This parameter will specify
the source location of the ultimately originating request.  This means the
origin of the request to the Queue from the worker and not the request to the
artifact service.  If the origin is an IPv4 or IPv6, a mapping of the address
and IP will occur to find the backing storage.  If the origin is not an IPv4 or
IPv6 address and is identical to a set of known and mappable identifiers (e.g.
`s3_us-west-2`), then that will be used to map the token to find the backing
storage.

### Creation

```
PUT /artifacts/:name
PATCH /artifacts/:name
```

The `PUT` endpoint will take an origin and name.  It will return a `200` with a
document which contains a list of generalised requests which could be run to
complete the actual upload.  Please see the queue's current `blob` storage type
for an example of this pattern.  The body of the request will contain metadata
about the artifact in the shape:

```javascript
{
  origin: '10.10.10.10' || 's3_us-west-2',
  contentType: 'application/json',
  contentLength: 1234,
  contentSha256: 'abcdef1234',
  transferLength: 1234,
  transferSha256: 'abcdef1234',
  contentEncdoing: 
  expiration: new Date(),
}
```

This endpoint will return a list of HTTP requests which must all be run.

The `PATCH` endpoint will be sent without a request body and will be used to
perform any post-upload actions.  These include things like the commit step on
an S3 multipart upload.  This endpoint would be run by the Queue and not by the
uploader, and the Queue would also need a complimentary method for workers to
call when they complete the upload.  This is what is currently done with the
`blob` storage type in the queue.

### Deletetion

```
DELETE /artifacts/:name
DELETE /caches/artifacts/:name
```

This service has at least one copy of each stored file.  Any copies above 

Delete all copies of the named Artifact if using first endpoint.  The second
endpoint would attempt delete all of the cached copies in the various
locations.  This cache purging must return a `202 Accepted` response and not
`200/204` due to the nature of how caches work in the real world.

### Retreival

```
GET /artifacts/:name[?max_time=30]
```

This endpoint returns a 302 redirect to the location of the Artifact which is
closest to the request's IP address.  If needed, this will initiate a copy from
the original backing store into a different storage location.  It will wait up
to a configurable amount of time before redirecting to a non-optimal copy.

In order to support running in environments where requests are limted in time,
the `max_time` query string option will specify roughly how many seconds the
client is willing to wait for an artifact.  The default value should be based
on the size of the artifact.  For example, it will wait 2s for each 100MB of
artifact size.  While waiting, the service will issue intermediate redirects to
itself to reduce the waiting time.

Example inside heroku:
```
10:00:00 <-- GET /artifacts/my_file?max_time=90
10:00:25 --> 302 /artifacts/my_file?max_time=65
10:00:25 <-- GET /artifacts/my_file?max_time=65
10:00:50 --> 302 /artifacts/my_file?max_time=40
10:00:50 <-- GET /artifacts/my_file?max_time=40
10:00:55 --> 302 http://us-west-2.s3.amazonaws/artifacts/my_file
```

# Open Questions

* Will we move old artifacts over? **No**
* Will we move deprecated artifact types (s3, azure) over? **No**
* How will we support data centers where we have no native object store:
  * We will support pull-through caches the same way we support CDNs by redirecting
    urls.  These might be signed urls, as required by each underlying storage system
  * We will look into Ceph or similar systems
* What auth scheme will we use between Queue and Artifacts? **Maybe JWT**
* Will we use Content Addressable storage?
  * We like this idea, but we're going to do thinking about it later on since it's not
    required that we tackle this upfront

# Implementation

<once the RFC is decided, these links will provide readers a way to track the
implementation through to completion>

* <link to tracker bug, issue, etc.>
* <...>
