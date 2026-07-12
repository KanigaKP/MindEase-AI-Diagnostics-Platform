# Contributing to MindEase

Thank you for your interest in contributing to the **MindEase** project. This document outlines the standards, code conventions, and workflows required to submit contributions.

---

## 1. Code of Conduct

Maintain professional communication. Code design decisions and review feedback should focus on architectural improvements, code optimization, security, and stability.

---

## 2. Development Workflow

The project follows a standard git branch and pull request workflow:

1. **Fork the Repository**: Create a personal copy of the repository.
2. **Create a Feature Branch**: Branch from the main dev line using descriptive names:
   ```bash
   git checkout -b feature/diagnostics-postgres-migration
   ```
3. **Write Tests**: If you add API endpoints or modify database services, write corresponding tests in `test_api.py`.
4. **Run Verification Suite**: Verify that all tests pass before committing:
   ```bash
   python test_api.py
   ```
5. **Open a Pull Request**: Submit your pull request to the `main` branch. Provide a summary of the changes and link any related issues.

---

## 3. Style Guidelines

### 3.1 Backend Code Style (Python)
- **Formatting**: Adhere to PEP 8 standards. Use `black` or `yapf` for code formatting.
- **Type Hinting**: Provide explicit type hints for all function arguments and return types:
  ```python
  def calculate_average(db: Session, session_id: str) -> float:
  ```
- **Docstrings**: Document all classes and public functions using Sphinx or Google style docstring formats.

### 3.2 Frontend Code Style (JavaScript / React)
- **Component Design**: Keep functional components modular and reusable. Place styling variables in `index.css` rather than utilizing ad-hoc utilities.
- **State Management**: Manage session credentials and caching using the Zustand state store.
- **Linting**: Ensure code passes formatting and linting rules:
  ```bash
  npm run lint
  ```

---

## 4. Submitting Issues

If you identify a bug, open an issue in the repository. Provide:
- A clear description of the problem.
- Steps to reproduce the error.
- The exact error output or traceback.
- Details about your local operating environment (OS version, Python version, Node.js version).
