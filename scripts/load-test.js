/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
/**
 * Odessi.tfi — Read-Heavy Endpoint Load Testing Script
 * 
 * Simulates concurrent read requests against core API endpoints to measure:
 * - Requests per second (RPS)
 * - Latency distributions (p50, p95, p99)
 * - Error rate (%)
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const baseUrl = process.argv[2] || 'http://localhost:8080';
const concurrency = parseInt(process.argv[3] || '5', 10);
const totalRequests = parseInt(process.argv[4] || '50', 10);

const endpoints = [
  '/api/products?page=0&size=12',
  '/api/categories',
  '/api/collections',
  '/api/products/search?query=shirt',
];

console.log(`====================================================`);
console.log(` ODESSI.TFI API LOAD TEST RUNNER`);
console.log(` Target Base URL: ${baseUrl}`);
console.log(` Concurrency Level: ${concurrency}`);
console.log(` Total Requests: ${totalRequests}`);
console.log(`====================================================\n`);

let completed = 0;
let successCount = 0;
let errorCount = 0;
const latencies = [];

const startTime = Date.now();

function makeRequest(index) {
  if (completed >= totalRequests) return;

  const endpoint = endpoints[index % endpoints.length];
  const fullUrl = new URL(endpoint, baseUrl);
  const client = fullUrl.protocol === 'https:' ? https : http;

  const reqStart = Date.now();

  const req = client.get(fullUrl, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      const duration = Date.now() - reqStart;
      latencies.push(duration);
      completed++;

      if (res.statusCode >= 200 && res.statusCode < 400) {
        successCount++;
      } else {
        errorCount++;
      }

      console.log(`[Req ${completed}/${totalRequests}] ${endpoint} -> ${res.statusCode} (${duration}ms)`);

      if (completed < totalRequests) {
        makeRequest(index + concurrency);
      } else if (completed === totalRequests) {
        finishReport();
      }
    });
  });

  req.on('error', (err) => {
    const duration = Date.now() - reqStart;
    latencies.push(duration);
    completed++;
    errorCount++;

    console.log(`[Req ${completed}/${totalRequests}] ${endpoint} -> ERROR (${duration}ms): ${err.message}`);

    if (completed < totalRequests) {
      makeRequest(index + concurrency);
    } else if (completed === totalRequests) {
      finishReport();
    }
  });

  req.end();
}

function finishReport() {
  const totalTimeSec = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = (totalRequests / (totalTimeSec || 1)).toFixed(2);
  const errorRate = ((errorCount / totalRequests) * 100).toFixed(2);

  console.log(`\n====================================================`);
  console.log(` LOAD TEST RESULTS`);
  console.log(`====================================================`);
  console.log(` Total Execution Time: ${totalTimeSec.toFixed(2)} seconds`);
  console.log(` Throughput: ${rps} req/sec`);
  console.log(` Successful Requests: ${successCount} / ${totalRequests}`);
  console.log(` Failed Requests: ${errorCount} (${errorRate}%)`);
  console.log(`----------------------------------------------------`);
  console.log(` Latency p50 (Median): ${p50} ms`);
  console.log(` Latency p95: ${p95} ms`);
  console.log(` Latency p99: ${p99} ms`);
  console.log(`====================================================\n`);
}

// Start worker queue
for (let i = 0; i < Math.min(concurrency, totalRequests); i++) {
  makeRequest(i);
}
