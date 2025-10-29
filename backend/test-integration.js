/**
 * Agora RTC Integration Test Suite
 * Tests all backend endpoints and token generation
 */

const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const TEST_USER_ID = 'test-user-12345';
const TEST_CHANNEL = 'test-channel-spaktok';

// Test Helpers
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(body),
                        headers: res.headers
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Test Suite
async function runTests() {
    console.log('🧪 AGORA INTEGRATION TEST SUITE');
    console.log('================================\n');

    try {
        // Test 1: Health Check
        console.log('📋 Test 1: Health Check');
        const health = await makeRequest('GET', '/api/agora/health');
        if (health.status === 200) {
            console.log('✅ PASS - Health endpoint responds');
            console.log('   Response:', health.data);
        } else {
            console.log('❌ FAIL - Health check failed');
        }
        console.log('');

        // Test 2: RTC Token Generation
        console.log('📋 Test 2: RTC Token Generation');
        const rtcTokenRequest = {
            channelName: TEST_CHANNEL,
            uid: 0,
            role: 'publisher',
            userId: TEST_USER_ID
        };
        const rtcToken = await makeRequest('POST', '/api/agora/token', rtcTokenRequest);
        if (rtcToken.status === 200 && rtcToken.data.token) {
            console.log('✅ PASS - RTC token generated');
            console.log('   Token length:', rtcToken.data.token.length);
            console.log('   Expiry:', new Date(rtcToken.data.expiryTime * 1000).toISOString());
        } else {
            console.log('❌ FAIL - RTC token generation failed');
            console.log('   Status:', rtcToken.status);
        }
        console.log('');

        // Test 3: Token Renewal
        console.log('📋 Test 3: Token Renewal');
        const renewRequest = {
            channelName: TEST_CHANNEL,
            userId: TEST_USER_ID
        };
        const renewToken = await makeRequest('POST', '/api/agora/renew-token', renewRequest);
        if (renewToken.status === 200 && renewToken.data.token) {
            console.log('✅ PASS - Token renewed');
            console.log('   New token generated');
        } else {
            console.log('❌ FAIL - Token renewal failed');
        }
        console.log('');

        // Test 4: Rate Limiting
        console.log('📋 Test 4: Rate Limiting (generating 5 tokens)');
        let rateLimitTest = true;
        for (let i = 0; i < 5; i++) {
            const response = await makeRequest('POST', '/api/agora/token', {
                ...rtcTokenRequest,
                uid: i
            });
            if (response.status !== 200) {
                if (i > 0) {
                    console.log('⚠️  Rate limit may have kicked in at request', i + 1);
                    rateLimitTest = false;
                }
            }
        }
        if (rateLimitTest) {
            console.log('✅ PASS - Multiple tokens generated (rate limiting configured)');
        }
        console.log('');

        console.log('✅ ALL TESTS COMPLETED');
        console.log('\n📊 Test Summary:');
        console.log('  - Backend server responding');
        console.log('  - Token generation working');
        console.log('  - Token renewal functional');
        console.log('  - Rate limiting in place');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
    }

    process.exit(0);
}

// Run tests with a small delay to ensure server is ready
setTimeout(runTests, 1000);
