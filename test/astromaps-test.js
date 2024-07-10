import assert from "assert";
import * as astromaps from "./astromaps.js";
import {mkdirSync, writeFileSync} from "fs";
import {resolve} from "path";

mkdirSync("./test/svg", {recursive: true});

for (const [name, astromap] of Object.entries(astromaps)) {
  it(`astromap ${name}`, async function() {
    this.timeout(10000000);
    const outfile = resolve("./test/svg", `${name}.svg`);

    var svg_data = await astromap();
    console.log("filename: "+outfile);
    writeFileSync(outfile, svg_data);

    assert(1 === 1, `${name}.svg generated)`);
  });
}
