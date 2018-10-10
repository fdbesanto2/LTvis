# -*- coding: utf-8 -*-
"""
Created on Mon Jun 25 19:57:51 2018

@author: braatenj
"""

import subprocess
import sys
import json


def main(inRaster, x, y):
  x = str(x) #
  y = str(y) #
  #cmd = 'C:/Users/braatenj/Anaconda2/Library/bin/gdallocationinfo -valonly -wgs84'+' '+'C:/xampp/htdocs/ltviz/data/WAORCA_biomass_crm_mean.tif'+' '+x+' '+y
  cmd = '/usr/lib/anaconda/bin/gdallocationinfo --config GDAL_DATA /usr/lib/anaconda/share/gdal -valonly -wgs84'+' '+inRaster+' '+x+' '+y
  #subprocess.call(cmd, shell=True)
  
  proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=True)
  output = [int(v) for v in proc.stdout.read().splitlines()]
  year = range(1990,2013)
  print json.dumps({"ts":output, "yr":year})


if __name__ == "__main__":  
  args = sys.argv    
  inRaster = args[1]
  x = args[2]
  y = args[3]

  main(inRaster, x, y)
