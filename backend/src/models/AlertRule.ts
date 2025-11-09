import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface AlertRuleAttributes {
  id: string;
  user_id: string;
  name: string;
  conditions: Record<string, any>;
  notification_methods: {
    toast: boolean;
    banner: boolean;
    sound: boolean;
    sound_type?: 'default' | 'urgent' | 'silent';
  };
  is_active: boolean;
  triggered_count: number;
  last_triggered_at?: Date;
  created_at: Date;
}

interface AlertRuleCreationAttributes extends Optional<AlertRuleAttributes, 'id' | 'created_at' | 'is_active' | 'triggered_count'> {}

export class AlertRule extends Model<AlertRuleAttributes, AlertRuleCreationAttributes> implements AlertRuleAttributes {
  public id!: string;
  public user_id!: string;
  public name!: string;
  public conditions!: Record<string, any>;
  public notification_methods!: {
    toast: boolean;
    banner: boolean;
    sound: boolean;
    sound_type?: 'default' | 'urgent' | 'silent';
  };
  public is_active!: boolean;
  public triggered_count!: number;
  public last_triggered_at?: Date;
  public readonly created_at!: Date;
}

AlertRule.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    conditions: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Boolean logic conditions',
    },
    notification_methods: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Toast, banner, sound settings',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    triggered_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    last_triggered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'alert_rules',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['is_active'] },
    ],
  }
);

export default AlertRule;
