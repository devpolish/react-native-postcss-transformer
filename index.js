var semver = require("semver");
var css2rn = require("css-to-react-native-transform").default;
var postcss = require("postcss");
var postcssrc = require("postcss-load-config");

var upstreamTransformer = null;

var reactNativeVersionString = require("react-native/package.json").version;
var reactNativeMinorVersion = semver(reactNativeVersionString).minor;

if (reactNativeMinorVersion >= 52) {
  upstreamTransformer = require("metro/src/transformer");
} else if (reactNativeMinorVersion >= 47) {
  upstreamTransformer = require("metro-bundler/src/transformer");
} else if (reactNativeMinorVersion === 46) {
  upstreamTransformer = require("metro-bundler/build/transformer");
} else {
  // handle RN <= 0.45
  var oldUpstreamTransformer = require("react-native/packager/transformer");
  upstreamTransformer = {
    transform({ src, filename, options }) {
      return oldUpstreamTransformer.transform(src, filename, options);
    }
  };
}

module.exports.transform = function(src, filename, options) {
  if (typeof src === "object") {
    // handle RN >= 0.46
    ({ src, filename, options } = src);
  }

  var ctx = { parser: false, map: "inline" };
  return postcssrc(ctx).then(config => {
    return postcss(config.plugins)
      .process(src, config.options)
      .then(result => {
        var cssObject = css2rn(result.css);
        return upstreamTransformer.transform({
          src: "module.exports = " + JSON.stringify(cssObject),
          filename,
          options
        });
      });
  });
};
