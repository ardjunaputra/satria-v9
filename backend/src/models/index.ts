import { sequelize } from '../config/database';
import User from './User';
import Article from './Article';
import Category from './Category';
import ArticleCategory from './ArticleCategory';
import Keyword from './Keyword';
import Source from './Source';
import SavedSearch from './SavedSearch';
import AlertRule from './AlertRule';
import AuditLog from './AuditLog';
import Session from './Session';
import SystemStatus from './SystemStatus';

// Define associations between models
const setupAssociations = () => {
  // User associations
  User.hasMany(SavedSearch, { foreignKey: 'user_id', as: 'savedSearches' });
  User.hasMany(AlertRule, { foreignKey: 'user_id', as: 'alertRules' });
  User.hasMany(Session, { foreignKey: 'user_id', as: 'sessions' });
  User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
  User.hasMany(Keyword, { foreignKey: 'created_by', as: 'createdKeywords' });

  // Article associations
  Article.belongsTo(Source, { foreignKey: 'source_id', as: 'source' });
  Article.belongsToMany(Category, {
    through: ArticleCategory,
    foreignKey: 'article_id',
    otherKey: 'category_id',
    as: 'categories',
  });
  Article.belongsTo(Article, { foreignKey: 'duplicate_of', as: 'originalArticle' });

  // Category associations
  Category.belongsToMany(Article, {
    through: ArticleCategory,
    foreignKey: 'category_id',
    otherKey: 'article_id',
    as: 'articles',
  });
  Category.hasMany(Keyword, { foreignKey: 'category_id', as: 'keywords' });

  // Source associations
  Source.hasMany(Article, { foreignKey: 'source_id', as: 'articles' });

  // Keyword associations
  Keyword.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
  Keyword.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

  // SavedSearch associations
  SavedSearch.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // AlertRule associations
  AlertRule.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Session associations
  Session.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // AuditLog associations
  AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
};

// Set up associations
setupAssociations();

// Export models and sequelize instance
export {
  sequelize,
  User,
  Article,
  Category,
  ArticleCategory,
  Keyword,
  Source,
  SavedSearch,
  AlertRule,
  AuditLog,
  Session,
  SystemStatus,
};

export default {
  sequelize,
  User,
  Article,
  Category,
  ArticleCategory,
  Keyword,
  Source,
  SavedSearch,
  AlertRule,
  AuditLog,
  Session,
  SystemStatus,
};
