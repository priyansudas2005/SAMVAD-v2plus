# Contributing to SAMVAD v2.0

Thank you for your interest in contributing to **SAMVAD v2.0**! We appreciate your time and effort in helping improve this project.

---

## 🚀 Ways to Contribute

There are many ways you can contribute to SAMVAD:

- **🐛 Report Bugs**: Open an issue describing the problem, along with steps to reproduce it and error logs.
- **💡 Suggest Features**: Share your ideas for new speech-to-text, diarization, or UI enhancements.
- **📝 Improve Documentation**: Help make our guides, README, and inline code comments clearer.
- **⚡ Code Contributions**: Submit pull requests for bug fixes, performance optimizations, or new capabilities.

---

## 💻 Development Setup

1. **Fork and Clone the Repository**:
   ```bash
   git clone https://github.com/priyansudas2005/SAMVAD-v2plus.git
   cd SAMVADv2
   ```

2. **Setup Environment**:
   ```bash
   cp .env.example .env
   ```

3. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate

   pip install -r requirements.txt
   python -m src.app
   ```

4. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🧪 Running Automated Tests

Before submitting a Pull Request, please ensure all automated tests pass:

- **Backend Tests**:
  ```bash
  cd backend
  pytest tests/test_api.py -v
  ```

- **Frontend Compilation & Tests**:
  ```bash
  cd frontend
  npm run build
  ```

---

## 📜 Pull Request Guidelines

1. Create a descriptive branch name (e.g. `feature/audio-waveform-enhancement` or `fix/diarization-clustering`).
2. Keep commits concise and write clear commit messages.
3. Ensure no hardcoded credentials, secret keys, or large audio/model binary files are committed.
4. Verify that both backend tests (`pytest`) and frontend builds (`npm run build`) pass cleanly.
