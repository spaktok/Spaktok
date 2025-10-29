/**
 * Agora Token Audit Service
 * Logs all token generation and renewal to PostgreSQL for security and tracking
 */

const { Pool } = require('pg');

class AgoraAuditService {
  constructor(pool) {
    this.pool = pool;
    this.initializeDatabase();
  }

  /**
   * Initialize the audit logging table
   */
  async initializeDatabase() {
    try {
      // PostgreSQL syntax
      const pgQuery = \
        CREATE TABLE IF NOT EXISTS agora_token_audit (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          channel_name VARCHAR(255) NOT NULL,
          uid BIGINT NOT NULL,
          role VARCHAR(50) NOT NULL,
          token VARCHAR(1000),
          expires_at TIMESTAMP NOT NULL,
          generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ip_address VARCHAR(45),
          user_agent VARCHAR(500),
          status VARCHAR(50) DEFAULT 'success',
          error_message TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_agora_user_id ON agora_token_audit(user_id);
        CREATE INDEX IF NOT EXISTS idx_agora_channel_name ON agora_token_audit(channel_name);
        CREATE INDEX IF NOT EXISTS idx_agora_generated_at ON agora_token_audit(generated_at);
      \;

      await this.pool.query(pgQuery);
      console.log('? Agora token audit table initialized');
    } catch (error) {
      console.error('? Error initializing audit table:', error);
    }
  }

  /**
   * Log token generation
   */
  async logTokenGeneration(userId, channelName, uid, role, expiresAt, token, ipAddress, userAgent) {
    try {
      const query = \
        INSERT INTO agora_token_audit 
        (user_id, channel_name, uid, role, token, expires_at, ip_address, user_agent, status)
        VALUES (\, \, \, \, \, \, \, \, 'success')
      \;

      await this.pool.query(query, [
        userId,
        channelName,
        uid,
        role,
        token,
        new Date(expiresAt * 1000),
        ipAddress,
        userAgent
      ]);

      console.log(\?? Token audit logged for user: \, channel: \\);
    } catch (error) {
      console.error('? Error logging token:', error);
    }
  }

  /**
   * Log token error
   */
  async logTokenError(userId, channelName, uid, role, errorMessage, ipAddress, userAgent) {
    try {
      const query = \
        INSERT INTO agora_token_audit 
        (user_id, channel_name, uid, role, expires_at, ip_address, user_agent, status, error_message)
        VALUES (\, \, \, \, \, \, \, 'error', \)
      \;

      await this.pool.query(query, [
        userId,
        channelName,
        uid,
        role,
        new Date(),
        ipAddress,
        userAgent,
        errorMessage
      ]);
    } catch (error) {
      console.error('? Error logging audit error:', error);
    }
  }

  /**
   * Get token generation statistics for a user
   */
  async getUserTokenStats(userId, days = 1) {
    try {
      const query = \
        SELECT 
          COUNT(*) as total_tokens,
          COUNT(DISTINCT channel_name) as unique_channels,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
          COUNT(CASE WHEN status = 'error' THEN 1 END) as failed,
          MAX(generated_at) as last_generated
        FROM agora_token_audit
        WHERE user_id = \ AND generated_at > NOW() - INTERVAL '1 day'
      \;

      const result = await this.pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('? Error fetching token stats:', error);
      return null;
    }
  }

  /**
   * Get channel statistics
   */
  async getChannelStats(channelName, days = 1) {
    try {
      const query = \
        SELECT 
          COUNT(*) as total_tokens,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(CASE WHEN role = 'publisher' THEN 1 END) as publishers,
          COUNT(CASE WHEN role = 'subscriber' THEN 1 END) as subscribers,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
          MAX(generated_at) as last_activity
        FROM agora_token_audit
        WHERE channel_name = \ AND generated_at > NOW() - INTERVAL '1 day'
      \;

      const result = await this.pool.query(query, [channelName]);
      return result.rows[0];
    } catch (error) {
      console.error('? Error fetching channel stats:', error);
      return null;
    }
  }

  /**
   * Cleanup old audit logs (older than 30 days)
   */
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const query = \
        DELETE FROM agora_token_audit
        WHERE generated_at < NOW() - INTERVAL '30 days'
      \;

      const result = await this.pool.query(query);
      console.log(\? Cleaned up \ old audit logs\);
    } catch (error) {
      console.error('? Error cleaning up logs:', error);
    }
  }
}

module.exports = AgoraAuditService;
