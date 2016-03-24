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
