const fs = require("fs");
const path = require("path");

const src = path.join(
  __dirname,
  "..",
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "release",
  "app-release.apk"
);
const destDir = path.join(__dirname, "..", "dist");
const dest = path.join(destDir, "FTservice-release.apk");

if (!fs.existsSync(src)) {
  console.error("APK not found:", src);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log("Copied to", dest);
