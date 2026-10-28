# GitHub Actions → GitHub Pages

## One-time repository setup

1. Create the GitHub repository and push this project history to its default branch. The workflow discovers that branch from GitHub metadata, so master and main both work without editing the workflow.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
3. Run **Validate and deploy Pages** from the Actions tab on the default branch, or push another commit. If the first run happened before Pages was enabled, enable it and rerun that workflow.
4. Open the URL shown by the github-pages deployment environment.

No personal access token or repository-specific URL is needed in the source. The workflow uses GitHub's built-in token and Pages OIDC deployment flow. Repository Pages/environment policies still apply. The configured remote is git@github.com:coreypobrien/fte2-perks.git. Pages has been set to GitHub Actions in that repository.

## Workflow behavior

.github/workflows/pages.yml runs validation for pushes, pull requests and manual dispatches. It uses the Node version in .node-version and pnpm from package.json, installs with --frozen-lockfile, runs the catalog/unit coverage checks, builds dist/, installs Playwright Chromium with its Linux dependencies, and runs the production browser suite under /afe2-pages-check/.

Only a successful default-branch run can upload the tested Pages artifact and deploy it. Pull requests and non-default branches cannot deploy. The validation job has read permissions; the separate deployment job has Pages write and OIDC permissions and uses the github-pages environment. Pages deployments are serialized without cancelling one already in progress. Actions are pinned to verified commit SHAs with version comments for maintenance.

The test-evidence artifact contains logs, screenshots and browser reports and is retained for 14 days. It is uploaded even when checks fail, where available. Only dist/ becomes the Pages site; research scripts, raw observations, local work files and tools are not deployed. The generated catalog is intentionally part of the site.

## Paths and local validation

Vite already builds relative URLs with base: './'. The same artifact supports a normal project site such as https://OWNER.github.io/REPOSITORY/ and a root site. There is no client-side routing that needs a Pages 404 fallback. Worker and catalog URLs resolve relative to their compiled module.

~~~sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm exec playwright install --with-deps chromium
node scripts/test-browser.mjs --directory dist --base-path /afe2-pages-check/
~~~

Use --browser-path for an existing Edge/Chrome executable on Windows, as described in testing.md. To inspect the prefix manually:

~~~sh
node scripts/serve.mjs --directory dist --port 4174 --base-path /afe2-pages-check/
~~~

Open http://127.0.0.1:4174/afe2-pages-check/. The helper canonicalizes the trailing slash and scopes assets to that prefix. LICENSE.txt, NOTICE.txt and licenses/Vite.txt are copied into the built artifact.

Browser saves are origin-bound. Export from localhost and import on the hosted site to move builds. A new host/domain does not inherit the old browser's storage.

## Maintenance and limits

Update action pins from their official repositories and review the corresponding release notes. Keep the lockfile and Playwright browser install in sync. The default-branch build must pass before deployment; an existing healthy site remains in place when validation fails.

Local Windows checks and workflow linting do not prove that a GitHub-hosted Ubuntu run or Pages publication has succeeded. The first successful hosted run and a live-site browser check remain the final integration checks. This is an experimental, AI-assisted project with no support or availability commitment; see ../SUPPORT.md and known-limitations.md.

## Official references

- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) describes the Pages artifact, deployment permissions, dependency and environment used here.
- [Vite static deployment](https://vite.dev/guide/static-deploy.html#github-pages) describes Pages hosting and asset base paths.
- [Playwright CI setup](https://playwright.dev/docs/ci-intro) describes installing browser/system dependencies on CI.
- [MIT license text](https://opensource.org/license/mit) is the source of the original-code license.

## Current publication status

Local release preparation passed a clean frozen install, 57 unit/integration tests, all 23 production browser scenarios under a project URL prefix, and actionlint 1.7.12. The remote is configured and Pages source is GitHub Actions. Initial publication is waiting on local SSH-agent signing: direct SSH authenticates as coreypobrien, but Git push requests fail with an agent communication error. No successful push, Actions run, or live-site validation has been recorded yet.

Once the machine's SSH signing approval is working, push master to origin. On this Windows checkout Git 2.9 defaults to a different SSH client; Windows OpenSSH sees the loaded agent identities:

~~~powershell
$env:GIT_SSH = 'C:\Windows\System32\OpenSSH\ssh.exe'
git push -u origin master
~~~

Then inspect the Validate and deploy Pages workflow, resolve any hosted failures, and run the browser suite against the deployed URL shown by GitHub. Record the run link and live-browser result here after success.
