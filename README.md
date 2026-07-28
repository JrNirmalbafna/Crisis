# Crisis Intelligence Platform

**Physics-Informed, Trustworthy AI Scientific Decision Support for Space Weather & CME Transit Forecasting**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.1+-EE4C2C.svg?style=flat&logo=PyTorch&logoColor=white)](https://pytorch.org)
[![AWS](https://img.shields.io/badge/AWS-Amplify%20%7C%20App%20Runner-232F3E.svg?style=flat&logo=AmazonAWS&logoColor=white)](https://aws.amazon.com)

---

## 🛰️ Overview

**Crisis Intelligence** is a comprehensive, production-grade space weather prediction and decision-support platform designed for aerospace engineers, power grid operators, and mission planners. 

The system ingests real-time solar wind and magnetic field data from the **Lagrange 1 (L1)** constellation (**DSCOVR**, **ACE**, **WIND**, **SOHO**, and **Aditya-L1**), applies physics-informed neural network (PINN) ensemble models, and enforces strict **Magnetohydrodynamic (MHD) Rankine-Hugoniot** conservation laws before authorizing automated operational advisories.

> **Core Philosophy**: *Machine learning proposes; physics disposes; decision support acts only on validated outputs.*

---

## ✨ Key Features & Capability Modules

### 1. 🖥️ Mission Control Center
- **NASA Space Observatory HUD Status Cards**: Real-time metric cards for CME transit speed, AI ensemble consensus, MHD physics validation status, NOAA SWPC alert scales ($G/S/R$), and L1 constellation ground lock status.
- **Dynamic Database Telemetry**: Reads CME propagation speeds directly from database event metadata without hardcoded fallbacks.
- **Aditya-L1 & SDO Solar Viewer**: Live multi-wavelength solar imagery viewer streaming EUV channels (AIA 171Å Coronal Loops, AIA 304Å Chromosphere Filaments, AIA 193Å Coronal Holes) with automatic SOHO/NOAA fallback feeds.
- **SOHO LASCO C2 Coronagraph**: Live white-light CME tracker.
- **Ovation Auroral Forecast**: Polar precipitation probability maps.

### 2. ⚡ Multi-Agent Data Fusion Core
- Real-time sensor weighting and trust score allocation across **DSCOVR**, **ACE**, **WIND**, and **SOHO**.
- Live streaming of Interplanetary Magnetic Field ($B_x, B_y, B_z$), Proton Density ($N_p$), Solar Wind Speed ($V_{\text{sw}}$), and X-Ray Flux.
- Authoritative `/api/v1/fusion/satellite-health` REST endpoint returning satellite health, packet loss, and latency metrics.

### 3. 🧠 Physics-Informed AI & Explainability
- **Ensemble Consensus Engine**: Combines **PINN** (Physics-Informed Neural Networks), **XGBoost**, and **Transformer** models for CME transit time and geomagnetic storm intensity forecasting.
- **SHAP Feature Attribution**: Quantifies physical drivers (Solar Wind Dynamic Pressure $P_{\text{dyn}}$, Southward $B_z$ Coupling, CME Transit Speed $V_{\text{CME}}$).
- **What-If Counterfactual Simulator**: Interactive parameter sliders enabling operators to simulate extreme space weather scenarios.

### 4. 🌐 3D Heliospheric Event Analysis
- Interactive 3D WebGL solar system orbit viewer rendering inner planet orbits (Mercury, Venus, Earth, Mars) and expanding CME shock cones.
- Automated sector-specific advisories for Power Grids, Aviation, Satellite Operations, GPS Systems, and Astronaut Radiation Safety.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 6 — Presentation                                         │
│  React + Vite + TypeScript HUD Dashboard (Timeline, 3D, Viz)   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 5 — Decision Support                                     │
│  Stakeholder Action Plans & Automated Sector Advisories         │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4 — Trust & Validation Gatekeeper                       │
│  MHD Rankine-Hugoniot Shock Conditions & Energy Conservation    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3 — AI & Modeling Core                                   │
│  Detection → PINN/XGBoost Prediction → UQ → SHAP Explainability │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2 — Multi-Agent Data Fusion                              │
│  Satellite Ingestion, Reliability Weighting, Missing Data Rec. │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1 — Spacecraft Telemetry Feeds                           │
│  Aditya-L1, SOHO, DSCOVR, ACE, WIND, GOES-18                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Python 3.9+**
- **Node.js 18+** & `npm`

### 1. Start Backend API Server
```bash
# Navigate to project root
cd Crisis

# Install Python dependencies
pip install -r requirements.txt

# Launch FastAPI server on port 8000
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
```
*API Swagger Documentation will be available at `http://localhost:8000/docs`.*

### 2. Start Frontend Dev Server
```bash
# Navigate to dashboard directory
cd "Crisis Dashboard"

# Install npm packages
npm install

# Launch Vite development server
npm run dev
```
*Access the dashboard at `http://localhost:5173`.*

---

## ☁️ Cloud Deployment Options

### Option A: AWS Deployment (Amplify + App Runner)
1. **Frontend (AWS Amplify)**:
   - Connect repository `https://github.com/JrNirmalbafna/Crisis`.
   - Build Settings: `cd "Crisis Dashboard" && npm ci && npm run build`
   - Output directory: `Crisis Dashboard/dist`
2. **Backend (AWS App Runner)**:
   - Connect repository `https://github.com/JrNirmalbafna/Crisis`.
   - Start command: `uvicorn backend.api.main:app --host 0.0.0.0 --port 8000`

### Option B: Drag-and-Drop Static Deployment (Netlify Drop / Tiiny.host)
1. Build production static bundle:
   ```bash
   cd "Crisis Dashboard"
   npm run build
   ```
2. Drag and drop the generated `Crisis Dashboard/dist` folder into [app.netlify.com/drop](https://app.netlify.com/drop) or [tiiny.host](https://tiiny.host).

---

## 🧪 Verification & Automated Testing

Run the full end-to-end backend API audit:
```bash
python audit_backend.py
```

Runs diagnostic checks across all REST endpoints:
- `GET /events/`
- `GET /fusion/latest`
- `GET /fusion/satellite-health`
- `GET /predictions/consensus/event/1`
- `GET /predictions/explainability/feature-importance`
- `GET /recommendations/event/1`

---

## 📜 License & Citation

Licensed under the MIT License. Developed for scientific research, space weather hazard mitigation, and aerospace decision support.
