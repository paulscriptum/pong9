import { access } from "node:fs/promises";
import { constants } from "node:fs";

const required = [
  "index.html",
  "styles.css",
  "src/main.js",
  "src/render.js",
  "src/standbyWormTrack.js",
  "images/standby_worm.webm",
  "images/standby_worm.mov",
  "images/standby_worm_opaque.mp4",
  "images/title_8bit_pong.png",
  "images/button_zanovo.png",
  "images/button_rezhim_sna.png",
];

for (const file of required) {
  await access(file, constants.R_OK);
}

console.log("Static build verified:", required.length, "files");
