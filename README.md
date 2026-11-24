# ImobPredict

**Real Estate Price Prediction with JavaScript and TensorFlow.js**

ImobPredict is a machine learning project designed to predict real estate prices based on property characteristics using an artificial neural network.

The project was developed to explore the fundamentals of machine learning and neural networks through a practical application, using JavaScript and TensorFlow.js.

## Features

- Real estate price prediction using a neural network.
- Numerical feature normalization using Min-Max scaling.
- Categorical feature encoding using One-Hot Encoding.
- Training, validation, and test dataset separation.
- Neural network training with TensorFlow.js.
- Model evaluation using Mean Squared Error (MSE) and Mean Absolute Error (MAE).
- Background model training using Web Workers.

## Technologies

- JavaScript
- TensorFlow.js
- Vite
- HTML5
- CSS3

## Dataset

The project uses a synthetic dataset containing 300 real estate records.

Each property contains the following features:

| Feature | Type | Description |
|---|---|---|
| area | Numerical | Property area |
| bedrooms | Numerical | Number of bedrooms |
| bathrooms | Numerical | Number of bathrooms |
| age | Numerical | Property age |
| parkingSpaces | Numerical | Number of parking spaces |
| neighborhood | Categorical | Property neighborhood |
| condition | Categorical | Property condition |
| hasPool | Boolean | Whether the property has a swimming pool |
| price | Target | Property price |

The `price` field is the target variable that the neural network learns to predict.

## Machine Learning Pipeline

The project follows these steps:

1. **Data Preparation:** Load the property dataset.
2. **Data Splitting:** Divide the dataset into training, validation, and test subsets.
3. **Preprocessing:** Normalize numerical features and encode categorical variables.
4. **Model Creation:** Build a Sequential neural network.
5. **Training:** Train the model using the training dataset and monitor validation metrics.
6. **Evaluation:** Evaluate the trained model using previously unseen test data.
7. **Prediction:** Use the trained model to estimate property prices.

### Dataset Distribution

| Dataset | Percentage | Records |
|---|---:|---:|
| Training | 70% | 210 |
| Validation | 15% | 45 |
| Testing | 15% | 45 |
| **Total** | **100%** | **300** |

### Neural Network Architecture

The current model uses a Sequential architecture with three Dense layers:

| Layer | Neurons | Activation |
|---|---:|---|
| Input | Dynamic | - |
| Hidden Layer 1 | 128 | ReLU |
| Hidden Layer 2 | 64 | ReLU |
| Output | 1 | Linear |

**Training configuration:**

- Optimizer: Adam
- Learning rate: 0.001
- Loss function: Mean Squared Error
- Evaluation metrics: MAE and MSE
- Epochs: 100
- Batch size: 32

## Project Structure

```text
src/
├── css/
│   └── styles.css
│
├── js/
│   ├── data/
│   │   └── imobpredict-dataset.json
│   │
│   ├── neural-network/
│   │   ├── preprocessing.js
│   │   ├── encoding.js
│   │   ├── data-split.js
│   │   ├── model.js
│   │   └── prediction.js
│   │
│   └── workers/
│       └── training.worker.js
│
├── main.js
└── style.css
```

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/imob-predict.git
```

Navigate to the project directory:

```bash
cd imob-predict
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL provided by Vite in your browser.

## Current Status

The initial machine learning pipeline has been implemented, including:

- Dataset preparation.
- Training, validation, and test splitting.
- Feature normalization and encoding.
- Neural network construction.
- Model training.
- Test dataset evaluation.

Model persistence and the complete prediction workflow are still under development.

## Disclaimer

This project uses synthetic data for educational purposes. Its predictions are not intended for real estate valuation or financial decision-making.

## License

This project is currently intended for educational and experimental purposes. Luiz Matheus.