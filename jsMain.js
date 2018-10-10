// SOME GLOBALS	
//var tileURL = "http://emapr.ceoas.oregonstate.edu/pages/data/vis/tms/waorca-biomass/crm" //'./tms/waorca-biomass/crm' // the default tile layer to load
var dataSet = { // the default dataset - this could just be the first one in the dataSet list that is received
    "name": "Biomass",
    "minYear": 1990,
    "maxYear": 2012,
	"yMin": -100, // this sets the plotting yMin
	"yMax": 600, // this sets the plotting yMax
	"dType": "continuous",
	"scalar": 0.1,
	"yAxisLab": "Biomass (Mg/ha)",
    "tmsURL": "http://emapr.ceoas.oregonstate.edu/pages/data/vis/tms/waorca-biomass/crm", //"./tms/waorca-biomass/crm", //"./biomass_tws_z11", 
    "metaDataURL": "http://ltweb.ceoas.oregonstate.edu/ltbiomass_metadata.html",
    "id": "biomassLI",
    "dataPath": "/data/maps/WAORCA_biomass/crm/default.vrt",
	"legendPath": "./imgs/biomass.svg"
}
var lastActiveSection = 'singleYearContainer' // tracker for whatever section of the menu was last active - default to single year display
var mapList = ['map', 'flickerMap', 'map1', 'map2', 'map3']
var lyrGroups = {
	"map":{"base":{},"data":{},"overlay":{}},
	"flickerMap":{"base":{},"data":{},"overlay":{}},
	"map1":{"base":{},"data":{},"overlay":{}},
	"map2":{"base":{},"data":{},"overlay":{}},
	"map3":{"base":{},"data":{},"overlay":{}},
}


var lyr1
var lyr2
var flickerClean = 1
var drawControl = 0
var clean = {
    "flicker": 1,
    "split": 1,
    "swipe": 1,
}

$('#clickMap').delay(3000).fadeOut('slow');


$('#download').click(function(){
	console.log('im in')
	$('#downloadModal').show()
})







//############################################################################################################################################			
//############### FUNCTIONS FOR MANAGING TILE LAYERS  \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/
//############################################################################################################################################	

// this function fetches a new tile layer for a given dataset and year
function getDataTileLyr(year){
	var lyr = L.tileLayer(dataSet.tmsURL + '/' + year.toString() + '/{z}/{x}/{y}.png', {
        tms: true,
        opacity: 1,
        attribution: "",
        maxNativeZoom: 11,
        maxZoom: 13
    });
	return(lyr);
}


// this function removes old tiles that have accumulated past a certain number
function removeOldTiles(){
	mapList.forEach(function(key){   //for(key in lyrGroups){
		var dataLayers = lyrGroups[key].data.getLayers()
		if(dataLayers.length > 2){ // TODO: if you change the year fast with arrow, the loading can't keep up - could set this value higher, or put a timer on the remove layer function in next line
			for(var i=0; i<(dataLayers.length-2); i++){
				lyrGroups[key].data.removeLayer(dataLayers[i])
			};
		//console.log('n layers: '+lyrGroups[key].data.getLayers().length.toString())		
		};
	})
};


// function to update opacity of data tiles when opacity slider is changed - 
function updateOpacity(){
	var opacity = $("#alphaSlider").val();
	mapList.forEach(function(key){              //for(key in lyrGroups){
		lyrGroups[key].data.eachLayer(function (layer){  // TODO: this is throwing errors until all keys have data groups - right now only single and flicker do
			layer.setOpacity(opacity); 
		});
	});
};


// update opacity when the opacity slider is moved 
$("#alphaSlider").change(function(){
	updateOpacity();
});


// show hide the layer legend
$("#legendControl").click(function() {
	$("#legendHolder").toggle( "fast", function(){});
});


// if year is moved - update the map for the open activity
function redrawMap(slider){
	var lateYear = $(".lateYear").first().val();
	var earlyYear = $(".earlyYear").first().val();
	if(slider == 'late' | slider == 'both'){
		['map', 'flickerMap', 'map2'].forEach(function(key){
			var lateLayer = getDataTileLyr(lateYear);
			lateLayer.addTo(lyrGroups[key].data);
		});
	}
	if(slider == 'early' | slider == 'both'){
		['flickerMap', 'map1'].forEach(function(key){
			var earlyLayer = getDataTileLyr(earlyYear);
			earlyLayer.addTo(lyrGroups[key].data);
		});
	}
	
	['map3'].forEach(function(key){
		var earlyLayer = getDataTileLyr(earlyYear);
		var lateLayer = getDataTileLyr(lateYear);
		earlyLayer.addTo(lyrGroups[key].data);
		lateLayer.addTo(lyrGroups[key].data);
	});

	removeOldTiles();
	updateOpacity();

	var dataLayers = lyrGroups.map3.data.getLayers()
	var leftSwipe = dataLayers[0]
	var rightSwipe = dataLayers[1]
	sideBySide.setLeftLayers(leftSwipe);
    sideBySide.setRightLayers(rightSwipe);
}



//############################################################################################################################################
//############### FUNCTIONS FOR MANAGING TILE LAYERS  /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\
//############################################################################################################################################




//############################################################################################################################################			
//############### ADD YEAR SLIDERS TO PAGE ON READY AND SYNC YEAR SLIDERS  \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/
//############################################################################################################################################	

// add year sliders to html
var sideBySide;
$(document).ready(function() {
	// get min and max year of dataset
	var minYear = dataSet.minYear.toString()
	var maxYear = dataSet.maxYear.toString()
	
	// make html input range elements to insert when page loads
	var earlyYearHTML = '<div class="slidecontainer">\
							<input class="slider dataYear earlyYear" type="range" min="'+minYear+'" max="'+maxYear+'" value="'+minYear+'">\
							<p class="sliderLabel">Year: <span class="earlyYearSpan">'+minYear+'</span></p>\
						 </div>'

	var lateYearHTML = '<div class="slidecontainer">\
							<input class="slider dataYear lateYear" type="range" min="'+minYear+'" max="'+maxYear+'" value="'+maxYear+'">\
							<p class="sliderLabel">Year: <span class="lateYearSpan">'+maxYear+'</span></p>\
						</div>'
	
	// prepend the sliders to the page
	$(".singleYear").prepend(lateYearHTML)
	$(".multiYear").prepend(lateYearHTML).prepend(earlyYearHTML)
	
	// now that we have sliders and the first year - draw a map
	makeDataLyrGroups();
	lyrGroups.map.data.addTo(map);
	lyrGroups.flickerMap.data.addTo(flickerMap);
	lyrGroups.map1.data.addTo(map1);
	lyrGroups.map2.data.addTo(map2);
	lyrGroups.map3.data.addTo(map3);

	var swipeLayers = lyrGroups.map3.data.getLayers()
	var leftSwipe = swipeLayers[0]
	var rightSwipe = swipeLayers[1]
	sideBySide = L.control.sideBySide(leftSwipe, rightSwipe);
	sideBySide.addTo(map3);

	$("#dataSelectContainer").addClass('w3-show');
	$("#singleYearContainer").addClass('w3-show');
});


function updateYearLabel(labelID, year){
	$(labelID).html(year);
}

// update the late year values for all late year sliders when any late year slider is changed - note that the singe year is .lateYear class
var leftYearContainers = ["singleYearContainer", "flickerContainer"]
var bothYearContainers = ["splitContainer", "swipeContainer"]
$(document).on("change", ".lateYear", function(){
	var year = $(this).val()
	$(".lateYear").val(year);
	$(".lateYearSpan").html(year);
	redrawMap('late')
	// figure out what year label to update - left or right
	if(leftYearContainers.indexOf(lastActiveSection) >= 0){
		updateYearLabel("#leftYear", year);
	} else if(bothYearContainers.indexOf(lastActiveSection) >= 0){
		updateYearLabel("#rightYear", year);
	}
});

// update the early value for all early year sliders when any early year slider is changed
$(document).on("change", ".earlyYear", function(){
	var year = $(this).val()
	$(".earlyYear").val(year);
	$(".earlyYearSpan").html(year);
	redrawMap('early')
	updateYearLabel("#leftYear", year);
});

// if any year changes stop flicker if it is running (even if not running it will try anyway)
$(document).on("change", ".dataYear", function(){
	stopFlicker();
});


//############################################################################################################################################
//############### ADD YEAR SLIDERS TO PAGE ON READY AND SYNC YEAR SLIDERS  /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\
//############################################################################################################################################




//############################################################################################################################################			
//############### SWITCHING DATASETS  \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/
//############################################################################################################################################			


// this object will be retrieved from the server when page is loading - it will tell us what data is available and how to get it and set the interface
var dataSets = [{
    "name": "Biomass",
    "minYear": 1990,
    "maxYear": 2012,
	"yMin": -100, // this sets the plotting yMin
	"yMax": 6000, // this sets the plotting yMax
	"dType": "continuous",
	"scalar": 0.1,
	"yAxisLab": "Biomass (Mg/ha)",
    "tmsURL": "http://emapr.ceoas.oregonstate.edu/pages/data/vis/tms/waorca-biomass/crm", //./tms/waorca-biomass/crm", //"./biomass_tws_z11", 
    "metaDataURL": "http://emapr.ceoas.oregonstate.edu/metadata.html",
    "id": "biomassLI",
    "dataPath": "/data/maps/WAORCA_biomass/crm/default.vrt",
	"legendPath": "./imgs/biomass.svg"
}, {
    "name": "Canopy Cover",
    "minYear": 1990,
    "maxYear": 2012,
	"yMin": 0, // this sets the plotting yMin
	"yMax": 100, // this sets the plotting yMax
	"dType": "continuous",
	"scalar": 1,
	"yAxisLab": "Canopy Cover (%)",
    "tmsURL": "http://emapr.ceoas.oregonstate.edu/pages/data/vis/tms/waorca-pystem/canopycover", //./tms/waorca-biomass/crm", //"./biomass_tws_z11", 
    "metaDataURL": "http://emapr.ceoas.oregonstate.edu/metadata.html",
    "id": "canopycoverLI",
    "dataPath": "/data/maps/WAORCA_pystem/canopycover/default.vrt",
	"legendPath": "./imgs/canopy.svg"
}, {
    "name": "Impervious Cover",
    "minYear": 1990,
    "maxYear": 2012,
	"yMin": 0, // this sets the plotting yMin
	"yMax": 100, // this sets the plotting yMax
	"dType": "continuous",
	"scalar": 1,
	"yAxisLab": "Impervious Cover (%)",
    "tmsURL": "http://emapr.ceoas.oregonstate.edu/pages/data/vis/tms/waorca-pystem/impervcover", //./tms/waorca-biomass/crm", //"./biomass_tws_z11", 
    "metaDataURL": "http://emapr.ceoas.oregonstate.edu/metadata.html",
    "id": "impervcoverLI",
    "dataPath": "/data/maps/WAORCA_pystem/impervcover/default.vrt",
	"legendPath": "./imgs/imperv.svg"
}, {
    "name": "Land Cover",
    "minYear": 1990, // min year in the series
    "maxYear": 2012, // max year in the series
	"yMin": 0, // this sets the plotting yMin
	"yMax": 100, // this sets the plotting yMax
	"dType": "categorical", // the data type
	"scalar": null,
	"yAxisLab": "Land Cover Class",
    "tmsURL": "http://emapr.ceoas.oregonstate.edu/pages/data/vis/tms/waorca-pystem/landcover", //"./tms/waorca-pystem/landcover", //"./landcover_tws_z11",
    "metaDataURL": "http://emapr.ceoas.oregonstate.edu/metadata.html",
    "id": "landcoverLI", // the <li> id under the Select Data Layer section
    "dataPath": "/data/maps/WAORCA_pystem/landcover/default.vrt",
	"plotDisplay": {
		11:{color:'#476ba1', label:'Open Water'},
		12:{color:'#d1defa', label:'Perennial Ice/Snow'},
		21:{color:'#decaca', label:'Developed, Open Space'},
		22:{color:'#d99482', label:'Developed, Low Intensity'},
		23:{color:'#ee0000', label:'Developed, Medium Intensity'},
		24:{color:'#ab0000', label:'Developed High Intensity'},
		31:{color:'#b3aea3', label:'Barren Land (Rock/Sand/Clay)'},
		41:{color:'#68ab63', label:'Deciduous Forest'},
		42:{color:'#1c6330', label:'Evergreen Forest'},
		43:{color:'#b5ca8f', label:'Mixed Forest'},
		51:{color:'#a68c30', label:'Dwarf Scrub'},
		52:{color:'#ccba7d', label:'Shrub/Scrub'},
		71:{color:'#e3e3c2', label:'Grassland/Herbaceous'},
		72:{color:'#caca78', label:'Sedge/Herbaceous'},
		73:{color:'#99c247', label:'Lichens'},
		74:{color:'#78ae94', label:'Moss'},
		81:{color:'#dcd93d', label:'Pasture/Hay'},
		82:{color:'#ab7028', label:'Cultivated Crops'},
		90:{color:'#bad9eb', label:'Woody Wetlands'},
		95:{color:'#70a3ba', label:'Emergent Herbaceous Wetlands'}
	},
	"markerSize": '20',
	"legendPath": "./imgs/landcover.svg"
}]




// handler for when a base layer is selected
$(".baseList").click(function(){
	$(".baseList").prop("checked", false)
	$(this).prop("checked", true)
	var index = $(this).parent().index()
	mapList.forEach(function(key){
		var baseLayers = lyrGroups[key].base.getLayers()
		lyrGroups[key].base.eachLayer(function (layer){
			layer.setOpacity(0); 
		});
		baseLayers[index].setOpacity(1)
	});
});


// a function to return the the dataset object for the data set that was clicked on in the dataset menu
function getDataSetClicked(id) {
    for (var i = 0; i < dataSets.length; i++) {
        if (dataSets[i].id == id) {
            return dataSets[i]
        }
    }
}


// load the datasets into the list element
$(document).ready(function() {
    for (var i = 0; i < dataSets.length; i++) {
        var dataInfo = dataSets[i]
        var value1 = dataInfo.id; //NEW
        var queryString = "?para1=" + value1; //NEW
        if (i == 0) { // the first entry is the data type to be displayed and "checked" by default - this if true will check the check box
			$("#dataList").append('<div><input id="'+dataInfo.id+'" class="radio-input dataList" type="radio" value="Street" checked><label class="radio-label"> '+dataInfo.name+'</label><a href='+dataInfo.metaDataURL+ queryString +', target="_blank","width="+innerWidth+"px, height=750px", "toolbar=0","titlebar=0","menubar=0","scrollbars=yes"><i class="fa fa-question-circle w3-right" style="margin-top: 4px; vertical-align: top; aria-hidden="true"></i></a></div>')
        } else {
			$("#dataList").append('<div><input id="'+dataInfo.id+'" class="radio-input dataList" type="radio" value="Street"><label class="radio-label"> '+dataInfo.name+'</label><a href='+dataInfo.metaDataURL+ queryString +', target="_blank","width="+innerWidth+"px, height=750px", "toolbar=0","titlebar=0","menubar=0","scrollbars=yes"><i class="fa fa-question-circle w3-right" style="margin-top: 4px; vertical-align: top; aria-hidden="true"></i></a></div>')
        }
    }
})



// https://stackoverflow.com/questions/10920355/attaching-click-event-to-a-jquery-object-not-yet-added-to-the-dom
$(document).on("click", ".dataList", function() {
	hidePlot();
	$(".dataList").prop("checked", false)
	$(this).prop("checked", true)

	// set the new dataSet
	dataSet = getDataSetClicked($(this).attr('id'))
	
	// update the legend
	$("#legend").attr("src", dataSet.legendPath)
	
	// update the tileURL - TODO: we don't need this, we can just call dataSet.tmsURL
	tileURL = dataSet.tmsURL
	
	//TODO: need to update year sliders to min and max year of this selected dataset

	// redraw all the maps (both left (single) side and right side maps)
	redrawMap('both');
})


// SET YEAR SLIDER MIN AND MAX
function setMinMax() {
	//<input type="number" max="???" min="???" step="0.5" id="myInput"/>
	// TODO: function to get the min and max from a json file or yml
	// ... returns an object with min and max

	// TODO: make sure that these all have a class and just call this once on the class - I think $(".slider.year") will work
	
	//$(".lateYear").attr({"value": year}); // this could also be prop
	$("#year").attr({
		"min": yr.min,
		"max": yr.max
	});
	$("#yearFlick1").attr({
		"min": yr.min,
		"max": yr.max
	});
	$("#yearFlick2").attr({
		"min": yr.min,
		"max": yr.max
	});
}





//############################################################################################################################################			
//############### SWITCHING DATASETS /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\
//############################################################################################################################################			




//############################################################################################################################################			
//############### SWITCHING OVERLAYS  \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/
//############################################################################################################################################

// https://stackoverflow.com/questions/10920355/attaching-click-event-to-a-jquery-object-not-yet-added-to-the-dom
var polyPointerDirty = 0
$(document).on("click", ".overlayList", function() {
	var rad = $(this)
	if(rad.data('waschecked') == true){
		rad.prop('checked', false);
		rad.data('waschecked', false);
		Object.keys(lyrGroups).forEach(function(key){
			eval(key).removeLayer(overlays[rad.prop('value')].maps[key].layer)
		})
	} else {
		rad.data('waschecked', true);
		Object.keys(lyrGroups).forEach(function(key){
			eval(key).addLayer(overlays[rad.prop('value')].maps[key].layer)
		})
	}
	if(polyPointerDirty == 0){
		$('.leaflet-interactive').css('cursor', 'default')
		polyPointerDirty = 1
	}
});



		






//############################################################################################################################################			
//############### SWITCHING OVERLAYS /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\
//############################################################################################################################################	




//############################################################################################################################################			
//############### SINGLE YEAR HANDLERS  \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/
//############################################################################################################################################

//############################################################################################################################################			
//############### SINGLE YEAR HANDLERS /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\
//############################################################################################################################################


//############################################################################################################################################			
//############### FLICKER HANDLERS  \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/
//############################################################################################################################################

var flicker = 0
// a function to stop flickering and reset the GO! button
function stopFlicker() {
    $("#flicker").removeClass('selected stopColor').addClass('w3-green');
    $("#flicker").html('Start Flicker')
    clearInterval(flickerInter);
};

// handler for when clicking on the flicker go!/stop! button
$("#flicker").click(function(event) {
    event.preventDefault();
    if ($(this).hasClass("selected")) {
        stopFlicker();
    } else {
        $(this).removeClass('w3-green').addClass('selected stopColor');
        $(this).html('Stop Flicker');
        flickerInterval();
    }
});

// handler for when the flicker speed slider changes
$("#flickerSpeed").change(function() {
    if ($("#flicker").hasClass("selected")) {
        var flickerSpeed = $("#flickerSpeed").val();
        clearInterval(flickerInter);
        flickerInterval()
    }
});

// function to start flickering the layers
var flickerInter;
function flickerInterval() {
    orderFlickerLayers();
	var flickerSpeed = $("#flickerSpeed").val();
    flickerInter = setInterval(function() {
        runFlicker()
    }, flickerSpeed);
}


// reset the order of layers so that late year is on top or early year
function orderFlickerLayers(){
	var earlyYear = $(".earlyYear").first().val();
	var lateYear = $(".lateYear").first().val();
	var earlyLayer = getDataTileLyr(earlyYear);
	var lateLayer = getDataTileLyr(lateYear);
	earlyLayer.addTo(lyrGroups.flickerMap.data);
	lateLayer.addTo(lyrGroups.flickerMap.data);
	updateYearLabel("#leftYear", $(".lateYear").first().val());
	removeOldTiles();
	updateOpacity();
	
}


// function to turn set and remove transparency
function runFlicker() {
	var year
	if (flicker == 0) {
        flicker = $("#alphaSlider").val();
		year = $(".lateYear").first().val();
    } else {
        flicker = 0
		year = $(".earlyYear").first().val();
    }
	updateYearLabel("#leftYear", year);
	lyrGroups.flickerMap.data.getLayers()[1].setOpacity(flicker);
}

//############################################################################################################################################			
//############### FLICKER HANDLERS /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\
//############################################################################################################################################




//############################################################################################################################################			
//############### SWIPE HANDLERS  \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/
//############################################################################################################################################


$("#yearSwipe1").change(function() {
    //var year = $(this).val()
    //lyr1 = L.tileLayer(tileURL+'/'+year+'/{z}/{x}/{y}.png', {tms: true, opacity: 1, attribution: "", maxNativeZoom: 11, maxZoom: 13}); // depends on global variable here - not
    swipe()
});

$("#yearSwipe2").change(function() {
    //var year = $(this).val()
    //lyr2 = L.tileLayer(tileURL+'/'+year+'/{z}/{x}/{y}.png', {tms: true, opacity: 1, attribution: "", maxNativeZoom: 11, maxZoom: 13}); // depends on global variable here - not
    swipe()
});


//https://github.com/digidem/leaflet-side-by-side/issues/11

function swipe() {
    var year1 = $("#yearSwipe1").val();
    var year2 = $("#yearSwipe2").val();
    leftSwipe = L.tileLayer(tileURL + '/' + year1 + '/{z}/{x}/{y}.png', {
        tms: true,
        opacity: 1,
        attribution: "",
        maxNativeZoom: 11,
        maxZoom: 13
    });
    rightSwipe = L.tileLayer(tileURL + '/' + year2 + '/{z}/{x}/{y}.png', {
        tms: true,
        opacity: 1,
        attribution: "",
        maxNativeZoom: 11,
        maxZoom: 13
    });

    map3.removeLayer(leftSwipe);
    map3.removeLayer(rightSwipe);
    map3.addLayer(leftSwipe);
    map3.addLayer(rightSwipe);
    sideBySide.setLeftLayers(leftSwipe);
    sideBySide.setRightLayers(rightSwipe);
};


//############################################################################################################################################			
//############### SPLIT HANDLERS /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\
//############################################################################################################################################

// TODO: this needs to change names
function clearMapTileLayers() {
    stopFlicker(); // stop the flickering and reset the button if we change sections - do it regardless - should check to see if it was the previous open or actively flickering
    if (drawControl == 1) {
        map.removeControl(drawControl);
    }
}

function initializeYearLabel(label){
	if(label == "left"){
		$("#rightYear").hide();
		$("#leftYear").show();
		updateYearLabel("#leftYear", $(".lateYear").first().val());
	} else if(label == "both"){
		$("#rightYear").show();
		$("#leftYear").show();
		updateYearLabel("#leftYear", $(".earlyYear").first().val());
		updateYearLabel("#rightYear", $(".lateYear").first().val());
	}
}

function displayHandler(id, repeat = false){
    clearMapTileLayers();
	switch (id) {
        case 'singleYearContainer':
            if(lastActiveSection == id & repeat == false){
				return
            }
            $("#map").removeClass('hide').addClass('show');
            $("#flickerMap, #map1, #map2, #map3").removeClass('show').addClass('hide');
			initializeYearLabel("left")
            break;
        case 'flickerContainer':
            if(lastActiveSection == id & repeat == false){
				return
            }
            $("#flickerMap").removeClass('hide').addClass('show');
            $("#map, #map1, #map2, #map3").removeClass('show').addClass('hide');
            initializeYearLabel("left")
			break;
        case 'splitContainer':
            if (lastActiveSection == id & repeat == false) {
                return
            }
			$("#map1, #map2").removeClass('hide').addClass('show');
            $("#map, #flickerMap, #map3").removeClass('show').addClass('hide');
            initializeYearLabel("both")
			break;
        case 'swipeContainer':
            if (lastActiveSection == id & repeat == false) {
                return
            }
			$("#map3").removeClass('hide').addClass('show');
            $("#map, #flickerMap, #map1, #map2").removeClass('show').addClass('hide');
            initializeYearLabel("both")
			//swipe()
            break;
        case 'multiPointContainer':
            if (lastActiveSection == id & repeat == false) {
                return
            }

                // clear the maps and layers
            $("#map").removeClass('hide').addClass('show');
            $("#map1, #map2").removeClass('show').addClass('hide');
            $("#map3").removeClass('show').addClass('hide');
            clearMapTileLayers();
            var year = $("#year").val()
            lyr = L.tileLayer(tileURL + '/' + year + '/{z}/{x}/{y}.png', {
                tms: true,
                opacity: 1,
                attribution: "",
                maxNativeZoom: 11,
                maxZoom: 13
            });
            map.addLayer(lyr);
            map.addControl(drawControl);
            drawControl = 1
            break;
    }
}





// show hide sections
$('.layerButton').click(function() {
	/*var el = $(this).next('.layerContainer')
	if(el.hasClass('w3-show')){
		el.removeClass('w3-show')
	} else{ 
		el.addClass('w3-show')
	}*/
	if($(this).next('.layerContainer').hasClass('w3-show')){
		$(this).next('.layerContainer').removeClass('w3-show')
	} else{
		$('.layerContainer').removeClass('w3-show')
		$(this).next('.layerContainer').addClass('w3-show')
	}
});
	


// DO STUFF WHEN A SECTION BUTTON IS PRESSED
$('.activityButton').click(function() {
    // show/hide the contents of the sections
    $('.sectionContainer').removeClass('w3-show')
    $(this).next('.sectionContainer').addClass('w3-show')

    // do a default action for each section
    var id = $(this).next('.sectionContainer').attr('id')
    displayHandler(id, repeat = false)
    lastActiveSection = id
})




// HANDLER FOR CLICKING ON THE PLOT EXIT BUTTON
function hidePlot(){
	$("#plot").hide();
}

$("#hidePlot").click(function() {
	hidePlot()
	//if ($("#plot").is(":visible")) {
    //   $("#plot").hide();
    //} else {
    //    $("#plot").show();
    //}
});



// CHANGE DISPLAY WHEN DATA YEARS CHANGE			
var a= $(".slider").on("input", function() { // Peter added the a var
    var year = $(this).val()
    $(this).siblings(".sliderLabel").children('span').html(year)
});







//############################################################################################################################################			
//############### MAKE EACH LEAFLET MAP  \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/
//############################################################################################################################################

// define the L.map options
var mapOptions = {
	center: [44.190762, -122.553686],  //TODO: this depends on the dataset - it needs to be an attribute of the object
	zoom: 10,
	minZoom: 0,
	maxZoom: 13,
	zoomControl: false
};

// function to make a leaflet map and bind it to a div element
function makeMap(id, options){
	return L.map(id, options)
};

// make the maps and set them a global variables so other functions can access them
var map = makeMap('map', mapOptions)
var flickerMap = makeMap('flickerMap', mapOptions)
var map1 = makeMap('map1', mapOptions)
var map2 = makeMap('map2', mapOptions)
var map3 = makeMap('map3', mapOptions)

// add scale bar
L.control.scale().addTo(map)
L.control.scale().addTo(flickerMap)
L.control.scale().addTo(map1)
L.control.scale().addTo(map3)

//############################################################################################################################################			
//############### MAKE EACH LEAFLET MAP /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\
//############################################################################################################################################





//############################################################################################################################################			
//############### MAKE BASELAYER GROUP FOR EACH MAP  \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/
//############################################################################################################################################

function makeBaseLyrGroups(){
	for(var key in lyrGroups){
		var osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			//attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		});

		var Esri_NatGeoWorldMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
			//attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
		});

		var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
			//attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
		});
		
		lyrGroups[key].base = L.layerGroup([Esri_WorldImagery, Esri_NatGeoWorldMap, osm])
	};
};


// function to initialize the data layer group per map - it gets called after the year sliders are added
function makeDataLyrGroups(){
	var earlyYear = $(".earlyYear").first().val();
	var lateYear = $(".lateYear").first().val();
	for(var key in lyrGroups){
		if(key == 'map'){
			var lateLayer = getDataTileLyr(lateYear);
			lyrGroups[key].data = L.layerGroup([lateLayer]);
		} else if(key == 'flickerMap'){
			var earlyLayer = getDataTileLyr(earlyYear);
			var lateLayer = getDataTileLyr(lateYear);
			lyrGroups[key].data = L.layerGroup([earlyLayer,lateLayer]);
		} else if(key == 'map1'){
			var earlyLayer = getDataTileLyr(earlyYear);
			lyrGroups[key].data = L.layerGroup([earlyLayer]);
		} else if(key == 'map2'){
			var lateLayer = getDataTileLyr(lateYear);
			lyrGroups[key].data = L.layerGroup([lateLayer]);
		} else if(key == 'map3'){
			var earlyLayer = getDataTileLyr(earlyYear);
			var lateLayer = getDataTileLyr(lateYear);
			lyrGroups[key].data = L.layerGroup([earlyLayer,lateLayer]);
		};
	};
};

makeBaseLyrGroups();

// add the base layer group to maps 
lyrGroups.map.base.addTo(map);
lyrGroups.flickerMap.base.addTo(flickerMap);
lyrGroups.map1.base.addTo(map1);
lyrGroups.map2.base.addTo(map2);
lyrGroups.map3.base.addTo(map3);








// THIS IS STUFF FOR THE OVERLAYS
var overlays = {"ard":{"maps":{}, "path":"", "name":"ARD", "label":"TileID"}}

// function to initialize the overlay layer group per map
function makeOverlayLyrGroups(){
	for(var key in lyrGroups){
		// create the ardLayer
		var ardLayer = L.geoJSON(ard, {
			onEachFeature: function (feature, layer) {
			//layer.bindTooltip(feature.properties.name, {permanent: true, direction: 'center'})//.openTooltip();	
			//layer.bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');
			var label = '<pre>'+JSON.stringify(feature.properties.ARD_tile,null,' ').replace(/[\{\}"]/g,'')+'</pre>'
			//layer.bindPopup(label);
			layer['label'] = label
			},
			"fillOpacity": 0,
			"opacity": 1
		});
		overlays.ard.maps[key] = {'layer':ardLayer}
	}
}

makeOverlayLyrGroups();


// handler for toggling the polygon labels on and off
$(".labelToggle").on('click', function(){
	var el = $(this)
	var overlay = el.siblings('input').prop('value')
	if(el.hasClass('fa-comment-o')){
		hidePlot();
		el.removeClass('fa-comment-o').addClass('fa-comment')
		$('.leaflet-interactive').css('cursor', 'pointer')
		Object.keys(lyrGroups).forEach(function(key){
			overlays[overlay].maps[key].layer.eachLayer(function(layer){
				layer.bindPopup(layer.label);
			});
		});		
	} else{
		el.removeClass('fa-comment').addClass('fa-comment-o')
		$('.leaflet-interactive').css('cursor', 'default')
		Object.keys(lyrGroups).forEach(function(key){
			overlays[overlay].maps[key].layer.eachLayer(function(layer){
				layer.unbindPopup();
			});
		});
	}
});


//############################################################################################################################################			
//############### MAKE BASELAYER GROUP FOR EACH MAP /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\
//############################################################################################################################################


map.sync(flickerMap)
map.sync(map1);
map.sync(map2);
map.sync(map3);

flickerMap.sync(map);
flickerMap.sync(map1);
flickerMap.sync(map2);
flickerMap.sync(map3);


map1.sync(map);
map1.sync(flickerMap);
map1.sync(map2, {syncCursor: true});
map1.sync(map3);

map2.sync(map);
map2.sync(flickerMap);
map2.sync(map1, {syncCursor: true});
map2.sync(map3);

map3.sync(map);
map3.sync(flickerMap);
map3.sync(map1);
map3.sync(map2);




/*
var leftSwipe = getDataTileLyr(1990)
var rightSwipe = getDataTileLyr(2012)

console.log(leftSwipe)
console.log(rightSwipe)
sideBySide = L.control.sideBySide(leftSwipe, rightSwipe);
sideBySide.addTo(map3);
*/

//var marker = L.marker([44.190762, -122.553686]).addTo(map);

// ...add drawn feature group
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// ...make the draw toolbar
var drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
        rectangle: false,
        polyline: false,
        polygon: false,
        circle: false,
        marker: false
    },
    edit: {
        featureGroup: drawnItems,
        remove: true
    }
});

map.on("layeradd", function(event) {
    drawnItems.bringToFront();
});


map.on(L.Draw.Event.CREATED, function(e) {
    var layer = e.layer;
    drawnItems.addLayer(layer);
});


//map.addControl(drawControl);


//############################################################################################################################################			
//############### DRAW STUFF  \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/
//############################################################################################################################################


//############################################################################################################################################			
//############### DRAW STUFF /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\
//############################################################################################################################################



var multiTrace = []
var multiTraceColor = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c"]

function plotMultiTimeSeriesData(coords) {
    if (multiTrace.length >= 6) {
        return
    }
    if ($("#plot").not(":visible")) {
        $("#plot").show();
    }

    var ts
    $.post("request_handler_test.php", coords, function(data, status) {
        var data = JSON.parse(data);
        var trace = {
            x: data.yr,
            y: data.ts,
            type: 'scatter',
            line: {
                color: multiTraceColor[multiTrace.length], //'#498AF3', //'#D62851',
                width: '4'
            }
        };

        multiTrace.push(trace)
        var layout = {
            showlegend: false,
            paper_bgcolor: 'rgba(255,255,255,0)',
            plot_bgcolor: 'rgba(255,255,255,0)',
            width: 800,
            height: 170,
            margin: {
                l: 45,
                r: 10,
                t: 10,
                b: 30
            },
            xaxis: {
                gridcolor: '#545454'
            },
            yaxis: {
                range: [-100, 6000],
                gridcolor: '#545454'
            }
        };

        Plotly.newPlot('plot', multiTrace, layout, {
            scrollZoom: true,
            displaylogo: false,
            displayModeBar: false
        });
    });
}


map.on('draw:created', function(e) {
    var type = e.layerType
    if (type === 'circlemarker') {
        e.layer.setStyle({
            fillColor: multiTraceColor[multiTrace.length],
            color: multiTraceColor[multiTrace.length],
            opacity: 1,
            fillOpacity: 0,
            radius: 6

        });


        var lon = e.layer.getLatLng().lng
        var lat = e.layer.getLatLng().lat
        plotMultiTimeSeriesData({
            'lon': lon,
            'lat': lat
        })
    }
})


// Peter addition
var info = L.control();

info.onAdd = function(map) {
	this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
	this.update();
	return this._div;
};

info.update = function() {
	this._div.innerHTML = a.val();


};

info.addTo(map);
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^