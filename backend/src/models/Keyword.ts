import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface KeywordAttributes {
  id: string;
  category_id: string;
  keyword: string;
  keyword_type: 'default' | 'user_defined';
  is_active: boolean;
  created_by?: string;
  created_at: Date;
}

interface KeywordCreationAttributes extends Optional<KeywordAttributes, 'id' | 'created_at' | 'is_active' | 'keyword_type'> {}

export class Keyword extends Model<KeywordAttributes, KeywordCreationAttributes> implements KeywordAttributes {
  public id!: string;
  public category_id!: string;
  public keyword!: string;
  public keyword_type!: 'default' | 'user_defined';
  public is_active!: boolean;
  public created_by?: string;
  public readonly created_at!: Date;
}

Keyword.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    keyword: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    keyword_type: {
      type: DataTypes.ENUM('default', 'user_defined'),
      defaultValue: 'default',
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'keywords',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['category_id'] },
      { fields: ['keyword'] },
      { fields: ['is_active'] },
    ],
  }
);

export default Keyword;
