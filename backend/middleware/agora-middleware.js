/**
 * Agora Middleware
 * Handles token validation, rate limiting, and audit logging
 */

class AgoraMiddleware {
  constructor(auditService) {
    this.auditService = auditService;
  }

  validateRequest() {
    return (req, res, next) => {
      const { channelName, uid, userId, role } = req.body;
      const errors = [];
      
      if (!channelName || typeof channelName !== 'string') {
        errors.push('channelName is required and must be a string');
      }
      
      if (channelName && channelName.length > 64) {
        errors.push('channelName must not exceed 64 characters');
      }

      if (uid === undefined || typeof uid !== 'number') {
        errors.push('uid is required and must be a number');
      }

      if (!userId || typeof userId !== 'string') {
        errors.push('userId is required and must be a string');
      }

      if (role && !['publisher', 'subscriber'].includes(role)) {
        errors.push('role must be either publisher or subscriber');
      }

      if (errors.length > 0) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }

      req.agoraParams = {
        channelName: channelName.trim(),
        uid: parseInt(uid),
        userId: userId.trim(),
        role: role || 'publisher',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || 'unknown'
      };

      next();
    };
  }

  auditLog() {
    return async (req, res, next) => {
      const originalJson = res.json;

      res.json = function(data) {
        if (data && data.success && data.token) {
          if (this.auditService) {
            this.auditService.logTokenGeneration(
              req.agoraParams.userId,
              req.agoraParams.channelName,
              req.agoraParams.uid,
              req.agoraParams.role,
              data.expiryTime,
              data.token,
              req.agoraParams.ipAddress,
              req.agoraParams.userAgent
            ).catch(err => console.error('Audit logging failed:', err));
          }
        }

        return originalJson.call(this, data);
      }.bind({ auditService: this.auditService });

      next();
    };
  }

  errorHandler() {
    return (err, req, res, next) => {
      console.error('Agora middleware error:', err);

      if (req.agoraParams && this.auditService) {
        this.auditService.logTokenError(
          req.agoraParams.userId,
          req.agoraParams.channelName,
          req.agoraParams.uid,
          req.agoraParams.role,
          err.message,
          req.agoraParams.ipAddress,
          req.agoraParams.userAgent
        ).catch(err => console.error('Error audit logging failed:', err));
      }

      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    };
  }
}

module.exports = AgoraMiddleware;
