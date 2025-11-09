import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface AuditLogAttributes {
  id: number;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failure';
  created_at: Date;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'created_at'> {}

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: number;
  public user_id?: string;
  public action!: string;
  public resource_type?: string;
  public resource_id?: string;
  public details?: Record<string, any>;
  public ip_address?: string;
  public user_agent?: string;
  public status!: 'success' | 'failure';
  public readonly created_at!: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    resource_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    resource_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('success', 'failure'),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['created_at'], using: 'BTREE', order: [['created_at', 'DESC']] },
      { fields: ['resource_type', 'resource_id'] },
    ],
  }
);

export default AuditLog;
