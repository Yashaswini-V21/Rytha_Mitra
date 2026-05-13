# Project Backlog

This file is the execution backlog for Rytha Mitra. It is intentionally practical: what is already done, what is partially done, and what must be built next.

## 1. Product Scope Summary

Rytha Mitra currently targets a full advisory experience with:
- Crop recommendation using ML + explainability.
- Market/weather/soil context enrichment.
- Kannada output and voice-first interactions.
- Offline-capable fallback behavior for unstable connectivity.
- Premium demo modules (vision scan, field view, climate cards).

## 2. Current Implementation Status

### 2.1 Done and Working (Verified)
- API routes functional in current codebase:
  - `/health`, `/ready`
  - `/api/recommend`, `/api/weather`, `/api/simulate`, `/api/vision`, `/api/season-plan`
- Frontend module flows functional:
  - Advisory submission and dashboard render
  - Kannada tab render and listen/stop hooks
  - SHAP/soil analytics tab population
  - Vision demo sample load + preview + scan action
  - Field view panel rendering
- Quality checks currently passing:
  - `python -m pytest -q` -> 34 passed, 2 skipped
  - `python tests/docs/validate.py` -> all checks passed

### 2.2 Partially Done
- Kannada voice output supports browser speech synthesis and optional audio payload playback, but voice selection and fallback messaging can be improved.
- Offline mode is resilient, but online/offline confidence and provenance can be surfaced more clearly to users.
- Performance test script exists, but it is not integrated into CI gating.

### 2.3 Known Gaps / Honest Constraints
- Production-grade observability is minimal (no structured request tracing or stage timing dashboard yet).
- Some high-fidelity behaviors depend on external API/service availability and credentials.
- Python 3.14 environment can produce third-party compatibility warnings (non-blocking today, but should be tracked).

## 3. System Architecture (Current)

```text
frontend/
  core.html, core.js, core.css          # main advisory UI
  index.html, climate.html, simulator.html
  lang_engine.js, premium.js

src/
  api/server.py                          # Flask app entry and route handlers
  api/routes/                            # modular routes
  api/schemas/                           # request schema contracts

crew/
  krishi_crew.py                         # orchestration + ML pipeline glue

tools/
  market_price_tool.py
  Karnataka_mandi_prices.json            # offline market fallback

data/
  crop_dataset.csv
  karnataka_soil_health.json

tests/
  unit/, performance/, security/, docs/
```

## 4. Data Flow (Current Runtime)

### 4.1 Advisory Online Path
1. User submits farm form from `frontend/core.html`.
2. `frontend/core.js` builds payload and calls `/api/recommend`.
3. `src/api/server.py` validates payload via Pydantic model.
4. Crew/ML logic executes in `crew/krishi_crew.py`:
   - crop ranking
   - SHAP reasons
   - market/weather/soil enrichment
   - Kannada summary generation
5. Response returns to frontend.
6. Frontend renders advisory, Kannada tab, SHAP tab, and extended cards.

### 4.2 Advisory Offline Fallback Path
1. Network timeout/error in `submitAdvisory`.
2. Frontend local offline engine computes advisory fallback.
3. UI renders fallback with `advisory_mode='offline'` indicators.
4. Kannada text still renders with browser speech option.

### 4.3 Vision Path
1. User loads sample or uploads image.
2. Frontend sends `image_type` to `/api/vision`.
3. API returns diagnosis payload.
4. UI displays diagnosis, confidence, remedy, and prevention.

## 5. Future Enhancements Backlog

## Phase A (Immediate Hardening: 1-2 weeks)

### Platform Reliability
- Add a dedicated smoke script (`health`, `recommend`, `vision`) for one-command sanity checks.
- Add route timeout constants in one config location.
- Add explicit user-facing banners for online/offline provenance.

### Documentation Integrity
- Keep README, backlog, and test docs synchronized each release.
- Add a changelog template with "What changed", "What was tested", "Known limitations".

### Test Governance
- Keep `pytest` and `validate.py` mandatory before merge.
- Add marker usage guidance and quick-run commands in contributor docs.

## Phase B (Quality and Explainability: 2-4 weeks)

### Model Quality
- Publish per-class precision/recall artifacts for crop model.
- Add repeatable evaluation fixtures for representative district scenarios.

### SHAP and Soil Analytics
- Add snapshot regression tests for SHAP payload schema.
- Add UI guard rails when SHAP payload is incomplete.
- Add downloadable explainability summary in advisory report.

### Market and Weather Confidence
- Attach confidence metadata to fallback market/weather values.
- Display data source and fetch timestamp in UI cards.

## Phase C (Product Experience: 1-2 months)

### Kannada and Voice UX
- Add selectable Kannada voices when available.
- Add explicit speech error states and retry actions.
- Improve voice-input parsing for more district/crop synonyms.

### Frontend Robustness
- Add skeleton/loading states for all tab panels.
- Add section-level health badges (crop/soil/weather/market).
- Add in-app diagnostics drawer for demo and debugging.

### Accessibility
- Improve keyboard navigation in tab workflow.
- Add aria labels and contrast checks for dynamic cards.

## Phase D (Scale and Production Readiness: 2-6 months)

### Observability and Operations
- Add structured logs with request IDs and stage durations.
- Add readiness/dependency checks for external providers.
- Add deployment checklist and release rollback notes.

### CI/CD and Governance
- Enforce CI gates:
  - `python -m pytest -q`
  - `python tests/docs/validate.py`
  - optional targeted smoke checks
- Add artifact upload for test reports and load-test summary.

### Data and Expansion
- Expand dataset size and district coverage with governance controls.
- Add feedback-loop pipeline for post-season outcomes.
- Plan multilingual rollout beyond Kannada (Telugu, Marathi, Hindi).

## 6. Task Board (Priority View)

| Priority | Area | Task | Status |
| --- | --- | --- | --- |
| P0 | Reliability | Add local smoke test runner script | Planned |
| P0 | Docs | Keep README/backlog/test docs in release sync | In Progress |
| P1 | Observability | Add request IDs + stage timing logs | Planned |
| P1 | SHAP QA | Add SHAP payload regression tests | Planned |
| P1 | UX | Better online/offline provenance badges | Planned |
| P2 | Voice UX | Kannada voice selection + fallback states | Planned |
| P2 | CI/CD | Add full gate pipeline for tests/validate | Planned |
| P3 | Scale | District/data expansion and feedback loop | Planned |

## 7. Release Definition of Done

- Automated tests pass.
- Repository validator passes.
- Advisory online and offline flows both manually verified.
- Kannada tab and SHAP tab verified with real advisory payload.
- README and docs accurately reflect shipped behavior.
- Known limitations are documented transparently.
