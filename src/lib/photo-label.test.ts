import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { describePhoto, isFileNameAlt } from "./photo-label";
import type { Photo } from "./media";

const photo = (slug: string, category: Photo["category"], alt = "Dscf4266") =>
  ({ slug, category, alt }) as Photo;

describe("photo labels", () => {
  it("spots alts made from file names", () => {
    for (const alt of ["Copy Of Dscf0630", "Anselm 9 Of 14", "G D 57", "Dscf4266"]) assert.equal(isFileNameAlt(alt), true, alt);
    for (const alt of ["Runners at the start line.", "Bride laughing on the steps"]) assert.equal(isFileNameAlt(alt), false, alt);
  });

  it("names a photo by its category and place in it", () => {
    const grid = [photo("a", "events"), photo("b", "events"), photo("c", "street"), photo("d", "events")];
    assert.deepEqual(describePhoto(grid[3], grid), {
      label: "Events",
      position: "3 of 3",
      description: "Events photo 3 of 3",
    });
    assert.equal(describePhoto(grid[2], grid).position, "1 of 1");
  });

  it("keeps a hand-written alt", () => {
    const p = photo("a", "sports", "Hockey players at the goal mouth");
    assert.equal(describePhoto(p, [p]).description, "Sports photo 1 of 1: Hockey players at the goal mouth");
  });
});
