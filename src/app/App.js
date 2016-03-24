define([
    'agrc/widgets/locate/FindAddress',
    'agrc/widgets/locate/TRSsearch',
    'agrc/widgets/map/BaseMap',
    'agrc/widgets/map/BaseMapSelector',

    'app/config',

    'dijit/registry',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/aspect',
    'dojo/dom',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/on',
    'dojo/query',
    'dojo/text!app/templates/App.html',
    'dojo/topic',
    'dojo/_base/array',
    'dojo/_base/Color',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/dijit/Legend',
    'esri/geometry/Extent',
    'esri/geometry/Point',
    'esri/graphic',
    'esri/layers/ArcGISDynamicMapServiceLayer',
    'esri/layers/ArcGISTiledMapServiceLayer',
    'esri/SpatialReference',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/tasks/FindParameters',
    'esri/tasks/GeometryService',
    'esri/tasks/IdentifyParameters',
    'esri/tasks/IdentifyTask',
    'esri/tasks/query',
    'esri/tasks/QueryTask',

    'sherlock/providers/MapService',
    'sherlock/providers/WebAPI',
    'sherlock/Sherlock',

    'dijit/Dialog',
    'dijit/form/DropDownButton',
    'dijit/layout/BorderContainer',
    'dijit/layout/ContentPane',
    'dijit/layout/TabContainer',
    'dijit/Menu',
    'dijit/MenuItem',
    'dijit/ProgressBar',
    'dijit/Toolbar'
], function (
    FindAddress,
    TRSsearch,
    BaseMap,
    BaseMapSelector,

    config,

    registry,
    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    aspect,
    dom,
    domClass,
    domConstruct,
    on,
    query,
    template,
    topic,
    array,
    Color,
    declare,
    lang,

    Legend,
    Extent,
    Point,
    Graphic,
    ArcGISDynamicMapServiceLayer,
    ArcGISTiledMapServiceLayer,
    SpatialReference,
    SimpleFillSymbol,
    SimpleLineSymbol,
    SimpleMarkerSymbol,
    FindParameters,
    GeometryService,
    IdentifyParameters,
    IdentifyTask,
    Query,
    QueryTask,

    MapService,
    WebAPI,
    Sherlock
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // summary:
        //      The main widget for the app

        widgetsInTemplate: true,
        templateString: template,
        baseClass: 'app',

        // map: agrc.widgets.map.Basemap
        map: null,

        // currentLayerDef: String
        //      used to keep track of the current filter
        currentLayerDef: '1 = 1',

        // ogmLayers: ArcGISDynamicMapServiceLayer
        ogmLayers: null,

        // plssLayer: ArcGISTiledMapServiceLayer
        plssLayer: null,

        constructor: function () {
            // summary:
            //      first function to fire after page loads
            console.log('app.App:constructor', arguments);

            // config.errorLogger = new ErrorLogger({appName: 'ProjectName'});

            config.app = this;

            this.inherited(arguments);
        },
        postCreate: function () {
            // summary:
            //      Fires when
            console.log('app.App:postCreate', arguments);

            // set version number
            this.version.innerHTML = config.version;

            this.inherited(arguments);
        },
        wireEvents: function () {
            // summary:
            //
            console.log(this.declaredClass + '::wireEvents', arguments);

            query('.dialog-btn').forEach(function (node) {
                var dialog = registry.byId(node.id + 'Dialog');
                on(node, 'click', lang.hitch(dialog, dialog.show));
            });
        },
        startup: function () {
            // summary:
            //      Fires after postCreate when all of the child widgets are finished laying out.
            console.log('app.App:startup', arguments);

            // call this before creating the map to make sure that the map container is
            // the correct size
            this.inherited(arguments);

            this.initMap();

            var trs = new TRSsearch({
                map: this.map,
                AGRCwebServiceUserName: 'agrc-oilgasmining',
                buttonText: 'Zoom'
            }, 'TRS');
            aspect.after(trs, 'zoom', function () {
                registry.byId('zoomTSHDialog').hide();
            });

            var provider = new WebAPI(
                config.apiKey,
                'SGID10.BOUNDARIES.Counties',
                'NAME'
            );
            var county = new Sherlock({
                provider: provider,
                map: this.map,
                label: 'Counties',
                maxResultsToDisplay: 5
            }, 'findCounty');
            aspect.after(county, 'onZoomed', function () {
                registry.byId('zoomCountyDialog').hide();
            });

            var apiProvider = new MapService(
                config.urls.ogmMapService + '/0',
                config.fieldNames.API
            );
            var api = new Sherlock({
                provider: apiProvider,
                promptMessage: 'Please type an API...',
                map: this.map,
                maxResultsToDisplay: 8
            }, 'magic-zoom-api');
            api.startup();
            aspect.after(api, 'onZoomed', function () {
                registry.byId('zoomWellApiDialog').hide();
            });

            var wellProvider = new MapService(
                config.urls.ogmMapService + '/0',
                config.fieldNames.WELL_NAME
            );
            var name = new Sherlock({
                provider: wellProvider,
                promptMessage: 'Please type a name...',
                map: this.map,
                maxResultsToDisplay: 8
            }, 'magic-zoom-name');
            name.startup();
            aspect.after(name, 'onZoomed', function () {
                registry.byId('zoomWellNameDialog').hide();
            });

            var operProvider = new MapService(
                config.urls.ogmMapService + '/0',
                config.fieldNames.COMPANY_NAME
            );
            var oper = new Sherlock({
                provider: operProvider,
                promptMessage: 'Please begin typing an Operator...',
                map: this.map,
                maxResultsToDisplay: 8
            }, 'magic-zoom-oper');
            oper.startup();
            aspect.after(oper, 'onZoomed', function () {
                registry.byId('zoomWellOperDialog').hide();
            });

            var foperProvider = new MapService(
                config.urls.ogmMapService + '/8',
                config.fieldNames.OPERATOR
            );
            var foper = new Sherlock({
                provider: foperProvider,
                promptMessage: 'Please begin typing an Operator...',
                map: this.map,
                maxResultsToDisplay: 8
            }, 'magic-zoom-foper');
            oper.startup();
            aspect.after(foper, 'onZoomed', function () {
                registry.byId('zoomFieldOperDialog').hide();
            });

            this.wireEvents();

            this.setUpTasks();
        },
        setUpTasks: function () {
            // summary:
            //      description
            console.log(this.declaredClass + '::setUpTasks', arguments);

            var fieldNames = config.fieldNames;

            // query task used for download
            this.pointQueryTask = new QueryTask(config.urls.ogmMapService + '/0');
            this.pointQuery = new Query();
            this.pointQuery.returnGeometry = false;
            this.pointQuery.outFields = [fieldNames.WELL_NAME, fieldNames.API, fieldNames.ACCT_NUM, fieldNames.COMPANY_NAME, fieldNames.FIELD_NUM, fieldNames.LOCATION_SURF_WCR, fieldNames.GIS_STAT_TYPE];
            this.pointQuery.spatialRelationship = Query.SPATIAL_REL_CONTAINS;

            // identify
            this.identifyTask = new IdentifyTask(config.urls.ogmMapService);
            this.identifyParams = new IdentifyParameters();
            this.identifyParams.tolerance = 3;
            this.identifyParams.returnGeometry = true;
            this.identifyParams.layerIds = [0, 6, 8]; //wells, fields, units
            this.identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_TOP;
            this.identifyParams.width = this.map.width;
            this.identifyParams.height = this.map.height;
            this.identifyParams.layerDefinitions = ['1 = 1'];

            this.symbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([255, 0, 0, 0.3]), 2), new Color([255, 255, 0, 0.5]));


            // zoom to field
            this.fieldQueryTask = new QueryTask(config.urls.ogmMapService + '/6');
            this.fieldQueryParams = new Query();
            this.fieldQueryParams.returnGeometry = true;

            this.gsvc = new GeometryService(config.urls.geometryService);
        },
        initMap: function () {
            // summary:
            //      Sets up the map
            console.log('app.App:initMap', arguments);

            this.map = new BaseMap(this.mapDiv, {
                useDefaultBaseMap: false,
                router: true
            });

            var s;

            s = new BaseMapSelector({
                map: this.map,
                id: 'claro',
                position: 'TR',
                defaultThemeLabel: 'Hybrid'
            });

            var that = this;
            topic.subscribe('agrc.widgets.map.BaseMapSelector.onChangeTheme_' + s.id, function () {
                // find tiled layer and set checkbox to match visibility
                array.forEach(that.map.layerIds, function (id) {
                    var lyr = that.map.getLayer(id);
                    if (lyr.tileInfo && lyr.id !== 'PLSS') {
                        dom.byId('tiled-checkbox').checked = lyr.visible;
                        dom.byId('basemap-name').innerHTML = lyr.id;
                    }
                });
            });

            this.ogmLayers = new ArcGISDynamicMapServiceLayer(config.urls.ogmMapService, {
                id: 'ogmLayers'
            });
            this.map.addLayer(this.ogmLayers);
            this.map.addLoaderToLayer(this.ogmLayers);

            this.plssLayer = new ArcGISTiledMapServiceLayer(config.urls.plssMapService, {
                visible: false,
                id: 'PLSS'
            });
            this.map.addLayer(this.plssLayer);

            this.map.on('layer-add-result', function (add) {
                if (add.layer.id === 'ogmLayers') {
                    // set up legend
                    var leg = new Legend({
                        map: that.map
                    }, 'legend');

                    leg.startup();
                }
            });

            this.map.on('click', lang.hitch(this, this.doIdentify));
        },
        updateLayerVisibility: function () {
            // summary:
            //      description
            console.log(this.declaredClass + '::updateLayerVisibility', arguments);

            var inputs = query('#layersTab .list_item');
            var visible = [];
            for (var i = 0, il = inputs.length; i < il; i++) {
                if (inputs[i].checked) {
                    visible.push(inputs[i].id);
                }
            }
            this.ogmLayers.setVisibleLayers(visible);
        },
        toggleBaseMaps: function () {
            // summary:
            //      description
            console.log(this.declaredClass + '::toggleBaseMaps', arguments);

            var visible = dom.byId('tiled-checkbox').checked;

            // loop through layers and turn off all cached
            var that = this;
            array.forEach(this.map.layerIds, function (id) {
                var lyr = that.map.getLayer(id);
                if (lyr.tileInfo && lyr.id !== 'PLSS') {
                    lyr.setVisibility(visible);
                }
            });
        },
        setPLSSVisibility: function (evt) {
            // summary:
            //      description
            console.log(this.declaredClass + '::setPLSSVisibility', arguments);

            this.plssLayer.setVisibility(evt.target.checked);
        },
        setDef: function (method) {
            // summary:
            //      description
            // method: String
            console.log(this.declaredClass + '::setDef', arguments);

            var message;
            switch (method) {
                case 'All':
                    this.currentLayerDef = '1 = 1';
                    this.ogmLayers.setDefaultLayerDefinitions();
                    this.filterMess.innerHTML = 'Wells Filter: All';
                    return; case 'Oil':
                    this.currentLayerDef = 'Well_type_main = \'OW\' and (Well_status_main <> \'LA\' and Well_status_main <> \'RET\')';
                    message = 'Wells Filter: Oil';
                    break;
                case 'Gas':
                    this.currentLayerDef = 'Well_type_main = \'GW\' and (Well_status_main <> \'LA\' and Well_status_main <> \'RET\')';
                    message = 'Wells Filter: Gas';
                    break;
                case 'Service':
                    this.currentLayerDef = '(Well_type_main = \'WI\' or Well_type_main = \'GI\' or Well_type_main = \'GS\' or Well_type_main = \'WD\' or Well_type_main = \'WS\' or Well_type_main = \'TW\') and (Well_status_main <> \'LA\' and Well_status_main <> \'RET\')';
                    message = 'Wells Filter: Service';
                    break;
                case 'Active':
                    this.currentLayerDef = 'Well_status_main = \'A\' or Well_status_main = \'I\' or Well_status_main = \'P\' or Well_status_main = \'S\' or Well_status_main = \'TA\'';
                    message = 'Wells Filter: Active';
                    break;
                case 'Drilling':
                    this.currentLayerDef = 'Well_status_main = \'DRL\'';
                    message = 'Wells Filter: Drilling';
                    break;
                case 'NewPermits':
                    this.currentLayerDef = 'Well_status_main = \'APD\'';
                    message = 'Wells Filter: New Permits';
                    break;
            }

            var layerDefs = [this.currentLayerDef, this.currentLayerDef, this.currentLayerDef];
            this.ogmLayers.setLayerDefinitions(layerDefs);
            this.filterMess.innerHTML = message;
            this.map.graphics.clear();
        },
        zoomToField: function () {
            // summary:
            //      description
            console.log(this.declaredClass + '::zoomToField', arguments);

            var theField = dom.byId('field').value;
            // the .replace(...) is to prevent invalid sql statements with ' characters
            var selString = 'FIELDNAME' + '=\'' + theField.replace('\'', '\'\'') + '\'';

            this.fieldQueryParams.where = selString;

            this.toggleProgressBar('Zooming to ' + theField);
            this.fieldQueryTask.execute(this.fieldQueryParams, lang.hitch(this, this.showFLDResults));
        },
        showFLDResults: function (featureSet) {
            // summary:
            //      description
            // featureSet: FeatureSet
            console.log(this.declaredClass + '::showFLDResults', arguments);

            this.map.graphics.clear();
            var features = featureSet.features;
            var feature;
            var symbol;
            for (var i = 0; i < features.length; i++) {
                feature = features[i];
                switch (feature.geometry.type) {
                    case 'point':
                        symbol = new SimpleMarkerSymbol(
                            SimpleMarkerSymbol.STYLE_SQUARE,
                            10,
                            new SimpleLineSymbol(
                                SimpleLineSymbol.STYLE_SOLID,
                                new Color([255, 0, 0]), 1), new Color([255, 0, 0, 0.25]));
                        break;
                    case 'polyline':
                        symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255, 0, 0]), 1);
                        break;
                    case 'polygon':
                        symbol = new SimpleFillSymbol(
                            SimpleFillSymbol.STYLE_SOLID,
                            new SimpleLineSymbol(
                                SimpleLineSymbol.STYLE_SOLID,
                                new Color([255, 255, 0]), 3), new Color([255, 0, 0, 0.02]));
                        break;
                }
                var extent = ((feature.geometry).getExtent());

                extent.xmin -= 950;
                extent.ymin -= 950;
                extent.xmax += 950;
                extent.ymax += 950;

                this.map.setExtent(extent);
                feature.setSymbol(symbol);
                this.map.graphics.add(feature);


            }
            this.toggleProgressBar('');
        },
        toggleProgressBar: function (text) {
            // summary:
            //      description
            // text: String
            console.log(this.declaredClass + '::toggleProgressBar', arguments);

            dom.byId('progresstext').innerHTML = text;
            var progressbar_container = dom.byId('progressbar_container');

            if (progressbar_container.style.display === 'block') {
                progressbar_container.style.display = 'none';
            } else {
                progressbar_container.style.display = 'block';
            }
        },
        addLongLatToMap: function (lon, lat) {
            // summary:
            //      description
            // lon: Number
            // lat: Number
            console.log(this.declaredClass + '::addLongLatToMap', arguments);

            var point = new Point(lon, lat, new SpatialReference({
                wkid: 4326
            }));

            var outSR = new SpatialReference({
                wkid: 26912
            });

            var that = this;
            this.gsvc.project([point], outSR, function (features) {
                // get point
                var pt = features[0];

                // build graphic
                var symbol = new SimpleMarkerSymbol().setColor(
                    new Color([255, 0, 0, 0.5])).setStyle(SimpleMarkerSymbol.STYLE_DIAMOND);
                var graphic = new Graphic(pt, symbol);
                that.map.graphics.add(graphic);

                that.map.centerAndZoom(graphic.geometry, 10);
            });
        },
        addPointToMap: function (xcoord, ycoord) {
            // summary:
            //      description
            // xcoord: Number
            // ycoord: Number
            console.log(this.declaredClass + '::addPointToMap', arguments);

            var point = new Point(xcoord, ycoord, this.map.spatialReference);
            var symbol = new SimpleMarkerSymbol().setColor(new Color([255, 0, 0, 0.5])).setStyle(SimpleMarkerSymbol.STYLE_DIAMOND);
            var graphic = new Graphic(point, symbol);

            var xMin = xcoord - 500.05;
            var yMin = ycoord - 500.05;
            var xMax = xcoord + 500.05;
            var yMax = ycoord + 500.05;

            var newExtent = new Extent(xMin, yMin, xMax, yMax, new SpatialReference({wkid: 26912 }));

            //  alert(map.extent.xmax);
            this.map.setExtent(newExtent, true);

            this.map.graphics.add(graphic);
        },
        executePSELQueryTask: function () {
            // summary:
            //      description
            console.log(this.declaredClass + '::executePSELQueryTask', arguments);

            if (this.map.getLevel() < 4) {
                alert('Too many wells - zoom in closer');
                return;
            }

            //Grab the map extent envelope
            this.pointQuery.geometry = this.map.extent;
            if (this.currentLayerDef) {
                this.pointQuery.where = this.currentLayerDef;
            }

            //Execute task and call showPSELResults on completion
            this.pointQueryTask.execute(this.pointQuery, lang.hitch(this, this.showPSELResults));
        },
        showPSELResults: function (featureSet) {
            // summary:
            //      description
            // featureSet: FeatureSet
            console.log(this.declaredClass + '::showPSELResults', arguments);

            this.map.graphics.clear();
            var fieldNames = config.fieldNames;
            //QueryTask returns a featureSet.  Loop through features in the featureSet and add them to the map.
            var nameArray = [];
            var apiArray = [];
            var acctArray = [];
            var compArray = [];
            var fldArray = [];
            var locsrfArray = [];
            var statArray = [];
            array.forEach(featureSet.features, function (f, i) {
                nameArray[i] = f.attributes[fieldNames.WELL_NAME];
                apiArray[i] = f.attributes[fieldNames.API];
                acctArray[i] = f.attributes[fieldNames.ACCT_NUM];
                compArray[i] = f.attributes[fieldNames.COMPANY_NAME];
                fldArray[i] = f.attributes[fieldNames.FIELD_NUM];
                locsrfArray[i] = f.attributes[fieldNames.LOCATION_SURF_WCR];
                statArray[i] = f.attributes[fieldNames.GIS_STAT_TYPE];
            }, this);
            var arraySize = statArray.length;
            this.createNewWindow(arraySize, nameArray, apiArray, acctArray, compArray, fldArray, locsrfArray, statArray);
            return false;
        },
        createNewWindow: function (arraySize, nameArray, apiArray, acctArray, compArray, fldArray, locsrfArray, statArray) {
            // summary:
            //      description
            console.log(this.declaredClass + '::createNewWindow', arguments);

            var userName = 'Well Data Output';
            var newPage = '<html><head><title>';
            newPage += userName;
            newPage += '</title></head><body>';
            newPage += 'WELL_NAME,API,ACCT_NUM,COMPANY_NAME,FIELD_NUM,LOCATION_SURF_WCR,GIS_STAT_TYPE <br />';
            array.forEach(nameArray, function (name, i) {
                newPage += name + ',' + apiArray[i] + ',' + acctArray[i] + ',' + compArray[i] + ',' + fldArray[i] + ',' + locsrfArray[i] + ',' + statArray[i] + '<br />';
            }, this);
            newPage += '</p></body></html>';
            var j = window.open('');
            j.document.write(newPage);
            j.document.close();
        },
        doIdentify: function (evt) {
            // summary:
            //      description
            // evt: Map Click Event
            console.log(this.declaredClass + '::doIdentify', arguments);

            var that = this;

            // clear content
            dom.byId('mapclick').innerHTML = '';

            ///toggleProgressBar('Executing Identify on location: <br/>' + evt.mapPoint.x + ' ' + evt.mapPoint.y);
            try {
                this.map.graphics.clear();
            } catch (err) {
                console.log('doidentify graphics clear'); ////was an alert 12-1-09
            }
            this.identifyParams.geometry = evt.mapPoint;
            this.identifyParams.mapExtent = this.map.extent;
            this.identifyParams.layerDefinitions[0] = this.currentLayerDef;
            this.identifyTask.execute(this.identifyParams, function (idResults) {
                if (idResults.length > 0) {
                    that.addToMap(idResults, evt);
                }
            }, function (e) {
                console.error('identifyTask error', e);
            });
        },
        addToMap: function (idResults) {
            // summary:
            //      description
            // idResults
            // evt
            console.log(this.declaredClass + '::addToMap', arguments);

            var layer2results = {
                displayFieldName: null,
                features: []
            };
            for (var i = 0, il = idResults.length; i < il; i++) {
                var idResult = idResults[i];
                if (!layer2results.displayFieldName) {
                    layer2results.displayFieldName = idResult.displayFieldName;
                }
                layer2results.features.push(idResult.feature);
            }
            this.layerTabContent(layer2results, idResults[0].layerName);
        },
        layerTabContent: function (layerResults, layerName) {
            // summary:
            //      description
            // layerResults
            // layerName
            console.log(this.declaredClass + '::layerTabContent', arguments);

            function addOddClass(row) {
                if ((row.rowIndex) % 2 === 0) {
                    domClass.add(row, 'odd-row');
                }
            }

            function addRow(fieldName, value, indent, tbody) {
                var row = domConstruct.create('tr', null, tbody);
                addOddClass(row);
                var fieldCell = domConstruct.create('td', {
                    'innerHTML': fieldName,
                    'class': 'field-cell'
                }, row);
                if (indent) {
                    domClass.add(fieldCell, 'indent-cell');
                }
                domConstruct.create('td', {
                    'innerHTML': value
                }, row);
            }

            function addRowOneCell(value, tbody) {
                var row = domConstruct.create('tr', null, tbody);
                addOddClass(row);
                domConstruct.create('td', {
                    'innerHTML': value,
                    'colspan': '2'
                }, row);
            }

            var content = '';
            var feature;
            var fldContent;
            var untContent;
            var fieldNames = config.fieldNames;
            if (layerResults.features[0].geometry.type === 'point') {
                var apiArray = [];
                content += '<b style="color: #1c56a3">Identify Results:<br /></b>';
                content += '&nbsp;&nbsp;<span style="color: red;">' + layerResults.features.length + ' Well(s) Found</span><hr />';
                dom.byId('mapclick').innerHTML = content;
                for (var i = 0, il = layerResults.features.length; i < il; i++) {
                    feature = layerResults.features[i];
                    var atts = feature.attributes;

                    // add new table
                    var table = domConstruct.create('table', {
                        'class': 'info-table'
                    }, 'mapclick');

                    // add new table body
                    var tbody = domConstruct.create('tbody', null, table);


                    addRow('API', atts[fieldNames.API], false, tbody);
                    addRow('Well Name', atts[fieldNames.WELL_NAME], false, tbody);
                    addRow('Current Operator', atts[fieldNames.COMPANY_NAME], false, tbody);
                    addRow('Confidential?', atts[fieldNames.CONF_FLAG], false, tbody);
                    addRow('Well Status', atts[fieldNames.WELL_STATUS_MAIN], false, tbody);
                    addRow('Well Type', atts[fieldNames.WELL_TYPE_MAIN], false, tbody);
                    addRow('Original Completion Date', atts[fieldNames.ORIG_COMPL_DATE], false, tbody);
                    addRow('Abandoned', atts[fieldNames.LA_PA_DATE], false, tbody);
                    addRow('Cumulative Oil Production', atts[fieldNames.TOTAL_CUM_OIL], false, tbody);
                    addRow('Cumulative Gas Production', atts[fieldNames.TOTAL_CUM_GAS], false, tbody);
                    addRow('Cumulative Water Production', atts[fieldNames.TOTAL_CUM_WATER], false, tbody);
                    addRow('Surface Location:', '', false, tbody);
                    addRow('Footages', atts[fieldNames.LOCATION_SURF_WCR], true, tbody);
                    addRow('UTM - Northing', atts[fieldNames.COORDS_SURF_N], true, tbody);
                    addRow('UTM - Easting', atts[fieldNames.COORDS_SURF_E], true, tbody);
                    addRow('Latitude', atts[fieldNames.LAT_SURF], true, tbody);
                    addRow('Longitude', atts[fieldNames.LONG_SURF], true, tbody);
                    addRow('QQ - S - T - R - Meridian', atts[fieldNames.QTR_QTR] +
                    '-' +
                    atts[fieldNames.SECTION] +
                    '-' +
                    atts[fieldNames.TOWNSHIP] +
                    '-' +
                    atts[fieldNames.RANGE] +
                    '-' +
                    atts[fieldNames.MERIDIAN], true, tbody);
                    addRow('Field', atts[fieldNames.FIELD_NAME], true, tbody);
                    addRow('County', atts[fieldNames.COUNTY], true, tbody);
                    addRow('Elevation', atts[fieldNames.ELEVATION], false, tbody);
                    addRow('Original Total Depth', atts[fieldNames.ORIG_TD], false, tbody);
                    addRow('Directional', atts[fieldNames.DIRECTIONAL], false, tbody);
                    addRow('Multiple Laterals', atts[fieldNames.MULTI_LEG_COUNT], false, tbody);

                    // check for oil production data
                    var cutOffDate = new Date('1/1/1984');
                    if ((atts[fieldNames.TOTAL_CUM_OIL] > 0 ||
                    atts[fieldNames.TOTAL_CUM_GAS] > 0 ||
                    atts[fieldNames.TOTAL_CUM_WATER] > 0) &&
                    (atts[fieldNames.LA_PA_DATE] === 'Null' ||
                    new Date(atts[fieldNames.LA_PA_DATE]) >= cutOffDate)) {
                        addRowOneCell('<a href="http://oilgas.ogm.utah.gov/Data_Center/LiveData_Search/prod_grid.cfm?wellno=' +
                        feature.attributes[fieldNames.API] +
                        '0000" target="_blank">Production Data</a>', tbody);
                    } else {
                        addRowOneCell('Production Data Not Available', tbody);
                    }

                    // Well File
                    addRowOneCell('<a href="http://oilgas.ogm.utah.gov/Data_Center/LiveData_Search/wellfile_data_lookup.cfm?fileno=' +
                    feature.attributes[fieldNames.API] +
                    '" target="_blank">Well File</a><br />', tbody);

                    // Well logs
                    addRowOneCell('<a href="http://oilgas.ogm.utah.gov/Data_Center/LiveData_Search/scan_data_lookup.cfm?fileno=' +
                    feature.attributes[fieldNames.API] +
                    '" target="_blank">Well Logs</a><br />', tbody);

                    // More Info Link
                    addRowOneCell('<a href="http://oilgas.ogm.utah.gov/Data_Center/LiveData_Search/main_menu.htm" target="_blank">Additional Information</a>', tbody);

                    domConstruct.create('hr', null, 'mapclick');
                }

                console.log(apiArray);
                // Open infoTab
                this.sideBar.selectChild(registry.byId('infoTab'));
                this.showPoint(feature);
            } else if (layerResults.features[0].geometry.type === 'polygon') {
                if (layerName === 'Fields') {
                    fldContent = '';
                    fldContent += '<b style="color: #1c56a3">Identify Results:<br />'; ////////<hr /></b>';
                    fldContent += '&nbsp;&nbsp;' + layerResults.features.length + ' Field(s) Found<hr />';
                    for (var x = 0, l = layerResults.features.length; x < l; x++) {
                        feature = layerResults.features[x];
                        fldContent += '<b style="color: #1c56a3">' + 'Field Number' + '</b><br/>';
                        fldContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[x].attributes.FIELDNUM + '<br/>';
                        fldContent += '<b style="color: #1c56a3">' + 'Field Name' + '</b><br/>';
                        fldContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[x].attributes.FIELDNAME + '<br />';
                        fldContent += '<b style="color: #1c56a3">' + 'Status' + '</b><br/>';
                        fldContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[x].attributes.STATUS + '<br/>';
                        fldContent += '<b style="color: #1c56a3">' + 'Date' + '</b><br/>';
                        fldContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[x].attributes.DATE + '<br/>';
                        fldContent += '<b style="color: #1c56a3">' + 'Prod. Form' + '</b><br/>';
                        fldContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[x].attributes.PROD_FORM_ + '<br/>';
                        fldContent += '<b style="color: #1c56a3">' + 'Comments' + '</b><br/>';
                        fldContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[x].attributes.COMMENTS + '<br/>';
                        fldContent += '<b style="color: #1c56a3">' + 'Disc. Well' + '</b><br/>';
                        fldContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[x].attributes.DISC_WELL + '<br/>';
                    }
                    dom.byId('mapclick').innerHTML = fldContent;
                    // Open infoTab
                    this.sideBar.selectChild(registry.byId('infoTab'));
                    this.showPolys(feature);
                } else if (layerName === 'Units') {
                    untContent = '';
                    untContent += '<b style="color: #1c56a3">Identify Results:<br />'; ////////<hr /></b>';
                    untContent += '&nbsp;&nbsp;' + layerResults.features.length + ' Unit(s) Found<hr />';
                    for (var y = 0, len = layerResults.features.length; y < len; y++) {
                        feature = layerResults.features[y];
                        untContent += '<b style="color: #1c56a3">' + 'Unit Name' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.UNITNAME + '<br/>';
                        untContent += '<b style="color: #1c56a3">' + 'Moss Sub' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.MOSS_SUB + '<br />';
                        untContent += '<b style="color: #1c56a3">' + 'AFSNUM' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.AFSNUM + '<br/>';
                        untContent += '<b style="color: #1c56a3">' + 'BLM Contract' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.BLM_CONTR + '<br/>';
                        untContent += '<b style="color: #1c56a3">' + 'PA Name' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.PA_NAME + '<br/>';
                        untContent += '<b style="color: #1c56a3">' + 'Operator' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.OPERATOR + '<br/>';
                        untContent += '<b style="color: #1c56a3">' + 'Acres' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.ACRES + '<br/>';
                        untContent += '<b style="color: #1c56a3">' + 'Effective Date' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.EFF_DATE + '<br/>';
                        untContent += '<b style="color: #1c56a3">' + 'Initial Patent' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.INITIAL_PA + '<br />';
                        untContent += '<b style="color: #1c56a3">' + 'County' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.COUNTY + '<br/>';
                        untContent += '<b style="color: #1c56a3">' + 'Status' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.STATUS + '<br/>';
                        untContent += '<b style="color: #1c56a3">' + 'Contract Date' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.CONTR_DATE + '<br/>';
                        untContent += '<b style="color: #1c56a3">' + 'Federal Percent' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.FED_PERCEN + '<br/>';
                        untContent += '<b style="color: #1c56a3">' + 'Township/Range/Meridian' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.TOWNSHIP + '/' + layerResults.features[y].attributes.RANGE + '/' + layerResults.features[y].attributes.MERIDIAN + '<br/>';
                        untContent += '<b style="color: #1c56a3">' + 'PA Suffix' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.PA_SUFFIX + '<br/>';
                        untContent += '<b style="color: #1c56a3">' + 'District' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.DISTRICT + '<br/>';
                        untContent += '<b style="color: #1c56a3">' + 'Term Date' + '</b><br/>';
                        untContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + layerResults.features[y].attributes.TERM_DATE + '<br/>';
                    }
                    dom.byId('mapclick').innerHTML = untContent;
                    // Open infoTab
                    this.sideBar.selectChild(registry.byId('infoTab'));
                    this.showPolys(feature);
                }
            }
            return content;
        },
        showPolys: function (feature) {
            // summary:
            //      description
            // feature
            console.log(this.declaredClass + '::showPolys', arguments);

            this.map.graphics.clear();
            // Highlight selected feature:
            var polySymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 0]), 3), new Color([0, 255, 0, 0.25]));
            feature.setSymbol(polySymbol);
            this.map.graphics.add(feature);
        },
        showPoint: function (feature) {
            // summary:
            //      description
            // feature
            console.log(this.declaredClass + '::showPoint', arguments);

            this.map.graphics.clear();
            // Highlight selected feature:
            var ptSymbol = new SimpleMarkerSymbol().setSize(10).setColor(new Color([225, 255, 0, 0.5]));
            feature.setSymbol(ptSymbol);
            this.map.graphics.add(feature);
        }
    });
});
