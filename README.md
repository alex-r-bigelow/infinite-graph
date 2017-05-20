Silly experiment creating a browsable, ~~infinite~~ extremely large, procedurally-generated node-link diagram.

There are roughly 10 quadrillion nodes in this graph (10<sup>16</sup>). For comparison, the largest observed galaxy so far, [IC 1101](https://en.wikipedia.org/wiki/IC_1101), has on the order of 100 trillion (10<sup>14</sup>) stars. The Milky Way only has 100 - 400 billion (~10<sup>11</sup>) stars.

Play with it [here](https://alex-r-bigelow.github.io/infinite-graph).

Setup:
======
    npm install

Development:
============
    webpack-dev-server --progress

Deployment:
===========
    webpack
Bundles everything into `docs/` for use with Github pages
