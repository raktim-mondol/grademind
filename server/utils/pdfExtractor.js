/**
 * PDF File Processor
 * Utility to handle PDF files and .ipynb to PDF conversion for direct Gemini API processing
 * No text extraction - files are processed directly by Gemini
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Text extraction functions removed - PDFs are now processed directly by Gemini API

/**
 * Convert Jupyter notebook to PDF using nbconvert and puppeteer
 * @param {string} ipynbPath - Path to the Jupyter notebook file
 * @returns {Promise<string>} - Path to the converted PDF file
 */
async function convertIpynbToPdf(ipynbPath) {
  const path = require('path');
  const fs = require('fs');
  const { execSync } = require('child_process');
  const puppeteer = require('puppeteer');

  console.log(`🔄 Starting .ipynb to PDF conversion: ${ipynbPath}`);
  
  // Check if file exists
  if (!fs.existsSync(ipynbPath)) {
    throw new Error(`Notebook file not found: ${ipynbPath}`);
  }

  const dir = path.dirname(ipynbPath);
  const baseName = path.basename(ipynbPath, '.ipynb');
  const htmlPath = path.join(dir, `${baseName}_converted.html`);
  const pdfPath = path.join(dir, `${baseName}_converted.pdf`);

  try {
    // Step 1: Convert ipynb to HTML using nbconvert
    console.log(`🔄 Converting ${ipynbPath} to HTML...`);
    const nbconvertCommand = `jupyter nbconvert --to html "${ipynbPath}" --output "${baseName}_converted"`;
    
    console.log(`Running command: ${nbconvertCommand}`);
    execSync(nbconvertCommand, { 
      stdio: 'inherit',
      cwd: dir,
      timeout: 120000 // 2 minutes timeout for large notebooks with many plots
    });

    // Check if HTML was created
    if (!fs.existsSync(htmlPath)) {
      throw new Error('HTML file was not created by nbconvert');
    }

    console.log(`✅ HTML conversion successful: ${htmlPath}`);

    // Step 2: Use puppeteer to convert HTML to PDF
    console.log(`🖨️  Rendering ${htmlPath} to PDF...`);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Overcome limited resource problems
        '--disable-gpu' // Applicable to Windows OS only
      ]
    });
    
    const page = await browser.newPage();
    
    // Set default timeout for all operations (important for large files)
    page.setDefaultTimeout(120000); // 2 minutes for all operations
    page.setDefaultNavigationTimeout(120000); // 2 minutes for navigation
    
    // Load the HTML file
    const htmlFileUrl = `file://${path.resolve(htmlPath)}`;
    console.log(`Loading HTML from: ${htmlFileUrl}`);
    console.log(`⏱️  Allowing up to 2 minutes for large file rendering...`);
    
    // For very large files (>10MB), use 'load' instead of 'networkidle0' to avoid timeout
    const htmlStats = fs.statSync(htmlPath);
    const isLargeFile = htmlStats.size > 10 * 1024 * 1024; // 10MB threshold
    
    if (isLargeFile) {
      console.log(`📊 Large HTML file detected (${(htmlStats.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`⚡ Using optimized loading strategy for large files...`);
    }
    
    await page.goto(htmlFileUrl, { 
      waitUntil: isLargeFile ? 'domcontentloaded' : 'networkidle0', // Faster for large files
      timeout: 120000 // 2 minutes timeout for large notebooks
    });
    
    // For large files, wait a bit more for images to render
    if (isLargeFile) {
      console.log(`⏳ Waiting 3 seconds for images and plots to fully render...`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second grace period for image rendering
    }
    
    console.log(`📄 Page loaded successfully, generating PDF...`);
    
    // Generate PDF with good settings for notebook content
    // Note: Large notebooks may take time to render all images and plots
    await page.pdf({ 
      path: pdfPath, 
      format: 'A4',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: true, // Include background colors and images
      preferCSSPageSize: false,
      timeout: 120000 // 2 minutes timeout for PDF generation
    });
    
    console.log(`✅ PDF generated successfully`);
    
    await browser.close();

    // Check if PDF was created
    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF file was not created by puppeteer');
    }

    console.log(`✅ PDF conversion successful: ${pdfPath}`);

    // Clean up intermediate HTML file (but keep the PDF)
    try {
      fs.unlinkSync(htmlPath);
      console.log(`🧹 Cleaned up intermediate HTML file: ${htmlPath}`);
    } catch (cleanupError) {
      console.warn(`⚠️  Could not clean up HTML file: ${cleanupError.message}`);
    }

    // Get file size for debugging
    const stats = fs.statSync(pdfPath);
    console.log(`📊 PDF file size: ${stats.size} bytes`);
    console.log(`💾 PDF file preserved for database storage: ${pdfPath}`);
    console.log(`🔄 IPYNB → PDF conversion completed successfully`);
    console.log(`   Original: ${ipynbPath}`);
    console.log(`   Converted: ${pdfPath}`);

    return pdfPath;

  } catch (error) {
    console.error(`❌ Error converting .ipynb to PDF:`, error.message || error);
    
    // Clean up any intermediate HTML files on error (but preserve any PDF that was created)
    try {
      if (fs.existsSync(htmlPath)) {
        fs.unlinkSync(htmlPath);
        console.log(`🧹 Cleaned up intermediate HTML file after error: ${htmlPath}`);
      }
    } catch (cleanupError) {
      console.warn(`⚠️  Could not clean up HTML file after error: ${cleanupError.message}`);
    }
    
    throw new Error(`Failed to convert .ipynb to PDF: ${error.message}`);
  }
}

/**
 * Convert Jupyter notebook to HTML using nbconvert (for direct Gemini processing)
 * @param {string} notebookPath - Path to the .ipynb file
 * @returns {Promise<string>} - Path to the converted HTML file
 */
async function convertNotebookToHTML(notebookPath) {
  try {
    console.log(`Converting Jupyter notebook to HTML: ${notebookPath}`);
    
    // Check if file exists
    if (!fs.existsSync(notebookPath)) {
      throw new Error(`Notebook file not found: ${notebookPath}`);
    }

    // Generate output PDF path
    const dir = path.dirname(notebookPath);
    const basename = path.basename(notebookPath, '.ipynb');
    const pdfPath = path.join(dir, `${basename}_converted.pdf`);
    
    // Use HTML conversion directly since it's more reliable and Gemini can handle HTML files
    const htmlPath = path.join(dir, `${basename}_converted.html`);
    const command = `activate image && jupyter nbconvert --to html "${notebookPath}" --output "${basename}_converted"`;
    
    console.log(`Running nbconvert HTML conversion command: ${command}`);
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 60 second timeout
        cwd: dir
      });
      
      if (stderr && !stderr.includes('WARNING')) {
        console.warn('nbconvert stderr:', stderr);
      }
      
      console.log('nbconvert stdout:', stdout);
      
      // Check if HTML was created
      if (fs.existsSync(htmlPath)) {
        console.log(`Successfully converted notebook to HTML: ${htmlPath}`);
        return htmlPath;
      } else {
        throw new Error('HTML file was not created by nbconvert');
      }
      
    } catch (execError) {
      console.error('nbconvert execution error:', execError);
      
      // If HTML conversion fails, try webpdf as a last resort (if playwright is available)
      console.log('HTML conversion failed, trying webpdf as fallback...');
      const webpdfCommand = `activate image && jupyter nbconvert --to webpdf "${notebookPath}" --output "${basename}_converted"`;
      
      try {
        await execAsync(webpdfCommand, { timeout: 60000, cwd: dir });
        
        if (fs.existsSync(pdfPath)) {
          console.log(`Created PDF fallback: ${pdfPath}`);
          return pdfPath;
        }
      } catch (fallbackError) {
        console.error('WebPDF fallback conversion also failed:', fallbackError);
      }
      
      throw new Error(`Failed to convert notebook: ${execError.message}`);
    }
    
  } catch (error) {
    console.error('Error converting notebook to HTML:', error);
    throw new Error(`Failed to convert notebook to HTML: ${error.message}`);
  }
}

/**
 * Safely handle file processing for both PDF and .ipynb files
 * For .ipynb files: converts to PDF and returns the PDF path (for direct Gemini processing)
 * For PDF files: returns the original path
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} - Object with file path, success status, and error info
 */
async function processFileForGemini(filePath) {
  try {
    console.log(`\n=== STUDENT SUBMISSION PROCESSING DEBUG START ===`);
    console.log(`Processing student file: ${filePath}`);
    
    const fileExt = path.extname(filePath).toLowerCase();
    console.log(`File extension: ${fileExt}`);
    
    let processedFilePath;
    
    if (fileExt === '.pdf') {
      // For PDF files, return the original path
      processedFilePath = filePath;
      console.log(`PDF file ready for Gemini: ${processedFilePath}`);
      
      // Get file size for debugging
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      console.log(`PDF file size: ${stats.size} bytes`);
      
    } else if (fileExt === '.ipynb') {
      // For notebook files, convert to PDF for direct Gemini processing
      console.log(`Converting Jupyter notebook to PDF...`);
      processedFilePath = await convertIpynbToPdf(filePath);
      console.log(`Notebook converted to PDF for Gemini: ${processedFilePath}`);
      
      // Get file sizes for debugging
      const fs = require('fs');
      const originalStats = fs.statSync(filePath);
      const processedStats = fs.statSync(processedFilePath);
      console.log(`Original .ipynb file size: ${originalStats.size} bytes`);
      console.log(`Converted PDF file size: ${processedStats.size} bytes`);
      
    } else {
      throw new Error(`Unsupported file type: ${fileExt}. Only PDF and .ipynb files are supported.`);
    }
    
    console.log(`=== STUDENT SUBMISSION PROCESSING DEBUG END ===\n`);
    
    return {
      filePath: processedFilePath,
      originalPath: filePath,
      success: true,
      error: null,
      fileType: fileExt
    };
  } catch (error) {
    console.error('File processing failed:', error);
    return {
      filePath: null,
      originalPath: filePath,
      success: false,
      error: error.message,
      fileType: path.extname(filePath).toLowerCase()
    };
  }
}

// Legacy text extraction functions removed - use processFileForGemini() for direct file processing

// Legacy notebook text extraction function removed - use processFileForGemini() for direct file processing

module.exports = {
  convertNotebookToHTML,
  convertIpynbToPdf,
  convertNotebookToPDF: convertIpynbToPdf, // Alias for PDF conversion
  processFileForGemini // Main function for direct Gemini file processing
};