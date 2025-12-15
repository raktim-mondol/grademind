const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { extractWithRetry, formatExtractedContent, isConfigured: isLandingAIConfigured } = require('../utils/landingAIService');
const { Submission } = require('../models/submission');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'grademind-submissions');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fieldSize: 50 * 1024 * 1024, // 50MB for form fields (config JSON with rubric/solution)
    fileSize: 50 * 1024 * 1024   // 50MB for uploaded files
  }
});

// Rate limiting
const RATE_LIMIT_DELAY = 12000;
let lastCallTime = 0;

// Helper function to build evaluation prompt
function buildEvaluationPrompt(config, studentContent) {
  return `You are an expert grading assistant. Evaluate the following student submission based on the provided criteria.

## Assignment Details
Title: ${config.title}
Total Points: ${config.totalScore || 100}
Description: ${config.description || 'No description provided'}

## Grading Rubric
${config.rubric || 'Evaluate based on clarity, accuracy, and completeness.'}

## Reference Solution
${config.solution || 'No reference solution provided. Use your expertise to evaluate.'}

## Student Submission
${studentContent}

## Instructions
Evaluate the submission and provide your response in the following JSON format:
{
  "score": <number between 0 and ${config.totalScore || 100}>,
  "maxScore": ${config.totalScore || 100},
  "letterGrade": "<A, B, C, D, or F>",
  "feedback": "<comprehensive evaluation summary paragraph>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<area for improvement 1>", "<area for improvement 2>", ...],
  "actionableTips": "<one specific piece of advice for improvement>",
  "lostMarks": [
    {
      "area": "<topic or section where marks were lost>",
      "pointsLost": <number of points deducted>,
      "reason": "<specific explanation of why marks were deducted>"
    }
  ]
}

Respond ONLY with the JSON object, no additional text.`;
}

// Helper function to handle Gemini response
function handleGeminiResponse(res, result, config) {
  // Check for valid response structure
  if (!result || !result.response) {
    console.error('❌ Invalid Gemini API response structure');
    return res.status(500).json({
      error: 'Invalid API response',
      details: 'Gemini API returned an invalid response structure'
    });
  }

  const responseText = result.response.text();

  // Check for empty response
  if (!responseText || responseText.trim() === '') {
    console.error('❌ Empty response from Gemini API');
    return res.status(500).json({
      error: 'Empty AI response',
      details: 'Gemini API returned an empty response. The content may be too large or contain unsupported elements.'
    });
  }

  console.log(`📥 Received Gemini response (${responseText.length} chars)`);

  let evaluation;
  try {
    // With responseMimeType: "application/json", the response should be direct JSON
    // But we still try multiple methods for robustness
    let jsonString = null;

    // Method 1: Try direct parsing (for responseMimeType: "application/json")
    try {
      evaluation = JSON.parse(responseText.trim());
      console.log('📝 Method 1: Direct JSON parse successful');
    } catch (directParseError) {
      // Method 2: Look for JSON in markdown code block
      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch && codeBlockMatch[1] && codeBlockMatch[1].trim()) {
        jsonString = codeBlockMatch[1].trim();
        console.log('📝 Method 2: Found JSON in code block');
      }

      // Method 3: Strip markdown and find JSON object
      if (!jsonString) {
        let cleanedText = responseText
          .replace(/```json\n?/gi, '')
          .replace(/```\n?/g, '')
          .trim();

        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
          console.log('📝 Method 3: Found JSON after stripping markdown');
        }
      }

      // Method 4: Direct JSON object search in original text
      if (!jsonString) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
          console.log('📝 Method 4: Found raw JSON object');
        }
      }

      if (jsonString) {
        evaluation = JSON.parse(jsonString);
      } else {
        throw new Error('No JSON found in response');
      }
    }

    console.log('✅ Successfully parsed Gemini JSON response');
    console.log(`   Score: ${evaluation.score}/${evaluation.maxScore}`);
  } catch (parseError) {
    console.error('❌ Failed to parse Gemini response:', parseError.message);
    console.error('Response text (first 1000 chars):', responseText.substring(0, 1000));

    // Return error to frontend instead of random score
    return res.status(500).json({
      error: 'Failed to parse AI response',
      details: parseError.message
    });
  }

  evaluation.maxScore = evaluation.maxScore || config.totalScore || 100;
  evaluation.strengths = evaluation.strengths || [];
  evaluation.weaknesses = evaluation.weaknesses || [];
  evaluation.actionableTips = evaluation.actionableTips || 'Continue practicing and refining your work.';
  evaluation.lostMarks = evaluation.lostMarks || [];

  return res.json(evaluation);
}

// Evaluate a student submission with file upload support
router.post('/evaluate', upload.single('file'), async (req, res) => {
  try {
    // Parse config from form data or JSON body
    let config, studentContent;
    let submissionFilePath = null;
    let originalFilename = '';

    if (req.file) {
      config = JSON.parse(req.body.config || '{}');
      submissionFilePath = req.file.path; // Absolute path to the uploaded file
      originalFilename = req.file.originalname;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();

      console.log(`📄 GradeMind: Processing uploaded file: ${req.file.originalname}`);
      console.log(`   File path: ${submissionFilePath}`);
      console.log(`   File extension: ${fileExtension}`);

      // We no longer rely on Landing AI for PDF extraction for the main evaluation flow
      // The evaluateSubmission service handles direct PDF/IPYNB processing multimodally
    } else {
      // No file - use JSON body
      config = req.body.config;
      studentContent = req.body.studentContent;
      // If student content is provided as text, we might need a way to pass it to the service
      // But the service primarily expects a file path.
      // For text-only submissions, we'll write a temporary file
      if (studentContent) {
        const tempPath = path.join(__dirname, '..', 'uploads', `temp-text-${Date.now()}.txt`);
        fs.writeFileSync(tempPath, studentContent);
        submissionFilePath = tempPath;
        originalFilename = 'text-submission.txt';
      }
    }

    if (!config || !submissionFilePath) {
      return res.status(400).json({ error: 'Missing config or student submission (file or text)' });
    }

    // --- Prepare Data Structures for geminiService ---

    // 1. Assignment Data
    const assignmentData = {
      title: config.title,
      description: config.description,
      totalPoints: config.totalScore || 100,
      questionStructure: [] // Can be populated if config has it, otherwise service handles it
    };

    // 2. Rubric Data
    // The service expects a structured object. If config.rubric is text, we'll pass it 
    // but ideally we should parse it. The service typically handles PDF rubrics.
    // Here we'll construct a basic rubric object or pass null if it's just text
    let rubricData = null;
    if (config.rubric) {
      // If it's a PDF upload (not supported in this specific route payload yet, but might be linked)
      // For now, we put the text rubric into the assignment description or handled by service
      // The service uses rubricData.grading_criteria.
      // We'll create a dummy structure if we have text-based rubric to influence the prompt
      rubricData = {
        grading_criteria: [], // We don't have parsed criteria from text
        raw_text: config.rubric // Pass raw text if needed (service might need update to use this)
      };
      // The service logic in geminiService.js checks for rubricData.grading_criteria length
      // If 0, it falls back to assignment instructions.
      // We will append the rubric text to the assignment description to ensure it's used
      assignmentData.description += `\n\nRUBRIC:\n${config.rubric}`;
    }

    // 3. Solution Data
    let solutionData = null;
    if (config.solution) {
      // Similar strategy: append to description if not structured
      // Or pass as a simple object if service supports it (service checks solutionData.questions)
      assignmentData.description += `\n\nMODEL SOLUTION:\n${config.solution}`;
    }

    // Call the robust evaluation service
    const { evaluateSubmission } = require('../utils/geminiService');

    // Note: evaluateSubmission expects (assignmentData, rubricData, solutionData, submissionFilePath, studentId)
    // It handles the Gemini API call, retries, and formatting.

    console.log(`🔄 calling evaluateSubmission from geminiService...`);
    const result = await evaluateSubmission(
      assignmentData,
      rubricData,
      solutionData,
      submissionFilePath,
      'student', // generic ID
      null, // orchestratedData
      config.title,
      config.description // Passing explicit description just in case
    );

    // Initial clean up of temp text file if created
    if (req.body.studentContent && submissionFilePath && fs.existsSync(submissionFilePath)) {
      fs.unlinkSync(submissionFilePath);
    }

    // Cleanup of uploaded file is handled inside evaluateSubmission (for .ipynb -> pdf conversion artifacts)
    // BUT checking geminiService.js, it cleans up "temporary PDF file if created from .ipynb".
    // It does NOT clean up the original PDF passed to it (which is good).
    // However, multer uploaded this file. We should clean it up after we are done.
    if (req.file && fs.existsSync(submissionFilePath)) {
      // We can delete it now as the service reads it into buffer/uploads to Gemini
      console.log(`🧹 Cleaning up uploaded file: ${submissionFilePath}`);
      fs.unlinkSync(submissionFilePath);
    }

    if (result.processingError) {
      return res.status(500).json({
        error: 'Evaluation failed',
        details: result.processingError,
        // partial results might be available
        score: result.overallGrade,
        feedback: result.processingError
      });
    }

    // Transform result to match what the frontend expects (if different)
    // Frontend expects: { score, maxScore, letterGrade, feedback, strengths, weaknesses, actionableTips, lostMarks }
    // geminiService returns: { overallGrade, totalPossible, criteriaGrades, questionScores, strengths, areasForImprovement, suggestions }

    // Map service result to frontend response
    const frontendResponse = {
      score: result.overallGrade,
      maxScore: result.totalPossible,
      letterGrade: calculateLetterGrade(result.overallGrade, result.totalPossible),
      feedback: generateOverallFeedback(result),
      strengths: result.strengths || [],
      weaknesses: result.areasForImprovement || [],
      actionableTips: result.suggestions ? result.suggestions[0] : 'Review the feedback details.',
      lostMarks: mapLostMarks(result.questionScores)
    };

    return res.json(frontendResponse);

  } catch (error) {
    console.error('❌ GradeMind evaluation error:', error);
    // clean up file if it exists and error happened
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Helper to map letter grade
function calculateLetterGrade(score, total) {
  const percentage = (score / total) * 100;
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

// Helper to generate summary feedback
function generateOverallFeedback(result) {
  // If criteriaGrades exist, summarize them
  if (result.criteriaGrades && result.criteriaGrades.length > 0) {
    return result.criteriaGrades.map(cg => `${cg.criterionName}: ${cg.score}/${cg.maxScore}`).join('. ');
  }
  // usage questionScores if available
  if (result.questionScores && result.questionScores.length > 0) {
    return result.questionScores.map(qs => `Q${qs.questionNumber}: ${qs.earnedScore}/${qs.maxScore}`).join('. ');
  }
  return "Evaluation completed.";
}

// Helper to map question scores to lost marks format
function mapLostMarks(questionScores) {
  if (!questionScores) return [];
  const lost = [];
  questionScores.forEach(qs => {
    if (qs.earnedScore < qs.maxScore) {
      lost.push({
        area: `Question ${qs.questionNumber}`,
        pointsLost: qs.maxScore - qs.earnedScore,
        reason: qs.feedback || 'Incorrect or incomplete answer'
      });
    }
    if (qs.subsections) {
      qs.subsections.forEach(sub => {
        if (sub.earnedScore < sub.maxScore) {
          lost.push({
            area: `Question ${qs.questionNumber}${sub.subsectionNumber}`,
            pointsLost: sub.maxScore - sub.earnedScore,
            reason: sub.feedback || 'Partial deduction'
          });
        }
      });
    }
  });
  return lost;
}

// Save grademind evaluation result as a Submission document
router.post('/save-result', async (req, res) => {
  try {
    const { assignmentId, studentName, studentId, evaluationResult, sectionName } = req.body;

    if (!assignmentId || !studentName || !evaluationResult) {
      return res.status(400).json({
        error: 'Missing required fields: assignmentId, studentName, evaluationResult'
      });
    }

    // Build questionScores from lostMarks or create a single overall entry
    let questionScores = [];
    if (evaluationResult.lostMarks && evaluationResult.lostMarks.length > 0) {
      // Create question entries from lost marks areas
      questionScores = evaluationResult.lostMarks.map((item, idx) => ({
        questionNumber: String(idx + 1),
        earnedScore: Math.max(0, (evaluationResult.maxScore / evaluationResult.lostMarks.length) - item.pointsLost),
        maxScore: evaluationResult.maxScore / evaluationResult.lostMarks.length,
        feedback: `${item.area}: ${item.reason}`
      }));
    } else {
      // Create a single question entry with the overall score
      questionScores = [{
        questionNumber: '1',
        earnedScore: evaluationResult.score,
        maxScore: evaluationResult.maxScore,
        feedback: evaluationResult.feedback
      }];
    }

    // Check if submission already exists for this student and assignment
    const existingSubmission = await Submission.findOne({
      assignmentId,
      studentId: studentId || studentName
    });

    if (existingSubmission) {
      // Update existing submission
      existingSubmission.evaluationResult = {
        overallGrade: evaluationResult.score,
        totalPossible: evaluationResult.maxScore,
        letterGrade: evaluationResult.letterGrade,
        feedback: evaluationResult.feedback,
        strengths: evaluationResult.strengths,
        areasForImprovement: evaluationResult.weaknesses,
        actionableTips: evaluationResult.actionableTips,
        lostMarks: evaluationResult.lostMarks,
        questionScores: questionScores
      };
      existingSubmission.overallGrade = evaluationResult.score;
      existingSubmission.totalPossible = evaluationResult.maxScore;
      existingSubmission.evaluationStatus = 'completed';
      existingSubmission.processingStatus = 'completed';
      existingSubmission.evaluationCompletedAt = new Date();
      if (sectionName) {
        existingSubmission.sectionName = sectionName;
      }

      await existingSubmission.save();
      console.log(`✅ Updated grademind submission for ${studentName}`);
      return res.json({ submissionId: existingSubmission._id, updated: true });
    }

    // Create new submission
    const submission = new Submission({
      assignmentId,
      studentId: studentId || studentName,
      studentName: studentName,
      submissionFile: `grademind-${sectionName || 'default'}-${studentName}`,
      sectionName: sectionName || 'Default Section',
      processingStatus: 'completed',
      evaluationStatus: 'completed',
      evaluationCompletedAt: new Date(),
      overallGrade: evaluationResult.score,
      totalPossible: evaluationResult.maxScore,
      evaluationResult: {
        overallGrade: evaluationResult.score,
        totalPossible: evaluationResult.maxScore,
        letterGrade: evaluationResult.letterGrade,
        feedback: evaluationResult.feedback,
        strengths: evaluationResult.strengths,
        areasForImprovement: evaluationResult.weaknesses,
        actionableTips: evaluationResult.actionableTips,
        lostMarks: evaluationResult.lostMarks,
        questionScores: questionScores
      }
    });

    await submission.save();
    console.log(`✅ Saved grademind submission for ${studentName} (ID: ${submission._id})`);

    res.json({ submissionId: submission._id, created: true });
  } catch (error) {
    console.error('❌ Error saving grademind result:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
