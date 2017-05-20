import * as d3 from 'd3';

function recolorImages () {
  // Extract all filters that look like url(#recolorImageToFFFFFF) from the
  // stylesheets that have been loaded in the document
  let colorScheme = Array.from(document.styleSheets).reduce((acc, styleSheet) => {
    Array.from(styleSheet.cssRules).forEach(rule => {
      if (rule.style.filter) {
        let hexCode = /#recolorImageTo(......)/.exec(rule.style.filter);
        if (hexCode) {
          acc.add(hexCode[1]);
        }
      }
    });
    return acc;
  }, new Set());

  if (d3.select('#recolorImageFilters').size() === 0) {
    let svg = d3.select('body').append('svg')
      .attr('id', 'recolorImageFilters')
      .attr('width', 0)
      .attr('height', 0);
    svg.append('defs');
  }

  // Generate SVG filters that can recolor images to whatever
  // color we need. Styles simply do something like
  // filter: url(#recolorImageToFFFFFF)
  let recolorFilters = d3.select('#recolorImageFilters')
    .select('defs')
    .selectAll('filter.recolor')
    .data(Array.from(colorScheme), d => d);
  let recolorFiltersEnter = recolorFilters.enter().append('filter')
    .attr('class', 'recolor')
    .attr('id', d => 'recolorImageTo' + d);
  let cmpTransferEnter = recolorFiltersEnter.append('feComponentTransfer')
    .attr('in', 'SourceAlpha')
    .attr('result', 'color');
  cmpTransferEnter.append('feFuncR')
    .attr('type', 'linear')
    .attr('slope', 0)
    .attr('intercept', d => {
      let hexvalue = d.slice(0, 2);
      return Math.pow(parseInt(hexvalue, 16) / 255, 2);
    });
  cmpTransferEnter.append('feFuncG')
    .attr('type', 'linear')
    .attr('slope', 0)
    .attr('intercept', d => {
      let hexvalue = d.slice(2, 4);
      return Math.pow(parseInt(hexvalue, 16) / 255, 2);
    });
  cmpTransferEnter.append('feFuncB')
    .attr('type', 'linear')
    .attr('slope', 0)
    .attr('intercept', d => {
      let hexvalue = d.slice(4, 6);
      return Math.pow(parseInt(hexvalue, 16) / 255, 2);
    });
}

recolorImages();
export default recolorImages;
