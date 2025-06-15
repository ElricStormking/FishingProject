const fs = require('fs');
const path = require('path');
const { convertAllFiles } = require('./csv-to-json-converter');

console.log('👀 CSV File Watcher Started');
console.log('===========================');
console.log('Watching for changes in public/data_csv/');
console.log('Press Ctrl+C to stop\n');

const csvDir = path.join(__dirname, '../public/data_csv');

// Initial conversion
console.log('🔄 Running initial conversion...');
convertAllFiles();
console.log('\n👀 Now watching for file changes...\n');

// Watch for file changes
fs.watch(csvDir, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.csv')) {
        console.log(`📝 ${filename} ${eventType === 'change' ? 'changed' : 'modified'}`);
        console.log('🔄 Converting CSV files to JSON...\n');
        
        // Small delay to ensure file write is complete
        setTimeout(() => {
            convertAllFiles();
            console.log('\n👀 Watching for more changes...\n');
        }, 500);
    }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 CSV File Watcher stopped');
    process.exit(0);
}); 