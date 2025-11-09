import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SystemStatusAttributes {
  id: number;
  last_refresh_time?: Date;
  next_refresh_time?: Date;
  articles_collected_today: number;
  aggregation_running: boolean;
  system_version: string;
  updated_at: Date;
}

interface SystemStatusCreationAttributes extends Optional<SystemStatusAttributes, 'id' | 'articles_collected_today' | 'aggregation_running' | 'updated_at'> {}

export class SystemStatus extends Model<SystemStatusAttributes, SystemStatusCreationAttributes> implements SystemStatusAttributes {
  public id!: number;
  public last_refresh_time?: Date;
  public next_refresh_time?: Date;
  public articles_collected_today!: number;
  public aggregation_running!: boolean;
  public system_version!: string;
  public readonly updated_at!: Date;
}

SystemStatus.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: 1,
      validate: {
        equals: 1,
      },
    },
    last_refresh_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    next_refresh_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    articles_collected_today: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    aggregation_running: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    system_version: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'system_status',
    timestamps: false,
    underscored: true,
    validate: {
      onlyOneRow() {
        if (this.id !== 1) {
          throw new Error('Only one system status row is allowed');
        }
      },
    },
  }
);

export default SystemStatus;
