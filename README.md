# Hydrobot.Ai — Smart Greenhouse & Hydroponic Farm Management

Hydrobot.Ai is a lightweight, high-performance web application and intelligent assistant designed for Controlled Environment Agriculture (CEA), hydroponics, and multi-greenhouse farm operations. It combines real-time environmental telemetry, crop lifecycle tracking, smart inventory reordering, task dispatching, and business analytics with a hybrid, low-latency **Farm Assistant** powered by Google Gemini AI with live web grounding.

---

## 🌾 The Problem & Core Idea

### The Challenge in Modern Agriculture
Growers, greenhouse managers, and vertical farm operators deal with fragmented systems and complex variables:
- **Telemetry Disconnect:** Sensor data (pH, EC, temperature, VPD, water levels) is often disconnected from crop batch lifecycles and harvest schedules.
- **Manual Operations & Reorder Delays:** Tracking seed stock, nutrient supplies, work orders, and harvest yields across multiple greenhouse bays leads to stockouts and missed task deadlines.
- **Support & Knowledge Gaps:** Farmers frequently need instant operational answers (e.g., *"Which inventory items are low?"* or *"What is ready to harvest?"*) as well as complex agronomic guidance (e.g., *"How do I treat blossom end rot?"* or *"What is the optimal VPD for strawberries?"*). Routing every simple request to a cloud LLM introduces unnecessary response latency and API cost.

### The Hydrobot.Ai Solution
Hydrobot.Ai provides a single-page application (SPA) dashboard paired with a Node.js server proxy. It unifies 15 farm management modules and implements a **Hybrid Response-Handling Architecture**:
1. **Instant Direct Data Retrieval:** Queries about current farm state (batches, tasks, low inventory, harvests) are resolved locally in milliseconds directly from application state.
2. **Instant Knowledge Base Matching:** General agronomic questions covered in `knowledge_base.json` (such as hydroponic system specs, VPD targets, chlorosis diagnostics, or IPM) return instant structured answers without an LLM call.
3. **Google Gemini AI with Search Grounding:** Complex agricultural inquiries, technology recommendations, and open-ended farming questions are routed through a server-side proxy to the `@google/genai` SDK using `gemini-3.8-flash` with Google Search grounding enabled for up-to-date research and live web sources.

---

## 🚀 Key Features

### 🏢 1. Core Farm Operations
- **Dashboard:** Farmwide KPIs including total active plants, active greenhouse bays, average plant health index, and projected harvest revenue.
- **Plant Management:** Track crop batches (`[B-101]`), varieties, growth stages (Seedling, Vegetative, Flowering, Ready, Harvested), canopy zones, and health scores.
- **Greenhouse Management:** Real-time environmental telemetry for each greenhouse bay (pH, Electrical Conductivity (EC), temperature, humidity, reservoir water level, CO₂). Includes target tolerance ranges and reset options.
- **Harvest Management:** Log actual harvested kilograms, compute yield variance against estimates, and assign quality grades (Grade A wholesale, Grade B retail, Grade C processing).
- **Farmer Tasks:** Work order dispatch system with priority levels (High, Normal, Low), assignee filters (Diego, Maria, Kwame, Li Wei, Priya), overdue warnings, and completion toggles.
- **Smart Inventory:** Supply tracking for seeds, nutrient salts, growing media, packaging, and pest control with automatic safety reorder thresholds (`qty < threshold`).

### 🧠 2. Agricultural AI & Intelligence
- **Hybrid Farm Assistant:** Natural language assistant supporting instant local data retrieval, structured knowledge base answers, and Google Gemini AI responses with web grounding citations.
- **Crop Nutrition:** Dosing calculators, A/B fertilizer recipes, and chemical balancing guidelines based on recorded pH and EC levels.
- **Disease Detection:** Visual symptom diagnostic guides and crop health photo checks.
- **Production Forecast:** 30-, 60-, and 90-day harvest volume predictions with 90% confidence bands.

### 📊 3. Business Analytics & Logistics
- **Yield Analytics:** Historical monthly production, kg harvested per square meter of canopy, and quality grade distribution splits.
- **Financial Dashboard:** Total revenue from delivered sales, operational expenses categorized by type (nutrients, labor, utilities, supplies), and operating profit margins.
- **Sales & Logistics:** Wholesale customer order pipeline (Pending, Packed, Out for delivery, Delivered) and delivery vehicle dispatch routing.

### 🎨 4. Responsive UX & Personalization
- **Theme Support:** Clean Light Mode and Dark Mode switching via CSS custom properties with persistent `localStorage` preference.
- **Mobile Responsive Header:** Minimal single-row header on mobile devices (`<= 960px`) featuring a centered logo, quick navigation drawer toggle, and a consolidated grid popover menu housing search, farm selector, quick actions, theme toggle, alerts, and role switcher.
- **Role-Based Demo Modes:** Toggle viewing roles (Owner, Farm Manager, Field Worker, Agronomist) to preview permission controls across forms and business dashboards.

---

## 🏗️ Architecture & Technology Stack

```
                               ┌──────────────────────────────────────────────┐
                               │             Client Web Browser               │
                               │  (Single Page App: HTML5, CSS3, Vanilla JS)  │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                    ┌─────────────────┴─────────────────┐
                                    │ HTTP / REST & Static Asset Server │
                                    └─────────────────┬─────────────────┘
                                                      │
                                                      ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                            Server (server.js)                                             │
│                                                Node.js 18+                                                │
│                                                                                                           │
│  ┌───────────────────────────────────┐               ┌─────────────────────────────────────────────────┐  │
│  │       Static File Server          │               │  POST /api/farm-assistant                       │  │
│  │ (index.html, css/, js/, json)     │               │  Gemini Proxy Handler                           │  │
│  └───────────────────────────────────┘               └────────────────────────┬────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┼───────────────────────────┘
                                                                                │
                                                                                ▼
                                                            ┌──────────────────────────────────────┐
                                                            │     Google Gemini AI Platform        │
                                                            │    @google/genai (v3.0.0+)           │
                                                            │   Model: gemini-3.8-flash            │
                                                            │   Tools: Google Search Grounding     │
                                                            └──────────────────────────────────────┘
```

### Technology Highlights
- **Frontend Framework:** Pure Vanilla JavaScript (ES2022+), HTML5, CSS3 with Custom Properties (variables). No build bundlers (Vite/Webpack) required.
- **Charts:** Chart.js 4.4.1 via CDN for sensor telemetry, production forecasts, financial charts, and yield splits.
- **Icons:** SVG-based inline icon rendering (`ic()`).
- **Typography:** Google Fonts (`Manrope` for UI typography, `IBM Plex Mono` for technical numbers and codes).
- **Backend:** Node.js native `http` module micro-server (`server.js`) with zero heavy framework dependencies.
- **AI Integration:** Official `@google/genai` TypeScript/JavaScript SDK with `googleSearch` grounding.

---

## 📁 Project Structure

```
hydrobot-ai/
├── index.html            # Main HTML entry point (sidebar, topbar, view containers, modals, toasts)
├── css/
│   └── styles.css        # Complete application styling (themes, responsive layout, grid, components)
├── js/
│   └── app.js            # Frontend logic (router, store, 15 view modules, hybrid chat, event system)
├── server.js             # Node.js backend proxy & static file server
├── knowledge_base.json   # Predefined QA pairs & keywords for instant local assistant retrieval
├── package.json          # Node.js project manifest & dependencies (@google/genai)
├── metadata.json         # AI Studio applet metadata & capabilities declaration
├── .env.example          # Environment variable template
└── README.md             # Project documentation
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

| Variable | Description | Default | Required |
|---|---|---|---|
| `PORT` | Local HTTP server port | `3000` | No |
| `GEMINI_API_KEY` | API Key from Google AI Studio | — | Yes (for AI Assistant) |
| `GEMINI_MODEL` | Gemini Model ID | `gemini-3.8-flash` | No |

*Note: If `GEMINI_API_KEY` is omitted, the application falls back gracefully to local knowledge base matching and simulated response mode.*

---

## ☁️ Vercel Deployment Settings

When deploying **Hydrobot.Ai** to Vercel:

- **Framework Preset**: **Other** (or leave as Default / Automatic).
- **Build Command**: `echo 'No build step required'` (or leave blank).
- **Output Directory**: `.` (or leave blank).
- **Environment Variables**:
  - `GEMINI_API_KEY`: *(Required)* Your API key from Google AI Studio.
  - `GEMINI_MODEL`: *(Optional)* `gemini-3.8-flash` (or `gemini-2.5-flash`).

*The included `vercel.json` file automatically configures Vercel serverless execution for `server.js` and routes `/api/farm-assistant` requests.*

---

## 🚦 Quickstart & Local Setup

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm**: Included with Node.js

### 1. Installation
Clone the repository and install runtime dependencies:
```bash
git clone https://github.com/NusratJNaurin/Hydrobot-AI.git
cd Hydrobot-AI
npm install
```

### 2. Configure Environment
Set up your `.env` file:
```bash
PORT=3000
GEMINI_API_KEY=your_google_ai_studio_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

### 3. Start Development Server
Run the Node.js application server:
```bash
npm start
```
The server will start at `http://localhost:3000` (or `http://0.0.0.0:3000`).

### 4. Direct Frontend Preview (Optional)
Because the frontend is pure HTML/CSS/JS, static UI pages can also be viewed directly by hosting `index.html` with any static web server (e.g., `python3 -m http.server 8000`). *Note: Invoking the Gemini Farm Assistant requires running `server.js`.*

---

## 🔌 API Documentation

### POST `/api/farm-assistant`

Handles natural language queries sent to the Farm Assistant when a query cannot be answered directly from local state or `knowledge_base.json`.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Body Schema
```json
{
  "question": "What is the recommended slope for NFT hydroponic channels?",
  "history": [
    { "role": "user", "text": "Hello" },
    { "role": "model", "text": "Hello! How can I assist with your farm today?" }
  ],
  "farmContext": "{\"batches\": [...], \"greenhouses\": [...], \"inventory\": [...]}"
}
```

#### Response Schema (200 OK)
```json
{
  "text": "The recommended channel slope for Nutrient Film Technique (NFT) systems is 1:30 to 1:40 (approx. 2.5% to 3.3% grade)...",
  "sources": [
    {
      "title": "NFT Hydroponic Design & Slope Guide",
      "uri": "https://example.com/nft-guide"
    }
  ]
}
```

#### Error Response (500 / 503)
```json
{
  "error": "GEMINI_API_KEY is not configured on the server.",
  "code": "not_configured"
}
```

---

## 🛠️ Development Guidelines & How It Works

### Hash Routing Architecture
The application uses hash-based client-side routing (`window.location.hash`):
- `#dashboard` -> `vDashboard()`
- `#plants` -> `vPlants()`
- `#greenhouses` -> `vGreenhouses()`
- `#assistant` -> `vAssistant()`
- `#inventory` -> `vInventory()`
- `#finance` -> `vFinance()`
- ...and 9 other views defined in the `ROUTES` table inside `js/app.js`.

### Client State & Persistence (`Store`)
- Data records (batches, tasks, inventory, harvests, alerts, orders, financial records) are initialized in memory (`buildDemo()`) and persisted using `localStorage` / `IndexedDB` key-value store (`Store`).
- Modifications via modals (e.g., creating a batch or updating a task) re-render views seamlessly via `scheduleRender()`.

### Theme Engine
Themes are controlled via the `data-theme="dark"` or `data-theme="light"` attribute on `<html>`.
- Color variables are defined in `css/styles.css` under `:root` and `[data-theme="dark"]`.
- UI updates instantly across both desktop and mobile headers.

---

## 📄 License & Attribution

Hydrobot.Ai is an open-source project created for agricultural management and greenhouse automation. Feel free to fork, customize, and build upon this platform.
