import Model from '../lib/Model';
import Cell from './Cell.js';

class Universe extends Model {
  constructor () {
    super();

    this.activeCells = {};
    this.cellCleaning;
  }

  scheduleCellCleaning () {
    window.clearTimeout(this.cellCleaning);
    this.cellCleaning = window.setTimeout(() => {
      let expirationTime = Date.now() - Universe.CELL_LIFE;
      Object.keys(this.activeCells).forEach(cellId => {
        if (this.activeCells.lastTouched <= expirationTime) {
          delete this.activeCells[cellId];
        }
      });
    }, Universe.CELL_LIFE);
  }

  getGraph (cellViewport) {
    // Construct the graph to return to the user, adding
    // any new cells along the way
    let graph = {
      systems: [],
      links: []
    };

    for (let x = cellViewport.left; x <= cellViewport.right; x += 1) {
      for (let y = cellViewport.top; y <= cellViewport.bottom; y += 1) {
        let id = x + ',' + y;
        if (!this.activeCells[id]) {
          this.activeCells[id] = new Cell({x, y});
        }
        let cell = this.activeCells[id];
        graph.systems = graph.systems.concat(cell.systems);
        graph.links = graph.links.concat(cell.internalLinks());
        if (x > cellViewport.left) {
          let leftLinks = this.activeCells[(x - 1) + ',' + y].rightLinks(cell);
          graph.links = graph.links.concat(leftLinks);
        }
        if (y > cellViewport.top) {
          let topLinks = this.activeCells[x + ',' + (y - 1)].bottomLinks(cell);
          graph.links = graph.links.concat(topLinks);
        }
      }
    }

    this.scheduleCellCleaning();

    return graph;
  }

  getSystem (systemId) {
    let parameters = systemId.split(':');
    if (!this.activeCells[parameters[0]]) {
      let coordinates = parameters[0].split(',').map(d => parseInt(d));
      if (parameters.length !== 2 || isNaN(coordinates[0]) || isNaN(coordinates[1])) {
        throw new Error('Bad System Id');
      }
      this.activeCells[parameters[0]] = new Cell({
        x: coordinates[0],
        y: coordinates[1]
      });
    }
    let systemIndex = parseInt(parameters[1]);
    if (isNaN(systemIndex) || this.activeCells[parameters[0]].systems.length >= systemIndex) {
      throw new Error('Bad System Id');
    }
    return this.activeCells[parameters[0]].systems[systemIndex];
  }

  getASystem (roughDistance, roughAngle) {
    roughDistance = roughDistance || 0;
    roughAngle = roughAngle || Math.random() * 2 * Math.PI;
    // get the first system in the cell that closest fits these parameters

    let cell, system;
    while (!system) {
      let coordinates = {
        x: Math.round(roughDistance * Math.cos(roughAngle)),
        y: Math.round(roughDistance * Math.sin(roughAngle))
      };
      let id = coordinates.x + ',' + coordinates.y;
      if (!this.activeCells[id]) {
        this.activeCells[id] = new Cell(coordinates);
      }
      cell = this.activeCells[id];
      if (cell.systems.length > 0) {
        system = cell.systems[0];
      } else {
        console.log('Cell ' + coordinates.id + 'is empty; reducing distance of ' +
                    roughDistance + ' by a factor of 0.9...');
        roughDistance *= 0.9;
      }
    }

    this.scheduleCellCleaning();
    return system;
  }
}

// Keep cells around in memory for about 30 seconds since the last time they were used
Universe.CELL_LIFE = 30000;

export default Universe;
