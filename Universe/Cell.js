import * as d3 from 'd3';
import seedrandom from 'seedrandom';

import System from '../System/System.js';

class Cell {
  constructor (x, y) {
    // Prevent degenerate cases of -0 coordinates
    this.x = x === -0 ? 0 : x;
    this.y = y === -0 ? 0 : y;

    this.id = this.x + ',' + this.y;

    let distanceSquared = (this.x ** 2 + this.y ** 2);
    this.distance = Math.sqrt(distanceSquared);
    this.theta = Math.atan2(this.y, this.x);

    let numberGenerator = seedrandom(this.id);

    // 1. How many systems in this cell?
    let starDensity = 1 - distanceSquared / Cell.COORDINATE_LIMIT ** 2;
    let numSystems = Math.floor(starDensity * (Cell.MIN_NODES +
      numberGenerator() * (Cell.MAX_NODES - Cell.MIN_NODES)));

    // 2. Where are those systems?
    this.systems = [];
    let locations = {'dummy': {}};
    for (let i = 0; i < numSystems; i += 1) {
      // Prevent duplicate systems
      let newSystem;
      let key = 'dummy';
      while (locations[key]) {
        newSystem = new System(
          this.id + ':' + i,
          // Ensure some basic separation of the systems
          this.x + Math.round(10 * numberGenerator()) / 10,
          this.y + Math.round(10 * numberGenerator()) / 10
        );
        key = newSystem.x + '_' + newSystem.y;
      }
      locations[key] = newSystem;
      this.systems.push(newSystem);
    }

    // 3. We need to generate three additional seeds that can be (reproducably)
    // used later to generate internal links, links to the right, and links to
    // the bottom in an order-independent way
    this.internalLinkSeed = numberGenerator.int32();
    this.rightLinkSeed = numberGenerator.int32();
    this.bottomLinkSeed = numberGenerator.int32();

    // Store the last time this cell was used
    this.lastTouched = Date.now();
  }
  discourageLongLinks (link, numberGenerator) {
    return numberGenerator() <= 1 - Math.sqrt((link.target.x - link.source.x) ** 2 +
                                              (link.target.y - link.source.y) ** 2);
  }
  internalLinks () {
    this.lastTouched = Date.now();
    if (this.links) {
      return this.links;
    }
    let numberGenerator = seedrandom(this.internalLinkSeed);
    this.links = Cell.VORONOI(this.systems).links()
      .filter(d => this.discourageLongLinks(d, numberGenerator));
    return this.links;
  }
  rightLinks (rightCell) {
    if (rightCell.x !== this.x + 1) {
      throw new Error('Tried to get links between non-adjacent cells');
    }
    this.lastTouched = Date.now();
    if (this._rightLinks) {
      return this._rightLinks;
    }
    let numberGenerator = seedrandom(this.rightLinkSeed);
    let allSystems = this.systems.concat(rightCell.systems);
    this._rightLinks = Cell.VORONOI(allSystems).links()
      .filter(d => {
        // Only consider links that cross between cells
        if ((d.source.x < this.x + 1 && d.target.x >= this.x + 1) ||
            (d.target.x < this.x + 1 && d.source.x >= this.x + 1)) {
          return this.discourageLongLinks(d, numberGenerator);
        } else {
          return false;
        }
      });
    return this._rightLinks;
  }
  bottomLinks (bottomCell) {
    if (bottomCell.y !== this.y + 1) {
      throw new Error('Tried to get links between non-adjacent cells');
    }
    this.lastTouched = Date.now();
    if (this._bottomLinks) {
      return this._bottomLinks;
    }
    let numberGenerator = seedrandom(this.bottomLinkSeed);
    let allSystems = this.systems.concat(bottomCell.systems);
    this._bottomLinks = Cell.VORONOI(allSystems).links()
      .filter(d => {
        // Only consider links that cross between cells
        if ((d.source.y < this.y + 1 && d.target.y >= this.y + 1) ||
            (d.target.y < this.y + 1 && d.source.y >= this.y + 1)) {
          return this.discourageLongLinks(d, numberGenerator);
        } else {
          return false;
        }
      });
    return this._bottomLinks;
  }
}

// For all systems, we want precision to two decimal places past zero; Javascript can
// support about 13 digits with that precision
Cell.COORDINATE_LIMIT = 99; // 99999999999;
Cell.VORONOI = d3.voronoi().x(d => d.x).y(d => d.y);
Cell.PERCENTAGE_OF_LINKS_TO_KEEP = 0.25;
Cell.MIN_NODES = 5;
Cell.MAX_NODES = 15;

export default Cell;
