define([
    'dojo/has',
    'dojo/request/xhr'
], function (
    has,
    xhr
) {
    var config = {
        // errorLogger: ijit.modules.ErrorLogger
        errorLogger: null,

        // app: app.App
        //      global reference to App
        app: null,

        // version: String
        //      The version number.
        version: '2.0.0',

        // apiKey: String
        //      The api key used for services on api.mapserv.utah.gov
        apiKey: 'AGRC-63E1FF17767822', // localhost
        // apiKey: 'AGRC-A94B063C533889', // key for atlas.utah.gov

        urls: {
            ogmMapService: '/ArcGIS/rest/services/OilGasMining/MapServer',
            plssMapService: 'http://mapserv.utah.gov/ArcGIS/rest/services/UtahPLSS/MapServer',
            geometryService: 'http://mapserv.utah.gov/ArcGIS/rest/services/Geometry/GeometryServer'
        },

        fieldNames: {
            API: 'API',
            WELL_NAME: 'WELL_NAME',
            ACCT_NUM: 'ACCT_NUM',
            COMPANY_NAME: 'COMPANY_NAME',
            FIELD_NUM: 'FIELD_NUM',
            LOCATION_SURF_WCR: 'LOCATION_SURF_WCR',
            GIS_STAT_TYPE: 'GIS_STAT_TYPE',
            CONF_FLAG: 'CONF_FLAG',
            WELL_STATUS_MAIN: 'WELL_STATUS_MAIN',
            WELL_TYPE_MAIN: 'WELL_TYPE_MAIN',
            ORIG_COMPL_DATE: 'ORIG_COMPL_DATE',
            LA_PA_DATE: 'LA_PA_DATE',
            TOTAL_CUM_OIL: 'TOTAL_CUM_OIL',
            TOTAL_CUM_GAS: 'TOTAL_CUM_GAS',
            TOTAL_CUM_WATER: 'TOTAL_CUM_WATER',
            COORDS_SURF_N: 'COORDS_SURF_N',
            COORDS_SURF_E: 'COORDS_SURF_E',
            LAT_SURF: 'LAT_SURF',
            LONG_SURF: 'LONG_SURF',
            QTR_QTR: 'QTR_QTR',
            SECTION: 'SECTION',
            TOWNSHIP: 'TOWNSHIP',
            RANGE: 'RANGE',
            MERIDIAN: 'MERIDIAN',
            FIELD_NAME: 'FIELD_NAME',
            COUNTY: 'COUNTY',
            ELEVATION: 'ELEVATION',
            ORIG_TD: 'ORIG_TD',
            DIRECTIONAL: 'DIRECTIONAL',
            MULTI_LEG_COUNT: 'MULTI_LEG_COUNT'
        }
    };

    if (has('agrc-build') === 'prod') {
        // mapserv.utah.gov
        config.apiKey = 'AGRC-1B07B497348512';
        config.quadWord = '';
    } else if (has('agrc-build') === 'stage') {
        // test.mapserv.utah.gov
        config.apiKey = 'AGRC-AC122FA9671436';
        config.quadWord = '';
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
