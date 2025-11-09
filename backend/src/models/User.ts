import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { UserRole } from '../../../shared/src';

interface UserAttributes {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  mfa_secret?: string;
  mfa_enabled: boolean;
  backup_codes?: string[];
  is_active: boolean;
  last_login_at?: Date;
  password_changed_at?: Date;
  failed_login_attempts: number;
  locked_until?: Date;
  created_at: Date;
  updated_at: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at' | 'mfa_enabled' | 'is_active' | 'failed_login_attempts'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password_hash!: string;
  public full_name!: string;
  public phone_number?: string;
  public role!: UserRole;
  public mfa_secret?: string;
  public mfa_enabled!: boolean;
  public backup_codes?: string[];
  public is_active!: boolean;
  public last_login_at?: Date;
  public password_changed_at?: Date;
  public failed_login_attempts!: number;
  public locked_until?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'senior_analyst', 'analyst', 'viewer'),
      allowNull: false,
    },
    mfa_secret: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Encrypted TOTP secret',
    },
    mfa_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    backup_codes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: 'Encrypted backup codes for MFA recovery',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password_changed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
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
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['role'] },
      { fields: ['is_active'] },
    ],
  }
);

export default User;
