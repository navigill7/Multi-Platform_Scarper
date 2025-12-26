const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InstagramProfile = sequelize.define('InstagramProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  display_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  follower_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  following_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  post_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  is_private: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  }
}, {
  tableName: 'instagram_profiles',
  timestamps: true
});

module.exports = InstagramProfile;