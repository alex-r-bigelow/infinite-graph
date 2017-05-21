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
        let cell = this.getCell(x, y);
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

  getSystemNeighbors (systemId) {
    // To be absolutely sure we've got all the connections, we need to look up
    // each neighboring cell
    let parsedId = this.parseSystemId(systemId);
    let mainCell = this.getCell(Math.floor(parsedId.x), Math.floor(parsedId.y));
    let leftCell = this.getCell(mainCell.x - 1, mainCell.y);
    let topCell = this.getCell(mainCell.x, mainCell.y - 1);
    let rightCell = this.getCell(mainCell.x + 1, mainCell.y);
    let bottomCell = this.getCell(mainCell.x, mainCell.y + 1);

    let neighborIds = [];

    mainCell.internalLinks()
      .concat(leftCell.rightLinks(mainCell))
      .concat(mainCell.rightLinks(rightCell))
      .concat(topCell.bottomLinks(mainCell))
      .concat(mainCell.bottomLinks(bottomCell))
      .forEach(d => {
        if (d.source.id === systemId) {
          neighborIds.push(d.target.id);
        } else if (d.target.id === systemId) {
          neighborIds.push(d.source.id);
        }
      });

    this.scheduleCellCleaning();

    return neighborIds;
  }

  parseSystemId (systemId) {
    let temp = systemId.split(':');
    let coords = temp[0].split(',');
    return {
      x: parseInt(coords[0]),
      y: parseInt(coords[1]),
      system: parseInt(temp[1])
    };
  }

  getCell (x, y) {
    let id = x + ',' + y;
    if (!this.activeCells[id]) {
      this.activeCells[id] = new Cell(x, y);
    }
    return this.activeCells[id];
  }

  getSystem (systemId) {
    let parsedId = this.parseSystemId(systemId);
    if (isNaN(parsedId.x) || isNaN(parsedId.y) || isNaN(parsedId.system)) {
      throw new Error('Bad Cell Id: ' + systemId);
    }
    let cell = this.getCell(parsedId.x, parsedId.y);
    if (parsedId.system >= cell.systems.length) {
      throw new Error('Bad System Number: ' + systemId);
    }
    return cell.systems[parsedId.system];
  }

  getASystem (roughDistance, roughAngle) {
    roughDistance = roughDistance || 0;
    if (roughAngle !== 0) {
      roughAngle = roughAngle || Math.random() * 2 * Math.PI;
    }
    // get the first system in the cell that closest fits these parameters

    let cell, system;
    while (!system) {
      let x = Math.round(roughDistance * Math.cos(roughAngle));
      let y = Math.round(roughDistance * Math.sin(roughAngle));
      cell = this.getCell(x, y);
      if (cell.systems.length > 0) {
        system = cell.systems[0];
      } else {
        console.log('Cell ' + cell.id + ' is empty; reducing distance of ' +
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
