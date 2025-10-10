#!/usr/bin/env node

const { Pool } = require('pg');

// Database configuration using internal PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRE_SQL_INNER_HOST || '127.0.0.1',
  port: parseInt(process.env.POSTGRE_SQL_INNER_PORT || '5432'),
  database: 'postgres',
  user: process.env.POSTGRE_SQL_USER || 'postgres',
  password: process.env.POSTGRE_SQL_PASSWORD || 'CWdyCtek',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function clearUserData() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Starting to clear all user data...');
    
    // Count existing data before deletion
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const sessionCount = await client.query('SELECT COUNT(*) FROM sessions');
    const videoCount = await client.query('SELECT COUNT(*) FROM videos');
    const reactionCount = await client.query('SELECT COUNT(*) FROM reactions');
    
    console.log(`📊 Current data count:`);
    console.log(`   Users: ${userCount.rows[0].count}`);
    console.log(`   Sessions: ${sessionCount.rows[0].count}`);
    console.log(`   Videos: ${videoCount.rows[0].count}`);
    console.log(`   Reactions: ${reactionCount.rows[0].count}`);
    
    // Delete in correct order due to foreign key constraints
    console.log('🔄 Deleting sessions...');
    await client.query('DELETE FROM sessions');
    
    console.log('🔄 Deleting reactions...');
    await client.query('DELETE FROM reactions');
    
    console.log('🔄 Deleting videos...');
    await client.query('DELETE FROM videos');
    
    console.log('🔄 Deleting users...');
    await client.query('DELETE FROM users');
    
    // Reset auto-increment sequences
    console.log('🔄 Resetting ID sequences...');
    await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE videos_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE reactions_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE sessions_id_seq RESTART WITH 1');
    
    console.log('✅ All user data has been successfully cleared!');
    console.log('🔢 ID sequences have been reset to start from 1');
    
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
clearUserData()
  .then(() => {
    console.log('🎉 Data clearing completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Data clearing failed:', error);
    process.exit(1);
  });