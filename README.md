This contains the webpack boilerplate for my personal projects, but feel free to appropriate any of this for stuff that you do.

Each branch in this repo has a different level of bare-bone-ness; listed from simple to complex: `master`, `extra-goodies`, `mure-boilerplate`.

Magic going on in here:
  - This should feel at least a little like regular web development, where we can pretend that an `index.html` file is the entry point. The javascript file (`index.js`) gets included in the HTML body automagically without any special tags.
  - There's an `npm prepublish` step that creates a custom d3.js v4 bundle (included modules are defined in `lib/d3.bundle.js`); see [this guide](http://alex-r-bigelow.github.io/#D3andBabel) for background as to what's going on here.
  - There's a [hack](http://alex-r-bigelow.github.io/#WebpackSVGTemplates) that imports SVG as an image or a string, depending on whether the filename is `template.svg`.
  - I've added my own, stupidly simple MVC framework:
    - The basic idea is you extend `lib/Model` and `lib/View`; you can assign and listen to events on each if that's how you roll.
    - Views should implement a `setup` and `draw` function, but they shouldn't be called directly. Instead, the view's `render` function should be called.
      - At least the first time `render(d3element)` is called, it should be passed a d3-selected DOM container as the parameter (it can be a `div`, `span`, `svg`, whatever). Thereafter, the parameter is optional.
      - You don't need to worry about calling `render` too frequently:
        - `render` triggers a `setup` only once when the view is given a new DOM element to render to (you *can* give a view a new element at any point, and `setup` will be called again if it's actually a different element).
        - `draw` is debounced, so only the last `render` call will trigger a `draw` (you can adjust the waiting period by changing the view's `debounceWait` property).
  - There's a tool for recoloring images with CSS; just import `lib/recolorImages`, and you can change any image's color like this: `filter: url(#recolorImageToFFFFFF)`. And, of course, I've added a SASS rule, so you can also get this effect with named colors in `style/colors.scss`: `filter: imgColorFilter($someColor)` will generate the `url(#recolorImageToFFFFFF)` syntax in the resulting CSS file.
  - Note that you may actually have to import the `recolorImages()` function and call it if you add stylesheets after you import `recolorImages`

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
