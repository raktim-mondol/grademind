# EduGrade Complete Process Flow

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (React - Port 3000)"
        UI[User Interface]
        Forms[Upload Forms]
        Polling[Status Polling]
        Results[Results Display]
        Export[Excel Export]
    end

    subgraph "Backend (Node.js/Express - Port 5000)"
        API[API Server]
        Auth[Authentication<br/>Clerk]
        Queue[Queue Manager<br/>Memory Queue]
        Workers[Background Workers]
        DB[(MongoDB)]
    end

    subgraph "AI Services"
        Gemini[Google Gemini API<br/>gemini-2.5-pro]
        DeepSeek[DeepSeek API<br/>Optional]
    end

    subgraph "File Storage"
        Uploads[Uploads Directory<br/>server/uploads/]
    end

    UI -->|HTTP Requests| API
    Forms -->|File Uploads| API
    API -->|Auth| Auth
    API -->|Store Data| DB
    API -->|Queue Jobs| Queue
    Queue -->|Process| Workers
    Workers -->|AI Calls| Gemini
    Workers -->|Store Files| Uploads
    Workers -->|Update DB| DB
    Polling -->|Status Check| API
    Results -->|Fetch Data| API
    Export -->|Generate File| API
```

## Complete Workflow: Assignment to Grading

```mermaid
flowchart TD
    Start([Start]) --> InstructorLogin[Instructor Login]
    InstructorLogin --> CreateAssignment[Create Assignment]
    
    CreateAssignment --> UploadFiles[Upload Files<br/>• Assignment PDF<br/>• Rubric PDF (optional)<br/>• Solution PDF (optional)]
    UploadFiles --> StoreFiles[Store Files in Uploads/]
    StoreFiles --> CreateDB[Create Assignment in DB<br/>Status: pending]
    CreateDB --> QueueAssignment[Queue Assignment Processing]
    
    QueueAssignment --> AssignmentWorker[Assignment Processor Worker]
    AssignmentWorker --> ExtractAssignment[Extract Structure via Gemini]
    ExtractAssignment --> UpdateAssignment[Update Assignment<br/>• processedData<br/>• processingStatus: completed]
    UpdateAssignment --> CheckRubric{Rubric File?}
    
    CheckRubric -->|Yes| QueueRubric[Queue Rubric Processing]
    QueueRubric --> RubricWorker[Rubric Processor Worker]
    RubricWorker --> ExtractRubric[Extract Rubric via Gemini]
    ExtractRubric --> UpdateRubric[Update Assignment<br/>• processedRubric<br/>• rubricProcessingStatus: completed]
    
    CheckRubric -->|No| CheckSolution{Solution File?}
    UpdateRubric --> CheckSolution
    
    CheckSolution -->|Yes| QueueSolution[Queue Solution Processing]
    QueueSolution --> SolutionWorker[Solution Processor Worker]
    SolutionWorker --> ExtractSolution[Extract Solution via Gemini]
    ExtractSolution --> UpdateSolution[Update Assignment<br/>• processedSolution<br/>• solutionProcessingStatus: completed]
    
    CheckSolution -->|No| CheckReady[Check Evaluation Ready]
    UpdateSolution --> CheckReady
    
    CheckReady -->|Ready| UpdateStatus[Update EvaluationReadyStatus: ready]
    CheckReady -->|Partial| UpdateStatusPartial[Update EvaluationReadyStatus: partial]
    
    UpdateStatus --> ReadyForSubmissions[Assignment Ready for Submissions]
    UpdateStatusPartial --> ReadyForSubmissions
    
    ReadyForSubmissions --> StudentLogin[Student Login]
    StudentLogin --> UploadSubmission[Upload Submission<br/>• PDF or .ipynb]
    UploadSubmission --> StoreSubmission[Store Original File]
    StoreSubmission --> CheckType{File Type?}
    
    CheckType -->|.ipynb| ConvertPDF[Convert to PDF<br/>using Puppeteer]
    CheckType -->|.pdf| QueueSubmission[Queue Submission Processing]
    ConvertPDF --> StoreConverted[Store Converted PDF]
    StoreConverted --> QueueSubmission
    
    QueueSubmission --> SubmissionWorker[Submission Processor Worker]
    SubmissionWorker --> ProcessSubmission[Process Submission<br/>• Extract text<br/>• Prepare for evaluation]
    ProcessSubmission --> UpdateSubmission[Update Submission<br/>• processingStatus: completed<br/>• processedFilePath]
    UpdateSubmission --> QueueEvaluation[Queue Evaluation]
    
    QueueEvaluation --> EvaluationWorker[Evaluation Worker]
    EvaluationWorker --> CheckLandingAI{Landing AI Configured?}
    
    CheckLandingAI -->|Yes| TwoStage[Two-Stage Processing]
    TwoStage --> ExtractContent[Extract via Landing AI]
    ExtractContent --> EvaluateWithContent[Evaluate via Gemini<br/>with extracted content]
    
    CheckLandingAI -->|No| DirectEval[Direct PDF Evaluation]
    DirectEval --> EvaluatePDF[Evaluate via Gemini<br/>with PDF]
    
    EvaluateWithContent --> StoreResults[Store Evaluation Results]
    EvaluatePDF --> StoreResults
    
    StoreResults --> UpdateSubmissionResults[Update Submission<br/>• evaluationResult<br/>• overallGrade<br/>• evaluationStatus: completed]
    UpdateSubmissionResults --> InstructorView[Instructor Views Results]
    
    InstructorView --> ExportExcel[Export to Excel]
    ExportExcel --> Download[Download Results File]
    
    Download --> End([End])
```

## Detailed Worker Processing Flow

```mermaid
flowchart TB
    subgraph "Assignment Processing Queue"
        A1[Job Created] --> A2[assignmentProcessor.js]
        A2 --> A3[Read Assignment PDF]
        A3 --> A4[Call Gemini API]
        A4 --> A5[Extract Structure]
        A5 --> A6[Save to DB]
        A6 --> A7[Update Status]
    end

    subgraph "Rubric Processing Queue"
        R1[Job Created] --> R2[rubricProcessor.js]
        R2 --> R3{Separate Rubric File?}
        R3 -->|Yes| R4[Read Rubric PDF]
        R3 -->|No| R5[Extract from Assignment]
        R4 --> R6[Call Gemini API]
        R5 --> R6
        R6 --> R7[Extract Grading Criteria]
        R7 --> R8[Save to DB]
        R8 --> R9[Update Status]
    end

    subgraph "Solution Processing Queue"
        S1[Job Created] --> S2[solutionProcessor.js]
        S2 --> S3[Read Solution PDF]
        S3 --> S4[Call Gemini API]
        S4 --> S5[Extract Model Solution]
        S5 --> S6[Save to DB]
        S6 --> S7[Update Status]
    end

    subgraph "Submission Processing Queue"
        SB1[Job Created] --> SB2[submissionProcessor.js]
        SB2 --> SB3{File Type?}
        SB3 -->|.ipynb| SB4[Convert to PDF]
        SB3 -->|.pdf| SB5[Extract Text]
        SB4 --> SB5
        SB5 --> SB6[Save Processed File]
        SB6 --> SB7[Update Status]
    end

    subgraph "Evaluation Queue"
        E1[Job Created] --> E2[evaluationProcessor.js]
        E2 --> E3[Fetch Assignment Data]
        E3 --> E4[Fetch Rubric Data]
        E4 --> E5[Fetch Solution Data]
        E5 --> E6[Fetch Submission File]
        E6 --> E7{Landing AI?}
        E7 -->|Yes| E8[Extract via Landing AI]
        E7 -->|No| E9[Direct PDF to Gemini]
        E8 --> E10[Evaluate via Gemini]
        E9 --> E10
        E10 --> E11[Parse Results]
        E11 --> E12[Save to DB]
        E12 --> E13[Update Status]
    end

    subgraph "Orchestration Queue (Manual)"
        O1[Manual Trigger] --> O2[orchestrationProcessor.js]
        O2 --> O3[Fetch All Data]
        O3 --> O4[Validate Consistency]
        O4 --> O5[Check Completeness]
        O5 --> O6[Generate Warnings]
        O6 --> O7[Save Validation Results]
        O7 --> O8[Update Status]
    end
```

## Frontend Polling & Status Management

```mermaid
sequenceDiagram
    participant User as Instructor
    participant UI as React Dashboard
    participant API as Express API
    participant DB as MongoDB
    participant Queue as Memory Queue
    participant Worker as Background Worker
    participant Gemini as Gemini API

    User->>UI: Upload Assignment Files
    UI->>API: POST /api/assignments
    API->>DB: Create Assignment (status: pending)
    API->>Queue: Queue Assignment Job
    Queue->>Worker: Process Assignment
    Worker->>Gemini: Extract Structure
    Gemini-->>Worker: JSON Response
    Worker->>DB: Update (status: completed)
    
    Note over UI,DB: Polling Loop Starts
    loop Every 5 seconds
        UI->>API: GET /api/assignments/:id/status
        API->>DB: Query Status Fields
        DB-->>API: Return Status
        API-->>UI: Status Response
        UI->>UI: Update UI State
        alt All Complete
            UI->>UI: Stop Polling
        end
    end
    
    User->>UI: View Ready Assignment
    UI->>API: GET /api/assignments/:id
    API->>DB: Fetch Assignment
    DB-->>API: Assignment Data
    API-->>UI: Assignment Details
    
    Note over User,Gemini: Student Submission Flow
    Student->>UI: Upload Submission
    UI->>API: POST /api/submissions/single
    API->>DB: Create Submission (status: pending)
    API->>Queue: Queue Submission Job
    Queue->>Worker: Process Submission
    Worker->>Worker: Convert .ipynb if needed
    Worker->>DB: Update (status: completed)
    Worker->>Queue: Queue Evaluation Job
    Queue->>Worker: Evaluate Submission
    Worker->>Gemini: Grade Submission
    Gemini-->>Worker: Grading Results
    Worker->>DB: Update (status: completed, grade: X)
    
    Note over UI,DB: Polling for Results
    loop Every 5 seconds
        UI->>API: GET /api/submissions/:assignmentId
        API->>DB: Query Submissions
        DB-->>API: Submission Data
        API-->>UI: Results
        UI->>UI: Update Results View
        alt All Evaluated
            UI->>UI: Stop Polling
        end
    end
    
    User->>UI: Export to Excel
    UI->>API: GET /api/submissions/:assignmentId/export
    API->>DB: Fetch All Submissions
    API->>API: Generate Excel
    API-->>UI: Excel File (blob)
    UI->>UI: Download File
```

## File Processing Details

```mermaid
flowchart LR
    subgraph "Input Files"
        A[Assignment PDF]
        R[Rubric PDF]
        S[Solution PDF]
        SUB[Student Submission<br/>PDF or .ipynb]
    end

    subgraph "Processing"
        P1[PDF Text Extraction<br/>pdfjs-dist]
        P2[.ipynb Conversion<br/>Puppeteer + nbconvert]
        P3[Base64 Encoding]
        P4[File Validation]
    end

    subgraph "AI Processing"
        G1[Gemini API<br/>Direct PDF Upload]
        G2[Gemini API<br/>Base64 Data]
        G3[Response Parsing<br/>JSON]
    end

    subgraph "Output Data"
        OD1[Processed Structure<br/>questions, points]
        OD2[Grading Criteria<br/>rubric items]
        OD3[Model Solution<br/>expected answers]
        OD4[Evaluation Results<br/>grades, feedback]
    end

    A --> P1
    R --> P1
    S --> P1
    SUB --> P2
    P2 --> P3
    P3 --> G2
    P1 --> G1
    G1 --> G3
    G2 --> G3
    G3 --> OD1
    G3 --> OD2
    G3 --> OD3
    G3 --> OD4
```

## Database Schema Flow

```mermaid
erDiagram
    ASSIGNMENT {
        string _id PK
        string userId
        string title
        string description
        string assignmentFile
        string rubricFile
        string solutionFile
        number totalPoints
        object questionStructure
        object processedData
        object processedRubric
        object processedSolution
        string processingStatus
        string rubricProcessingStatus
        string solutionProcessingStatus
        string orchestrationStatus
        string evaluationReadyStatus
        object validationResults
        date createdAt
        date updatedAt
    }

    SUBMISSION {
        string _id PK
        string assignmentId FK
        string studentId
        string studentName
        string submissionFile
        string processedFilePath
        string fileType
        object evaluationResult
        number overallGrade
        number totalPossible
        string processingStatus
        string evaluationStatus
        boolean solutionDataAvailable
        date submitDate
        date createdAt
    }

    USER {
        string _id PK
        string clerkId
        string email
        string name
        string planType
        object usageLimits
        date createdAt
    }

    ASSIGNMENT ||--o{ SUBMISSION : "has"
    USER ||--o{ ASSIGNMENT : "creates"
```

## Excel Export Flow

```mermaid
flowchart TD
    Start[Instructor Clicks Export] --> FetchData[Fetch Assignment + Submissions]
    FetchData --> CheckFormat{Data Format?}
    
    CheckFormat -->|New Format| ParseNew[Parse structured data]
    CheckFormat -->|Old Format| ParseOld[Parse legacy data]
    
    ParseNew --> Transform[Transform to Excel Format]
    ParseOld --> Transform
    
    Transform --> CreateWorkbook[Create ExcelJS Workbook]
    CreateWorkbook --> AddHeader[Add Assignment Metadata]
    AddHeader --> AddColumns[Add Dynamic Columns<br/>from Rubric]
    AddColumns --> AddRows[Add Student Rows<br/>with Scores]
    AddRows --> ApplyColors[Apply Color Coding<br/>Green/Red]
    ApplyColors --> GenerateFile[Generate .xlsx File]
    GenerateFile --> Download[Send to Browser]
```

## Error Handling & Retry Logic

```mermaid
flowchart TB
    Start[Job Started] --> Try[Try Operation]
    Try --> Success{Success?}
    
    Success -->|Yes| Complete[Mark Complete]
    Success -->|No| Error[Capture Error]
    
    Error --> CheckRetry{Can Retry?}
    CheckRetry -->|Yes| Wait[Wait with Backoff]
    Wait --> Try
    
    CheckRetry -->|No| Fail[Mark Failed]
    Fail --> LogError[Log to DB]
    LogError --> Notify[Notify User]
    
    Complete --> UpdateDB[Update DB Status]
    UpdateDB --> End([End])
```

## Key Status States

```mermaid
stateDiagram-v2
    [*] --> pending
    
    pending --> processing : Queue Job
    processing --> completed : Success
    processing --> failed : Error
    
    completed --> [*]
    failed --> [*]
    
    pending --> not_applicable : Optional Step
    
    state Assignment {
        pending --> processing : Upload
        processing --> completed : Extracted
        completed --> ready : All Docs Ready
    }
    
    state Submission {
        pending --> processing : Upload
        processing --> completed : Converted
        completed --> evaluating : Queue Eval
        evaluating --> completed : Graded
    }
    
    state EvaluationReady {
        not_ready --> partial : Assignment Only
        not_ready --> ready : All + Rubric + Solution
        partial --> ready : Rubric/Solution Added
    }
```

## Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant Client as Client
    participant Clerk as Clerk Auth
    participant API as Express API
    participant DB as MongoDB
    
    Client->>Clerk: Login/Signup
    Clerk-->>Client: JWT Token
    Client->>API: Request + Token
    API->>Clerk: Verify Token
    Clerk-->>API: User Info
    API->>DB: Find/Create User
    DB-->>API: User Record
    API->>API: Check Plan Limits
    API-->>Client: Allow/Deny
```

## Payment & Subscription Flow

```mermaid
flowchart TD
    Start[User Selects Plan] --> CheckAuth{Authenticated?}
    CheckAuth -->|No| SignUp[Sign Up / Login]
    CheckAuth -->|Yes| CheckLimits[Check Usage Limits]
    
    CheckLimits -->|Within Limits| Proceed[Proceed to Feature]
    CheckLimits -->|Exceeded| Upgrade[Show Upgrade Options]
    
    Upgrade --> SelectPlan[Select Pro Plan]
    SelectPlan --> CreateSession[Create Stripe Session]
    CreateSession --> Redirect[Redirect to Stripe]
    Redirect --> Payment[User Pays]
    
    Payment -->|Success| Verify[Verify Payment]
    Verify --> UpdateDB[Update User Plan]
    UpdateDB --> RedirectApp[Redirect to App]
    RedirectApp --> Access[Access Pro Features]
    
    Payment -->|Cancel| StayOnFree[Stay on Free Plan]
```

---

## Summary

This document shows the complete flow of EduGrade:

1. **Assignment Creation**: Instructor uploads files → Queue processing → AI extraction → DB storage
2. **Student Submission**: File upload → Conversion (if needed) → Queue evaluation → AI grading → Results
3. **Status Management**: Continuous polling → Real-time UI updates
4. **Results Export**: Dynamic Excel generation with color coding
5. **Authentication**: Clerk-based auth with plan limits
6. **Payment**: Stripe integration for plan upgrades

All heavy operations are handled asynchronously via the custom in-memory queue system, ensuring the UI remains responsive while processing occurs in the background.


