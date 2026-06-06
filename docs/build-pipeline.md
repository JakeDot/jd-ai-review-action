# Multi-language build pipeline

A reusable compilation/build pipeline for child projects that mix several
programming languages. The child project declares which language components it
wants to build and supplies the actual build/test commands; this repository
provides everything else — toolchain setup, dependency caching, artifact upload
and a single aggregate status check.

Two consumption models are provided so it works whether you reference
`claude-setup` directly or vendor it as a git submodule:

| Model | Use this when | Entry point |
| ----- | ------------- | ----------- |
| Reusable workflow | You can reference `claude-setup` by repo ref (no submodule needed). | [`.github/workflows/build-pipeline.yml`](../.github/workflows/build-pipeline.yml) |
| Composite action  | You vendor `claude-setup` as a git submodule and want a local-path build step. | [`action.yml`](../action.yml) |

Supported languages: `java`, `scala`, `kotlin`, `node`, `python`, `go`, `rust`,
`dotnet`, and `custom` (no toolchain installed — you provide the setup).

## Reusable workflow

The child repo calls the pipeline and passes a JSON array of components. Each
component object's fields are documented in the header of
[`build-pipeline.yml`](../.github/workflows/build-pipeline.yml).

```yaml
# child-repo/.github/workflows/build.yml
name: Build
on: [push, pull_request]

jobs:
  build:
    uses: JakeDot/claude-setup/.github/workflows/build-pipeline.yml@main
    with:
      components: |
        [
          { "name": "api-java",     "language": "java",  "version": "21", "workdir": "services/api",   "cache": "maven", "build": "mvn -B -ntp clean package", "test": "mvn -B -ntp test",   "artifacts": "services/api/target/*.jar" },
          { "name": "web-node",     "language": "node",  "version": "20", "workdir": "apps/web",       "cache": "npm",   "setup": "npm ci", "build": "npm run build",  "test": "npm test --if-present", "artifacts": "apps/web/dist/**" },
          { "name": "engine-scala", "language": "scala", "version": "21", "workdir": "modules/engine", "cache": "sbt",   "build": "sbt -batch compile", "test": "sbt -batch test", "artifacts": "modules/engine/target/**/*.jar" }
        ]
```

Each component runs as its own matrix job in parallel. A `build summary` job
aggregates them, so you only need to require that one check in branch
protection. A full example lives in
[`examples/build-pipeline/reusable-workflow.yml`](../examples/build-pipeline/reusable-workflow.yml).

### Pipeline inputs

| Input | Default | Description |
| ----- | ------- | ----------- |
| `components` | _(required)_ | JSON array of component objects. |
| `runner` | `ubuntu-latest` | Runner label for the build jobs. |
| `fail-fast` | `false` | Cancel sibling components when one fails. |
| `submodules` | `false` | Passed to `actions/checkout` (`false`/`true`/`recursive`). |
| `fetch-depth` | `1` | Passed to `actions/checkout` (`0` = full history). |
| `upload-artifacts` | `true` | Upload component artifacts when an `artifacts` path is set. |
| `setup-script` | `''` | Shell run once per component before toolchain setup. |

### Component schema

| Field | Required | Description |
| ----- | -------- | ----------- |
| `name` | yes | Unique display + artifact name. |
| `language` | yes | One of the supported languages above. |
| `version` | no | Toolchain version (per-language default otherwise). |
| `distribution` | no | JDK distribution for java/scala/kotlin (default `temurin`). |
| `workdir` | no | Directory build/test commands run in (default `.`). |
| `setup` | no | Extra shell run after toolchain setup, before the build. |
| `build` | yes | The compile/build command. |
| `test` | no | Test command, run after a successful build. |
| `cache` | no | Built-in toolchain cache key (e.g. `maven`, `gradle`, `sbt`, `npm`, `pip`). For `node`/`python` the lockfile is auto-located within `workdir`, so caching works for components in subdirectories. |
| `artifacts` | no | Path/glob of build outputs to upload. |

## Composite action (git submodule)

Reusable workflows cannot be referenced through a submodule path, so for the
submodule model use the composite action, which builds one component per call:

```sh
git submodule add https://github.com/JakeDot/claude-setup.git .github/claude-setup
```

See the [README](../README.md#install-as-a-git-submodule) for full install
instructions and a sample `.gitmodules`.

```yaml
# child-repo/.github/workflows/build.yml
- uses: actions/checkout@v4
  with:
    submodules: recursive          # required: the action is referenced by path
- uses: ./.github/claude-setup
  with:
    language: java
    version: "21"
    workdir: services/api
    cache: maven
    build: mvn -B -ntp clean package
    test: mvn -B -ntp test
    artifacts: services/api/target/*.jar
```

Drive several languages by calling the action once per matrix entry — see
[`examples/build-pipeline/submodule-composite.yml`](../examples/build-pipeline/submodule-composite.yml).

## Pinning

Replace `@main` with a tag or commit SHA of `claude-setup` for reproducible
builds. For the composite action, pin by tracking the submodule at a specific
commit.
