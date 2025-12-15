try {
    console.log('Verifying geminiService.js...');
    require('../server/utils/geminiService');
    console.log('✅ geminiService.js loaded successfully');

    console.log('Verifying assignmentController.js...');
    require('../server/controllers/assignmentController');
    console.log('✅ assignmentController.js loaded successfully');

    console.log('Verifying extractionService.js...');
    require('../server/utils/extractionService');
    console.log('✅ extractionService.js loaded successfully');

    console.log('All backend modules syntax checked.');
} catch (error) {
    console.error('❌ Syntax Error Verification Failed:', error);
    process.exit(1);
}
