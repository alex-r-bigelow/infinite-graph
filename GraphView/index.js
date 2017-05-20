import * as d3 from 'd3';
import View from '../lib/View';

import template from './template.svg';
import './style.scss';

import Universe from '../Universe';

class GraphView extends View {
  setup (d3el) {
    d3el.html(template);

    this.universe = new Universe();
    this.scaleFactor = 500;
    this.currentNode = this.universe.getANode();
  }

  convertToScreenSpace (point, bounds) {
    return {
      id: point.id,
      x: this.scaleFactor * (point.x - this.currentNode.x) + bounds.width / 2,
      y: this.scaleFactor * (point.y - this.currentNode.y) + bounds.height / 2
    };
  }

  assignKey (sourceNode, targetNode, existingAssignments) {
    let keyPriority = ['5', '4', '8', '6', '2', '7', '9', '1', '3', '0', '/', '+', '.', '-', '*'];
    let i = 0;
    while (true) {
      if (i >= keyPriority.length) {
        throw new Error('ran out of key bindings!');
      } else if (existingAssignments[keyPriority[i]]) {
        i += 1;
      } else {
        return keyPriority[i];
      }
    }
  }

  draw (d3el) {
    let containerBounds = d3el.node().getBoundingClientRect();
    let svg = d3el.select('svg');
    svg.attrs({
      width: containerBounds.width,
      height: containerBounds.height
    });

    let xRadius = containerBounds.width / (2 * this.scaleFactor);
    let yRadius = containerBounds.height / (2 * this.scaleFactor);

    let cellViewport = {
      left: Math.floor(this.currentNode.x - xRadius),
      top: Math.floor(this.currentNode.y - yRadius),
      right: Math.ceil(this.currentNode.x + xRadius),
      bottom: Math.ceil(this.currentNode.y + yRadius)
    };

    let graph = this.universe.getGraph(cellViewport);

    // Data cleaning: collect the immediate neighbors, and assign keys
    // based on their rough direction
    let neighborNodes = {};
    let keyAssignments = {};
    graph.links.forEach(d => {
      if (d.source.id === this.currentNode.id) {
        let target = {
          key: this.assignKey(d.source, d.target, keyAssignments),
          id: d.target.id,
          x: d.target.x,
          y: d.target.y
        };
        keyAssignments[target.key] = target.id;
        neighborNodes[target.id] = target;
      } else if (d.target.id === this.currentNode.id) {
        let target = {
          key: this.assignKey(d.target, d.source, keyAssignments),
          id: d.source.id,
          x: d.source.x,
          y: d.source.y
        };
        keyAssignments[target.key] = target.id;
        neighborNodes[target.id] = target;
      }
    });

    // Data cleaning: translate the node and link coordinates into screen space
    graph.nodes = graph.nodes.map(d => this.convertToScreenSpace(d, containerBounds));
    graph.links = graph.links.map(d => {
      return {
        source: this.convertToScreenSpace(d.source, containerBounds),
        target: this.convertToScreenSpace(d.target, containerBounds)
      };
    });

    // Draw the nodes
    let nodes = svg.select('#nodes').selectAll('g')
      .data(graph.nodes, d => d.id);

    nodes.exit().remove();

    let nodesEnter = nodes.enter().append('g');
    nodesEnter.append('circle');

    nodes = nodes.merge(nodesEnter);
    nodes.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')
      .classed('current', d => d.id === this.currentNode.id)
      .classed('neighbor', d => !!neighborNodes[d.id]);
    nodes.select('circle')
      .attr('r', d => {
        if (d.id === this.currentNode.id) {
          return 10;
        } else if (neighborNodes[d.id]) {
          return 7;
        } else {
          return 5;
        }
      });

    // Draw the links
    let links = svg.select('#links').selectAll('g')
      .data(graph.links, d => d.source.id + '_' + d.target.id);

    links.exit().remove();

    let linksEnter = links.enter().append('g');
    linksEnter.append('path');

    links = links.merge(linksEnter);
    links.classed('neighbor', d => d.source.id === this.currentNode.id || d.target.id === this.currentNode.id);
    links.select('path')
      .attr('d', d => {
        return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
      });

    // Draw the neighboring key bindings for travel
    let neighbors = d3el.select('#neighbors').selectAll('g')
      .data(d3.values(neighborNodes), d => d.id);

    neighbors.exit().remove();

    let neighborsEnter = neighbors.enter().append('g');
    neighborsEnter.append('circle')
      .attr('r', '0.75em');
    neighborsEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', '0.35em');

    neighbors = neighbors.merge(neighborsEnter);
    neighbors.attr('transform', d => {
      // We want to project the roughly 2em (24px?) beyond the node
      // (note that we did NOT convert these coordinates yet;
      // they're still in data space, not screen space)
      let dx = (d.x - this.currentNode.x);
      let dy = (d.y - this.currentNode.y);
      let x = this.scaleFactor * dx + containerBounds.width / 2;
      let y = this.scaleFactor * dy + containerBounds.height / 2;
      let theta = Math.atan2(dy, dx);
      x += 24 * Math.cos(theta);
      y += 24 * Math.sin(theta);
      return 'translate(' + x + ',' + y + ')';
    });
    neighbors.select('text').text(d => d.key);

    // Set up the interaction
    d3.select('body').on('keyup', () => {
      let typedLetter = d3.event.key;
      if (keyAssignments[typedLetter]) {
        let newNode = neighborNodes[keyAssignments[typedLetter]];
        this.currentNode = newNode;
        this.render();
      }
    });
  }
}
export default GraphView;
