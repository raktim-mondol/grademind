# AI-Powered Automated Grading System

This project is a full-stack web application designed to automate the grading of student submissions using large language models (LLMs). It provides a platform for instructors to upload assignments and rubrics, and for the system to automatically process and evaluate student work against them.

## Features

- **User-Friendly Interface**: A clean, responsive frontend built with React for managing assignments, submissions, and results.
- **Assignment & Submission Management**: Easily create new assignments, upload specifications (PDFs), and track student submissions.
- **Multi-Format Submission Support**: Handles various file types, including `.pdf` and `.ipynb` notebooks, with automatic conversion and text extraction.
- **Automated Rubric Extraction**: Intelligently extracts grading rubrics from assignment specifications using AI.
- **AI-Powered Evaluation**: Leverages Google's Gemini and DeepSeek APIs to analyze student submissions and provide grades based on the extracted rubric.
- **Background Job Processing**: Utilizes a robust queue system (BullMQ) to handle time-consuming tasks like file processing and AI evaluation without blocking the user interface.
- **Centralized Database**: Uses MongoDB to store all application data, including assignments, submissions, and evaluation results.

## Tech Stack

- **Frontend**: React, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **File Handling**: Multer for file uploads
- **Background Jobs**: BullMQ for asynchronous task processing
- **AI Services**:
  - **Google Gemini**: For core evaluation and grading logic.
  - **DeepSeek API**: For specialized text processing tasks.
- **API**: RESTful API for client-server communication.

## Project Structure

The project is organized into two main directories: `client` and `server`.

```
/
├── client/         # React Frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── App.js
│       └── index.js
│
└── server/         # Node.js Backend
    ├── config/         # Database and queue configuration
    ├── controllers/    # Request handling logic
    ├── models/         # Mongoose schemas
    ├── routes/         # API route definitions
    ├── uploads/        # Storage for uploaded files
    ├── utils/          # AI service clients, PDF extractors
    ├── workers/        # Background job processors
    └── server.js       # Main server entry point
```

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB instance (local or cloud-hosted)
- API keys for Google Gemini and DeepSeek.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/raktim-mondol/ai-grading.git
    cd ai-grading
    ```

2.  **Setup the Backend:**
    ```bash
    cd server
    npm install
    ```
    Create a `.env` file in the `server` directory and add the following environment variables:
    ```env
    MONGO_URI=your_mongodb_connection_string
    GEMINI_API_KEY=your_gemini_api_key
    DEEPSEEK_API_KEY=your_deepseek_api_key
    ```

3.  **Setup the Frontend:**
    ```bash
    cd ../client
    npm install
    ```

### Running the Application

1.  **Start the Backend Server:**
    - From the `server` directory:
    ```bash
    npm start
    ```
    The server will run on `http://localhost:5001`.

2.  **Start the Frontend Development Server:**
    - From the `client` directory:
    ```bash
    npm start
    ```
    The React application will open in your browser at `http://localhost:3000`.

## How It Works

1.  **Upload Assignment**: An instructor uploads an assignment specification (PDF). A background worker (`rubricProcessor.js`) is triggered to call an AI service to extract the grading rubric and save it.
2.  **Upload Submission**: A student submission (e.g., a `.pdf` or `.ipynb` file) is uploaded.
3.  **Processing**: The file is processed by a dedicated worker (`submissionProcessor.js`). If it's an `.ipynb` file, it's converted to PDF. Text is then extracted from the PDF.
5.  **View Results**: The final grade and evaluation feedback are saved to the database and can be viewed on the results page.

## Documentation

### Plan-Based Tracking System
This application includes a comprehensive plan-based subscription system that tracks user activity and enforces limits based on their subscription tier. For detailed information about:

- Plan tiers and limits
- Backend implementation
- Frontend components
- API endpoints
- Testing procedures
- Future enhancements

Please see: **[PLAN_TRACKING_SYSTEM.md](./PLAN_TRACKING_SYSTEM.md)**

### Available Plans
- **Free**: 3 assignments, 10 submissions each, 1 project
- **Basic** ($9/mo): 10 assignments, 50 submissions each, 5 projects  
- **Pro** ($29/mo): 50 assignments, 200 submissions each, 25 projects
- **Enterprise** (Custom): Unlimited everything with dedicated support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
