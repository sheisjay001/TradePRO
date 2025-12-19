
import { scanAndMaybeGenerate } from './src/lib/auto';

console.log("Starting manual debug run of scanAndMaybeGenerate...");

scanAndMaybeGenerate()
  .then((result) => {
    console.log("Scan finished. Result:", result);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Scan failed with error:", err);
    process.exit(1);
  });
