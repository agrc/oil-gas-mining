require({
    packages: [
        'agrc',
        'app',
        'dijit',
        'dojo',
        'dojox',
        'esri',
        'ijit',
        'moment',
        'sherlock',
        {
            name: 'layer-selector',
            location: './layer-selector',
            main: 'LayerSelector'
        }, {
            name: 'spin',
            location: './spinjs',
            main: 'spin'
        }
    ],
    map: {
        sherlock: {
            'spinjs/spin': 'spin'
        }
    }
});
