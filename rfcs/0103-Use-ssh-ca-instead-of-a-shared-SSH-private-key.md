# RFC 103 - Use ssh-ca instead of a shared SSH private key
* Comments: [#103](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/103)
* Initially Proposed by: @jonasfj

# Summary

Instead of putting our personal public SSH keys on workers I suggest we look into:
 * https://www.digitalocean.com/community/tutorials/how-to-create-an-ssh-ca-to-validate-hosts-and-clients-with-ubuntu
 * https://www.lorier.net/docs/ssh-ca.html

## Motivation

We currently put a single SSH public key on our workers, and share the private SSH key through password-store. This is probably a bad idea, and it was never meant as a long term solution.

# Details

From a quick look it seems that we can:
 A)  install a single public root key on the our workers.
 B)  sign our personal public SSH keys with the private root key
 C)  SSH into the workers using our personal SSH key and a certificate from (B)

For revocation we would probably still have to:
 i)  update workers with a file declaring a key to be revoked
 ii) wait for the certificate signed in (B) to expire

If we store the private root key on an HSM or some system where it's easy to sign a public
SSH key after 2FA then we sign personal public SSH keys (step B) with 24 hours expiration.

This could be overkill, maybe 6 months expiration is fine. It's certainly better than now.

Note:
  Alternatives to this is using LDAP for distribution of public SSH keys.
  I'm sure security people wouldn't be fans of this. Cryptographic security would be nice.

# Open Questions

* Is this worth the effort?

