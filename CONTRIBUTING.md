# Contributing to SAMVAD

Thank you for your interest in contributing to **SAMVAD**! We welcome and appreciate contributions of all types—from bug reports and documentation improvements to new feature implementations and performance optimizations.

Please take a moment to review this document to ensure a smooth and productive collaboration process.

---

## 🎯 Project Philosophy

SAMVAD is built upon three core tenets:
1. **100% Privacy & Offline Integrity**: No audio, telemetry, metadata, or text analysis may ever leave the local machine. External cloud API integrations are strictly prohibited.
2. **Local Resource Efficiency**: Code must be optimized to run efficiently on standard consumer hardware. CPU multi-threading thresholds and memory bounds must be respected.
3. **Structured Reproducibility**: Container environments must remain secure, immutable, and easily buildable without complex manual steps.

---

## 🐛 Issue Reporting

If you encounter a bug or have a feature request, please open an issue using the templates:
* **Bug Reports**: Include a clear description, reproducible steps, environment details (OS, Docker Desktop version, python/node versions), and full stdout/stderr stack traces.
* **Feature Requests**: Clearly describe the proposed capability, target user stories, and potential architectural impacts.

---

## 💻 Development Setup

### Prerequisites
* **Python 3.11**
* **Node.js 20+**
* **FFmpeg** (installed and added to your system `PATH`)

### Setup Instructions

1. **Fork & Clone**:
   ```bash
   git clone https://github.com/priyansudas2005/SAMVAD-v2plus.git
   cd SAMVADv2
   ```

2. **Configure Local Environment**:
   ```bash
   cp .env.example .env
   ```

3. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   # Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # Linux / macOS:
   source venv/bin/activate

   pip install -r requirements.txt
   python -m src.app
   ```

4. **Frontend Setup** (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 📂 Folder Organization

Ensure your changes align with our workspace taxonomy:
* `/backend/src/api`: REST and WebSocket endpoint routers.
* `/backend/src/services`: Core engine components (audio, transcription, diarization, database, export, intelligence, qa).
* `/backend/src/models`: SQLAlchemy structures and Pydantic schemas.
* `/backend/src/utils`: Logging, configuration files, and system utilities.
* `/frontend/src/components`: UI layouts, waveform canvas displays, and input elements.
* `/frontend/src/pages`: Top-level workspace views (Dashboard, Recorder, Transcript, Memo, Stats, QA, Settings).
* `/deployment`: Configuration scripts, Nginx servers, and reverse proxy routes.

---

## 🌿 Branch Naming

We enforce a simple branch naming convention. Prefix your branch name based on the task type:
* `feat/` for new capabilities (e.g., `feat/gpu-acceleration`)
* `fix/` for bug fixes (e.g., `fix/diarization-threshold`)
* `docs/` for documentation changes (e.g., `docs/api-guide`)
* `refactor/` for code styling, formatting, or restructure
* `test/` for adding or modifying unit/integration tests

---

## 💬 Commit Message Convention

We follow a structured commit convention to maintain a readable git history. Write commits in the imperative mood, prefixed with the scope:

```text
<type>(<scope>): <short description>
```

### Types
* **feat**: A new feature (e.g., `feat(diarization): add AHC max distance jump clustering`)
* **fix**: A bug fix (e.g., `fix(healthcheck): correct backend url path in compose`)
* **docs**: Documentation modifications (e.g., `docs(readme): add docker hub guide`)
* **style**: Code styling edits (white-space, formatting, missing semi-colons)
* **refactor**: Code rewrite that neither fixes a bug nor adds a feature
* **test**: Adding or correcting tests (e.g., `test(pipeline): add transcript cancellation tests`)
* **chore**: Updating build tasks, dependencies, or local helper configurations

---

## 🎨 Coding Style

### Python (Backend)
* Adhere to **PEP 8** guidelines.
* Use explicit type hinting for all function parameters and return types.
* Format files using standard code formatter utilities (e.g., `black` or `isort`).
* Every public function must include a descriptive docstring explaining arguments, return types, and exceptions.

### TypeScript / React (Frontend)
* Use functional React components with hooks.
* Enforce strict TypeScript typing; avoid `any` declarations.
* Format files using Prettier standards.
* Use vanilla CSS classes for styling layouts. Ensure responsive, dynamic, and glassmorphic designs.

---

## 🧪 Testing Requirements

All code contributions must be accompanied by relevant test coverage.

### Backend Tests
Ensure all unit and integration tests run successfully:
```bash
cd backend
pytest -v
```

### Frontend Compilation
Ensure the frontend builds without any TypeScript or Vite compilation warnings:
```bash
cd frontend
npm run build
```

---

## 📥 How to Submit Pull Requests

1. **Keep PRs Focused**: Keep pull requests narrow in scope. A single PR should address one issue or feature.
2. **Sync with Main**: Before submitting, merge the latest upstream `main` changes into your branch to avoid merge conflicts.
3. **Verify Builds & Tests**: Confirm that local tests pass, linting checks succeed, and frontend builds compiles cleanly.
4. **No Binary Artifacts**: Never commit sqlite `.db` files, audio recordings, or raw deep-learning weights to Git.
5. **Open Pull Request**: Write a descriptive PR summary explaining *what* changed, *why* it was changed, and *how* you verified it.

---

## 👁️ Code Review Expectations

All incoming PRs undergo review by maintainers:
* **Constructive Feedback**: We aim to keep reviews constructive, focusing on security, performance, clean code architecture, and database migrations.
* **Review Cycle**: Expect reviews within 48 hours. Address requested modifications promptly.
* **Approval**: Merge requires approval from at least one core maintainer and a green test runner status.

---

## 📝 Documentation Standards

* **Inline Documentation**: Document complex logic, algorithms, or sub-threading limits directly in the code with clean block comments.
* **API Route Updates**: If adding or changing API routes, verify that the FastAPI OpenAPI schema updates correctly.
* **Artifact Files**: When editing user-facing plans, checklists, or summaries, update the corresponding markdown artifact guides (`walkthrough.md`, `task.md`) in your PR submission.

---

## 🔒 Security Guidelines

* **Zero-Leak Policy**: Telemetry, model telemetry trackers, or external logging configurations must be configured for strict offline mode.
* **No hardcoded secrets**: Use environment variables loaded from `.env` via `config.py` for all configurable path bindings or configurations.
* **Report Vulnerabilities**: If you identify a security issue, do not open a public issue. Email details directly to the project maintainers or consult [`SECURITY.md`](SECURITY.md).
