#!/usr/bin/env python
# * coding: utf8 *
'''
ogm_pallet.py

A module that contains a forklift pallet definition for this project.
'''


from forklift.models import Pallet
from os.path import join
from arcpy import SpatialReference


class OGMPallet(Pallet):
    def build(self, configuration):
        self.destination_coordinate_system = SpatialReference(26912)
        self.arcgis_services = [('OilGasMining', 'MapServer')]

        self.sgid = join(self.garage, 'SGID10.sde')
        self.staging = r'C:\Scheduled\staging'
        self.energy = join(self.staging, 'energy_utm.gdb')
        self.boundaries = join(self.staging, 'boundaries_utm.gdb')
        self.water = join(self.staging, 'water_utm.gdb')

        self.add_crates(['DNROilGasWells', 'DNROilGasFields', 'DNROilGasUnits'],
                        {'source_workspace': self.sgid,
                         'destination_workspace': self.energy})
        self.add_crate(('Counties', self.sgid, self.boundaries))
        self.add_crate(('StreamsNHDHighRes', self.sgid, self.water))

        self.copy_data = [self.energy, self.boundaries, self.water]
