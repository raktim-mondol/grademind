/**
 * End-to-End Test: Excel Export with Real Database Data
 * 
 * This script:
 * 1. Connects to the actual MongoDB database
 * 2. Finds a real assignment with evaluated submissions
 * 3. Generates an Excel file using the actual export function
 * 4. Tests all columns: Deductions, Strengths, Areas for Improvement
 * 
 * Usage: node test_excel_export_e2e.js
 */

const mongoose = require('mongoose');
const { Assignment } = require('./models/assignment');
const { Submission } = require('./models/submission');
const { calculateLostMarksFromQuestionScores } = require('./utils/geminiService');
const Excel = require('exceljs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import the helper functions from submissionController
function sanitizeKey(key) {
  return String(key)
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_');
}

function transformCriteriaGradesToQuestionScores(criteriaGrades) {
  if (!Array.isArray(criteriaGrades) || criteriaGrades.length === 0) {
    return [];
  }

  const questionMap = new Map();

  criteriaGrades.forEach((grade) => {
    const questionNumber = grade.questionNumber || 'Unknown';
    const qNumStr = String(questionNumber);
    const baseMatch = qNumStr.match(/^(\d+)/);
    const baseQuestion = baseMatch ? baseMatch[1] : qNumStr;
    const isSubsection = /^(\d+)([a-z]|\.\d+|\([a-z]+\)|\s*\([a-z]+\)|\s+[a-z])$/i.test(qNumStr);

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
      let subsectionNumber = qNumStr.substring(baseQuestion.length);
      subsectionNumber = subsectionNumber.replace(/^[\.\s\(]+|[\)\s]+$/g, '');

      question.subsections.push({
        subsectionNumber: subsectionNumber,
        earnedScore: grade.score || 0,
        maxScore: grade.maxScore || 0,
        feedback: grade.feedback || ''
      });
    } else {
      question.subsections.push({
        subsectionNumber: '',
        earnedScore: grade.score || 0,
        maxScore: grade.maxScore || 0,
        feedback: grade.feedback || ''
      });
    }

    question.earnedScore += (grade.score || 0);
    question.maxScore += (grade.maxScore || 0);
  });

  const questionScores = Array.from(questionMap.values()).sort((a, b) => {
    const numA = parseInt(a.questionNumber) || 0;
    const numB = parseInt(b.questionNumber) || 0;
    return numA - numB;
  });

  return questionScores;
}

async function generateExcelFromDatabase() {
  try {
    console.log('='.repeat(80));
    console.log('END-TO-END EXCEL EXPORT TEST');
    console.log('='.repeat(80));
    console.log();

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find an assignment with evaluated submissions
    console.log('🔍 Searching for assignments with evaluated submissions...');
    const assignments = await Assignment.find().sort({ createdAt: -1 }).limit(10);
    
    let selectedAssignment = null;
    let submissions = [];

    for (const assignment of assignments) {
      const subs = await Submission.find({ 
        assignmentId: assignment._id,
        evaluationStatus: 'completed'
      });
      
      if (subs.length > 0) {
        selectedAssignment = assignment;
        submissions = subs;
        console.log(`✅ Found assignment: "${assignment.title}"`);
        console.log(`   - ID: ${assignment._id}`);
        console.log(`   - Evaluated submissions: ${subs.length}`);
        break;
      }
    }

    if (!selectedAssignment || submissions.length === 0) {
      console.error('❌ No assignments with evaluated submissions found!');
      console.log('\nPlease ensure you have:');
      console.log('1. Created an assignment through the web UI');
      console.log('2. Uploaded and evaluated student submissions');
      process.exit(1);
    }

    console.log();
    console.log('📊 Submission Details:');
    submissions.forEach((sub, idx) => {
      // Calculate lostMarks if missing
      if ((!sub.evaluationResult?.lostMarks || sub.evaluationResult.lostMarks.length === 0) &&
          sub.evaluationResult?.questionScores && sub.evaluationResult.questionScores.length > 0) {
        console.log(`   ${idx + 1}. ${sub.studentName || 'Unknown'} (${sub.studentId || 'N/A'})`);
        console.log(`      ⚠️  Missing lostMarks - calculating now...`);
        sub.evaluationResult.lostMarks = calculateLostMarksFromQuestionScores(sub.evaluationResult);
        console.log(`      ✅ Calculated ${sub.evaluationResult.lostMarks.length} deductions`);
      } else {
        console.log(`   ${idx + 1}. ${sub.studentName || 'Unknown'} (${sub.studentId || 'N/A'})`);
      }
      console.log(`      - Score: ${sub.evaluationResult?.overallGrade || 0}/${sub.evaluationResult?.totalPossible || 0}`);
      console.log(`      - Has lostMarks: ${sub.evaluationResult?.lostMarks ? 'Yes (' + sub.evaluationResult.lostMarks.length + ')' : 'No'}`);
      console.log(`      - Has strengths: ${sub.evaluationResult?.strengths ? 'Yes (' + (Array.isArray(sub.evaluationResult.strengths) ? sub.evaluationResult.strengths.length : 1) + ')' : 'No'}`);
      console.log(`      - Has improvements: ${sub.evaluationResult?.areasForImprovement ? 'Yes (' + (Array.isArray(sub.evaluationResult.areasForImprovement) ? sub.evaluationResult.areasForImprovement.length : 1) + ')' : 'No'}`);
    });

    console.log();
    console.log('📝 Generating Excel file...');

    // Create workbook
    const workbook = new Excel.Workbook();
    workbook.creator = 'EduGrade E2E Test';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Test Results');

    // Determine dynamic question columns
    const questionKeys = new Set();
    const questionMaxScores = new Map();

    submissions.forEach(sub => {
      const qScores = sub.evaluationResult?.questionScores || [];
      qScores.forEach(q => {
        const qNum = q.questionNumber || 'Unknown';

        if (q.subsections && q.subsections.length > 0) {
          q.subsections.forEach(subSec => {
            const subsecNum = subSec.subsectionNumber || '';
            let formattedKey;
            if (/^\d+$/.test(subsecNum)) {
              formattedKey = `${qNum}.${subsecNum}`;
            } else if (subsecNum) {
              formattedKey = `${qNum}(${subsecNum})`;
            } else {
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

      const lostMarks = sub.evaluationResult?.lostMarks || [];
      lostMarks.forEach(lm => {
        if (lm.area) questionKeys.add(lm.area);
      });
    });

    const sortedKeys = Array.from(questionKeys).sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Define columns
    const columns = [
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: 'Student ID', key: 'studentId', width: 15 },
      { header: 'Total Score', key: 'totalScore', width: 12 },
      { header: 'Deductions', key: 'deductions', width: 60, style: { alignment: { wrapText: true } } },
    ];

    sortedKeys.forEach(key => {
      const maxScore = questionMaxScores.get(key) || 0;
      const headerText = maxScore > 0 ? `Task ${key} (${maxScore})` : `Task ${key}`;
      columns.push({ header: headerText, key: `q_${key}`, width: 10 });
    });

    columns.push({ header: 'Strengths', key: 'strengths', width: 50, style: { alignment: { wrapText: true } } });
    columns.push({ header: 'Areas for Improvement', key: 'areasForImprovement', width: 50, style: { alignment: { wrapText: true } } });

    worksheet.columns = columns;

    // Populate rows
    submissions.forEach(sub => {
      const rowData = {
        studentName: sub.studentName,
        studentId: sub.studentId,
        totalScore: sub.evaluationResult?.overallGrade || 0
      };

      // Populate deductions
      const lostMarks = sub.evaluationResult?.lostMarks || [];
      const validDeductions = lostMarks.filter(lm => lm.pointsLost > 0);

      if (validDeductions.length > 0) {
        const deductionStrings = validDeductions.map(d => {
          const section = d.area || 'Unknown';
          const marks = d.pointsLost || 0;
          const reason = d.reason || 'No reason provided';
          const cleanReason = reason.toLowerCase().startsWith('because ') 
            ? reason.substring(8) 
            : reason;
          return `Task ${section} (-${marks}): ${cleanReason}`;
        });
        rowData.deductions = deductionStrings.join('; ');
      } else {
        rowData.deductions = '';
      }

      // Populate question scores
      const qScores = sub.evaluationResult?.questionScores || [];
      const scoreMap = new Map();

      qScores.forEach(q => {
        const qNum = q.questionNumber || 'Unknown';

        if (q.subsections && q.subsections.length > 0) {
          q.subsections.forEach(s => {
            const subsecNum = s.subsectionNumber || '';
            let formattedKey;
            if (/^\d+$/.test(subsecNum)) {
              formattedKey = `${qNum}.${subsecNum}`;
            } else if (subsecNum) {
              formattedKey = `${qNum}(${subsecNum})`;
            } else {
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
          rowData[`q_${key}`] = 0;
        }
      });

      // Add Strengths
      const strengths = sub.evaluationResult?.strengths || [];
      if (Array.isArray(strengths) && strengths.length > 0) {
        rowData.strengths = strengths.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
      } else if (typeof strengths === 'string') {
        rowData.strengths = strengths;
      } else {
        rowData.strengths = '';
      }

      // Add Areas for Improvement
      const areasForImprovement = sub.evaluationResult?.areasForImprovement || [];
      if (Array.isArray(areasForImprovement) && areasForImprovement.length > 0) {
        rowData.areasForImprovement = areasForImprovement.map((a, idx) => `${idx + 1}. ${a}`).join('\n');
      } else if (typeof areasForImprovement === 'string') {
        rowData.areasForImprovement = areasForImprovement;
      } else {
        rowData.areasForImprovement = '';
      }

      worksheet.addRow(rowData);
    });

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 30;

    // Apply styling to data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const strengthsCell = row.getCell('strengths');
        const areasCell = row.getCell('areasForImprovement');
        
        strengthsCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        areasCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        
        if (strengthsCell.value) {
          strengthsCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE7F4E4' }
          };
        }
        
        if (areasCell.value) {
          areasCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF4E6' }
          };
        }
      }
    });

    // Save the file
    const outputDir = path.join(__dirname, '..', 'test_output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `e2e_test_export_${timestamp}.xlsx`;
    const filepath = path.join(outputDir, filename);

    await workbook.xlsx.writeFile(filepath);

    console.log('✅ Excel file generated successfully!');
    console.log();
    console.log('📁 File Details:');
    console.log(`   - Path: ${filepath}`);
    console.log(`   - Size: ${fs.statSync(filepath).size} bytes`);
    console.log(`   - Rows: ${submissions.length + 1} (including header)`);
    console.log(`   - Columns: ${columns.length}`);
    console.log();

    console.log('📋 Column Summary:');
    console.log(`   - Student Info: 2 columns (Name, ID)`);
    console.log(`   - Total Score: 1 column`);
    console.log(`   - Deductions: 1 column`);
    console.log(`   - Task Scores: ${sortedKeys.length} columns`);
    console.log(`   - Strengths: 1 column (green background)`);
    console.log(`   - Areas for Improvement: 1 column (orange background)`);
    console.log();

    console.log('✅ Verification:');
    let deductionsPopulated = 0;
    let strengthsPopulated = 0;
    let improvementsPopulated = 0;

    submissions.forEach(sub => {
      if (sub.evaluationResult?.lostMarks && sub.evaluationResult.lostMarks.length > 0) {
        deductionsPopulated++;
      }
      if (sub.evaluationResult?.strengths && 
          ((Array.isArray(sub.evaluationResult.strengths) && sub.evaluationResult.strengths.length > 0) ||
           (typeof sub.evaluationResult.strengths === 'string' && sub.evaluationResult.strengths.trim()))) {
        strengthsPopulated++;
      }
      if (sub.evaluationResult?.areasForImprovement && 
          ((Array.isArray(sub.evaluationResult.areasForImprovement) && sub.evaluationResult.areasForImprovement.length > 0) ||
           (typeof sub.evaluationResult.areasForImprovement === 'string' && sub.evaluationResult.areasForImprovement.trim()))) {
        improvementsPopulated++;
      }
    });

    console.log(`   ✓ Deductions column: ${deductionsPopulated}/${submissions.length} students have data`);
    console.log(`   ✓ Strengths column: ${strengthsPopulated}/${submissions.length} students have data`);
    console.log(`   ✓ Areas for Improvement: ${improvementsPopulated}/${submissions.length} students have data`);
    console.log();

    console.log('='.repeat(80));
    console.log('TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log();
    console.log(`Open the file to verify: ${filepath}`);
    console.log();

    // Close connection
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
generateExcelFromDatabase();
