import * as d3 from 'd3';
import seedrandom from 'seedrandom';

window.d3 = d3;
window.seedrandom = seedrandom;

import GraphView from './GraphView';

import './style/colors.scss';
import './style/layout.scss';
// note that we import this *after* our stylesheets; if we didn't, we'd need to
// import recolorImages from './lib/recolorImages'; and call recolorImages()
// after all the stylesheets were loaded
import './lib/recolorImages';

let myView;

function resize () {
  myView.render();
}

function setup () {
  // Example of a view
  myView = new GraphView();
  myView.render(d3.select('#container'));
}
window.onload = setup;
window.onresize = resize;
