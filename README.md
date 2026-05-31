<div align="center">
  <h1>GridMind</h1>
  <p><strong>Dark-themed, immersive AI smart grid monitoring & operations dashboard.</strong></p>
</div>

<br />

GridMind is an advanced visualization dashboard built to monitor and interact with a simulated Reinforcement Learning (RL) agent operating a modern power grid. It provides real-time insights into grid topology, agent decisions, carbon offsets, and load balancing—all wrapped in a highly polished, dark-glassmorphism aesthetic.

Whether you're presenting AI operations to stakeholders, analyzing explainable AI (XAI) metrics, or interacting with a mock grid under stress, GridMind offers an unparalleled immersive experience.

---

## ⚡ Key Features

- 🌍 **Immersive Landing Page**: Rotating interactive globe, live ticker streams, and animated key metrics to set the stage.
- 🎛️ **Live Interactive Simulation (`/demo`)**: A real-time grid topology visualization. Watch as the AI agent routes power from sources (Solar, Wind) through substations to critical loads (Hospitals, Industrial Zones). Includes event injection (e.g., *Storm Warning*, *Solar Dropout*).
- 🧠 **Explainable AI (XAI) Hub (`/xai`)**: Deep dive into *why* the agent made a decision using SHAP value waterfalls, decision history, and operator Q&A.
- 📊 **Advanced Analytics (`/analytics`)**: Live CO₂ emission delta charts, grid frequency heatmaps, and agent reward curves built with Recharts.
- 🔄 **Agent Flow Canvas (`/flow`)**: Node-based logic canvas utilizing React Flow to inspect the AI's internal decision logic.
- 🔌 **Standalone & Connected Modes**: Runs fully standalone using an in-app simulation engine by default, or connects seamlessly to a Python WebSocket backend.

---

## 🛠️ Tech Stack

- **Framework:** React 18 + Vite + TypeScript
- **Styling:** TailwindCSS with bespoke glassmorphism UI & Framer Motion for buttery smooth animations
- **Data Visualization:** Recharts, React Flow (for topology)
- **Backend (Optional):** Python FastAPI (WebSocket streaming)

---

## 🚀 Getting Started

You can run GridMind completely locally. The front-end contains an embedded simulation engine that generates realistic decision data, meaning no backend is strictly required for the demo to function.

### Prerequisites

- **Node.js** (v16+ recommended)
- **npm** (comes with Node.js)
- *(Optional)* Python 3.9+ if you wish to run the reference mock server.

### 1. Installation

Clone the repository and install the Node dependencies:

```bash
# Install dependencies
npm install
```

### 2. Running the Dashboard (Standalone Mode)

Start the Vite development server with hot-module reloading:

```bash
npm run dev
```

Open your browser to `http://localhost:5173/` (or the port specified in your terminal). The application will automatically begin streaming simulated AI grid decisions.

### 3. Building for Production

To create a highly optimized, minified production build:

```bash
npm run build
npm run preview
```

---

## 📡 Connecting the Reference Backend (Optional)

GridMind ships with a reference Python backend (`mock-server/main.py`) that streams the exact same data shape over WebSockets. This is perfect if you want to extend the project and connect it to a real-world backend or physical hardware.

### Running the Python WebSocket Server

1. Navigate to the `mock-server` directory.
2. Install the necessary Python packages:
   ```bash
   pip install fastapi uvicorn
   ```
3. Boot the server:
   ```bash
   cd mock-server
   uvicorn main:app --reload --port 8000
   ```

---

## 📁 Project Structure

```text
gridmind/
├── mock-server/       # Python FastAPI WebSocket mock backend
├── public/            # Static assets and favicons
└── src/
    ├── components/    # Reusable UI elements (Charts, Topology, Glass Cards)
    ├── hooks/         # Custom React hooks (e.g., useSimulation)
    ├── lib/           # Simulation logic and constant definitions
    ├── pages/         # Top-level route components (Landing, Demo, Analytics)
    └── types/         # TypeScript interfaces
```

## 📜 License

This project is licensed under the MIT License.