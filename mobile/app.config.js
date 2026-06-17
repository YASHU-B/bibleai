const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const appJson = require('./app.json');

const expo = {
  ...appJson.expo,
  extra: {
    ...(appJson.expo.extra || {}),
    ...process.env,
  },
};

module.exports = ({ config }) => {
  return {
    ...config,
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra || {}),
      ...config.extra,
      ...process.env,
    },
  };
};
