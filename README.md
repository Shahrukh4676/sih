# NEXUS AI

> **Transform once. Communicate everywhere.**

NEXUS AI is an enterprise-grade AI content intelligence, zero-trust transformation, and multi-channel distribution platform. It enables organizations and content teams to securely ingest complex technical assets (research papers, whitepapers, threat advisories, articles, and URLs), synthesize them into audience-tailored formats, verify them against strict security and factual grounding guardrails, enforce human governance, and automate publishing to social and enterprise communication channels.

---

## Core Product Flow

NEXUS AI operates on a deterministic six-stage lifecycle:

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  DISCOVER    │ ──> │  UNDERSTAND  │ ──> │   PROTECT    │
│  Ingestion   │     │  Extraction  │     │  Zero-Trust  │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  DISTRIBUTE  │ <── │   APPROVE    │ <── │  TRANSFORM   │
│  LinkedIn/WA │     │  Governance  │     │  Synthesis   │
└──────────────┘     └──────────────┘     └──────────────┘
```

1. **Discover (Ingest)**: Upload PDF documents, technical research, threat bulletins, raw text, or live webpage URLs.
2. **Understand**: Deconstruct source materials into semantic entities, claims, key findings, and contextual relationships.
3. **Protect**: Perform autonomous pre-execution security screening to eliminate prompt injections, scrub sensitive PII/secrets, and verify factual grounding against the source.
4. **Transform**: Synthesize platform-tailored content (LinkedIn posts, executive summaries, threat bulletins) through Prompt Intelligence, adhering to brand voice and target audience guidelines.
5. **Approve**: Route outputs to a Human-in-the-Loop Approvals Center with side-by-side evidence references, confidence scores, and feedback controls.
6. **Distribute**: Publish directly to verified channels (official LinkedIn REST API, Meta WhatsApp Business Cloud, and connected workflow webhooks).

---

## Key Features & Capabilities

### 1. Ingestion & Semantic Understanding
- Supports multi-format ingestion: PDF documents, research papers, technical advisories, URLs, and plain text.
- Extracts key takeaways, factual claims, and entity mappings with source citation tracking.
- Prepares structured context blocks for deterministic model reasoning.

### 2. Zero-Trust Security Pipeline
- **Prompt Injection Defense**: Scans incoming content for delimiter manipulation, instruction overrides, and adversarial exploits.
- **Sensitive Data & Secret Protection**: Detects and redacts API keys, credentials, private tokens, and personally identifiable information (PII).
- **Factual Hallucination Prevention**: Verifies that generated statements are grounded in source excerpts prior to human review.

### 3. Prompt Intelligence & Transformation Engine
- Multi-format generation:
  - **LinkedIn Posts**: Hook-driven, professional, engagement-optimized social posts with hashtags.
  - **Executive Summaries**: High-level distillation for leadership and decision-makers.
  - **Cybersecurity & Threat Advisories**: CVE details, severity scoring, technical impact, and remediation steps.
- Configurable parameters: tone (Professional, Executive, Technical, Casual), audience targeting, and brand guidelines.
- **₹0 Free-First AI Architecture**: Runs on Google Gemini API (`gemini-1.5-flash` free tier) with automatic local offline fallback to Ollama (`llama3.2` on `localhost:11434`).

### 4. Deterministic Trust Scoring (0–100)
Every generated output receives an auditable, formulaic Trust Score:

$$\text{Trust Score} = 40\% \times \text{Security} + 25\% \times \text{Grounding} + 20\% \times \text{Compliance} + 15\% \times \text{Governance}$$

- **Security (40%)**: Clean scan across injection shields and secret detectors.
- **Factual Grounding (25%)**: Mathematical match percentage between generated claims and source paragraphs.
- **Policy Compliance (20%)**: Conformance to length, tone, and brand disclaimers.
- **Human Governance (15%)**: Verification and signoff state in the approval lifecycle.

### 5. Human-in-the-Loop Approvals Center
- Role-based review queue for all generated content.
- Side-by-side comparison of source documents and AI outputs.
- One-click actions: **Approve & Publish**, **Regenerate with Feedback**, or **Reject**.
- Direct dispatch to integrated distribution channels upon approval.

### 6. Automations Platform v2.0
A complete workflow execution and scheduling platform:
- **Creation Options**:
  - **Natural Language Intent**: Describe workflows in plain text (e.g., *"Whenever I upload a research paper, create a LinkedIn post and request approval"*); Prompt Intelligence translates this into structured configurations.
  - **8-Step Guided Builder**: Configure Trigger, Source, Transform, Protect, Review, Distribute, Conditions, and Activation.
- **Trigger Types**:
  - `Content Uploaded`: Triggered when a new PDF or document is attached.
  - `Recurring Schedule`: Daily, weekday, or weekly recurrence with timezone support.
  - `Security Advisory`: Auto-triggers upon detection of high-severity CVEs or threat reports.
  - `Scheduled Digest`: Aggregates rolling weekly updates into a consolidated briefing.
- **Safe Simulation Sandbox (Dry Run)**: Safely test understanding, transformation, and security checks without publishing to live channels or consuming distribution quotas.
- **30-Day Rolling Reliability Index (Health Score)**: Evaluates automation stability based on Run Success Rate (40%), Avg Trust Score (25%), Approval Retention (15%), Recency (10%), and Security Interventions (10%).
- **Cryptographic Content Lineage**: Backwards traceability tree linking published output $\to$ run telemetry $\to$ source document excerpts $\to$ security screening $\to$ approver.
- **Immutable Version History**: Every update snapshots the definition ($v1.0, v2.0, \dots$); in-flight executions remain unaffected, and previous versions can be restored in 1-click.
- **Manual Override**: Cancel in-flight or waiting executions at any time.

### 7. Multi-Channel Distribution
- **LinkedIn Integration**: Real OAuth 2.0 connection using LinkedIn’s official 202608 REST API with AES-256-GCM encrypted token storage.
- **Meta WhatsApp Business Cloud API**: Automated broadcast alerts, message templates, and interactive approval notifications.
- **Workflow Webhooks**: Secure HMAC-signed triggers and callback processing for external orchestration.

### 8. Tamper-Evident Activity & Audit Trail
- Comprehensive event logging for all user, transformation, security, and publishing actions.
- Cryptographic SHA-256 hash chaining to verify timeline integrity.

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router, Turbopack) | Fast, responsive server-rendered and client-side UI |
| **Language** | TypeScript 5 | Strict end-to-end type safety |
| **UI Library** | React 19, Tailwind CSS v4, Lucide React, Framer Motion | Enterprise design system and micro-animations |
| **Database & Auth** | Firebase (Auth, Cloud Firestore) | Identity management and document persistence with in-memory caching |
| **AI Providers** | Google Gemini (`gemini-1.5-flash`), Ollama (`llama3.2`) | Free-first, zero-budget cloud and local offline LLM reasoning |
| **Social Publishing** | LinkedIn REST API (Version 202608) | Official member post creation with encrypted tokens |
| **Messaging** | Meta WhatsApp Business Cloud API | Direct notification templates and webhook processing |
| **Security & Crypto** | Web Crypto API (SHA-256, AES-256-GCM) | Token encryption and audit log hash chaining |

---

## Project Structure

```text
nexoura/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Login, signup, and onboarding routes
│   │   ├── app/                     # Authenticated SaaS product experience
│   │   │   ├── page.tsx             # Main dashboard
│   │   │   ├── create/              # 5-step manual creation workflow
│   │   │   ├── automations/         # Automations platform
│   │   │   │   ├── page.tsx         # Overview cards, health metrics & templates
│   │   │   │   ├── new/             # 8-step builder & natural language prompt
│   │   │   │   └── [id]/            # 5-tab detail workspace (Workflow, Runs, Health, Lineage, Settings)
│   │   │   ├── approvals/           # Human governance & review center
│   │   │   ├── activity/            # Real-time event log & cryptographic audit trail
│   │   │   ├── profile/             # User profile & organization affiliation
│   │   │   └── settings/            # Brand voice, integrations, and preferences
│   │   └── api/                     # Server-side API endpoints
│   │       ├── ai/                  # Model routing, status, and provider health
│   │       ├── approvals/           # Content approval and rejection actions
│   │       ├── audit/               # Audit log querying and cryptographic verification
│   │       ├── automation/          # Rules, executions, simulation, health, lineage, versions
│   │       ├── content/             # Content retrieval, regeneration, and visual generation
│   │       ├── integrations/        # LinkedIn OAuth & publishing endpoints
│   │       ├── security/            # Source and output scanning engines
│   │       └── whatsapp/            # Meta WhatsApp Cloud webhook & dispatch
│   ├── components/                  # Reusable UI component library (Button, Badge, Modal, etc.)
│   ├── context/                     # Global state (AuthContext)
│   ├── hooks/                       # Custom React hooks (useAutomations, useContent, etc.)
│   ├── lib/                         # Core platform services & business logic
│   │   ├── ai/                      # AI provider router (Gemini / Ollama)
│   │   ├── firebase/                # Firebase client configuration and Firestore helpers
│   │   ├── integrations/            # LinkedIn client and token encryption utilities
│   │   ├── security/                # Injection filters, PII redactors, and grounding verifiers
│   │   ├── services/                # Automation, content, audit, and publishing managers
│   │   └── whatsapp/                # Meta Cloud API message handlers
│   └── types/                       # Central TypeScript domain interfaces
├── public/                          # Static assets and favicons
├── .env.example                     # Environment variables specification
├── package.json                     # Project manifest & scripts
├── tsconfig.json                    # TypeScript compiler configuration
└── next.config.ts                   # Next.js build and optimization configuration
```

---

## Getting Started

### Prerequisites
- **Node.js**: `v18.17.0` or higher
- **Package Manager**: `npm`, `pnpm`, or `yarn`
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Shahrukh4676/sih.git nexoura
   cd nexoura
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Open the Application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Environment Configuration

Configure the following variables in your `.env.local` file:

### 1. Firebase Configuration (Client & Auth)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. AI Provider (Free-First Budget Policy)
```env
AI_PROVIDER=gemini                     # 'gemini' | 'ollama'
GEMINI_API_KEY=your_gemini_api_key     # Free tier from https://aistudio.google.com/
GEMINI_MODEL=gemini-1.5-flash

# Optional: Local Offline LLM Fallback
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### 3. LinkedIn Integration (OAuth 2.0 & Publishing)
```env
LINKEDIN_MODE=live                     # 'live' | 'simulation'
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/integrations/linkedin/callback
LINKEDIN_API_VERSION=202608
LINKEDIN_ENCRYPTION_KEY=your_32_byte_hex_key_for_aes_256_gcm
```

### 4. Meta WhatsApp Business Cloud API (Optional)
```env
WHATSAPP_ACCESS_TOKEN=your_meta_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
```

---

## Development Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with Turbopack on port `3000` |
| `npx tsc --noEmit` | Runs TypeScript static type checking across the entire codebase |
| `npm run build` | Compiles an optimized production build and validates all dynamic routes |
| `npm start` | Starts the production server using the built `.next` bundle |
| `npm run lint` | Runs ESLint to check for code style and syntax consistency |

---

## Security & Privacy Design

- **Zero-Storage of Raw Plaintext Tokens**: External OAuth refresh tokens are encrypted at rest using AES-256-GCM.
- **Client-Side Secrets Protection**: Sensitive backend API keys (Gemini, LinkedIn Secret, Meta App Secret) never carry the `NEXT_PUBLIC_` prefix and are strictly restricted to Node.js server routes.
- **Untrusted Input Isolation**: All user-submitted files and external URLs are treated as untrusted and screened prior to model ingestion.
- **Cryptographic Traceability**: Audit logs use forward SHA-256 hash chaining to ensure historical logs cannot be mutated without invalidating subsequent signatures.
- **No Private Data Training**: User feedback and edits are preserved purely as local configuration preferences (e.g. tone selection), never utilized for external foundational model training.

---

## License

This project is licensed for internal enterprise development under the repository terms.
