import { spawn } from "node:child_process";
import path from "node:path";

const command = process.argv[2] ?? "dev";
const executable = path.resolve(
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vinext.cmd" : "vinext",
);

const child = spawn(executable, [command], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
  },
});

child.on("exit", (code) => process.exit(code ?? 1));
