# RFC 21 - taskcluster-livelog-proxy in production
* Comments: [#21](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/21)
* Initially Proposed by: @djmitche

# Proposal
This is a proxy to allow access to workers that are not otherwise publicly accessible. It replaces the existing dns-based solution that gets live logs via public IPs of EC2 instances