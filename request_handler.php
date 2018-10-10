<?php
  
	//#########################################################################################################
	// GET INPUTS
	//#########################################################################################################	

	// get the data requested
	$lat = $_POST['lat'];
	$lon = $_POST['lon'];
	$dataPath = $_POST['dataPath'];
	//echo 'lat: ' . $lat . ', lon: ' . $lon . ', data: ' . $dataPath;

	
	//https://stackoverflow.com/questions/2726551/call-python-from-php-and-get-return-code
	//$cmd = 'python getPixelTS.py a ' . $lon . ' ' . $lat;// . ' >> log.txt 2>&1';  //C:/Users/braatenj/Anaconda2/ 
	$cmd = '/usr/lib/anaconda/bin/python getPixelTS.py ' . $dataPath . ' ' . $lon . ' ' . $lat;// . ' >> /var/www/emapr/pages/data/vis/logs/log.txt 2>&1';  //C:/Users/braatenj/Anaconda2/    // . ' > ' . $outDir.'log.txt 2>&1';
	
	
	$test = exec($cmd, $val, $t);
	echo $val[0]; //json_encode($output);

	
?>

