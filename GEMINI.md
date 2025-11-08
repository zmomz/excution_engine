# Gemini Code Assistant Context (`GEMINI.md`)

This document provides a comprehensive overview of the `ex_engine` project for the Gemini Code Assistant. It covers the project's architecture, key technologies, and instructions for building and running the application.

## 1. Project Overview

`ex_engine` is a full-stack, automated trading execution engine. It is designed to receive trading signals from webhooks (e.g., from TradingView), validate them against dynamic, exchange-specific precision rules, and manage the entire lifecycle of a trade.

The system is architected as a monorepo with a distinct separation between the backend and frontend.

### Key Features:
- **Webhook Processing**: Ingests trading signals, validates them with HMAC-SHA256 signatures, and checks for valid trade precision using the `ccxt` library.
- **User & API Key Management**: A complete and secure user authentication system (JWT with Argon2 hashing) and full CRUD functionality for user-managed API keys (encrypted in the database).
- **Persistent Logging**: All incoming webhooks and their validation status are logged to a PostgreSQL database.
- **Rate Limiting**: The backend API is protected against abuse with a Redis-based rate limiter.
- **Web UI**: A React-based dashboard for users to manage their API keys and monitor webhook activity in real-time.

### Architecture & Technologies:
- **Backend**:
    - **Framework**: Python with FastAPI
    - **Database**: PostgreSQL
    - **ORM**: SQLAlchemy
    - **Authentication**: JWT with `python-jose` and Argon2 password hashing.
    - **Data Validation**: Pydantic
    - **Dependencies**: `uvicorn`, `fastapi-limiter`, `psycopg2-binary`, `ccxt`.
- **Frontend**:
    - **Framework**: TypeScript with React
    - **Build Tool**: Vite
    - **UI Library**: Material-UI (MUI)
    - **Routing**: `react-router-dom`
    - **Form Management**: `react-hook-form` with `yup` for validation.
    - **API Communication**: `axios`
- **Infrastructure**:
    - **Cache/Rate Limiting**: Redis (run via Docker)
    - **Process Management**: `screen` is used to run backend and frontend servers in detached sessions.

## 2. Building and Running

### Prerequisites:
- Python 3.10+ and `pip`
- Node.js and `npm`
- PostgreSQL server
- Docker (for Redis)

### Service Setup:
1.  **PostgreSQL Database**:
    - Create a database named `ex_engine_db`.
    - Create a user named `ex_engine_user` with a password.
    - Grant all privileges on the database to the user.
    - The connection string is configured in `backend/config.py` and can be overridden with environment variables.

2.  **Redis**:
    - Start a Redis container using Docker:
      ```bash
      docker run -d --name redis -p 6379:6379 redis
      ```

### Backend Setup & Launch:
```bash
# 1. Navigate to the project root
# 2. Create and activate a virtual environment
python -m venv backend/venv
source backend/venv/bin/activate

# 3. Install dependencies
pip install -r backend/requirements.txt

# 4. Run the server (defaults to http://localhost:8001)
# The server will auto-create the necessary database tables on startup.
uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup & Launch:
```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Run the development server (defaults to http://localhost:5173)
npm run dev
```

## 3. Development Conventions

- **Configuration**: All backend configuration is centralized in `backend/config.py` and can be overridden by environment variables. This includes database URLs, JWT secrets, and Redis URLs.
- **Authentication**: API routes are protected using JWT Bearer tokens. The token is stored in the browser's `localStorage` on the frontend.
- **Database Schema**: The database schema is defined in `backend/models.py` using SQLAlchemy's ORM. Pydantic models in `backend/schemas.py` are used for API data validation.
- **Logging**: The backend uses Python's `logging` module for structured, file-based logging, configured in `backend/logging_config.py`. All `print()` statements have been refactored.
- **Frontend State**: The frontend is a single-page application (SPA) with client-side routing. Protected routes ensure that only authenticated users can access the dashboard.
- **Background Processes**: For development, servers are run in detached `screen` sessions to keep them alive.
  - `screen -dmS backend_server <command>`
  - `screen -dmS frontend_server <command>`

---

## 4. Milestone 2: Grid Strategy, DCA System & Position UI - Implementation Plan

### **Phase 1: 🏗️ Backend Foundation - Data Models & Core Structures**

Before any trading logic can be written, we need the database schema to support it. This phase establishes the backbone of the entire trading system.

1.  **Create New Database Models (`models.py`):**
    *   **`PositionGroup`**: The primary model to represent a unique trade (e.g., BTC/USDT on the 15m timeframe). It will store the pair, timeframe, status (`Waiting`, `Live`, `Closed`), average entry price, and take-profit mode.
    *   **`Pyramid`**: A model linked to a `PositionGroup` to represent an additional entry within the same group.
    *   **`DCALeg`**: A model linked to a `Pyramid` representing a single DCA order. It will store the price gap, weight, target TP, fill price, and status.
    *   **`QueuedSignal`**: A model to store incoming webhooks when the execution pool is full. It will include fields for priority calculation, such as `loss_percentage` and `replacement_count`.

2.  **Update Pydantic Schemas (`schemas.py`):**
    *   Create corresponding Pydantic schemas for the new models to ensure proper data validation and serialization for the API.

3.  **Implement Basic CRUD Functions (`crud.py`):**
    *   Develop the necessary functions to create, read, update, and delete records for `PositionGroup`, `Pyramid`, `DCALeg`, and `QueuedSignal`.

### **Phase 2: 📈 Backend Core Trading Logic - Grid & DCA System**

With the data structures in place, we will implement the primary "happy path" for receiving a signal and executing the grid strategy.

1.  **Modify Webhook Endpoint (`main.py`):**
    *   Enhance the `/webhooks/` endpoint to differentiate between new entries and pyramids.
    *   **Logic**: Upon receiving a valid signal, it will check if a `PositionGroup` for the same pair and timeframe already exists.

2.  **Implement Position Group Creation:**
    *   If no existing group is found, create a new `PositionGroup` record.
    *   Calculate the price and quantity for the initial entry and all associated DCA legs based on the rules in the (future) configuration file.
    *   Create the corresponding `Pyramid` and `DCALeg` records in the database.
    *   **(Simulation)** Create a placeholder function `place_exchange_order()` that logs the order details instead of sending them to a real exchange for now.

3.  **Implement Pyramid Scaling:**
    *   If a `PositionGroup` *does* exist, create a new `Pyramid` record linked to it.
    *   Calculate and place the new set of DCA orders for this pyramid.

4.  **Implement Take-Profit Logic:**
    *   Create a background task or a periodic function that checks the status of open positions.
    *   Initially, we will implement the **`Per-Leg TP`** mode (Section 2.4), as it's the most straightforward. The logic will check if the current market price has hit a `DCALeg`'s individual take-profit target.

### **Phase 3: 🛡️ Backend Execution & Risk Management**

This phase introduces the constraints and safety mechanisms that manage capital and risk.

1.  **Implement Execution Pool & Waiting Queue (`main.py` & `crud.py`):**
    *   Before creating a new `PositionGroup`, the webhook logic will check if an execution pool slot is available (based on `max_open_groups` from the config).
    *   If the pool is full, the signal will be saved to the `QueuedSignal` table.
    *   When a `PositionGroup` is closed, a function `process_queue()` will be triggered to promote the highest-priority signal from the queue (as per Section 5.3 rules) into the execution pool.

2.  **Implement the Risk Engine (New Module: `risk_engine.py`):**
    *   **Activation Logic**: Create a function that runs periodically to check if the Risk Engine's activation conditions are met for any losing positions (Section 4.2).
    *   **Selection Logic**: Implement the priority ranking to select the worst-performing losing trade (Section 4.4).
    *   **Offset Logic**: Implement the logic to find suitable winning trades and calculate the required partial close amounts in USD to offset the loss (Section 4.5).
    *   This will be the most complex backend component and will be developed and tested in isolation before being integrated.

### **Phase 4: 🖥️ Frontend UI Implementation**

Once the backend logic is functional, we will build the user interface for monitoring and control.

1.  **Positions & Pyramids View (New Page: `PositionsPage.tsx`):**
    *   Create a new page accessible from the main dashboard.
    *   Display a real-time table of all active `PositionGroups` with key data points (Pair, PnL, Status, etc.), as specified in Section 7.2 B.
    *   Implement an expandable row feature to show the detailed status of each `DCALeg` within a group.

2.  **Queue & Risk Engine Panels (Components on `PositionsPage.tsx`):**
    *   Create a component to display the current state of the `Waiting Queue`, including priority and replacement counts (Section 7.2 D).
    *   Create a component for the `Risk Engine Panel` to show its status, timers, and projected actions (Section 7.2 C).

3.  **Settings Panel (New Page: `SettingsPage.tsx`):**
    *   Create a dedicated page for managing the engine's configuration.
    *   Build a form with sections for each category in the SOW (Exchange, Pool, Grid, Risk, etc.), allowing users to edit all parameters without touching the JSON file (Section 7.2 F).
    *   The Exchange section will include a dropdown to select a pre-configured API key, linking the exchange configuration to a specific trading account.
    *   Implement backend API endpoints to read and write the `config.json` file.

4.  **Performance & Portfolio Dashboard (Enhancement to `DashboardPage.tsx`):**
    *   This is the final major UI feature. We will add the new widgets specified in Section 7.1 to the existing dashboard.
    *   This will require new backend endpoints to calculate and serve historical performance metrics (PnL curves, win/loss stats, Sharpe ratio, etc.) from the database of closed trades.

---

## 5. Full Scope of Work (SOW)

### 1. Overview
The Execution Engine is a fully automated trading system that:
•Receives TradingView webhook signals
•Executes grid-based entries using pyramids received by tradingview and DCA inside the engine
•Applies precision validation before every order
•Automatically handles exits
•Runs a Risk Engine to offset losing trades
•Enforces max position limits using a pool + queue
•Stores all data in database
•Includes an integrated web app for real-time monitoring

Key characteristics:
•Supports multiple exchanges and symbols
•All logic lives inside a single packaged webtop application / server
•TradingView only triggers the entry (and optionally the exit)
•The engine itself calculates and executes all DCA orders
•The engine itself handles all pyramid scaling
•The engine itself runs the Risk Engine, without needing TradingView
•TradingView is only used to start or end a position. All DCA, pyramid scaling, take-profit, and risk logic are handled locally by the engine and do not require additional TradingView alerts.

### 2. Grid Strategy
... (and so on, including the full SOW)
