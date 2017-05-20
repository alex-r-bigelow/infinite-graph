import * as d3 from 'd3';
import View from '../lib/View';

import template from './template.svg';
import './style.scss';

import Universe from '../Universe';

class GraphView extends View {
  setup (d3el) {
    d3el.html(template);

    this.universe = new Universe();
    this.scaleFactor = 300;
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
    let t1 = d3.transition()
      .duration(250);
    let t2 = t1.transition()
      .duration(250);
    let t3 = t2.transition()
      .duration(250);

    let containerBounds = d3el.node().getBoundingClientRect();
    let svg = d3el.select('svg');
    svg.attrs({
      width: containerBounds.width,
      height: containerBounds.height
    });

    let xRadius = containerBounds.width / (2 * this.scaleFactor);
    let yRadius = containerBounds.height / (2 * this.scaleFactor);

    let cellViewport = {
      left: Math.floor(this.currentNode.x - xRadius - 0.5),
      top: Math.floor(this.currentNode.y - yRadius - 0.5),
      right: Math.ceil(this.currentNode.x + xRadius + 0.5),
      bottom: Math.ceil(this.currentNode.y + yRadius + 0.5)
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

    let nodesEnter = nodes.enter().append('g')
      .attr('opacity', 0)
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
    nodesEnter.append('circle');

    nodes = nodes.merge(nodesEnter);
    nodes.classed('current', d => d.id === this.currentNode.id)
      .classed('neighbor', d => !!neighborNodes[d.id])
      .transition(t2)
        .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
    nodes.transition(t3)
      .attr('opacity', 1);
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
    linksEnter.append('path')
      .attr('opacity', 0)
      .attr('d', d => {
        return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
      });

    links = links.merge(linksEnter);
    links.classed('neighbor', d => d.source.id === this.currentNode.id || d.target.id === this.currentNode.id);
    links.select('path')
      .transition(t2)
        .attr('d', d => {
          return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
        });
    links.select('path')
      .transition(t3)
        .attr('opacity', 1);

    // Draw the neighboring key bindings for travel
    let neighbors = d3el.select('#neighbors').selectAll('g')
      .data(d3.values(neighborNodes), d => d.id);

    let neighborsExit = neighbors.exit();

    let neighborsEnter = neighbors.enter().append('g')
      .attr('opacity', 0);
    neighborsEnter.append('circle')
      .attr('r', '0.75em');
    neighborsEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', '0.35em');

    neighbors = neighbors.merge(neighborsEnter);

    // In the first transition, hide everything to do with navigation
    neighborsExit.transition(t1)
      .attr('opacity', 0);
    neighbors.transition(t1)
      .attr('opacity', 0);

    // While things are hidden in the second transition, move / update stuff
    neighborsExit.transition(t2).remove();

    neighbors.transition(t2)
      .attr('transform', d => {
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
    neighbors.select('text')
      .transition(t2)
      .text(d => d.key);

    // Finally in the third transition, show everything again
    neighbors.transition(t3)
      .attr('opacity', 1);

    // Set up the interaction
    d3.select('body').on('keyup', () => {
      let typedLetter = d3.event.key;
      if (keyAssignments[typedLetter]) {
        let newNode = neighborNodes[keyAssignments[typedLetter]];
        this.currentNode = newNode;
        this.render();
      } else if (typedLetter === 'j') {
        let theta = Math.atan2(this.currentNode.y, this.currentNode.x);
        let distance = Math.sqrt(this.currentNode.x ** 2 + this.currentNode.y ** 2);
        let current = distance + ',' + theta;
        let newDirection = window.prompt('Jump to approximately (distance from center, angle in radians):', current);
        if (newDirection) {
          newDirection = newDirection.split(',').map(d => parseFloat(d));
          this.currentNode = this.universe.getANode(newDirection[0], newDirection[1]);
          this.render();
        }
      }
    });
  }
}
export default GraphView;
