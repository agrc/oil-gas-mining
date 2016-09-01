#!/usr/bin/env python
# * coding: utf8 *
'''
ogm_pallet.py

A module that contains a forklift pallet definition for this project.

It updates these feature classes in SGID from the OGM database:
SGID10.ENERGY.DNROilGasWells
SGID10.ENERGY.DNROilGasWells_HDBottom
SGID10.ENERGY.DNROilGasWells_HDPath

as well as the associated ftp packages.

It also updates data in fgdb's used by the web application.
'''


from forklift.models import Pallet
import arcpy
from os import path
from os import walk
from os import sep
from os import makedirs
import itertools
import zipfile
from shutil import rmtree
import secrets


class OGMPallet(Pallet):
    def build(self, configuration):
        self.arcgis_services = [('OilGasMining', 'MapServer')]

        self.sgid = path.join(self.garage, 'SGID10.sde')
        self.staging = r'C:\Scheduled\staging'
        self.energy = path.join(self.staging, 'energy.gdb')
        self.boundaries = path.join(self.staging, 'boundaries.gdb')
        self.water = path.join(self.staging, 'water.gdb')

        self.add_crates(['DNROilGasWells', 'DNROilGasFields', 'DNROilGasUnits'],
                        {'source_workspace': self.sgid,
                         'destination_workspace': self.energy})
        self.add_crate(('Counties', self.sgid, self.boundaries))
        self.add_crate(('StreamsNHDHighRes', self.sgid, self.water))

        self.copy_data = [self.energy, self.boundaries, self.water]

        #: the code below is here so that the source data that the crates above reference
        #: is updated before they are processed.
        arcpy.overwriteoutput = True
        arcpy.env.outputCoordinateSystem = None

        ogmconnection = path.join(self.garage, 'OGMUSER.odc')
        sdeconnection = path.join(self.garage, 'SGID10_ENERGY.sde')

        if configuration == 'Dev':
            indian_country = r'C:\MapData\deqreferencedata.gdb\Total_IC_and_ReservationTribalLand'
        else:
            indian_country = (r'\\' + secrets.DEQSERVER +
                              '\gis\AQGIS\GISSHARED\GISData\Total IC and Reservation_TribalLand\Total_IC_and_ReservationTribalLand.shp')

        ogmTableName = 'dbo.vw_AGRC_Well_Data'
        ogmSurfXField = 'COORDS_SURF_E'
        ogmSurfYField = 'COORDS_SURF_N'
        ogmBHXField = 'COORDS_BHL_E'
        ogmBHYField = 'COORDS_BHL_N'

        outputSurfFCName = 'SGID10.ENERGY.DNROilGasWells'
        outputBHFCName = 'SGID10.ENERGY.DNROilGasWells_HDBottom'
        outputBHPathFCName = 'SGID10.ENERGY.DNROilGasWells_HDPath'

        wellsLayer = 'wellsLayer'
        LA_PA_DATE = 'LA_PA_DATE'
        ORIG_COMPL_DATE = 'ORIG_COMPL_DATE'
        JURISDICTION = 'JURISDICTION'

        # establish connections
        ogmTable = path.join(ogmconnection, ogmTableName)
        surfPointFC = path.join(sdeconnection, outputSurfFCName)
        bHPointFC = path.join(sdeconnection, outputBHFCName)
        bHPathFC = path.join(sdeconnection, outputBHPathFCName)

        utmNAD83 = arcpy.SpatialReference(26912)

        surfXYLayerName = 'surfXYLayer'
        bHXYLayerName = 'bhXYLayer'

        surfTempFC = path.join(arcpy.env.scratchGDB, 'surfTempFC')
        bHTempFC = path.join(arcpy.env.scratchGDB, 'bHTempFC')

        self.log.info('deleting temp data')
        for fc in [surfTempFC, bHTempFC]:
            if arcpy.Exists(fc):
                arcpy.Delete_management(fc)

        #: SURFACE HOLE LOCATIONS
        self.log.info('Creating xy event layer from surface well location data')
        arcpy.MakeXYEventLayer_management(ogmTable, ogmSurfXField, ogmSurfYField, surfXYLayerName, utmNAD83)

        self.log.info('Exporting xy event layer to temp feature class for surface well location')
        arcpy.FeatureClassToFeatureClass_conversion(surfXYLayerName, arcpy.env.scratchGDB, 'surfTempFC')

        self.log.info('Deleting old surface well location features')
        arcpy.DeleteFeatures_management(surfPointFC)

        self.log.info("Appending new surface well location features")
        arcpy.Append_management(surfXYLayerName, surfPointFC, "NO_TEST")
        arcpy.Delete_management(surfXYLayerName)

        #: WELL BOTTOM HOLE LOCATIONS
        self.log.info('Creating bhxy event layer for bottom of hole location data')
        arcpy.MakeXYEventLayer_management(ogmTable, ogmBHXField, ogmBHYField, bHXYLayerName, utmNAD83)

        # export to temp fc
        self.log.info('Exporting for bottom of hole xy event layer to temp feature class')
        arcpy.CopyFeatures_management(bHXYLayerName, bHTempFC)
        arcpy.Delete_management(bHXYLayerName)

        # delete features from current bottom hole FC
        self.log.info('Deleting for bottom of holefeatures from current FC')
        arcpy.DeleteFeatures_management(bHPointFC)

        # delete features from current horizontal path FC
        self.log.info('Deleting features from current horizontal path FC')
        arcpy.DeleteFeatures_management(bHPathFC)

        # Create the insert cursor and point it at the file just created
        queryTxt = '{0} > 200000 and {1} > 4000000 and not ({0} = {2} and {1} = {3})'.format(ogmBHXField, ogmBHYField, ogmSurfXField, ogmSurfYField)
        edit = arcpy.da.Editor(sdeconnection)
        edit.startEditing(False, False)
        edit.startOperation()
        with arcpy.da.SearchCursor(surfTempFC, ['API', 'SHAPE@'], queryTxt) as surfRows, \
                arcpy.da.SearchCursor(bHTempFC, ['API', 'SHAPE@'], queryTxt) as bHRows, \
                arcpy.da.InsertCursor(bHPointFC, ['SHAPE@XY', 'API', 'UTMX_NAD83', 'UTMY_NAD83']) as bHPointInsertCursor, \
                arcpy.da.InsertCursor(bHPathFC, ['SHAPE@', 'API']) as bHPathInsertCursor:
                self.log.info('inserting new records...')
                for surfRow, bHRow in itertools.izip(sorted(surfRows), sorted(bHRows)):
                    surfFeature = surfRow[1]
                    bHFeature = bHRow[1]

                    surfPoint = surfFeature.getPart(0)
                    bHPoint = bHFeature.getPart(0)

                    bHPointInsertCursor.insertRow(((bHPoint.X, bHPoint.Y), surfRow[0], bHPoint.X, bHPoint.Y))

                    lineArray = arcpy.Array([surfPoint, bHPoint])

                    bHPathInsertCursor.insertRow((arcpy.Polyline(lineArray), surfRow[0]))

        edit.stopOperation()
        edit.stopEditing(True)

        self.log.info('scrubbing dates')
        arcpy.MakeFeatureLayer_management(surfPointFC, wellsLayer, "[{}] = '1899-12-30 00:00:00'".format(LA_PA_DATE))
        arcpy.CalculateField_management(wellsLayer, LA_PA_DATE, 'None', 'PYTHON')
        arcpy.Delete_management(wellsLayer)
        arcpy.MakeFeatureLayer_management(surfPointFC, wellsLayer, "[{}] = '1899-12-30 00:00:00'".format(ORIG_COMPL_DATE))
        arcpy.CalculateField_management(wellsLayer, ORIG_COMPL_DATE, 'None', 'PYTHON')
        arcpy.Delete_management(wellsLayer)

        self.log.info('updating JURISDICTION field')
        arcpy.MakeFeatureLayer_management(surfPointFC, wellsLayer)
        arcpy.CalculateField_management(wellsLayer, JURISDICTION, '"state"', 'PYTHON')
        arcpy.SelectLayerByLocation_management(wellsLayer, "INTERSECT", indian_country)
        arcpy.CalculateField_management(wellsLayer, JURISDICTION, '"indian"', 'PYTHON')

        # update ftp packages
        if (configuration == 'Production'):
            self.log.info('updating ftp package')
            name = 'DOGMOilAndGasResources'
            packageFolderPath = r'\\' + secrets.HNAS + r'\ftp\UtahSGID_Vector\UTM12_NAD83\ENERGY\PackagedData\_Statewide\\' + name
            unpackagedFolderPath = r'\\' + secrets.HNAS + r'\ftp\UtahSGID_Vector\UTM12_NAD83\ENERGY\UnpackagedData\\'
            featureClasses = ["SGID10.ENERGY.DNROilGasFields",
                              "SGID10.ENERGY.DNROilGasUnits",
                              "SGID10.ENERGY.DNROilGasWells",
                              "SGID10.ENERGY.DNROilGasWells_HDBottom",
                              "SGID10.ENERGY.DNROilGasWells_HDPath"]
            if arcpy.Exists(path.join(packageFolderPath, name + ".gdb")):
                arcpy.Delete_management(path.join(packageFolderPath, name + ".gdb"))
            arcpy.CreateFileGDB_management(packageFolderPath, name + ".gdb", "9.3")

            def zipws(pth, zip, keep):
                pth = path.normpath(pth)

                for (dirpath, dirnames, filenames) in walk(pth):
                    for file in filenames:
                        if not file.endswith('.lock'):
                            try:
                                if keep:
                                    if path.join(dirpath, file).find('.zip') == -1:
                                        zip.write(path.join(dirpath, file), path.join(path.basename(pth), path.join(dirpath, file)[len(pth) + len(sep):]))
                                else:
                                    if path.join(dirpath, file).find('gdb') == -1 and path.join(dirpath, file).find('.zip') == -1:
                                        zip.write(path.join(dirpath, file), file.split(".")[0] + '\\' + file)
                            except Exception as e:
                                self.log.error("Error adding %s: %s" % (file, e))
                return None

            #: populate local file geodatabase
            for fc in featureClasses:
                arcpy.env.workspace = sdeconnection
                if arcpy.Exists(path.join(sdeconnection, fc)):
                    #: add feature class to local file geodatabase to be packaged later
                    arcpy.Copy_management(path.join(sdeconnection, fc), path.join(packageFolderPath, name + ".gdb", fc))

                    #: create another file gdb and copy to Unpackaged folder
                    fcUnpackagedFolderPath = path.join(unpackagedFolderPath, fc.split(".")[2], '_Statewide')

                    if not path.isdir(fcUnpackagedFolderPath):
                        makedirs(fcUnpackagedFolderPath)

                    arcpy.CreateFileGDB_management(fcUnpackagedFolderPath, fc.split(".")[2] + ".gdb")
                    arcpy.Copy_management(path.join(packageFolderPath, name + ".gdb", fc.split(".")[2]),
                                          path.join(fcUnpackagedFolderPath, fc.split(".")[2] + ".gdb", fc.split(".")[2]))

                    zfGDBUnpackaged = zipfile.ZipFile(path.join(fcUnpackagedFolderPath, fc.split(".")[2] + '_gdb.zip'), 'w', zipfile.ZIP_DEFLATED)
                    zipws(path.join(fcUnpackagedFolderPath, fc.split(".")[2] + ".gdb"), zfGDBUnpackaged, True)
                    zfGDBUnpackaged.close()

                    arcpy.Delete_management(path.join(fcUnpackagedFolderPath, fc.split(".")[2] + '.gdb'))

            arcpy.env.workspace = path.join(packageFolderPath, name + ".gdb")

            #: create zip file for shapefile package
            zfSHP = zipfile.ZipFile(path.join(packageFolderPath, name + '_shp.zip'), 'w', zipfile.ZIP_DEFLATED)
            arcpy.env.overwriteOutput = True  #: Overwrite pre-existing files

            #: output zipped shapefiles for each feature class
            fileGDB_FCs = arcpy.ListFeatureClasses()

            for fc in fileGDB_FCs:
                #: create shapefile for the feature class
                arcpy.FeatureClassToShapefile_conversion(path.join(packageFolderPath, name + ".gdb", fc), packageFolderPath)

                #: add to package zipfile package
                zipws(packageFolderPath, zfSHP, False)

                # create unpackaged zip file and move data into that zip file
                zfSHPUnpackaged = zipfile.ZipFile(path.join(unpackagedFolderPath, fc, '_Statewide', fc + '_shp.zip'), 'w', zipfile.ZIP_DEFLATED)
                zipws(packageFolderPath, zfSHPUnpackaged, False)
                zfSHPUnpackaged.close()

                # delete temporary shapefiles
                arcpy.Delete_management(path.join(packageFolderPath, fc + ".shp"))
            zfSHP.close()

            zfFGDB = zipfile.ZipFile(path.join(packageFolderPath, name + '_gdb.zip'), 'w', zipfile.ZIP_DEFLATED)
            target_dir = path.join(packageFolderPath, name + '.gdb')
            rootlen = len(target_dir) + 1
            for base, dirs, files in walk(target_dir):
                for file in files:
                    fn = path.join(base, file)
                    zfFGDB.write(fn, name + ".gdb/" + fn[rootlen:])
            zfFGDB.close()
            rmtree(path.join(packageFolderPath, name + ".gdb"))
