/**
 * Test script to verify the criteriaGrades to questionScores transformation
 */

// Copy the transformation function here
function transformCriteriaGradesToQuestionScores(criteriaGrades) {
  if (!Array.isArray(criteriaGrades) || criteriaGrades.length === 0) {
    return [];
  }
  
  // Group criteriaGrades by base question number
  const questionMap = new Map();
  
  criteriaGrades.forEach(grade => {
    const questionNumber = grade.questionNumber || 'Unknown';
    const qNumStr = String(questionNumber);
    
    // Extract base question number (e.g., "1" from "1a", "1.1", "1(a)")
    const baseMatch = qNumStr.match(/^(\d+)/);
    const baseQuestion = baseMatch ? baseMatch[1] : qNumStr;
    
    // Determine if this is a subsection
    const isSubsection = /^(\d+)([a-z]|\.\d+|\([a-z]+\)|\s*\([a-z]+\))$/i.test(qNumStr);
    
    if (!questionMap.has(baseQuestion)) {
      questionMap.set(baseQuestion, {
        questionNumber: baseQuestion,
        subsections: [],
        earnedScore: 0,
        maxScore: 0
      });
    }
    
    const question = questionMap.get(baseQuestion);
    
    if (isSubsection) {
      // Extract subsection number (e.g., "a" from "1a", "1" from "1.1")
      let subsectionNumber = qNumStr.substring(baseQuestion.length);
      // Clean up subsection number (remove dots, parentheses, spaces)
      subsectionNumber = subsectionNumber.replace(/^[\.\s\(]+|[\)\s]+$/g, '');
      
      question.subsections.push({
        subsectionNumber: subsectionNumber,
        earnedScore: grade.score || 0,
        maxScore: grade.maxScore || 0,
        feedback: grade.feedback || ''
      });
    } else {
      // This is a standalone question without subsections
      question.subsections.push({
        subsectionNumber: '', // Empty subsection number for standalone questions
        earnedScore: grade.score || 0,
        maxScore: grade.maxScore || 0,
        feedback: grade.feedback || ''
      });
    }
    
    // Accumulate total scores
    question.earnedScore += (grade.score || 0);
    question.maxScore += (grade.maxScore || 0);
  });
  
  // Convert map to array and sort by question number
  const questionScores = Array.from(questionMap.values()).sort((a, b) => {
    const numA = parseInt(a.questionNumber) || 0;
    const numB = parseInt(b.questionNumber) || 0;
    return numA - numB;
  });
  
  // Add question-level feedback (could be enhanced later)
  questionScores.forEach(q => {
    if (q.subsections.length > 0) {
      // Combine subsection feedback for question-level feedback
      const feedbacks = q.subsections.map(s => s.feedback).filter(f => f && f.trim());
      q.feedback = feedbacks.length > 0 ? feedbacks.join(' ') : '';
    } else {
      q.feedback = '';
    }
  });
  
  return questionScores;
}

// Test data - simulating old criteriaGrades format
const testCriteriaGrades = [
  { questionNumber: '1.1', score: 1, maxScore: 1, feedback: 'Good description of search space' },
  { questionNumber: '1.2', score: 1, maxScore: 1, feedback: 'Correct branching factor' },
  { questionNumber: '1.3', score: 0.5, maxScore: 1, feedback: 'Minor inaccuracy in complexity' },
  { questionNumber: '1.4', score: 1, maxScore: 1, feedback: 'Excellent example' },
  { questionNumber: '2.1', score: 3, maxScore: 3, feedback: 'Perfect implementation' },
  { questionNumber: '2.2', score: 1, maxScore: 1, feedback: 'Good analysis' },
  { questionNumber: '2.3', score: 1, maxScore: 1, feedback: 'Correct' },
  { questionNumber: '3a', score: 2, maxScore: 2, feedback: 'Good' },
  { questionNumber: '3b', score: 1, maxScore: 1, feedback: 'Correct' },
  { questionNumber: '4', score: 5, maxScore: 5, feedback: 'Perfect standalone question' },
];

console.log('=== Testing criteriaGrades to questionScores Transformation ===\n');
console.log('Input criteriaGrades:');
console.log(JSON.stringify(testCriteriaGrades, null, 2));

const result = transformCriteriaGradesToQuestionScores(testCriteriaGrades);

console.log('\n\nOutput questionScores:');
console.log(JSON.stringify(result, null, 2));

console.log('\n\n=== Summary ===');
result.forEach(q => {
  console.log(`\nQuestion ${q.questionNumber}: ${q.earnedScore}/${q.maxScore}`);
  if (q.subsections && q.subsections.length > 0) {
    q.subsections.forEach(s => {
      const subsecLabel = s.subsectionNumber ? `  ${q.questionNumber}.${s.subsectionNumber}` : `  ${q.questionNumber}`;
      console.log(`${subsecLabel}: ${s.earnedScore}/${s.maxScore}`);
    });
  }
});

console.log('\n=== Test Complete ===');
