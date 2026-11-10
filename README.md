# Hydrobot.Ai

A greenhouse / hydroponic farm management dashboard (single-page app, plain HTML + CSS + JavaScript — no build step).

## Folder structure

```
hydrobot-ai/
├── index.html        Page markup (sidebar, topbar, view container, modal, toasts)
├── css/
│   └── styles.css    All styling (light + dark themes, responsive layout)
├── js/
│   └── app.js        All application logic (data store, views, routing, forms, charts, disease check, chat)
└── README.md
```

## Run it

For the Farm Assistant Gemini integration, install Node.js 18 or newer, create a `.env` file from `.env.example`, and set `GEMINI_API_KEY` to a key from Google AI Studio. Then run:

```
npm start
# then visit http://localhost:8000
```

The server keeps the Gemini API key out of the browser and serves the frontend. Without the key, the assistant displays the API error and falls back to its simulated answers.

To view the frontend without the backend, open `index.html` in a browser. The rest of the dashboard will work, but the Gemini endpoint will not be available.

```
python3 -m http.server 8000
```

## Notes

- Data is demo data generated on load; your changes are saved in the browser's `localStorage`.
- Needs an internet connection for Google Fonts (Manrope, IBM Plex Mono) and Chart.js 4.4.1 (cdnjs). Fonts fall back to system fonts if offline; charts need Chart.js.
- The AI features (photo disease check via Claude, "ask" chat) used the Claude artifact runtime when hosted on claude.ai. Outside it, the app falls back to its built-in simulated analysis. Device/IoT integration is a non-functional prototype stub.
- Navigation uses hash routes (e.g. `#dashboard`).
