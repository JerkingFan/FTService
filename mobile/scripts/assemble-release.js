const { execSync } = require("child_process");
const path = require("path");

const androidDir = path.join(__dirname, "..", "android");
const gradle =
  process.platform === "win32" ? "gradlew.bat assembleRelease" : "./gradlew assembleRelease";

execSync(gradle, {
  cwd: androidDir,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production" },
});
