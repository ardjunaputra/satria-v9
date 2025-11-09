import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SessionAttributes {
  id: string;
  user_id: string;
  refresh_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: Date;
  created_at: Date;
}

interface SessionCreationAttributes extends Optional<SessionAttributes, 'id' | 'created_at'> {}

export class Session extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
  public id!: string;
  public user_id!: string;
  public refresh_token!: string;
  public ip_address?: string;
  public user_agent?: string;
  public expires_at!: Date;
  public readonly created_at!: Date;
}

Session.init(
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
    refresh_token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
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
    tableName: 'sessions',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['refresh_token'], unique: true },
      { fields: ['expires_at'] },
    ],
  }
);

export default Session;
