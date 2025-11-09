import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

interface ArticleCategoryAttributes {
  article_id: string;
  category_id: string;
  match_score: number;
}

export class ArticleCategory extends Model<ArticleCategoryAttributes> implements ArticleCategoryAttributes {
  public article_id!: string;
  public category_id!: string;
  public match_score!: number;
}

ArticleCategory.init(
  {
    article_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'articles',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'categories',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    match_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
  },
  {
    sequelize,
    tableName: 'article_categories',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['article_id'] },
      { fields: ['category_id'] },
    ],
  }
);

export default ArticleCategory;
