import Model from '../lib/Model';
import Cell from '../Cell';

class Universe extends Model {
  constructor () {
    super();

    this.currentCells = {};
  }

  getGraph (cellViewport) {
    // Throw away cells that are now out of the viewport
    Object.keys(this.currentCells).forEach(key => {
      let cell = this.currentCells[key];
      if (cell.coordinates.x < cellViewport.left ||
          cell.coordinates.x > cellViewport.right ||
          cell.coordinates.y < cellViewport.top ||
          cell.coordinates.y > cellViewport.bottom) {
        delete this.currentCells[key];
      }
    });

    // Construct the graph to return to the user, adding
    // any new cells along the way
    let graph = {
      nodes: [],
      links: []
    };

    for (let x = cellViewport.left; x <= cellViewport.right; x += 1) {
      for (let y = cellViewport.top; y <= cellViewport.bottom; y += 1) {
        let key = x + '_' + y;
        if (!this.currentCells[key]) {
          this.currentCells[key] = new Cell({x, y});
        }
        let cell = this.currentCells[key];
        graph.nodes = graph.nodes.concat(cell.nodes);
        graph.links = graph.links.concat(cell.generateInternalLinks());
        if (x > cellViewport.left) {
          let leftLinks = this.currentCells[(x - 1) + '_' + y].generateRightLinks(cell);
          graph.links = graph.links.concat(leftLinks);
        }
        if (y > cellViewport.top) {
          let topLinks = this.currentCells[x + '_' + (y - 1)].generateBottomLinks(cell);
          graph.links = graph.links.concat(topLinks);
        }
      }
    }

    return graph;
  }

  getANode (roughDistance, roughAngle) {
    roughDistance = roughDistance || 0;
    roughAngle = roughAngle || Math.random() * 2 * Math.PI;
    // get the first node in the cell that closest fits these parameters

    let cell;
    while (true) {
      cell = new Cell({
        x: Math.round(roughDistance * Math.cos(roughAngle)),
        y: Math.round(roughDistance * Math.sin(roughAngle))
      });
      if (cell.nodes.length > 0) {
        return cell.nodes[0];
      } else {
        console.log('Hit an empty cell! Reducing distance by a factor of 0.9...');
        roughDistance *= 0.9;
      }
    }
  }
}
export default Universe;
