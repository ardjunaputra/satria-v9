import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SavedSearchAttributes {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  is_shared: boolean;
  created_at: Date;
  updated_at: Date;
}

interface SavedSearchCreationAttributes extends Optional<SavedSearchAttributes, 'id' | 'created_at' | 'updated_at' | 'is_shared'> {}

export class SavedSearch extends Model<SavedSearchAttributes, SavedSearchCreationAttributes> implements SavedSearchAttributes {
  public id!: string;
  public user_id!: string;
  public name!: string;
  public description?: string;
  public filters!: Record<string, any>;
  public is_shared!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

SavedSearch.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    filters: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Stored filter configuration',
    },
    is_shared: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
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
    tableName: 'saved_searches',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['is_shared'] },
    ],
  }
);

export default SavedSearch;
