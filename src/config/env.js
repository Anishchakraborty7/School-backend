import fs from 'fs';
import path from 'path';

// Find .env relative to process.cwd()
const envPath = path.resolve(process.cwd(), '.env');

function parseEnvFile(filePath) {
  const envConfig = {};
  if (!fs.existsSync(filePath)) {
    return envConfig;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        envConfig[key] = value;
      }
    }
  } catch (error) {
    console.error('Error reading/parsing .env file:', error);
  }
  return envConfig;
}

const fileConfig = parseEnvFile(envPath);

// Helper function to resolve config value
function get(key, defaultValue = '') {
  if (fileConfig[key] !== undefined) {
    return fileConfig[key];
  }
  if (process.env[key] !== undefined) {
    return process.env[key];
  }
  return defaultValue;
}

export const config = {
  db: {
    host: get('database host') || get('DB_HOST') || 'localhost',
    user: get('database username') || get('DB_USER') || 'root',
    password: get('database password') || get('DB_PASSWORD') || 'password',
    name: get('database name') || get('DB_NAME') || 'school_manage_database',
    port: parseInt(get('DB_PORT') || '3306', 10),
  },
  server: {
    port: parseInt(get('PORT') || '5000', 10),
    env: get('NODE_ENV') || 'development',
    corsOrigin: get('CORS_ORIGIN') || '*',
  },
  jwt: {
    secret: (() => {
      const key = get('JWT_SECRET') || get('JWT_SECRET_KEY');
      if (!key || key === 'super_secret_jwt_access_key_12345!') {
        console.warn('⚠️ WARNING: JWT_SECRET is not configured in .env! Using insecure fallback key.');
        return 'super_secret_jwt_access_key_12345!';
      }
      return key;
    })(),
    refreshSecret: (() => {
      const key = get('JWT_REFRESH_SECRET') || get('JWT_REFRESH_SECRET_KEY');
      if (!key || key === 'super_secret_jwt_refresh_key_98765!') {
        console.warn('⚠️ WARNING: JWT_REFRESH_SECRET is not configured in .env! Using insecure fallback key.');
        return 'super_secret_jwt_refresh_key_98765!';
      }
      return key;
    })(),
    accessExpiration: get('JWT_ACCESS_EXPIRATION') || '15m',
    refreshExpiration: get('JWT_REFRESH_EXPIRATION') || '7d',
  },
  rateLimit: {
    windowMs: parseInt(get('RATE_LIMIT_WINDOW_MS') || '60000', 10), // 1 min default
    max: parseInt(get('RATE_LIMIT_MAX') || '10000', 10), // 10000 requests default
  }
};
