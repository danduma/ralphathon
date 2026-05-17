# Agent Notes

## Deploying `rube-phones`

- Use the existing `rag1_ssh.sh` VPS helper for deployment access. If the repo-local helper does not have its adjacent SSH key available, use `/Users/masterman/NLP/trendintel/devops/rag1_ssh.sh`.
- Treat the helper and its referenced SSH key material as local credentials only. Do not print, copy, commit, or paste the private key or expanded credential values.
- The live app is served from `/opt/rube-phones` by `rube-phones.service` on the VPS. The public host is `rubephones.aiminions.xyz`.
