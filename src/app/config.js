define([
    'dojo/has',
    'dojo/request/xhr'
], function (
    has,
    xhr
) {
    var config = window.AGRC = {
        // app: app.App
        //      global reference to App
        app: null,

        // version: String
        //      The version number.
        version: '2.1.1',

        // baseLayers: String[]
        //      The layers that show up in the layer-selector widget
        baseLayers: ['Hybrid', 'Lite', 'Terrain', 'Topo'],

        urls: {
            ogmMapService: '/ArcGIS/rest/services/OilGasMining/MapServer',
            plssVectorTilesService: '//tiles.arcgis.com/tiles/99lidPhWCzftIe9K/arcgis/rest/services/UtahPLSS/VectorTileServer',
            geometryService: '/ArcGIS/rest/services/Geometry/GeometryServer'
        },

        fieldNames: {
            ACCT_NUM: 'ACCT_NUM',
            API: 'API',
            COMPANY_NAME: 'COMPANY_NAME',
            CONF_FLAG: 'CONF_FLAG',
            COORDS_SURF_E: 'COORDS_SURF_E',
            COORDS_SURF_N: 'COORDS_SURF_N',
            COUNTY: 'COUNTY',
            DIRECTIONAL: 'DIRECTIONAL',
            ELEVATION: 'ELEVATION',
            FIELD_NAME: 'FIELD_NAME',
            FIELD_NUM: 'FIELD_NUM',
            GIS_STAT_TYPE: 'GIS_STAT_TYPE',
            LA_PA_DATE: 'LA_PA_DATE',
            LAT_SURF: 'LAT_SURF',
            LOCATION_SURF_WCR: 'LOCATION_SURF_WCR',
            LONG_SURF: 'LONG_SURF',
            MERIDIAN: 'MERIDIAN',
            MULTI_LEG_COUNT: 'MULTI_LEG_COUNT',
            OPERATOR: 'OPERATOR',
            ORIG_COMPL_DATE: 'ORIG_COMPL_DATE',
            ORIG_TD: 'ORIG_TD',
            QTR_QTR: 'QTR_QTR',
            RANGE: 'RANGE',
            SECTION: 'SECTION',
            TOTAL_CUM_GAS: 'TOTAL_CUM_GAS',
            TOTAL_CUM_OIL: 'TOTAL_CUM_OIL',
            TOTAL_CUM_WATER: 'TOTAL_CUM_WATER',
            TOWNSHIP: 'TOWNSHIP',
            WELL_NAME: 'WELL_NAME',
            WELL_STATUS_MAIN: 'WELL_STATUS_MAIN',
            WELL_TYPE_MAIN: 'WELL_TYPE_MAIN'
        }
    };

    if (has('agrc-build') === 'prod') {
        // mapserv.utah.gov
        config.apiKey = 'AGRC-1B07B497348512';
        config.quadWord = 'alfred-plaster-crystal-dexter';
    } else if (has('agrc-build') === 'stage') {
        // test.mapserv.utah.gov
        config.apiKey = 'AGRC-AC122FA9671436';
        config.quadWord = 'opera-event-little-pinball';
    } else {
        // localhost
        xhr(require.baseUrl + 'secrets.json', {
            handleAs: 'json',
            sync: true
        }).then(function (secrets) {
            config.quadWord = secrets.quadWord;
            config.apiKey = secrets.apiKey;
        }, function () {
            throw 'Error getting secrets!';
        });
    }

    return config;
});
