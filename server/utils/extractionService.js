const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
    generationConfig: {
        maxOutputTokens: 65536,
        temperature: 0.2
    }
});

function cleanJsonResponse(responseText) {
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return cleanedResponse;
}

async function fileToPart(filePath, mimeType) {
    const data = await fs.readFile(filePath);
    return {
        inlineData: {
            data: data.toString('base64'),
            mimeType
        }
    };
}

/**
 * Extract Questions Structure from Assignment File
 */
exports.extractQuestions = async (filePath, mimeType = 'application/pdf') => {
    try {
        const filePart = await fileToPart(filePath, mimeType);

        // Schema definition for the prompt
        const schemaExample = JSON.stringify({
            title: "Assignment Title",
            subtitle: "Topic",
            header_info: ["Course Name", "Instructions"],
            tasks: [
                {
                    id: "1",
                    title: "Task 1",
                    marks: "10 Marks",
                    description: "Full text description...",
                    subtasks: [
                        { id: "1.1", title: "Subtask A", marks: "5 Marks", description: "..." }
                    ]
                }
            ]
        }, null, 2);

        const prompt = `
      You are an expert curriculum developer. 
      Analyze the attached assignment file and extract the structure into a JSON object strictly matching this schema:
      
      ${schemaExample}
      
      Extract ALL text descriptions, instructions, and hierarchical task structure (Tasks > Subtasks). 
      Preserve markdown formatting in descriptions if present.
    `;

        const result = await model.generateContent([prompt, filePart]);
        const response = result.response.text();
        return JSON.parse(cleanJsonResponse(response));

    } catch (error) {
        console.error("Error extracting questions:", error);
        throw new Error("Failed to extract questions structure: " + error.message);
    }
};

/**
 * Extract Rubric from Assignment File (or separate Rubric File)
 */
exports.extractRubric = async (filePath, mimeType = 'application/pdf') => {
    try {
        const filePart = await fileToPart(filePath, mimeType);

        const schemaExample = JSON.stringify({
            title: "Assignment Rubric",
            total_marks: 100,
            tasks: [
                {
                    task_id: "1",
                    title: "Task 1",
                    sub_tasks: [
                        {
                            sub_task_id: "1.1",
                            description: "Detailed criteria...",
                            marks: 5.0
                        }
                    ]
                }
            ]
        }, null, 2);

        const prompt = `
      You are an expert grader.
      Analyze the attached document and extract the Grading Rubric into a JSON object strictly matching this schema:
      
      ${schemaExample}
      
      If the document contains both assignment instructions and rubric, focus ONLY on the rubric/marking criteria sections.
      If explicit marks are not found for a subtask, infer them from the parent task or assign null.
    `;

        const result = await model.generateContent([prompt, filePart]);
        const response = result.response.text();
        return JSON.parse(cleanJsonResponse(response));

    } catch (error) {
        console.error("Error extracting rubric:", error);
        throw new Error("Failed to extract rubric: " + error.message);
    }
};

/**
 * Extract Solution from Solution File
 */
exports.extractSolution = async (filePath, mimeType = 'application/pdf') => {
    try {
        const filePart = await fileToPart(filePath, mimeType);

        // Schema for solution data
        const schemaExample = JSON.stringify({
            questions: [
                {
                    number: "1",
                    questionSummary: "Brief summary of question 1",
                    keyPoints: ["Point 1", "Point 2"],
                    modelAnswer: "Full model answer or code..."
                }
            ]
        }, null, 2);

        const prompt = `
      You are an expert grader.
      Analyze the attached Model Solution document and extract the solution details into a JSON object strictly matching this schema:
      
      ${schemaExample}
      
      For each question found in the solution document, capture the question number, a brief summary, key points required for a correct answer, and the model answer/code itself.
    `;

        const result = await model.generateContent([prompt, filePart]);
        const response = result.response.text();
        return JSON.parse(cleanJsonResponse(response));

    } catch (error) {
        console.error("Error extracting solution:", error);
        throw new Error("Failed to extract solution: " + error.message);
    }
};

/**
 * Generate a specific System Prompt for Grading based on Questions, Rubric, and Optional Solution
 */
exports.generateGradingSystemPrompt = async (questionsData, rubricData, solutionData = null) => {
    try {
        // We send the JSONs as text context
        const context = `
      QUESTIONS_JSON: ${JSON.stringify(questionsData, null, 2)}
      RUBRIC_JSON: ${JSON.stringify(rubricData, null, 2)}
      ${solutionData ? `SOLUTION_JSON: ${JSON.stringify(solutionData, null, 2)}` : ''}
    `;

        const prompt = `
      You are an expert AI Grading Architect.
      
      Your goal is to write a "System Prompt" for an LLM (Gemini 2.5 Pro) that will be used to grade student submissions for this specific assignment.
      
      Review the provided QUESTIONS_JSON, RUBRIC_JSON${solutionData ? ', and SOLUTION_JSON' : ''}.
      
      Write a System Prompt in Markdown format.
      structure it as follows:
      1. Role & Objective
      2. Evaluation Process (General steps)
      3. Common Pitfalls to Watch For (CRITICAL SECTION: Generate specific technical pitfalls relevant to the tasks described. For example, if the task is about Neural Networks, mention overfitting, data leakage, normalization etc. If it's about SQL, mention SQL injection, joins efficiency etc.)
      ${solutionData ? '4. Model Solution Highlights (Summarize key elements from the solution that must be present)' : ''}
      ${solutionData ? '5' : '4'}. JSON Output Schema (Define the rigorous JSON schema the grader must output. Copy the standard Grademind schema: { overallGrade, criteriaGrades: [], ... })
      
      Make the "Common Pitfalls" section highly specific to the content found in the questions.
      ${solutionData ? 'Ensure the "Model Solution Highlights" section gives cues on what to look for based on the provided solution, without revealing the full answer text if possible, just the key criteria.' : ''}
      
      Return ONLY the Markdown string of the System Prompt.
    `;

        const result = await model.generateContent([prompt, context]);
        return result.response.text();

    } catch (error) {
        console.error("Error generating grading prompt:", error);
        throw new Error("Failed to generate grading system prompt: " + error.message);
    }
};
