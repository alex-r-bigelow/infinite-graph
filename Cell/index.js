import * as d3 from 'd3';
import seedrandom from 'seedrandom';

class Cell {
  constructor (coordinates) {
    this.coordinates = coordinates;

    let numberGenerator = seedrandom(this.coordinates);

    // 1. How many nodes in this cell?
    let numNodes = Math.floor(numberGenerator() * (Cell.MAX_NODES - Cell.MIN_NODES)) + Cell.MIN_NODES;

    // 2. Where are those nodes?
    this.nodes = [];
    let keys = {};
    for (let i = 0; i < numNodes; i += 1) {
      // Ensure some basic separation of the nodes
      let newNode = {
        x: this.coordinates.x + Math.round(20 * numberGenerator()) / 20,
        y: this.coordinates.y + Math.round(20 * numberGenerator()) / 20
      };
      let key = newNode.x + '_' + newNode.y;
      if (keys[key]) {
        // Prevent duplicate nodes... even though the odds are small,
        // this is an infinite universe... so it's going to happen at
        // some point, by definition
        i -= 1;
      } else {
        this.nodes.push(newNode);
      }
    }

    // We need to generate three additional seeds that can be (reproducably) used
    // later to generate internal links, links to the right, and links to the bottom
    this.internalLinkSeed = numberGenerator();
    this.rightLinkSeed = numberGenerator();
    this.bottomLinkSeed = numberGenerator();
  }
  generateInternalLinks () {
    if (this.links) {
      return this.links;
    }
    let numberGenerator = seedrandom(this.internalLinkSeed);
    this.links = Cell.VORONOI(this.nodes).links()
      .filter(d => numberGenerator() <= 1 - Math.abs(d.target.x - d.source.x) - Math.abs(d.target.y - d.source.y));
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
          // Discourage long links
          return numberGenerator() <= 1 - Math.abs(d.target.x - d.source.x) - Math.abs(d.target.y - d.source.y);
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
          // Discourage long links
          return numberGenerator() <= 1 - Math.abs(d.target.x - d.source.x) - Math.abs(d.target.y - d.source.y);
        } else {
          return false;
        }
      });
    return this.bottomLinks;
  }
}

Cell.VORONOI = d3.voronoi().x(d => d.x).y(d => d.y);
Cell.PERCENTAGE_OF_LINKS_TO_KEEP = 0.25;
Cell.MIN_NODES = 5;
Cell.MAX_NODES = 15;

export default Cell;
