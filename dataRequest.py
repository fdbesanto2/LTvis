# -*- coding: utf-8 -*-
"""
Created on Fri Aug 17 09:30:06 2018

@author: braatenj
"""

from osgeo import gdal, ogr
import os
import sys
import json
import sqlite3
import datetime
import subprocess
import zipfile
import smtplib



def getRasterBounds(rasterFile):
  src = gdal.Open(rasterFile)
  ulx, xres, xskew, uly, yskew, yres  = src.GetGeoTransform()
  sizeX = src.RasterXSize
  sizeY = src.RasterYSize
  lrx = ulx + (sizeX * xres)
  lry = uly + (sizeY * yres)
  return [ulx,uly,lrx,lry]

def isInData(ext, dataFile):
  extR = getRasterBounds(dataFile)
  t1 = int(ext[0]>extR[2])
  t2 = int(ext[2]<extR[0])
  t3 = int(ext[1]<extR[3])
  t4 = int(ext[3]>extR[1])
  return (t1+t2+t3+t4) == 0

def sendEmail(zipFiles, email):
  zipFiles = '\n'.join(['\t'+z for z in zipFiles])
  
  
  u = 'emapr.lab@gmail.com'
  p = open('/data/visDataRequests/pw.txt', 'r').read()     
      
  fromAddr = "From: eMapR Lab <"+u+">"
  toAddr = "To: "+email
  subject = "Subject: eMapR Data Request is Ready"
  body = 'Your eMapR data request is ready.\n\n'+zipFiles+'\n\nThe data will be available for one weeks. Please contact Justin Braaten at jstnbraaten@gmail.com for assistance with questions or problems.\n\nBest regards, \n\neMapR Lab Group'
  
  message = '\n'.join([fromAddr, toAddr, subject, body])
  
  try:
  	server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
  	server.ehlo()
  	server.login(u, p)
  	server.sendmail(u, email, message)
  	server.close()
  	status = 'Processing complete. Email was sent.'
  except:
  	status = 'Processing complete. However, email was not send - something went wrong.'
  
  return status


def writeMetaData(fileName, year):
  cmd = '/usr/lib/anaconda/bin/gdalinfo '+fileName
  p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)        
  output, err = p.communicate()
  lines = output.split('\n')
  for i, line in enumerate(lines):
    if line[0:6] == 'Files:':
      lines[i] = 'Files: '+os.path.basename(fileName)
    if line[0:4] == 'Band':
      l = lines[i+1]+'\n  Year='+str(year)
      lines[i+1] = l
      year += 1
    
  outMeta = fileName.replace('.tif', '_meta.txt')  
  meta = '\n'.join(lines)
  with open(outMeta, "w") as metaObj:
    metaObj.write(meta)
  
  return outMeta


def main(post):
  # make a processing dir - figure out what request name this should be
  conn = sqlite3.connect("/data/visDataRequests/visDataRequests.db")
  cur = conn.cursor()
  cur.execute("SELECT id FROM requests ORDER BY id DESC LIMIT 1")
  lastId = cur.fetchone()[0]
  nextId = lastId+1
  name = str(nextId).rjust(6, '0')
  requestsDir = "/data/visDataRequests"
  requestDir = os.path.join(requestsDir,name)
  outPoly = os.path.join(requestDir,'aoi.geojson')
  if not os.path.isdir(requestDir):
    os.mkdir(requestDir)
    os.chmod(requestDir, 0777)
  
  # make a message holder
  messages = []
  
  # unpack the post data
  post = json.loads(post)
  inPoly = post['polyPath']
  key = post['polyKey']
  value = post['polyValue']
  dataIds = post['data']
  email = post['email']
  metadata = '/data/maps/visdata_metadata.json'# hard coded
  
  # open the data src for reading
  driver = ogr.GetDriverByName("GeoJSON")
  src = driver.Open(inPoly, 0) #
  if src is None:
    messages.append('Could not open the polygon file that defines region to download')
    return 
  else:
    messages.append('Opened the polygon file that defines region to download')
  
  # figure out if the feature exists in the polygon
  layer = src.GetLayer()
  query = "{}='{}'".format(key, value) #"name='h00v00'"
  layer.SetAttributeFilter(query)
  featureCount = layer.GetFeatureCount()
  if featureCount == 0:
    messages.append('There are no features in the polygon file matching the request')
    return 
  elif featureCount > 1:
    messages.append('There are more than one feature in the polygon file matching the request')
    return
  elif featureCount == 1:
    messages.append('Found a feature in the polygon file matching the request')

  # get the extent of the feature - TODO: get rid of this and read in the extent from the file that is output below
  feature = layer.GetNextFeature()
  geom = feature.GetGeometryRef()
  ext = geom.GetEnvelope()
  ext = [ext[0], ext[3], ext[1], ext[2]]


  # make sure that we have the data requested
  with open(metadata, "r") as f:
    metadata = json.load(f)
  
  """
  #TODO - need to loop this for all data types selected
  for dataId in dataIds:
    dataMatch = False
    for thisData in metadata:
      if thisData['id'] == dataId:
        dataMatch = True
        break
    
    if not dataMatch:
      print 'Could not find requested data in catalog'
      return
  """
  

  
  # subset the feature so we can store the geojson as text in the database
  cmd = "/usr/lib/anaconda/bin/ogr2ogr --config GDAL_DATA /usr/lib/anaconda/share/gdal -q -f \"GeoJSON\" -where \""+key+"='"+value+"'\" "+outPoly+" "+inPoly
  status = subprocess.call(cmd, shell=True) # need to use shell=True because it is a full string that is being passed, if we don;t want shell=True, then we need to split the arguments
  #if cmdFailed:
  #  return 'Error: ogr2ogr command to filter feature from polygon failed'


  # make symlinkDir
  #symlinkDir = os.path.join('/var/www/emapr/pages/data/viz/requests',name)
  symlinkDir = os.path.join('/var/www/emapr/pages/data/vis/requests',name)
  if not os.path.isdir(symlinkDir):
    os.makedirs(symlinkDir)

  zipFiles = []
  for dataId in dataIds:
    for thisData in metadata:
      if thisData['id'] == dataId:
        break
    
    
    # check to see that the poly ext is not outide of the data
    if not isInData(ext, thisData['dataPath']):
      messages.append('Warning: Data: '+dataId+' does not interest the feature bounding box - cannot process.\n') 
      print '<strong>Error</strong>: '+dataId+' does not interest the feature bounding box - cannot process.'
      return
    
    
       #break

    # make a basename
    outBase = '{}_{}_{}.tif'.format(thisData['dataName'], key, str(value))
    
    # make out data file
    outData = os.path.join(requestDir,outBase)
  
    # subset the data
    projwin = '-projwin {} {} {} {}'.format(ext[0], ext[1], ext[2], ext[3]) #ext[0], ext[3], ext[1], ext[2]
    cmd = '/usr/lib/anaconda/bin/gdal_translate --config GDAL_DATA /usr/lib/anaconda/share/gdal -q '+projwin+' '+thisData['dataPath']+' '+outData
    status = subprocess.call(cmd, shell=True)
    
    # apply cutline if requested
    cutline = False # don't need this until we add user upload
    if(cutline == True): 
      nBands = gdal.Open(outData).RasterCount
      bands = ' '.join(['-b '+str(band) for band in range(1,nBands+1)])
      cmd = 'gdal_rasterize -q -i -burn -9999 '+bands+' '+outPoly+' '+outData
      status = subprocess.call(cmd, shell=True)
     
    # compress the file- TODO add metadata to the zip file
    if os.path.exists(outData):
      outZip = outData.replace('.tif', '.zip')
      
      # make some metadata
      outMeta = writeMetaData(outData, thisData['minYear'])
      
      # zip the files
      zout = zipfile.ZipFile(outZip, "w", zipfile.ZIP_DEFLATED)
      zout.write(outData, arcname=outBase)
      zout.write(outMeta, arcname=os.path.basename(outMeta))
      zout.close()
      
      # delete the original
      os.remove(outData)
      os.remove(outMeta)
      
      # make a symlink to the data for download
      outZipBase = os.path.basename(outZip)
      zipFiles.append(outZipBase)
      os.symlink(outZip, os.path.join(symlinkDir,outZipBase))
      
    else:
      return 'Error: data subset was not created'
      
  
  # send email about data links  
  zipFiles = [os.path.join('http://emapr.ceoas.oregonstate.edu/pages/data/viz/requests',name, z) for z in zipFiles]
  emailStatus = sendEmail(zipFiles, email)

  # make database entry
  with open(outPoly, "r") as f:
    geojson = json.load(f)
    
  date = datetime.datetime.now().date()
  date.strftime("%Y-%m-%d")
  
  sql = '''INSERT INTO requests (id, name, date, data, aoi, email) VALUES(?,?,?,?,?,?)'''
  requestInfo = (nextId, name, date, ','.join(dataIds), str(geojson), email)
  cur.execute(sql, requestInfo)
  conn.commit()
    

if __name__ == "__main__":  
  args = sys.argv    
  post = args[1]

  main(post)
  

