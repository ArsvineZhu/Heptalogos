# External integration reference

This is a short operator reference. The linked upstream sites are the
authority for installation, release, administration, licensing, and API
details; Heptalogos does not copy those procedures into the repository.

## NewAPI model gateway

NewAPI is the recommended gateway for the current real integration proof.
Its official project and documentation are:

- [NewAPI project repository](https://github.com/QuantumNous/new-api)
- [NewAPI API reference](https://docs.newapi.pro/en/docs/api)
- [OpenAI-compatible Chat Completions API](https://docs.newapi.pro/en/docs/api/ai-model/chat/openai/createchatcompletion)
- [OpenAI Responses API](https://docs.newapi.pro/en/docs/api/ai-model/chat/openai/createresponse)

The supported operator sequence is:

1. Deploy NewAPI independently using its current upstream instructions.
2. Configure a legally authorized upstream account/channel and model mapping
   in NewAPI, including the desired DeepSeek model when that is the target.
3. Create a NewAPI access token for the Heptalogos caller.
4. In Heptalogos create a GatewayProfile with the NewAPI /v1 base URL.
5. Store the NewAPI token through protected SecretService input, then create
   ModelProfile and ModelBinding entries for the chosen protocol and roles.
6. Verify readiness and invoke through the Management/AIRuntime boundary.

The DeepSeek or other upstream key belongs in NewAPI when NewAPI is the
gateway. Heptalogos receives only the NewAPI bearer token. Do not add a
NewAPI administrator API client, channel-management action, process
supervisor, downloader, or updater to Heptalogos under the current Plan.

## OpenClaw Machine Operations

OpenClaw remains independently operated for Machine Operations. Use the
[OpenClaw project](https://github.com/openclaw/openclaw) and its
[upstream documentation](https://github.com/openclaw/openclaw/tree/main/docs)
for deployment and administration. The Heptalogos boundary does not require
this privileged runtime to boot Product Host and does not store its credentials
by default. A Product distribution may carry an independent Subject OpenClaw
Runtime and this Machine Operations runtime together, but they must remain
separate processes/profiles/state roots, credentials, ports, and trust domains.

The Subject OpenClaw Runtime is a Product-managed low-privilege runtime when
that cognition route is enabled; its lifecycle and generated configuration are
owned by Product composition, while its provider-private state is not Subject
canonical state. The current bounded AIRuntime Subject Chat path does not
require it.

## FFmpeg

Install [FFmpeg](https://ffmpeg.org/) as an operator/deployment prerequisite only when an implemented
Heptalogos AV capability requires it. Use the platform's approved package or
distribution process. There is no Heptalogos downloader or bundled FFmpeg
payload in this current slice.

## Evidence boundary

A local HTTP fixture proves installed protocol mechanics and NetworkAccess
control. A single live gateway run proves only the exact gateway, model,
protocol, platform, package versions, and configuration used in that run. It
does not prove upstream provider-wide behavior, another protocol, another
platform, or NewAPI administration.
