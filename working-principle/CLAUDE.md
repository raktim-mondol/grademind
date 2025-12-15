# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains COMP9414 Assignment 2, which focuses on implementing and comparing different supervised learning algorithms including:
- Shallow neural networks
- Tree-based models (Decision Tree)
- Ensemble methods (Bagging, Random Forest, AdaBoost)

Students implement preprocessing functions, model training functions, and analysis of model behavior under various conditions.

## Key Files

- `Assignment_2.ipynb` - Main assignment template with instructions and code structure
- `convert-ipynb-to-pdf.js` - Node.js script to convert Jupyter notebooks to PDF using Puppeteer
- Student submissions in `/4470/` and `/4473/` directories

## Common Development Tasks

### Converting Notebooks to PDF

The repository includes a script to convert Jupyter notebooks to PDF:

```bash
node convert-ipynb-to-pdf.js <notebook.ipynb> <output.pdf>
```

This script:
1. Uses `jupyter nbconvert` to convert the notebook to HTML
2. Uses Puppeteer to render the HTML as a PDF
3. Cleans up temporary HTML files

### Working with Student Submissions

Student submissions are organized in numbered directories:
- `/4470/` - Contains student assignment submissions
- `/4473/` - Contains additional student submissions

Each submission follows the naming pattern: `<student_id> - <name> - <filename>.ipynb`

### Data Processing

The assignment works with three datasets:
1. Adult Income dataset (binary classification)
2. Cover Type dataset (multi-class classification)
3. Credit Card dataset (binary classification, imbalanced)

Datasets are automatically downloaded and processed through the notebook code.

## Architecture Overview

The assignment follows this structure:

1. **Data Preprocessing Functions**:
   - `missing_data()` - Handles missing value imputation
   - `encoding()` - One-hot encoding for categorical features
   - `rescale()` - Min-max scaling for neural networks

2. **Model Training Functions**:
   - `train_shallow_net_class()` - Neural network with one hidden layer
   - `train_classification_tree()` - Decision Tree classifier
   - `train_bagging()` - Bagging ensemble
   - `train_random_forest()` - Random Forest classifier
   - `train_adaboost()` - AdaBoost classifier

3. **Analysis Tasks**:
   - Model complexity analysis
   - Imbalanced data handling
   - Noisy label robustness testing
   - Neural network hyperparameter tuning

## Dependencies

- Python 3.x with Jupyter
- Scikit-learn for machine learning models
- TensorFlow/Keras for neural networks
- Pandas/Numpy for data processing
- Matplotlib for plotting
- Node.js for PDF conversion script
- Puppeteer for PDF generation