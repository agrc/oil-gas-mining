# this is a query used for a query layer that Diana Mason uses to generate maps.
# She got tired of waiting for SGID data to be updated so we pointed her directly at the OGM database.

# Query Layer
select geometry::STLineFromText(CONCAT('LINESTRING (', COORDS_SURF_E, ' ', COORDS_SURF_N, ', ', COORDS_BHL_E, ' ', COORDS_BHL_N, ')'), 26912) as geometry, API, GIS_STAT_TYPE
from vw_AGRC_Well_Data
where
COORDS_BHL_N IS NOT NULL and
COORDS_BHL_E IS NOT NULL and
COORDS_SURF_N IS NOT NULL and
COORDS_SURF_E IS NOT NULL and
COORDS_BHL_N != COORDS_SURF_N and
COORDS_BHL_E != COORDS_SURF_E


# Query Layer Selection
select geometry::STPointFromText(CONCAT('POINT(', COORDS_SURF_E, ' ', COORDS_SURF_N, ')'), 26912) as geometry, API, WELL_NAME, TOWNSHIP, RANGE, SECTION, COMPANY_NAME from vw_AGRC_Well_Data
