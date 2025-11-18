/**
 * Orchestration Processor
 * Validates and integrates assignment, rubric, and solution documents
 */
const { orchestrationQueue } = require('../config/queue');
const { orchestrateAssignmentData } = require('../utils/geminiService');
const { Assignment } = require('../models/assignment');
const { updateAssignmentEvaluationReadiness } = require('../utils/assignmentUtils');

// Process orchestration jobs
orchestrationQueue.process(async (job) => {
  console.log(`Processing orchestration job ${job.id}`);
  
  const { assignmentId, forceReread } = job.data;
  
  if (!assignmentId) {
    throw new Error('Missing assignmentId for orchestration');
  }
  
  try {
    // Fetch the assignment with all processed data
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }
    
    // Check if we have the minimum required data (assignment must be processed)
    if (!assignment.processedData) {
      throw new Error(`Assignment ${assignmentId} has not been processed yet`);
    }
    
    // Update orchestration status
    await Assignment.findByIdAndUpdate(assignmentId, {
      orchestrationStatus: 'processing',
      orchestrationStartedAt: new Date()
    });
    
    console.log(`Starting orchestration for assignment ${assignmentId}`);
    console.log(`  - Force re-read files: ${forceReread ? 'YES' : 'NO'}`);
    console.log(`  - Assignment data: ${assignment.processedData ? 'Available' : 'Missing'}`);
    console.log(`  - Rubric data: ${assignment.processedRubric ? 'Available' : 'Not provided'}`);
    console.log(`  - Solution data: ${assignment.processedSolution ? 'Available' : 'Not provided'}`);
    
    // Prepare file paths for potential re-reading
    const filePaths = {
      assignmentPath: assignment.assignmentFile || null,
      rubricPath: assignment.rubricFile || null,
      solutionPath: assignment.solutionFile || null
    };
    
    console.log(`File paths for orchestration:`);
    console.log(`  - Assignment file: ${filePaths.assignmentPath || 'Not available'}`);
    console.log(`  - Rubric file: ${filePaths.rubricPath || 'Not available'}`);
    console.log(`  - Solution file: ${filePaths.solutionPath || 'Not available'}`);
    
    // If forceReread is true, pass null data to force file re-reading
    const assignmentDataToUse = forceReread ? null : assignment.processedData;
    const rubricDataToUse = forceReread ? null : (assignment.processedRubric || null);
    const solutionDataToUse = forceReread ? null : (assignment.processedSolution || null);
    
    if (forceReread) {
      console.log('⚠️  Force re-read enabled: Will re-read all files from disk');
    }
    
    // Call the orchestration function with file paths
    const orchestratedResult = await orchestrateAssignmentData(
      assignmentDataToUse,
      rubricDataToUse,
      solutionDataToUse,
      filePaths
    );
    
    // Extract validation results
    const validation = orchestratedResult.validation || {};
    const hasIssues = !validation.isValid || validation.hasWarnings;
    
    // Build validation summary for database
    const validationResults = {
      hasIssues: hasIssues,
      missingRubricForQuestions: [],
      extraRubricCriteria: [],
      missingSolutionForQuestions: [],
      inconsistentQuestionNumbers: [],
      warnings: [],
      suggestions: []
    };
    
    // Parse issues and categorize them
    if (validation.issues && Array.isArray(validation.issues)) {
      validation.issues.forEach(issue => {
        const message = issue.message || '';
        const affectedQuestions = issue.affectedQuestions || [];
        
        switch (issue.category) {
          case 'rubric':
            if (message.toLowerCase().includes('missing')) {
              validationResults.missingRubricForQuestions.push(...affectedQuestions);
            } else if (message.toLowerCase().includes('extra')) {
              validationResults.extraRubricCriteria.push(...affectedQuestions);
            }
            break;
          case 'solution':
            validationResults.missingSolutionForQuestions.push(...affectedQuestions);
            break;
          case 'numbering':
            validationResults.inconsistentQuestionNumbers.push(...affectedQuestions);
            break;
        }
        
        if (issue.severity === 'warning') {
          validationResults.warnings.push(message);
        }
      });
    }
    
    // Extract recommendations
    if (orchestratedResult.recommendations && Array.isArray(orchestratedResult.recommendations)) {
      validationResults.suggestions = orchestratedResult.recommendations.map(rec => 
        `[${rec.priority}] ${rec.recommendation}`
      );
    }
    
    // Update assignment with orchestrated data
    await Assignment.findByIdAndUpdate(assignmentId, {
      orchestrationStatus: 'completed',
      orchestrationCompletedAt: new Date(),
      orchestratedData: orchestratedResult,
      validationResults: validationResults
    });
    
    console.log(`Orchestration completed for assignment ${assignmentId}`);
    console.log(`  - Validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(`  - Completeness: ${validation.completenessScore || 0}%`);
    console.log(`  - Issues found: ${validation.issues?.length || 0}`);
    console.log(`  - Recommendations: ${orchestratedResult.recommendations?.length || 0}`);
    
    // Update evaluation readiness status after orchestration
    await updateAssignmentEvaluationReadiness(assignmentId);
    
    return { 
      success: true, 
      assignmentId,
      validation: {
        isValid: validation.isValid,
        completenessScore: validation.completenessScore,
        issueCount: validation.issues?.length || 0
      }
    };
    
  } catch (error) {
    console.error(`Error during orchestration for assignment ${assignmentId}:`, error);
    
    // Update orchestration status to failed
    await Assignment.findByIdAndUpdate(assignmentId, {
      orchestrationStatus: 'failed',
      orchestrationError: error.message,
      orchestrationCompletedAt: new Date()
    });
    
    throw error;
  }
});

console.log('Orchestration processor worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Orchestration processor shutting down');
  await orchestrationQueue.close();
  process.exit(0);
});

module.exports = orchestrationQueue;
