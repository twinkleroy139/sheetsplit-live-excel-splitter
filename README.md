# SheetSplit ⚡
### High-Performance Cloud Spreadsheet Partitioning & Dataset Slicing Platform

<div align="center">

**Split massive spreadsheets into manageable, structured datasets — without relying on Excel's desktop interface.**

[![Production](https://img.shields.io/badge/Production-Live-6366f1?style=for-the-badge&logo=render&logoColor=white)](https://sheetsplit-api.onrender.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Firebase](https://img.shields.io/badge/Auth-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

[**Live Application →**](https://sheetsplit-api.onrender.com) · [**Report an Issue**](https://github.com/twinkleroy139/sheetsplit-live-excel-splitter/issues)

</div>

---

## 01 — Overview

**SheetSplit** is a cloud-based spreadsheet partitioning platform engineered to simplify the processing of large tabular datasets.

Large spreadsheets can consume substantial memory and become difficult to manage in desktop applications. SheetSplit moves the partitioning workflow to a Python-powered backend, allowing users to upload spreadsheet files, inspect their structure, configure splitting rules, and download organized output files.

Built with **FastAPI, Pandas, OpenPyXL, Firebase Authentication, and Cloud Firestore**, the platform combines asynchronous API workflows with a lightweight, framework-free frontend.

From splitting a CSV into equal-sized batches to grouping records by categorical values, SheetSplit provides a configurable workflow for dataset preparation, distribution, and operational management.

### At a glance

| Capability | Description |
|---|---|
| Equal partitioning | Divide records into a requested number of pieces |
| Fixed-size batches | Split datasets by a specified number of rows |
| Column-based grouping | Separate records according to unique column values |
| Multi-format exports | CSV, Excel, TSV, and JSON |
| Personal workspace | Manage jobs, presets, favorites, and notes |
| Secure sharing | Expiring links with optional PIN protection |
| Admin dashboard | Monitor activity, errors, users, and temporary storage |

---

## 02 — Core Features

### A. Intelligent Spreadsheet Partitioning

**Three partitioning strategies** support different dataset distribution requirements.

- **Equal Pieces:** Divide rows as evenly as possible across a specified number of output files, distributing remainder rows across partitions.
- **Fixed Row Batches:** Generate files containing a configurable number of records per batch, with headers repeated in each output.
- **Smart Column Grouping:** Group records by unique values in a selected column, such as `Country`, `Department`, or `Status`.

### B. Multi-Format Serialization

Export processed datasets in formats suited to different workflows.

| Format | Extension | Typical Use |
|---|---|---|
| CSV | `.csv` | Data exchange and analytics |
| Excel | `.xlsx` | Spreadsheet workflows |
| TSV | `.tsv` | Tab-delimited data processing |
| JSON | `.json` | Application integrations |
| ZIP archive | `.zip` | Downloading multiple output partitions together |

### C. Personal Workspace & Job Vault

The workspace at `/workspace.html` provides tools for managing individual processing jobs.

- Rename jobs inline.
- Favorite or pin frequently used jobs.
- Add contextual operational notes.
- Re-run saved splitting presets.
- Review generated chunks and processing summaries.
- Track total records processed and estimated manual work saved.
- Monitor monthly row or usage quotas where configured.

### D. Expiring File Sharing

The sharing interface at `/share.html` supports controlled distribution of generated datasets.

- Generate share links for recipients without requiring platform registration.
- Configure link expiration for 1 hour, 24 hours, 3 days, or 7 days.
- Optionally protect shared downloads with a PIN.
- Hash PINs using SHA-256 before storage, as implemented by the application.
- Validate share-token expiration before granting access.

**Security note:** PIN hashing alone does not prevent brute-force attempts. Production deployments should also use rate limiting, sufficiently unpredictable tokens, secure token storage, and appropriate access controls.

### E. Administrative Control Cockpit

The administrative interface at `/admin.html` provides operational visibility and management tools.

- Monitor job volumes and success/failure statistics.
- Inspect processing errors and stack traces.
- Review temporary disk consumption.
- Inspect Google-authenticated users.
- Manage account access through Firestore.
- Publish global announcements and maintenance notices.
- Trigger administrative cleanup of temporary uploads and outputs.

Administrative endpoints must be protected by server-side authorization checks. Hiding an admin page or button is not sufficient.

### F. Lightweight Frontend

- Vanilla JavaScript with modern ES modules.
- Responsive HTML5 and CSS3 interface.
- CSS-variable-based theming.
- Persistent dark/night mode using `localStorage`.
- Asynchronous API interactions.
- No frontend framework or separate JavaScript build pipeline required by the described architecture.

---

## 03 — Architecture & Data Flow

SheetSplit separates the browser interface, API layer, data-processing engine, and cloud-backed identity and configuration services.

```text
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                     │
│                                                     │
│  Upload UI · Schema Preview · Job Configuration     │
│  Workspace · Sharing · Admin Dashboard              │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS / REST API
                         ▼
┌─────────────────────────────────────────────────────┐
│                  FASTAPI BACKEND                    │
│                                                     │
│  Upload Validation · Job Management · API Routes    │
│  BackgroundTasks · Progress & Download Endpoints    │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│               DATA PROCESSING ENGINE                │
│                                                     │
│  Pandas · OpenPyXL · Partitioning · Serialization   │
│                                                     │
│  Equal Split │ Fixed Batches │ Column Grouping      │
└────────────────────────┬────────────────────────────┘
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
┌─────────────────────┐  ┌───────────────────────────┐
│ Temporary Outputs   │  │ ZIP Archive Generation    │
│ Individual Chunks   │  │ Combined Download         │
└──────────┬──────────┘  └─────────────┬─────────────┘
           └──────────────┬────────────┘
                          ▼
                Secure Download / Sharing

      Firebase Authentication + Cloud Firestore
      Identity, user profiles and application state
```

### Processing Lifecycle

1. **Ingestion:** Accept an uploaded spreadsheet and validate its file type and structure.
2. **Inspection:** Analyze the schema and return a preview of up to 20 rows.
3. **Configuration:** Receive partitioning rules, output format, and selected columns.
4. **Execution:** Run the partitioning pipeline through the backend job workflow.
5. **Serialization:** Generate individual output files and optionally bundle them into a ZIP archive.
6. **Delivery:** Expose job status and available downloads through API endpoints.
7. **Lifecycle management:** Track job information, enforce sharing expiration, and clean up temporary files according to the configured retention policy.

> **Architecture note:** FastAPI `BackgroundTasks` is appropriate for lightweight background work, but it is not a durable distributed job queue. Long-running jobs that must survive process restarts may require a dedicated task queue and persistent job state.

---

## 04 — Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Backend | Python 3.11+ | Application logic |
| API Framework | FastAPI | REST endpoints and request validation |
| Data Processing | Pandas | Tabular manipulation and partitioning |
| Excel Processing | OpenPyXL | Excel workbook handling |
| Authentication | Firebase Auth | User identity and Google sign-in |
| Database | Cloud Firestore | User profiles, job vaults, and application state |
| Frontend | HTML5, CSS3, JavaScript ES modules | User interface and interactions |
| Theme Persistence | `localStorage` | Client-side theme preference |
| Hosting | Render | Cloud web service |
| Output Packaging | Python ZIP utilities | Downloadable output archives |

---

## 05 — Repository Structure

```text
sheetsplit-live-excel-splitter/
│
├── api/
│   ├── app/
│   │   └── main.py
│   │       # FastAPI application and API routes
│   │
│   └── requirements.txt
│       # Python dependencies
│
├── public/
│   # Static frontend assets, if organized separately
│
├── workspace.html
│   # Personal job vault and productivity dashboard
│
├── share.html
│   # Public file-sharing interface
│
├── admin.html
│   # Administrative control dashboard
│
├── temp_uploads/
│   # Temporary uploaded files
│
├── temp_outputs/
│   # Generated partitions and ZIP archives
│
├── .env.example
│   # Environment variable template, if maintained
│
├── .gitignore
│   # Git exclusion rules
│
├── Dockerfile
│   # Container configuration, if included
│
├── LICENSE
│
└── README.md
```

**Important:** This is a conceptual structure based on the supplied project description, not a verified inventory of your current repository. Keep only paths that actually exist in your project.

---

## 06 — Local Development

### Prerequisites

- Python 3.11 or higher.
- Git.
- pip.
- A Firebase project with Authentication and Cloud Firestore configured.
- Firebase web application configuration for the frontend, if required by your implementation.

### Step 1 — Clone the Repository

```bash
git clone https://github.com/twinkleroy139/sheetsplit-live-excel-splitter.git
cd sheetsplit-live-excel-splitter
```

### Step 2 — Create a Virtual Environment

**Windows PowerShell**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Linux / macOS**

```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3 — Install Dependencies

```bash
pip install -r api/requirements.txt
```

### Step 4 — Configure Environment Variables

Create a `.env` file in the project root if your backend uses environment-based configuration.

```dotenv
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_firebase_app_id
```

These values are placeholders. Replace them with the configuration appropriate to your Firebase project.

**Security considerations:**

- Never commit real secrets, service-account JSON files, or private keys.
- Firebase web configuration is generally intended to be used by client applications, but it is not an authorization mechanism. Protect data using Firebase Security Rules and server-side authorization.
- If the backend uses a Firebase Admin SDK service-account credential, keep that credential private and configure it securely.
- Load environment variables using the method supported by your application; a `.env` file is not automatically loaded by every Python process.

### Step 5 — Start the Development Server

From the repository root:

```bash
uvicorn api.app.main:app --reload --host 127.0.0.1 --port 8000
```

Open:

```text
http://127.0.0.1:8000
```

If your frontend is served separately as static files, open it using your configured local web server. The exact frontend serving path depends on the existing project configuration.

### Step 6 — Explore the API

If FastAPI's documentation endpoints are enabled, visit:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

---

## 07 — API Reference

The following table documents the endpoints described by the project. Confirm the exact paths, request schemas, authentication requirements, and response formats against the current FastAPI implementation.

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `POST` | `/upload/init` | Upload a file and return a schema preview | Public or configured access |
| `POST` | `/jobs` | Start a spreadsheet partitioning job | Optional, depending on configuration |
| `GET` | `/jobs/{job_id}/outputs` | Inspect job progress and available outputs | Verify ownership rules |
| `GET` | `/jobs/{job_id}/download/{filename}` | Download an individual output file | Verify ownership rules |
| `GET` | `/jobs/{job_id}/download-zip` | Download all job outputs as ZIP | Verify ownership rules |
| `DELETE` | `/jobs/{job_id}` | Delete a job and its temporary outputs | Verify ownership rules |
| `POST` | `/jobs/share/create` | Create an expiring share link | Authenticated |
| `GET` | `/jobs/share/{token}/info` | Validate share metadata and expiration | Public token access |
| `GET` | `/admin/metrics` | Retrieve system metrics | Admin authorization |
| `POST` | `/admin/cleanup` | Purge temporary files and outputs | Admin authorization |

### Example — Upload and Preview

```http
POST /upload/init
Content-Type: multipart/form-data
```

The upload workflow is designed to return schema information and a small data preview before the user configures the partitioning job.

### Example — Start a Job

```http
POST /jobs
Content-Type: application/json
```

The job request contains the partitioning mode and its relevant options. The exact JSON fields depend on the backend implementation.

### Example — Retrieve Job Outputs

```http
GET /jobs/{job_id}/outputs
```

The response is expected to expose the job's status and available output information according to the API's response schema.

**API note:** These examples describe the endpoint contract at a high level. Use the actual request and response models from the running application for executable API examples.

---

## 08 — Performance & Benchmarks

Spreadsheet performance depends on input format, file size, column count, data types, partitioning strategy, compression, CPU allocation, and available memory.

The following figures are **project-reported benchmark results**, not independently verified measurements.

| Input Dataset | Operation | Reported Time | Reported Peak Memory |
|---|---|---:|---:|
| 50,000 rows · CSV · 18 MB | 5 equal partitions | ~1.1 s | <85 MB |
| 100,000 rows · XLSX · 32 MB | 25,000 rows per batch | ~3.2 s | <140 MB |
| 250,000 rows · CSV · 74 MB | Column-based split | ~5.8 s | <210 MB |
| 500,000 rows · CSV · 160 MB | 10 partitions + ZIP | ~9.4 s | <380 MB |

### Benchmarking Recommendations

For reproducible engineering results, record:

- CPU and RAM allocation.
- Operating system and Python version.
- Input file size and row/column counts.
- Spreadsheet format and partitioning strategy.
- End-to-end elapsed time.
- Peak resident memory.
- Output size and compression time.
- Whether the input and output were cached.

**Memory warning:** A 512 MB container can run out of memory when processing large workbooks if Pandas, workbook parsing, output serialization, and ZIP creation hold multiple copies of the data simultaneously. Test realistic workloads on the actual deployment tier before advertising maximum supported dataset sizes.

---

## 09 — Security & Data Hygiene

SheetSplit processes user-uploaded files and may handle sensitive business datasets. Security must cover both the API and the underlying file lifecycle.

### Authentication & Authorization

- Verify Firebase ID tokens on protected backend endpoints.
- Enforce admin privileges server-side.
- Check job ownership before permitting private downloads or deletion.
- Apply appropriate Firestore Security Rules.
- Do not trust user IDs, roles, or permissions supplied only by the browser.

### File Handling

- Validate file types, file sizes, archive contents, and filenames.
- Prevent path traversal when extracting ZIP archives or serving downloads.
- Generate server-side filenames rather than trusting uploaded filenames.
- Restrict archive extraction to approved directories.
- Protect against ZIP bombs and oversized or malformed workbooks.
- Ensure temporary output files cannot be accessed through predictable public paths.

### Sharing

- Generate high-entropy, unpredictable share tokens.
- Enforce expiration and PIN checks on the server.
- Rate-limit PIN attempts.
- Avoid logging complete share tokens or PINs.
- Ensure that shared downloads cannot be used to bypass authorization on unrelated jobs.

### Temporary Storage

Uploads and generated outputs are stored in the configured temporary directories:

```text
temp_uploads/
temp_outputs/
```

These directories should be excluded from Git if they contain uploaded or generated data.

```gitignore
.env
.env.*
!.env.example

venv/
__pycache__/
*.py[cod]

temp_uploads/*
temp_outputs/*

firebase_service_account.json
service-account.json
```

Add any additional credential files, database files, or private configuration paths used by your actual implementation.

**Deployment warning:** Temporary container filesystems may be erased when a cloud service restarts or redeploys. If users need reliable access to generated files, use an appropriate persistent storage or object-storage solution and define a retention policy.

---

## 10 — Production Deployment

SheetSplit is deployed at the following address:

**[https://sheetsplit-api.onrender.com](https://sheetsplit-api.onrender.com)**

For a Render deployment:

1. Push the application to GitHub.
2. Create or open the relevant Render Web Service.
3. Configure the correct runtime or Docker environment for the repository.
4. Set the required environment variables.
5. Configure the service's startup command and health-check path if needed.
6. Verify Firebase authentication and Firestore access.
7. Test uploads, all partitioning modes, downloads, sharing, and cleanup.
8. Confirm that memory, disk usage, and timeout limits match the expected workload.

For production workloads that require durable background processing, consider a persistent task queue, a separate worker process, and object storage for output files.

---

## 11 — Limitations & Engineering Considerations

- Large XLSX files can require substantially more memory than similarly sized CSV files.
- Background tasks running inside the web process may not survive restarts.
- Local temporary files are not automatically durable storage.
- Performance depends on the deployment tier and the characteristics of the uploaded data.
- Firebase client configuration does not replace backend authentication or database security rules.
- API access labels in documentation must match the authorization enforced by the actual server.

These considerations should be evaluated before using the application for critical business processing.

---

## 12 — License

This project is licensed under the **MIT License**.

See the [`LICENSE`](LICENSE) file for the complete license terms.

---

## 13 — Author & Project

**Twinkle Roy**

SheetSplit demonstrates practical engineering across:

**Python · FastAPI · Pandas · OpenPyXL · Firebase · Firestore · REST APIs · Asynchronous Workflows · Data Processing · Cloud Deployment**

The project focuses on scalable spreadsheet partitioning, secure file delivery, and practical cloud-based data workflows.

If you find SheetSplit useful, consider starring the repository and reporting issues or suggesting improvements.

<div align="center">

**SheetSplit ⚡ — Slice datasets. Simplify workflows.**

[Live Application](https://sheetsplit-api.onrender.com) · [GitHub Repository](https://github.com/twinkleroy139/sheetsplit-live-excel-splitter)

</div>