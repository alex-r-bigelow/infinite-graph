import * as d3 from 'd3';
import View from '../lib/View';

import template from './template.svg';
import './style.scss';

import Universe from '../Universe';

class GraphView extends View {
  setup (d3el) {
    d3el.html(template);

    this.universe = new Universe();
    this.scaleFactor = 750;
    this.currentNode = this.universe.getANode();
  }

  convertToScreenSpace (point, bounds) {
    return {
      x: (this.scaleFactor * (point.x - this.currentNode.x) + bounds.width) / 2,
      y: (this.scaleFactor * (point.y - this.currentNode.y) + bounds.height) / 2
    };
  }

  draw (d3el) {
    let self = this;

    let containerBounds = d3el.node().getBoundingClientRect();
    let svg = d3el.select('svg');
    svg.attrs({
      width: containerBounds.width,
      height: containerBounds.height
    });

    this.origin = this.convertToScreenSpace(this.currentNode, containerBounds);  // may be slightly off 0,0

    let xRadius = containerBounds.width / (2 * this.scaleFactor);
    let yRadius = containerBounds.height / (2 * this.scaleFactor);

    let cellViewport = {
      left: Math.floor(this.currentNode.x - xRadius) - 1,
      top: Math.floor(this.currentNode.y - yRadius) - 1,
      right: Math.ceil(this.currentNode.x + xRadius) + 1,
      bottom: Math.ceil(this.currentNode.y + yRadius) + 1
    };

    let graph = this.universe.getGraph(cellViewport);
    // Translate coordinates into screen space
    graph.nodes = graph.nodes.map(d => this.convertToScreenSpace(d, containerBounds));
    graph.links = graph.links.map(d => {
      return {
        source: this.convertToScreenSpace(d.source, containerBounds),
        target: this.convertToScreenSpace(d.target, containerBounds)
      };
    });

    // Draw the nodes
    let nodes = svg.select('#nodes').selectAll('g')
      .data(graph.nodes, d => d.x + '_' + d.y);

    nodes.exit().remove();

    let nodesEnter = nodes.enter().append('g');
    nodesEnter.append('circle');

    nodes = nodes.merge(nodesEnter);
    nodes.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
    nodes.select('circle')
      .attr('r', d => d.x === this.origin.x && d.y === this.origin.y ? 10 : 5)
      .classed('current', d => d.x === this.origin.x && d.y === this.origin.y);

    // Draw the links
    let links = svg.select('#links').selectAll('g')
      .data(graph.links, d => d.source.x + '_' + d.source.y + '_' + d.target.x + '_' + d.target.y);

    links.exit().remove();

    let linksEnter = links.enter().append('g');
    linksEnter.append('path');

    links = links.merge(linksEnter);
    links.select('path')
      .attr('d', d => {
        return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
      });
    links.select('text').remove();

    // Set up interaction
    let immediateLinks = links.filter(d => {
      return (d.source.x === this.origin.x && d.source.y === this.origin.y) ||
        (d.target.x === this.origin.x && d.target.y === this.origin.y);
    });

    let letters = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '-', '*', '/'];
    let keybindings = {};

    immediateLinks.append('text')
      .text(function (d, i) {
        // TODO: come up with a better way of selecting keys, based on the direction of the link
        this.targetNode = d.source.x === self.origin.y && d.source.y === self.origin.y ? d.target : d.source;
        keybindings[letters[i]] = this.targetNode;
        return letters[i];
      })
      .attr('x', function () { return this.targetNode.x; })
      .attr('y', function () { return this.targetNode.y; });
    d3el.on('keyup', () => {
      let typedLetter = d3.event.key;
      if (keybindings[typedLetter]) {
        this.currentNode = keybindings[typedLetter];
        this.render();
      }
    });
  }
}
export default GraphView;
