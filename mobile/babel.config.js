module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // reanimated باید آخرین پلاگین باشد
    plugins: ['react-native-reanimated/plugin'],
  };
};
