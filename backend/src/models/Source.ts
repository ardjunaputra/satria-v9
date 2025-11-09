import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { SourceType, SourceStatus } from '../../../shared/src';

interface SourceAttributes {
  id: string;
  name: string;
  source_type: SourceType;
  url?: string;
  api_key?: string;
  config?: Record<string, any>;
  is_active: boolean;
  credibility_score: number;
  last_fetch_at?: Date;
  last_success_at?: Date;
  status: SourceStatus;
  error_count: number;
  created_at: Date;
}

interface SourceCreationAttributes extends Optional<SourceAttributes, 'id' | 'created_at' | 'is_active' | 'credibility_score' | 'error_count' | 'status'> {}

export class Source extends Model<SourceAttributes, SourceCreationAttributes> implements SourceAttributes {
  public id!: string;
  public name!: string;
  public source_type!: SourceType;
  public url?: string;
  public api_key?: string;
  public config?: Record<string, any>;
  public is_active!: boolean;
  public credibility_score!: number;
  public last_fetch_at?: Date;
  public last_success_at?: Date;
  public status!: SourceStatus;
  public error_count!: number;
  public readonly created_at!: Date;
}

Source.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    source_type: {
      type: DataTypes.ENUM('news_api', 'rss', 'twitter', 'telegram', 'reddit', 'osint'),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    api_key: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Encrypted API key',
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Source-specific configuration',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    credibility_score: {
      type: DataTypes.INTEGER,
      defaultValue: 70,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    last_fetch_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_success_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('online', 'offline', 'error'),
      defaultValue: 'online',
      allowNull: false,
    },
    error_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
    tableName: 'sources',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['source_type'] },
      { fields: ['is_active'] },
      { fields: ['status'] },
    ],
  }
);

export default Source;
