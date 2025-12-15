/**
 * Test Script for Duplicate File Prevention Feature
 * 
 * This script tests the duplicate file prevention in submission uploads.
 * 
 * Prerequisites:
 * - MongoDB running
 * - Server running on port 5000
 * - At least one assignment created
 * 
 * Usage:
 *   node test-duplicate-prevention.js <assignmentId>
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:5000/api';

// Create a test PDF file
function createTestPDF(filename) {
  const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test submission) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
306
%%EOF`;

  const filepath = path.join(__dirname, filename);
  fs.writeFileSync(filepath, content);
  return filepath;
}

// Clean up test files
function cleanup(files) {
  files.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`🧹 Cleaned up: ${file}`);
    }
  });
}

async function testDuplicatePrevention(assignmentId) {
  console.log('🧪 Testing Duplicate File Prevention Feature\n');
  console.log(`Assignment ID: ${assignmentId}\n`);

  const testFiles = [];
  let submissionId = null;

  try {
    // Test 1: Upload a new submission
    console.log('📝 Test 1: Upload initial submission');
    const testFile1 = createTestPDF('test-submission-duplicate.pdf');
    testFiles.push(testFile1);

    const formData1 = new FormData();
    formData1.append('assignmentId', assignmentId);
    formData1.append('studentId', 'test-student-dup');
    formData1.append('studentName', 'Test Student');
    formData1.append('submission', fs.createReadStream(testFile1));

    try {
      const response1 = await axios.post(`${API_BASE_URL}/submissions/single`, formData1, {
        headers: formData1.getHeaders()
      });
      
      submissionId = response1.data.submission._id;
      console.log(`✅ Test 1 PASSED: Initial submission created successfully`);
      console.log(`   Submission ID: ${submissionId}\n`);
    } catch (error) {
      console.log(`❌ Test 1 FAILED: ${error.response?.data?.error || error.message}\n`);
      return;
    }

    // Wait a bit for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Try to upload a file with the same name
    console.log('📝 Test 2: Try to upload duplicate filename');
    const testFile2 = createTestPDF('test-submission-duplicate.pdf');
    testFiles.push(testFile2);

    const formData2 = new FormData();
    formData2.append('assignmentId', assignmentId);
    formData2.append('studentId', 'test-student-dup-2');
    formData2.append('studentName', 'Test Student 2');
    formData2.append('submission', fs.createReadStream(testFile2));

    try {
      const response2 = await axios.post(`${API_BASE_URL}/submissions/single`, formData2, {
        headers: formData2.getHeaders()
      });
      
      console.log(`❌ Test 2 FAILED: Duplicate was not blocked!`);
      console.log(`   Response:`, response2.data, '\n');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`✅ Test 2 PASSED: Duplicate correctly rejected (409 Conflict)`);
        console.log(`   Error message: ${error.response.data.message}`);
        console.log(`   Existing submission: ${error.response.data.existingSubmissionId}\n`);
      } else {
        console.log(`❌ Test 2 FAILED: Wrong error - ${error.response?.status || error.message}\n`);
      }
    }

    // Test 3: Delete the original submission
    if (submissionId) {
      console.log('📝 Test 3: Delete original submission');
      try {
        await axios.delete(`${API_BASE_URL}/submissions/${submissionId}`);
        console.log(`✅ Test 3 PASSED: Original submission deleted\n`);
      } catch (error) {
        console.log(`⚠️ Test 3 WARNING: Could not delete submission - ${error.message}\n`);
      }

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test 4: Try to upload the same filename again after deletion
      console.log('📝 Test 4: Upload same filename after deletion');
      const testFile4 = createTestPDF('test-submission-duplicate.pdf');
      testFiles.push(testFile4);

      const formData4 = new FormData();
      formData4.append('assignmentId', assignmentId);
      formData4.append('studentId', 'test-student-dup-3');
      formData4.append('studentName', 'Test Student 3');
      formData4.append('submission', fs.createReadStream(testFile4));

      try {
        const response4 = await axios.post(`${API_BASE_URL}/submissions/single`, formData4, {
          headers: formData4.getHeaders()
        });
        
        console.log(`✅ Test 4 PASSED: Upload succeeded after deletion`);
        console.log(`   New Submission ID: ${response4.data.submission._id}\n`);
        
        // Clean up this submission too
        try {
          await axios.delete(`${API_BASE_URL}/submissions/${response4.data.submission._id}`);
          console.log(`🧹 Cleaned up test submission\n`);
        } catch (e) {
          console.log(`⚠️ Could not clean up test submission\n`);
        }
      } catch (error) {
        console.log(`❌ Test 4 FAILED: ${error.response?.data?.error || error.message}\n`);
      }
    }

    // Test 5: Different filename should work
    console.log('📝 Test 5: Upload different filename');
    const testFile5 = createTestPDF('test-submission-different.pdf');
    testFiles.push(testFile5);

    const formData5 = new FormData();
    formData5.append('assignmentId', assignmentId);
    formData5.append('studentId', 'test-student-diff');
    formData5.append('studentName', 'Test Student Different');
    formData5.append('submission', fs.createReadStream(testFile5));

    try {
      const response5 = await axios.post(`${API_BASE_URL}/submissions/single`, formData5, {
        headers: formData5.getHeaders()
      });
      
      console.log(`✅ Test 5 PASSED: Different filename uploaded successfully`);
      console.log(`   Submission ID: ${response5.data.submission._id}\n`);
      
      // Clean up
      try {
        await axios.delete(`${API_BASE_URL}/submissions/${response5.data.submission._id}`);
        console.log(`🧹 Cleaned up test submission\n`);
      } catch (e) {
        console.log(`⚠️ Could not clean up test submission\n`);
      }
    } catch (error) {
      console.log(`❌ Test 5 FAILED: ${error.response?.data?.error || error.message}\n`);
    }

    console.log('✨ All tests completed!\n');

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  } finally {
    // Clean up test files
    cleanup(testFiles);
  }
}

// Main execution
if (require.main === module) {
  const assignmentId = process.argv[2];
  
  if (!assignmentId) {
    console.error('❌ Error: Assignment ID required');
    console.log('\nUsage: node test-duplicate-prevention.js <assignmentId>');
    console.log('\nTo get an assignment ID:');
    console.log('  1. Create an assignment in the app');
    console.log('  2. Check the assignment list or MongoDB');
    console.log('  3. Copy the assignment ID (24-character hex string)\n');
    process.exit(1);
  }

  testDuplicatePrevention(assignmentId)
    .then(() => {
      console.log('✅ Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testDuplicatePrevention };

