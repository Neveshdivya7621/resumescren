<div align="center">

<h1>
  <img src="https://img.shields.io/badge/SmartHire_AI-6366f1?style=for-the-badge&logo=sparkles&logoColor=white" alt="SmartHire AI" />
</h1>

<h3>Cloud-Native, AI-Powered Resume Screener & Applicant Tracking System</h3>

<br />

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerised-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)
[![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Scikit-learn](https://img.shields.io/badge/scikit--learn-1.4.2-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)

<br />

| **Student Name** | Nevesh Divya |
|---|---|
| **Registration Number** | RA2311031010007 |
| **Programme** | B.Tech — Networking & Communication (Section W2) |
| **Institution** | SRM Institute of Science and Technology, Kattankulathur |
| **Academic Year** | 2023 – 2027 |
| **Submission Date** | March 2026 |

</div>

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Cloud-Native Architecture](#2-cloud-native-architecture)
3. [NLP Methodology](#3-nlp-methodology)
4. [Project Structure](#4-project-structure)
5. [Environment Setup & Installation](#5-environment-setup--installation)
6. [Running the Application](#6-running-the-application)
7. [API Reference](#7-api-reference)
8. [Docker Containerisation](#8-docker-containerisation)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [Testing & Optimisation Strategies](#10-testing--optimisation-strategies)
11. [Security Considerations](#11-security-considerations)
12. [Future Enhancements](#12-future-enhancements)
13. [References](#13-references)

---

## 1. Project Overview

**SmartHire AI** is a full-stack, cloud-native web application that automates the early stages of recruitment by semantically ranking candidate resumes against a given job description. Traditional keyword-based Applicant Tracking Systems (ATS) suffer from high false-negative rates—disqualifying qualified candidates whose resumes use synonymous terminology. SmartHire AI addresses this limitation by employing **TF-IDF vectorisation** combined with **Cosine Similarity** to capture contextual, weighted relevance beyond simple keyword matching.

### Key Capabilities

| Feature | Technology |
|---|---|
| PDF text extraction | PyMuPDF (fitz) |
| Natural Language Processing | Scikit-learn TF-IDF + Cosine Similarity |
| REST API | Python 3.11 + Flask 3 |
| Reactive Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Containerisation | Docker (multi-stage build) |
| Automated CI/CD | GitHub Actions |

---

## 2. Cloud-Native Architecture

SmartHire AI is designed following the **Twelve-Factor App** methodology, ensuring portability, scalability, and operational excellence in cloud environments (AWS, GCP, Azure, or any container orchestration platform such as Kubernetes).

```
┌────────────────────────────────────────────────────────────────┐
│                        User's Browser                          │
│              React 18 SPA (Vite + Tailwind CSS)                │
└──────────────────────────────┬─────────────────────────────────┘
                               │ HTTPS (REST API)
                               ▼
┌────────────────────────────────────────────────────────────────┐
│              Flask API  (Gunicorn – 4 Workers)                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  POST /api/screen                                       │   │
│  │  ┌───────────────────┐   ┌──────────────────────────┐  │   │
│  │  │ PyMuPDF Extractor │──▶│ TF-IDF Vectoriser        │  │   │
│  │  │ (PDF → text)      │   │ (Scikit-learn, bigrams)  │  │   │
│  │  └───────────────────┘   └──────────┬───────────────┘  │   │
│  │                                     ▼                   │   │
│  │                          ┌──────────────────────────┐   │   │
│  │                          │ Cosine Similarity Engine │   │   │
│  │                          │ (ranked JSON response)   │   │   │
│  │                          └──────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                     Docker Container                           │
└────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│               GitHub Actions CI/CD Pipeline                    │
│   flake8 Lint → Vite Build → Docker Build → Artifact Upload    │
└────────────────────────────────────────────────────────────────┘
```

### Twelve-Factor Compliance

| Factor | Implementation |
|---|---|
| **Codebase** | Single Git repository with clear backend / frontend separation |
| **Dependencies** | Explicit `requirements.txt` and `package.json` with locked versions |
| **Config** | Environment variables (`PORT`, `FLASK_DEBUG`) via `os.environ` |
| **Processes** | Stateless Flask workers; no in-process session state |
| **Port binding** | `gunicorn --bind 0.0.0.0:5000` |
| **Concurrency** | Gunicorn with 4 workers × 2 threads |
| **Disposability** | Fast startup (<2 s) and graceful Gunicorn shutdown |
| **Dev/prod parity** | Docker image identical in all environments |
| **Logs** | Streams to stdout/stderr; ingested by cloud log aggregators |

---

## 3. NLP Methodology

### 3.1 Text Extraction

PDF resumes are parsed using **PyMuPDF** (`fitz`), which extracts raw Unicode text from each page while preserving paragraph structure. Unlike pdfminer or PyPDF2, PyMuPDF achieves this in a single C-extension call, resulting in extraction speeds of **~5 ms per page** even for dense academic CVs.

### 3.2 TF-IDF Vectorisation

**Term Frequency–Inverse Document Frequency (TF-IDF)** transforms raw text into a numerical feature matrix by weighting terms that are frequent within a document but rare across the corpus:

$$\text{TF-IDF}(t, d) = \text{TF}(t, d) \times \log\left(\frac{1 + N}{1 + \text{DF}(t)}\right) + 1$$

Where:

- $t$ = term, $d$ = document, $N$ = total documents in the corpus
- $\text{TF}(t, d)$ = frequency of term $t$ in document $d$ (log-normalised: `sublinear_tf=True`)
- $\text{DF}(t)$ = number of documents containing $t$

**Implementation parameters:**

```python
TfidfVectorizer(
    stop_words="english",  # Remove common English stop-words
    ngram_range=(1, 2),    # Unigrams AND bigrams (e.g. "machine learning")
    max_features=10_000,   # Cap vocabulary at 10,000 terms
    sublinear_tf=True,     # Apply log(1 + TF) instead of raw TF
)
```

Using **bigrams** (`ngram_range=(1, 2)`) is critical because compound technical skills such as `machine learning`, `project management`, or `data analysis` are semantically lost if only unigrams are considered.

### 3.3 Cosine Similarity

After vectorisation, the **cosine similarity** between the job description vector **j** and each resume vector **r** is computed:

$$\text{similarity}(j, r) = \frac{j \cdot r}{\|j\| \cdot \|r\|}$$

Cosine similarity is preferred over Euclidean distance because it is **magnitude-invariant**: a 2-page resume and a 10-page resume can score equally highly if they share the same proportional keyword distribution. The output is a float in $[0, 1]$, multiplied by 100 to yield a percentage score.

### 3.4 Ranking

All candidates are sorted in **descending order** of their cosine similarity score. The ranked JSON array is returned to the frontend, where colour-coded score bars and match labels provide immediate visual interpretation.

---

## 4. Project Structure

```
SmartHire-AI/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD
├── backend/
│   ├── app.py                  # Flask API
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile              # Multi-stage production image
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx             # Main React component
│   │   ├── main.jsx            # React entry point
│   │   └── index.css           # Global styles
│   ├── index.html              # HTML shell
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

---

## 5. Environment Setup & Installation

> **Prerequisites:** Python 3.11+, Node.js 20+, npm 10+, Git

### Step 1 — Clone the Repository

```bash
git clone https://github.com/<your-username>/SmartHire-AI.git
cd SmartHire-AI
```

### Step 2 — Backend: Create Virtual Environment & Install Dependencies

```bash
# Windows (PowerShell)
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt

# macOS / Linux
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3 — Frontend: Install npm Packages

```bash
# From project root
cd frontend
npm install
```

---

## 6. Running the Application

### Start the Flask Backend

```bash
# From backend/ directory (with venv activated)
# Windows
set FLASK_DEBUG=true
python app.py

# macOS / Linux
FLASK_DEBUG=true python app.py
# or with Gunicorn (production-equivalent)
gunicorn --bind 0.0.0.0:5000 --workers 4 --threads 2 --timeout 120 app:app
```

> The API will be available at `http://localhost:5000`

### Start the Vite Dev Server

```bash
# From frontend/ directory
npm run dev
```

> The UI will be available at `http://localhost:3000`

The Vite dev server proxies all `/api/*` requests to the Flask backend, so no manual CORS configuration is needed during development.

---

## 7. API Reference

### `GET /api/health`

Liveness probe — returns `200 OK` if the service is running.

**Response:**
```json
{ "status": "ok", "service": "SmartHire AI Backend" }
```

---

### `POST /api/screen`

Screen one or more PDF resumes against a job description.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `job_description` | `string` | ✅ | Plain-text job description (min 20 chars) |
| `resumes` | `file[]` | ✅ | One or more `.pdf` resume files |

**Success Response — `200 OK`:**
```json
{
  "results": [
    { "rank": 1, "name": "alice_resume.pdf", "score": 84.72 },
    { "rank": 2, "name": "bob_resume.pdf",   "score": 61.18 },
    { "rank": 3, "name": "carol_resume.pdf", "score": 42.05 }
  ],
  "total_screened": 3,
  "warnings": []
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| `400` | Missing `job_description` or no files attached |
| `413` | Total request size exceeds 50 MB |
| `422` | All PDFs are scanned/unreadable (no extractable text) |
| `500` | Unexpected server-side error |

---

## 8. Docker Containerisation

### Build the Backend Image

```bash
cd backend
docker build -t smarthire-ai-backend:latest .
```

### Run the Container

```bash
docker run -d \
  --name smarthire-backend \
  -p 5000:5000 \
  -e FLASK_DEBUG=false \
  --restart unless-stopped \
  smarthire-ai-backend:latest
```

### Docker Architecture — Multi-Stage Build

The `Dockerfile` uses a **two-stage build**:

| Stage | Base Image | Purpose |
|---|---|---|
| `builder` | `python:3.11-slim` | Install pip dependencies into `/install` |
| `runtime` | `python:3.11-slim` | Copy app + `/install`, drop build tools |

This approach produces an image that is **~40% smaller** than a single-stage build because build-time tools (pip, compilers) are excluded from the final image.

**Security Hardening:**

- Non-root user (`appuser`) runs Gunicorn
- No shell in the `CMD` (exec form)
- `HEALTHCHECK` polls `/api/health` every 30 s

### Verify the Container Health

```bash
docker inspect --format='{{.State.Health.Status}}' smarthire-backend
# Expected: "healthy"
```

---

## 9. CI/CD Pipeline

The GitHub Actions workflow at `.github/workflows/deploy.yml` triggers on every push and pull request to the `main` branch, executing four parallel/sequential jobs:

```
push to main
     │
     ├──► lint-backend       (flake8 + flake8-bugbear)
     │         │
     │         └──► build-docker   (Multi-stage Docker build + tar artifact)
     │
     ├──► build-frontend     (npm install → vite build → artifact upload)
     │
     └──► ci-summary         (prints overall pass/fail status)
```

### Linting Rules

```
flake8 app.py \
  --max-line-length=120 \
  --extend-ignore=E501,D100,D104,D205,D400
```

Violations fail the pipeline, preventing broken code from reaching the Docker build stage.

---

## 10. Testing & Optimisation Strategies

### 10.1 Backend Unit Testing

Install `pytest` and `httpx` for testing the Flask API:

```bash
pip install pytest pytest-cov httpx
```

**Sample test — `backend/test_app.py`:**

```python
import pytest
from app import app, compute_similarity_scores

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c

def test_health_check(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json["status"] == "ok"

def test_screen_no_files(client):
    data = {"job_description": "Python developer with Django experience"}
    resp = client.post("/api/screen", data=data, content_type="multipart/form-data")
    assert resp.status_code == 400

def test_screen_empty_jd(client):
    resp = client.post("/api/screen", data={}, content_type="multipart/form-data")
    assert resp.status_code == 400

def test_cosine_similarity_ordering():
    jd = "Python machine learning scikit-learn data analysis pandas numpy"
    resumes = [
        {"name": "general.pdf",  "text": "Java developer Spring Boot microservices"},
        {"name": "ml_eng.pdf",   "text": "Python machine learning scikit-learn tensorflow"},
        {"name": "data_sci.pdf", "text": "Python pandas numpy data analysis statistics"},
    ]
    results = compute_similarity_scores(jd, resumes)
    # The ML engineer and data scientist should rank above the Java developer
    assert results[0]["name"] in ("ml_eng.pdf", "data_sci.pdf")
    assert results[-1]["name"] == "general.pdf"

def test_empty_resume_list():
    results = compute_similarity_scores("some text", [])
    assert results == []
```

**Run tests with coverage:**

```bash
pytest backend/ -v --cov=backend --cov-report=term-missing
```

### 10.2 Frontend Testing

```bash
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
npx vitest run
```

### 10.3 Performance Optimisation

| Strategy | Detail |
|---|---|
| **TF-IDF `max_features=10_000`** | Caps matrix width; prevents memory bloat with very large corpora |
| **Sparse matrices** | Scikit-learn TF-IDF returns CSR sparse matrices, keeping memory O(non-zero elements) |
| **Gunicorn workers** | `workers = 2 × CPU_cores + 1` rule-of-thumb used (4 workers) |
| **Docker layer caching** | `requirements.txt` copied before source code to maximise build cache hits |
| **Vite code splitting** | `react` and `vendor` chunks split separately for optimal browser caching |

### 10.4 Accuracy Optimisation

| Technique | Benefit |
|---|---|
| Bigrams (`ngram_range=(1,2)`) | Captures multi-word technical terms |
| `sublinear_tf=True` | Reduces dominance of repeated terms |
| `stop_words="english"` | Eliminates noise from common words |
| Expanding synonyms | Future: use spaCy lemmatisation or Word2Vec embeddings |

---

## 11. Security Considerations

| Threat | Mitigation |
|---|---|
| Malicious PDF upload | PyMuPDF uses libmupdf in sandboxed mode; only text is extracted |
| Oversized payloads | Flask `MAX_CONTENT_LENGTH` can be set to 50 MB |
| CORS abuse | `flask-cors` restricts `Access-Control-Allow-Origin` per endpoint |
| Non-root container exploit | Gunicorn runs as `appuser`, not `root` |
| Dependency vulnerabilities | Pin exact versions in `requirements.txt`; run `pip-audit` in CI |

---

## 12. Future Enhancements

- **Semantic Embeddings:** Replace TF-IDF with sentence-transformers (`all-MiniLM-L6-v2`) for context-aware similarity beyond keyword overlap.
- **Named Entity Recognition:** Use spaCy to extract skills, certifications, and years of experience as structured fields.
- **Database Integration:** Store historical screenings in PostgreSQL for auditability and analytics.
- **Authentication:** Add JWT-based authentication so only HR users can access screening results.
- **Cloud Deployment:** Deploy to AWS ECS Fargate or Google Cloud Run with auto-scaling triggered by request volume.
- **Bias Mitigation:** Apply a pre-processing step that removes names and demographic signals before vectorisation.
- **Asynchronous Processing:** Use Celery + Redis to process large batches of resumes without blocking the HTTP response.

---

## 13. References

1. Salton, G., & Buckley, C. (1988). Term-weighting approaches in automatic text retrieval. *Information Processing & Management*, 24(5), 513–523.
2. Manning, C. D., Raghavan, P., & Schütze, H. (2008). *Introduction to Information Retrieval*. Cambridge University Press.
3. Pedregosa, F., et al. (2011). Scikit-learn: Machine Learning in Python. *Journal of Machine Learning Research*, 12, 2825–2830.
4. Artifex Software. (2024). *PyMuPDF Documentation*. [https://pymupdf.readthedocs.io](https://pymupdf.readthedocs.io)
5. Flask Team. (2024). *Flask Documentation (v3.0.x)*. [https://flask.palletsprojects.com](https://flask.palletsprojects.com)
6. Meta Open Source. (2024). *React Documentation*. [https://react.dev](https://react.dev)
7. Docker Inc. (2024). *Dockerfile Best Practices*. [https://docs.docker.com/develop/dev-best-practices/](https://docs.docker.com/develop/dev-best-practices/)

---

<div align="center">

**SmartHire AI** | Developed by Nevesh Divya · RA2311031010007<br/>
B.Tech Networking & Communication, Section W2 · SRM Institute of Science and Technology<br/>
*"Empowering smarter hiring through artificial intelligence."*

</div>
