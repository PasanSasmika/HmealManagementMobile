module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel", 
    ],
    plugins: [
      "react-native-reanimated/plugin", // Required since it's in your package.json
    ],
  };
};