/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *  express-react-views(0.10.2)
 */

var React = require('react');
var ReactDOMServer = require('react-dom/server');
var beautifyHTML = require('js-beautify').html;
var assign = require('object-assign');
var _escaperegexp = require('lodash.escaperegexp');

var DEFAULT_OPTIONS = {
  doctype: '<!DOCTYPE html>',
  beautify: false,
  transformViews: true,
  babel: {
    presets: [
      'react',
      'es2015',
    ],
  },
};

function createEngine(engineOptions) {
  var registered = false;
  var moduleDetectRegEx;

  engineOptions = assign({}, DEFAULT_OPTIONS, engineOptions || {});


  function renderFile(filename, options, cb) {
    // Defer babel registration until the first request so we can grab the view path.
    if (!moduleDetectRegEx) {
      // Path could contain regexp characters so escape it first.
      moduleDetectRegEx = new RegExp('^' + _escaperegexp(options.settings.views));
    }

    if (engineOptions.transformViews && !registered) {
      // Passing a RegExp to Babel results in an issue on Windows so we'll just
      // pass the view path.
      require('babel-register')(
        assign({only: options.settings.views}, engineOptions.babel)
      );
      registered = true;
    }

    console.log(options);
    try {
      var markup = engineOptions.doctype;
      var component = require(filename);


      // Transpiled ES6 may export components as { default: Component }
      component = component.default || component;
      markup += ReactDOMServer.renderToString(
        React.createElement(component, options)
      );

    } catch (e) {
      return cb(e);
    } finally {
      if (options.settings.env === 'development') {
        // Remove all files from the module cache that are in the view folder.

        // 清除当前页面的缓存，当修改之后，就可以更新
        Object.keys(require.cache).forEach(function(module) {

          if (moduleDetectRegEx.test(require.cache[module].filename)) {

            delete require.cache[module];
          }
        });
      }
    }

    if (engineOptions.beautify) {
      // NOTE: This will screw up some things where whitespace is important, and be
      // subtly different than prod.
      markup = beautifyHTML(markup);
    }
    cb(null, markup);
  }

  return renderFile
  /*function(filename, options, cb) {
    return cb('<div>fdsafdsafdsafdsfffffffffafdsafdsa</div>','<div>fdsafdsafdsafdsfffffffffafdsafdsa</div>')
  };*/
}

exports.createEngine = createEngine;
