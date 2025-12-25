/**
 * Atomic Assignment Controller
 * Creates assignments only after all documents are processed and schema is generated
 */

const { Assignment } = require('../models/assignment');
const fs = require('fs').promises;
const path = require('path');
const {
  processAssignmentPDF,
  processRubricPDF,
  processSolutionPDF,
  processRubricContent,
  processSolutionContent,
  analyzeRubricForSchema,
  analyzeRubricJSONForSchema,
  processAssignmentContent,
  buildEvaluationResponseSchema
} = require('../utils/geminiService');
const { extractWithRetry, formatExtractedContent, isConfigured: isLandingAIConfigured } = require('../utils/landingAIService');
const { getUserId, isAuthenticated } = require('../utils/authHelper');
const extractionService = require('../utils/extractionService');

/**
 * Create assignment atomically - only creates after all processing completes
 * This ensures assignment is only created if all files are valid and processed
 */
exports.createAssignmentAtomic = async (req, res) => {
  console.log('📥 [API] POST /api/assignments/atomic - Creating assignment atomically');
  console.log(`   Files uploaded: ${req.files ? Object.keys(req.files).join(', ') : 'none'}`);

  let assignment = null;
  let tempFiles = [];

  try {
    // Check database connection
    const { isConnected } = require('../config/db');
    if (!isConnected()) {
      return res.status(500).json({
        error: 'Database connection error. Please ensure MongoDB is running and try again.'
      });
    }

    // Get user authentication
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    const userId = getUserId(req);

    // Extract form data
    const { title, description, dueDate, course, totalPoints, questionStructure, sections, assignmentText } = req.body;

    // Validate required files
    const assignmentFilePath = req.files?.assignment?.[0]?.path;
    const rubricFilePath = req.files?.rubric?.[0]?.path;
    const solutionFilePath = req.files?.solution?.[0]?.path;

    if (!assignmentFilePath && !assignmentText) {
      return res.status(400).json({ error: 'Assignment file or text is required' });
    }

    // Parse optional data
    let parsedQuestionStructure = [];
    let parsedSections = [];
    try {
      if (questionStructure) parsedQuestionStructure = JSON.parse(questionStructure);
      if (sections) {
        parsedSections = typeof sections === 'string' ? JSON.parse(sections) : sections;
        if (!Array.isArray(parsedSections)) parsedSections = [];
      }
    } catch (error) {
      console.warn('Failed to parse JSON data:', error);
    }

    console.log('🔄 Starting atomic processing pipeline...');

    // STEP 1: Process Assignment File/Text
    console.log('📄 Step 1: Processing assignment...');
    let processedAssignment = null;
    let questionsData = null;
    let rubricExtractionSource = 'not_available';

    if (assignmentFilePath) {
      try {
        // Process assignment PDF
        processedAssignment = await processAssignmentPDF(assignmentFilePath);

        // Try to extract questions data
        try {
          if (isLandingAIConfigured()) {
            const extractedContent = await extractWithRetry(assignmentFilePath);
            questionsData = await extractionService.extractQuestionsFromContent(extractedContent);
          }
        } catch (qErr) {
          console.warn('Could not extract questions data:', qErr.message);
        }

        console.log('✅ Assignment processed successfully');
      } catch (error) {
        console.error('❌ Assignment processing failed:', error.message);
        throw new Error(`Assignment PDF processing failed: ${error.message}`);
      }
    } else if (assignmentText) {
      // For text-based assignments
      processedAssignment = { text: assignmentText };
      console.log('✅ Assignment text processed');
    }

    // STEP 2: Process Rubric (or extract from assignment)
    console.log('📄 Step 2: Processing rubric...');
    let processedRubric = null;
    let gradingSchema = null;

    if (rubricFilePath) {
      try {
        // Process separate rubric file
        if (isLandingAIConfigured()) {
          const extractedRubric = await extractWithRetry(rubricFilePath);
          const formattedContent = formatExtractedContent(extractedRubric);
          processedRubric = await processRubricContent(formattedContent, totalPoints);
        } else {
          processedRubric = await processRubricPDF(rubricFilePath, totalPoints);
        }

        rubricExtractionSource = 'separate_file';
        console.log('✅ Rubric processed from separate file');

        // NEW: Extract grading schema from processed rubric JSON (not PDF)
        if (processedRubric && processedRubric.grading_criteria) {
          console.log('📊 Extracting grading schema from processed rubric JSON...');
          const schemaResult = await analyzeRubricJSONForSchema(processedRubric);
          if (schemaResult.success) {
            gradingSchema = schemaResult.schema;
            console.log(`✅ Schema extracted: ${schemaResult.schema.tasks?.length || 0} tasks, ${schemaResult.schema.total_marks || '?'} marks`);
          } else {
            console.warn('⚠️ Schema extraction failed:', schemaResult.error);
          }
        } else {
          console.warn('⚠️ No processed rubric available for schema extraction');
        }
      } catch (error) {
        console.error('❌ Rubric processing failed:', error.message);
        throw new Error(`Rubric processing failed: ${error.message}`);
      }
    } else if (processedAssignment) {
      // Try to extract rubric from assignment PDF
      try {
        console.log('🔄 Attempting to extract rubric from assignment PDF...');
        if (isLandingAIConfigured()) {
          const extractedContent = await extractWithRetry(assignmentFilePath);
          processedRubric = await processRubricContent(formatExtractedContent(extractedContent), totalPoints);
        } else {
          processedRubric = await processRubricPDF(assignmentFilePath, totalPoints);
        }

        rubricExtractionSource = 'assignment_pdf';
        console.log('✅ Rubric extracted from assignment PDF');

        // NEW: Extract schema from processed rubric JSON
        if (processedRubric && processedRubric.grading_criteria) {
          console.log('📊 Extracting grading schema from processed rubric JSON...');
          const schemaResult = await analyzeRubricJSONForSchema(processedRubric);
          if (schemaResult.success) {
            gradingSchema = schemaResult.schema;
            console.log(`✅ Schema extracted from assignment: ${schemaResult.schema.tasks?.length || 0} tasks`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not extract rubric from assignment:', error.message);
        processedRubric = null;
        rubricExtractionSource = 'not_available';
      }
    }

    // STEP 3: Process Solution (if provided)
    console.log('📄 Step 3: Processing solution...');
    let processedSolution = null;

    if (solutionFilePath) {
      try {
        if (isLandingAIConfigured()) {
          const extractedSolution = await extractWithRetry(solutionFilePath);
          const formattedContent = formatExtractedContent(extractedSolution);
          processedSolution = await processSolutionContent(formattedContent, totalPoints);
        } else {
          processedSolution = await processSolutionPDF(solutionFilePath, totalPoints);
        }
        console.log('✅ Solution processed successfully');
      } catch (error) {
        console.error('❌ Solution processing failed:', error.message);
        throw new Error(`Solution processing failed: ${error.message}`);
      }
    }

    // STEP 4: Determine Evaluation Readiness
    console.log('📊 Step 4: Determining evaluation readiness...');
    let evaluationReadyStatus = 'not_ready';

    if (processedAssignment) {
      const hasRubric = processedRubric !== null;
      const hasSolution = processedSolution !== null;

      if (hasRubric && hasSolution) {
        evaluationReadyStatus = 'ready';
      } else if (hasRubric || hasSolution) {
        evaluationReadyStatus = 'partial';
      } else {
        evaluationReadyStatus = 'partial'; // Assignment only is still usable
      }
    }

    console.log(`✅ Evaluation ready status: ${evaluationReadyStatus}`);

    // OPTIMIZATION: Build response schema for fast evaluation
    let responseSchema = null;
    if (gradingSchema) {
      console.log('🔧 Building response schema for fast evaluation...');
      responseSchema = buildEvaluationResponseSchema(
        { gradingSchema },
        null
      );
      console.log('✓ Response schema built and ready for storage');
    }

    // STEP 5: Create Assignment in Database
    console.log('💾 Step 5: Creating assignment in database...');

    assignment = new Assignment({
      userId,
      title,
      description,
      dueDate,
      course,
      totalPoints: totalPoints || 100,
      questionStructure: parsedQuestionStructure,
      sections: parsedSections,
      assignmentFile: assignmentFilePath,
      assignmentText: assignmentText || '',
      rubricFile: rubricFilePath,
      solutionFile: solutionFilePath,

      // Processed data
      processedData: processedAssignment,
      processedRubric: processedRubric,
      processedSolution: processedSolution,
      gradingSchema: gradingSchema,
      responseSchema: responseSchema,

      // Status fields - all completed since we processed atomically
      processingStatus: assignmentFilePath ? 'completed' : 'not_applicable',
      rubricProcessingStatus: rubricFilePath ? 'completed' : (processedRubric ? 'completed' : 'not_applicable'),
      solutionProcessingStatus: solutionFilePath ? 'completed' : 'not_applicable',
      gradingSchemaStatus: gradingSchema ? 'completed' : 'not_applicable',

      // Metadata
      rubricExtractionSource: rubricExtractionSource,
      evaluationReadyStatus: evaluationReadyStatus,

      // Timestamps
      processingStartedAt: new Date(),
      processingCompletedAt: new Date(),
      rubricProcessingStartedAt: new Date(),
      rubricProcessingCompletedAt: new Date(),
      gradingSchemaExtractedAt: gradingSchema ? new Date() : null,
      responseSchemaBuiltAt: responseSchema ? new Date() : null
    });

    await assignment.save();
    console.log('✅ Assignment created successfully:', assignment._id);

    // STEP 6: Increment User Usage
    try {
      const User = require('../models/user');
      let user = null;

      if (userId && userId.match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findById(userId);
      }

      if (!user) {
        user = await User.findOne({ clerkId: userId });
      }

      if (user) {
        await user.incrementUsage('assignmentsCreated');
        console.log(`[Atomic Controller] Incrementing assignment usage for user ${user._id}`);
      }
    } catch (trackingError) {
      console.error('Error incrementing assignment usage:', trackingError);
    }

    // Return success response
    res.status(201).json({
      message: 'Assignment created successfully after atomic processing',
      assignment: assignment,
      processingSummary: {
        assignmentProcessed: !!processedAssignment,
        rubricProcessed: !!processedRubric,
        solutionProcessed: !!processedSolution,
        schemaExtracted: !!gradingSchema,
        evaluationReady: evaluationReadyStatus
      }
    });

  } catch (error) {
    console.error('❌ Atomic assignment creation failed:', error);

    // Clean up uploaded files on failure
    if (req.files) {
      for (const key in req.files) {
        for (const file of req.files[key]) {
          try {
            await fs.unlink(file.path);
            console.log(`🗑️ Cleaned up file: ${file.path}`);
          } catch (cleanupError) {
            console.warn('Could not clean up file:', cleanupError.message);
          }
        }
      }
    }

    // Delete assignment if it was partially created
    if (assignment && assignment._id) {
      try {
        await Assignment.findByIdAndDelete(assignment._id);
        console.log(`🗑️ Rolled back partial assignment: ${assignment._id}`);
      } catch (rollbackError) {
        console.error('Could not rollback assignment:', rollbackError.message);
      }
    }

    res.status(500).json({
      error: 'Failed to create assignment atomically',
      details: error.message
    });
  }
};

/**
 * Check if atomic creation is available
 */
exports.isAtomicCreationAvailable = async (req, res) => {
  try {
    const { isConnected } = require('../config/db');
    const isDBConnected = isConnected();
    const isLandingAI = isLandingAIConfigured();

    res.status(200).json({
      available: isDBConnected,
      databaseConnected: isDBConnected,
      landingAIConfigured: isLandingAI,
      note: 'Atomic creation requires database connection'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

