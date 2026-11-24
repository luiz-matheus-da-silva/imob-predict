# ImobPredict

**Real Estate Price Prediction with JavaScript, TensorFlow.js, React and PostgreSQL**

ImobPredict is a full-stack machine learning application that estimates real estate prices from property characteristics using an artificial neural network trained directly in the browser.

The project was developed to explore the fundamentals of machine learning and neural networks through a practical application: from training and evaluating a model to registering properties, estimating prices and tracking results in a dashboard.

> Developed by [Luiz Matheus](https://github.com/luiz-matheus-da-silva) · [Source code](https://github.com/luiz-matheus-da-silva/imob-predict)

## Features

**Application**

- **Dashboard** with the number of evaluated properties, average and highest estimated price, price distribution, latest evaluations and model performance by version.
- **Property evaluation** with the trained neural network: pick a registered property or enter a new one and get the estimated price in reais, a likely price range and warnings when the input is outside what the model has seen.
- **Property registry (CRUD)** with search, sorting, pagination, create/edit in a side sheet and delete with confirmation.
- **Model training** with live progress, loss curves (training vs. validation) and test metrics.
- **Training history** stored in the database, with model versions and their metrics.
- **Model download**: export the trained model (weights and normalization context) as a single JSON file.

**Machine learning**

- Numerical feature normalization using Min-Max scaling.
- Categorical feature encoding using One-Hot Encoding.
- Training, validation and test dataset separation.
- Neural network training with TensorFlow.js in a Web Worker (the interface never freezes).
- Evaluation using Mean Absolute Error (MAE) and Mean Squared Error (MSE).

## Technologies

| Area | Stack |
|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS v4, shadcn/ui (Base UI), Recharts, Lucide |
| Machine learning | TensorFlow.js, Web Workers, IndexedDB |
| Backend | Node.js, Express 5, `pg` |
| Database | PostgreSQL 17 (Docker) |

## How it works

```text
┌──────────────────────── Browser ────────────────────────┐        ┌───────── Server ─────────┐
│                                                         │        │                          │
│  Training (Web Worker)  ──►  Model  ──►  IndexedDB      │        │  Express API  ◄──►  PostgreSQL
│                              │                          │  HTTP  │  /api/properties         │
│  Normalization context  ──►  localStorage               │ ◄────► │  /api/evaluations        │
│                              │                          │        │  /api/model-versions     │
│  Evaluation: load model ─► estimate price ─► register   │        │  /api/training-runs      │
└─────────────────────────────────────────────────────────┘        └──────────────────────────┘
```

- The model is **trained and used in the browser**. Its weights are stored in IndexedDB (`indexeddb://imobpredict-model`) and the normalization context (value ranges and categories) in `localStorage`.
- The **database** keeps what must be shared and persistent: properties, evaluations, model versions with their metrics and the training history.
- Because the model lives in the browser that trained it, a different browser or machine needs to run a training once before evaluating properties.

### Understanding the metrics

Prices are normalized to a 0–1 range during training, so the metrics are in that scale:

- **MAE 0.028** means the model is wrong by about **2.8% of the price range** on average. With the sample dataset (R$ 141 thousand to R$ 1.17 million) that is roughly **R$ 29 thousand per property**.
- **MSE** averages the squared errors, so it penalizes large mistakes more. It is much smaller than the MAE because of the normalized scale.
- **Loss** is the value the network minimizes while training (here, the MSE).

## Dataset

The project uses a synthetic dataset containing 300 real estate records.

| Feature | Type | Description |
|---|---|---|
| area | Numerical | Property area (m²) |
| bedrooms | Numerical | Number of bedrooms |
| bathrooms | Numerical | Number of bathrooms |
| age | Numerical | Property age (years) |
| parkingSpaces | Numerical | Number of parking spaces |
| neighborhood | Categorical | Property neighborhood |
| condition | Categorical | Property condition |
| hasPool | Boolean | Whether the property has a swimming pool |
| price | Target | Property price |

The `price` field is the target variable that the neural network learns to predict. The neighborhoods and conditions offered in the forms come from this dataset, since the model only knows the categories it was trained with.

### Dataset distribution

| Dataset | Percentage | Records |
|---|---:|---:|
| Training | 70% | 210 |
| Validation | 15% | 45 |
| Testing | 15% | 45 |
| **Total** | **100%** | **300** |

### Neural network architecture

A Sequential model with three Dense layers:

| Layer | Neurons | Activation |
|---|---:|---|
| Input | Dynamic | - |
| Hidden Layer 1 | 128 | ReLU |
| Hidden Layer 2 | 64 | ReLU |
| Output | 1 | Linear |

**Training configuration:** Adam optimizer (learning rate 0.001), Mean Squared Error loss, MAE and MSE metrics, 100 epochs, batch size 32.

## Project structure

```text
imob-predict/
├── compose.yaml                 # PostgreSQL (creates the tables on first start)
├── .env.example                 # Database password used by docker compose
│
├── backend/
│   ├── .env.example
│   └── src/
│       ├── server.js
│       ├── config/              # Database connection
│       ├── database/schema.sql  # Tables: properties, model_versions, evaluations, training_runs
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       └── repositories/
│
└── frontend/
    ├── .env.example
    └── src/
        ├── app/                 # Routes
        ├── config/              # API URL
        ├── components/          # layout, shared and ui (shadcn)
        ├── features/            # dashboard, model-training, property-evaluation, property-registration
        ├── hooks/               # useModelTraining, usePagination, useSort
        ├── js/
        │   ├── data/            # imobpredict-dataset.json
        │   ├── neural-network/  # preprocessing, encoding, data-split, model, prediction
        │   └── workers/         # training.worker.js
        ├── lib/
        └── services/            # API clients and model storage / export
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) **20.19+** (or 22.12+) and npm
- [Docker](https://www.docker.com/) with Docker Compose (for PostgreSQL)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/luiz-matheus-da-silva/imob-predict.git
cd imob-predict
```

### 2. Configure the environment

Copy the example files and set a password (use the **same** `DB_PASSWORD` in both):

```bash
# Linux / macOS / Git Bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

| File | Variable | Description |
|---|---|---|
| `.env` | `DB_PASSWORD` | Password for the PostgreSQL container |
| `backend/.env` | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Database connection |
| `backend/.env` | `PORT` | API port (default `3000`) |
| `backend/.env` | `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated (default `http://localhost:5173`) |
| `frontend/.env` | `VITE_API_URL` | API base URL (default `http://localhost:3000/api`) |

### 3. Start the database

```bash
docker compose up -d
```

The tables are created automatically the first time the database starts, from `backend/src/database/schema.sql`. If you already had a database volume from a previous run, apply the schema manually (it is safe to run more than once):

```bash
docker exec -i imobpredict-postgres psql -U imobpredict -d imobpredict < backend/src/database/schema.sql
```

To start over with an empty database: `docker compose down -v`, then `docker compose up -d`.

### 4. Start the API

```bash
cd backend
npm install
npm run dev
```

The API runs at `http://localhost:3000`. Check `http://localhost:3000/api/health`.

### 5. Start the frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### 6. First use

1. Go to **Training** and run a training (it takes a few moments). This creates the model in your browser and registers the first model version.
2. Go to **Property registry** and register properties (or skip this and enter a new property directly when evaluating).
3. Go to **Evaluate property**, pick a registered property or enter a new one, and get the estimated price.
4. Follow the results in the **Dashboard** and the **Training history**.

> Running on another machine or on a network? Set `VITE_API_URL` in `frontend/.env` to the API address and add the frontend address to `CORS_ORIGIN` in `backend/.env`.

## API

Base URL: `http://localhost:3000/api`

| Resource | Endpoints |
|---|---|
| Health | `GET /health` |
| Properties | `GET /properties` · `GET /properties/:id` · `POST /properties` · `PUT /properties/:id` · `DELETE /properties/:id` |
| Evaluations | `GET /evaluations` · `GET /evaluations/statistics` · `GET /evaluations/:id` · `POST /evaluations` |
| Model versions | `GET /model-versions` · `GET /model-versions/:id` · `POST /model-versions` |
| Training runs | `GET /training-runs` · `GET /training-runs/:id` · `POST /training-runs` · `PATCH /training-runs/:id/complete` · `PATCH /training-runs/:id/fail` |

A property that already has evaluations cannot be deleted (the API answers `409`).

## Scripts

| Where | Command | Description |
|---|---|---|
| `backend` | `npm run dev` | API with automatic reload (nodemon) |
| `backend` | `npm start` | API |
| `frontend` | `npm run dev` | Development server |
| `frontend` | `npm run build` | Production build in `dist/` |
| `frontend` | `npm run preview` | Preview of the production build |

## Current status

Implemented:

- Full machine learning pipeline: preparation, splitting, normalization, encoding, training, evaluation and prediction.
- Model persistence in the browser, model versioning in the database and model export.
- Dashboard, property evaluation, property CRUD, training and training history.

Known limitations:

- The model is stored per browser; it is not shared between users or machines.
- Prediction quality is limited by the small synthetic dataset.

## Disclaimer

This project uses synthetic data for educational purposes. Its predictions are not intended for real estate valuation or financial decision-making.

## License

This project is currently intended for educational and experimental purposes. Luiz Matheus.
