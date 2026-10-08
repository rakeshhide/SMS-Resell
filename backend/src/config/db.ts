import dns from 'dns';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.NEON_DB;

if (!connectionString) {
  console.error('[DATABASE] Critical: NEON_DB environment variable is missing.');
  process.exit(1);
}

// Resilient public DNS resolver to avoid Windows local DNS refusal for cloud endpoints
const resolver = new dns.Resolver();
try {
  resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // ignore if not permitted
}

const originalLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback?: any) => {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'object' && options ? options : {};

  // If resolving Neon tech or external cloud databases
  if (hostname.includes('neon.tech') || hostname.includes('aws')) {
    resolver.resolve4(hostname, (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        if (opts.all) {
          return cb(null, addresses.map((addr) => ({ address: addr, family: 4 })));
        }
        return cb(null, addresses[0], 4);
      }
      return originalLookup(hostname, opts, cb);
    });
    return;
  }

  return originalLookup(hostname, opts, cb);
};

// Enterprise connection pool configuration
export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // max concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected pool client error:', err.message);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
