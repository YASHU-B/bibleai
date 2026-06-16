const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'csv' to the asset extensions so Metro can bundle .csv files
if (!config.resolver.assetExts.includes('csv')) {
  config.resolver.assetExts.push('csv');
}

module.exports = config;
