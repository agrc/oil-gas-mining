/*eslint-disable no-unused-vars*/
var profile = {
    basePath: '../src',
    action: 'release',
    cssOptimize: 'comments',
    mini: true,
    optimize: 'closure',
    layerOptimize: 'closure',
    stripConsole: 'all',
    selectorEngine: 'acme',
    layers: {
        'dojo/dojo': {
            include: [
                'dojo/i18n',
                'dojo/domReady',
                'app/main',
                'app/run',
                'esri/dijit/Attribution'
            ],
            customBase: true,
            boot: true
        }
    },
    staticHasFeatures: {
        'dojo-trace-api': 0,
        'dojo-log-api': 0,
        'dojo-publish-privates': 0,
        'dojo-sync-loader': 0,
        'dojo-xhr-factory': 0,
        'dojo-test-sniff': 0
    },
    packages: [{
        name: 'dojo',
        location: 'dojo'
    },{
        name: 'dijit',
        location: 'dijit'
    },{
        name: 'dojox',
        location: 'dojox'
    },{
        name: 'esri',
        location: 'esri',
        resourceTags: {
            amd: function (filename, mid) {
                return (/.*\.js/).test(filename);
            }
        }
    }],
    plugins: {
        'agrc/modules/JSONLoader': 'agrc/modules/JSONLoaderBuildPlugin'
    }
};
