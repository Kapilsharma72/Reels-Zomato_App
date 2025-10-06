const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ReelZomato Backend Server...\n');

// Check if we're in the Backend directory
const currentDir = process.cwd();
const backendDir = path.join(__dirname);

if (currentDir !== backendDir) {
  console.log('📁 Changing to Backend directory...');
  process.chdir(backendDir);
}

// Start the server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  console.log('\n💡 Make sure you have Node.js installed and run: npm install');
});

server.on('close', (code) => {
  if (code !== 0) {
    console.log(`\n⚠️ Server exited with code ${code}`);
  } else {
    console.log('\n✅ Server stopped gracefully');
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Shutting down server...');
  server.kill('SIGTERM');
});

console.log('📊 Server process started');
console.log('🔗 Backend will be available at: http://localhost:3001');
console.log('📱 Frontend should connect to: http://localhost:3001');
console.log('\n💡 Press Ctrl+C to stop the server');
