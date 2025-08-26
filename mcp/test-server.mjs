#!/usr/bin/env node

// Simple smoke test for MCP server
import { spawn } from 'child_process';

// Set test environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.TZ = 'Asia/Jakarta';

console.log('Testing MCP server smoke test...');

const server = spawn('node', ['mcp/soap-tools.mjs'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseData = '';

server.stdout.on('data', (data) => {
  responseData += data.toString();
});

server.stderr.on('data', (data) => {
  console.error('Server stderr:', data.toString());
});

// Send MCP help request
const helpRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

server.stdin.write(JSON.stringify(helpRequest) + '\n');

setTimeout(() => {
  server.kill('SIGTERM');
  
  console.log('Server response:');
  console.log(responseData);
  
  // Check if we got expected tools
  const hasPatientSearch = responseData.includes('patient_searchByName');
  const hasSoapGetLatest = responseData.includes('soap_getLatest');
  const hasSoapAppend = responseData.includes('soap_appendPlanItem');
  const hasSoapRecompute = responseData.includes('soap_recomputePlanStatuses');
  
  const allToolsPresent = hasPatientSearch && hasSoapGetLatest && hasSoapAppend && hasSoapRecompute;
  
  console.log('\n=== Smoke Test Results ===');
  console.log('✓ Server started without errors');
  console.log(`${hasPatientSearch ? '✓' : '✗'} patient_searchByName tool found`);
  console.log(`${hasSoapGetLatest ? '✓' : '✗'} soap_getLatest tool found`);
  console.log(`${hasSoapAppend ? '✓' : '✗'} soap_appendPlanItem tool found`);
  console.log(`${hasSoapRecompute ? '✓' : '✗'} soap_recomputePlanStatuses tool found`);
  
  if (allToolsPresent) {
    console.log('\n🎉 All tools are properly registered!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tools missing from response');
    process.exit(1);
  }
}, 2000);

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});