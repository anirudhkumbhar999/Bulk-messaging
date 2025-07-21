const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    ws: path.resolve(__dirname, 'ws-shim.js'),
    stream: path.resolve(__dirname, 'stream-shim.js'),
};

module.exports = config; 