const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LinkedinProfile = sequelize.define('LinkedinProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  about: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bio_line: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  follower_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  connection_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  }
}, {
  tableName: 'linkedin_profiles',
  timestamps: true
});

module.exports = LinkedinProfile;