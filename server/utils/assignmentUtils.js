/**
 * Utility functions for assignments
 */
const { Assignment } = require('../models/assignment');
const { orchestrationQueue } = require('../config/queue');

/**
 * Check if all documents are processed and trigger orchestration if needed
 * @param {string} assignmentId - The ID of the assignment to check
 */
async function checkAndTriggerOrchestration(assignmentId) {
  try {
    // ORCHESTRATION DISABLED - Orchestration must be triggered manually via API
    console.log(`Orchestration auto-trigger is DISABLED for assignment ${assignmentId}`);
    console.log(`Use the /api/assignments/:id/rerun-orchestration endpoint to run orchestration manually`);
    return;
    
    /* ORIGINAL CODE - COMMENTED OUT
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      console.error(`Assignment not found: ${assignmentId}`);
      return;
    }

    // Check if assignment is processed
    const assignmentProcessed = assignment.processingStatus === 'completed';
    
    // Check if rubric is processed or not needed
    const rubricProcessed = !assignment.rubricFile || 
                           assignment.rubricProcessingStatus === 'completed' ||
                           assignment.rubricProcessingStatus === 'skipped';
    
    // Check if solution is processed or not needed
    const solutionProcessed = !assignment.solutionFile || 
                             assignment.solutionProcessingStatus === 'completed';
    
    // Check if orchestration is needed and not yet done
    const orchestrationNeeded = assignment.orchestrationStatus === 'pending';
    
    console.log(`Orchestration check for assignment ${assignmentId}:`);
    console.log(`  - Assignment processed: ${assignmentProcessed}`);
    console.log(`  - Rubric ready: ${rubricProcessed}`);
    console.log(`  - Solution ready: ${solutionProcessed}`);
    console.log(`  - Orchestration needed: ${orchestrationNeeded}`);
    
    // Trigger orchestration if all documents are ready
    if (assignmentProcessed && rubricProcessed && solutionProcessed && orchestrationNeeded) {
      console.log(`All documents ready. Triggering orchestration for assignment ${assignmentId}`);
      
      await orchestrationQueue.createJob({
        assignmentId: assignmentId
      }).save();
      
      console.log(`Orchestration job queued for assignment ${assignmentId}`);
    } else {
      console.log(`Not ready for orchestration yet for assignment ${assignmentId}`);
    }
    */
    
  } catch (error) {
    console.error(`Error checking orchestration readiness for ${assignmentId}:`, error);
  }
}

/**
 * Check and update the evaluation readiness status of an assignment
 * This determines if an assignment is ready for evaluation based on all required documents being processed
 * 
 * @param {string} assignmentId - The ID of the assignment to check
 * @returns {Promise<string>} - The updated evaluation ready status
 */
async function updateAssignmentEvaluationReadiness(assignmentId) {
  try {
    // Find the assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      console.error(`Assignment not found: ${assignmentId}`);
      return 'not_ready';
    }

    // Check if the primary assignment is processed
    if (assignment.processingStatus !== 'completed') {
      assignment.evaluationReadyStatus = 'not_ready';
      await assignment.save();
      return 'not_ready';
    }

    // Check rubric status - OPTIONAL for evaluation
    // Rubric is considered available if:
    // 1. There's a separate rubric file that's been processed, OR
    // 2. A rubric has been extracted from the assignment PDF
    // If no rubric is available, grading criteria will be derived from assignment during evaluation
    const hasRubricFromFile = assignment.rubricFile && assignment.rubricProcessingStatus === 'completed';
    const hasRubricFromAssignment = assignment.rubricExtractionSource === 'assignment_pdf' && assignment.rubricProcessingStatus === 'completed';
    const hasRubric = hasRubricFromFile || hasRubricFromAssignment;
    
    // Check solution status - not strictly required but helpful
    const hasSolution = assignment.solutionFile && assignment.solutionProcessingStatus === 'completed';
    
    // Determine readiness status based on what's available
    if (!hasRubric && !hasSolution) {
      // Only assignment processed - can proceed with evaluation (rubric will be derived from assignment)
      assignment.evaluationReadyStatus = 'partial';
      await assignment.save();
      console.log(`Assignment ${assignmentId} ready with assignment only (rubric and solution optional)`);
      return 'partial';
    } else if (!hasSolution || (assignment.solutionFile && assignment.solutionProcessingStatus !== 'completed')) {
      // Assignment processed with rubric, but solution missing or still processing
      assignment.evaluationReadyStatus = 'partial';
      await assignment.save();
      console.log(`Assignment ${assignmentId} ready with assignment${hasRubric ? ' and rubric' : ''} (solution optional)`);
      return 'partial';
    }

    // Everything is processed and ready for evaluation (assignment, rubric, and solution)
    assignment.evaluationReadyStatus = 'ready';
    await assignment.save();
    console.log(`Assignment ${assignmentId} is now fully ready for evaluation with all components`);
    return 'ready';
  } catch (error) {
    console.error(`Error updating assignment evaluation readiness for ${assignmentId}:`, error);
    return 'not_ready';
  }
}

module.exports = {
  updateAssignmentEvaluationReadiness,
  checkAndTriggerOrchestration
};