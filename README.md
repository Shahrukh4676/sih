# NEXUS AI

> **Transform once. Communicate everywhere.**

NEXUS AI is an enterprise AI Content Intelligence, Zero-Trust Transformation, and Multi-Channel Distribution Platform. It empowers organizations to securely ingest complex technical assets (research papers, threat advisories, whitepapers, documents, and web URLs), synthesize them into audience-tailored communications, verify them through layered prompt injection defenses and deterministic factual grounding, enforce human-in-the-loop governance, and automate publishing to social and enterprise communication channels.

---

## Core Product Lifecycle

NEXUS AI operates on a deterministic six-stage lifecycle:

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. DISCOVER │ ──> │ 2. UNDERSTAND│ ──> │  3. PROTECT  │
│  Ingestion   │     │  Extraction  │     │  Zero-Trust  │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│6. DISTRIBUTE │ <── │  5. APPROVE  │ <── │ 4. TRANSFORM │
│ LinkedIn/WA  │     │  Governance  │     │  Synthesis   │
└──────────────┘     └──────────────┘     └──────────────┘
```

1. **Discover (Ingest)**: Ingest PDF documents, research whitepapers, threat bulletins, plain text, or live webpage URLs.
2. **Understand**: Deconstruct source materials into semantic entities, claims, key findings, and contextual relationships.
3. **Protect**: Execute layered zero-trust screening to neutralize prompt injections, redact credentials, and isolate untrusted data inside passive boundaries.
4. **Transform**: Synthesize platform-tailored content (LinkedIn posts, executive summaries, threat advisories) through Prompt Intelligence, strictly adhering to brand voice and audience constraints.
5. **Approve**: Route outputs to a Human-in-the-Loop Approvals Center with side-by-side evidence references, trust score breakdowns, and revision feedback.
6. **Distribute**: Publish directly to verified channels (official LinkedIn REST API, Meta WhatsApp Business Cloud, and connected webhooks).

---

## Core Product Modules

NEXUS AI provides a unified, authenticated user experience structured around six key workflows:

### 1. Interactive Creation Workspace (`/app/create`)
- **Multi-Modal Ingestion**: Upload PDFs, paste raw research, or ingest external URLs with SSRF protection.
- **Intent Engine**: Automatically infers recommended format, target audience, tone, and communication objective from source text.
- **Brand & Governance Directives**: Enforces banned phrases, compliance disclaimers, and detail level constraints.
- **Real-Time Security Intervention**: If source content contains prompt injections or credentials, execution halts immediately with a clear 4-pillar explanation and defensive checklist.

### 2. Automations Platform v2.0 (`/app/automations`)
- **Dual Creation Paths**:
  - **Natural Language Intent**: Describe desired workflows in plain English (e.g., *"Whenever a new research paper is uploaded, create a LinkedIn post and request human approval"*); Prompt Intelligence configures the pipeline.
  - **8-Step Guided Builder**: Configure Trigger, Source, Transform, Protect, Review, Distribute, Conditions, and Activation.
- **Trigger Types**: New content uploads, recurring cron schedules (daily, weekly, weekdays), security CVE advisories, and rolling weekly digests.
- **Safe Dry-Run Sandbox**: Simulates the full pipeline—understanding, transformation, and security checks—without distributing to live channels or consuming quotas.
- **30-Day Reliability Index (Health Score)**: Calculates health (0–100) using Run Success Rate (40%), Avg Trust Score (25%), Approval Retention (15%), Recency (10%), and Security Interventions (10%).
- **Cryptographic Content Lineage**: Visual backward traceability linking published post $\to$ run telemetry $\to$ source excerpts $\to$ security verdict $\to$ approver.
- **Immutable Version History**: Snapshots every update ($v1.0, v2.0, \dots$); in-flight runs remain unaffected, and previous versions can be restored in 1-click.

### 3. Security & Attack Simulator (`/app/security`)
- **Active Defense Dashboard**: Real-time security posture status and recent threat event audit telemetry.
- **Interactive Attack Simulator**: A controlled testing enclave to safely verify how NEXUS stops AI security threats using the real backend Security Engine. Includes 6 live canonical scenarios:
  1. *Direct Prompt Injection*: Instruction override attempting to reveal system instructions.
  2. *Secret Extraction*: Attempting to extract all API keys and environment variables.
  3. *Role Override*: Attempting privilege escalation and administrator role takeover to disable security controls.
  4. *Indirect Prompt Injection*: Malicious directives embedded inside normal enterprise article content.
  5. *Sensitive Information & Honeytoken*: Interception of controlled canary honeytoken (`NEXUS_DEMO_SECRET_7X9Q_FAKE`) and credentials.
  6. *Clean Content Baseline*: Verification that legitimate enterprise content passes cleanly (`ALLOW`) without false positives.
- **Custom Payload Testing**: Editable input allowing teams to safely test custom adversarial variations against the real defense engine.
- **Explainable Reporting**: Provides a 4-pillar summary (*What Happened*, *Why*, *What NEXUS Did*, *Result*) alongside a 6-point defensive checklist.

### 4. Human-in-the-Loop Approvals Center (`/app/approvals`)
- **Review Queue**: Dedicated queue for content awaiting human signoff.
- **Side-by-Side Verification**: Displays generated text alongside extracted source evidence excerpts.
- **1-Click Actions**: **Approve & Publish**, **Regenerate with Feedback**, or **Reject**.
- **Governance Gate**: Hard security blocks cannot be approved; only clean, verified content can reach distribution.

### 5. Activity & Tamper-Evident Audit (`/app/activity`)
- **Real-Time Operational Telemetry**: Chronological stream of source ingestions, transformations, security interventions, and publishing events.
- **Cryptographic SHA-256 Hash Chaining**: Every audit entry is cryptographically linked to the previous entry, preventing historical log tampering.
- **Filterable Timeline**: View events by All, Content, Automations, Approvals, Security Checks, or Distribution.

### 6. Workspace Settings & Profile (`/app/settings`, `/app/profile`)
- **Brand Voice Directives**: Customize tone, target audience, banned phrases, and mandatory compliance disclaimers.
- **Integrations**: Manage LinkedIn OAuth 2.0 connection, Meta WhatsApp Business Cloud linking, and webhook keys.
- **Security Preferences**: Two-factor authentication controls and quick link to the Security Attack Simulator.

---

## Layered Zero-Trust Security Pipeline

> **Core Principle**: External content is data. External content is never trusted as instructions.

NEXUS AI protects AI processing through five coordinated defense layers:

```text
                    [ INGESTION PAYLOAD ]
                              │
┌─────────────────────────────▼─────────────────────────────┐
│ LAYER 1 — NORMALIZATION                                   │
│ Unicode NFKC, zero-width stripping, whitespace collapse   │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│ LAYER 2 — RULE-BASED DETERMINISTIC DETECTION             │
│ Direct instruction overrides, persona hijack, bypasses    │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│ LAYER 3 — STRUCTURAL & HEURISTIC DETECTION                │
│ Multi-vector combinations, indirect document markers,     │
│ delimiter tampering (<source>, [INST], etc.)              │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│ LAYER 5 — SENSITIVE INFORMATION & CANARY SCREENING        │
│ Credentials, JWTs, API keys, PII + Honeytoken interceptor │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│ LAYER 4 — SECURITY CLASSIFIER & ENTERPRISE REPORTING      │
│ Deterministic policy: ALLOW / REVIEW / BLOCK              │
│ Generates: 4-part report (What, Why, Action, Result)      │
└─────────────────────────────┬─────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
         [ BLOCK / REVIEW ]               [ ALLOW ]
               │                             │
    • Halted immediately             • Isolated inside
    • Audit log (SHA-256)              <source_document_data_untrusted>
    • UI Intervention Card           • Prompt Intelligence & Transform
    • Zero publishing possible       • Output Validation Gate
```

* **Layer 1 (Normalization)**: Preserves the raw source separately while normalizing analysis text via Unicode `NFKC`, removing zero-width characters (`\u200B-\u200D`, `\uFEFF`, `\u200E-\u200F`), and resolving obfuscated spacing.
* **Layer 2 (Rule-Based Detection)**: Deterministically detects instruction overrides (`"ignore all previous instructions"`, `"disregard rules"`), persona hijacks (`"you are now..."`, `"act as system"`), and bypass directives (`"bypass security"`, `"disable safety"`).
* **Layer 3 (Structural Heuristics)**: Identifies correlated multi-vector attacks (override combined with system prompt or secret extraction), indirect injection markers in documents (`"IMPORTANT AI INSTRUCTION:"`), and delimiter boundary tampering (`<source>`, `[INST]`, `<|im_start|>`).
* **Layer 4 (Classifier & Reporting)**: Assigns calibrated confidence scores, records detection and policy versions (`nexus-defense-v2.4`, `zero-trust-policy-v2`), and produces plain-language enterprise explanations.
* **Layer 5 (Secrets & Honeytokens)**: Detects AWS access keys, GitHub PATs, JWT tokens, Bearer tokens, private keys, passwords, and PII. Masks all evidence (`sk_live_••••••••`). Detects non-functional decoy canary honeytokens (`NEXUS_DEMO_SECRET_7X9Q_FAKE`).
* **Safe Context Boundary**: External data is wrapped in strict `<source_document_data_untrusted>` boundaries with explicit directives to the LLM that enclosed content is passive data and cannot redefine system instructions.
* **Output Validation**: Screens generated outputs for system prompt leakage, credential exposure, or canary reproduction before reaching the user.
* **Fail-Closed Guarantee**: Any unexpected exception during screening pauses processing and defaults to `BLOCK`.

---

## Deterministic Trust Score (0–100)

Every synthesized artefact is evaluated by a multi-pillar scoring formula:

$$\text{Trust Score} = 40\% \times \text{Security} + 25\% \times \text{Grounding} + 20\% \times \text{Compliance} + 15\% \times \text{Governance}$$

| Pillar | Weight | Evaluation Criteria |
| :--- | :---: | :--- |
| **Security** | 40% | Zero prompt injections, zero exposed credentials, zero delimiter anomalies. |
| **Factual Grounding** | 25% | Percentage of factual claims and statistics verifiable against source document paragraphs. |
| **Brand Compliance** | 20% | Conformance to length, tone, prohibited word exclusions, and mandatory disclaimers. |
| **Human Governance** | 15% | Status in the human-in-the-loop review and signoff lifecycle. |

---

## Multi-Channel Distribution

* **LinkedIn Integration**: Real OAuth 2.0 connection using LinkedIn’s official REST API (Version 202608) with AES-256-GCM encrypted token storage.
* **Meta WhatsApp Business Cloud API**: Verified message templates, alert broadcasts, and interactive approval messaging.
* **Webhook Architecture**: HMAC-signed webhook delivery for external pipeline integration.
* **Fail-Closed Distribution Gate**: Content blocked by security can never be published. Direct publishing is prohibited without verified state.

---

## Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router, Turbopack) | Responsive server-rendered and client-side architecture |
| **Language** | TypeScript 5 | Strict end-to-end static type safety |
| **Styling & Icons** | Tailwind CSS v4, Lucide React, Motion | Enterprise-grade clean design system and fluid animations |
| **Persistence & Auth** | Firebase (Auth, Cloud Firestore) | Document persistence with in-memory caching for performance |
| **AI Reasoning** | Google Gemini (`gemini-1.5-flash`), Ollama (`llama3.2`) | Free-first cloud reasoning with automatic local offline fallback |
| **Social Distribution** | LinkedIn REST API (v202608) | Official member post creation with encrypted tokens |
| **Mobile Messaging** | Meta WhatsApp Business Cloud API | Direct notification templates and webhook processing |
| **Cryptography** | Web Crypto API (SHA-256, AES-256-GCM) | Token encryption at rest and audit log hash chaining |

---

## Project Structure

```text
nexoura/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Login, signup, and onboarding routes
│   │   ├── app/                     # Authenticated SaaS application
│   │   │   ├── page.tsx             # Dashboard overview
│   │   │   ├── create/              # 5-step creation wizard with security intervention
│   │   │   ├── automations/         # Automations Platform v2.0
│   │   │   │   ├── page.tsx         # Automation cards, health index & templates
│   │   │   │   ├── new/             # 8-step builder & natural language intent prompt
│   │   │   │   └── [id]/            # 5-tab detail workspace (Workflow, Runs, Health, Lineage, Settings)
│   │   │   ├── approvals/           # Human governance & review center
│   │   │   ├── activity/            # Real-time event log & SHA-256 audit trail
│   │   │   ├── security/            # Security Dashboard & interactive Attack Simulator
│   │   │   ├── profile/             # User profile & organization affiliation
│   │   │   └── settings/            # Brand voice, integrations, and preferences
│   │   └── api/                     # Server-side API endpoints
│   │       ├── ai/                  # AI provider routing, status, and health
│   │       ├── approvals/           # Approval and rejection handlers
│   │       ├── audit/               # Audit log querying and hash verification
│   │       ├── automation/          # Automation execution, rules, simulation, health, lineage
│   │       ├── content/             # Content retrieval, regeneration, and visual generation
│   │       ├── integrations/        # LinkedIn OAuth & publishing endpoints
│   │       ├── security/            # Source and output security scanner routes
│   │       └── whatsapp/            # Meta WhatsApp Cloud webhook & dispatch
│   ├── components/                  # Reusable UI component library (Button, Badge, Modal, etc.)
│   ├── context/                     # Global state providers (AuthContext)
│   ├── hooks/                       # Custom React hooks (useAutomations, useContent, etc.)
│   ├── lib/                         # Core platform services & business logic
│   │   ├── ai/                      # AI provider router, prompt safety, and source analysis
│   │   ├── firebase/                # Firebase client configuration and Firestore helpers
│   │   ├── integrations/            # LinkedIn client and token encryption utilities
│   │   ├── security/                # 5-layer SecurityEngine and detection rules
│   │   ├── services/                # Automation, content, audit, and security managers
│   │   └── whatsapp/                # Meta Cloud API message handlers
│   └── types/                       # Central TypeScript domain interfaces
├── scripts/
│   └── verify-security-pipeline.ts  # Automated security & prompt injection test suite
├── public/                          # Static assets and favicons
├── .env.example                     # Environment variables specification
├── package.json                     # Project manifest & scripts
├── tsconfig.json                    # TypeScript compiler configuration
└── next.config.ts                   # Next.js build and optimization configuration
```

---

## Setup Instructions

Follow this step-by-step guide to configure, build, and run NEXUS AI locally.

---

### 1. Prerequisites

Ensure your development environment meets the following requirements:

* **Node.js**: `v18.17.0` or higher (`v20.x` or `v22.x` LTS strongly recommended)
* **Package Manager**: `npm` (comes with Node.js), `pnpm`, or `yarn`
* **Git**: Installed and available in your terminal
* **Accounts (Free Tier)**:
  * **Google AI Studio**: Free Gemini API Key ([https://aistudio.google.com/](https://aistudio.google.com/))
  * **Firebase Console**: Free Spark Plan project for Authentication & Firestore ([https://console.firebase.google.com/](https://console.firebase.google.com/))
  * **LinkedIn Developer App (Optional)**: Required only if testing live OAuth 2.0 posting ([https://www.linkedin.com/developers/apps](https://www.linkedin.com/developers/apps))

---

### 2. Step-by-Step Installation

#### Step 1: Clone the Repository
```bash
git clone https://github.com/Shahrukh4676/sih.git nexoura
cd nexoura
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Configure Environment Variables
Copy the provided `.env.example` template to `.env.local`:

* **macOS / Linux / Git Bash:**
  ```bash
  cp .env.example .env.local
  ```
* **Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env.local
  ```
* **Windows (Command Prompt):**
  ```cmd
  copy .env.example .env.local
  ```

#### Step 4: Populate Credentials in `.env.local`
Open `.env.local` in your preferred code editor and configure the sections below:

##### A. Google Gemini AI (Primary Free-Tier Intelligence)
Obtain your free API key at [https://aistudio.google.com/](https://aistudio.google.com/):
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

##### B. Firebase Authentication & Firestore (Persistence)
In [Firebase Console](https://console.firebase.google.com/):
1. Create a project and register a Web App (`</>`).
2. Enable **Email/Password** under **Authentication → Sign-in method**.
3. Create a **Cloud Firestore** database (Start in test mode or with security rules).
4. Copy your web app config keys into `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

##### C. LinkedIn Publishing (Live or Simulation Mode)
* **Simulation Mode (Recommended for testing without LinkedIn API review):**
  ```env
  LINKEDIN_MODE=simulation
  ```
* **Live Member Mode (Requires registered LinkedIn Developer App with `w_member_social` permission):**
  ```env
  LINKEDIN_MODE=live
  LINKEDIN_CLIENT_ID=your_linkedin_client_id
  LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
  LINKEDIN_REDIRECT_URI=http://localhost:3000/api/integrations/linkedin/callback
  LINKEDIN_API_VERSION=202608
  LINKEDIN_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
  ```

##### D. Optional: Offline Local LLM Fallback (Ollama)
If you prefer running models completely offline without external APIs:
```env
# Install Ollama from https://ollama.ai and run: ollama pull llama3.2
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

---

### 3. Generate Benchmark Security Test PDFs

Generate the verified demo PDFs used in the Create and Ingestion security tests:
```bash
node scripts/generate-demo-pdfs.js
```
This produces two valid PDF 1.4 documents:
* `nexus-prompt-injection-demo.pdf`: Contains embedded adversarial instruction overrides.
* `nexus-research-clean.pdf`: Clean baseline research document.

---

### 4. Run the Security Defense Verification Suite

Before launching the app, verify that all 18 security checkpoints pass:
```bash
npx tsx scripts/verify-security-pipeline.ts
```

---

### 5. Launch the Development Server

Start the Next.js development server powered by Turbopack:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 6. Production Build & Deployment Check

To validate static route generation and production readiness:
```bash
# 1. Run full TypeScript static type check
npx tsc --noEmit

# 2. Build optimized Next.js production bundle
npm run build

# 3. Start production server
npm start
```

---

## Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches Next.js dev server with Turbopack on port `3000` |
| `npx tsc --noEmit` | Validates static TypeScript types across the entire project |
| `npx tsx scripts/verify-security-pipeline.ts` | Executes the 18-point Security & Prompt Injection automated test suite |
| `node scripts/generate-demo-pdfs.js` | Generates benchmark clean and malicious test PDFs |
| `npm run build` | Compiles an optimized production build and checks all dynamic routes |
| `npm start` | Runs the production server using the compiled `.next` bundle |
| `npm run lint` | Runs ESLint to check for code syntax and formatting rules |

---

## Troubleshooting & Common Questions

<details>
<summary><strong>Q: What if port 3000 is already in use?</strong></summary>

You can specify an alternate port when running the dev server:
```bash
npm run dev -- -p 3001
```
</details>

<details>
<summary><strong>Q: Can I demo LinkedIn publishing without a verified LinkedIn Developer Account?</strong></summary>

Yes! Set `LINKEDIN_MODE=simulation` in `.env.local`. NEXUS will simulate the OAuth connection and publishing lifecycle while recording full cryptographic audit events and calculating real Trust Scores.
</details>

<details>
<summary><strong>Q: What if I don't have a Gemini API key yet?</strong></summary>

You can test the entire Security Engine, Attack Simulator, and PDF Ingestion layer immediately. The Security Engine runs locally on the server and does not require third-party API keys to identify prompt injections, honeytokens, credentials, or malicious documents.
</details>

---

## Automated Security Verification

NEXUS includes an automated test suite verifying all 18 core acceptance criteria of the security defense layer:

```bash
npx tsx scripts/verify-security-pipeline.ts
```

**Verified 18-Point Test Matrix:**
* [x] **TEST 1**: Clean user prompt evaluated and permitted (`ALLOW`).
* [x] **TEST 2**: Direct prompt injection (`"Ignore previous instructions"`) blocked (`BLOCK`).
* [x] **TEST 3**: System prompt extraction attempt intercepted and blocked (`BLOCK`).
* [x] **TEST 4**: Secret extraction attempt flagged as high risk (`BLOCK`).
* [x] **TEST 5**: Role override / privilege manipulation blocked (`BLOCK`).
* [x] **TEST 6**: Clean enterprise article passes cleanly (`ALLOW`).
* [x] **TEST 7**: Indirect prompt injection embedded inside normal article text detected and blocked (`BLOCK`).
* [x] **TEST 8**: Real malicious demo PDF (`nexus-prompt-injection-demo.pdf`) extracted and blocked (`BLOCK`).
* [x] **TEST 9**: Real clean demo PDF (`nexus-research-clean.pdf`) extracted and allowed (`ALLOW`).
* [x] **TEST 10**: URL scraped injection and delimiter tampering intercepted (`BLOCK`).
* [x] **TEST 11**: Clean URL content evaluated and allowed (`ALLOW`).
* [x] **TEST 12**: Controlled fake honeytoken (`NEXUS_DEMO_SECRET_7X9Q_FAKE`) detected (`CRITICAL` / `BLOCK`).
* [x] **TEST 13**: Legitimate technical document with words "instructions" and "system" allowed (no false positive).
* [x] **TEST 14**: AI output containing leaked secret blocked by output security gate (`BLOCK`).
* [x] **TEST 15**: Security engine failure defaults to fail-closed protection (`BLOCK`).
* [x] **TEST 16**: Blocked content strictly prevented from reaching publishing gates.
* [x] **TEST 17**: Clean content permitted to continue to Prompt Intelligence and approval.
* [x] **TEST 18**: Attack simulation payloads pass real SecurityEngine and remain isolated from publishing.

---

## Security, Privacy & Compliance Guarantees

* **Encrypted Tokens at Rest**: External OAuth access and refresh tokens are encrypted using AES-256-GCM before storage.
* **Server-Restricted Secrets**: Sensitive credentials (Gemini API keys, LinkedIn secrets, encryption keys) are strictly confined to Node.js server routes.
* **Strict Evidence Masking**: Detected credentials or PII are redacted before storage (`sk_live_••••••••`, `AKIA••••••••`).
* **Cryptographic Audit Integrity**: Historical audit events use SHA-256 hash chaining to ensure immutability.
* **Fail-Closed Architecture**: If any security scanner or boundary check fails unexpectedly, execution halts rather than allowing uninspected data through.
* **Calibrated Claims**: NEXUS employs layered defense-in-depth rather than making unverified claims of "100% security."

---

## License

This project is licensed for enterprise development under the repository terms.
