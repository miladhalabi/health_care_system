import logger from '../utils/logger.js';

class AuditService {
  /**
   * Log an action to the database and console
   * @param {Object} prisma - Prisma instance
   * @param {Object} data - Audit data
   */
  static async log(prisma, { action, entity, entityId, userId, details }) {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          entity,
          entityId,
          userId,
          details: details ? JSON.parse(JSON.stringify(details)) : null
        }
      });
      
      logger.info(`Audit Log: ${action} on ${entity} (${entityId}) by User ${userId}`);
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      // We don't throw here to avoid failing the main operation if audit fails
    }
  }
}

export default AuditService;
