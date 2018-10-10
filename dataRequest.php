<?php
	$cmd = "/usr/lib/anaconda/bin/python dataRequest.py " . "'".json_encode($_POST)."'";// . " >> /var/www/emapr/pages/data/viz/logs/log.txt";
	exec($cmd, $out);
	//echo $cmd;
	for ($x = 0; $x < count($out); $x++) {	
		echo '<p>' . $out[$x] . "</p>";
	}
?>