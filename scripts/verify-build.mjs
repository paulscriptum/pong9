import { access } from "node:fs/promises";
import { constants } from "node:fs";

const required = [
  "index.html",
  "styles.css",
  "src/main.js",
  "src/render.js",
  "images/title_8bit_pong.png",
  "images/button_zanovo.png",
  "images/button_rezhim_sna.png",
];

for (const file of required) {
  await access(file, constants.R_OK);
}

console.log("Static build verified:", required.length, "files");
