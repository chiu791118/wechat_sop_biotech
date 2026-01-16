import path from 'path';
import dotenv from 'dotenv';

// Load .env from root directory - this file must be imported first
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('Environment loaded:');
console.log('  GCS_BUCKET_NAME:', process.env.GCS_BUCKET_NAME);
console.log('  GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'SET' : 'NOT SET');
