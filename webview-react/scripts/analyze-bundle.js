#!/usr/bin/env node

/**
 * Bundle analysis script for the webview
 * Analyzes the built bundle and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

const DIST_DIR = path.join(__dirname, '../dist');
const ANALYSIS_OUTPUT = path.join(__dirname, '../bundle-analysis.json');

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function getGzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = gzipSync(content);
  return gzipped.length;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeFile(filePath) {
  const size = getFileSize(filePath);
  const gzipSize = getGzipSize(filePath);
  const compressionRatio = ((size - gzipSize) / size * 100).toFixed(2);
  
  return {
    path: path.relative(DIST_DIR, filePath),
    size,
    sizeFormatted: formatBytes(size),
    gzipSize,
    gzipSizeFormatted: formatBytes(gzipSize),
    compressionRatio: `${compressionRatio}%`
  };
}

function analyzeBundleStructure() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Dist directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  const files = fs.readdirSync(DIST_DIR, { recursive: true })
    .filter(file => {
      const filePath = path.join(DIST_DIR, file);
      return fs.statSync(filePath).isFile();
    })
    .map(file => path.join(DIST_DIR, file));

  const analysis = {
    timestamp: new Date().toISOString(),
    files: files.map(analyzeFile),
    summary: {
      totalFiles: files.length,
      totalSize: 0,
      totalGzipSize: 0,
      jsFiles: 0,
      cssFiles: 0,
      assetFiles: 0
    },
    recommendations: []
  };

  // Calculate summary
  analysis.files.forEach(file => {
    analysis.summary.totalSize += file.size;
    analysis.summary.totalGzipSize += file.gzipSize;
    
    if (file.path.endsWith('.js')) {
      analysis.summary.jsFiles++;
    } else if (file.path.endsWith('.css')) {
      analysis.summary.cssFiles++;
    } else {
      analysis.summary.assetFiles++;
    }
  });

  analysis.summary.totalSizeFormatted = formatBytes(analysis.summary.totalSize);
  analysis.summary.totalGzipSizeFormatted = formatBytes(analysis.summary.totalGzipSize);
  analysis.summary.overallCompressionRatio = 
    `${((analysis.summary.totalSize - analysis.summary.totalGzipSize) / analysis.summary.totalSize * 100).toFixed(2)}%`;

  // Generate recommendations
  const largeFiles = analysis.files.filter(file => file.size > 100 * 1024); // > 100KB
  if (largeFiles.length > 0) {
    analysis.recommendations.push({
      type: 'warning',
      message: `Found ${largeFiles.length} large files (>100KB). Consider code splitting or optimization.`,
      files: largeFiles.map(f => f.path)
    });
  }

  const poorCompression = analysis.files.filter(file => {
    const ratio = parseFloat(file.compressionRatio);
    return file.size > 10 * 1024 && ratio < 60; // Large files with poor compression
  });
  if (poorCompression.length > 0) {
    analysis.recommendations.push({
      type: 'info',
      message: 'Some files have poor compression ratios. They might already be compressed or contain binary data.',
      files: poorCompression.map(f => f.path)
    });
  }

  if (analysis.summary.totalGzipSize > 500 * 1024) { // > 500KB total
    analysis.recommendations.push({
      type: 'warning',
      message: 'Total bundle size is quite large for a webview. Consider lazy loading or removing unused dependencies.'
    });
  }

  if (analysis.summary.jsFiles > 3) {
    analysis.recommendations.push({
      type: 'info',
      message: 'Multiple JS files detected. Ensure this is intentional for code splitting.'
    });
  }

  return analysis;
}

function printAnalysis(analysis) {
  console.log('\n📊 Bundle Analysis Report');
  console.log('========================\n');
  
  console.log('📈 Summary:');
  console.log(`  Total files: ${analysis.summary.totalFiles}`);
  console.log(`  JS files: ${analysis.summary.jsFiles}`);
  console.log(`  CSS files: ${analysis.summary.cssFiles}`);
  console.log(`  Asset files: ${analysis.summary.assetFiles}`);
  console.log(`  Total size: ${analysis.summary.totalSizeFormatted}`);
  console.log(`  Gzipped size: ${analysis.summary.totalGzipSizeFormatted}`);
  console.log(`  Compression ratio: ${analysis.summary.overallCompressionRatio}\n`);

  console.log('📁 Files:');
  analysis.files
    .sort((a, b) => b.size - a.size)
    .forEach(file => {
      const sizeIndicator = file.size > 100 * 1024 ? '🔴' : file.size > 50 * 1024 ? '🟡' : '🟢';
      console.log(`  ${sizeIndicator} ${file.path}`);
      console.log(`     Size: ${file.sizeFormatted} (${file.gzipSizeFormatted} gzipped, ${file.compressionRatio} compression)`);
    });

  if (analysis.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    analysis.recommendations.forEach(rec => {
      const icon = rec.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`  ${icon} ${rec.message}`);
      if (rec.files) {
        rec.files.forEach(file => console.log(`     - ${file}`));
      }
    });
  }

  console.log('\n✅ Analysis complete!');
  console.log(`📄 Detailed report saved to: ${path.relative(process.cwd(), ANALYSIS_OUTPUT)}`);
}

function main() {
  try {
    console.log('🔍 Analyzing bundle...');
    const analysis = analyzeBundleStructure();
    
    // Save detailed analysis
    fs.writeFileSync(ANALYSIS_OUTPUT, JSON.stringify(analysis, null, 2));
    
    // Print summary
    printAnalysis(analysis);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeBundleStructure, formatBytes };
