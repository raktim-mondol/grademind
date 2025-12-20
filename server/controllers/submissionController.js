const { Submission } = require('../models/submission');
const { Assignment } = require('../models/assignment');
const fs = require('fs').promises;
const path = require('path');
const { processFileForGemini } = require('../utils/pdfExtractor');
const { submissionProcessingQueue } = require('../config/queue');
const { isConnected } = require('../config/db');
const { getUserId, isAuthenticated, verifyOwnership } = require('../utils/authHelper');
const Excel = require('exceljs');
const os = require('os');

// Helper function to convert column number to Excel column letter (A, B, C, ... AA, AB, etc)
function getExcelColumnLetter(columnNumber) {
  let columnName = '';
  let dividend = columnNumber;
  let modulo;

  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - 1) / 26);
  }
  return columnName;
}

// Helper function to define base columns
function defineBaseColumns() {
  return [
    { header: 'Serial No.', key: 'serialNo', width: 10 },
    { header: 'Student ID', key: 'studentId', width: 15 },
    { header: 'Student Name', key: 'studentName', width: 25 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Total Score', key: 'totalScore', width: 15, style: { alignment: { horizontal: 'center' } } }
  ];
}

// Helper function to sanitize keys for ExcelJS
function sanitizeKey(key) {
  // Replace non-alphanumeric characters (excluding underscore) with underscore
  // Also trim leading/trailing underscores and collapse multiple underscores
  return String(key)
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '') // Trim leading/trailing underscores
    .replace(/_{2,}/g, '_'); // Collapse multiple underscores
}

// Helper function to transform old criteriaGrades format to questionScores format
// This enables backward compatibility with older evaluations
function transformCriteriaGradesToQuestionScores(criteriaGrades) {
  if (!Array.isArray(criteriaGrades) || criteriaGrades.length === 0) {
    console.log('  ⚠️  transformCriteriaGradesToQuestionScores: Empty or invalid input');
    return [];
  }

  console.log(`  🔄 Transforming ${criteriaGrades.length} criteriaGrades entries...`);

  // Group criteriaGrades by base question number
  const questionMap = new Map();

  criteriaGrades.forEach((grade, idx) => {
    const questionNumber = grade.questionNumber || 'Unknown';
    const qNumStr = String(questionNumber);

    console.log(`    [${idx}] Processing: "${qNumStr}" - ${grade.score}/${grade.maxScore}`);

    // Extract base question number (e.g., "1" from "1a", "1.1", "1(a)")
    const baseMatch = qNumStr.match(/^(\d+)/);
    const baseQuestion = baseMatch ? baseMatch[1] : qNumStr;

    // Determine if this is a subsection (more flexible pattern)
    const isSubsection = /^(\d+)([a-z]|\.\d+|\([a-z]+\)|\s*\([a-z]+\)|\s+[a-z])$/i.test(qNumStr);

    if (!questionMap.has(baseQuestion)) {
      questionMap.set(baseQuestion, {
        questionNumber: baseQuestion,
        subsections: [],
        earnedScore: 0,
        maxScore: 0
      });
      console.log(`      → Created new question group: Q${baseQuestion}`);
    }

    const question = questionMap.get(baseQuestion);

    if (isSubsection) {
      // Extract subsection number (e.g., "a" from "1a", "1" from "1.1")
      let subsectionNumber = qNumStr.substring(baseQuestion.length);
      // Clean up subsection number (remove dots, parentheses, spaces)
      subsectionNumber = subsectionNumber.replace(/^[\.\s\(]+|[\)\s]+$/g, '');

      console.log(`      → Added subsection: ${baseQuestion}.${subsectionNumber}`);

      question.subsections.push({
        subsectionNumber: subsectionNumber,
        earnedScore: grade.score || 0,
        maxScore: grade.maxScore || 0,
        feedback: grade.feedback || ''
      });
    } else {
      // This is a standalone question without subsections
      console.log(`      → Added as standalone question`);

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

  console.log(`  ✅ Transformation complete: ${questionScores.length} questions with subsections`);
  questionScores.forEach(q => {
    console.log(`    Q${q.questionNumber}: ${q.subsections.length} subsections, ${q.earnedScore}/${q.maxScore} marks`);
  });

  return questionScores;
}

// Helper function to define dynamic question columns based on submissions
function defineQuestionColumns(submissions) {
  const questionHeaders = new Map(); // Use a Map to store unique questions and their max scores

  console.log(`\n=== DEBUG: defineQuestionColumns called with ${submissions.length} submissions ===`);

  submissions.forEach((sub, index) => {
    console.log(`\nSubmission ${index + 1}:`, sub.studentId);
    console.log(`  Has evaluationResult:`, !!sub.evaluationResult);

    if (sub.evaluationResult) {
      console.log(`  evaluationResult keys:`, Object.keys(sub.evaluationResult));
      console.log(`  Has questionScores:`, Array.isArray(sub.evaluationResult.questionScores));
      console.log(`  Has criteriaGrades:`, Array.isArray(sub.evaluationResult.criteriaGrades));

      if (sub.evaluationResult.questionScores) {
        console.log(`  questionScores length:`, sub.evaluationResult.questionScores.length);
        // Log sample questionScore structure
        if (sub.evaluationResult.questionScores.length > 0) {
          console.log(`  Sample questionScore[0]:`, JSON.stringify(sub.evaluationResult.questionScores[0], null, 2));
        }
      }
      if (sub.evaluationResult.criteriaGrades) {
        console.log(`  criteriaGrades length:`, sub.evaluationResult.criteriaGrades.length);
        console.log(`  criteriaGrades sample:`, JSON.stringify(sub.evaluationResult.criteriaGrades.slice(0, 2), null, 2));
      }
    }

    // Transform old criteriaGrades to questionScores if needed for backward compatibility
    let questionScoresToUse = sub.evaluationResult?.questionScores;

    // Check if questionScores is missing or empty, then try transformation
    if ((!questionScoresToUse || !Array.isArray(questionScoresToUse) || questionScoresToUse.length === 0) &&
      sub.evaluationResult?.criteriaGrades &&
      Array.isArray(sub.evaluationResult.criteriaGrades) &&
      sub.evaluationResult.criteriaGrades.length > 0) {
      console.log(`  📝 Transforming criteriaGrades to questionScores for backward compatibility`);
      questionScoresToUse = transformCriteriaGradesToQuestionScores(sub.evaluationResult.criteriaGrades);
      console.log(`  ✓ Generated ${questionScoresToUse.length} question entries from criteriaGrades`);
    }

    if (questionScoresToUse && Array.isArray(questionScoresToUse)) {
      // Use the questionScores structure (either native or transformed) for detailed breakdown
      questionScoresToUse.forEach(qScore => {
        const qNum = qScore.questionNumber || 'Unknown';

        if (qScore.subsections && qScore.subsections.length > 0) {
          // Question has subsections - create columns for each subsection
          qScore.subsections.forEach(subsec => {
            const subsecNum = subsec.subsectionNumber || '';

            // Format subsection key based on subsection number format
            // If subsection is a letter (a, b, c) or roman numeral, use parentheses: 1(a), 1(b)
            // If subsection is a number, use dot notation: 1.1, 1.2
            let formattedSubsecKey;
            if (/^\d+$/.test(subsecNum)) {
              // Numeric subsection: use dot notation (1.1, 1.2, etc.)
              formattedSubsecKey = `${qNum}.${subsecNum}`;
            } else if (subsecNum) {
              // Letter or roman numeral: use parentheses (1(a), 1(b), etc.)
              formattedSubsecKey = `${qNum}(${subsecNum})`;
            } else {
              // No subsection number, just use question number
              formattedSubsecKey = qNum;
            }

            const sanitizedKey = sanitizeKey(formattedSubsecKey);

            if (!questionHeaders.has(sanitizedKey) || (subsec.maxScore && subsec.maxScore > (questionHeaders.get(sanitizedKey)?.maxScore || 0))) {
              questionHeaders.set(sanitizedKey, {
                header: formattedSubsecKey,
                maxScore: subsec.maxScore || 0,
                isSubsection: true,
                parentQuestion: qNum
              });
            }
          });
        } else {
          // Question without subsections
          const sanitizedKey = sanitizeKey(qNum);
          if (!questionHeaders.has(sanitizedKey) || (qScore.maxScore && qScore.maxScore > (questionHeaders.get(sanitizedKey)?.maxScore || 0))) {
            questionHeaders.set(sanitizedKey, {
              header: qNum,
              maxScore: qScore.maxScore || 0,
              isSubsection: false
            });
          }
        }
      });
    } else if (sub.evaluationResult && Array.isArray(sub.evaluationResult.criteriaGrades)) {
      // Fallback to old criteriaGrades structure if questionScores not available
      sub.evaluationResult.criteriaGrades.forEach(grade => {
        const originalKey = grade.questionNumber || grade.criterionName || 'Unknown';
        const sanitizedKey = sanitizeKey(originalKey);

        if (!questionHeaders.has(sanitizedKey) || (grade.maxScore && grade.maxScore > (questionHeaders.get(sanitizedKey)?.maxScore || 0))) {
          // Determine if this is a subsection based on questionNumber format (e.g., "1a", "2b", "1.1", "1.2")
          const isSubsection = /^(\d+)([a-z]|\.\d+|\([a-z]+\))$/i.test(String(originalKey));
          const parentQuestion = isSubsection ? String(originalKey).match(/^(\d+)/)?.[1] : originalKey;

          questionHeaders.set(sanitizedKey, {
            header: originalKey,
            maxScore: grade.maxScore || 0,
            isSubsection: isSubsection,
            parentQuestion: parentQuestion
          });
        }
      });
    }
  });

  console.log(`\n=== Total question headers found: ${questionHeaders.size} ===`);
  if (questionHeaders.size > 0) {
    console.log('Question headers:');
    questionHeaders.forEach((value, key) => {
      console.log(`  ${key}: ${value.header} (${value.maxScore} marks)${value.isSubsection ? ' [subsection of Q' + value.parentQuestion + ']' : ''}`);
    });
  } else {
    console.log('⚠️  WARNING: No question headers were created!');
    console.log('⚠️  This means neither questionScores nor criteriaGrades produced valid columns');
    console.log('⚠️  The Excel export will only show total scores without question-level breakdown');
  }
  console.log('=== END defineQuestionColumns DEBUG ===\n');

  // Sort sanitized keys for consistent column order
  const sortedSanitizedKeys = Array.from(questionHeaders.keys()).sort((a, b) => {
    const headerA = questionHeaders.get(a)?.header || '';
    const headerB = questionHeaders.get(b)?.header || '';

    // Extract numeric parts for better sorting (e.g., "1a" -> [1, "a"], "2" -> [2, ""])
    const parseQuestion = (str) => {
      const match = String(str).match(/^(\d+)(.*)$/);
      if (match) {
        return [parseInt(match[1], 10), match[2]];
      }
      return [Infinity, str];
    };

    const [numA, suffixA] = parseQuestion(headerA);
    const [numB, suffixB] = parseQuestion(headerB);

    // First sort by question number
    if (numA !== numB) {
      return numA - numB;
    }
    // Then by suffix (a, b, c, etc.)
    return String(suffixA).localeCompare(String(suffixB));
  });

  const columns = [];
  const columnMetadata = []; // Store metadata for creating grouped headers

  sortedSanitizedKeys.forEach(sanitizedKey => {
    const { header, maxScore, isSubsection, parentQuestion } = questionHeaders.get(sanitizedKey);
    const partHeader = maxScore > 0 ? `${header} (${maxScore})` : header;

    columns.push({
      header: partHeader,
      key: `q_${sanitizedKey}_combined`,
      width: 15,
      style: { alignment: { horizontal: 'center' } }
    });

    // Store metadata for grouped header creation
    columnMetadata.push({
      header: partHeader,
      isSubsection: isSubsection,
      parentQuestion: parentQuestion,
      maxScore: maxScore
    });
  });

  return { columns, columnMetadata };
}

// Helper function to define end columns
function defineEndColumns() {
  return [
    { header: 'Feedback', key: 'feedback', width: 40 },
    { header: 'Submission Date', key: 'submitted', width: 20 },
    { header: 'Evaluation Date', key: 'evaluated', width: 20 }
  ];
}

// Helper function to add title and info rows
function addTitleAndInfoRows(worksheet, assignment, submissions, lastCol) {
  // --- Row 1: Assignment title ---
  worksheet.mergeCells(`A1:${lastCol}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `Assignment Results: ${assignment.title || 'Untitled Assignment'}`;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4167B8' }
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 35;

  // --- Row 2: Export date ---
  worksheet.mergeCells(`A2:${lastCol}2`);
  const infoCell = worksheet.getCell('A2');
  infoCell.value = `Generated: ${new Date().toLocaleString()}`;
  infoCell.font = { italic: true, size: 11, color: { argb: 'FF666666' } };
  infoCell.alignment = { horizontal: 'center' };
  worksheet.getRow(2).height = 25;

  // Empty row for spacing
  worksheet.addRow([]);
}

// Helper function to create grouped question headers (two-row header)
function createGroupedHeaders(worksheet, baseColumns, columnMetadata, endColumns) {
  const groupHeaderRowNum = 4; // Row for question groups (Q1, Q2, etc.)
  const detailHeaderRowNum = 5; // Row for subsections (1.1, 1.2, etc.)

  const groupHeaderRow = worksheet.getRow(groupHeaderRowNum);
  const detailHeaderRow = worksheet.getRow(detailHeaderRowNum);

  let currentCol = 1;

  // Add base column headers (span both rows)
  baseColumns.forEach((col) => {
    worksheet.mergeCells(groupHeaderRowNum, currentCol, detailHeaderRowNum, currentCol);
    const cell = worksheet.getCell(groupHeaderRowNum, currentCol);
    cell.value = col.header;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
    };
    currentCol++;
  });

  // Group question columns by parent question
  const questionGroups = new Map(); // Map of parentQuestion -> array of column indices
  columnMetadata.forEach((meta, index) => {
    if (meta.isSubsection) {
      const parent = meta.parentQuestion;
      if (!questionGroups.has(parent)) {
        questionGroups.set(parent, []);
      }
      questionGroups.get(parent).push({ index, meta });
    } else {
      // Question without subsections - treat as its own group
      const questionNum = meta.header.split(' ')[0]; // Extract just the question number (e.g., "1" from "1 (4)")
      questionGroups.set(questionNum, [{ index, meta }]);
    }
  });

  // Sort the question groups by question number to ensure proper order
  const sortedGroups = Array.from(questionGroups.entries()).sort((a, b) => {
    const numA = parseInt(a[0]) || 0;
    const numB = parseInt(b[0]) || 0;
    return numA - numB;
  });

  // Create grouped headers in sorted order
  sortedGroups.forEach(([parentQuestionNum, subsections]) => {
    const startCol = currentCol;
    const endCol = currentCol + subsections.length - 1;

    // Calculate total marks for this question group
    const totalMarks = subsections.reduce((sum, item) => sum + (item.meta.maxScore || 0), 0);

    // Merge cells for parent question header if there are multiple subsections
    if (subsections.length > 1) {
      worksheet.mergeCells(groupHeaderRowNum, startCol, groupHeaderRowNum, endCol);
    }

    const groupCell = worksheet.getCell(groupHeaderRowNum, startCol);
    groupCell.value = `Q ${parentQuestionNum} (${totalMarks} marks)`;
    groupCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    groupCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4A817' } }; // Gold color for question groups
    groupCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    groupCell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
    };

    // Add subsection headers in detail row
    subsections.forEach(({ meta }) => {
      const detailCell = detailHeaderRow.getCell(currentCol);
      detailCell.value = meta.header;
      detailCell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      detailCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } };
      detailCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      detailCell.border = {
        top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
      };
      currentCol++;
    });
  });

  // Add end column headers (span both rows)
  endColumns.forEach((col) => {
    worksheet.mergeCells(groupHeaderRowNum, currentCol, detailHeaderRowNum, currentCol);
    const cell = worksheet.getCell(groupHeaderRowNum, currentCol);
    cell.value = col.header;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
    };
    currentCol++;
  });

  groupHeaderRow.height = 25;
  detailHeaderRow.height = 25;

  return detailHeaderRowNum; // Return the row number of the detail header
}


// Helper function to style the header row
function styleHeaderRow(worksheet, headerRowNum, baseColumns, questionColumns, endColumns) {
  const headerRow = worksheet.getRow(headerRowNum);
  headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }; // White text
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2E5090' } // Darker theme color
  };
  headerRow.height = 35; // Increased height for better visibility

  // Add borders to header row
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
    };

    // Special border for the last cell in the header
    if (cell.address === `${getExcelColumnLetter(baseColumns.length + questionColumns.length + endColumns.length)}${headerRowNum}`) {
      cell.border.right = { style: 'medium', color: { argb: 'FF000000' } };
    }
    // Special border for the first cell
    if (cell.address === `A${headerRowNum}`) {
      cell.border.left = { style: 'medium', color: { argb: 'FF000000' } };
    }
  });
}

// Helper function to populate data rows
function populateDataRows(worksheet, submissions, dataStartRow) {
  submissions.forEach((sub, index) => {
    const rowNum = dataStartRow + index;
    const row = worksheet.getRow(rowNum);

    // --- Populate Base Columns ---
    row.getCell('serialNo').value = index + 1; // Add serial number
    row.getCell('studentId').value = sub.studentId || 'N/A';
    row.getCell('studentName').value = sub.studentName || 'N/A';
    row.getCell('status').value = sub.evaluationStatus || sub.processingStatus || 'unknown'; // Use evaluationStatus first

    // --- Populate Total Score in "earned/total" format ---
    const totalScoreCell = row.getCell('totalScore');
    if (sub.evaluationResult) {
      const earnedScore = typeof sub.evaluationResult.overallGrade === 'number' ? sub.evaluationResult.overallGrade : 0;
      const totalPossible = typeof sub.evaluationResult.totalPossible === 'number'
        ? sub.evaluationResult.totalPossible
        : (sub.assignment ? sub.assignment.totalPoints : 100);
      totalScoreCell.value = `${earnedScore}/${totalPossible}`;
    } else {
      const totalPossible = sub.assignment ? sub.assignment.totalPoints : 100;
      totalScoreCell.value = `0/${totalPossible}`;
    }

    // --- Populate Dynamic Question Columns ---
    const gradesMap = new Map(); // Map sanitized keys to scores

    // Transform old criteriaGrades to questionScores if needed for backward compatibility
    let questionScoresToUse = sub.evaluationResult?.questionScores;

    // Check if questionScores is missing or empty, then try transformation
    if ((!questionScoresToUse || !Array.isArray(questionScoresToUse) || questionScoresToUse.length === 0) &&
      sub.evaluationResult?.criteriaGrades &&
      Array.isArray(sub.evaluationResult.criteriaGrades) &&
      sub.evaluationResult.criteriaGrades.length > 0) {
      questionScoresToUse = transformCriteriaGradesToQuestionScores(sub.evaluationResult.criteriaGrades);
    }

    if (questionScoresToUse && Array.isArray(questionScoresToUse)) {
      // Use questionScores structure (either native or transformed)
      questionScoresToUse.forEach(qScore => {
        const qNum = qScore.questionNumber || 'Unknown';

        if (qScore.subsections && qScore.subsections.length > 0) {
          // Process subsections with same formatting as header
          qScore.subsections.forEach(subsec => {
            const subsecNum = subsec.subsectionNumber || '';

            // Format subsection key the same way as in defineQuestionColumns
            let formattedSubsecKey;
            if (/^\d+$/.test(subsecNum)) {
              // Numeric subsection: use dot notation (1.1, 1.2, etc.)
              formattedSubsecKey = `${qNum}.${subsecNum}`;
            } else if (subsecNum) {
              // Letter or roman numeral: use parentheses (1(a), 1(b), etc.)
              formattedSubsecKey = `${qNum}(${subsecNum})`;
            } else {
              // No subsection number, just use question number
              formattedSubsecKey = qNum;
            }

            const sanitizedKey = sanitizeKey(formattedSubsecKey);
            gradesMap.set(sanitizedKey, {
              score: subsec.earnedScore,
              maxScore: subsec.maxScore
            });
          });
        } else {
          // Question without subsections
          const sanitizedKey = sanitizeKey(qNum);
          gradesMap.set(sanitizedKey, {
            score: qScore.earnedScore,
            maxScore: qScore.maxScore
          });
        }
      });
    } else if (sub.evaluationResult && Array.isArray(sub.evaluationResult.criteriaGrades)) {
      // Fallback to old criteriaGrades structure
      sub.evaluationResult.criteriaGrades.forEach(grade => {
        const originalKey = grade.questionNumber || grade.criterionName || 'Unknown';
        const sanitizedKey = sanitizeKey(originalKey);
        gradesMap.set(sanitizedKey, { score: grade.score, maxScore: grade.maxScore });
      });
    }

    // Iterate through the columns defined by defineQuestionColumns
    worksheet.columns.forEach(column => {
      if (column.key.startsWith('q_') && column.key.endsWith('_combined')) {
        const sanitizedKey = column.key.substring(2, column.key.length - 9); // Remove 'q_' and '_combined'
        const gradeData = gradesMap.get(sanitizedKey);
        if (gradeData && typeof gradeData.score === 'number') {
          // Show only the earned score (max score is already in the column header)
          row.getCell(column.key).value = gradeData.score;
        } else {
          row.getCell(column.key).value = '-';
        }
      }
    });

    // --- Populate End Columns ---
    const feedbackCell = row.getCell('feedback'); // Key from defineEndColumns
    const submittedCell = row.getCell('submitted'); // Key from defineEndColumns
    const evaluatedCell = row.getCell('evaluated'); // Key from defineEndColumns

    if (sub.evaluationResult) {
      let feedbackText = '';

      // Get questionScores (native or transformed from criteriaGrades)
      let questionScoresForFeedback = sub.evaluationResult.questionScores;
      if ((!questionScoresForFeedback || !Array.isArray(questionScoresForFeedback) || questionScoresForFeedback.length === 0) &&
        sub.evaluationResult.criteriaGrades &&
        Array.isArray(sub.evaluationResult.criteriaGrades) &&
        sub.evaluationResult.criteriaGrades.length > 0) {
        questionScoresForFeedback = transformCriteriaGradesToQuestionScores(sub.evaluationResult.criteriaGrades);
      }

      // Add question-level feedback first (explaining marks lost per question)
      if (questionScoresForFeedback && Array.isArray(questionScoresForFeedback)) {
        const questionsWithFeedback = questionScoresForFeedback.filter(q =>
          q.feedback && q.feedback.trim() && (q.earnedScore < q.maxScore || (q.subsections && q.subsections.some(s => s.earnedScore < s.maxScore)))
        );

        if (questionsWithFeedback.length > 0) {
          feedbackText += `Question-Level Feedback:\n`;
          questionsWithFeedback.forEach(qScore => {
            const qNum = qScore.questionNumber || 'Unknown';
            const earned = qScore.earnedScore || 0;
            const max = qScore.maxScore || 0;
            const marksLost = max - earned;

            if (marksLost > 0 || qScore.feedback) {
              feedbackText += `\nQ${qNum} (Lost ${marksLost.toFixed(1)}/${max} marks): ${qScore.feedback}\n`;
            }

            // Add subsection feedback if available
            if (qScore.subsections && qScore.subsections.length > 0) {
              qScore.subsections.forEach(subsec => {
                const subsecEarned = subsec.earnedScore || 0;
                const subsecMax = subsec.maxScore || 0;
                const subsecLost = subsecMax - subsecEarned;

                if (subsecLost > 0 && subsec.feedback && subsec.feedback.trim()) {
                  const subsecNum = subsec.subsectionNumber || '';
                  let formattedSubsec = '';
                  if (/^\d+$/.test(subsecNum)) {
                    formattedSubsec = `${qNum}.${subsecNum}`;
                  } else if (subsecNum) {
                    formattedSubsec = `${qNum}(${subsecNum})`;
                  }
                  feedbackText += `  • ${formattedSubsec} (-${subsecLost.toFixed(1)}): ${subsec.feedback}\n`;
                }
              });
            }
          });
          feedbackText += '\n';
        }
      }

      // Add general strengths, improvements, and suggestions
      if (sub.evaluationResult.strengths && sub.evaluationResult.strengths.length > 0) {
        feedbackText += `Strengths:\n- ${sub.evaluationResult.strengths.join('\n- ')}\n\n`;
      }
      if (sub.evaluationResult.areasForImprovement && sub.evaluationResult.areasForImprovement.length > 0) {
        feedbackText += `Areas for Improvement:\n- ${sub.evaluationResult.areasForImprovement.join('\n- ')}\n\n`;
      }
      if (sub.evaluationResult.suggestions && sub.evaluationResult.suggestions.length > 0) {
        feedbackText += `Suggestions:\n- ${sub.evaluationResult.suggestions.join('\n- ')}\n\n`;
      }
      feedbackCell.value = feedbackText.trim() || 'No detailed feedback available.';
      evaluatedCell.value = sub.evaluationDate ? new Date(sub.evaluationDate) : null;
    } else {
      feedbackCell.value = sub.evaluationStatus === 'failed' ? `Evaluation failed: ${sub.evaluationError || 'Unknown error'}` : 'Not evaluated yet.';
      evaluatedCell.value = null;
    }

    submittedCell.value = sub.submitDate ? new Date(sub.submitDate) : null;
    submittedCell.numFmt = 'yyyy-mm-dd hh:mm';
    evaluatedCell.numFmt = 'yyyy-mm-dd hh:mm';

    const status = sub.evaluationStatus || sub.processingStatus;
    const statusCell = row.getCell('status');
    if (status === 'completed') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }; // Light green
      statusCell.font = { color: { argb: 'FF006100' } }; // Dark green text
    } else if (status === 'failed') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }; // Light red
      statusCell.font = { color: { argb: 'FF9C0006' } }; // Dark red text
    } else if (status === 'evaluating' || status === 'pending') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }; // Light yellow
      statusCell.font = { color: { argb: 'FF9C6500' } }; // Dark yellow text
    }

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
      };

      // Get column definition by column index
      const colDef = worksheet.getColumn(cell.col);

      // Default alignment
      cell.alignment = {
        vertical: 'top',
        horizontal: colDef?.style?.alignment?.horizontal || 'left',
        wrapText: false
      };

      // Apply specific formatting based on column key
      if (colDef && colDef.key === 'feedback') {
        // Enable text wrapping for feedback but row height will remain fixed
        cell.alignment.wrapText = true;
      }

      // Center align specific columns
      if (colDef && (['status', 'totalScore', 'serialNo'].includes(colDef.key) ||
        (colDef.key && colDef.key.startsWith('q_')))) {
        cell.alignment.horizontal = 'center';
      }
    });

    // Set fixed row height (prevents auto-expansion based on content)
    row.height = 30; // Reduced to a more compact fixed height for consistency
  });
}

// Helper function to add summary statistics
// Helper function to get PDF information for a submission
function getSubmissionPdfInfo(submission) {
  const info = {
    hasConvertedPdf: false,
    originalFile: submission.submissionFile,
    pdfFile: null,
    fileType: submission.fileType || 'unknown',
    isIpynbConversion: false
  };

  if (submission.processedFilePath) {
    info.pdfFile = submission.processedFilePath;
    info.hasConvertedPdf = true;

    // Check if this was an IPYNB conversion
    if (submission.fileType === '.ipynb' && submission.originalFilePath && submission.processedFilePath !== submission.originalFilePath) {
      info.isIpynbConversion = true;
    }
  }

  return info;
}

function addSummaryStatistics(worksheet, submissions, lastCol) {
  // Summary statistics section removed for cleaner, simpler export
  // Only the main data table is included
}

// Helper function to create detailed feedback worksheet
// COMMENTED OUT - No longer needed as per user requirements (single sheet with student rows only)
/*
function createDetailedFeedbackSheet(workbook, submissions, assignment) {
  const feedbackSheet = workbook.addWorksheet('Detailed Feedback', {
    properties: { tabColor: { argb: 'FF28A745' } }
  });

  // Define columns for detailed feedback
  feedbackSheet.columns = [
    { header: 'Student ID', key: 'studentId', width: 15 },
    { header: 'Student Name', key: 'studentName', width: 25 },
    { header: 'Question', key: 'question', width: 15 },
    { header: 'Question Text', key: 'questionText', width: 40 },
    { header: 'Subsection', key: 'subsection', width: 12 },
    { header: 'Max Score', key: 'maxScore', width: 12 },
    { header: 'Earned Score', key: 'earnedScore', width: 12 },
    { header: 'Feedback', key: 'feedback', width: 60 }
  ];

  // Add title
  feedbackSheet.mergeCells('A1:H1');
  const titleCell = feedbackSheet.getCell('A1');
  titleCell.value = `Detailed Question-Level Feedback: ${assignment.title || 'Untitled Assignment'}`;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF28A745' }
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  feedbackSheet.getRow(1).height = 30;

  // Add info row
  feedbackSheet.mergeCells('A2:H2');
  const infoCell = feedbackSheet.getCell('A2');
  infoCell.value = `Generated: ${new Date().toLocaleString()}`;
  infoCell.font = { italic: true, size: 10 };
  infoCell.alignment = { horizontal: 'center' };
  feedbackSheet.getRow(2).height = 20;

  // Empty row
  feedbackSheet.addRow([]);

  // Style header row (row 4)
  const headerRow = feedbackSheet.getRow(4);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF28A745' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 30;

  // Add data rows
  let rowNum = 5;
  submissions.forEach(sub => {
    if (sub.evaluationResult && Array.isArray(sub.evaluationResult.questionScores)) {
      sub.evaluationResult.questionScores.forEach(qScore => {
        if (qScore.subsections && qScore.subsections.length > 0) {
          // Add row for each subsection
          qScore.subsections.forEach(subsec => {
            const row = feedbackSheet.getRow(rowNum++);
            row.getCell('studentId').value = sub.studentId || 'N/A';
            row.getCell('studentName').value = sub.studentName || 'N/A';
            row.getCell('question').value = qScore.questionNumber || 'N/A';
            row.getCell('questionText').value = qScore.questionText || 'N/A';
            row.getCell('subsection').value = subsec.subsectionNumber || 'N/A';
            row.getCell('maxScore').value = subsec.maxScore || 0;
            row.getCell('earnedScore').value = subsec.earnedScore || 0;
            row.getCell('feedback').value = subsec.feedback || 'No feedback';
            
            // Apply styling
            row.eachCell((cell) => {
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
              };
              cell.alignment = { vertical: 'top', wrapText: true };
            });
            
            // Center align numeric cells
            row.getCell('maxScore').alignment = { horizontal: 'center', vertical: 'middle' };
            row.getCell('earnedScore').alignment = { horizontal: 'center', vertical: 'middle' };
            row.height = 40;
          });
        } else {
          // Add single row for question without subsections
          const row = feedbackSheet.getRow(rowNum++);
          row.getCell('studentId').value = sub.studentId || 'N/A';
          row.getCell('studentName').value = sub.studentName || 'N/A';
          row.getCell('question').value = qScore.questionNumber || 'N/A';
          row.getCell('questionText').value = qScore.questionText || 'N/A';
          row.getCell('subsection').value = '-';
          row.getCell('maxScore').value = qScore.maxScore || 0;
          row.getCell('earnedScore').value = qScore.earnedScore || 0;
          row.getCell('feedback').value = qScore.feedback || 'No feedback';
          
          // Apply styling
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
              left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
              bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
              right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
              };
            cell.alignment = { vertical: 'top', wrapText: true };
          });
          
          // Center align numeric cells
          row.getCell('maxScore').alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell('earnedScore').alignment = { horizontal: 'center', vertical: 'middle' };
          row.height = 40;
        }
      });
    }
  });

  // Freeze panes
  feedbackSheet.views = [
    {
      state: 'frozen',
      xSplit: 2,
      ySplit: 4,
      topLeftCell: 'C5',
      activeCell: 'A1'
    }
  ];

  // Add auto-filter
  if (rowNum > 5) {
    feedbackSheet.autoFilter = {
      from: 'A4',
      to: `H${rowNum - 1}`
    };
  }
}
*/

// Helper function to write and send the Excel file
async function writeAndSendExcel(res, workbook, assignment) {
  try {
    const tempDir = os.tmpdir();
    const safeName = (assignment.title || 'Assignment').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const tempFilePath = path.join(tempDir, `${safeName}_results_${Date.now()}.xlsx`);

    await workbook.xlsx.writeFile(tempFilePath);

    res.download(tempFilePath, `${safeName}_results.xlsx`, async (err) => {
      try {
        if (await fs.stat(tempFilePath)) {
          await fs.unlink(tempFilePath);
        }
      } catch (unlinkErr) {
        console.error(`Error deleting temporary Excel file ${tempFilePath}:`, unlinkErr);
      }

      if (err && !res.headersSent) {
        console.error('Error sending Excel file:', err);
        return res.status(500).json({ error: 'Failed to send Excel file' });
      }
    });
  } catch (fileError) {
    console.error('Error creating or writing Excel file:', fileError);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate Excel file: ' + fileError.message });
    }
  }
}

// Create a new submission (for single submission uploads)
exports.uploadSubmission = async (req, res) => {
  try {
    // Check database connection first
    if (!isConnected()) {
      console.error('Database is not connected');
      return res.status(500).json({
        error: 'Database connection error. Please ensure MongoDB is running and try again.'
      });
    }

    console.log('Submission upload request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const { assignmentId, studentId, studentName, comments } = req.body;

    if (!assignmentId) {
      console.log('Missing assignmentId in request');
      return res.status(400).json({ error: 'Assignment ID is required' });
    }

    if (!studentId) {
      console.log('Missing studentId in request');
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const userId = getUserId(req);

    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        console.log('Assignment not found:', assignmentId);
        return res.status(404).json({ error: 'Assignment not found' });
      }

      // Verify ownership
      if (!verifyOwnership(assignment.userId, req)) {
        return res.status(403).json({ error: 'Access denied. You do not own this assignment.' });
      }

      console.log('Assignment found:', assignment._id);
    } catch (err) {
      console.error('Error finding assignment:', err);
      return res.status(404).json({ error: 'Invalid assignment ID format or assignment not found' });
    }

    const submissionFile = req.file;
    if (!submissionFile) {
      console.log('No submission file provided in request');
      return res.status(400).json({ error: 'Submission file is required' });
    }

    const submissionFilePath = submissionFile.path;
    const originalFileName = submissionFile.originalname;
    console.log('Submission file path:', submissionFilePath);
    console.log('Original file name:', originalFileName);

    // Check for duplicate filename for this assignment
    try {
      const existingSubmission = await Submission.findOne({
        assignmentId,
        originalFileName: originalFileName
      });

      if (existingSubmission) {
        // Delete the uploaded file since we're rejecting it
        if (fs.existsSync(submissionFilePath)) {
          fs.unlinkSync(submissionFilePath);
        }

        console.log(`⚠️ Duplicate file detected: ${originalFileName} for assignment ${assignmentId}`);
        return res.status(409).json({
          error: 'Duplicate file detected',
          message: `A submission with the filename "${originalFileName}" already exists for this assignment. Please delete the existing submission if you want to re-evaluate.`,
          existingSubmissionId: existingSubmission._id,
          existingStudentId: existingSubmission.studentId,
          existingStudentName: existingSubmission.studentName
        });
      }
    } catch (duplicateCheckError) {
      console.error('Error checking for duplicate filename:', duplicateCheckError);
      // Continue with upload if duplicate check fails (fail open)
    }

    try {
      const submission = new Submission({
        assignmentId,
        studentId,
        studentName: studentName || studentId,
        comments,
        submissionFile: submissionFilePath,
        originalFileName: originalFileName,
        processingStatus: 'pending',
        evaluationStatus: 'pending',
        submitDate: new Date()
      });

      console.log('Creating submission document:', {
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        studentName: submission.studentName,
        filePath: submission.submissionFile
      });

      await submission.save();
      console.log('Submission saved to database:', submission._id);

      console.log('Processing file for Gemini:', submissionFilePath);

      try {
        const processResult = await processFileForGemini(submissionFilePath);

        if (processResult.success) {
          console.log('File processing successful, queueing for processing');
          console.log(`Original file: ${processResult.originalPath}`);
          console.log(`Processed file (PDF): ${processResult.filePath}`);
          console.log(`File type: ${processResult.fileType}`);

          // Store the processed file paths immediately in the submission
          submission.originalFilePath = processResult.originalPath;
          submission.processedFilePath = processResult.filePath;
          submission.fileType = processResult.fileType;
          await submission.save();

          await submissionProcessingQueue.createJob({
            submissionId: submission._id,
            studentId: studentId,
            filePath: processResult.filePath,
            originalPath: processResult.originalPath,
            fileType: processResult.fileType
          }).save();

          // Manually track usage using req.user (already populated by syncUser middleware)
          try {
            // Use req.user directly - it's already the MongoDB user document from syncUser middleware
            if (req.user) {
              await req.user.incrementUsage('totalSubmissionsGraded');
              console.log(`[Controller] Incremented usage for user ${req.user._id} (Clerk: ${req.user.clerkId})`);
              console.log(`[Controller] New lifetimeSubmissionsChecked: ${req.user.usage.lifetimeSubmissionsChecked}`);
            } else {
              // Fallback: try to find user by clerkId if req.user is not set
              const User = require('../models/user');
              let user = await User.findOne({ clerkId: userId });
              if (user) {
                await user.incrementUsage('totalSubmissionsGraded');
                console.log(`[Controller] Fallback: Incremented usage for user ${user._id}`);
              } else {
                console.warn(`[Controller] Could not find user to increment usage for ID: ${userId}`);
              }
            }
          } catch (trackingError) {
            console.error('Error tracking usage for submission:', trackingError);
          }

          console.log(`Submission ${submission._id} queued for processing`);
          if (processResult.fileType === '.ipynb') {
            console.log(`✅ IPYNB file converted to PDF and stored in database`);
            console.log(`   Original IPYNB: ${processResult.originalPath}`);
            console.log(`   Converted PDF: ${processResult.filePath}`);
          }
        } else {
          console.error(`File processing failed: ${processResult.error}`);

          submission.processingStatus = 'failed';
          submission.processingError = `File processing failed: ${processResult.error}`;
          await submission.save();

          console.log(`Submission ${submission._id} marked as failed due to file processing error`);
        }
      } catch (extractError) {
        console.error('Error during file processing:', extractError);

        submission.processingStatus = 'failed';
        submission.processingError = 'Error in file processing: ' + extractError.message;
        await submission.save();
        console.log('Submission marked as failed processing but request will continue');
      }

      // Get PDF information for the response
      const pdfInfo = getSubmissionPdfInfo(submission);

      // Set createdResource for logActivity middleware
      res.locals.createdResource = submission;

      return res.status(201).json({
        message: 'Submission created successfully',
        submission: {
          _id: submission._id,
          studentId: submission.studentId,
          studentName: submission.studentName,
          status: submission.processingStatus,
          fileInfo: {
            originalFile: pdfInfo.originalFile,
            fileType: pdfInfo.fileType,
            hasConvertedPdf: pdfInfo.hasConvertedPdf,
            pdfFile: pdfInfo.pdfFile,
            isIpynbConversion: pdfInfo.isIpynbConversion
          }
        }
      });
    } catch (dbError) {
      console.error('Database error while creating submission:', dbError);
      return res.status(500).json({ error: 'Database error: ' + dbError.message });
    }
  } catch (error) {
    console.error('Error creating submission:', error);
    return res.status(500).json({ error: 'An error occurred while creating the submission: ' + error.message });
  }
};

// Upload batch submissions - processes each submission sequentially and waits for evaluation
exports.uploadBatchSubmissions = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const { assignmentId } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Verify ownership
    if (!verifyOwnership(assignment.userId, req)) {
      return res.status(403).json({ error: 'Access denied. You do not own this assignment.' });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(`\n=== BATCH UPLOAD STARTING: ${files.length} files ===`);
    console.log(`Processing submissions sequentially (one at a time)\n`);

    const results = {
      total: files.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      submissions: [],
      duplicates: []
    };

    // Process files sequentially - wait for each to complete before starting next
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`\n--- Processing file ${i + 1} of ${files.length}: ${file.originalname} ---`);
      
      try {
        const studentId = path.parse(file.originalname).name;
        const studentName = studentId;
        const originalFileName = file.originalname;

        // Check for duplicate filename
        const existingSubmission = await Submission.findOne({
          assignmentId,
          originalFileName: originalFileName
        });

        if (existingSubmission) {
          // Delete the uploaded file since we're skipping it
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }

          console.log(`⚠️ Skipping duplicate file: ${originalFileName}`);
          results.skipped++;
          results.duplicates.push({
            fileName: originalFileName,
            existingSubmissionId: existingSubmission._id,
            existingStudentId: existingSubmission.studentId,
            existingStudentName: existingSubmission.studentName
          });
          continue; // Skip this file
        }

        const submission = new Submission({
          assignmentId,
          studentId,
          studentName,
          submissionFile: file.path,
          originalFileName: originalFileName,
          processingStatus: 'pending',
          evaluationStatus: 'pending',
          submitDate: new Date()
        });

        await submission.save();
        console.log(`Created submission document: ${submission._id}`);

        try {
          const processResult = await processFileForGemini(file.path);

          if (processResult.success) {
            // Store the processed file paths immediately in the submission
            submission.originalFilePath = processResult.originalPath;
            submission.processedFilePath = processResult.filePath;
            submission.fileType = processResult.fileType;
            await submission.save();

            console.log(`File processed successfully`);
            console.log(`  - Original: ${processResult.originalPath}`);
            console.log(`  - Processed: ${processResult.filePath}`);
            console.log(`  - Type: ${processResult.fileType}`);

            // Queue the submission for processing
            await submissionProcessingQueue.createJob({
              submissionId: submission._id,
              studentId,
              filePath: processResult.filePath,
              originalPath: processResult.originalPath,
              fileType: processResult.fileType
            }).save();

            console.log(`Submission queued for processing`);

            // Wait for submission processing to complete
            await waitForSubmissionProcessing(submission._id);
            console.log(`✅ Submission processing completed`);

            // Wait for evaluation to complete
            await waitForEvaluation(submission._id);
            console.log(`✅ Evaluation completed`);

            // Fetch the updated submission to get evaluation results
            const updatedSubmission = await Submission.findById(submission._id);

            results.successful++;
            results.submissions.push({
              id: submission._id,
              studentId,
              studentName,
              status: 'completed',
              score: updatedSubmission.overallGrade || 0,
              totalPossible: updatedSubmission.totalPossible || 0,
              isIpynbConversion: processResult.fileType === '.ipynb',
              evaluationResult: updatedSubmission.evaluationResult
            });

            // Track usage
            try {
              if (req.user) {
                await req.user.incrementUsage('totalSubmissionsGraded');
                console.log(`[Batch Controller] Incremented usage for user ${req.user._id}`);
                await req.user.logActivity('submission_graded', submission._id, 'submission', {
                  title: originalFileName
                });
              } else {
                const User = require('../models/user');
                let user = await User.findOne({ clerkId: userId });
                if (user) {
                  await user.incrementUsage('totalSubmissionsGraded');
                  await user.logActivity('submission_graded', submission._id, 'submission', {
                    title: originalFileName
                  });
                }
              }
            } catch (trackingError) {
              console.error('Error tracking usage:', trackingError);
            }
          } else {
            console.error(`❌ File processing failed: ${processResult.error}`);

            submission.processingStatus = 'failed';
            submission.processingError = `File processing failed: ${processResult.error}`;
            await submission.save();

            results.failed++;
            results.submissions.push({
              id: submission._id,
              studentId,
              studentName,
              status: 'failed',
              error: processResult.error
            });
          }
        } catch (extractProcessError) {
          console.error(`❌ Error during file processing:`, extractProcessError);

          submission.processingStatus = 'failed';
          submission.processingError = 'Error in file processing: ' + extractProcessError.message;
          await submission.save();

          results.failed++;
          results.submissions.push({
            id: submission._id,
            studentId,
            studentName,
            status: 'failed',
            error: extractProcessError.message
          });
        }
      } catch (submissionError) {
        console.error(`❌ Error processing submission:`, submissionError);
        results.failed++;
        results.submissions.push({
          file: file.originalname,
          status: 'failed',
          error: 'Submission creation failed'
        });
      }
    }

    console.log(`\n=== BATCH UPLOAD COMPLETED ===`);
    console.log(`Total: ${results.total}, Successful: ${results.successful}, Failed: ${results.failed}, Skipped: ${results.skipped}\n`);

    res.status(201).json({
      message: 'Batch submissions processed sequentially with immediate results',
      results
    });
  } catch (error) {
    console.error('Error processing batch submissions:', error);
    res.status(500).json({ error: 'An error occurred while processing batch submissions' });
  }
};

// Helper function to wait for submission processing to complete
async function waitForSubmissionProcessing(submissionId, maxWaitTime = 300000) { // 5 minutes max
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const submission = await Submission.findById(submissionId);
    
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }
    
    if (submission.processingStatus === 'completed') {
      return true;
    }
    
    if (submission.processingStatus === 'failed') {
      throw new Error(`Submission processing failed: ${submission.processingError || 'Unknown error'}`);
    }
    
    // Wait 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Submission processing timeout after ${maxWaitTime}ms`);
}

// Helper function to wait for evaluation to complete
async function waitForEvaluation(submissionId, maxWaitTime = 300000) { // 5 minutes max
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const submission = await Submission.findById(submissionId);
    
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }
    
    if (submission.evaluationStatus === 'completed') {
      return true;
    }
    
    if (submission.evaluationStatus === 'failed') {
      throw new Error(`Evaluation failed: ${submission.evaluationError || 'Unknown error'}`);
    }
    
    // Wait 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Evaluation timeout after ${maxWaitTime}ms`);
}

// Get submissions for a specific assignment
exports.getSubmissions = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Verify ownership
    if (!verifyOwnership(assignment.userId, req)) {
      return res.status(403).json({ error: 'Access denied. You do not own this assignment.' });
    }

    console.log(`\n=== GET SUBMISSIONS DEBUG ===`);
    console.log(`Assignment ID: ${assignmentId}`);

    const submissions = await Submission.find({ assignmentId }).sort({ submitDate: -1 });

    console.log(`Found ${submissions.length} submissions for assignment ${assignmentId}`);
    submissions.forEach((sub, index) => {
      console.log(`  ${index + 1}. ${sub.studentId} (${sub.studentName}) - Status: ${sub.evaluationStatus} - Date: ${sub.submitDate}`);
    });
    console.log(`=== END GET SUBMISSIONS DEBUG ===\n`);

    res.status(200).json({ submissions });
  } catch (error) {
    console.error('Error retrieving submissions:', error);
    res.status(500).json({ error: 'An error occurred while retrieving submissions' });
  }
};

// Get a single submission by ID
exports.getSubmissionById = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Verify ownership by checking assignment
    const assignment = await Assignment.findById(submission.assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Associated assignment not found' });
    }

    if (!verifyOwnership(assignment.userId, req)) {
      return res.status(403).json({ error: 'Access denied. You do not own this assignment.' });
    }

    res.status(200).json({ submission });
  } catch (error) {
    console.error('Error retrieving submission:', error);
    res.status(500).json({ error: 'An error occurred while retrieving the submission' });
  }
};

// Export to Excel
/**
 * Excel Export Format:
 * - Single worksheet with students in rows and questions/subquestions in columns
 * - Each row represents one student
 * - Columns are organized as: Serial No, Student ID, Student Name, Status, Question columns, Total Score, Feedback, Dates
 * - Question columns show format like "1.1 (1 mark)", "1.2 (1 mark)", etc. in the header
 * - Individual cells show only the earned marks (e.g., "2" or "3"), not "earned/total" format
 * - Total marks are displayed in the header for each question/subquestion
 * - Total Score column shows "earned/total" format for overall score
 * - Freeze panes for easy navigation (first 3 columns and header rows frozen)
 * - Auto-filter capability for data filtering
 * - Example structure:
 *   Q1 (4marks)                    Q2 (5 marks)           ...
 *   1.1 (1) | 1.2 (1) | 1.3 (1) | 1.4 (1) | 2.1 (3) | 2.2 (1) | 2.3 (1) | ...
 *   Student row shows: 1 | 0 | 1 | 0.5 | 2 | 1 | 0 | ... (only earned marks)
 */
exports.exportToExcel = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Verify ownership
    if (!verifyOwnership(assignment.userId, req)) {
      return res.status(403).json({ error: 'Access denied. You do not own this assignment.' });
    }

    const submissions = await Submission.find({ assignmentId }).sort({ studentId: 1 });
    const workbook = new Excel.Workbook();
    workbook.creator = 'Grademind';
    workbook.created = new Date();

    // Group submissions by sectionName
    const sectionsMap = new Map();
    sectionsMap.set('All Submissions', submissions);

    submissions.forEach(sub => {
      const sectionName = sub.sectionName || 'Default Section';
      if (!sectionsMap.has(sectionName)) {
        sectionsMap.set(sectionName, []);
      }
      sectionsMap.get(sectionName).push(sub);
    });

    // Helper to generate a sheet
    const generateSheet = (sheetName, sheetSubmissions) => {
      // Sheet Name Sanitization
      let safeSheetName = sheetName.replace(/[:\/\\?*\[\]]/g, ' ').trim().substring(0, 31);
      let uniqueCounter = 1;
      let originalName = safeSheetName;
      while (workbook.getWorksheet(safeSheetName)) {
        safeSheetName = `${originalName.substring(0, 28)}(${uniqueCounter++})`;
      }

      const worksheet = workbook.addWorksheet(safeSheetName);

      // --- 1. Determine Dynamic Question Columns ---
      // We scan all submissions to find all possible Question Numbers (e.g. 1.1, 1.2)
      // to ensure the columns exist even if some students skipped them.
      const questionKeys = new Set();
      const questionMaxScores = new Map();

      sheetSubmissions.forEach(sub => {
        const qScores = sub.evaluationResult?.questionScores || [];
        qScores.forEach(q => {
          const qNum = q.questionNumber || 'Unknown';

          // Handle subsections if flattened or nested
          if (q.subsections && q.subsections.length > 0) {
            q.subsections.forEach(subSec => {
              const subsecNum = subSec.subsectionNumber || '';

              // Format the key to match the format used in defineQuestionColumns
              let formattedKey;
              if (/^\d+$/.test(subsecNum)) {
                // Numeric subsection: use dot notation (1.1, 1.2, etc.)
                formattedKey = `${qNum}.${subsecNum}`;
              } else if (subsecNum) {
                // Letter or roman numeral: use parentheses (1(a), 1(b), etc.)
                formattedKey = `${qNum}(${subsecNum})`;
              } else {
                // No subsection number, just use question number
                formattedKey = qNum;
              }

              questionKeys.add(formattedKey);
              if (subSec.maxScore) questionMaxScores.set(formattedKey, subSec.maxScore);
            });
          } else {
            const key = qNum;
            questionKeys.add(key);
            if (q.maxScore) questionMaxScores.set(key, q.maxScore);
          }
        });

        // Also check lostMarks for keys that might exist but have 0 score
        const lostMarks = sub.evaluationResult?.lostMarks || [];
        lostMarks.forEach(lm => {
          if (lm.area) questionKeys.add(lm.area);
        });
      });

      // Sort keys naturally (1.1, 1.2, 2.1 ...)
      const sortedKeys = Array.from(questionKeys).sort((a, b) => {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
      });

      // --- 2. Define Columns ---
      // Structure: Student Name | Student ID | Total Score | Overall Feedback | Task 1.1 | Task 1.2 ...
      const columns = [
        { header: 'Student Name', key: 'studentName', width: 25 },
        { header: 'Student ID', key: 'studentId', width: 15 },
        { header: 'Total Score', key: 'totalScore', width: 12 },
        { header: 'Overall Feedback', key: 'feedback', width: 50, style: { alignment: { wrapText: true } } },
      ];

      sortedKeys.forEach(key => {
        const maxScore = questionMaxScores.get(key) || 0;
        const headerText = maxScore > 0 ? `Task ${key} (${maxScore})` : `Task ${key}`;
        columns.push({ header: headerText, key: `q_${key}`, width: 10 });
      });

      worksheet.columns = columns;

      // --- 3. Populate Rows ---
      sheetSubmissions.forEach(sub => {
        const rowData = {
          studentName: sub.studentName,
          studentId: sub.studentId,
          totalScore: sub.evaluationResult?.overallGrade || 0
        };

        // Construct "Deductions" style feedback
        // "Task 1.1 (-1): Reason | Task 1.2 (-0.5): Reason"
        const deductions = [];
        const lostMarks = sub.evaluationResult?.lostMarks || [];

        lostMarks.forEach(lm => {
          if (lm.pointsLost > 0) {
            deductions.push(`${lm.area} (-${lm.pointsLost}): ${lm.reason}`);
          }
        });

        if (deductions.length > 0) {
          rowData.feedback = deductions.join(' | \n');
        } else {
          rowData.feedback = "Excellent work! Full marks.";
        }

        // Populate Question/Task Scores
        // We need to map from sub.evaluationResult.questionScores to the keys
        const qScores = sub.evaluationResult?.questionScores || [];
        const scoreMap = new Map();

        qScores.forEach(q => {
          const qNum = q.questionNumber || 'Unknown';

          if (q.subsections && q.subsections.length > 0) {
            q.subsections.forEach(s => {
              const subsecNum = s.subsectionNumber || '';

              // Format the key the same way as in the key collection phase
              let formattedKey;
              if (/^\d+$/.test(subsecNum)) {
                // Numeric subsection: use dot notation (1.1, 1.2, etc.)
                formattedKey = `${qNum}.${subsecNum}`;
              } else if (subsecNum) {
                // Letter or roman numeral: use parentheses (1(a), 1(b), etc.)
                formattedKey = `${qNum}(${subsecNum})`;
              } else {
                // No subsection number, just use question number
                formattedKey = qNum;
              }

              scoreMap.set(formattedKey, s.earnedScore);
            });
          } else {
            scoreMap.set(qNum, q.earnedScore);
          }
        });

        sortedKeys.forEach(key => {
          if (scoreMap.has(key)) {
            rowData[`q_${key}`] = scoreMap.get(key);
          } else {
            // Check if it was in lostMarks (meaning 0 score potentially or just listed)
            // If not found, assume 0 or empty? 
            // Better to assume "-" if not attempted, or 0 if attempted.
            // For now, if we have a total score, we presume missing keys are 0 ?
            // Let's use 0 if we have other scores, else empty.
            rowData[`q_${key}`] = 0;
          }
        });

        worksheet.addRow(rowData);
      });

      // Style Header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    };

    // Generate All Sheets
    generateSheet('All Submissions', submissions);
    sectionsMap.forEach((subs, name) => {
      if (name !== 'All Submissions') generateSheet(name, subs);
    });

    // Write Response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const safeTitle = assignment.title.replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_Report.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred while exporting data to Excel: ' + error.message });
    }
  }
};

/**
 * Export submissions to CSV with detailed question scores
 *
 * CSV Structure:
 * - Row 1: Assignment Title
 * - Row 2: Section/Description
 * - Row 3: Empty
 * - Row 4: Headers with question numbers (1.1, 1.2, 2.1, etc.)
 * - Row 5: Max scores for each question
 * - Row 6+: Student data with scores for each question
 */
exports.exportToCsv = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const { assignmentId } = req.params;

    console.log(`\n=== CSV EXPORT: Assignment ID: ${assignmentId} ===`);

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Verify ownership
    if (!verifyOwnership(assignment.userId, req)) {
      return res.status(403).json({ error: 'Access denied. You do not own this assignment.' });
    }

    const submissions = await Submission.find({ assignmentId }).sort({ studentId: 1 });

    console.log(`Found ${submissions.length} submissions for CSV export`);

    // Build the structure of all questions/subsections from all submissions
    const questionStructure = new Map();

    submissions.forEach(sub => {
      let questionScores = sub.evaluationResult?.questionScores;

      // Transform old format if needed
      if ((!questionScores || !Array.isArray(questionScores) || questionScores.length === 0) &&
        sub.evaluationResult?.criteriaGrades &&
        Array.isArray(sub.evaluationResult.criteriaGrades) &&
        sub.evaluationResult.criteriaGrades.length > 0) {
        questionScores = transformCriteriaGradesToQuestionScores(sub.evaluationResult.criteriaGrades);
      }

      if (questionScores && Array.isArray(questionScores)) {
        questionScores.forEach(qScore => {
          const qNum = qScore.questionNumber || 'Unknown';

          if (!questionStructure.has(qNum)) {
            questionStructure.set(qNum, {
              questionNumber: qNum,
              maxScore: qScore.maxScore || 0,
              subsections: new Map()
            });
          }

          const question = questionStructure.get(qNum);
          if (qScore.maxScore > question.maxScore) {
            question.maxScore = qScore.maxScore;
          }

          if (qScore.subsections && qScore.subsections.length > 0) {
            qScore.subsections.forEach(subsec => {
              const subsecKey = subsec.subsectionNumber || '';
              if (!question.subsections.has(subsecKey)) {
                question.subsections.set(subsecKey, {
                  subsectionNumber: subsecKey,
                  maxScore: subsec.maxScore || 0
                });
              } else {
                const existing = question.subsections.get(subsecKey);
                if (subsec.maxScore > existing.maxScore) {
                  existing.maxScore = subsec.maxScore;
                }
              }
            });
          }
        });
      }
    });

    // Sort questions and convert to array
    const sortedQuestions = Array.from(questionStructure.values()).sort((a, b) => {
      const numA = parseInt(a.questionNumber) || 0;
      const numB = parseInt(b.questionNumber) || 0;
      return numA - numB;
    });

    // Build question column info - collect all question/subsection labels
    const questionColumns = [];
    sortedQuestions.forEach(q => {
      const subsections = Array.from(q.subsections.values()).sort((a, b) => {
        const aNum = parseInt(a.subsectionNumber);
        const bNum = parseInt(b.subsectionNumber);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return String(a.subsectionNumber).localeCompare(String(b.subsectionNumber));
      });

      if (subsections.length > 0) {
        subsections.forEach(subsec => {
          // Use the exact format from the evaluation - could be 1.1, 1a, 1i, 1(a), etc.
          let label;
          const subsecNum = subsec.subsectionNumber;
          if (!subsecNum) {
            label = `${q.questionNumber}`;
          } else if (/^\d+$/.test(subsecNum)) {
            // Numeric: 1.1, 1.2, etc.
            label = `${q.questionNumber}.${subsecNum}`;
          } else if (/^[ivxlcdm]+$/i.test(subsecNum)) {
            // Roman numerals: 1.i, 1.ii, etc.
            label = `${q.questionNumber}.${subsecNum}`;
          } else if (/^[a-z]$/i.test(subsecNum)) {
            // Single letter: 1a, 1b, etc.
            label = `${q.questionNumber}${subsecNum}`;
          } else if (/^\([a-z0-9]+\)$/i.test(subsecNum)) {
            // Already has parentheses: 1(a), 1(i), etc.
            label = `${q.questionNumber}${subsecNum}`;
          } else {
            // Default: append with dot
            label = `${q.questionNumber}.${subsecNum}`;
          }
          questionColumns.push({
            label: label,
            maxScore: subsec.maxScore,
            questionNumber: q.questionNumber,
            subsectionNumber: subsec.subsectionNumber
          });
        });
      } else {
        questionColumns.push({
          label: `${q.questionNumber}`,
          maxScore: q.maxScore,
          questionNumber: q.questionNumber,
          subsectionNumber: ''
        });
      }
    });

    // Build CSV rows
    const rows = [];

    // Row 1: Assignment Title
    rows.push([`Assignment: ${assignment.title || 'Untitled Assignment'}`]);

    // Row 2: Section/Description
    rows.push([`Section: ${assignment.section || assignment.description || 'N/A'}`]);

    // Row 3: Export date
    rows.push([`Generated: ${new Date().toLocaleString()}`]);

    // Row 4: Empty row for spacing
    rows.push([]);

    // Row 5: Headers
    const headers = ['Student Name', 'Student ID'];
    questionColumns.forEach(col => {
      headers.push(col.label);
    });
    headers.push('Total Score', 'Total Possible', 'Percentage', 'Strengths', 'Areas for Improvement');
    rows.push(headers);

    // Row 6: Max scores row
    const maxScoreRow = ['Max Score', ''];
    questionColumns.forEach(col => {
      maxScoreRow.push(col.maxScore);
    });
    maxScoreRow.push(assignment.totalPoints || '', '', '', '', '');
    rows.push(maxScoreRow);

    // Data rows for each student
    submissions.forEach(sub => {
      const row = [
        sub.studentName || 'N/A',
        sub.studentId || 'N/A'
      ];

      // Get question scores
      let questionScores = sub.evaluationResult?.questionScores;
      if ((!questionScores || !Array.isArray(questionScores) || questionScores.length === 0) &&
        sub.evaluationResult?.criteriaGrades &&
        Array.isArray(sub.evaluationResult.criteriaGrades) &&
        sub.evaluationResult.criteriaGrades.length > 0) {
        questionScores = transformCriteriaGradesToQuestionScores(sub.evaluationResult.criteriaGrades);
      }

      // Create a map for easy lookup
      const scoresMap = new Map();
      if (questionScores && Array.isArray(questionScores)) {
        questionScores.forEach(qScore => {
          const qNum = qScore.questionNumber || 'Unknown';
          scoresMap.set(qNum, qScore);
        });
      }

      // Fill in scores for each question column
      questionColumns.forEach(col => {
        const qScore = scoresMap.get(col.questionNumber);
        let earnedScore = '';

        if (qScore) {
          if (col.subsectionNumber && qScore.subsections) {
            // Find matching subsection
            const matchingSubsec = qScore.subsections.find(s =>
              s.subsectionNumber === col.subsectionNumber
            );
            if (matchingSubsec) {
              earnedScore = matchingSubsec.earnedScore || 0;
            }
          } else if (!col.subsectionNumber) {
            // Question without subsections
            earnedScore = qScore.earnedScore || 0;
          } else if (qScore.subsections && qScore.subsections.length > 0) {
            // Try to find subsection by number
            const matchingSubsec = qScore.subsections.find(s =>
              s.subsectionNumber === col.subsectionNumber
            );
            if (matchingSubsec) {
              earnedScore = matchingSubsec.earnedScore || 0;
            }
          }
        }

        row.push(earnedScore);
      });

      // Add totals and overall feedback
      const totalEarned = sub.evaluationResult?.overallGrade || 0;
      const totalPossible = sub.evaluationResult?.totalPossible || assignment.totalPoints || 100;
      const percentage = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : '0.0';

      const strengths = sub.evaluationResult?.strengths
        ? (Array.isArray(sub.evaluationResult.strengths)
          ? sub.evaluationResult.strengths.join('; ')
          : sub.evaluationResult.strengths)
        : '';

      const improvements = sub.evaluationResult?.areasForImprovement
        ? (Array.isArray(sub.evaluationResult.areasForImprovement)
          ? sub.evaluationResult.areasForImprovement.join('; ')
          : sub.evaluationResult.areasForImprovement)
        : '';

      row.push(totalEarned, totalPossible, `${percentage}%`, strengths, improvements);
      rows.push(row);
    });

    // Convert to CSV string
    const csvContent = rows.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const cellStr = String(cell === null || cell === undefined ? '' : cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') || cellStr.includes('\r')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    // Send CSV response
    const filename = `${assignment.title.replace(/[^a-z0-9]/gi, '_')}_question_scores.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

    console.log(`✅ CSV export completed: ${filename}`);

  } catch (error) {
    console.error('Error exporting to CSV:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred while exporting data to CSV: ' + error.message });
    }
  }
};

// Get converted PDF for a submission (if IPYNB was converted)
exports.getSubmissionPdf = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Submission ID is required' });
    }

    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Verify ownership by checking assignment
    const assignment = await Assignment.findById(submission.assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Associated assignment not found' });
    }

    if (!verifyOwnership(assignment.userId, req)) {
      return res.status(403).json({ error: 'Access denied. You do not own this assignment.' });
    }

    const pdfInfo = getSubmissionPdfInfo(submission);

    if (!pdfInfo.hasConvertedPdf) {
      return res.status(404).json({
        error: 'No converted PDF available for this submission',
        fileInfo: pdfInfo
      });
    }

    // Check if the PDF file exists
    try {
      await fs.access(pdfInfo.pdfFile);
    } catch (err) {
      return res.status(404).json({
        error: 'PDF file not found on disk',
        expectedPath: pdfInfo.pdfFile
      });
    }

    // Set appropriate headers for PDF
    const fileName = path.basename(pdfInfo.pdfFile);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    // Stream the PDF file
    const readStream = require('fs').createReadStream(pdfInfo.pdfFile);
    readStream.pipe(res);

    readStream.on('error', (err) => {
      console.error('Error streaming PDF file:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error reading PDF file' });
      }
    });

  } catch (error) {
    console.error('Error getting submission PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred while retrieving the PDF' });
    }
  }
};

// Get submission file information including PDF paths
exports.getSubmissionFileInfo = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Submission ID is required' });
    }

    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Verify ownership by checking assignment
    const assignment = await Assignment.findById(submission.assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Associated assignment not found' });
    }

    if (!verifyOwnership(assignment.userId, req)) {
      return res.status(403).json({ error: 'Access denied. You do not own this assignment.' });
    }

    const pdfInfo = getSubmissionPdfInfo(submission);

    res.status(200).json({
      submissionId: submission._id,
      studentId: submission.studentId,
      studentName: submission.studentName,
      fileInfo: pdfInfo,
      processingStatus: submission.processingStatus,
      evaluationStatus: submission.evaluationStatus
    });

  } catch (error) {
    console.error('Error getting submission file info:', error);
    res.status(500).json({ error: 'An error occurred while retrieving submission file information' });
  }
};

// Delete a submission
exports.deleteSubmission = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Submission ID is required' });
    }

    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Verify ownership by checking assignment
    const assignment = await Assignment.findById(submission.assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Associated assignment not found' });
    }

    if (!verifyOwnership(assignment.userId, req)) {
      return res.status(403).json({ error: 'Access denied. You do not own this assignment.' });
    }

    // Delete original submission file
    if (submission.submissionFile) {
      try {
        await fs.unlink(submission.submissionFile);
        console.log(`Deleted original submission file: ${submission.submissionFile}`);
      } catch (fileError) {
        console.error(`Error deleting original submission file: ${fileError}`);
      }
    }

    // Delete converted PDF file if it exists and is different from original
    if (submission.processedFilePath && submission.processedFilePath !== submission.submissionFile) {
      try {
        await fs.unlink(submission.processedFilePath);
        console.log(`Deleted converted PDF file: ${submission.processedFilePath}`);
      } catch (fileError) {
        console.error(`Error deleting converted PDF file: ${fileError}`);
      }
    }

    const deleteResult = await Submission.findByIdAndDelete(id);

    if (!deleteResult) {
      return res.status(500).json({ error: 'Failed to delete submission from database' });
    }

    console.log(`Successfully deleted submission ${id} from database`);

    res.status(200).json({
      success: true,
      message: 'Submission deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'An error occurred while deleting the submission' });
  }
};

/**
 * Re-run processing and evaluation for a failed submission
 * Allows retrying without re-uploading the file
 */
exports.rerunSubmission = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Submission ID is required' });
    }

    console.log(`Re-run requested for submission: ${id}`);

    // Find the submission
    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Verify ownership by checking assignment
    const assignment = await Assignment.findById(submission.assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Associated assignment not found' });
    }

    if (!verifyOwnership(assignment.userId, req)) {
      return res.status(403).json({ error: 'Access denied. You do not own this assignment.' });
    }

    // Check if the submission has the required file paths
    if (!submission.processedFilePath && !submission.submissionFile) {
      return res.status(400).json({
        error: 'Cannot re-run submission: No file path available. Please re-upload the submission.'
      });
    }

    console.log(`Submission found: ${submission.studentId} (${submission.studentName})`);
    console.log(`Current status - Processing: ${submission.processingStatus}, Evaluation: ${submission.evaluationStatus}`);

    // Reset submission status for re-processing
    submission.processingStatus = 'pending';
    submission.evaluationStatus = 'pending';
    submission.processingError = undefined;
    submission.evaluationError = undefined;
    submission.processingStartedAt = undefined;
    submission.processingCompletedAt = undefined;
    submission.evaluationStartedAt = undefined;
    submission.evaluationCompletedAt = undefined;

    await submission.save();
    console.log(`Submission ${id} status reset to pending`);

    try {
      // Determine which file path to use
      const filePath = submission.processedFilePath || submission.submissionFile;
      const originalPath = submission.originalFilePath || submission.submissionFile;
      const fileType = submission.fileType || path.extname(submission.submissionFile);

      console.log(`Re-queueing submission for processing:`);
      console.log(`  Original file: ${originalPath}`);
      console.log(`  Processed file: ${filePath}`);
      console.log(`  File type: ${fileType}`);

      // Re-queue the submission for processing
      await submissionProcessingQueue.createJob({
        submissionId: submission._id,
        studentId: submission.studentId,
        filePath: filePath,
        originalPath: originalPath,
        fileType: fileType
      }).save();

      console.log(`✅ Submission ${id} re-queued successfully`);

      res.status(200).json({
        success: true,
        message: 'Submission re-queued for processing',
        submission: {
          _id: submission._id,
          studentId: submission.studentId,
          studentName: submission.studentName,
          processingStatus: submission.processingStatus,
          evaluationStatus: submission.evaluationStatus
        }
      });
    } catch (queueError) {
      console.error(`Error re-queueing submission ${id}:`, queueError);

      // Restore failed status
      submission.processingStatus = 'failed';
      submission.processingError = 'Failed to re-queue submission: ' + queueError.message;
      await submission.save();

      return res.status(500).json({
        error: 'Failed to re-queue submission for processing',
        details: queueError.message
      });
    }
  } catch (error) {
    console.error('Error in rerunSubmission:', error);
    res.status(500).json({
      error: 'An error occurred while re-running the submission',
      details: error.message
    });
  }
};

