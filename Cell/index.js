import * as d3 from 'd3';
import seedrandom from 'seedrandom';

import System from '../System';

class Cell {
  constructor (coordinates) {
    this.coordinates = coordinates;

    // We want the outer edge of the galaxy to taper off at the edges w.r.t. the square of the distance;
    // this ensures that, once either coordinate reaches 13 digits, there will be no stars (but doesn't
    // really start having an effect until 12 digits)
    let starDensity = 1 - (this.coordinates.x ** 2 + this.coordinates.y ** 2) / Cell.COORDINATE_LIMIT ** 2;

    let numberGenerator = seedrandom(this.coordinates);
    this.cellId = numberGenerator.int32();

    // 1. How many nodes in this cell?
    let numNodes = Math.floor(starDensity * (Cell.MIN_NODES +
      numberGenerator() * (Cell.MAX_NODES - Cell.MIN_NODES)));

    // 2. Where are those nodes?
    this.nodes = [];
    let locations = {};
    for (let i = 0; i < numNodes; i += 1) {
      // Ensure some basic separation of the nodes
      let newNode = new System(
        numberGenerator.int32(),
        this.cellId + '_' + i,
        this.coordinates.x + Math.round(20 * numberGenerator()) / 20,
        this.coordinates.y + Math.round(20 * numberGenerator()) / 20
      );
      let key = newNode.x + '_' + newNode.y;
      if (!locations[key]) {
        // Prevent nodes from being in the same place... even though the odds are small,
        // the galaxy is huge... so it's going to happen at some point, by definition
        this.nodes.push(newNode);
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
    this.links = Cell.VORONOI(this.nodes).links()
      .filter(d => this.discourageLongLinks(d, numberGenerator));
    return this.links;
  }
  generateRightLinks (rightCell) {
    if (this.rightLinks) {
      return this.rightLinks;
    }
    let numberGenerator = seedrandom(this.rightLinkSeed);
    let allNodes = this.nodes.concat(rightCell.nodes);
    this.rightLinks = Cell.VORONOI(allNodes).links()
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
    let allNodes = this.nodes.concat(bottomCell.nodes);
    this.bottomLinks = Cell.VORONOI(allNodes).links()
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

// For all nodes, we want precision to two decimal places past zero; Javascript can
// support about 13 digits with that precision
Cell.COORDINATE_LIMIT = 9999999999999;
Cell.VORONOI = d3.voronoi().x(d => d.x).y(d => d.y);
Cell.PERCENTAGE_OF_LINKS_TO_KEEP = 0.25;
Cell.MIN_NODES = 5;
Cell.MAX_NODES = 15;

export default Cell;
