import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ArticlePriority, Sentiment } from '../../../shared/src';

interface ArticleAttributes {
  id: string;
  source_id: string;
  title: string;
  content?: string;
  summary?: string;
  url?: string;
  image_url?: string;
  published_at: Date;
  collected_at: Date;
  content_hash: string;
  duplicate_of?: string;
  relevance_score: number;
  priority: ArticlePriority;
  primary_region?: string;
  secondary_regions?: string[];
  sentiment?: Sentiment;
  is_read_by?: string[];
  flagged_by?: string[];
  search_vector?: any;
  created_at: Date;
}

interface ArticleCreationAttributes extends Optional<ArticleAttributes, 'id' | 'created_at' | 'collected_at' | 'is_read_by' | 'flagged_by'> {}

export class Article extends Model<ArticleAttributes, ArticleCreationAttributes> implements ArticleAttributes {
  public id!: string;
  public source_id!: string;
  public title!: string;
  public content?: string;
  public summary?: string;
  public url?: string;
  public image_url?: string;
  public published_at!: Date;
  public collected_at!: Date;
  public content_hash!: string;
  public duplicate_of?: string;
  public relevance_score!: number;
  public priority!: ArticlePriority;
  public primary_region?: string;
  public secondary_regions?: string[];
  public sentiment?: Sentiment;
  public is_read_by?: string[];
  public flagged_by?: string[];
  public search_vector?: any;
  public readonly created_at!: Date;
}

Article.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    source_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sources',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    summary: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    image_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    collected_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    content_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: 'SHA-256 hash for deduplication',
    },
    duplicate_of: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'articles',
        key: 'id',
      },
    },
    relevance_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    priority: {
      type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
      allowNull: false,
    },
    primary_region: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    secondary_regions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    sentiment: {
      type: DataTypes.ENUM('positive', 'neutral', 'negative'),
      allowNull: true,
    },
    is_read_by: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      allowNull: true,
      comment: 'Array of user IDs who read this article',
    },
    flagged_by: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      allowNull: true,
      comment: 'Array of user IDs who flagged this article',
    },
    search_vector: {
      type: 'TSVECTOR',
      allowNull: true,
      comment: 'Full-text search vector',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'articles',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['published_at'], using: 'BTREE', order: [['published_at', 'DESC']] },
      { fields: ['relevance_score'], using: 'BTREE', order: [['relevance_score', 'DESC']] },
      { fields: ['priority'] },
      { fields: ['primary_region'] },
      { fields: ['content_hash'], unique: true },
      { fields: ['source_id'] },
      { fields: ['search_vector'], using: 'GIN' },
    ],
  }
);

export default Article;
