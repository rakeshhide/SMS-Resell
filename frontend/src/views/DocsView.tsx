import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, Play, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { ApiClient } from '../services/api';
import { ApiKey } from '../types';

export const DocsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'curl' | 'node' | 'python' | 'php'>('curl');
  const [copied, setCopied] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>([]);

  // Playground state
  const [testKey, setTestKey] = useState('');
  const [testPhone, setTestPhone] = useState('9876543210');
  const [testOtp, setTestOtp] = useState('482910');
  const [simulating, setSimulating] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    ApiClient.listApiKeys().then((res) => {
      if (res?.keys && res.keys.length > 0) {
        setKeys(res.keys);
        setTestKey(res.keys[0].key_prefix + '...YOUR_SECRET_KEY');
      }
    }).catch(() => {});
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunPlayground = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testKey || !testPhone || !testOtp) return;

    try {
      setSimulating(true);
      setTestResult(null);
      const res = await ApiClient.testSendOTP(testKey, testPhone, testOtp);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ status: 500, data: { success: false, message: err.message } });
    } finally {
      setSimulating(false);
    }
  };

  const codeSnippets = {
    curl: `curl -X POST https://apinexusotp.vercel.app/api/v1/otp/send \\
  -H "Authorization: Bearer sk_live_your_secret_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "9876543210",
    "otp": "482910"
  }'`,
    node: `import axios from 'axios';

const response = await axios.post(
  'https://apinexusotp.vercel.app/api/v1/otp/send',
  {
    phone: '9876543210',
    otp: '482910'
  },
  {
    headers: {
      Authorization: 'Bearer sk_live_your_secret_api_key',
      'Content-Type': 'application/json'
    }
  }
);

console.log(response.data);`,
    python: `import requests

url = "https://apinexusotp.vercel.app/api/v1/otp/send"
headers = {
    "Authorization": "Bearer sk_live_your_secret_api_key",
    "Content-Type": "application/json"
}
payload = {
    "phone": "9876543210",
    "otp": "482910"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    php: `<?php

$ch = curl_init('https://apinexusotp.vercel.app/api/v1/otp/send');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer sk_live_your_secret_api_key',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'phone' => '9876543210',
    'otp' => '482910'
]));

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`
  };

  return (
    <div className="page-container">
      
      {/* Intro Header */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Developer API Reference
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Integrate lightning-fast OTP dispatches into your applications in minutes using standard REST endpoints.
        </p>
      </div>

      {/* Code Integration Block */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid #1e293b',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Language Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          backgroundColor: '#0b1120',
          borderBottom: '1px solid #1e293b',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(['curl', 'node', 'python', 'php'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveTab(lang)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: activeTab === lang ? '#ffffff' : '#94a3b8',
                  backgroundColor: activeTab === lang ? '#1e293b' : 'transparent',
                  textTransform: 'uppercase'
                }}
              >
                {lang}
              </button>
            ))}
          </div>

          <button
            onClick={() => copyCode(codeSnippets[activeTab])}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Snippet */}
        <div style={{ padding: '20px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <pre style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: '#e2e8f0',
            lineHeight: 1.6,
            whiteSpace: 'pre'
          }}>
            {codeSnippets[activeTab]}
          </pre>
        </div>
      </div>

      {/* Interactive API Playground */}
      <div className="surface-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Sparkles size={20} color="#3b82f6" />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
            Interactive Endpoint Playground
          </h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Execute live test calls to the local carrier dispatch engine directly from your browser.
        </p>

        <form onSubmit={handleRunPlayground} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Authorization API Key
            </label>
            <input
              type="text"
              required
              placeholder="Bearer sk_live_..."
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Recipient Mobile Number
            </label>
            <input
              type="text"
              required
              maxLength={10}
              placeholder="9876543210"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Verification OTP Code
            </label>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="123456"
              value={testOtp}
              onChange={(e) => setTestOtp(e.target.value)}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              disabled={simulating}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                padding: '11px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
              }}
            >
              <Play size={15} />
              <span>{simulating ? 'Dispatching...' : 'Execute Request'}</span>
            </button>
          </div>
        </form>

        {/* Live Response Card */}
        {testResult && (
          <div style={{
            marginTop: '24px',
            backgroundColor: '#090d16',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #1e293b'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                Server Response Output
              </span>
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: testResult.status === 200 ? '#064e3b' : '#450a0a',
                color: testResult.status === 200 ? '#34d399' : '#f87171'
              }}>
                HTTP {testResult.status}
              </span>
            </div>
            <pre style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#38bdf8',
              lineHeight: 1.5,
              overflowX: 'auto'
            }}>
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Response Specification Table */}
      <div className="surface-card">
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
          Standard HTTP Status Codes & Error Definitions
        </h3>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '500px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Status Code</th>
              <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Error Code</th>
              <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '12px 14px', fontWeight: 600, color: '#10b981' }}>200 OK</td>
              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>SUCCESS</td>
              <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>OTP accepted and dispatched to telecom carrier route.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '12px 14px', fontWeight: 600, color: '#ef4444' }}>400 Bad Request</td>
              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>VALIDATION_FAILED</td>
              <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>Invalid phone number or malformed JSON payload.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '12px 14px', fontWeight: 600, color: '#ef4444' }}>401 Unauthorized</td>
              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>INVALID_API_KEY</td>
              <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>Missing or non-existent secret API key.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f59e0b' }}>402 Payment Required</td>
              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>INSUFFICIENT_FUNDS</td>
              <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>Wallet balance is below required amount for message dispatch.</td>
            </tr>
            <tr>
              <td style={{ padding: '12px 14px', fontWeight: 600, color: '#ef4444' }}>429 Too Many Requests</td>
              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>RATE_LIMIT_EXCEEDED</td>
              <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>Client exceeded configured requests per minute limit.</td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
