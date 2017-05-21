import * as d3 from 'd3';
import seedrandom from 'seedrandom';

import System from '../System';

class Cell {
  constructor (coordinates) {
    this.coordinates = coordinates;

    // Prevent degenerate cases of Math.atan2... (the exact result string forms
    // part of an ID... we can't have negative signs / swap in PI)
    if (this.coordinates.x === 0) {
      this.coordinates.x = +0;
    }
    if (this.coordinates.y === 0) {
      this.coordinates.y = +0;
    }

    let distanceSquared = (this.coordinates.x ** 2 + this.coordinates.y ** 2);
    let theta = Math.atan2(this.coordinates.y, this.coordinates.x);
    this.cellId = Math.sqrt(distanceSquared) + ',' + theta;

    let starDensity = 1 - distanceSquared / Cell.COORDINATE_LIMIT ** 2;

    let numberGenerator = seedrandom(this.coordinates);

    // 1. How many systems in this cell?
    let numSystems = Math.floor(starDensity * (Cell.MIN_NODES +
      numberGenerator() * (Cell.MAX_NODES - Cell.MIN_NODES)));

    // 2. Where are those systems?
    this.systems = [];
    let locations = {};
    for (let i = 0; i < numSystems; i += 1) {
      // Ensure some basic separation of the systems
      let newSystem = new System(
        numberGenerator.int32(),
        this.cellId + ':' + i,
        this.coordinates.x + Math.round(10 * numberGenerator()) / 10,
        this.coordinates.y + Math.round(10 * numberGenerator()) / 10
      );
      let key = newSystem.x + '_' + newSystem.y;
      if (!locations[key]) {
        // Prevent systems from being in the same place... even though the odds are small,
        // the galaxy is huge... so it's going to happen at some point, by definition
        this.systems.push(newSystem);
      }
    }

    // We need to generate three additional seeds that can be (reproducably) used
    // later to generate internal links, links to the right, and links to the bottom
    this.internalLinkSeed = numberGenerator.int32();
    this.rightLinkSeed = numberGenerator.int32();
    this.bottomLinkSeed = numberGenerator.int32();
  }
  discourageLongLinks (link, numberGenerator) {
    return numberGenerator() <= 1 - Math.sqrt((link.target.x - link.source.x) ** 2 +
                                              (link.target.y - link.source.y) ** 2);
  }
  generateInternalLinks () {
    if (this.links) {
      return this.links;
    }
    let numberGenerator = seedrandom(this.internalLinkSeed);
    this.links = Cell.VORONOI(this.systems).links()
      .filter(d => this.discourageLongLinks(d, numberGenerator));
    return this.links;
  }
  generateRightLinks (rightCell) {
    if (this.rightLinks) {
      return this.rightLinks;
    }
    let numberGenerator = seedrandom(this.rightLinkSeed);
    let allSystems = this.systems.concat(rightCell.systems);
    this.rightLinks = Cell.VORONOI(allSystems).links()
      .filter(d => {
        // Only consider edges that cross between cells
        if ((d.source.x < this.coordinates.x + 1 && d.target.x >= this.coordinates.x + 1) ||
            (d.target.x < this.coordinates.x + 1 && d.source.x >= this.coordinates.x + 1)) {
          return this.discourageLongLinks(d, numberGenerator);
        } else {
          return false;
        }
      });
    return this.rightLinks;
  }
  generateBottomLinks (bottomCell) {
    if (this.bottomLinks) {
      return this.bottomLinks;
    }
    let numberGenerator = seedrandom(this.bottomLinkSeed);
    let allSystems = this.systems.concat(bottomCell.systems);
    this.bottomLinks = Cell.VORONOI(allSystems).links()
      .filter(d => {
        // Only consider edges that cross between cells
        if ((d.source.y < this.coordinates.y + 1 && d.target.y >= this.coordinates.y + 1) ||
            (d.target.y < this.coordinates.y + 1 && d.source.y >= this.coordinates.y + 1)) {
          return this.discourageLongLinks(d, numberGenerator);
        } else {
          return false;
        }
      });
    return this.bottomLinks;
  }
}

// For all systems, we want precision to two decimal places past zero; Javascript can
// support about 13 digits with that precision
Cell.COORDINATE_LIMIT = 9999999999999;
Cell.VORONOI = d3.voronoi().x(d => d.x).y(d => d.y);
Cell.PERCENTAGE_OF_LINKS_TO_KEEP = 0.25;
Cell.MIN_NODES = 5;
Cell.MAX_NODES = 15;

export default Cell;
