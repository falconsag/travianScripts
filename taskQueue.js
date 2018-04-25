// ==UserScript==
// @name        Sajat Task Queue
// @namespace   http://greasyfork.org/users/6214-adipiciu
// @author      adipiciu (based on TTQ by Risi and further edited by Nevam and then Pimp Trizkit and Serj_LV)
// @license     GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @description Schedule delayed constructions, upgrades and attacks.
// @contributionURL https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=56E2JM7DNDHGQ&item_name=TTQ4+script&currency_code=EUR
// @include     *://*.travian.*
// @include     *://*/*.travian.*
// @exclude     *://*.travian*.*/hilfe.php*
// @exclude     *://*.travian*.*/index.php*
// @exclude     *://*.travian*.*/anleitung.php*
// @exclude     *://*.travian*.*/impressum.php*
// @exclude     *://*.travian*.*/anmelden.php*
// @exclude     *://*.travian*.*/gutscheine.php*
// @exclude     *://*.travian*.*/spielregeln.php*
// @exclude     *://*.travian*.*/links.php*
// @exclude     *://*.travian*.*/geschichte.php*
// @exclude     *://*.travian*.*/tutorial.php*
// @exclude     *://*.travian*.*/manual.php*
// @exclude     *://*.travian*.*/ajax.php*
// @exclude     *://*.travian*.*/ad/*
// @exclude     *://*.travian*.*/chat/*
// @exclude     *://wbb.forum.travian*.*
// @exclude     *://*.travian*.*/activate.php*
// @exclude     *://*.travian*.*/support.php*
// @exclude     *://help.travian*.*
// @exclude     *://*.answers.travian*.*
// @exclude     *.css
// @exclude     *.js

// @version     1.5.2
// ==/UserScript==

(function () {

	var USE_SMART_RESOURCE_SCALING = 0; //leskálázzuk egyenletesen a nyersi küldést annyira amennyit tud a falu maxon
										//pl 200k, 200k, 200k, 200k és a falu tud össz 100k-t akkor 25k megy mindenből
										//viszont ez nem lesz teljesen jó mert ha nagyon sokat kell szállítani, nagyon le lesz skálázva
										//holott tudna többet is vinni pl:
										// 500k, 500k, 100k, 100k faluban van 80k, 10k, 10k, 10k ilyen alig 30-40k fog menni fából
	var AUTOMATIC_BUILD_SCHEDULE = 0;
	var RAISE_ALERT_ON_MERCHANT_ERROR = 0;
	var ADD_FAILED_BUILD_TO_HISTORY = 0;
	var LOG_LEVEL = 0; // 0 - quiet, 1 - nearly quite, 2 - verbose, 3 - detailed
	// How often do we check for tasks to trigger in seconds. Default is 10 secs.
	// Low value = high accuracy in triggering tasks. To make your browser unresponsive, set this to some ridiculously small number.
	// You probably do not want to tamper with this setting. As many things in TTQ-T4 are assuming its set to 10 seconds.
	var CHECK_TASKS_EVERY = 30;

	var merchantTimes = [16, 12, 24, 0, 0, 16, 20];
    var iresNow = [];
    var income = [];
    var incomepersecond = [];
    var fullRes = [];
    function toNumber(aValue) {return parseInt(aValue.replace(/\W/g, "").replace(/\s/g, ""));}
    function isNumeric(n) { return !isNaN(parseFloat(n)) && isFinite(n); }
    function insertAfter(node, rN) {rN.parentNode.insertBefore(node, rN.nextSibling);}
    function $g(aID,aDoc) {
		//CUSTOMIZED
		//can get element from given aDoc if defined instead of document
		if(aID != ''){
			if( typeof aDoc === 'undefined' || aDoc === null ){
				return document.getElementById(aID);
			}
			return aDoc.getElementById(aID);
		}
		return null;
	}
	function $sel(name, size) {
		var el = document.createElement('select');
		el.setAttribute('multiple', 'multiple');
        el.setAttribute('name', name);
        el.setAttribute('size', size);
        return el;
    }
    function $opt(labelName,labelValue){
        var label = document.createTextNode(labelName);
        var opt = document.createElement('option');
        opt.setAttribute('value', labelValue);
        opt.appendChild(label);
        return opt;
    }
    function $gn(aID) {return (aID != '' ? document.getElementsByName(aID) : null);}
    function $gt(str,m) { return (typeof m == 'undefined' ? document:m).getElementsByTagName(str); }
    function $gc(str,m) { return (typeof m == 'undefined' ? document:m).getElementsByClassName(str); }
    function $at(aElem, att) {if (att !== undefined) {for (var xi = 0; xi < att.length; xi++) {aElem.setAttribute(att[xi][0], att[xi][1]); if (att[xi][0].toUpperCase() == 'TITLE') aElem.setAttribute('alt', att[xi][1]);};};}//Acr111-addAttributes
    function $t(iHTML) {return document.createTextNode(iHTML);}
    function $e(nElem, att) {var Elem = document.createElement(nElem); $at(Elem, att); return Elem;}
    function $ee(nElem, oElem, att) {var Elem = $e(nElem, att); if (oElem !== undefined) if( typeof(oElem) == 'object' ) Elem.appendChild(oElem); else Elem.innerHTML = oElem; return Elem;}
    function $c(iHTML, att) { return $ee('TD',iHTML,att); }
    function $a(iHTML, att) { return $ee('A',iHTML,att); }
    function $am(Elem, mElem) { if (mElem !== undefined) for(var i = 0; i < mElem.length; i++) { if( typeof(mElem[i]) == 'object' ) Elem.appendChild(mElem[i]); else Elem.appendChild($t(mElem[i])); } return Elem;}
    function $em(nElem, mElem, att) {var Elem = $e(nElem, att); return $am(Elem, mElem);}
    function $xf(xpath, xpt, startnode, aDoc) {
        var XPFirst = XPathResult.FIRST_ORDERED_NODE_TYPE;
        var XPList = XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE;
        var XPIterate = XPathResult.UNORDERED_NODE_ITERATOR_TYPE;
		var XPResult = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE;
        if (!aDoc) aDoc = document;
        if (!startnode) startnode = document;
        var xpres = XPFirst;
        switch (xpt) {
            case 'i': xpres = XPIterate; break;
            case 'l': xpres = XPList; break;
            case 'r': xpres = XPResult; break;
        };
        var ret = aDoc.evaluate(xpath, startnode, null, xpres, null);
        return (xpres == XPFirst ? ret.singleNodeValue : ret);
    };
function allInOneTTQ () {
notRunYet = false;
var sCurrentVersion = "1.5.2";

//find out if Server errors
var strTitle = document.title;
if ( (strTitle.indexOf("500 ") > -1 ) || (strTitle.indexOf("502 ") > -1 ) || (strTitle.indexOf("503 ") > -1 ) ) {
	window.setTimeout ( function() { window.location.reload(true); }, ttqRandomNumber()*100 );
}

// *** Begin Initialization and Globals ***
/*********************
 *		Settings
 *********************/


// Set this to the server's url to override automatic server detection (i.e. s1.travian.net)
// Don't set it if you're playing on multiple servers simultaneously!
var CURRENT_SERVER = "";
var wfl = false;
var MIN_REFRESH_MINUTES = 8;  // TTQ will refresh every 5 to 10 minutes
var MAX_REFRESH_MINUTES = 16;
var MAX_PLACE_NAMES = 100; // The number of non-player village names it keeps stored. It destroys the oldest when making space.
// RACE and HISTORY LENGTH are set with user accessible menus through the GreaseMonkey icon. As well as a way to fully reset TTQ.
var heroPath = {};
heroPath['02'] = '09';
heroPath['09'] = '08';
heroPath['08'] = '07';
heroPath['07'] = '06';
heroPath['06'] = '05';
heroPath['05'] = '04';
heroPath['04'] = '03';
heroPath['03'] = '02';

/*********************
 *	End of Settings
 *********************/
//-- DO NOT TAMPER WITH THE BELOW
var starttime = Date.now();
var myPlayerID;

// Your local computer time MUST still be correct (both time and date!).
var bUseServerTime = false; //getOption("USE_SERVER_TIME", false, "boolean"); //IMPORTANT!!! If true, you must be using 24-hour format on your server, otherwise there WILL be errors.
var bLocked = false; // for locking the TTQ_TASKS variables
var ttqBusyTask = 0; // for detecting if TTQ is still busy processing a task
var oIntervalReference = null;
var oAnimateTimerIR = null;
jsVoid = 'javaScript:void(0)';
var isTTQLoaded = false;
var isTroopsLoaded = false;
var iSiteId = -6;
var theListeners = [];
var pageElem42 = [
	'side_info', // 0- include profile.
	'content', // 1- main block in center
	'sidebarAfterContent', // 2- right side. include village list, links, quest.
	'servertime' // 3- server time
	];
var pageElem = pageElem42.slice();
/*********************** common library ****************************/

//-- ??? ?????? ?????? ???? ??????????? ??? "????????????" ???????. ????? ?????? ???????????????? ?????????.

function $id(id) { return document.getElementById(id); } // getElementById Helper (shortcut) Function
function $gc(str,m) { return (typeof m == 'undefined' ? document:m).getElementsByClassName(str); }
Number.prototype.NaN0=function() { return isNaN(this) ? 0 : this; }
String.prototype.onlyText = function(){return this.replace(/([\u2000-\u20ff])/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/<[\s\S]+?>/g,'');}
function $gn(aID) {return (aID != '' ? document.getElementsByName(aID) : null);}
function $gt(str,m) { return (typeof m == 'undefined' ? document:m).getElementsByTagName(str); }
function $at(aElem, att) {if (att !== undefined) {for (var xi = 0; xi < att.length; xi++) {aElem.setAttribute(att[xi][0], att[xi][1]); if (att[xi][0].toUpperCase() == 'TITLE') aElem.setAttribute('alt', att[xi][1]);};};}//Acr111-addAttributes
//function $c(iHTML, att) { return $ee('TD',iHTML,att); }
//function $a(iHTML, att) { return $ee('A',iHTML,att); }
function $e(nElem, att) {var Elem = document.createElement(nElem); $at(Elem, att); return Elem;}
function $ee(nElem, oElem, att) {var Elem = $e(nElem,att); if (oElem !== undefined) if( typeof(oElem) == 'object' ) Elem.appendChild(oElem); else Elem.innerHTML = oElem; return Elem;}
//function $em(nElem, mElem, att) {var Elem = document.createElement(nElem); if (mElem !== undefined) for(var i = 0; i < mElem.length; i++) { if( typeof(mElem[i]) == 'object' ) Elem.appendChild(mElem[i]); else Elem.appendChild($t(mElem[i])); } $at(Elem, att); return Elem;}
//function $t(iHTML) {return document.createTextNode(iHTML);}
var cont = $g(pageElem[1]);
var linkVSwitch = [];
var villages_id = [];
var currentActiveVillage = -5;
var villages_count = 0;
var RB = new Object();
	RB.vList = [];
var crtPath = window.location.href;
var fullName = crtPath.match(/^.*\/\/.+\/+?/)[0];

// Custom log function
function _log(level, msg) {
	if (level <= LOG_LEVEL) {
		var nL = $id('_LOG');
		if( ! nL ) {
			nL = $e('DIV',[['id','_LOG']]);
			document.body.appendChild( nL );
		}
		nL.innerHTML += msg + "<br>";
	}
}

function sortArray(arr1,arr2) { return arr1[0] - arr2[0]; }

function xpath(query, object, qt) { // Searches object (or document) for string/regex, returning a list of nodes that satisfy the string/regex
	if( !object ) object = document;
	var type = qt ? XPathResult.FIRST_ORDERED_NODE_TYPE: XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE;
	var ret = document.evaluate(query, object, null, type, null);
	return (qt ? ret.singleNodeValue : ret);
}

/**************************************************************************
 * @param options: [aTask, iCurrentActiveVillage] (optional)  OR sNewdid in case of finding the code for construction.
 ***************************************************************************/
function get(url, callback, options, async) {
	var result = "fail";
	var httpRequest = new XMLHttpRequest();
	if(callback) {
		httpRequest.onreadystatechange = function() {
			result = callback(httpRequest, options);
		};
	}
	if(typeof(async) != 'undefined' && async != null){
		httpRequest.open("GET", url, async);
	}else{
		httpRequest.open("GET", url, true);
	}
	httpRequest.send(null);
	return result;
}

function post(url, data, callback, options,async,subSolution) {
	var result = "fail";
	var httpRequest = new XMLHttpRequest();
	data = encodeURI(data);
	if(typeof(async) != 'undefined' && async != null){
		httpRequest.open("POST", url, async);
	}else{
		httpRequest.open("POST", url, true);
	}
	httpRequest.onreadystatechange = function() {
		if(typeof(subSolution) != 'undefined' && subSolution != null && subSolution == true){
			result = callback(httpRequest, options,subSolution);
		}else{
			result = callback(httpRequest, options)
		}
	};
	httpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=utf-8");
	httpRequest.overrideMimeType("application/xhtml+xml");
	httpRequest.send(data);
	return result;
}

var ajaxToken=false;
function getAjaxToken () {
	if( ajaxToken ) return ajaxToken;
	var aText1 = xpath('//script[contains(text(),"return \'")]', document.head, true);
	if( aText1 ) {
		ajaxToken = aText1.textContent.match(/return.'(.+)'/)[1];
		return ajaxToken;
	}
	var aText = xpath('//script[contains(text(),"ajaxToken")]', document, true);
	if( aText ) eval(aText.textContent.match(/ajaxToken.*/)[0]);
	return ajaxToken;
}
/**************************************************************************
 * Detects the server so we can figure out the language used
 * @returns the servers location
 **************************************************************************/
function detectLanguage() {
	var lang = TTQ_getValue(CURRENT_SERVER+"lang","0");
	if( lang != 0 ) return lang;
	try {
		lang = document.getElementsByName("content-language")[0].getAttribute("content").toLowerCase(); lang = lang.substr(3,5);
	} catch(e) { lang = "en"; }
	return lang;
}

function detectMapSize () {
	var mapSize = getOption("MAP_SIZE", 0, "integer");
	if( mapSize !== 0 ) return mapSize;
	var fullScr = xpath('//script[contains(text(),"TravianDefaults")]',document, true).textContent;
	eval(fullScr);
	mapSize = window.TravianDefaults["Map"]["Size"]["width"];
	setOption("MAP_SIZE", mapSize);
	return mapSize;
}

function processSortedTaskList(element) { $id("ttq_tasklist").appendChild(element[1]); }
function processSortedHistory(element) { $id("ttq_history").appendChild(element[1]); }
// *** trim functions
function trim(str) {
	var	str = str.replace(/^\s\s*/, ''),
		ws = /\s/,
		i = str.length;
	while (ws.test(str.charAt(--i)));
	return str.slice(0, i + 1);
}

// Coordinate Conversion Helper Functions
function coordsXYToZ(x, y) {
	return (1 + (parseInt(x) + mapRadius) + (MapSize * Math.abs(parseInt(y) - mapRadius)));
}

function coordZToXY(z) {
	z = parseInt(z);
	var x = ((z - 1) % MapSize) - mapRadius;
	var y = mapRadius - (parseInt(((z - 1) / MapSize)));
	return [x,y];
}

function getVidFromCoords ( txt ) {
	var xy = new Array;
	if( /coordinateX/.test(txt) ) {
		txt = txt.replace(/([\u2000-\u20ff])/g,'');
		xy[1] = txt.match(/coordinateX.+?(-?\d{1,3})/)[1];
		xy[2] = txt.match(/coordinateY.+?(-?\d{1,3})/)[1];
	} else
		xy = txt.match(/\((-?\d{1,3})\D+?(-?\d{1,3})\)/);
	return xy ? coordsXYToZ(xy[1],xy[2]): -1;
}

// ** Begin Date/Time Block ***
/**************************************************************************
 * @param {int}
 * @return {str} Formatted date.
 ***************************************************************************/
function formatDate(yyyy, mm, dd, hh, min, sec) {
	if(dd < 10) {dd = "0" + dd;}
	if(mm < 10) {mm = "0" + mm;}
	if(min < 10) {min = "0" + min;}
	if(sec < 10) {sec = "0" + sec;}
	return yyyy+"/"+mm+"/"+dd+" "+hh+":"+min+":"+sec;
}
// *** End Date/Time Block ***

/**************************************************************************
 *  This only trims the value read from variables. Variable itself is trimmed when new event is entered into history.
 *  It trimms the value down to maxlength. And returns the array, you can join it if ya need.
 ***************************************************************************/
function ttqTrimData(data, maxlength, asString, token) {
	if ( data.length < 1 || maxlength < 1 || data == '' ) {
		if ( asString ) return "";
		else return new Array();
	}
	if ( typeof(token) == "undefined"  || !token ) var token = "|";
	data = data.split(token+"");
	var excessTasks = data.length - maxlength;
	if(excessTasks >  0) data.splice(0, excessTasks);
	if ( asString ) return data.join(token+"");
	else return data;
}

function TTQ_addStyle(css) {
	var head = document.getElementsByTagName('head')[0];
	if (head) {
		var style = $e("style");
		style.type = "text/css";
		style.appendChild(document.createTextNode(css));
		head.appendChild(style);
	}
}

function TTQ_getValue ( key, defaultValue ) {
	var value = window.localStorage.getItem(key);
	if( value == null ) value = defaultValue;
	return value;
}
function TTQ_setValue( key, value ) {
	window.localStorage.setItem( key, value );
}
function TTQ_deleteValue( key ) {
	window.localStorage.removeItem( key );
}

// *** Begin Storage Block ***
/**************************************************************************
 * Retrieves the value corresponding do the given variable name and the current Travian server
 * Use greasemonkey's built-in system instead of variables to permantenly store and read settings
 * @param name The name of the variable
 * @param defaultValue  default value if name is not found
 ***************************************************************************/
function getVariable(name, defaultValue) {
    if(!defaultValue) { var defaultValue = ''; }
    name = CURRENT_SERVER + myPlayerID + "_" + name;
    var data = TTQ_getValue(name, defaultValue);
    return data;
}

/**************************************************************************
 * Sets the value for the given variable name and the current Travian server
 * Use greasemonkey's built-in system instead of variables to permantenly store and read settings
 * @param name  The name of the variable
 * @param value The value to be assigned
 ***************************************************************************/
function setVariable(name, value) {
    name = CURRENT_SERVER + myPlayerID + "_" + name;
	TTQ_setValue(name, value);
    return true;
}

function setOption(key, value) {
    var options = getVariable('TTQ_OPTIONS', '');
	if(options != '') options = options.split(",");
	else options = [];
    var myOption = options.indexOf(key);
	if(myOption < 0) {
		options.push(key);
		options.push(value);
	} else options[myOption + 1] = value;
    setVariable('TTQ_OPTIONS', options.join(","));
}

/**************************************************************************
 * @param key: name of the parameter in the TTQ_OPTIONS variable
 * @param defaultValue: this is returned if the parameter is not found
 * @param type: if set, type conversion occurs. Values {string, integer, boolean} The conversion occurs only if it is not the defaultValue being returned.
 ***************************************************************************/
function getOption(key, defaultValue, type) {
    var options = getVariable('TTQ_OPTIONS', '');
	options = options.split(",");
	var myOption = options.indexOf(key);
	if(myOption < 0) {return defaultValue;}
	switch(type) {
		case "boolean":
			var myOption = ( options[myOption + 1] == "true") ? true:false;
			break;
		case "integer":
			var myOption = parseInt(options[myOption + 1]);
			break;
		case "string":
		default:
			var myOption = options[myOption + 1];
			break;
	}
    return myOption;
}

function getAllOptions() { //Uses recycled variables
    tA = getVariable('TTQ_OPTIONS', '');
	tA = tA.split(",");
	vName = new Object();
	for ( tX = 0, tY = tA.length ; tX < tY ; tX += 2 ) vName[tA[tX]] = tA[tX+1];
	return vName;
}
// *** End Storage Block ***

function saveODCookie ( nameCoockie, contentCookie ) {
	var newCookie = '';
	for( var i = 0; i < linkVSwitch.length; i++ ) {
		var nd = parseInt(linkVSwitch[i].match(/newdid=(\d+)/)[1]);
		if( contentCookie[nd] !== undefined )
			newCookie += nd + '@_' + contentCookie[nd] + '@#_';
	}
	setVariable(nameCoockie, newCookie);
}

function loadOVCookie ( nameCoockie, contentCookie ) {
	var RCookie = getVariable(nameCoockie,'');
	var oneCookie = [];
	var cCount = 0;
	var Rej = new RegExp("(\\d+)@_(.*?)@#_", 'g');
	while ((oneCookie = Rej.exec(RCookie)) != null) { RB[contentCookie][oneCookie[1]] = oneCookie[2]; cCount++; }
	return cCount;
}

//-- ????????, ????????? ?? ??? ?????, ? ???? ??, ?? ?????????????.
function initialize() {
	if (CURRENT_SERVER != "") return true;
	CURRENT_SERVER = location.hostname + "_";
	_log(1, "Init> Using settings for server '" + CURRENT_SERVER + "'");
	myPlayerID = document.getElementsByClassName("heroImage");
	if ( myPlayerID.length < 1 ) {
		_log(0,"Init> Unknown page. TTQ is not running. Possible Login screen. Attempting Auto-Login in a few seconds...");
		return false;
	}
	myPlayerID = myPlayerID[0];
	return true;
}

var init = initialize();
/*********************
 *		GLOBALS
 *********************/
if (init) {
	var allLangs = ["en","ae","ar","ba","bg","br","cl","cn","cz","de","dk","ee","eg","es","fi","fr","gr","he","il","hk","hr","hu","id","ir","it",
		"jp","kr","lt","lv","mx","my","nl","no","pt","pl","ro","ru","se","rs","sa","si","sk","sy","th","tr","tw","ua","vn"];
    var aLangBuildings = 0;
    var aLangTasks = 0;
    var aLangStrings = 0;
    var aLangMenuOptions = 0;
    var sLang = detectLanguage();

	// Default is English. This is also the array that will be used to replace the zeros (missing words) in the below translations. The Buildings are only used for catapult targeting for now. I hope to get rid of it entirely.
	var nLangBuildings = ["", "Woodcutter", "Clay Pit", "Iron Mine", "Cropland", "Sawmill", "Brickyard", "Iron Foundry", "Grain Mill", "Bakery", "Warehouse", "Granary", "<No Building>", "Smithy", "Tournament Square", "Main Building", "Rally Point", "Marketplace", "Embassy", "Barracks", "Stable", "Workshop", "Academy", "Cranny", "Town Hall", "Residence", "Palace", "Treasury", "Trade Office", "Great Barracks", "Great Stable", "City Wall", "Earth Wall", "Palisade", "Stonemason's Lodge", "Brewery", "Trapper", "Hero's Mansion", "Great Warehouse", "Great Granary", "Wonder Of The World", "Horse Drinking Trough", "Stone Wall", "Makeshift Wall", "Command Center", "Waterworks"];
	var nLangTasks = ["Build", "Upgrade", "Attack", "Research", "Train", "Party", "Demolish", "Send Merchants", "Send Back/Withdraw"];
	var nLangStrings = ["Build later", "Upgrade later", "Unknown Town", "Research later", "Schedule this Task for Later", "We started building ", "<center>HALT!</center><br>Please wait, TTQ is processing this task!<br>Step", "Traps", " build request sent. However, it appears that the building is not building.", "was attempted but the server redirected us.", "The task was scheduled.", "Redirected", "We can't schedule this task right now.", "Error", "Scheduled Tasks", "Delete", "Send later", "No troops were selected.", "Your troops were sent to", "Your troops could not be sent to", "Support", "Attack", "Raid", "Catapults will aim at", "random", "at", "or after", "seconds", "minutes", "hours", "days", "Spy for resources and troops", "Spy for troops and defenses", "away", "The attack cannot be scheduled because no destination was specified.", "at site no.", "Sort by:", "type ", "time ", "target ", "options ", "village ", "Task History", "Flush History", "We started researching ", " cannot be researched.", "Page Failed", "Spy", "train later", "troops.", "... May have not happened!", "We started training ", " cannot be trained.", "Party Later", " but not today.", "We started to ", "Close", "Add/Edit Task Schedule", "Edit and Close", "Add and Close", "Add", "Are you sure you want to [s1] [s2]?", "Demolish Later", "Demolishing", "Cannot demolish", "Invalid coordinates or no resources selected.", "Using Local Time", "Using Server Time", " was attempted but we could not find the link.", " was attempted but failed. Reason: ", "No Link", " was attempted but the building was not found.", "No Building", " was attempted but the server returned an error.", "Server:", "Confirmation Failed", "Sorry, I <b>may</b> have built the building in the wrong town.", "Misbuild:", "Sent Back/Withdrew troops.<br>Troops are going home to:", "Sent Back/Withdrew troops Failed (I think).<br>Troops were supposed to go home to: ", "Click to make this your Active Village." , "Click to see this Village Details screen.", "Timeout or TTQ Crash"];
	var nLangMenuOptions = ["TTQ: ", "Use server time", "Use local time", "Set your tribe", "Task History", "Reset", "\nHow many past tasks do we keep in history?\n(Type 0 to disable task history.) \nCurrently: ", " What is your tribe on this server?\nType 0 for Romans, 1 for Teutons, 2 for Gauls, 5 for Egyptians, 6 for Huns. Or a negative number to enable autodetect (ie: -1)\nCurrently: ", "Are you sure you want to reset all TTQ variables?"];
	// The english troop names are not really needed. But they are provided here in the situation that the the troop name autodetect (rip) does not work. (ie. no rally point)
	var nLangTroops = new Array();
	nLangTroops.push( ["Legionnaire", "Praetorian", "Imperian", "Equites Legati", "Equites Imperatoris", "Equites Caesaris", "Battering Ram", "Fire Catapult", "Senator", "Settler", "Hero", nLangStrings[7]] );
	nLangTroops.push( ["Clubswinger", "Spearman", "Axeman", "Scout", "Paladin", "Teutonic Knight", "Ram", "Catapult", "Chief", "Settler", "Hero", nLangStrings[7]] );
	nLangTroops.push( ["Phalanx", "Swordsman", "Pathfinder", "Theutates Thunder", "Druidrider", "Haeduan", "Ram", "Trebuchet", "Chieftain", "Settler", "Hero", nLangStrings[7]] );
	nLangTroops.push( ["Rat", "Spider", "Snake", "Bat", "Wild Boar", "Wolf", "Bear", "Crocodile", "Tiger", "Elephant"] );
	nLangTroops.push( ["Pikeman", "Thorned Warrior", "Guardsman", "Birds Of Prey", "Axerider", "Natarian Knight", "War Elephant", "Ballista", "Natarian Emperor", "Settler"] );
	nLangTroops.push( ["Slave Militia", "Ash Warden", "Khopesh Warrior", "Sopdu Explorer", "Anhur Guard", "Resheph Chariot", "Ram", "Stone Catapult", "Nomarch", "Settler", "Hero"] );
	nLangTroops.push( ["Mercenary", "Bowman", "Spotter", "Steppe Rider", "Marksman", "Marauder", "Ram", "Catapult", "Logades", "Settler", "Hero"] );

	// The english resource names are also not really needed. But provided in the case that the resource autodetect should fail.
	var aLangResources = ["Lumber","Clay","Iron","Crop"];


	/***************************************************************************
    *								Translations
	*                            --------------------
	*  There are four translation arrays: aLangBuildings, aLangTasks, aLangStrings and aLangMenuOptions
	*  aLangTroops is ripped from rally point upon first load. aLangResources is ripped each load.
	*  If an array does not appear for your language, TTQ will use the english version instead.
	*  Words that are removed, and appear as the number zero (0), currently have no translation and the english version is used.
 	***************************************************************************/
	switch(sLang) {
	case "ae": //Arabic (U.A.E) by Fahad (updated by Pimp Trizkit)
	case "eg": //Arabic (Egypt)
	case "sa": //Arabic (Saudi Arabia)
	case "sy": //Arabic (Syria)
		aLangTasks = ["????", "?????", "????", "??? ???", "?????", "?????", "???", "????? ??????"];
		aLangStrings = ["?????? ?????", "????? ?????", 0, "??? ????? ?????", "????? ??? ????? ?????", "??? ?????????? ", 0, 0, " ?? ???? ?? ?????.", 0, "??? ????? ?????", 0, "?? ???? ????? ??? ??????? ???.", 0,"?????? ????????", "???", "????? ?????", "?? ??? ?????? ??????.", "?????? ??????? ???","????? ?? ???? ??????? ???", "??????", "????", "???", "????? ??????? ???", "??????", "???", "?? ???", "?????", "?????", "????", "???", "?????? ??? ?????? ????????","?????? ??? ?????? ??????????", "????","?? ???? ????? ??? ?????? ??? ????? ??? ???? ", "?????? ??? ?????", "??? ??????:","????? ", "????? ", "????? ", "???????? ", "?????? ", "???? ??????", "??????? ?????","????? ????? ????? ", " ?? ?????? ????? ?????" , 0 , "????" , "????? ?????" , "????" , 0 , "?? ??? ???????" , "?? ?????? ???????"];
		break;

	case "ba": //Bosnian by bhcrow (updated by Pimp Trizkit)
		aLangTasks = ["Izgradi", "Unaprijedi", "Napad", "Istraživati", "Trenirati", "Zabava", "Rušiti", "Pošalji trgovci"];
		aLangStrings = ["Gradi poslije", "Unaprijedi poslije", 0, "Istraživati poslije", "Isplaniraj ovaj zadatak za poslije.", "Počela je gradnja ", 0, 0, " ne može graditi.", 0, "Isplaniran je zadatak.", 0, "Ne možemo zakazati ovaj zadatak upravo sada.", 0, "Planirani zadaci", "Izbrisati", "Pošalji Kasnije", "Trupe nisu odabrane.", "Vaša trupe su poslane", "Vaše postrojbe nisu mogle biti poslane u", "Podrška", "Napad", "Pljačka", "Katapulti će cilj", "slučajan", "u", "ili nakon", "sekundi", "minuta", "sahati", "dana", "špijun za resurse i trupe", "špijun za trupe i obrana", "od", "Napad ne može se planirati jer odredište nije naveden.", "na stranici br."];
		break;

	case "bg": //Bulgarian by penko & pe (updated by Pimp Trizkit)
		aLangTasks = ["??????????? ??", "?????????? ??", "????? ???", "????????? ??", "????????? ??", "??????", "??????", "??????? ????????"];
		aLangStrings = ["????????? ??-?????", "?????????? ??-?????", 0, "???????? ??-?????", "???????? ???? ?????? ?? ??-?????.", "??????? ?????? ", 0, 0, " ?? ???? ?? ???? ?????????.", 0, "???????? ? ?????????.", 0, "???? ?????? ?? ???? ?? ???? ????????? ????.", 0, "????????? ??????", "?????????", "??????? ??-?????", "??????? ?? ???? ?? ???? ?????????, ?????? ?? ?? ??????? ???????.", "?????? ??????? ?? ????????? ???", "?????? ??????? ?? ????? ?? ????? ????????? ???", "???????????? ???", "????? ???", "????? ???", "??????????? ?? ????? ?", "????????", "?", "??? ????", "???????", "??????", "????", "????", "?????????? ?? ??????? ? ??????", "?????????? ?? ?????? ? ??????", "??????", "??????? ?? ???? ?? ???? ?????????, ??? ???? ?? ? ??????? ???.", 0, "????????? ??:", "??? ", "????? ", "??? ", "????? ", "???? ", "??????? ?? ????????", "?????????? ?? ?????????", "??????? ???????????", " ?? ???? ?? ???? ??????.", 0, "???????", "???????? ??-?????", "??????.", 0, "??????? ??????????? ", " ?? ???? ?? ???? ????????."];
		break;

	case "br": //Brazilian Portuguese by getuliojr (updated by Pimp Trizkit)
		aLangTasks = ["Construir", "Melhorar", "Atacar", "Desenvolver", "Treinar", "Festa", "Demolir", "Enviar comerciantes"];
		aLangStrings = ["Construir Mais Tarde", "Melhorar Mais Tarde", 0, "Desenvolver Mais Tarde", "Programar esta tarefa para mais tarde.", "Começamos a construir ", 0, 0, " nao pode ser construído.", 0, "A tarefa foi programada.", 0, "Nao conseguimos programar esta tarefa agora.", 0, "Tarefas Programadas", "Apagar", "Enviar Mais Tarde", "Nao foram selecionadas tropas.", "As suas tropas foram enviadas para", "Nao foi possível enviar as suas tropas para", "Reforços", "Ataque:normal", "Ataque:assalto", "As catapultas irao mirar em", "Aleatório", "em", "ou depois","segundos", "minutos", "horas", "dias","Espiar recursos e tropas", "Espiar defesas e tropas", "Ausente", "O ataque nao pode ser programado pois nenhum destino foi escolhido.", "na localizaçao no.", "Ordenar por:", "tipo ", "hora ", "alvo ", "opçoes ", "aldeia ","Histórico das Tarefas", "apagar histórico", "Começamos a pesquisar ", " nao pode ser pesquisado.", 0, "Espiar", "Treinar mais tarde", "tropas.", 0, "Começamos a treinar ", " nao pode ser treinado."];
		break;

	case "cl": //Spanish Chilean by Benjamin F. (updated by Pimp Trizkit)
		aLangTasks = ["Construir", "Mejorar", "Atacar", "Investigar", "Entrenar", "Fiesta", "Demoler", "Enviar Comerciantes"];
		aLangStrings = ["Construir más tarde", "Actualización más tarde", 0, "Investigar más tarde", "Programar esta tarea para más tarde", "Hemos empezado a construir el edificio ", 0, 0, " no puede ser construido.", 0, "La tarea ha quedado programada.", 0, "No se puede programar esa tarea ahora.", 0, "Tareas programadas", "Eliminar", "Enviar más tarde", "No se selecionaron tropas.", "Tus tropas se enviaron a", "Tus tropas NO han podido ser enviadas", "Refuerzos", "Ataque: normal", "Ataque: asalto", "Catapultas atacar...", "aleatorio", "a", "o después", "segundos", "minutos", "horas", "días", "Espiar recursos y tropas ", "Espiar defensas y tropas", "fuera(away)", "El ataque no se ha programado porque no se fijo el objetivo.", "al cuadrante ns", 0, 0, 0, 0, 0, 0, "Historial de la Tarea", "Borrar la Historia", "Comenzamos la investigación de ", " no puede ser investigado.", 0, "Espiar", "Entrenar más Tarde", "las tropas.", 0, "Hemos comenzado a entrenar a ", " no pueden ser entrenados.", "Fiesta más Tarde", " pero no hoy.", "Empezamos a ", "Cerrar", "Agregar / Editar Lista de Tareas", "Editar y Cerrar", "Agregar y Cerrar", "Agregar", "?Estás seguro de que desea [s1] [s2]?", "Demoler más Tarde", "Demolición", "No se puede demoler"];
		break;

	case "cn": //Chinese (PRC) by Jacky-Q (updated by Pimp Trzikit)
		aLangTasks = ["??", "??", "??", "??", "??", "??", "??", "????"];
		aLangStrings = ["????", "????", 0, "????", "?????????.", "?????", 0, 0, " ????.", 0, "??????????.", 0, "????????????.", 0, "?????????", "??", "????", "????????????????.","???????", "????????", "??", "??", "??", "??????", "??", "?", "???", "?", "?", "?", "?", "???????", "???????","??", "????????,?????????.", 0, "???:", "??", "??", "?? ", "??", "??", "????", "????", "??????", "????", 0, "??", "???", "???", 0, "??????", "?????"];
		break;

	case "cz": //Czech (updated by Pimp Trizkit)
		aLangTasks = ["Postavit", "Rozšířit", "Zaútočit na", "Vyzkoumat", "Trénovat", "Večírek", "Zbourat", "Poslat Obchodníci"];
		aLangStrings = ["Postavit později", "Rozšířit později", 0, "Vyzkoumat později", "Naplánujte tuto akci na později.", "Začali jsme stavět ", 0, 0, " se nedá postavit.", 0, "Úloha byla naplánována.", 0, "Tuto akci momentálně není možné naplánovat.", 0, "Naplánované akce", "Smazat", "Vyslat později", "Útok není možné naplánovat, protože nebyly vybrány žádné jednotky.", "Jednotky jsou na cestě do", "Nepodařilo se vyslat jednotky do", "Podpořit", "Zaútočit na", "Oloupit", "Katapulty zamířit na", "náhodně", "o", "anebo za", "sekund", "minut", "hodin", "dní", "Prozkoumat jednotky a suroviny", "Prozkoumat jednotky a obranné objekty", "pryč", "Útok není možné naplánovat, protože chybí cíl.", "na místě č.", "Třídit podle:", "druhu ", "času ", "cíle ", "možnosti ", "vesnice ", "Historie", "smazat historii", "Začli jsme vyvíjet ", " se nedá vynajít.", 0, "Vyšpehovat", "Vycvičit později", "jednotky.", 0, "Začli jsme cvičit ", " se nedá vycvičit."];
		break;

	case "de": //German by Metador (updated by Pimp Trizkit)
        aLangTasks = ["Gebäude bauen", "Ausbau von", "Angriff", "Unterstützung", "verbessern", "Partei", "Abreißen", "Händler senden"];
        aLangStrings = ["Später bauen", "Später ausbauen", 0, "Später unterstützen", "Führe den Auftrag später aus.", "Gebäudebau gestartet von ", 0, "Fallen", " kann nicht gebaut werden.", 0, "Der Auftrag wurde hinzugefügt.", 0, "Dieser Auftrag kann jetzt nicht Aufgegeben werden.", 0, "Aufträge:", "Löschen", "Später senden", "Keine Truppen ausgewählt worden.", "Deine Truppen wurden geschickt zu", "Deine Truppen konnten nicht geschickt werden zu", "Unterstützung", "Angriff: Normal", "Angriff: Raubzug", "Die Katapulte zielen auf", "Zufall", "um", "oder nach", "Sekunden", "Minuten", "Stunden", "Tage", "Rohstoffe und Truppen ausspähen", "Verteidigungsanlagen und Truppen ausspähen", "weg", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "Ungültige Koordinaten oder keine Ressourcen ausgewählt"];
        break;

	case "dk": //Danish by Polle1 (updated by PT)
		aLangTasks = ["Byg", "Viderebyg", "Angrib", "Udforsk", "Uddan", "Hold fest", "Nedriv", "Send Handelsmand"];
		aLangStrings = ["Byg senere", "Viderebyg senere", 0, "Udforsk senere", "Planlag denne opgave til senere.", "Vi har startet byggeriet", 0, 0, " kan ikke bygges.", 0, "Opgaven blev planlagt til senere.", 0, "Vi kan ikke planlagge denne opgave lige nu.", 0, "Planlagte opgaver", "Slet", "Send senere", "Der er ikke nok tropper tilgangelig.", "Dine tropper blev sendt til", "Dine tropper kunne ikke sendes til", "Opbakning", "Angrib", "Plyndringstogt", "Katapulterne skyder mod", "tilfaldigt", "mod", "eller om", "sekunder", "minutter", "timer", "dage", "Efterforsk rastoffer og tropper", "Efterforsk forsvarsanlag og tropper", "vak", "Angrebet kan ikke planlagges pga. mangel pa mal.", "pa plads nr.", "Sorter efter:", 0, "tid ", "mal", "valg ", "landsby ", "Opgave-historik", "slet historik", "vi startede udforskning ", " kan ikke udforskes.", 0, "Spion", "Uddan senere", "tropper.", 0, "vi startede uddannelse", " kan ikke uddannes.", "Hold fest senere", " men ikke i dag.", "Vi startede ", "Luk", "Tilfoj/Edit Task Schedule", "Edit og luk", "Tilfoj og luk", "Tilfoj", "Er du sikker pa at du onsker at [s1] [s2]?", "Nedriv sener", "Nedriver", "Kan ikke nedrive", "Forkerte koordinater el. ingen rastoffer valgt."];
		aLangMenuOptions = [0, "Brug server tid", "brug pc tid", "Indstil dit folkeslag", "Opgave historie", 0, "\nHvor mange opgaver skal vi vise i opgavehistorie?\n(Tast 0 hvis du ikke onske opgavehistorie.) \nNuvarende: ", "\nHvilket folkeslag er du pa denne server?\n(Tast 0 for Romer, 1 for Germaner, 2 for Galler.) \nNuvarende: ", 0];
		break;

	case "ee": //Estonian by hit^
		aLangTasks = ["Ehita", "Täiusta", "Ründa", "Arenda", "Treeni"];
		aLangStrings = ["Ehita hiljem", "Täiusta hiljem", 0, "Arenda hiljem", "Täida ülesanne hiljem.", "Alustasime ehitamist: ", 0, 0, " ei saa ehitada.", 0, "Ülesanne seatud.", 0, "Ülesannet ei saa hetkel ajastada.", 0, "Ajastatud ülesanded", "Kustuta", "Saada hiljem", "Ühtegi sodurit pole valitud.", "Sodurid saadeti külasse", "Sodureid ei saa saata külasse", "Tugi", "Ründa", "Rüüsta", "Katapultide sihtmärk", "juhuslik", "kell", "voi peale", "sekundit", "minutit", "tundi", "päeva", "Luura ressursse ja sodureid", "Luura sodureid ja kaitset", "eemal", "Sihtpunkt pole määratud.", 0, "Sorteeri:", "tüüp ", "aeg ", "sihtmärk ", "valikud ", "küla ", "Alalugu", "puhasta ajalugu", "Alustasime arendamist ", " ei saa arendada.", 0, "Luura", "Treeni hiljem", "sojavägi.", 0, "Alustasime treenimist: ", " ei saa treenida."];
		break;

	case "ar": //Spanish Argentinian
	case "es": //Spanish by Carlos R (fixed by Mr.Kurt & Voltron).
		aLangTasks = ["Construir", "Mejorar", "Atacar", "Investigar", "Entrenar"];
		aLangStrings = ["Construir más tarde", "Mejorar más tarde", 0, "Investigar más tarde", "Programar esta tarea para más tarde", "Hemos empezado a construir el edificio ", 0, 0, " no puede ser construido.", 0, "La tarea ha quedado programada.", 0, "No se puede programar esa tarea ahora.", 0, "Tareas programadas", "Eliminar", "Enviar más tarde", "No se selecionaron tropas.", "Tus tropas se enviaron a", "Tus tropas NO han podido ser enviadas", "Refuerzo", "Atacar", "Saquear", "Catapultas atacarán...", "aleatorio", "a", "o después", "segundos", "minutos", "horas", "días", "Espiar recursos y tropas ", "Espiar defensas y tropas", "fuera(away)", "El ataque no se ha programado porque no se fijo el objetivo.", "al cuadrante nş", "Ordenar por:", "tipo ", "hora ", "objetivo ", "opciones ", "aldea ", "Historial de tareas", "Borrar Historial", "Se ha empezado a investigar ", " no puede ser investigado.", 0, "Espiar", "Entrenar más tarde", "tropas.", 0, "Se ha empezado a entrenar ", " no se puede entrenar."];
		break;

	case "fi": //Finish Ei vielä valmis, auttakaas !
		aLangTasks = ["Rakenna", "Päivitä", "Hyökkää", "Tiedustele", "Kouluta"];
		aLangStrings = ["Rakenna myöhemmin", "Päivitä myöhemmin", 0, "Tiedustele myöhemmin", "Lisää rakennusjonoon", "Rakenna ", 0, 0, " ei voida rakentaa.", 0, "Tehtävä lisätty rakennusjonoon.", 0, "Ei voida lisätä rakennusjonoon juuri nyt.", 0, "Tehtävät rakennusjonossa", "Poista", "Lähetä myöhemmin", "Hyökkäystä ei voitu lisätä jonoon, koska yhtään joukkoja ei ole valittu.", "Joukkosi on lähetetty ", "Joukkojasi ei voida lähettää ", "Ylläpito", "Hyökkäys: Normaali", "Hyökkäys: Ryöstö", "Katapulttien kohde", "satunnainen", "nyt", "tai myöhemmin", "sekuntit", "minuutit", "tunnit", "päivät", "Tiedustele resursseja ja joukkoja", "Tiedustele joukkoja ja puollustuksia","poissa", 0, 0, "Järjestä:", "tyyppi ", "aika ", "kohde ", "asetukset ", "kylä "];
		aLangMenuOptions = [0, "Käytä palvelimen aikaa", "Käytä paikallista aikaa", "Aseta heimo", "Tehtävähistoria", 0, 0, "\nMinkä heimon valitsit tälle serverille?\n(Vastaa 0 Roomalaiset, 1 Teutonit, 2 Gallialaiset.) \nNykyinen: ", 0];
		break;

	case "fr": //French
		aLangTasks = ["Construire le bâtiment", "Augmenter au"];
		aLangStrings = ["Construire plus tard", "Améliorer plus tard", 0, "Rechercher plus tard", "Programmer cette tâche pour plus tard.", "Construction commencée ", 0, 0, " ne peut etre construit.", 0, "La tâche a été programmée.", 0, "Cette tâche ne peut etre programmée actuellement.", 0, "Tâches programmées", "Supprimer", "Envoyer plus tard", "L'attaque ne peut pas etre programmée car aucune troupe n'a été sélectionnée.", "Vos troupes ont été envoyées a ", "Vos troupes n'ont pas pu etre envoyées a ", "Assistance", "Attaque: Normal", "Attaque: pillage", "Les catapultes ont pour cible", "aléatoire", "sur", "ou apres", "secondes", "minutes", "heures", "jours", "Espionner troupes et ressources", "Espionner troupes et défenses", "ailleurs", "L'attaque ne peut etre programmée car aucune destination n'a été spécifiée.", "au site no.", "Trier par:", "type ", "durée ", "cible "];
		break;

	case "gr": //Greek by askgdb (fixed by tsekouri_gr)
		aLangTasks = ["?????????", "???ß??µ???", "???????", "??????", "??????????","???????? ?????? ????"];
		aLangStrings = ["????????? ????????", "???ß??µ??? ????????", 0, "?????? ????????", "??????µµ????µ?? ???????? ??? ????????.", "???????? ?????????", 0, 0, " ??? ?????? ?? ?????????????.", 0,  "? ??????? ??????µµ???????? .", 0, "??? ?????? ?? ??????µµ??????? ???? ? ??????? ????.", 0, "??????µµ????µ???? ????????", "????????", "???????? ????????", "? ??????? ??? ?????? ?? ??????µµ??????? ?????? ??? ??????????? ??????????.", "?? ?????????? ?????????", "?? ?????????? ??? ???????? ?? ???????", "??????????", "???????", "???ß??? ???????", "?? ?????????? ?? ?????????? ??", "??????", "??", "? ????", "????????????", "?????",   "????",  "?????", "????????? ?????? ???? ??? ???????µ????", "????????? ???????? ??? ???????µ????", "??????", "? ??????? ??? ?????? ?? ??????µµ??????? ?????? ??? ????????? ????????µ???? ? ???µ? ??????.", "?? ????.", "??????µ??? ????:", "???? ", "????? ", "????? ", "???????? ", "????? ", "???????? ????????", "???????µ?? ?????????", "???????? ? ?????? ", " ??? µ????? ?? ?????????.", 0, "?????????", "?????????? ????????", "µ??????.", 0, "???????? ? ?????????? ", " ??? µ????? ?? ???????????.",  "???????? ??µµ?", 0, 0, "??????", "???????? / ??????????? ?µ???? ??????µµ?", "??????????? ??? ??????µ?", "???????? ??? ??????µ?", "????????", "????? ???????? ??? ?????? ?? [s1] [s2]?", "???????? ??????????", "??????????", "??? ????? ?????? ? ??????????", "????? ????????µ???? ? ??? ????? ???????????."];
		break;

	case "he": //Hebrew
	case "il": //Israel by DMaster
		aLangTasks = ["???", "????", "????", "????", "???", "??? ??????"];
		aLangStrings = ["??? ?????", "???? ?????", 0, "???? ?????", "???? ????? ?? ???? ?????? ?????.", "?????? ????? ", 0, 0, " ?? ???? ??????.", 0, "?????? ????? ???? ??????.", 0, "????? ?? ?????? ?????? ????? ?? ???? ?????? ????.", 0, "?????? ???? ??????", "???", "??? ?????", "?? ????? ?????.", "?????? ??? ????? ?", "?????? ??? ?? ???? ????? ?", "????", "?????: ?????", "?????: ?????", "????????? ???? ?", "??????", "?", "?? ????", "?????", "????", "????", "????", "??? ??? ?????? ??????", "??? ???? ????? ??????", "????", "?????? ?? ????? ???? ?????? ???? ????? ???? ?????.", "???? ???? ", "???? ???:", "?????, ", "????, ", "????, ", "???????? ", "???, ", "????????", "???? ????????", "?????? ????? ", " ?? ?????? ?????.", 0, "???", "??? ?????", "?????.", 0, "?????? ???? ", " ?? ?????? ????.", "?? ???", " ??? ?? ????.", "?????? ", "????", "????? / ????? ?? ??????? ???", "????? ????", "???? ?????", "??????", "??? ??? ???? ???? ???? [s1] [s2]?", "????? ?????", "??????", "?? ???? ?????", "???????????? ?? ????? ?? ??? ?????? ??????."];
		break;

	case "hk": //Chinese (Hong Kong)
		aLangTasks = ["??", "??", "??", "??", "??", "????", "??"];
		aLangStrings = ["????", "????", 0, "????", "???????????", "??????", 0, 0, "?????", 0, "????????", 0, "??????????.", 0, "??????", "??", "??????", "????????","????????", "?????????", "??", "??", "??", "??????", "????", "?", "???", "?", "??", "??", "?", "???????", "???????","??", "????????,??????????", "??????", "???", "??", "??", "??", "??", "??", "????", "????", "??????", "?????", 0, "??", "????", "???", 0, "??????", "?????", "??????", "??", "????", "??", "??/??????", "?????", "?????", "??", "????[s1][s2]??", "????", "????", "????"];
		aLangMenuOptions = [0, "????????", "??????", "??????", "????", 0, "\n???????????\n(?????????? 0 ) \n???????", "\n?????????????\n(0 ???, 1 ???, 2 ???)\n???????", 0];
		break;

	case "hr": //Croatian by Damir B.
		aLangTasks = ["Izgradi", "Nadogradi", "Napad", "Istraži", "Treniraj"];
		aLangStrings = ["Gradi poslije", "Nadogradi poslije", 0, "Istraži poslije", "Isplaniraj ovaj zadatak za poslije.", "Počela je gradnja ", 0, 0, " ne može biti izgrađeno.", 0, "Isplaniran je zadatak.", 0, "Ne može se isplanirati ovaj zadatak sada.", 0, "Planirani zadaci", "izbriši", "Pošalji poslije", "Trupe nisu odabrane.", "Vaša vojska je poslana na", "Vaša vojska ne može biti poslana na", "Podrška", "Napad", "Pljačka", "Katapulti će rušiti", "slučajno", "u", "ili nakon", "sekundi", "minuta", "sati", "dana", "Špijuniraj resourse i trupe", "Špijuniraj trupe i odbranu", "odsutan", "Napad ne može biti isplaniran jer destinacija nije određena.", "na stranici br.", "Sortiraj po:", "tip ", "vrijeme ", "meta ", "opcije ", "selo "];
		break;

	case "hu": //Hungarian by [TAJM]Kobra
		aLangTasks = ["Építés", "Szintemelés", "Támadás", "Fejlesztés", "Kiképzés"];
		aLangStrings = ["Építés később", "Szintemelés később", 0, " Fejlesztés később", "A művelet időzítve későbbre.", "Az építés elkezdődött ", 0, 0, " nem épülhet meg.", 0, "Időzítésre került feladat:", 0, "Jelenleg nem időzíthető", 0, "Időzített feladatok:", "Törlés", "Küldés később", "A támadás nem időzíthető! Nem lettek egységek kiválasztva.", "Az egységeid elküldve","Az egységek elküldése nem sikerült, ide:", "Támogatás", "Normál támadás", "Rablótámadás", "A katapult(ok) célpontja", "véletlenszerű", "Ekkor:", "vagy késleltetve", "másodperccel", "perccel", "órával", "nappal", "Nyersanyagok és egységek kikémlelése", "Egységek és épületek kikémlelése", "távol", "A támadás nem időzíthető! Nem lett végcél kiválasztva.", "a következő azonisítóval rendelkező helyen:", "Rendezés:", "típus ", "idő ", "célpont ", "beállítások ", "falu ", "Feladat története", "előzmények törlése"];
		break;

	case "id": //Indonesian by Wiewie Liu (updated by Rahwana)
		aLangTasks = ["Bangun",0,"Serang"];
		aLangStrings = ["Bangun nanti", "Upgrade nanti", 0, "Research nanti", "Atur tugas ini untuk nanti.", "Kita mulai bangun ", 0, 0, " tidak bisa dibangun.", 0, "Tugas sudah dischedule.", 0, "Kita tidak bisa schedule tugas saat ini.", 0, "Jadwal Tugas", "Hapus", "Kirim nanti", "Tidak ada prajurit yang dipilih.", "Prajurit terkirim ke", "Prajurit anda tidak bisa dikirim ke", "Bantuan", "Serangan", "Raid", "Catapults akan menyerang", 0, "pada", "atau setelah", "detik", "menit", "jam", "hari", "Mata-mata untuk sumber daya dan pasukan", "Mata-mata untuk pasukan dan pertahanan", "pergi", "Serangan tidak bisa dischedule karena tidak ada tujuan", "di site no.", 0, "tipe ", "waktu ", "tujuan ", "pilihan ", "desa "];
		break;

	case "ir": //Persian (Iran) by nekooee
		aLangTasks = ["??? ????", "?????? ????", "???? ????", "????? ????", "????? ????"];
		aLangStrings = ["???? ??? ??", "???? ?????? ???", 0, "???? ????? ??", "???? ???? ????? ???? ????", "???? ????? ?? ????? ", 0, 0, " ??? ???? ??? ???.", 0, "????? ???? ???? ??.", 0, "??? ?????? ??? ????? ?? ?? ????? ???????? ???? ??????.", 0, "????? ???????? ???", "??? ????", "???? ?????", "???? ?????? ????.", "???? ??? ??????? ?? ??", "???? ??? ?? ??? ???? ?????? ??", "????????", "???? ????", "????", "???????? ??? ??????", "??????", "?? ???", "?? ??? ??", "?????", "?????", "????", "???", "??????? ????? ? ???????", "??????? ????? ????? ? ???????", "?? ???", "???? ??? ????? ???? ???? ??? ???? ???? ???? ???? ???.", "??? ???? ????? ????.", "???? ???? ??:", "??? ", "???? ", "??? ", "??????? ", "????? ", "??????? ?????", "??? ???? ???????", "????? ?? ???? ????? ", " ??? ???? ????? ?? ???? ???.", 0, "??????", "???? ????? ??", "???????.", 0, "????? ???? ?? ???? ????? ", " ??? ???? ????? ???."];
        aLangMenuOptions = ["?? ?? ???? ???? ????? ?? ??????: ", "?? ???? ???? ??????? ???", "?? ???? ???? ??????? ???", "???? ??? ?? ???? ????", "??????? ?????", 0, "\n?? ????? ????? ?? ?? ??????? ??? ?????\n(??? ?? ?????? ??????? ??? ???? ???? ??? ?? ?????? ????.) \n????: ", "\n???? ??? ?? ??? ???? ?????\n(???? ???? 0 ???? ???? 1 ? ???? ??? 2 ?? ???? ????.) \n????: ", 0];
		break;

	case "it": //Italian by BLM (Updated by PT)
		aLangTasks = ["Costruisci", "Amplia", "Attacca", "Ricerca", "Addestra", 0, 0, "Invia Risorse"];
		aLangStrings = ["Costruisci piu' tardi", "Amplia piu' tardi", 0, "Ricerca piu' tardi", "Programma questa attivita'.", "E' iniziata la costruzione di ", 0, 0, " non puo' essere costruito.", 0, "L'attivita' e' stata programmata.", 0, "Non e' possibile programmare questa attivita' adesso.", 0, "Attivita' Programmate", "Cancella", "Invia piu' tardi", "L'attacco non puo' essere programmato in quanto non sono state selezionate truppe.", "Truppe sono state inviate a", "Non e' stato possibile inviare le truppe a", "Rinforzo", "Attacco", "Raid", "Obbiettivo catapulte", "a caso", "all'orario", "oppure dopo", "secondi", "minuti", "ore", "giorni", "Spiare truppe e risorse", "Spiare difese e truppe", "assente", "L'attacco non puo' essere programmato in quanto non e' stato specificato l'obbiettivo.", "alla posizione n.", "Ordina per:", "tipo ", "orario ", "obbiettivo ", "opzioni ", "villaggio", "Archivio Attivita'", "svuota archivio", "La ricerca e iniziata", " non puo essere ricercato", 0, "Spia", "Addestra piu tardi", "truppe.", 0, "L'Addestramamento e iniziato ", " non puo essere addestrato."];
		break;

	case "jp": //Japanese - By stchu (Updated by PT)
		aLangTasks = ["??", "?????", "??", "??", "??"];
		aLangStrings = ["???????", "??????????", 0, "???????", "??????????—???", "????????: ", 0, 0, " ?????????", 0, "????????????", 0, "????????????—???????", 0, "?????", "??", "?????", "?????????????", "?????????: ", "????????????: ", "??", "??", "??", "????????: ", "????", "????:", "????????:", "?", "?", "?", "?", "????????", "?????????", 0, "??????????????????????—??????????", "???No.", "?—?:", "??? ", "?? ", "?—??? ", 0, "? ", "?????", "??????", "?????????: ", " ?????????", 0, "??", "?????", "??", 0, "?????????: ", " ?????????"];
		aLangMenuOptions = [0, "?—?????????:??????GMT????+9????????????(?9????)", "PC?????????", "?????", "?????", 0, "\n?????????????????????\n(0????????????????????) \n??????: ", "\n????????\n(?—?:0, ??—??:1, ???:2) \n??????: ", 0];
		break;

	case "kr": //Korean by Kimmo
		aLangTasks = ["?? ??", "?????", "??", "??", "??"];
		aLangStrings = ["?? ??", "????? ??", 0, "?? ??", "??? ???? ??.", "??? ??: ", 0, 0, "?(?) ???? ??.", 0, "??? ???????.", 0, "? ??? ?? ?? ? ? ????.", 0, "??? ??", "??", "??? ??", "??? ??? ????.", "??? ??: ", "??? ??? ??: ", "??", "??", "??", "???? ???: ", "? ?", "??", "?? ???", "?", "?", "?", "?", "??? ??? ??", "??? ??? ??", "? ?", "? ??? ???? ???? ?? ??? ???.", "?? ??.", "??:", "?? ", "?? ", "?? ", "?? ", "?? ", "?? ???", "?? ???", "??? ??: ", "?(?) ???? ?????."];
		break;

	case "lt": //Lithuanian by NotStyle & ( GodZero, negadink daugiau skripto)
		aLangTasks = ["Statyti", "Patobulinti", "Siusti karius", "Tyrineti", "Treniruoti"];
		aLangStrings = ["Statyti veliau", "Patobulinti veliau", 0, "Tyrineti veliau", "Užplanuoti užduoti.", "Mes pradejome statyti ", 0, 0, " neimanoma pastatyti.", 0, "Užduotis užplanuota.", 0, "Mes negalime užplanuoti dabar sitą užduoti.", 0, "Užplanuotos užduotys", "Ištrinti", "Siusti veliau", "Ataka negali buti užplanuota nes kariai nepasirinkti.", "Jusu kariai nusiusti i", "Jusu kariai negali buti nusiusti i", "Parama", "Ataka", "Reidas", "Katapultos bus nutaikyti i", "atsitiktinis", "i", "arba veliau", "sekundes", "minutes", "valandos", "dienos", "Resursu bei pajegu žvalgyba", "Gynybiniu fortifikaciju bei pajegu žvalgyba", "nera", "Negalima užplanuoti atakos, nes taikinys nerastas.", "puslapyje Nr.", "Rušiuoti pagal:", "[tipą] ", "[laiką] ", "[taikini] ", "pasirinktys ", "[gyvenvietę] ", "Užduočiu Praeitis", "[išvalyti praeiti]", "Mes pradejome tyrinejimą ", " negali buti tyrinejamas."];
		break;

	case "lv": //Latvian by sultans
		aLangTasks = ["Buvet", "Paplašinat", "Uzbrukt", "Izpetit", "Apmacit"];
		aLangStrings = ["Buvet velak", "Uzlabot velak", 0, "Izpetit velak", "Izveidot uzdevumu.", "Tika uzsakta buvnieciba ", 0, 0, " nevar uzbuvet.", 0, "Uzdevums ir ieplanots.", 0, "Mes nevaram šobrid to ieplanot.", 0, "Ieplanotie uzdevumi", "Dzest", "Sutit velak", "Uzbrukums nevar notikt, jo nav atzimeti kareivji.", "Jusu kareivji tika nosutiti uz", "Jusu kareivji nevar tikt nosutiti", "Papildspeki", "Uzbrukums", "Iebrukums", "Ar katapultam bombardet", "nejaušs", "kad", "vai pec", "sekundes", "minutes", "stundas", "dienas", "Izlukot resursus un kareivjus", "Izlukot aizsardzibu un kareivjus", "Prom", "Uzbrukums nevar tikt izpildits, jo nav noradits merkis.", "koordinates karte.", "Škirot pec:", "tipa ", "laika ", "merka ", "veida ", "ciema ", "Uzdevumu vesture", "nodzest vesturi", "tika uzsakta izpete", " nevar tikt izpetits.", 0, "Izlukot", "Apmacit velak", "kareivji.", 0, "Tika uzsakta uzlabošana", "nevar tikt uzlaboti."];
		break;

	case "mx": //Mexican Spanish by fidelmty
		aLangTasks = [ "Construir", "Mejorar", "Atacar", "Investigar", "Entrenar"];
		aLangStrings = ["Construir más tarde", "Mejorar más tarde", 0, "Investigar más tarde", "Programar esta tarea para más tarde", "Hemos empezado a construir el edificio ", 0, 0, " no puede ser construido.", 0, "La tarea ha quedado programada.", 0, "No se puede programar esa tarea ahora.", 0, "Tareas programadas", "Eliminar", "Enviar más tarde", "El ataque no ha sido programado porque no se selecionaron tropas.", "Tus tropas se enviaron a", "Tus tropas NO han podido ser enviadas", "Refuerzo", "Atacar", "Saquear", "Catapultas atacarán...", "aleatorio", "a", "o después", "segundos", "minutos", "horas", "días", "Espiar recursos y tropas ", "Espiar defensas y tropas", "fuera(away)", "El ataque no se ha programado porque no se fijo el objetivo.", "al cuadrante ns"];
		break;

	case "my": //Malay by ocellatus (Updated by PT)
		aLangTasks = ["Bina", "Tingkatkan Tahap", "Serang", "Selidik", "Latih", "Adakan", "Musnah", "Hantar Pedagang"];
		aLangStrings = ["Bina Kemudian", "Tingkatkan Kemudian", 0, "Selidik Kemudian", "Jadualkan Tugasan Ini Kemudian", "Memulakan Pembinaan ", 0, 0, " Tidak Dapat Dibina.", 0, "Tugasan Telah Dijadualkan.", 0, "Tidak Dapat Dijadualkan Sekarang.", 0, "Tugasan Telah Dijadualkan", "Buang", "Hantarkan Kemudian", "Tiada Askar Dipilih.", "Askar-askar Anda Dihantar Ke", "Askar-askar Anda Tidak Dapat Dihantar Ke", "Bantuan", "Serang", "Serbuan", "Tarbil Akan Disasarkan Ke", "Tidak Ditetapkan", "Pada", "Atau Selepas", "Saat", "Minit", "Jam", "Hari", "Tinjauan Sumber Dan Askar", "Tinjauan Askar dan Pertahanan", "Pergi", "Serangan Tidak Dapat Dijadualkan Kerana Tiada Destinasi Ditetapkan.", "Di Tapak No.", 0, 0, 0, 0, 0, 0, 0, 0, 0, " Tidak Boleh Diselidik.","Tingkatkan Kemudian", "Tinjau", "Latih Kemudian", "Askar.", "Latih", "Memulakan Latihan ", " Tidak Boleh Dilatih.","Perayaan", " Tetapi Tidak Pada Hari Ini.", "Memulakan Untuk", 0, 0, 0, 0, 0, "Adakah Anda Pasti Untuk [s1] [s2]?", "Musnah Kemudian", "Sedang Dimusnahkan", "Tidak Boleh Dimusnahkan", "Koordinat Tidak Wujud Atau Tiada Sumber Dipilih."];
		break;

	case "nl": //Dutch by Roshaoar & Kris Fripont
		aLangTasks = ["Gebouw Bouwen", "Verbeter", "Val Aan", "Ontwikkel"];
		aLangStrings = ["Bouw later", "Verbeter later", 0, "Ontwikkel later", "Plan deze taak voor later.", "Bouw is begonnen ", 0, 0, " kan niet worden gebouwd.", 0, "deze taak was gepland.", 0, "We kunnen deze taak nu niet plannen.", 0, "Geplande taken", "Verwijder", "Stuur later", "De aanval kan niet worden gepland omdat er geen troepen zijn geselecteerd.", "Jou troepen zijn gestuurd naar", "Jou troepen konden niet worden gestuurd naar", "Versterk", "Val aan", "Roof", "De katapulten zullen mikken op", "willekeurig", "op", "of na", "seconden", "minuten", "uren", "dagen", "spioneer naar voorraden en troepen", "spioneer naar troepen en verdediging", "weg", "Het aanval kan niet worden gepland omdat geen destinatie gezet was.", "op bouwplaats nummer ", "Sorteer via:", "soort ", "tijd ", "doel ", "keuzen ", "dorp "];
		break;

	//case "no": //Norwegian

	case "pt": //Portuguese by Guinness, NomadeWolf, getuliojr (updated by Pimp Trizkit)
		aLangTasks = ["Construir", "Melhorar", "Atacar", "Desenvolver", "Treinar", "Festa", "Demolir", "Enviar comerciantes"];
		aLangStrings = ["Construir Mais Tarde", "Melhorar Mais Tarde", 0, "Desenvolver Mais Tarde", "Programar esta tarefa para mais tarde.", "Começamos a construir ", 0, 0, " nao pode ser construído.", 0, "A tarefa foi programada.", 0, "Nao conseguimos programar esta tarefa agora.", 0, "Tarefas Programadas", "Apagar", "Enviar Mais Tarde", "Nao foram selecionadas tropas.", "As suas tropas foram enviadas para", "Nao foi possível enviar as suas tropas para", "Reforços", "Ataque:normal", "Ataque:assalto", "As catapultas irao mirar em", "Aleatório", "em", "ou depois","segundos", "minutos", "horas", "dias","Espiar recursos e tropas", "Espiar defesas e tropas", "Ausente", "O ataque nao pode ser programado pois nenhum destino foi escolhido.", "na localizaçao no.", "Ordenar por:", "tipo ", "hora ", "alvo ", "opçoes ", "aldeia ","Histórico das Tarefas", "apagar histórico", "Começamos a pesquisar ", " nao pode ser pesquisado.", 0, "Espiar", "Treinar mais tarde", "tropas.", 0, "Começamos a treinar ", " nao pode ser treinado."];
		break;

	case "pl": //Polish by Oskar (corrected by CamboX)
		aLangTasks = ["Buduj", "Rozbuduj", "Atak", "Zbadać", "Szkolić"];
		aLangStrings = ["Buduj później", "Rozbuduj później", 0, "Zbadaj później", "Zaplanuj zadanie na później.", "Rozpoczęto budowę ", 0, 0, " nie może byc zbudowany.", 0, "Zadanie zostało zaplanowane.", 0, "Nie mozna teraz zaplanowac tego zadania.", 0, "Zaplanowane zadania", "Usuń", "Wyślij później", "Nie wybrano żadnych jednostek.", "Twoje jednoski zostały wysłane", "Twoje jednostki nie mogą zostać wysłane", "Pomoc", "Atak", "Grabież", "Katapulty celują w", "losowy", "o", "lub za", "sekundy", "minuty", "godziny", "dni", "Obserwuj surowce i jednostki", "Obserwuj fortyfikacje i jednostki", "nieobecny", "Atak nie może zostać zaplanowany, ponieważ nie wybrano celu.", "Na pozycji nr.", "Sortowanie:", "typ ", "czas ", "cel ", "opcje ", "osada ", 0, 0, 0, 0, 0, 0, "Szkolic później"];
		break;

	case "ro": //Romanian by Atomic (edited by fulga, Pimp Trizkit, adipiciu)
		aLangTasks = ["Clădire", "Upgrade", "Atacă", "Cercetează", "Instruie?te", "Petrecere", "Demolează", "Trimite negustori", "Trimite înapoi/retrage"];
		aLangStrings = ["Construie?te mai târziu", "Upgrade mai târziu", "Sat necunoscut", "Cercetează ulterior", "Programează această ac?iune pentru mai târziu", "Construc?ia a fost pornită ", "<center>STOP!</center><br>Te rugăm să a?tep?i, TTQ procesează comanda!<br>Step", "Celule", " cererea de construc?ie a fost trimisă. Cu toate acestea, se pare că nu a pornit construc?ia.", "s-a încercat, dar server-ul a redirec?ionat cererea.", "Ac?iunea a fost programată", "Redirec?ionat", "Programarea ac?iunii nu e posibilă momentan", "Eroare", "Ac?iuni Programate", "?terge", "Trimite mai târziu", "Nici o unitate nu a fost selectată.", "Trupele tale au fost trimise la:", "Trupele tale nu au putut fi trimise la:", "Intăriri", "Atac normal", "Atac rapid (Raid)", "Catapultele vor ?inti", "Aleator", "la", "sau după", "secunde", "minute", "ore", "zile", "Spionează resurse ?i trupe", "Spionează fortifica?ii ?i trupe", "plecate", "Atacul nu poate fi programat! Destina?ia nu a fost selectată.", "pe locul (ID) nr.", "Sortează după:", "«tip» ", "«timp» ", "«?intă» ", "«op?iuni» ", "«sate» " ,"Ac?iuni derulate", "închide", "Cercetarea a fost pornită ", " Cercetarea nu este posibilă", 0, "Spionaj", "Antrenează mai târziu", "trupe.", 0, "Antrenamentul pornit "," Antrenamentul nu este posibil", " mai târziu", 0, "Am început să ", "Închide lista", "Adaugă/Editează", "Editează şi închide", "Adaugă şi închide", "Adaugă", "E?ti sigur că dore?ti să [s1] [s2 ]?", "Demolează mai târziu", "Se demolează", "Nu s-a putut demola", "Nu au fost selectate resurse sau Coordonate invalide.", "Folosind ora locală", "Folosind ora server-ului", " was attempted but we could not find the link.", " was attempted but failed. Reason: ", "No Link", " was attempted but the building was not found.", "No Building", " was attempted but the server returned an error.", "Server:", "Confirmation Failed", "Sorry, I <b>may</b> have built the building in the wrong town.", "Misbuild:", "Sent Back/Withdrew troops.<br>Troops are going home to:", "Sent Back/Withdrew troops Failed (I think).<br>Troops were supposed to go home to: ", "Click to make this your Active Village." , "Click to see this Village Details screen.", "Timeout or TTQ Crash"];
		aLangMenuOptions = [0, "Folose?te ora server-ului", "Folose?te ora locală", "Setează tribul", "Istoric ac?iuni", "Resetează", "\nCâte ac?iuni vrei să păstrezi în istoric?\n(Introdu 0 pentru a dezactiva istoricul ac?iunilor.) \nAcum: ", " Care este tribul tău?\nIntrodu 0 pentru Romani, 1 pentru Barbari, 2 pentru Daci. Sau introdu un număr negativ pentru detectarea automată a tribului (ie: -1)\nAcum: ", "E?ti sigur că vrei să resetezi toate variabilele script-ului TTQ?"];
		break;

	case "ru": //Russian by Hosstor (aLangStrings edited by v_kir)
		aLangTasks = ["?????????", "???????", "?????????", "???????", "???????"];
		aLangStrings = ["????????? ?????", "??????? ?????", 0, "??????? ?????", "????????????? ??????.", "?? ?????? ????????????? ", 0, 0, " ?? ????? ???? ?????????.", 0, "?????? ?????????????.", 0, "?? ?? ????? ??????????? ????? ??????.", "??????", "??????????????? ??????", "???????", "????????? ?????", "????? ?? ????? ???? ?????????????, ????????? ?????? ?? ???????.", "???? ?????? ???? ???????????", "???? ?????? ?? ????? ???? ??????????", "?????????", "?????", "?????", "?????????? ???????? ??", "????????", "?", "??? ?? ?????????", "??????", "?????", "?????", "????", "???????? ???????? ? ?????", "???????? ????? ? ?????????????? ??????????", "???????????", "????? ?? ????? ???? ?????????????, ?? ???? ?????? ??????????.", "?? ???? ?????.", "?????????? ??:", "???? ", "??????? ", "???? ", "?????????? ", "??????? ", "??????? ?????", "???????? ???????", "?? ?????? ????????????", " ?? ????? ???? ???????????.", 0, "?????", "??????????? ?????", "??????.", 0 , "?? ?????? ??????????", " ?? ????? ?????????????", "????????? ?????", " ?? ?? ???????.", "?? ?????? ", "???????", "????????/???????? ?????????? ??????", "???????? ? ???????", "???????? ? ???????", "????????", "?? ???????, ??? ?????? [S1] [S2]?", "????????? ?????", "?????????", "?? ????? ???? ?????????"];
		break;

	case "se": //Swedish by Storgran
		aLangTasks = ["Konstruera", "Uppgradera", 0, "Förbättra", "Träna"];
		aLangStrings = ["Konstruera senare", "Uppgradera senare", 0, "Förbättra senare", "Schemalägg uppgiften tills senare.", "Byggnationen pabörjad ", 0, 0, " kan inte byggas.", 0, "Uppgiften är schemalagd.", 0, "Det gar inte att schemalägga denna uppgift just nu.", 0, "Schemalägg uppgift", "Ta bort", "Skicka senare", "Attacken kunde inte bli schemalagd da inga trupper valdes.", "Dina trupper skickades till", "Dina trupper kunde inte skickas till", "Förstärkning", 0, "Plundring", "Katapulterna ska sikta pa", 0, "vid", "eller efter", "sekunder", "minuter", "timmar", "dagar", "Spionera pa trupper och resurser", "Spionera pa trupper och försvarsbyggnader", "borta", "Attacken misslyckades, var vänlig och välj en destination.", "ingen destination.", "Sortera efter:", "typ ", "tid ", "mal ", "alternativ ", "by ", "Tidigare"];
		break;

	case "rs": //Serbian by isidora
		aLangTasks = ["???????? ??????", "??????????? ??", "?????", "?????????", "??????? ?????"];
		aLangStrings = ["????? ?????", "???????? ?????", 0, "??????? ?????", "?????????? ???? ??????? ?? ?????.", "?????? ?? ?????? ", 0, 0, " ?? ???? ???? ?????????.", 0, "?????????? ?? ???????.", 0, "?? ???? ?? ??????????? ???? ??????? ????.", 0, "????????? ??????", "???????", "?????? ?????", "????? ???? ????????.", "???? ?????? ?? ??????? ??", "???? ?????? ?? ???? ???? ??????? ??", "????????", "?????", "??????", "????????? ?? ??????", "????????", "?", "??? ?????", "???????", "??????", "????", "????", "???????? ???????? ? ??????", "???????? ??????? ? ??????", 0, "????? ?? ???? ???? ?????????? ??? ??????????? ???? ????????.", "?? ???????? ??.", "???????? ??:", 0, 0, 0, "?????? ", "???? "];
		break;

	case "si": //Slovenian by SpEkTr and matej505
		aLangTasks = ["Postavi nov objekt", "Nadgradi", "Napad na ", "Razišči", "Izuri"];
		aLangStrings = ["Postavi nov objekt kasneje", "Nadgradi kasneje", 0, "Izuri kasneje", "Nastavi to nalogo za kasneje", "Z gradnjo začnem ", 0, 0, " ne morem zgraditi.", 0, "Naloga je nastavljena.", 0, "Te naloge trenutno ni možno nastaviti.", 0, "Nastavljene naloge:", "Zbriši", "Pošlji kasneje", "Nisi označil nobenih enot.", "Tvoje enote so bile poslane,", "Tvoje enote ne morejo biti poslane,", "Okrepitev", "Napad", "Roparski pohod", "Cilj katapultov je", "naključno", "ob", "ali kasneje", "sekund", "minut", "ur", "dni", "Poizvej o trenutnih surovinah in enotah", "Poizvej o obrambnih zmogljivostih in enotah", "proč", "Napad ne more biti nastavljen, ker ni bila izbrana nobena destinacija.", "na strani št.", "Sortiraj po:", "tipu ", "času ", "tarči ", "možnosti ", "vasi "];
		break;

	case "sk": //Slovak
		aLangTasks = ["Postaviť", "Rozšíriť", "Zaútočiť na", "Vynájsť", "Trénovať"];
		aLangStrings = ["Postaviť neskôr", "Rozšíriť neskôr", 0, "Vynájsť neskôr", "Naplánujte túto akciu na neskôr.", "Začali sme stavať ", 0, 0, " sa nedá postaviť.", 0, "Úloha je naplánovaná.", 0, "Túto úlohu momentálne nie je možné naplánovať.", 0, "Naplánované úlohy", "Zmazať", "Vyslať neskôr", "Neboli vybraté žiadne jednotky.", "Jednotky mašírujú do", "Nepodarilo sa vyslať jednotky do", "Podporiť", "Zaútočiť na", "Olúpiť", "Katapulty zacieliť na", "náhodne", "o", "alebo za", "sekúnd", "minút", "hodín", "dní", "Preskúmať jednotky a suroviny", "Preskúmať jednotky a obranné objekty", "preč", "Útok nemožno naplánovať, pretože nie je známy cieľ.", "na mieste č.", "Zoradiť podľa:", "typu ", "času ", "cieľa ", "iné ", "dediny ", "História akcií", "zmazať históriu", "Začali sme vyvíjať ", " sa nedá vynájsť.", "Vylepšiť neskôr", "Vyšpehovať", "Trénovať neskôr", "jednotky.", "Vytrénovať", "Začali sme trénovať ", " sa nedá vytrénovať." ];
		break;

	case "th": //Thai
		aLangTasks = ["?????", "???????", "?????", "?????", "???", 0, 0,"???????????"];
		aLangStrings = ["????????????", "??????????????", 0, "????????????", "????????????????????????", "?????????? ", 0, 0, " ?????????????????", 0, "??????????????????????????????", 0, "?????????????????????????????????????", 0, "????????", "??", "????????????", "??????????????????", "????????????????????????? ", "???????????????????????????????", "????????????????", "?????", "????", "??????????????????? ", "????", "???", "???????????", "??????", "????", "???????", "???", "?????????????????????????", "???????????????????????????", 0, "?????????????????????????????????????????????????????", "??????????????????", "?????????????:", "???? ", "???? ", "???????? ", "???????? ", "???????? ", "????????????????????", "?????????????????", "??????????????? ", " ?????????????????", 0, "??????", "????????????", "?????????", 0, "???????????", "???????????????"];
		aLangMenuOptions = ["???????? ", "?????????????????????", "??????????????????", "??????????????", "???????????", 0, "\n????????????????????????????????????????????????????????????\n(??? 0 ???????????????????????????????) \n????????: ", "\n??????????????????????????????????????\n(??? 0 ?????????????, 1 ??????????????, 2 ???????????.) \n????????: ", 0];
		break;

	case "tr": //Turkish by sanalbaykus
		aLangTasks = ["Kurulacak bina", "Geliştirilecek Bina", "Asker gönder", "geliştir", "Yetiştir"];
		aLangStrings = ["Daha sonra KUR", "Daha Sonra GELIŞTIR", 0, "Sonra araştir", "Bu işlemi sonra planla.", "Yapim başladi. ", 0, 0, " Inşa edilemedi.", 0, "Işlem siraya alindi.", 0, "Işlemi şu an planlayamiyoruz.", 0, "Siradaki Işlemler", "Sil", "Daha sonra yolla", "Önce asker seçmelisiniz..", "Askerlerin gönderildigi yer ", "Askerler yollanamadi", "Destek olarak", "Normal Saldiri olarak", "Yagmala olarak", "Mancinik hedefi", "Rastgele", "Şu an", "Yada bu zaman sonra", "saniye sonra", "dakika sonra", "saat sonra", "gün sonra", "Hammadde ve askerleri izle", "Asker ve defansi izle", "uzakta","Saldiri plani için adres girmediniz.","adres", "Siralama Kriteri:", ".Tip.", " .Süre.", ".Hedef. ", "Ayarlar", ".Köy. ","Tamamlanan işlemler", "Geçmişi sil", "Araştiriliyor.", " Araştirilamadi.", 0, "Casus", "Sonra yetiştir", "Askerler.", 0, "Yetiştirme Başladi ", " Yetiştirme Başlamadi."];
		aLangMenuOptions = [0, "Server saatini kullan", "Yerel saati kullan", "Hakini seç", "Görev geçmişi", 0, "\nGörev geçmişinde kaç adet görev görüntülensin?\n(0 yazarsaniz görev geçmişi devre dişi kalir.) \nŞu anda: ", "\nBu server'daki halkiniz hangisi?\n(Romalilar için 0, Cermenler için 1, Galyalilar için 2.) \nŞu anda: ", 0];
		break;

	case "tw": //Chinese (Taiwan) by syrade
		aLangTasks = ["??", "??", "??", "??", "??"];
		aLangStrings = ["????", "????", 0, "????", "??????????.", "????? ", 0, 0, " ????.", 0, "??????????.", 0, "????????????.", 0, "?????????", "??", "????", "????????????????.","???????", "????????", "??", "??", "??", "??????", "??", "?", "???", "?", "?", "?", "?", "???????", "???????","??", "????????,?????????.", 0, "???:", "??", "??", "?? ", "??", "??", "????", "????", "????", "????", 0, "??", "????", "??", 0, "????", "????"];
		aLangMenuOptions = [0, "???????", "??????", "????", "????", 0, "\n????????????\n(0 ????????) \n????: ", "\n?????????\n(0 ?????, 1 ?? ???, 2 ?? ???) \n????: ",0];
		break;

	case "ua": //Ukrainian by Rustle rs11[@]ukr.net
		aLangTasks = ["??????????", "????????", "?????????", "?????????", "?????????"];
		aLangStrings = ["?????????? ???????", "??????? ???????", 0, "????????? ???????", "??????????? ??????.", "?? ?????? ??????????? ", 0, 0, " ????????? ??????????.", 0, "?????? ???????????.", 0, "?? ?? ?????? ????????? ?? ?????.", "???????", "??????????? ??????", "????????", "?????????? ???????", "????? ?? ???? ???? ???????????, ???????? ??????? ?? ???????.", "???? ??????? ???? ???????????", "???? ??????? ?? ?????? ???? ???????????", "????????????", "?????????", "????????????? ?????", "?????????? ???????? ??", "?????????", "?", "?? ?????", "??????", "??????", "?????", "????", "????????? ??????? ?? ??????? ????????????", "????????? ???????? ??????? ?? ??????? ????????????", "????????", "????? ?????? ???? ??????????? ?? ????? ????.", "???? ?.", "?????????:", "??? ", "??? ", "???? ", "????????? ", "?????? "];
		break;

 	case "vn": //Vietnamese by botayhix (Updated by PT)
		aLangTasks = ["Xây d?ng công trinh", "Nâng c?p", "T?n Công", "Nghien c?u", "Cu?p Bóc"];
		aLangStrings = ["Xây D?ng Sau", "Nâng c?p sau", 0, "Nghien c?u sau", "K? ho?ch", "B?t đ?u xây d?ng ", 0, 0, " Không th? xây d?ng.", 0, "Nhi?m v? trong k? ho?ch.", 0, "Chúng ta không th? th?c hi?n k? ho?ch bây gi?.", 0, "K? ho?ch nhi?m v?", "Xoá", "G?i Sau", "Không có quân nao đu?c ch?n.", "Quân c?a b?n đu?c g?i đ?n", "Quân c?a b?n không đu?c g?i đi", "Ti?p vi?n", "T?n Công", "Cu?p bóc", "Máy b?n đá t?n công vao", "Ng?u nhien", "T?i", "Ho?c sau đó", "Giây", "Phút", "Gi?", "Ngay", "Do thám tai nguyen va quân đ?i", "Do thám quân đ?i va phong th?", "Kho?ng cách", "Cu?c t?n công không th? th?c hi?n do đích đ?n không đúng.", "V? trí.", 0, "Ki?u_ ", "th?i gian ", "M?c tieu: ", "L?a ch?n ", "Lang_ ", 0, "Xoá history", "B?t đ?u th?c hi?n ", " Không th? th?c hi?n."];
		break;

	default:
	}

function vlist_addButtonsT4 () {
	var vlist = $id("sidebarBoxVillagelist");
	if ( vlist ) {
		var villages = $gt('li',vlist);
		for ( var vn = 0; vn < villages.length; vn++ ) {
			var linkEl = $gt("a",villages[vn])[0];
			linkVSwitch[vn] = linkEl.getAttribute('href');
			var did = getVidFromCoords(linkEl.innerHTML);
			var nd = parseInt(linkVSwitch[vn].match(/newdid=(\d+)/)[1]);
			villages_id[vn] = did;

			if( linkEl.getAttribute('class').indexOf("active") != -1 )
				currentActiveVillage = nd;
		}
	}
}

var TTQ_registeredMenu = $e('UL',[['style','font-size:12px;']]);
var TTQ_registeredMenuFL = true;
function TTQ_registerMenuCommand(t,f) {
	var newLI = $ee('LI',t);
	ttqAddEventListener(newLI,'click',f,false);
	TTQ_registeredMenu.appendChild(newLI);
}
function TTQ_showMenuCommand() {
	if( TTQ_registeredMenuFL ) {
		$id('ttqPanel').appendChild(TTQ_registeredMenu);
		TTQ_registeredMenuFL = false;
	} else {
		$id('ttqPanel').removeChild(TTQ_registeredMenu);
		TTQ_registeredMenuFL = true;
	}
}

	var tX, tY, vName, tA = null;  //Recyclable Global Variables... scary, I know.. but, hey, it speeds things up, and saves memory usage.
	//Display the TTQ box
	var docDir = ['left', 'right'];
	var ltr = true;
	if (document.defaultView.getComputedStyle(document.body, null).getPropertyValue("direction") == 'rtl') { docDir = ['right', 'left']; ltr = false; }

	tA = document.createElement("div");
	tA.setAttribute("id", "ttqPanel");
	tA.setAttribute("style", "position:absolute;top:"+(parseInt(getPosition($id("background")).y)+24)+"px;"+docDir[0]+":50%;background-color:#AAAAAA;padding:0px 2px 0px 2px;margin:0px "+(ltr?0:320)+"px 0px "+(ltr?320:0)+"px;white-space:nowrap;color:black;font-family:'Lucida Sans Unicode','Comic Sans MS';font-size:10px;border-radius:6px;border:2px solid black;z-index:501;cursor:pointer;");
	tA.innerHTML = "<span id='ttqPanelSpan'><b>TTQ</b>-T4 v" + sCurrentVersion + " - <span id='ttqLoad' style='font-weight: bold' >0</span> ms - <span id='ttqReloadTimer'>0</span></span>";
	ttqAddEventListener(tA, "click", TTQ_showMenuCommand, false);
	document.body.appendChild(tA);
	// Fix language arrays, replace zeros with english
	aLangBuildings = nLangBuildings;
	if ( aLangTasks == 0 ) aLangTasks = nLangTasks;
	else for ( tX = 0 ; tX < 9 ; ++tX ) if ( typeof(aLangTasks[tX]) == "undefined" || !aLangTasks[tX] ) aLangTasks[tX] = nLangTasks[tX];
	if ( aLangStrings == 0 ) aLangStrings = nLangStrings;
	else for ( tX = 0, tY = nLangStrings.length ; tX < tY ; ++tX ) if ( typeof(aLangStrings[tX]) == "undefined" || !aLangStrings[tX] ) aLangStrings[tX] = nLangStrings[tX];
	if ( aLangMenuOptions == 0 ) aLangMenuOptions = nLangMenuOptions;
	else for ( tX = 0 ; tX < 9 ; ++tX ) if ( typeof(aLangMenuOptions[tX]) == "undefined" || !aLangMenuOptions[tX] ) aLangMenuOptions[tX] = nLangMenuOptions[tX];
	var myID = myPlayerID; // Save off into Recycled Variable for later use
	//Get Player ID  (uid)
	myPlayerID = myID.src.match(/uid=(\d+)/)[1];
	//Get MapSize
	var MapSize = detectMapSize();
	var mapRadius = (MapSize - 1) / 2;
	vlist_addButtonsT4();
	var myPlaceNames = new Object();
	// Put Coords next to village names and make them clickable to view that village's details screen, and move the villages names over to the left some, and save them all for getVillageName() and getVillageNameXY()
	var iMyRace = $gt('li',$id("sidebarBoxVillagelist")); //Recycled variable
	var l8, m8, n8, nFL=true;  //Sorry for the names, i was just being funny.
	for ( n8 = 0, m8 = 0, l8 = iMyRace.length ; m8 < l8 ; ++m8 ) {
//-- ??????????? ?????????, ????????? ?????? ? ???????? SPAN ? ????????????? ???????? ?? ???????.
		tA = iMyRace[m8];
		if ( tA.tagName != "LI" ) continue;
		tA = $gt("a",tA)[0];
		if ( nFL ) {
			iSiteId = tA.href.split("&id=");
			if ( iSiteId.length > 1 ) iSiteId = parseInt(iSiteId[1]);
			nFL = false;
		}
		var xy = coordZToXY(villages_id[n8]);
		tX = xy[0];
		tY = xy[1];
		vName = $gt('div',tA)[0].innerHTML;
		vName = "<span class ='ttq_village_name' onclick='window.location = \""+tA.href+"\";return false;' title='"+aLangStrings[80]+"'>" + vName + "</span>&nbsp;<span class ='ttq_village_name ttq_village_coords' title='"+aLangStrings[81]+"' onclick='window.location = \"position_details.php?x="+tX+"&y="+tY+"\";return false;' >(" + tX + "|" + tY + ")</span>";
		myPlaceNames[parseInt(tA.href.split("=")[1])] = vName;  // village id
		myPlaceNames[tX+" "+tY] = vName;
		n8++;
	}
	// Grab Building site id while we are here... if its there.
	if ( isNaN(iSiteId) || iSiteId < 0 ) iSiteId = getSiteId();
	//Grab any other place (village) names I can see here and save them
	var otherPlaceNames = ttqTrimData(getVariable("OTHER_PLACE_NAMES", ""),MAX_PLACE_NAMES,false,"|¦?˘");
	if ( window.location.href.indexOf("position_details") != -1 ) {
		tA = $gc("coordText");
		tX = $gc("coordinateX");
		tY = $gc("coordinateY");
		if ( tA.length > 0 && tX.length > 0 && tY.length > 0 ) {
			tX = parseInt(tX[0].innerHTML.onlyText().replace("(",""));
			tY = parseInt(tY[0].innerHTML.onlyText().replace(")",""));
			if ( typeof ( myPlaceNames[tX+" "+tY] ) == "undefined" ) {
				for ( m8 = 0, l8 = otherPlaceNames.length ; m8 < l8 ; ++m8 ) {
					vName = otherPlaceNames[m8].split("|");
					if ( parseInt(vName[0]) == tX && parseInt(vName[1]) == tY ) {
						otherPlaceNames.splice(m8,1);
						break;
					}
				}
				otherPlaceNames.push(tX+"|"+tY+"|"+tA[0].innerHTML.onlyText());
			}
		}
	}
	if ( otherPlaceNames.length > 0 ) setVariable("OTHER_PLACE_NAMES", otherPlaceNames.join("|¦?˘"));
	var tOpts = getAllOptions();
	var isMinimized = tOpts["LIST_MINIMIZED"] == "true" ? true : false;
	var isHistoryMinimized = tOpts["LIST_HISTORY_MINIMIZED"] == "true" ? true : false;
	// GetRace
	iMyRace = parseInt(tOpts["RACE"]);  // 0-Romans, 1-Teutons, 2-Gauls, 5-Egyptians, 6-Huns Set via dialogue. (or -1 for autodetect)
	if ( isNaN(iMyRace) || iMyRace < 0 ) {
		iMyRace = parseInt($gc("nation")[0].className.replace(/nation/g,"")) - 1;
		if ( isNaN(iMyRace) || iMyRace < 0 || iMyRace > 6 ) iMyRace = 0;
		else setOption("RACE", iMyRace);
	}
	//Set History length
	var iHistoryLength = parseInt(tOpts["HISTORY_LENGTH"]);
	if (isNaN (iHistoryLength) || iHistoryLength < 0 ) iHistoryLength = 50;
	// Set Tab ID
	myID = Math.round(Math.random()*1000000000);
	setVariable("TTQ_TABID", myID);
	// Grab Resource Names
	var stockBar = $id('stockBar');
	if (stockBar) {
		for (var i=1; i<5; i++) {
			tA = $gc("r"+i+"Big",stockBar);
			if ( tA.length > 0 ) { aLangResources[i-1] = tA[0].alt;	}
		}
	}
	// Grab Troop Names
	var aLangTroops = nLangTroops[iMyRace];
	tA = getVariable("TROOP_NAMES", "");
	if ( tA == "" ) getTroopNames();
	else {
		aLangTroops = tA.split("|");
		isTroopsLoaded = true;
	}
	// Images
    var sCloseBtn = "data:image/png;base64,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";
    var sDeleteBtn = "data:image/gif;base64,R0lGODlhEAAMAIABAP8AAP///yH5BAEKAAEALAAAAAAQAAwAAAIfTICmu5j8lAONMuOwvTLzun3HJI5WBKGotrYrlpZBAQA7";
    var sTitleBarLogo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEwAAAASCAAAAAGjf1fmAAAAAnRSTlMA/1uRIrUAAAAJcEhZcwAACxIAAAsSAdLdfvwAAARJSURBVHicfVNbUFpXFN1cDgqoF0FBQAUEEfGF1QSxRJNYk9pEzaSpbZpxknamM23/O/npd2c6nU6+k49+2E6jM7GdamyStoltjRot8RF8IAEUEBV5ySOAF3n0gpqmr6yZe84++669zzr77INSNhDDeE3+UjUKioc9JQJD82MdwqEboEgGVwClNoUAe4gCyDjYGinY6oIhpPgU0hg9h1LgnupK2ztsctDx7VpAu3Q9rY+7dBaTb00Sl456bDoRyRttS1FISmS1mP2wxSIDQKBrA4qPA+ClsxdbYgLyL/JWXuPn8+z1M439QZ+hx7AQLkK0VN1TFRnR+DXx3ceuiLsgIScFtrdDNRlxmfxKvvwkHZsCWJUCjON1cIBnuQBzFCk+2wALO80WmixNAzAojTxfo90LmJ1v1oKTbxPf5RfjA28nFur1nnhpgL5HRYs13HuakdbAGj3gzbcyowx9SP5Ft3+8QoKNdIJiivPVxY2HvagGCjugF6DjcM/TAFf3Le6tHuNRZi3wqjLaiLmUCnaKD3lg3KgrJPUa2HwImMWFsK8tka0BA1HwnGVVKAgdAyxKgLts7tYhjWITh2RZpB3LytBcbNajExnre3XJo2bYp4VpeOKmpCwvhuNLORwcnOp1a7MpawNkAxfdC5xQMsCJhdDKZvx0lOePBSNBD3tF43FT+aWDFG7ebBNZYS53DCYx7WQFqnBp4dr5Fa/dXy80BbeyS+jTzPj2j6pYzFMLcNvnEK5N5WYjUysMdVa5t5tWHZZKvtKZTeOGGpwdcYokGWHqO0d2CxDRwEcKgHMAxwEqMlr5ANKDE2ODZ5RPuuDgCP+Py2t9Hx6Y6fKSCLro1IDPTLBc4hx17r8CHFQa4XOb85OuSkYLwARHgZFe3xM7IWhcreIc0vb3fOYkhQmgmHwd/wVfHgugOFVUiqdXexNaGjlNeltzeql3jNV58LdkhD88tHecO8qtPXT/rmb8lSsUcLjR2cTwyUyuyOP0PW4Ov8taKqeaq6I8eCEZ4ZgXNpS8AvBgbWxeANMXZqto1tZxbLmnT64RQmh1WVtWRjZRv3rRu6ciKq/X/9RONc18BFAdCJSPm5IOiTEVVm0WrwHSy2T2Iy57M0yY8PdvntC/8/OZxUjbYNfEpfuvG7H4agWzRqRnyGEgqDu2q7Aqb2cV5lIjf7yVVsLaHk3VGeFGS6jcTlxv0iBGEtS6iJz4Bgm7f7swJ+5/b9nZeuPKWPkPry1WMimQlNt+TWo3vn0VOzLnMW9bZf6oEnZF2enqzIsx0VPpg89vSTdEo59ZcSQP2OLCoIfywbQQUpYoOho9dj9XM0eZOu/gqciO2QqDyD+jvOpzrSSkrHCjQUu+Dk7pnXoswWtKoPUce4WeH8QcVZYahIDF2q9eE8BJcqpON54w7eBm3IKD4nLefE4jIZH8sqBZh8gb2Iu3/rJ2fClOnTLign/4/gQqw6wmWh5IVAAAAABJRU5ErkJggg%3D%3D";
    var sTimerFormBackground = "data:image/png;base64,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%3D";

    //Styles
    var cssStyle = "";
cssStyle += "#ttq_tasklist, #ttq_history {position:absolute; background-color: #ffffff; max-width: 800px; color:#000000; border:1px solid #C0C0C0;padding:5px 0 2px 0; z-index:501; border-radius:10px;}";
cssStyle += "#ttq_flush_history {text-align:center;color:#71D000;cursor:pointer;font-weight:bold;font-size:14px;font-family:'Lucida Sans Unicode','Arial';} #ttq_flush_history:hover {color:#00BF00}";
cssStyle += ".ttq_tasklist_row {padding:1px 10px;}";
cssStyle += ".ttq_history_row {padding:1px 5px 1px 10px;border-style:dashed;border-color:grey;border-width:0px 0px 1px 0px;}";
cssStyle += ".ttq_village_name {font-weight:bold;cursor:pointer;font-size:11px;font-family:'Lucida Sans Unicode','Arial'} .ttq_village_name:hover {color:#00BF00}";
cssStyle += ".ttq_village_coords { } .ttq_village_coords:hover {color:#00BF00}";
cssStyle += ".ttq_draghandle { font-weight:bold; color:black; border-bottom:1px solid #C0C0C0; height:20px; padding-left:11px;}";
cssStyle += ".ttq_time_village_wrapper {font-weight:bold; font-size:80%; float:"+docDir[0]+";} .ttq_time_village_wrapper:hover {color:#00BF00}";
cssStyle += ".ttq_close_btn {float:"+docDir[1]+"; margin-"+docDir[1]+":-10px; cursor:pointer}";
cssStyle +=	"#timerForm {padding:0px 20px 10px 20px; }";
cssStyle += "#timerform_wrapper {position:absolute; width:550px !important; margin:0; background:url(" + sTimerFormBackground + ") no-repeat center center; background-color: #FFFFFF; color: black; border: 1px #59D72F solid; z-index: 502; border-radius:8px;}";
cssStyle += "#timerform_wrapper p { margin:5px; }";
cssStyle +=	"#ttq_message {position:absolute; z-index:503; border:1px solid #71D000; padding:10px 20px; color:black; width:335px; border-radius:10px;}";
cssStyle += ".handle {cursor: move;}";
cssStyle += "#ttq_tasklist_sortlinks {border-bottom:1px solid #C0C0C0; margin-bottom: 5px; padding:0;}";
cssStyle += ".ttq_tasklist_sortlinks_header {padding-"+docDir[0]+": 10px; background-color: #e0e0e0;}";
cssStyle += ".ttq_tasklist_sortlinks_child {border-left: 1px solid #C0C0C0; text-align: center; background-color: #e0e0e0; cursor: pointer;}";
cssStyle += ".ttq_tasklist_sortlinks_child:hover {background-color: #efefef;}";
cssStyle += ".ttq_tasklist_sortlinks_child_active {border-left: 1px solid #C0C0C0; text-align: center; background-color: #ffffff; cursor: pointer;}";
cssStyle += ".ttq_sort_header {font-style:italic;font-weight:bold;color:red;}";
cssStyle += ".ttq_research_later {display:block;}";
cssStyle += "#sortLinkWrapper{border-bottom:1px dashed #000000;}";

TTQ_addStyle(cssStyle);
}
// *** End of Initialization and Globals ***

// *** Begin TTQ Core Functions ***
/**************************************************************************
 * Performs some initial checkings on conditions that have to be met to run the script
 * @return true if initialization was successfull, false otherwise
***************************************************************************/

function checkSetTasks() {
	_log(1, "CheckSetTasks> Begin. (tab ID = " + myID + ")");
	var aThisTask, aTasks = getVariable("TTQ_TASKS");
	var oDate = Math.floor(((new Date()).getTime())/1000); // local time
	ttqUpdatePanel(aTasks, oDate);
	if(bLocked) {
		_log(1, "CheckSetTasks> The TTQ_TASKS variables is locked. We are not able to write it. Canceling checkSetTasks...");
		return false;
	}
	bLocked = true;
	var data = getVariable("TTQ_TABID",0);
	if ( data == 0 ) {
		_log(1,"CheckSetTasks> TabID is zero. Taking control. Checking set tasks...");
		setVariable("TTQ_TABID", myID);
	} else if ( data == myID ) {
		_log(1,"CheckSetTasks> TabID is ME. Checking set tasks...");
	} else {
		_log(1,"CheckSetTasks> TabID is someone else. Canceling check set tasks. End.");
		bLocked = false;
		return false;
	}

	if ( ttqBusyTask != 0 ) {
		printMsg(getVillageName(parseInt(ttqBusyTask[4]))+ "<br>" + getTaskDetails(ttqBusyTask) + " " + aLangStrings[50] + " " + aLangStrings[69] + " ("+aLangStrings[82] +")", true); // Your task may have not been built, it appeared to timeout or crash.
		if (ADD_FAILED_BUILD_TO_HISTORY == 1){
			addToHistory(ttqBusyTask, false, aLangStrings[82]);
		}
		ttqBusyTask = 0;
	}
//-- ???? ??????????????? { ?????? ????????????? ??????, ???? ??? ???????? ?????
	if(aTasks == '') {  // no tasks are set
		_log(2, "CheckSetTasks> No tasks are set. ");
		// stop checking, it would be pointless. Checking will be restarted when new tasks are set.
		if(oIntervalReference) {
			_log(1, "CheckSetTasks> No Tasks are set. Clearing Interval.");
			window.clearInterval(oIntervalReference);
			oIntervalReference = null;
			setVariable("TTQ_TABID", 0);
			$id("ttqPanel").style.backgroundColor ="#C0C0FF";
			var ttqTimer = $id("ttqReloadTimer");
			if ( ttqTimer ) ttqTimer.innerHTML = '';
		}
		_log(1,"CheckSetTasks> End.");
		bLocked = false;
		return false;
	}
//-- }
	//CUSTOM
	var activeVillageBeforeTrigger = currentActiveVillage;
	if ( aTasks != "" ) {
		aTasks = aTasks.split("|");
		var skipVillagesFieldUpgradeSet = new Set();
		var skipVillagesDemolishSet = new Set();
		var skipVillagesBuildingUpgradeSet = new Set();
		for( indexecske = 0, tY = aTasks.length ; indexecske < tY ; ++indexecske) {
			aThisTask = aTasks[indexecske].split(",");
		// The stored time (Unix GMT time) should be compared against the GMT time, not local!
			if(aThisTask[1] <= oDate) {
				var currVillageId = aThisTask[4];
				var taskType = aThisTask[0];
				var taskSiteID =  parseInt(aThisTask[2]);
				if(taskType == "0" && taskSiteID <= 18 && skipVillagesFieldUpgradeSet.has(currVillageId)){
					//if it's an upgrade task, it's a resource field and there was already a failing resource field
					//upgrade attempt skip this
					continue;
				}
				if(taskType == "0" && taskSiteID > 18 && skipVillagesBuildingUpgradeSet.has(currVillageId)){
					//if it's an upgrade task, it's a resource field and there was already a failing resource field
					//upgrade attempt skip this
					continue;
				}
				if(taskType == "6" && skipVillagesDemolishSet.has(currVillageId)){
					continue;
				}
				_log(1, "CheckSetTasks> Triggering task: " + aTasks[indexecske]);
				var result = null;
				console.log("Trying to trigger task: "+aThisTask );
				result = triggerTask(aThisTask);
                if(result != "fail"){
					aTasks.splice(indexecske, 1);  //delete this task
					refreshTaskList(aTasks);
					aTasks = aTasks.join("|");
					setVariable("TTQ_TASKS", aTasks);
					switchActiveVillage(activeVillageBeforeTrigger);
					bLocked = false;
					return true;
				}else{
					//only if an upgrade job failed adding the village to skip
					if(taskType== "0" && taskSiteID <= 18){
						//if failed and was a resource upgrade, add to the correct set
						skipVillagesFieldUpgradeSet.add(currVillageId);
					}
					if(taskType== "0" && taskSiteID > 18){
						//if failed and was a resource upgrade, add to the correct set
						skipVillagesBuildingUpgradeSet.add(currVillageId);
					}
					if(taskType == "6"){
						skipVillagesDemolishSet.add(currVillageId);
					}
				}
			}
		}
	}
	bLocked = false;
	switchActiveVillage(activeVillageBeforeTrigger);
	tA = getOption("RELOAD_AT", 0, "integer");
	if ( tA > 0 ) {
		if( tA <= oDate ) {
			window.location = "dorf1.php";
			return;
		}
	} else setOption('RELOAD_AT', Math.floor((oDate*1000 + Math.round(ttqRandomNumber()*60000))/1000));

	_log(1, "CheckSetTasks> Some task is set, but it is not the time yet. End CheckSetTasks.");
}

function refreshTaskList(aTasks) {
	_log(3,"Begin 	()");
	// Remove old task list
	var oOldTaskList = $id("ttq_tasklist");
	if(oOldTaskList) {document.body.removeChild(oOldTaskList)};

	//if there are no tasks set, return
	if(!aTasks || aTasks.length < 1) return;
	var sTime = "";
	//Create new tasklist
	var oTaskList = document.createElement('div');
	oTaskList.id = "ttq_tasklist";
	oTaskList.innerHTML = "<div id='ttq_draghandle' class='handle ttq_draghandle' onmousedown='return false;'>"+aLangStrings[14]+"<img src='"+sTitleBarLogo+"' style='float: right; margin: 1px 5px;' onmousedown='return false;'></div>";
	ttqAddEventListener(oTaskList, "dblclick", doMinimize, false);
	//Sort links
	var currentSort = getOption("TASKLIST_SORT", 1, "integer");
	var sortLinkWrapper = document.createElement("div");

	sortLinkWrapper.id = "ttq_tasklist_sortlinks";

	// Use table
	var sortLinkTable = document.createElement("table");
	sortLinkTable.style.margin = "0";
	sortLinkTable.style.border = "0";
	sortLinkTable.style.borderCollapse = "collapse";
	sortLinkTable.style.backgroundColor = "#ffffff";
	var sortLinkTableTr = document.createElement("tr");
	var sortLinkChild = document.createElement("td");
	sortLinkChild.className = "ttq_tasklist_sortlinks_header";
	sortLinkChild.innerHTML += "<span class='ttq_sort_header'>" +aLangStrings[36]+ "</span>";
	sortLinkTableTr.appendChild(sortLinkChild);
	sortLinkChild = null;

	var sortKeys = [37, 38, 39, 40, 41];  //order is important
	sortKeys.forEach(function(el) {
			var sortLinkChild = document.createElement("td");
			sortLinkChild.className = (currentSort == el) ? "ttq_tasklist_sortlinks_child_active" : "ttq_tasklist_sortlinks_child";
			sortLinkChild.innerHTML = aLangStrings[el];
			ttqAddEventListener(sortLinkChild, "click", function(ev) {
				orderList(el, "ttq_task_row");
				setOption("TASKLIST_SORT", el);
				var siblings = ev.target.parentNode.childNodes;
				for(var j = 0; j < siblings.length; ++j)
					if (siblings[j].className != "ttq_tasklist_sortlinks_header" && siblings[j].nodeName == "TD") siblings[j].className = "ttq_tasklist_sortlinks_child";
				ev.target.className = "ttq_tasklist_sortlinks_child_active";
			}, false);
			sortLinkTableTr.appendChild(sortLinkChild);
			sortLinkChild = null;
		}
	);

	sortLinkTable.appendChild(sortLinkTableTr);
	sortLinkWrapper.appendChild(sortLinkTable);
	oTaskList.appendChild(sortLinkWrapper);
	//position the list
	var tM = getOption("LIST_POSITION", "70px_687px").split("_");
	oTaskList.style.top = tM[0];
	oTaskList.style.left = tM[1];
	tM = getOption("LIST_MINIMIZED", false, "boolean");
	if ( tM ) {
		oTaskList.style.height = "16px";
		oTaskList.style.width = "150px";
		oTaskList.style.overflow = "hidden";
	}
	document.body.appendChild(oTaskList);

	makeDraggable($id('ttq_draghandle'));

	//get the server time offset once
	if(bUseServerTime) {
		var iServerTimeOffset = getServerTimeOffset();
		if ( iServerTimeOffset == -999 ) iServerTimeOffset = 0;
	}
	var timeOffsetString = '';

	//CUSTOME
	//rendezzük a taskokat hogy előre kerüljön a legkorábbi
	aTasks.sort(function(a, b){
		var aTaskParts = a.split(",");
		var bTaskParts = b.split(",");
		return parseInt(aTaskParts[1]) - parseInt(bTaskParts[1])
	});

	//elmentjük a taskokat
	data = aTasks.join("|");
		setVariable("TTQ_TASKS", data);
		ttqUpdatePanel(data);


	for(var i = 0; i < aTasks.length; ++i) {
		var aThisTask = aTasks[i].split(",");
		//format the task time properly
		if(bUseServerTime) {
			//create timestamp for the tasktime offset to server time
			var iTaskServerTimestamp = ( parseInt(aThisTask[1]) + (iServerTimeOffset * 3600) ) * 1000;
			//create Date obj with this timestamp
			var oDate = new Date(iTaskServerTimestamp);
			//display the date without any further offsets
			//[TODO] custom date format
			var sTime = oDate.toGMTString();
			sTime = sTime.substring(0, sTime.length - 4);
			//[TODO] Isolate and internationalize descriptions
			sTime = "<span style='cursor:pointer;' id='ttq_tasktime_" +i+ "' title='This is the server time. Click to add/edit new task.' ttq_taskid='" +i+ "' >" + sTime + "</span>";
			oDate = oDate.toString().split(" GMT");
			if ( timeOffsetString == '' ) timeOffsetString = "(" + aLangStrings[67] + ": gmt "+iServerTimeOffset+")";
		} else {  //local time
			var oDate = new Date( parseInt(aThisTask[1]) * 1000 );
			oDate = oDate.toString().split(" GMT");
			var sTime = "<span style='cursor:pointer;float:left;margin:0px 2px 0px 0px;' id='ttq_tasktime_" +i+ "' title='This is your local time. Click to add/edit new task.' ttq_taskid='" +i+ "' >" + oDate[0] + "</span>";
			if ( timeOffsetString == '' ) timeOffsetString = "(" + aLangStrings[66] + ": gmt "+oDate[1].split(" ")[0]+")";
		}

		var oDeleteLink = document.createElement('a');
		oDeleteLink.innerHTML = "<img src='" +sDeleteBtn+ "' alt='X' style='vertical-align: middle;'/>";
		oDeleteLink.href = "#";
		oDeleteLink.title = aLangStrings[15];
		oDeleteLink.setAttribute("itaskindex", i);
		oDeleteLink.setAttribute("istask", "true");
		ttqAddEventListener(oDeleteLink, 'click',	deleteTask, false);

		var oTaskRow = document.createElement("div");
		oTaskRow.id = "ttq_task_row_" +i;
		oTaskRow.className = "ttq_tasklist_row";
		oTaskRow.setAttribute("tasktype", aThisTask[0]);
		oTaskRow.setAttribute("timestamp", aThisTask[1]);
		oTaskRow.setAttribute("tasktarget", aThisTask[2]);
		oTaskRow.setAttribute("taskoptions", aThisTask[3]);
		oTaskRow.setAttribute("villagedid", aThisTask[4]);

		var sTaskSubject = "";
		var sTask = "";
		var sTaskMoreInfo = "";
		switch(aThisTask[0]) {
			case "0":  //build
			case "1":  //upgrade
				sTaskSubject = "- "+aThisTask[3].split("_")[1];
				sTask = aLangTasks[aThisTask[0]];
				sTaskMoreInfo = aLangStrings[35] + " " +aThisTask[2];
				break;
			case "2":  //attack
				sTaskSubject = '>> <span id="ttq_placename_' +aThisTask[2]+ '">' +getVillageNameZ(aThisTask[2])+ '</span>';
				var aTroops = aThisTask[3].split("_");
				var iIndex = parseInt(aTroops[0]) + 18;
				if ( (iIndex == 21 || iIndex == 22) && onlySpies(aTroops) ) {
					sTask = aLangStrings[47];
					sTaskSubject = " "+aTroops[14]+" "+sTaskSubject;
				} else { sTask = aLangStrings[iIndex]; }
				sTaskMoreInfo = getTroopsInfo(aTroops);
				break;
			case "3":  //research
				var aOptions = aThisTask[3].split("_");
				sTaskSubject = "- "+aOptions[2];
				sTask = aLangTasks[aOptions[1]];
				sTaskMoreInfo = sTask + " " + sTaskSubject;
				break;
			case "4":  //train
				var aTroops = aThisTask[3].split("_");
				sTaskSubject = getTroopsInfo(aTroops);
				sTaskMoreInfo = sTaskSubject;
				sTask = aLangTasks[4];
				break;
			case "5":  //party
				sTaskSubject = aLangStrings[53];
				sTask = aLangTasks[5];
				sTaskMoreInfo = "Drink a Beer! This one is for the BrownStaine!"
				break;
			case "6":  //Demolish
				var tO = aThisTask[3].split("_");
				sTaskSubject = "A Building";
				var tT = parseInt(aThisTask[2]);
				for ( var j = 0,k = tO.length ; j < k ; ++j ) {
					if ( parseInt(tO[j].replace(/\[/g,"")) == tT ) {
						sTaskSubject = "- "+tO[j];
						break;
					}
				}
				sTask = aLangTasks[6];
				//sTaskSubject = aThisTask[3];
				sTaskMoreInfo = aLangStrings[35] + " " +aThisTask[2];
				break;
			case "7": //Send Merchants
				sTask = aLangTasks[7];
				tM = aThisTask[3].split("_");
				sTaskSubject = ">> " + getVillageNameXY(tM[0],tM[1]);
				sTaskMoreInfo = getMerchantInfo(tM);
				break;
			case "8": //Send Back/Withdraw
				sTask = aLangTasks[8];
				sTaskSubject = ">> " + aThisTask[2];
				sTaskMoreInfo = getTroopsInfo(aThisTask[3].split("_"));
				break;
			case "9": // Send troops through Gold-Club
				sTask = getOption('FARMLIST','');
				sTaskSubject = " >> " + aThisTask[2] + " ";
				break;
			default:
				break;
		}

		oTaskRow.innerHTML = "<span class='ttq_time_village_wrapper' >" +sTime + "</span><span style='float:"+docDir[0]+"'>&nbsp;&mdash;&nbsp;</span>"+ getVillageName(aThisTask[4])+" : <span title='" +sTaskMoreInfo+ "' style='cursor:help;' >" +sTask+ " " +sTaskSubject+ " </span></span>";

		oTaskRow.appendChild(oDeleteLink);
		oTaskList.appendChild(oTaskRow);
		//add listener for editing times in the task list
		var oTaskTimeSpan = $id("ttq_tasktime_"+i);
		ttqAddEventListener(oTaskTimeSpan, "click", editTime, false);
		oDeleteLink = null;
		oTaskRow = null;
		oDate = null;
	}
	$id('ttq_draghandle').innerHTML += " &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <font size=1>" + timeOffsetString + "</font>";
	orderList(currentSort, "ttq_task_row");
	_log(3, "End refreshTaskList()");
}

/**************************************************************************
 * @param iORderBy: 0 - tasktype, 1 - timestamp, 2 - target, 3 - options, 4 - villagedid
 ***************************************************************************/
function orderList (iOrderBy, sRowId) {
	var rows = xpath('//div[contains(@id, "' +sRowId+ '")]');
	if(rows.snapshotLength > 0) {
		switch(iOrderBy) {
			case 37:
				var sortKey = "tasktype";
				break;
			case 39:
				var sortKey = "target";
				break;
			case 40:
				var sortKey = "options";
				break;
			case 41:
				var sortKey = "villagedid";
				break;
			case 38:
			default:
				var sortKey = "timestamp";
				break;
		}
		var keyValue = "";
		var aRows = [];
		for(var i = 0; i < rows.snapshotLength; ++i) {
			keyValue = rows.snapshotItem(i).getAttribute(sortKey);
			aRows.push([keyValue, rows.snapshotItem(i)]);
		}
		aRows.sort(sortArray);
		switch(sRowId) {
			case "ttq_history_row":
				aRows.forEach(processSortedHistory);
				break;
			case "ttq_task_row":
			default:
				aRows.forEach(processSortedTaskList);
				break;
		}
		return false;
	} else return;
}

function editTime(ev) {
	var oTaskRow = ev.target.parentNode.parentNode;
	var type = parseInt(oTaskRow.getAttribute("tasktype"));
	var timestamp = oTaskRow.getAttribute("timestamp");
	var target = oTaskRow.getAttribute("tasktarget");
	var options = oTaskRow.getAttribute("taskoptions").split("_");
	var villagedid = oTaskRow.getAttribute("villagedid");  //(should be fixed)not supported yet. The new task will have did of currently active village.
	// Try to get the task index and pass to the form
	if (oTaskRow.getElementsByTagName("a")[0])
    var taskindex = oTaskRow.getElementsByTagName("a")[0].getAttribute("itaskindex");
	displayTimerForm(type, target, options, timestamp, taskindex, villagedid);
}

function deleteTask(e) {
	_log(3,"Begin deleteTask()");
	var iTaskIndex = e.target.parentNode;
	var isTask = iTaskIndex.getAttribute("istask") == "true" ? true : false;
	iTaskIndex = iTaskIndex.getAttribute("itaskindex");
	_log(2, "Deleting task "+iTaskIndex);
	if(bLocked) {
		_log(3, "The TTQ_TASKS variables is locked. We are not able to write it.");
		printMsg("Delete Failed! TTQ_TASKS is locked!", true);
		return false;
	}
	bLocked = true;
	if ( isTask ) var data = getVariable("TTQ_TASKS");
	else var data = getVariable("TTQ_HISTORY");
	if(data == '') {
		_log(2, "No tasks are set. ");
		bLocked = false;
		return false;  // no tasks are set
	}
	var aTasks = data.split("|");
	aTasks.splice(iTaskIndex, 1);  //delete this task
	data = aTasks.join("|");
	if ( isTask ) {
		setVariable("TTQ_TASKS", data);
		ttqUpdatePanel(data);
	} else setVariable("TTQ_HISTORY", data);
	bLocked = false;
	if ( isTask ) refreshTaskList(aTasks);
	else refreshHistory(aTasks);
	return false;  // we return false to override default action on the link
	_log(3, "End deleteTask()");
}

/**************************************************************************
 * Performs the supplied task. Prints the report.
 * @param aTask: [task, when, target, options]
 ***************************************************************************/
function triggerTask(aTask) {
    var result = null;
	_log(3,"Begin triggerTask("+aTask+")");
	ttqBusyTask = aTask;
	switch(aTask[0]) {
		case "0": //build new building
		case "1": //upgrade building
			result = upgradebuild(aTask);
			break;
		case "2": //send attack
			attack(aTask);
			break;
		case "3": //research
			research(aTask);
			break;
		case "4": //train troops
			train(aTask);
			break;
		case "5": //throw party
			party(aTask);
			break;
		case "6": //demolish building[ALPHA]
			result = demolish(aTask);
			break;
		case "7": //send merchants
			merchant(aTask);
			break;
		case "8": //send Back/Withdraw
			sendbackwithdraw(aTask);
			break;
		case "9": //send troops through Gold-Club
			sendGoldClub(aTask);
			break;
		case "10": //schedule refill of the village
			refillVillage(aTask);
			break;
		default: //do nothing
			_log(1, "Can't trigger an unknown task.");
			break;
	}
    _log(3, "End triggerTask("+aTask+")");
    return result;
}


// *** End TTQ Core Functions ***

// *** Begin History Functions ***
/**************************************************************************
 *  Adds task to the log DIV.
 *  @param bSuccess: true if the task was successfully performed.
 ***************************************************************************/
function addToHistory(aTask, bSuccess, tMsg,subSolution) {
	_log(3, "Begin Adding to history...");
	if(iHistoryLength < 1) { return; }
	var oldValue = ttqTrimData(getVariable("TTQ_HISTORY", ""), iHistoryLength-1, true);
	if ( oldValue != "" ) oldValue += "|";
	var newValue = aTask[0] + ',' + aTask[1] + ',' + aTask[2] + ',' + aTask[3];
	if(aTask[4]) newValue += ',' + aTask[4];
	else newValue += ',' + 'null';
	if(subSolution == true){
		if(bSuccess == true){
			newValue += ',' + "subSolution";
		}
	}else{
		newValue += ',' + bSuccess;
	}
	if(!bSuccess && tMsg) newValue += ',' + tMsg;
	else newValue += ',' + 'null';
	newValue = oldValue + '' + newValue;
	_log(2, "Writing var TTQ_HISTORY: "+newValue);
	if(!setVariable("TTQ_HISTORY", newValue)) _log(1, "Failed logging to history.")
	aTasks = newValue.split("|");
	refreshHistory(aTasks);
	ttqUpdatePanel();
	ttqBusyTask = 0;
	return;
}

function flushHistory() {
	setVariable("TTQ_HISTORY", "");
	refreshHistory();
}

function refreshHistory(aTasks) {
	_log(3, "Begin refreshHistory()");
	// Remove old history
	var oOldHistory = $id("ttq_history");
	if(oOldHistory) document.body.removeChild(oOldHistory);

	//if there are no tasks in the history, return
	if(!aTasks || aTasks.length < 1) return;
	var sTime = "";

	//Create new tasklist
	var oHistory = document.createElement('div');
	oHistory.id = "ttq_history";
	oHistory.innerHTML = "<div id='ttq_history_draghandle' class='handle ttq_draghandle' onmousedown='return false;'>"+aLangStrings[42]+"<img src='"+sTitleBarLogo+"' style='float: right; margin: 1px 5px;' onmousedown='return false;'></div>";
	ttqAddEventListener(oHistory, "dblclick", doMinimize, false);

	//position the list
	var listCoords = getOption("HISTORY_POSITION", "200px_687px");
	listCoords = listCoords.split("_");
	oHistory.style.top = listCoords[0];
	oHistory.style.left = listCoords[1];

	if ( getOption("LIST_HISTORY_MINIMIZED", false, "boolean") ) {
		oHistory.style.height = "16px";
		oHistory.style.width = "150px";
		oHistory.style.overflow = "hidden";
	}

	document.body.appendChild(oHistory);

	makeDraggable($id('ttq_history_draghandle'));

	for(var i = 0; i < aTasks.length; ++i) {
		var aThisTask = aTasks[i].split(",");
		oHistory.appendChild( makeHistoryRow(aThisTask, i/*, iServerTimeOffset*/) );
		var oTaskTimeSpan = $id("ttq_history_tasktime_" +i);
		if(oTaskTimeSpan) { ttqAddEventListener(oTaskTimeSpan, "click", editTime, false); }
	}

	orderList(38, "ttq_history_row");

	//flush link
	var oFlushLink = document.createElement('div');
	oFlushLink.id = 'ttq_flush_history';
	oFlushLink.innerHTML = "&ndash; "+aLangStrings[43]+" &ndash;";
//	oFlushLink.href = '#';
	oHistory.appendChild(oFlushLink);
	ttqAddEventListener(oFlushLink, 'click', flushHistory, false);
}

function makeHistoryRow(aTask, index/*, iServerTimeOffset*/) {
		_log(3,"Begin makeHistoryRow()");
		var oDate = new Date( parseInt(aTask[1]) * 1000 );
		var sTime = "<span style=' cursor:pointer;' id='ttq_history_tasktime_" +index+ "' title='This is your local time. Click to add new task.' ttq_taskid='" +index+ "' >" + oDate.toLocaleString() + "</span>";

		var oHistoryRow = document.createElement("div");
		oHistoryRow.id = "ttq_history_row_" +index;
		oHistoryRow.className = "ttq_history_row";
		oHistoryRow.setAttribute("tasktype", aTask[0]);
		oHistoryRow.setAttribute("timestamp", aTask[1]);
		oHistoryRow.setAttribute("tasktarget", aTask[2]);
		oHistoryRow.setAttribute("taskoptions", aTask[3]);
		oHistoryRow.setAttribute("villagedid", aTask[4]);
		oHistoryRow.setAttribute("taskmessage", aTask[6]);
		var sTaskSubject = "";
		var sTask = "";
		var sTaskMoreInfo = "";
		var isError = aTask[5] == "true" ? false : true;
		var isSubSolution = aTask[5] == "subSolution";


		switch(aTask[0]) {
			case "0":  //build
			case "1":  //upgrade
				sTaskSubject = "- "+aTask[3].split("_")[1];
				sTask = aLangTasks[aTask[0]];
				sTaskMoreInfo = aLangStrings[35] + " " +aTask[2];
				break;
			case "2":  //attack
				sTaskSubject = ' >> <span id="ttq_placename_history_' +aTask[2]+ '">' +getVillageNameZ(aTask[2])+ '</span>';
				var aTroops = aTask[3].split("_");
				var iIndex = parseInt(aTroops[0]) + 18;
				if((iIndex == 21 || iIndex == 22) && onlySpies(aTroops) ) {
					sTaskSubject = " "+aTroops[14]+" "+sTaskSubject;
					sTask = aLangStrings[47];
				} else { sTask = aLangStrings[iIndex]; }
				sTaskMoreInfo = getTroopsInfo(aTroops);
				break;
			case "3":  //research
				var aOptions = aTask[3].split("_");
				sTaskSubject = "- "+aOptions[2];
				sTask = aLangTasks[aOptions[1]];
				break;
			case "4":
				sTaskSubject = getTroopsInfo(aTask[3].split("_"));
				sTask = aLangTasks[4];
				break;
			case "5":
				sTaskSubject = aLangStrings[53];
				sTask = aLangTasks[5];
				break;
			case "6":  //Demolish
				sTask = aLangTasks[6];
				var tO = aTask[3].split("_");
				sTaskSubject = "A Building";
				var tT = parseInt(aTask[2]);
				for ( var i = 0,k = tO.length ; i < k ; ++i ) {
					if ( parseInt(tO[i].replace(/\[/g,"")) == tT ) {
						sTaskSubject = "- "+tO[i];
						break;
					}
				}
				sTaskMoreInfo = aLangStrings[35] + " " +aTask[2];
				break;
			case "7": //Send Merchants
				sTask = aLangTasks[7];
				sTaskSubject = " >> " + getVillageNameZ(aTask[2]) + "<br>" + getMerchantInfo(aTask[3]);
				sTaskMoreInfo = "Werd to your mudder!";
				break;
			case "8": //Send Back/Withdraw
				sTask = aLangTasks[8];
				sTaskSubject = " >> " + aTask[2] + "<br>" + getTroopsInfo(aTask[3].split("_"));
				sTaskMoreInfo = "So long and thanks for all the fish.";
				break;
			case "9": // Send troops through Gold-Club
				sTask = getOption('FARMLIST','');
				sTaskSubject = " >> " + aTask[2] + " ";
				break;
			default:
				break;
		}
		if ( isError && aTask && aTask[6] != "null" ) sTaskSubject += " (" + aTask[6] + ")";


		var sBgColor;

		if(isSubSolution){
			sBgColor = "#E08F26";
		}else{
			if(isError){
				sBgColor = "#FFB89F";
			}else{
				sBgColor = "#90FF8F";
			}
		}

		oHistoryRow.style.backgroundColor = sBgColor;

		oHistoryRow.innerHTML = getVillageName(aTask[4])+": <span title='" +sTaskMoreInfo+ "' style='cursor:help;' >" +sTask+ " " +sTaskSubject+ " </span><br><span class='ttq_time_village_wrapper' >" +sTime+"</span>";
		oDate = null;

		var oDeleteLink = document.createElement('a');
		oDeleteLink.innerHTML = "&nbsp;<img src='" +sDeleteBtn+ "' alt='X' style='vertical-align: middle;'/>";
		oDeleteLink.href = "#";
		oDeleteLink.title = aLangStrings[15];
		oDeleteLink.setAttribute("itaskindex", index);
		oDeleteLink.setAttribute("istask", "false");
		ttqAddEventListener(oDeleteLink, 'click',	deleteTask, false);
		oHistoryRow.appendChild(oDeleteLink);
		return oHistoryRow;
}
// *** End History Functions

// ****** BEGIN TTQ TASK FUNCTIONS ******
// *** Begin Build/Upgrade Functions ***
//CUSTOM added schedule NOW linkbutton
function createBuildLinks() {
	_log(3,"Begin createBuildLinks()");
	var iTask = 0;  //the default action is build new building on empty site

	var xpContract = xpath("//div[contains(@id,'contract')]");
	if ( xpContract.snapshotLength < 1 ) { //Unknown site
		_log(1, "createBuildLinks> Unknown Building site. Not creating build link. End createBuildLinks()");
		return false;
	} else if ( xpContract.snapshotLength == 1 ) { // Existing building site
		var contractText = xpContract.snapshotItem(0).getElementsByClassName("contractText");
		if ( contractText.length < 1 ) {
			_log(1, "The building is at its maximum level. End createBuildLinks()");
			return false;
		}
		iTask = 1; //Upgrade existing building
	}

	var xpBuildDesc = xpath("//div[@class='build_desc' or @class='stickyImage']");
	for ( var i = 0, j = xpBuildDesc.snapshotLength ; i < j ; ++i ) {
		var bBuildDesc = xpBuildDesc.snapshotItem(i);
		var bIMG = bBuildDesc.getElementsByTagName("img");
		if(bIMG.length<1) continue;
		var bName = "["+bIMG[0].alt+"]";
		var bID = parseInt(bIMG[0].className.split(" g")[1]);

		var oLink = document.createElement("a");
		oLink.id = "buildLater" + i;
		oLink.innerHTML = "&ndash; " + aLangStrings[iTask] + " &ndash;";
		oLink.title = aLangStrings[4];
		oLink.href = "#";
		oLink.setAttribute("itask", iTask);
		oLink.setAttribute("starget", iSiteId);
		oLink.style.display = "block";
		var eParam = window.location.search.replace(/[&?](newdid|gid|id|z|d|x|y)=\d+/g,'').replace("?","&");
		oLink.setAttribute("soptions", bID + "_" + bName + (eParam.length > 1 ? "_" + eParam: "") );
		ttqAddEventListener(oLink, 'click', displayTimerForm, false);

		//adding MOST button to schedule now
		var oLink2 = document.createElement("a");
		oLink2.id = "buildLater" + i;
		oLink2.innerHTML = "&ndash; " + "MOST" + " &ndash;";
		oLink2.title = aLangStrings[4];
		var bOptions = bID + "_" + bName + (eParam.length > 1 ? "_" + eParam: "");
		var clikMOSTFunction = function() {
			setTask(iTask, Math.floor(new Date()/1000), iSiteId, bOptions);
		};
		ttqAddEventListener(oLink, 'click', clikMOSTFunction, false);
		bBuildDesc.appendChild(oLink);

		oLink.appendChild(oLink2);
		if(AUTOMATIC_BUILD_SCHEDULE){
			clikMOSTFunction();
		}
    }
	_log(3, "End createBuildLinks()");
}

//CUSTOM
function createCustomMerchantSenderLink(){
    //kirakjuk a gombot, ami ha rákattintanak berak egy taszkot hogy a source villageből annyi nyersi legyen
    //áttalicskázva amennyi teljesen megölti az aktuális falu raktárát
    var beszurni = xpath("//div[@class='playerName']");
    var beszurniSnapshot = beszurni.snapshotItem(0);
    var oLink = document.createElement("a");
    oLink.id = "refill90pc";
    oLink.title ="refill";
    oLink.innerHTML = "Refill to 90%";
    beszurniSnapshot.appendChild(document.createElement("br"));
    beszurniSnapshot.appendChild(oLink);
    oLink.addEventListener('click', reFillStorageHandler, false);
}

//CUSTOM
function createScheduleTroopsLink(){
    var beszurni = xpath("//div[@class='playerName']");
    var beszurniSnapshot = beszurni.snapshotItem(0);
    var oLink = document.createElement("a");
    oLink.id = "scheduleTroopsInAllVillages";
    oLink.title ="troops";
    oLink.innerHTML = "scheduleTroopsInAllVillages";
    beszurniSnapshot.appendChild(document.createElement("br"));
    beszurniSnapshot.appendChild(oLink);
    oLink.addEventListener('click', function(){
		blocked = true;
		if (confirm('Really send resources?')) {

		var villagesToSendFrom = [
			'70481',
			'71013',
			'71556',
			'72001',
			'72528',
			'72963',
			'73400',
			'73866',
			'74306',
			'74683',
			'75019',
		];

		var marketIDs = [
			'35',
			'35',
			'35',
			'36',
			'35',
			'35',
			'33',
			'36',
			'35',
			'35',
			'35'
		];

		var wantedRes = '440000_280000_240000_0'
		for(var i = 0; i < villagesToSendFrom.length ; ++i ) {
			var task = [];
			task.push('7')
			task.push('1523739359')
			task.push(''+coordsXYToZ('-116','37'))
			task.push('-116_37_'+wantedRes+'_'+marketIDs[i]+'_116_525_4950_35902')
			task.push(villagesToSendFrom[i])
			console.log('the task is: ' + task);

			var result = merchant(task)
			console.log('remaining after sending from ' + villagesToSendFrom[i] + ' is : ' + result);
			var continueE = false;
			if(result != null && Array.isArray(result)){
				for(var g = 0; g < result.length ; ++g ) {
					if(result[g] != 0){
						continueE = true;
						wantedRes = result[0]+'_'+result[1]+'_'+result[2]+'_'+result[3];
					}
				}
			}
			if(!continueE){
				break;
			}
			wait(1500);
		}
		//checkSetTasks();
		} else {
			// Do nothing!
		}



		blocked = false;

	}, false);
}


//CUSTOM
function getVillageNamesAndZIDs(){
	var map = {};
	var vlist = $g("sidebarBoxVillagelist");
	if ( vlist ) {
        var villages = $gt('li',vlist);
        for ( var vn = 0; vn < villages.length; vn++ ) {
			var linkEl = $gt("a",villages[vn])[0];

			var villageName = $gc("name",linkEl)[0].textContent;
			linkVSwitch[vn] = linkEl.getAttribute('href');

			var nd = parseInt(linkVSwitch[vn].match(/newdid=(\d+)/)[1]);
			var myVid = getVidFromCoords(linkEl.innerHTML);
			var wrapper = {};
			wrapper.vid = myVid;
			wrapper.id = nd;
			wrapper.villageName = villageName;
			map[villageName] = wrapper;

        }
	}
	//CUSTOMIZE FONTOS töltsd ki a market id-ket, hogy melyik faluba hol van,TODO
	//defining barrack ids
	try{
		if(myPlayerID == "1199"){
			//sGLuk
			map['01'].barrackID = 29;
			map['02'].barrackID = 29;
			map['03'].barrackID = 29;
			map['04'].barrackID = 29;
			map['05'].barrackID = 29;
			map['06'].barrackID = 29;
			map['07'].barrackID = 33;
			map['08'].barrackID = 27;
			map['09'].barrackID = 36;
			map['10'].barrackID = 29;
			map['11'].barrackID = 29;

			//defining troops to build types
			map['02'].troopType = 't';
			map['03'].troopType = 't';
			map['04'].troopType = 't';
			map['05'].troopType = 't';
			map['06'].troopType = 't';
			map['07'].troopType = 't';
			map['08'].troopType = 't';
			map['09'].troopType = 't';


			//defining market ids
			map['01'].marketID = 35;
			map['02'].marketID = 35;
			map['03'].marketID = 35;
			map['04'].marketID = 35;
			map['05'].marketID = 35;
			map['06'].marketID = 35;
			map['07'].marketID = 35;
			map['08'].marketID = 35;
			map['09'].marketID = 33;
			map['10'].marketID = 36;
			map['11'].marketID = 35;
			map['12'].marketID = 35;
			map['13'].marketID = 35;
			map['14'].marketID = 38;
			map['15'].marketID = 35;
		}
		if(myPlayerID == "1300"){
			//Kazuár
			//map['01'].barrackID = 29;
			//map['01'].troopType = 't';
			//map['01'].marketID = 35;
		}
	}catch (err){
		console.log("ERROR: "+ err +"  "+ err.message)
	}

	return map;
}


//CUSTOM
function reFillStorageHandler(){
    //RB-ben lesz a nyersi amennyi kell ahhoz hogy nK % töltöttség legyen
    var RB = [];
    //ezeket kell átírni
    //__________________
    var marketPlaceID = 35;
    var sourceVillageID = 67815;
    //______________

    getResources();
    nK = 90;
    for (var i = 0; i < 4; i++) {
        RB[i] = Math.round( fullRes[i]  * nK/100 - resNow[i] );
        if( RB[i] < 0 ) RB[i] = 0;
    }

    //így néz kiegy merchant send task
    //setTask('7','1521109798','0','-82_44_200_200_200_200_35','67815')
    var vlist = $g("sidebarBoxVillagelist");
    var targetVillageCoord;
    if ( vlist ) {
        var villages = $gt('li',vlist);
        for ( var vn = 0; vn < villages.length; vn++ ) {
            var linkEl = $gt("a",villages[vn])[0];
            linkVSwitch[vn] = linkEl.getAttribute('href');
            var myVid = getVidFromCoords(linkEl.innerHTML);
            if( (""+linkEl).match(currentActiveVillage) ) {
                 targetVillageCoord = coordZToXY(myVid);
            }
        }
    }
    if (typeof targetVillageCoord !== 'undefined'){
        console.log("INFO target village coord is: " +targetVillageCoord);
        var taskID= 7;//merchant taskID
        var target = 0;//ez maradjon 0..
        var options = targetVillageCoord[0] + "_" + targetVillageCoord[1] + "_" + RB[0] + "_" + RB[1] + "_" + RB[2] + "_" + RB[3] + "_" + marketPlaceID;

        var coordToZ = coordsXYToZ(targetVillageCoord[0],targetVillageCoord[1]);
        var _1day = 1000 *60 *60 *24;
        var oDate =Math.floor((new Date().getTime()- _1day)/1000 );
		setTask(taskID,oDate,coordToZ,options, undefined, sourceVillageID);


		checkSetTasks();
    }else{
        console.log("ERROR could not determine target village coord");
    }
}

function upgradebuild(aTask) {
    var result = "fail";
	// UpgradeBuild> Begin. aTask = (1,1303246876,36,5_Sawmill,151972)
	_log(3,"UpgradeBuild> Begin. aTask = ("+JSON.stringify(aTask)+")");
	printMsg(aLangStrings[6] + " > 1<br><br>" + getTaskDetails(aTask));

	var buildingID = parseInt(aTask[3]);
	var buildingName = aTask[3].split("_")[1];
	var eParam = aTask[3].split("_")[2];
	var oldVID = parseInt(aTask[4]);
	if ( isNaN(oldVID) ) oldVID = -2;

	var httpRequest = new XMLHttpRequest();

		_log(3,"UpgradeBuild> Posting Build/Upgrade request... "+"build.php?" + ((oldVID != 'null')?("newdid=" + oldVID):("")) + "&id=" + aTask[2] + (eParam ? eParam: ""));
		httpRequest.open("GET", fullName+"build.php?" + ((oldVID != 'null')?("newdid=" + oldVID):("")) + "&id=" + aTask[2] + (eParam ? eParam: ""), false);
		httpRequest.onreadystatechange = function() {
			if (httpRequest.readyState == 4) { //complete
				printMsg(aLangStrings[6] + " > 1 > 2<br><br>" + getTaskDetails(aTask));
				if (httpRequest.status == 200 && httpRequest.responseText) { // ok
					var holder = document.createElement('div');
					holder.innerHTML = httpRequest.responseText;
					var myContracts = holder.getElementsByClassName("buildingWrapper");
					if ( myContracts.length <= 0 ) {
						myContracts = holder.getElementsByClassName("showBuildCosts normal");
						if ( myContracts.length <= 0 ) {
							myContracts = holder.getElementsByClassName("build");
							if ( myContracts.length <= 0 ) return;
						}
					}
					var myBuilds = holder.getElementsByClassName("roundedCornersBox");
					if (myBuilds.length <=0 ) myBuilds = holder.getElementsByClassName("build_desc");

					var reqVID = getActiveVillage(holder);

					if ( myBuilds.length > 0 && myContracts.length > 0 && oldVID == reqVID ) {
						var ii,j,tmp;
						for ( ii = 0 , j = myBuilds.length; ii < j ; ++ii ) {
							tmp = myBuilds[ii].getElementsByTagName('img');
							if ( tmp.length < 1 ) continue;
							tmp = parseInt(tmp[0].className.split(" g")[1]);
							if ( isNaN(tmp) || tmp != buildingID ) continue;
							tmp = myContracts[ii].getElementsByTagName("button");
							if ( tmp.length > 0 ) {
								if (tmp[0].getAttribute('class')) if (tmp[0].getAttribute('class').indexOf("gold builder") > -1)
								{
									_log(1, "UpgradeBuild> Found the button but it would use gold (Master Builder).");
									printMsg(getVillageName(oldVID)+ "<br>" + buildingName + " Found the button but it would use gold (Master Builder).", true);
									if(ADD_FAILED_BUILD_TO_HISTORY == 1){
										addToHistory(aTask, false, "Master Builder");
									}
									return;
								}
								if (tmp[0].getAttribute('class')) if (tmp[0].getAttribute('class').indexOf("disabled") > -1)
								{
									_log(1, "UpgradeBuild> Found the button but its disabled because there are not enough resources.");
									printMsg(getVillageName(oldVID)+ "<br>" + buildingName + " Found the button but its disabled because there are not enough resources", true);
									if(ADD_FAILED_BUILD_TO_HISTORY == 1){
										addToHistory(aTask, false, "Not enough resources");
									}
									return;
								}
								if (tmp[0].getAttribute('class')) if (tmp[0].getAttribute('class').indexOf("gold") > -1)
								{
									_log(1, "UpgradeBuild> Found the button but its disabled because there are not enough resources.");
									printMsg(getVillageName(oldVID)+ "<br>" + buildingName + " Found the button but its disabled because there are not enough resources", true);
									if(ADD_FAILED_BUILD_TO_HISTORY == 1){
										addToHistory(aTask, false, "Not enough resources");
									}
									return;
								}
								tmp = tmp[0].getAttribute("onclick").split("'")[1];
								if ( tmp ) {
									_log(2, "UpgradeBuild> Posting Build/Upgrade request...\nhref> " + tmp + "\nmyOptions> " + aTask);
									result = get(fullName+tmp, handleRequestBuild, aTask,false);
									return result;
								}
								if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
								_log(1, "UpgradeBuild> Found the button but could not find the link for Build/Upgrade! (No Link 1)");
								printMsg(getVillageName(oldVID)+ "<br>" + buildingName + " " + aLangStrings[68]+" ("+aLangStrings[70]+" 1)", true); // Your building can't be built. because we cant find the link
								if(ADD_FAILED_BUILD_TO_HISTORY == 1){
									addToHistory(aTask, false, aLangStrings[70] + " 1");ű
								}
								return;
							}
							if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
							tmp = myContracts[ii].getElementsByClassName("contractLink");
							if ( tmp.length > 0 ) tmp = tmp[0].innerHTML;
							else tmp = myContracts[ii].innerHTML;
							tmp = "["+tmp+"]";
							_log(1, "UpgradeBuild> Did not find the button. Reason: " + tmp);
							printMsg(getVillageName(oldVID)+ "<br>" + buildingName + " " + aLangStrings[68] + " (" + aLangStrings[70] + " 2: " + tmp +")", true); // Your building can't be built. Because there was no button and a reason provided.
							if(ADD_FAILED_BUILD_TO_HISTORY == 1){
								addToHistory(aTask, false, aLangStrings[70] + " 2: " +tmp);
							}
							return;
						}
						if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
						_log(1, "UpgradeBuild> Could not find the building (gid="+buildingID+") in the list of building descriptions.");
						printMsg(getVillageName(oldVID)+ "<br>" + buildingName + " "+aLangStrings[71] +" (" + aLangStrings[72]+")", true); // Your building can't be built. Because there was no building description. Building not found.
						if(ADD_FAILED_BUILD_TO_HISTORY == 1){
							addToHistory(aTask, false, aLangStrings[72]);
						}
						return;
					}
					if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
					_log(1, "UpgradeBuild> Could not find the building (gid="+buildingID+") it appears we got redirected. (Server: Redirect 1)");
					printMsg(getVillageName(oldVID)+ "<br>" + buildingName + ' (' + aLangStrings[74] +" "+aLangStrings[11]+" 1)", true); // Your building can't be built. Because there was no building description. Building not found.
					if(ADD_FAILED_BUILD_TO_HISTORY == 1){
						addToHistory(aTask, false, aLangStrings[74]+" "+aLangStrings[11]+" 1");
					}
					return;
				}
				switchActiveVillage(currentActiveVillage);
				_log(1, "UpgradeBuild> Could not build the building (gid="+buildingID+"). The server returned a non-200 code (or the request was empty) upon trying to load the send troops page.  ("+aLangStrings[74] +" "+ aLangStrings[46]+" 1)");
				printMsg(getVillageName(oldVID)+ "<br>" + buildingName + ' ' + aLangStrings[73] + " ("+aLangStrings[74] +" "+ aLangStrings[46]+" 1)", true); // Your building can't be built. Because there was a bad response from the server.
				if(ADD_FAILED_BUILD_TO_HISTORY == 1){
					addToHistory(aTask, false, aLangStrings[74] +" "+ aLangStrings[46]+" 1");
				}
			}
		}
		httpRequest.send(null);
	_log(3, "UpgradeBuild> End. aTask = ("+aTask+")");
    return result;
}

function handleRequestBuild(httpRequest, aTask) {
	var result = "fail";
//	_log(0,"Begin handleRequestBuild("+httpRequest+", "+aTask+")");
	if (httpRequest.readyState == 4) {
		var buildingName = aTask[3].split("_")[1];
		var oldVID = parseInt(aTask[4]);
		if ( isNaN(oldVID) ) oldVID = -2;

		if (httpRequest.status == 200 && httpRequest.responseText) { // ok
			var holder = document.createElement('div');
			holder.innerHTML = httpRequest.responseText;
			var thisNewdid = getActiveVillage(holder);
			if ( thisNewdid != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
			var re = new RegExp(buildingName, 'i');
			var bL = $gc('buildingList',holder);

			if( bL.length < 1 ) {
				printMsg(getVillageName(oldVID)+ "<br>" + buildingName + ' ' + aLangStrings[8] + " ("+aLangStrings[75]+")", true); // Your building can't be built.
				if(ADD_FAILED_BUILD_TO_HISTORY == 1){
					addToHistory(aTask, false, aLangStrings[75]);
				}
				return result;
			}

			if ( thisNewdid == oldVID ) {
				if ( bL[0].innerHTML.match(re) ) {
					printMsg(getVillageName(oldVID)+ "<br>" + aLangStrings[5] +' '+ buildingName);  //Your building is being built.
					addToHistory(aTask, true);
					result = "success";
				} else {
					printMsg(getVillageName(oldVID)+ "<br>" + buildingName + ' ' + aLangStrings[8] + " ("+aLangStrings[75]+")", true); // Your building can't be built.
					if(ADD_FAILED_BUILD_TO_HISTORY == 1){
						addToHistory(aTask, false, aLangStrings[75]);
					}
				}
			} else {
				if ( bL[0].innerHTML.match(re) ) {
					printMsg(getVillageName(oldVID)+ "<br>" + buildingName + ' ' + aLangStrings[76] +" ("+aLangStrings[77]+" "+getVillageName(thisNewdid)+")", true); // Your building was probably misbuilt
					if(ADD_FAILED_BUILD_TO_HISTORY == 1){
						addToHistory(aTask, false, aLangStrings[77]+" "+getVillageName(thisNewdid));
					}
				} else {
					_log(1, "handleRequestBuild> Could not find the building (gid="+buildingID+") it appears we got redirected. (Server: Redirect 2)");
					printMsg(getVillageName(oldVID)+ "<br>" + buildingName + ' (' + aLangStrings[74] +" "+aLangStrings[11]+" 2)", true); // Your building can't be built. Because there was no building description. Building not found.
					if(ADD_FAILED_BUILD_TO_HISTORY == 1){
						addToHistory(aTask, false, aLangStrings[74]+" "+aLangStrings[11]+" 2");
					}
				}
			}
			return result;
		}
		switchActiveVillage(currentActiveVillage);
		_log(1, "handleRequestBuild> Request to build was sent, however, I could not confirm the building (gid="+buildingID+") was built. The server returned a non-200 code (or the request was empty) while loading the page to confirm on.  ("+aLangStrings[74] +" "+ aLangStrings[46]+" 2)");
		printMsg(getVillageName(oldVID)+ "<br>" + buildingName + ' ' + aLangStrings[73] + " ("+aLangStrings[74] +" "+ aLangStrings[46]+" 2)", true); // Your building can't be built. Because there was a bad response from the server.
		if(ADD_FAILED_BUILD_TO_HISTORY == 1){
			addToHistory(aTask, false, aLangStrings[74] +" "+ aLangStrings[46]+" 2");
		}
	}
	_log(3, "End handleRequestBuild("+httpRequest+", "+aTask+")");
	return result;
}
// *** End Build/Upgrade Functions ***

// *** Begin Research Functions ***
function createResearchLinks(buildingID) {
	_log(3,"Begin createResearchLinks()");
	//is this Academy or Smithy?
	switch ( buildingID ) {
		case 13: // Smithy
					var linkTxt = aLangStrings[1];
					var type = 1;
					break;
		case 22: // Academy
					var linkTxt = aLangStrings[3];
					var type = 3;
					break;
		default:	_log(1,"createResearchLinks> This is not the Academy or Smithy. End createResearchLinks()");
					return;
	}
	_log(2, "Adding research later links...");

	var tContract = document.getElementsByClassName("build_details");
	if ( tContract.length < 1 ) return;
	tContract = tContract[0];
	if ( buildingID == 13 ) var tLevels = tContract.getElementsByClassName("level");
	var tImg = tContract.getElementsByClassName("unit");
	tContract = tContract.getElementsByClassName("contractLink");

	var iTroopId, oLink, oLvl, sTroopLvlText, sTroopLvl;
	for ( var i = 0, j = tContract.length ; i < j ; ++i ) {
		if ( buildingID == 13 ) {
			sTroopLvlText = tLevels[i].textContent;
			if ((oLvl = sTroopLvlText.match(/\d+/g)) != null) {
				sTroopLvl = parseInt(oLvl[0]) + (oLvl.length > 1 ? parseInt(oLvl[1]) : 0);
				if ( sTroopLvl > 19 ) continue; // Skip if level is maxed out
			}
		}
		iTroopId = parseInt(tImg[i].className.split(" u")[1])%10;
		if ( iTroopId == 0 ) iTroopId = 10;
		oLink = document.createElement("a");
		oLink.id = "ttq_research_later" + i;
		oLink.className = "ttq_research_later";
		oLink.innerHTML = " &ndash; " + linkTxt + " &ndash; ";
		oLink.title = linkTxt;
		oLink.href = "#";
		oLink.setAttribute("itask", 3);
		oLink.setAttribute("starget", iSiteId);
		oLink.setAttribute("soptions", iTroopId + "_" + type + "_["+tImg[i].alt+"]");
		oLink.setAttribute("style","float:right;");
		ttqAddEventListener(oLink, 'click',	displayTimerForm, false);
		tContract[i].parentNode.appendChild(oLink);
	}
	_log(3, "End createResearchLinks()");
}

function research(aTask) {
	_log(1,"Begin research("+aTask+")");
	printMsg(aLangStrings[6] + " > 1<br><br>" + getTaskDetails(aTask));
	if(aTask[4] != 'null') var sNewDid = "&newdid=" +aTask[4];
	else var sNewDid = "";
	var sUrl = "build.php?id=" + aTask[2] + sNewDid;
	get(fullName+sUrl, handleRequestResearch, aTask);
	_log(1, "End research("+aTask+")");
}

function handleRequestResearch(httpRequest, aTask) {
//	_log(1,"Begin handleRequestResearch("+httpRequest+", "+aTask+")");
	if (httpRequest.readyState == 4 ) {
		printMsg(aLangStrings[6] + " > 1 > 2<br><br>" + getTaskDetails(aTask));
		var oldVID = parseInt(aTask[4]);
		if ( isNaN(oldVID) ) oldVID = -2;
		var iTroop = parseInt(aTask[3].split("_")[0]);

		if (httpRequest.status == 200 && httpRequest.responseText) {
			var holder = document.createElement('div');
			holder.innerHTML = httpRequest.responseText;
			var tConract = holder.getElementsByClassName("contracting");
			var currResearch = holder.getElementsByClassName("under_progress");
			var divResearch = holder.getElementsByClassName("research");

			var reqVID = getActiveVillage(holder);

			if ( reqVID == oldVID && (holder.getElementsByClassName("gid22").length == 1 || holder.getElementsByClassName("gid13").length == 1) ) {
				var oReason, tReason, iTroopClassNr;
				if ( divResearch.length > 0 ) {
					for ( var i = 0; i < divResearch.length ; ++i ) {
						iTroopClassNr = iMyRace*10+iTroop;
						var tImg = divResearch[i].getElementsByClassName("u"+iTroopClassNr);
						if ( tImg.length > 0 ) {
							oReason = divResearch[i].getElementsByClassName("none");
							if (oReason.length > 0) {
								tReason = oReason[0].textContent;
							} else {
								tReason = "Unknown error.";
							}
							break;
						}
					}
				}
				if ( tConract.length > 0) {
					var sURL, i, j;
					for ( i = 0, j = tConract.length; i < j ; ++i ) {
						sURL = tConract[i].getAttribute("onclick").split("'")[1];
						if ( sURL.indexOf("a=" + iTroop) != -1 ) {
							get(fullName+sURL,handleRequestResearchConfirmation, aTask);
							return;
						}
					}
				}
				else {
					if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
					//var tReason = "["+holder.getElementsByClassName("none")[0].innerHTML+"]";
					_log(1, "handleRequestResearch> Request to research was not sent. It appears we are already researching something (No Link 1)");
					printMsg(getVillageName(oldVID)+ "<br> ["+aTask[3].split("_")[2]+"] " + aLangStrings[69] +" ("+aLangStrings[70]+" 1: "+tReason+")", true);
					addToHistory(aTask, false, aLangStrings[70]+" 1: "+tReason);
					return;
				}
				if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
				_log(1, "handleRequestResearch> Request to research was not sent. I do not see the research links. (No Link 2)");
				printMsg(getVillageName(oldVID)+ "<br> ["+aTask[3].split("_")[2]+"] " + aLangStrings[68] +" ("+aLangStrings[70]+" 2)", true);
				addToHistory(aTask, false, aLangStrings[70]+" 2");
				return;
			}
			if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
			_log(1, "handleRequestResearch> Request to research was not sent. It appears we got redirected. (Server: Redirect 1)");
			printMsg(getVillageName(oldVID)+ "<br> ["+aTask[3].split("_")[2]+"] " + aLangStrings[73] +" ("+aLangStrings[74]+" "+aLangStrings[11]+" 1)", true);
			addToHistory(aTask, false, aLangStrings[74]+" "+aLangStrings[11]+" 1");
			return;
		}
		switchActiveVillage(currentActiveVillage);
		_log(1, "handleRequestResearch> Request to research was not sent. The server returned a non-200 code (or the request was empty) while loading the final page to build the last request from.  ("+aLangStrings[74] +" "+ aLangStrings[46]+" 1)");
		printMsg(getVillageName(oldVID)+ "<br> ["+aTask[3].split("_")[2]+"] " + aLangStrings[73] + " ("+aLangStrings[74] +" "+ aLangStrings[46]+" 1)", true); // Your research did not confirm.
		addToHistory(aTask, false, aLangStrings[74] +" "+ aLangStrings[46]+" 1");
	}
}

function handleRequestResearchConfirmation(httpRequest, aTask) {
	_log(1,"Begin handleRequestResearchConfirmation("+httpRequest+", "+aTask+")");
	if (httpRequest.readyState == 4) {
		var oldVID = parseInt(aTask[4]);
		if ( isNaN(oldVID) ) oldVID = -2;
		var iTroop = parseInt(aTask[3].split("_")[0]);
		if (httpRequest.status == 200 && httpRequest.responseText) {
			var iTroopClassNr;
			var holder = document.createElement('div');
			holder.innerHTML = httpRequest.responseText;

			var reqVID = getActiveVillage(holder);
			if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
			if ( reqVID == oldVID && (holder.getElementsByClassName("gid22").length == 1 || holder.getElementsByClassName("gid13").length == 1) ) {
				var ti = holder.getElementsByClassName("under_progress");
				if ( ti.length > 0 ) {
					iTroopClassNr = iMyRace*10+iTroop;
					ti = ti[0].getElementsByClassName("u"+iTroopClassNr);
					if (ti.length > 0) {
						printMsg(getVillageName(oldVID)+ "<br>" + aLangStrings[44] + " "+aTask[3].split("_")[2]);
						addToHistory(aTask, true);
						return;
					}
				}
				printMsg(getVillageName(oldVID)+ '<br> [' + aTask[3].split("_")[2]+"] " + aLangStrings[45] + " (" + aLangStrings[75] + ")", true);
				addToHistory(aTask, false, aLangStrings[75]);
				return;
			}
			_log(1, "handleRequestResearch> Request to research was sent. It appears we got redirected. (Confirmation Failed, Server: Redirect 2)");
			printMsg(getVillageName(oldVID)+ '<br> [' + aTask[3].split("_")[2]+"] " + aLangStrings[73]+" "+aLangStrings[50]+" ("+aLangStrings[75] +", "+aLangStrings[74]+" "+aLangStrings[11]+" 2)", true); // Your building can't be built. Because there was no building description. Building not found.
			addToHistory(aTask, false, aLangStrings[75] +", "+aLangStrings[74]+" "+aLangStrings[11]+" 2");
			return;
		}
		switchActiveVillage(currentActiveVillage);
		_log(1, "HTTP request status: " + httpRequest.status); // failed
		printMsg(getVillageName(oldVID)+ '<br> [' + aTask[3].split("_")[2]+"] " + aLangStrings[73]+" "+aLangStrings[50] + " (" + aLangStrings[75] +", "+ aLangStrings[74] +" "+ aLangStrings[46] +" 2)", true);
		addToHistory(aTask, false, aLangStrings[75] +", "+ aLangStrings[74] +" "+ aLangStrings[46] +" 2");
	}
	_log(2, "End handleRequestResearchConfirmation("+httpRequest+", "+aTask+")");
}
// *** End Research Functions ***

// *** Begin Party Functions ***
function createPartyLinks(/*sBuildingId*/) {
	_log(3,"Begin createPartyLinks()");

	//var xpathBuildingNames = xpath("//h1");
	//var re = new RegExp("(.*)\\s(?:<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>)?" + aLangStrings[7] + "\\s[0-9]{1,3}(?:<\/\\2>)?$", "i");
	//var re2 = new RegExp("[0-9]{1,3}\\.\\s(.*)$", "i");
	//var xpathResult = xpath("id('content')/div[@class='gid24']");

	//if(xpathResult.snapshotLength > 0) {
//		var xpathStart = document.getElementsByClassName("act");
		var xpathStart = document.getElementsByClassName("information");
		_log(3, "Time to party. Found " + xpathStart.length + " type of parties.");
		var linkTxt = aLangStrings[53];
		for(var i = 0; i < xpathStart.length ; ++i ) {
			if ( i == 2 ) continue;
//			var sBuildingName = xpathBuildingNames.snapshotItem(0).innerHTML;
//			var aMatches = sBuildingName.match(re);
//			sBuildingName = aMatches[1];
//			sBuildingName = rtrim(sBuildingName);
//			var sBuildingId = aLangBuildings.indexOf(sBuildingName);
			var thisStart = xpathStart[i];
			var pLink = document.createElement("a");
			pLink.id = "ttq_research_later" + i;
			pLink.className = "ttq_research_later";
			pLink.innerHTML = " " + linkTxt;
			pLink.title = linkTxt;
			pLink.href = "#";
			pLink.setAttribute("itask", 5);
			pLink.setAttribute("starget", iSiteId);
			pLink.setAttribute("soptions", /*sBuildingId*/i+1);
			ttqAddEventListener(pLink, 'click', displayTimerForm, false);
			thisStart.appendChild(pLink);
		}
	//}
	_log(3,"End createPartyLinks()");
}

function party(aTask) {
	_log(1,"Begin party("+aTask+")");
	printMsg(aLangStrings[6] + " > 1<br><br>" + getTaskDetails(aTask));
	if(aTask[4] != 'null') var sNewDid = "&newdid=" +aTask[4];
	else var sNewDid = "";
	var sUrl = "build.php?id=" + aTask[2] + "&a=" + aTask[3] + sNewDid;
	var myOptions = [aTask, currentActiveVillage];
	get(fullName+sUrl, handleRequestParty, myOptions);
	_log(1, "End party("+aTask+")");
}

function handleRequestParty(httpRequest, options) {
	_log(3,"Begin handleRequestParty("+httpRequest+", "+options+")");
	var aTask = options[0];
	var activateVillageDid = parseInt(options[1]);
	if (httpRequest.readyState == 4) {
		switchActiveVillage(activateVillageDid);
		if (httpRequest.status == 200) {
			var sResponse = httpRequest.responseText;
			if( getActiveVillage($ee('DIV',sResponse)) != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
			if(!sResponse) { // error retrieving the response
				printMsg( aLangTasks[aTask[0]] + ' ' + aTask[3] + ' ' + aLangStrings[5], true );
				addToHistory(aTask, false);
				return;
			}
			var re = new RegExp('under_progress', 'i');
			if(sResponse.match(re)) {
				printMsg(getVillageName(aTask[4])+ "<br>" + aLangStrings[55] + aLangStrings[53]);
				addToHistory(aTask, true);
			} else {
				printMsg(getVillageName(aTask[4])+ "<br>" + aLangStrings[53] +''+ aLangStrings[54], true);
				addToHistory(aTask, false);
			}
			return;
		}
		printMsg(getVillageName(aTask[4])+ "<br>" + aLangStrings[53] +''+ aLangStrings[54], true);
		addToHistory(aTask, false);
	}
	_log(3, "End handleRequestParty("+httpRequest+", "+options+")");
}
// *** End Party Functions ***

// *** Begin Send Troops Functions ***
function createAttackLinks() {
	_log(3,"Begin createAttackLinks()");
	var xpathResult = xpath("id('content')//input[@type='text']");
	if(xpathResult.snapshotLength < 1) {
		_log(3, "We are not creating the 'Send later' button here.");
		return false;
	}

	// create the button //Add the new button after the original
	if ( /[&?]d=\d+/.test(location.search) && $gn("snd").length == 0 ) { //At Send Troops Back screen
		var SndLtrBtn = generateButton(aLangStrings[16], scheduleSendBack);
	} else {
		//create textbox for hero if it's not present
		var heroBox = document.getElementsByClassName ("line-last column-last");
		if( heroBox[0].firstChild == null )   //no hero textbox - make one
			heroBox[0].innerHTML = " <img class='unit uhero' src='img/x.gif' title='"
				+aLangTroops[10]+"' onclick='document.snd.t11.value=\"\"; return false;' alt='"+aLangTroops[10]+"' style='cursor:pointer' />"
				+" <input type='text' class='text' name='t11' value='' />"
				+" <a style='cursor:pointer'>(1)<br />(" +aLangStrings[33]+ ")</a>";
		//Set the last line of table to top-aligned
		lastline=xpath("//table[@id='troops']/tbody/tr[3]/td");
		for (var x=0;x<lastline.snapshotLength;x++) {lastline.snapshotItem(x).style.verticalAlign="top";}
		var SndLtrBtn = generateButton(aLangStrings[16], scheduleAttack);
	}
	var oOkBtn = $id('btn_ok');
	var obp = oOkBtn.parentNode;
	if (obp.childNodes.length < 14 ) obp.appendChild(SndLtrBtn);
	else oOkBtn.parentNode.appendChild(SndLtrBtn, obp.childNodes[13]);
	_log(3, "End createAttackLinks()");
}

function scheduleSendBack(e) {
	_log(2,"ScheduleSendBack> Begin.");
	var aTroops = new Array();
	aTroops[0] = location.search.match(/[&?]d=(\d+)/)[1]; // the d value
	var xpathRes = xpath("//table//td/input[@type='text']");
	var bNoTroops = true;
	var c = 0;
	var aThisInput, iTroopId;
	if(xpathRes.snapshotLength > 0) {
		for (var i = 1; i < 12; ++i) {
			aThisInput = xpathRes.snapshotItem(c);
			if ( aThisInput != null ) iTroopId = parseInt(aThisInput.name.split("[")[1].split("]")[0]);
			else iTroopId = 0;
			if ( iTroopId == i ) {
				aTroops[i] = (aThisInput.value != '') ? aThisInput.value : 0;
				++c;
			} else aTroops[i] = 0;
			if(aThisInput != null && aThisInput.value) {bNoTroops = false;}  //at least 1 troop has to be sent
		}
	} else {
		_log(1, "No info about troops found. Unable to schedule the send back/withdraw.");
		printMsg(aLangStrings[17] , true);
		return false;
	}
	if(bNoTroops) {
		_log(1, "No troops were selected. Unable to schedule the send back/withdraw.");
		printMsg(aLangStrings[17] , true);
		return false;
	}

	displayTimerForm(8, document.getElementsByClassName("role")[0].firstChild.innerHTML.onlyText() , aTroops);
	_log(3,"ScheduleSendBack> End.");
}

function sendbackwithdraw (aTask) {
	_log(2,"sendbackwithdraw> Begin. aTask = " + aTask);
	printMsg(aLangStrings[6] + " > 1<br><br>" + getTaskDetails(aTask));
	var aTroops = aTask[3].split("_");
	var sParm = "id=39&a=3&d=" + aTroops[0];
	for ( var i = 1 ; i < 12 ; ++i ) if ( parseInt(aTroops[i]) > 0 ) sParm += "&t["+i+"]="+aTroops[i];
	sParm += "&s1=ok";
	post(fullName+"build.php",sParm, handleSendBackRequestConfirmation, aTask);
	_log(3,"sendbackwithdraw> End.");
}

function handleSendBackRequestConfirmation (httpRequest, options) {
	if (httpRequest.readyState == 4 ){
		printMsg(aLangStrings[6] + " > 1 > 2<br><br>" + getTaskDetails(options));
		if ( httpRequest.status == 200 && httpRequest.responseText ) {
			var holder = document.createElement('div');
			holder.innerHTML = httpRequest.responseText;
			if ( holder.getElementsByClassName('gid16').length > 0 ) {  //if its the rally point, it should have been successful.
				_log(1, "I think those troops were sent back/withdrawn.");
				printMsg(aLangStrings[78]+" "+options[2]);
				addToHistory(options, true);
			} else {
				_log(1, "I'm not so sure those troops were sent back/withdrawn.");
				printMsg(aLangStrings[79]+" "+options[2]+" ("+aLangStrings[75] + ", " +aLangStrings[74] + " " + aLangStrings[11]+")",true);
				addToHistory(options, false, aLangStrings[75] + ", " +aLangStrings[74] + " " + aLangStrings[11]);
			}
			if( getActiveVillage(holder) != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
			return;
		}
		_log(1, "Request to Send Back/Withdraw was sent, however, I could not confirm it. Bad response from server when confirming. (Confirmation Failed, Server: Page Failed)");
		printMsg(aLangStrings[79]+" "+options[2] + " ("+aLangStrings[75] + ", " + aLangStrings[74] + " " + aLangStrings[46], true);
		addToHistory(aTask, false, aLangStrings[75] + ", " +aLangStrings[74] + " " + aLangStrings[46]);
	}
}

function scheduleAttack(e) {
	_log(3,"scheduleAttack> Begin.");

	var iVillageId = crtPath.match(/[&?]z=(\d+)/);  // target village
	if(iVillageId != null) {
		iVillageId = iVillageId[1];
	} else { //try to get the coordinates
		var sX = document.getElementsByName('x');
		var sY = document.getElementsByName('y');
		iX = sX[0].value;
		iY = sY[0].value;
		if(iX != '' && iY != '') iVillageId = coordsXYToZ(iX, iY);
	}
	if(iVillageId == null) {
		_log(2, "Target village ID not found.");
		printMsg(aLangStrings[34], true);
		return false;
	}//            0		1	2	3	4	5	6	7	8	9	10		11		12		13		14		15		16
			//     type, 	t1,	t2,	t3,	t4,	t5,	t6,	t7,	t8,	t9,	t10,	t11(h),	traps,	gid,	spy,	kata1,	kata2
	var aTroops = [0,		0,	0,	0,	0,	0,	0,	0,	0,	0,	0,		0,		0,		-1,		-1,		-1,		-1,];
	var iAttackType = null;
	var xpathRes = xpath("id('content')//input[@type='radio']");
	for (var i = 0; i < xpathRes.snapshotLength; ++i) if (xpathRes.snapshotItem(i).checked) iAttackType = i+2;
	if(iAttackType != null) {aTroops[0] = iAttackType;}
	else {
		_log(2, "The type of attack was not determined again. Unable to schedule the attack.");
		printMsg("Attack type not determined",true);
		return false;
	}

	xpathRes = xpath("//*[@id='troops']//td/input");
	var bNoTroops = true;
	if(xpathRes.snapshotLength > 10) {
		for (var i = 0; i < 11 ; ++i) {
			var aThisInput = xpathRes.snapshotItem(i);
			var iTroopId = parseInt(aThisInput.name.substring(1));
			if ( isNaN(iTroopId) || iTroopId < 1 || iTroopId > 11 ) continue;
			var tV = parseInt(aThisInput.value);
			if ( isNaN(tV) || tV < 1 ) {
				aTroops[iTroopId] = 0;
			} else {
				aTroops[iTroopId] = tV;
				bNoTroops = false;  //at least 1 troop has to be sent
			}
		}
	} else {
		_log(2, "No info about troops found. Unable to schedule the attack.");
		printMsg("No info about troops found. Unable to schedule the attack.",true);
		return false;
	}

	if(bNoTroops) {
		_log(2, "No troops were selected. Unable to schedule the attack.");
		printMsg(aLangStrings[17] , true);
		return false;
	}

	var xpathRes = $gn("redeployHero");
	aTroops[17] = xpathRes.length > 0 && xpathRes[0].checked == true ? 1: 0;

	// Good, we have at least 1 troop. Display the form
	displayTimerForm(2, iVillageId, aTroops);
	_log(3, "End scheduleAttack()");
}

function attack(aTask) {
	_log(1,"Begin attack("+aTask+")");
	printMsg(aLangStrings[6] + " > 1<br><br>" + getTaskDetails(aTask));
	if(aTask[4] != 'null') {  //multiple villages
		//we need to switch village (while at the same time, setting the target destination)
		get(fullName+"build.php?id=39&tt=2&newdid=" + aTask[4] + "&z=" + aTask[2], attack2, aTask);
	} else {  //only 1 village. Perform attack immediately
		post(fullName+"build.php?id=39&tt=2", "z=" + aTask[2], attack2, aTask);
		_log(2, "The attack was requested.");
	}
	_log(1, "End attack("+aTask+")");
}

function attack2(httpRequest,aTask) {
	if (httpRequest.readyState == 4) {
		printMsg(aLangStrings[6] + " > 1 > 2<br><br>" + getTaskDetails(aTask));
		var oldVID = parseInt(aTask[4]);
		if ( isNaN(oldVID) ) oldVID = -2;
		var sPlaceName = '<span id="ttq_placename_'+aTask[2]+'">'+getVillageNameZ(aTask[2])+'</span><br>' + getTroopsInfo(aTask[3].split("_"));
		var sFromName = '<span class="ttq_village_name" style="display:block;" id="ttq_placename_'+oldVID+'">'+getVillageName(oldVID)+':</span><br>';
		if (httpRequest.status == 200 && httpRequest.responseText) {
			var holder = document.createElement('div');
			holder.innerHTML = httpRequest.responseText;
			var aTroops = holder.getElementsByClassName("error");
			if ( aTroops.length > 0 ) {
				aTroops = "["+aTroops[0].innerHTML+"]";
				_log(1, "attack2> I could not send the troops. Reason: " + aTroops);
				printMsg(sFromName + aLangStrings[19] + " >> " +sPlaceName + " " + aLangStrings[69] + " (" + aLangStrings[13] + ": "+aTroops+")", true); // Your building can't be built. Because there was no button and a reason provided.
				addToHistory(aTask, false, aLangStrings[13] + ": "+aTroops);
				return false;
			}

			var reqVID = getActiveVillage(holder);

			aTroops = new Array();  //extract troops numbers and attack type
			var needC = true;
			aTroops = aTask[3].split("_");
			var tInputs = holder.getElementsByTagName('input');
			var sParams = '';
			var t,k = tInputs.length;
			if ( oldVID == reqVID && holder.getElementsByClassName("a2b").length == 1 && k > 15 ) {
				for (var q = 0 ; q < k ; ++q ) {
					t = tInputs[q].name;
					if ( t.length == 2 || t.length == 3 ) {
						sParams += t + "=" + aTroops[parseInt(t.replace("t",""))] + "&";
					} else if ( t == "c" ) {
						if ( needC ) {
							sParams += "c=" + aTroops[0] + "&";
							needC = false;
						}
					} else if ( t == "redeployHero" ) {
						if( aTroops[17] == 1 ) sParams += "&redeployHero=" + tInputs[q].value + "&";
					} else {
						sParams += t + "=" + tInputs[q].value + "&";
					}
				}
				sParams = sParams.substring(0, sParams.length - 1);
				post(fullName+'build.php?id=39&tt=2', sParams, attack3, aTask);
				return;
			}
			if ( reqVID != currentActiveVillage ) switchActiveVillage ( currentActiveVillage );
			_log(1, "Your attack could not be sent. It seems I am at the wrong screen. (Server: Redirected 1)");
			printMsg(sFromName + aLangStrings[19] + " >> " +sPlaceName + " " + aLangStrings[9] + " (" +aLangStrings[74]+" "+aLangStrings[11]+" 1)", true);
			addToHistory(aTask, false, aLangStrings[74]+" "+aLangStrings[11]+" 1");
			return;
		}
		switchActiveVillage(currentActiveVillage);
		_log(1, "Your attack could not be sent. Bad response from server when sending request. (Server: Page Failed 1)");
		printMsg(sFromName + aLangStrings[19] + " >> " +sPlaceName + " " + aLangStrings[73] + " ("+aLangStrings[74] + " " + aLangStrings[46]+" 1)", true);
		addToHistory(aTask, false, aLangStrings[74] + " " + aLangStrings[46]+" 1");
	}
}

function attack3(httpRequest,aTask){
	if (httpRequest.readyState == 4) {
		printMsg(aLangStrings[6] + " > 1 > 2 > 3<br><br>" + getTaskDetails(aTask));
		var oldVID = parseInt(aTask[4]);
		if ( isNaN(oldVID) ) oldVID = -2;
		var sPlaceName = '<span id="ttq_placename_'+aTask[2]+'">'+getVillageNameZ(aTask[2])+'</span><br>' + getTroopsInfo(aTask[3].split("_"));
		var sFromName = '<span class="ttq_village_name" style="display:block;" id="ttq_placename_'+oldVID+'">'+getVillageName(oldVID)+':</span><br>';
		if (httpRequest.status == 200 && httpRequest.responseText) { // ok
			var holder = document.createElement('div');
			holder.innerHTML = httpRequest.responseText;

			var reqVID = getActiveVillage(holder);

			var q = holder.getElementsByClassName("error");
			if ( q.length > 0 ) {
				if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
				q = "["+q[0].innerHTML+"]";
				_log(1, "attack3> I could not send the troops. Reason: " + q);
				printMsg(sFromName + aLangStrings[19] + " >> " +sPlaceName + " " + aLangStrings[69] + " (" + aLangStrings[13] + ": "+q+")", true); // Your building can't be built. Because there was no button and a reason provided.
				addToHistory(aTask, false, aLangStrings[13] + ": "+q);
				return false;
			}

			var tInputs = holder.getElementsByTagName('input');
			var k = tInputs.length;
			if ( reqVID == oldVID && holder.getElementsByClassName("a2b").length == 1 && k > 15 ) {
				var aTroops = new Array();  //extract troops numbers and attack type
				aTroops = aTask[3].split("_");
				var sParams = '';
				var tSelect = holder.getElementsByTagName('select');
				for (q = 0 ; q < tSelect.length ; ++q) {
					if ( tSelect[q].name == "kata" ) {
						if ( aTroops[15] > -1 ) sParams += "kata=" + aTroops[15] + "&";
						else sParams += "kata=" + tSelect[q].value + "&"; //default, dont change anything... random?
					} else if ( tSelect[q].name == "kata2" ) {
						if ( aTroops[16] > -1 ) sParams += "kata2=" + aTroops[16] + "&";
						else sParams += "kata2=" + tSelect[q].value + "&";  //default, dont change anything... random?
					}
				}
				for (q = 0 ; q < k ; ++q) {
					if ( tInputs[q].name == "spy" ){
						if ( aTroops[14] > -1 ) sParams += "spy=" + aTroops[14] + "&";
						else sParams += "spy=1&";  //"Spy troops  and resources" by default
						++q;
					} else sParams += tInputs[q].name + "=" + tInputs[q].value + "&";
				}
				sParams = sParams.substring(0, sParams.length - 1);
				post(fullName+'build.php?id=39&tt=2', sParams, handleRequestAttack, aTask);
				return;
			}
			if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
			_log(1, "Your attack could not be sent. It seems I am at the wrong screen. (Server: Redirected 2)");
			printMsg(sFromName + aLangStrings[19] + " >> " +sPlaceName + " " + aLangStrings[9] + " (" +aLangStrings[74]+" "+aLangStrings[11]+" 2)", true);
			addToHistory(aTask, false, aLangStrings[74]+" "+aLangStrings[11]+" 2");
			return;
		}
		switchActiveVillage(currentActiveVillage);
		_log(1, "Your attack could not be sent. Bad response from server when sending request. (Server: Page Failed 2)");
		printMsg(sFromName + aLangStrings[19] + " >> " +sPlaceName + " " + aLangStrings[73] + " ("+aLangStrings[74] + " " + aLangStrings[46]+" 2)", true);
		addToHistory(aTask, false, aLangStrings[74] + " " + aLangStrings[46]+" 2");
	}
}

function handleRequestAttack(httpRequest, aTask) {
	if (httpRequest.readyState == 4) {
		var oldVID = parseInt(aTask[4]);
		if ( isNaN(oldVID) ) oldVID = -2;

		var sPlaceName = '<span id="ttq_placename_'+aTask[2]+'">'+getVillageNameZ(aTask[2])+'</span><br>' + getTroopsInfo(aTask[3].split("_"));
		var sFromName = '<span class="ttq_village_name" style="display:block;" id="ttq_placename_'+oldVID+'">'+getVillageName(oldVID)+':</span><br>';
		if (httpRequest.status == 200 && httpRequest.responseText) { // ok
			var holder = document.createElement('div');
			holder.innerHTML = httpRequest.responseText;
			var re = holder.getElementsByClassName("error");
			if ( re.length > 0 ) {
				re = "["+re[0].innerHTML+"]";
				_log(1, "handleRequestAttack> I could not send the troops. Reason: " + re);
				printMsg(sFromName + aLangStrings[19] + " >> " +sPlaceName + " " + aLangStrings[69] + " (" + aLangStrings[13] + ": "+re+")", true); // Your building can't be built. Because there was no button and a reason provided.
				addToHistory(aTask, false, aLangStrings[13] + ": "+re);
				return false;
			}

			var reqVID = getActiveVillage(holder);
			if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
			if ( oldVID == reqVID && holder.getElementsByClassName("gid16").length == 1 ) {
				re = new RegExp('karte\\.php\\?d=' + aTask[2], 'i');
				if(re.test(httpRequest.responseText)) {
					_log(1, "It seems your attack was successfully sent.");
					printMsg(sFromName + aLangStrings[18] + " >> " + sPlaceName );
					addToHistory(aTask, true);
				} else {
					_log(1, "Your attack could not be sent. Confirmation failed.");
					printMsg(sFromName + aLangStrings[19] + " >> " +sPlaceName+ " (" + aLangStrings[75]+")", true);
					addToHistory(aTask, false, aLangStrings[75]);
				}
			} else {
				_log(1, "Attack request was sent, however, I could not confirm. It seems we have been redirected. (Confirmation Failed, Server: Redirected 3)");
				printMsg(sFromName + aLangStrings[19] + " >> " +sPlaceName + " " + aLangStrings[73] + " " + aLangStrings[50] + " ("+aLangStrings[75] + ", " +aLangStrings[74] + " " + aLangStrings[11]+" 3)", true);
				addToHistory(aTask, false, aLangStrings[75] + ", " +aLangStrings[74] + " " + aLangStrings[11]+" 3");
			}
			return;
		}
		switchActiveVillage(currentActiveVillage);
		_log(1, "Attack request was sent, however, I could not confirm. Bad response from server when trying to confirm. (Confirmation Failed, Server: Page Failed 3)");
		printMsg(sFromName + aLangStrings[19] + " >> " +sPlaceName + " " + aLangStrings[73] + " " + aLangStrings[50] + " ("+aLangStrings[75] + ", " +aLangStrings[74] + " " + aLangStrings[46]+" 3)", true);
		addToHistory(aTask, false, aLangStrings[75] + ", " +aLangStrings[74] + " " + aLangStrings[46]+" 3");
	}
	_log(3, "End handleRequestAttack("+httpRequest+", "+aTask+")");
}
// *** End Send Troops Functions ***
// farm from gold-club
// writed by Serj_LV
function createGoldClubBtn () {
	_log(3,"Begin createGoldClubBtn()");

	var arrList = $gc('listEntry');
	for (var i = 0; i < arrList.length; i++) {
		var SndLtrBtn = generateButton(aLangStrings[16], scheduleSendClub);
		arrList[i].appendChild(SndLtrBtn);
	}

	_log(3, "End createGoldClubBtn()");
}

function scheduleSendClub () {
	_log(3,"Begin scheduleSendClub()");
	window.scroll(0,0);
	var list = this.parentNode;
	var listName = $gc("listTitleText",list)[0].innerText;
	var listID = list.id.substring(4);
	displayTimerForm(9,listName,listID);
	_log(3, "End scheduleSendClub()");
}

var data;
function sendGoldClub (aTask) {
	_log(1,"Begin attack from gold-club ("+aTask+")");
	printMsg(aLangStrings[6] + " > 1<br><br>" + getTaskDetails(aTask));
	var sParams = 'cmd=raidListSlots&lid=' + aTask[3] + '&ajaxToken=' + getAjaxToken();
	_log(3,"sParams:"+sParams);
	post(fullName+"ajax.php", sParams, sendGoldClub1, aTask);
	_log(2, "The attack was requested.");
	_log(1, "End attack from gold-club ("+aTask+")");
}
function getActiveVillage (el) {
	var reqVID = xpath('.//div[@class="innerBox content"]/ul/li/a[@class="active"]',el,true);
	if ( reqVID ) {
		reqVID = parseInt(reqVID.href.split("=")[1]);
		if ( isNaN(reqVID) ) reqVID = -1;
	} else { reqVID = -1; }
	return reqVID;
}
function sendGoldClub1(httpRequest,aTask) {
	if (httpRequest.readyState == 4) {
		printMsg(aLangStrings[6] + " > 1 > 2<br><br>" + getTaskDetails(aTask));
		if (httpRequest.status == 200 && httpRequest.responseText) {
			data = eval("(" + httpRequest.responseText + ")");
			var strError = data.response.errorMsg;
			if ( data.response.error == true ) {
				_log(1, "sendGoldClub2> I could not send the troops. Reason: " + strError);
				printMsg(aTask, false, aLangStrings[13] + ": "+strError, true);
				addToHistory(aTask, false, aLangStrings[13] + ": "+strError);
				return false;
			}
			get(fullName+"build.php?tt=99&id=39", sendGoldClub2, aTask);
			return;
		}
		_log(1, "Your attack could not be sent. Bad response from server when sending request. (Server: Page Failed 1)");
		printMsg(aTask, false, aLangStrings[74] + " " + aLangStrings[46]+" 1", true);
		addToHistory(aTask, false, aLangStrings[74] + " " + aLangStrings[46]+" 1");
	}
}
function sendGoldClub2(httpRequest,aTask) {
	if (httpRequest.readyState == 4) {
		printMsg(aLangStrings[6] + " > 1 > 2<br><br>" + getTaskDetails(aTask));
		if (httpRequest.status == 200 && httpRequest.responseText) {
			var holder = document.createElement('div');
			holder.innerHTML = httpRequest.responseText;
			holder = xpath('.//div[@id="list'+aTask[3]+'"]',holder,true);
			var listHolder = $gc('listContent',holder)[0];
			listHolder.innerHTML = data.response.data.html;

			var tInputs = holder.getElementsByTagName('input');
			if (tInputs.length > 5 ) {
				var sParams = '';
				for( var i=0; i<tInputs.length; i++ ) {
					if( tInputs[i].hasAttribute('name') ) {
						if ( tInputs[i].hasAttribute('value') ) {
							sParams += tInputs[i].getAttribute('name') + "=" + tInputs[i].getAttribute('value') + "&";
						}
						else {
							var ac = xpath('.//img[contains(@class,"iReport iReport3")]',tInputs[i].parentNode.parentNode);
							if ( ac.snapshotLength == 0 ) {
								sParams += tInputs[i].getAttribute('name') + "=on&";
							}
						}
					}
				}
				sParams = sParams.substring(0, sParams.length - 1);
				_log(3,"parameters: "+sParams);
				post(fullName+'build.php?gid=16&tt=99', sParams, sendGoldClubConfirmation, aTask);
				return;
			}
			if ( reqVID != currentActiveVillage ) switchActiveVillage ( currentActiveVillage );
			_log(1, "Your attack could not be sent. It seems I am at the wrong screen. (Server: Redirected 1)");
			printMsg(aTask, false, aLangStrings[74]+" "+aLangStrings[11]+" 1", true);
			addToHistory(aTask, false, aLangStrings[74]+" "+aLangStrings[11]+" 1");
			return;
		}
		switchActiveVillage(currentActiveVillage);
		_log(1, "Your attack could not be sent. Bad response from server when sending request. (Server: Page Failed 1)");
		printMsg(aTask, false, aLangStrings[74] + " " + aLangStrings[46]+" 1", true);
		addToHistory(aTask, false, aLangStrings[74] + " " + aLangStrings[46]+" 1");
	}
}
function sendGoldClubConfirmation (httpRequest, aTask) {
		if (httpRequest.readyState == 4 ){
		printMsg(aLangStrings[6] + " > 1 > 2<br><br>" + getTaskDetails(aTask));
		if ( httpRequest.status == 200 && httpRequest.responseText ) {
			var holder = document.createElement('div');
			holder.innerHTML = httpRequest.responseText;
			if ( holder.getElementsByClassName('gid16').length > 0 ) {  //if its the rally point, it should have been successful.
				_log(1, "I think those troops were sent.");
				printMsg(aLangStrings[18]+", "+aTask[2]);
				addToHistory(aTask, true);
			} else {
				_log(1, "I'm not so sure those troops were sent. Confirmation failed.");
				printMsg(aLangStrings[19] + " >> " +aTask[2]+ " (" + aLangStrings[75]+")", true);
				addToHistory(aTask, false, aLangStrings[75]);
			}
			if( getActiveVillage(holder) != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
			return;
		}
		_log(1, "Farm request was sent, however, I could not confirm. Bad response from server when trying to confirm. (Confirmation Failed, Server: Page Failed 3)");
		printMsg(aLangStrings[19]+" "+aTask[2] + " ("+aLangStrings[75] + ", " + aLangStrings[74] + " " + aLangStrings[46], true);
		addToHistory(aTask, false, aLangStrings[75] + ", " +aLangStrings[74] + " " + aLangStrings[46]);
	}
}
// *** End Send Troops from gold-club ***

// *** Begin Troop/Trap Training Functions ***
function createTrainLinks(buildingID) {
	_log(3,"Begin createTrainLinks()");
	var bIsResidence = false;
	switch(buildingID) {
		case 29: //great barracks
		case 30: //great stables
		case 19: //barracks
		case 20: //stables
		case 21: //workshop
		case 36: //Trapper
			break;
		case 25: //residence
		case 26: //palace
		case 44: //command center
			bIsResidence = true;
			break;
		default:
			_log(2, "No train links needed.");
			return;
	}
	var linkTxt = aLangStrings[48];
	if(bIsResidence) {
		_log(2, "This is residence/palace/command center.");
		var trainBtn = xpath("//form[@name='snd'][@action='build.php']");
		if(trainBtn.snapshotLength > 0) {  //we need to build only the button
			_log(2, "Adding train later links for residence/palace...");
			var oBtn = generateButton(linkTxt, scheduleTraining);
			trainBtn.snapshotItem(0).appendChild(oBtn);
		} else {
			_log(2, "You cannot train settlers from this residence/palace. Exiting function...");
			return false;
		}
	} else {
		_log(2, "Adding train later links for barracks/stables/workshop/trapper...");
		var trainBtn = xpath("//form/button[@id='s1']");
		if(trainBtn.snapshotLength < 1) {  //button not found
			_log(1, "The Train button was not found. Exiting function...");
			return false;
		}
		var oBtn = generateButton(linkTxt, scheduleTraining);
		trainBtn.snapshotItem(0).parentNode.appendChild(oBtn);
	}
	_log(3, "End createTrainLinks()");
}

function scheduleTraining(e) {
	var Inputs = xpath("id('content')//input[@type='text']");
	if(Inputs.snapshotLength < 1 ) {
		_log(3, "ScheduleTraining> No textboxes with troop numbers found.");
		return false;
	}//            0		1	2	3	4	5	6	7	8	9	10		11		12		13		14		15		16
			//     type, 	t1,	t2,	t3,	t4,	t5,	t6,	t7,	t8,	t9,	t10,	t11(h),	traps,	gid,	spy,	kata1,	kata2
	var aTroops = [0,		0,	0,	0,	0,	0,	0,	0,	0,	0,	0,		0,		0,		-1,		-1,		-1,		-1,];
	var bNoTroops = true;
	var tmp;
	for(var i = 0; i < Inputs.snapshotLength; ++i) {
		tmp = Inputs.snapshotItem(i);
		var thisTroopType = parseInt(tmp.name.substring(1));
		if (thisTroopType == 99) thisTroopType = 12;
		aTroops[thisTroopType] = tmp.value == '' ? 0 : parseInt(tmp.value);
		if(aTroops[thisTroopType] > 0) bNoTroops = false;
	}

	if(bNoTroops) {
		_log(2, "ScheduleTraining> No troops were selected. Unable to schedule training.");
		printMsg(aLangStrings[17] , true);
		return false;
	}

	//get the code
	var iCode = xpath("//form//input[@name='z']");

	if(iCode.snapshotLength > 0) aTroops[0] = iCode.snapshotItem(0).value;
	else {
		_log(3, "ScheduleTraining> No code available. Exiting.");
		return false;
	}

	//currently, only 1 kind of troop can be trained at once - null all elements except for the oth one (code) and the first non-zero value
	var somethingFound = -1;
	for ( var i = 1 ; i < 13 ; ++i ) {
		if ( somethingFound > -1 ) aTroops[i] = 0;
		else if ( aTroops[i] > 0 ) somethingFound = i;
	}
	// Good, we have at least 1 troop. We can display the form
	// Grab this building's ID and Troop name for further use
	aTroops[13] = parseInt($id("build").className.replace("gid",""));
	_log(2,"ScheduleTraining> aTroops = " + aTroops);
	displayTimerForm(4, iSiteId, aTroops);
}

function train(aTask) {
	var oldVID = parseInt(aTask[4]);
	if ( isNaN(oldVID) ) oldVID = -2;
	_log(3, "Train> Switching to village:" +oldVID);
	printMsg(aLangStrings[6] + " > 1<br><br>" + getTaskDetails(aTask));
	var aTroops = aTask[3].split("_");
	var residenceTab1 = "";
	var residenceTab2 = "";
	if (aTroops[10]==1 || aTroops[9]==1) { residenceTab1 = "&s=1"; residenceTab2 = "?s=1" } //settler or general
	var troopsInfo = getTroopsInfo(aTroops);
	var oldGid = parseInt(aTroops[13]);
	var httpRequest = new XMLHttpRequest();
	httpRequest.open("GET", fullName+"build.php?" + (oldVID>0?"newdid=" + oldVID:"") + residenceTab1 + "&id=" + aTask[2], false);
	httpRequest.onreadystatechange = function() {
		if (httpRequest.readyState == 4) { //complete
			printMsg(aLangStrings[6] + " > 1 > 2<br><br>" + getTaskDetails(aTask));
			if (httpRequest.status == 200 && httpRequest.responseText ) { // ok
				var holder = document.createElement('div');
				holder.innerHTML = httpRequest.responseText;
				var theZ = holder.getElementsByTagName("input");
				var k = theZ.length;
				var reqVID = getActiveVillage(holder);
				if ( reqVID == oldVID && holder.getElementsByClassName("gid"+oldGid).length == 1 ) {
					if ( k > (oldGid==36?2:3) ) {
						var i = (oldGid==36 ? 2 : 3);
						var tmp;
						var tI;
						var theMaxs = [0,0,0,0,0,0,0,0,0,0,0,0,0];
						for (  ; i < k ; ++i ) {
							tmp = theZ[i].parentNode.getElementsByTagName("a");
							tI = parseInt(theZ[i].name.replace("t",""));
							if ( tI == 99 ) tI = 12;
							if ( tmp.length > 2 ) {
								tmp = parseInt(tmp[2].innerHTML);
								if ( isNaN(tmp) || tmp < 0 ) tmp = 0;
								theMaxs[tI] = tmp;
							}
						}
						for ( i = 0 ; i < k && theZ[i].name != "z" ; ++i) ;
						var sParams = "id=" +aTask[2]+ "&a=2";
						if(aTroops.length > 1) {
							sParams += "&z=" + theZ[i].value;
							for( var j = 1; j < 13; ++j) if ( j != 11 && aTroops[j] > 0) {
								if ( aTroops[j] > theMaxs[j] ) aTroops[j] = theMaxs[j];
								sParams += "&t" + ((j==12)?99:j) + "=" + aTroops[j];
							}
							aTask.splice(3,1,aTroops.join("_"));
						} else {
							if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
							_log(2, "Train> Improbability Error Number 1. Please report of its existance. (No troops specified. Exiting function.)");
							printMsg("Train> Improbability Error Number 1. Please report of its existance. (No troops specified. Exiting function.)");
							addToHistory(aTask, false, "Improbability Error Number 1. Please report of its existance. (No troops specified. Exiting function.)");
							return;
						}
						_log(2, "Train>posting>sParams>" + sParams + "<");
						post(fullName+"build.php"+residenceTab2, sParams, handleRequestTrain, aTask,false);
						return;
					}
					if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
					_log(1, "Train Troops request was not sent. It seems there are no troops to train. (No Link)");
					printMsg("<span class='ttq_village_name' style='display:block;'>"+getVillageName(oldVID)+"</span>"+troopsInfo+" "+aLangStrings[52]+" "+aLangStrings[68]+ " ("+aLangStrings[70]+")", true);
					addToHistory(aTask, false, aLangStrings[70]);
					return;
				}
				if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
				_log(1, "Train Troops request was not sent. It seems I was redirected before I could post the training. (Server: Redirected 1)");
				printMsg("<span class='ttq_village_name' style='display:block;'>"+getVillageName(oldVID)+"</span>"+troopsInfo+" "+aLangStrings[52]+" "+aLangStrings[9]+ " ("+aLangStrings[74] + " " + aLangStrings[11]+" 1)", true);
				addToHistory(aTask, false, aLangStrings[74] + " " + aLangStrings[11]+" 1");
				return;
			}
			switchActiveVillage(currentActiveVillage);
			_log(1, "Train Troops request was not sent. Bad response from server when trying to switch village/building. (Server: Page Failed 1)");
			printMsg("<span class='ttq_village_name' style='display:block;'>"+getVillageName(oldVID)+"</span>"+troopsInfo+" "+aLangStrings[52]+" "+aLangStrings[73]+ " ("+aLangStrings[74] + " " + aLangStrings[46]+" 1)", true);
			addToHistory(aTask, false, aLangStrings[74] + " " + aLangStrings[46]+" 1");
		}
	};
	httpRequest.send(null);
	_log(1, "Train> ** End ** aTask = ("+aTask+")");
}

function handleRequestTrain(httpRequest, aTask) {
	if (httpRequest.readyState == 4) {
		var options = aTask[3].split("_");
		var troopsInfo = getTroopsInfo(options);
		var oldGid = parseInt(options[13]);
		var oldVID = parseInt(aTask[4]);

		if (httpRequest.status == 200 && httpRequest.responseText) {
			var holder = document.createElement('div');
			holder.innerHTML = httpRequest.responseText;
			var ti = holder.getElementsByClassName("unit");
			var k = ti.length;
			var reqVID = getActiveVillage(holder);
			if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
			if ( reqVID == oldVID && holder.getElementsByClassName("gid"+oldGid).length == 1 && k > 0) {
				var tie = ti[k-1];
				if ( tie.nextSibling ) {
					var buildAmount = parseInt(tie.nextSibling.nodeValue);
					for ( k = 1 ; k < 13 && ( (troopsInfoN = parseInt(options[k])) < 1 ) ; ++k ) ;
					if ( k == 12 ) k = 99;
					else k += iMyRace*10;
					if ( k == parseInt(tie.className.replace("unit u","")) && tie.parentNode.className == "desc" && buildAmount == troopsInfoN ) {
						printMsg(getVillageName(oldVID)+ "<br>" + aLangStrings[51] + troopsInfo);
						addToHistory(aTask, true);
					} else {
						printMsg(getVillageName(oldVID)+ "<br>" + troopsInfo + ' ' + aLangStrings[52] + " ("+aLangStrings[75]+" 1)", true);
						addToHistory(aTask, false,aLangStrings[75]+" 1");
					}
				} else {
					printMsg(getVillageName(oldVID)+ "<br>" + troopsInfo + ' ' + aLangStrings[52] + " ("+aLangStrings[75]+" 2)", true);
					addToHistory(aTask, false,aLangStrings[75]+" 2");
				}
				return;
			}
			_log(1, "Train Troops request was sent, however I could not confirm it. It seems I was redirected when trying to confirm it. (Confirmation Failed, Server: Redirected 2)");
			printMsg("<span class='ttq_village_name' style='display:block;'>"+getVillageName(oldVID)+"</span>"+troopsInfo+" "+aLangStrings[52]+" "+aLangStrings[50]+" "+aLangStrings[9]+ " ("+aLangStrings[75] + ", " + aLangStrings[74] + " " + aLangStrings[11]+" 2)", true);
			addToHistory(aTask, false, aLangStrings[75]+", "+aLangStrings[74]+" "+aLangStrings[11]+" 2");
			return;
		}
		switchActiveVillage(currentActiveVillage);
		_log(1, "Train Troops request was sent, however I could not confirm it. Bad response from server when recieving the page to confirm on. (Confirmation Failed, Server: Page Failed 2)");
		printMsg("<span class='ttq_village_name' style='display:block;'>"+getVillageName(oldVID)+"</span>"+troopsInfo+" "+aLangStrings[52]+" "+aLangStrings[50]+" "+aLangStrings[73]+ " ("+aLangStrings[75] + ", " + aLangStrings[74] + " " + aLangStrings[46]+" 2)", true);
		addToHistory(aTask, false, aLangStrings[75] + ", " +aLangStrings[74] + " " + aLangStrings[46]+" 2");
	}
	_log(1, "handleRequestTrain> End.httpRequest = ("+httpRequest+"), aTask = ("+aTask+")");
}
// *** End Troop/Trap Training Functions ***

// *** Begin Demolish Functions
function createDemolishBtn() {
	_log(3,"Begin createDemolishBtn()");
	var xpathRes = xpath("//form[contains(@action,'build.php')]/select[@name='abriss']");
	if(xpathRes.snapshotLength > 0) {
		var oBtnWrapper = generateButton(aLangStrings[62],scheduleDemolish);
		oBtnWrapper.style.cssFloat = "right";
		xpathRes = xpathRes.snapshotItem(0).parentNode;
		xpathRes.insertBefore(oBtnWrapper,xpathRes.getElementsByClassName("clear")[0]);
	} else {
		xpathRes = $id("demolish");
		if ( xpathRes ) {
			var oBtnWrapper = generateButton(aLangStrings[62],scheduleDemolish);
			xpathRes.appendChild(oBtnWrapper);
			return;
		}
		_log(1, "The form cannot be found. Unable to add button. End createDemolishBtn().");
		return false;
	}
	_log(3,"End createDemolishBtn()");
}

function scheduleDemolish(e) {
	_log(3, "Start scheduleDemolish()");
	var BuildingId = xpath("//form//select[@name='abriss']"); //get the code
	if(BuildingId.snapshotLength > 0) {
		BuildingId = BuildingId.snapshotItem(0);
		var target = BuildingId.value;
		var w = BuildingId.selectedIndex;
		var data = document.getElementsByTagName("option");
		var BuildingName = "";
		for ( var i = 0,j = data.length ; i < j ; ++i ) BuildingName += "["+data[i].innerHTML + "]_";
	} else {
		var target = 19;
		var BuildingName = "";
		for ( var i = 19,j = 41 ; i < j ; ++i ) BuildingName += i+". "+aLangStrings[35]+" "+i+"_";
	}
	BuildingName = BuildingName.slice(0,-1);
	displayTimerForm(6,target,BuildingName);
	_log(3, "End scheduleDemolish()");
}

function demolish(aTask) {
	var result = "fail";
	_log(3,"Begin demolish("+aTask+")");
	var aTaskDetails = getTaskDetails(aTask);
	printMsg(aLangStrings[6] + " > 1<br><br>" + aTaskDetails);

	//If need to change village, the link should like: build.php?newdid=144307&gid=15&id=26
	var oldVID = parseInt(aTask[4]);
	if (isNaN(oldVID)) oldVID = -2;
	if(oldVID > 0) var sNewDid = "newdid=" +oldVID+"&";
	else var sNewDid = "";
	//Loading the page once first, changing the active village at the same time
	var httpRequest = new XMLHttpRequest();
	var httpRequestString = fullName+"build.php?" + sNewDid + "gid=15";
	httpRequest.open("GET", httpRequestString, false);
	httpRequest.onreadystatechange = function() {
		if (httpRequest.readyState == 4) { //complete
			printMsg(aLangStrings[6] + " > 1 > 2<br><br>" + aTaskDetails);
			if (httpRequest.status == 200 && httpRequest.responseText) { // ok
				var holder = document.createElement('div');
				holder.innerHTML = httpRequest.responseText;

				var reqVID = getActiveVillage(holder);

				if ( reqVID == oldVID && holder.getElementsByClassName("gid15").length == 1 ) {
					var tmp = holder.getElementsByClassName("transparent");
					var tmp2;
					if ( tmp.length > 0 ) {
						if(reqVID != currentActiveVillage) switchActiveVillage(currentActiveVillage);
						tmp2 = "["+trim(tmp[0].getElementsByTagName("td")[1].innerHTML)+"]";
						_log(1, "Demolish Building request was not sent. It appears we were already busy destroying a building. (No Link 1: "+tmp2+")");
						printMsg(aTaskDetails+" "+aLangStrings[68]+" "+aLangStrings[64]+" ("+aLangStrings[70]+" 1: "+tmp2+")", true); // Your building can't be demolished. No Link - Something is already being destroyed
						addToHistory(aTask, false, aLangStrings[70]+" 1: "+tmp2);
						return result;
					}

					tmp2 = holder.getElementsByClassName("demolish_building");
					if ( tmp2.length == 1 ) {
						var sParams = '';
						tmp2 = tmp2[0];
						tmp = tmp2.getElementsByTagName("input");
						for ( var i = 0, k = tmp.length ; i < k ; ++i ) sParams += tmp[i].name + "=" + tmp[i].value + "&";
						sParams += tmp2.getElementsByTagName("select")[0].name + "=" + aTask[2];
						result = post(fullName+"build.php", sParams, handleRequestDemolish, aTask, false);
						return result;
					}
					if ( reqVID != currentActiveVillage ) switchActiveVillage ( currentActiveVillage );
					_log(1, "Demolish Building request was not sent. I can not find the link. (No Link 2)");
					printMsg(aTaskDetails+" "+aLangStrings[68]+" "+aLangStrings[64]+" ("+aLangStrings[70]+" 2)", true); // Your building can't be demolished. No Link (main building too small?)
					addToHistory(aTask, false, aLangStrings[70]+" 2");
					return result;
				}
				if ( reqVID != currentActiveVillage ) switchActiveVillage ( currentActiveVillage );
				_log(1, "Demolish Building request was not sent. It appears we were redirected when trying to load the Main Building page (Server: Redirected 1)");
				printMsg(aTaskDetails + ' ' + aLangStrings[9]+" "+aLangStrings[64]+" ("+aLangStrings[74]+" "+aLangStrings[11]+" 1)", true); // Your building can't be demolished.
				addToHistory(aTask, false, aLangStrings[74]+" "+aLangStrings[11]+" 1");
				return result;
			}
			switchActiveVillage ( currentActiveVillage );
			_log(1, "Demolish Building request was not sent. Bad response from server when attempting to load the Main Building page (Server: Page Failed 1)");
			printMsg(aTaskDetails + ' ' + aLangStrings[64]+" ("+aLangStrings[74]+" "+aLangStrings[46]+" 1)", true); // Your building can't be demolished.
			addToHistory(aTask, false, aLangStrings[74]+" "+aLangStrings[46]+" 1");
		}
	};
	httpRequest.send(null);
	_log(3,"End demolish("+aTask+")");
	return result;

}

function handleRequestDemolish(httpRequest, aTask) {
	var result = "fail";
	_log(3,"Begin handleRequestDemolish("+httpRequest+", "+aTask+")");
	if (httpRequest.readyState == 4) {
		var oldVID = parseInt(aTask[4]);
		if (isNaN(oldVID)) oldVID = -2;
		var aTaskDetails = getTaskDetails(aTask);
		if (httpRequest.status == 200 && httpRequest.responseText) { // ok
			var holder = document.createElement('div');
			holder.innerHTML = httpRequest.responseText;

			reqVID = getActiveVillage(holder);
			if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
			if ( reqVID == oldVID && holder.getElementsByClassName("gid15").length == 1 ) {
				var tmp = holder.getElementsByClassName("transparent");
				if ( tmp.length > 0 ) {
					printMsg(aTaskDetails + ' ' + aLangStrings[63]); // Your building is being demolished.
					addToHistory(aTask, true);
					result = "success";
					return result;
				}
				_log(1, "Demolish Building request was sent. Everything seems fine, but nothing is demolishing (Confirmation Failed, No Link 3)");
				printMsg(aTaskDetails + ' ' + aLangStrings[64]+" "+aLangStrings[50]+" ("+aLangStrings[75]+", "+aLangStrings[70]+" 3)", true); // Your building can't be demolished.
				addToHistory(aTask, false, aLangStrings[75]+", "+aLangStrings[70]+" 3");
				return result;
			}
			_log(1, "Demolish Building request was sent. It appears we were redirected when trying to load the Main Building page for confirmation (Confirmation Failed, Server: Redirected 2)");
			printMsg(aTaskDetails + ' ' + aLangStrings[9]+" "+aLangStrings[64]+" ("+aLangStrings[75]+", "+aLangStrings[74]+" "+aLangStrings[11]+" 2)", true); // Your building can't be demolished.
			addToHistory(aTask, false, aLangStrings[75]+", "+aLangStrings[74]+" "+aLangStrings[11]+" 2");
			return result;
		}
		switchActiveVillage(currentActiveVillage);
		_log(1, "Demolish Building request was sent. Bad response from server when attempting to load the Main Building page for confirmation (Confirmation Failed, Server: Page Failed 2)");
		printMsg(aTaskDetails + ' ' + aLangStrings[64]+" ("+aLangStrings[75]+", "+aLangStrings[74]+" "+aLangStrings[46]+" 2)", true); // Your building can't be demolished.
		addToHistory(aTask, false, aLangStrings[75]+", "+aLangStrings[74]+" "+aLangStrings[46]+" 2");
	}
	return result;
}
// *** End Demolish Functions ***

// *** Begin Send Merchants Functions ***
function createMarketLinks() {
	_log(2,"CreateMarketLinks> Begin.");
	var tmp1 = $id("send_select");
	var tOK = xpath("//form//*[@id='button']//button", $id("content"));
	if( !tmp1 || tmp1.className != "send_res" || tOK.snapshotLength != 1 ) {
		_log(1,"CreateMarketLinks> This is not the marketplace.");
		return false;
	}
	tOK = tOK.snapshotItem(0);
	var tR;
	for ( var ii = 1 ; ii < 5 ; ++ii ) {
		tR = $id("r"+ii);
		tR.setAttribute("onKeyUp","var tmp1 = this.value; " +
			(tR.getAttribute("onKeyUp") ? tR.getAttribute("onKeyUp") + ";" : "") + " this.value = tmp1;");
	}
	var oBtn = generateButton(aLangStrings[16], scheduleMerchant);
	tOK.parentNode.appendChild(oBtn);
	_log(2,"CreateMarketLinks> End.");
}

function scheduleMerchant(e) {
	_log(1,"scheduleMarket> Begin.");
	var tXX = parseInt(document.getElementsByName("x")[0].value);
	var tYY = parseInt(document.getElementsByName("y")[0].value);
	var tData = [tXX,tYY,0,0,0,0,iSiteId];

	var tmp,tmp2,isEmpty = true;
	for ( var i = 1 ; i < 5 ; ++i ) {
		tmp = $id("r"+i);
		tmp2 = parseInt(tmp.value);
		if ( isNaN(tmp2) || tmp2 < 1 ) continue;
		tData[i+1] = tmp2;
		isEmpty = false;
	}
	if ( isNaN(tXX) || Math.abs(tXX) > mapRadius || isNaN(tYY) || Math.abs(tYY) > mapRadius || isEmpty ){
		printMsg(aLangStrings[65] , true);
		_log(1, "scheduleMarket> Improper data or building ID not found. End.");
		return false;
	}
	displayTimerForm(7, coordsXYToZ(tXX,tYY), tData);
	_log(2,"scheduleMarket> End.");
}


function calcDistance ( id1, id2 ) {
	var myXY = coordZToXY( id1 );
	var dXY = coordZToXY( id2 );
	dX = Math.min(Math.abs(dXY[0] - myXY[0]), Math.abs(MapSize - Math.abs(dXY[0] - myXY[0])));
	dY = Math.min(Math.abs(dXY[1] - myXY[1]), Math.abs(MapSize - Math.abs(dXY[1] - myXY[1])));
	return Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));
}

function getTTime(dist, speed) {
	//*3 speed miatt
	return Math.round(dist/(speed*3)*3600);
}



function merchant(aTask) {
	_log(1,"SendMerchant> Begin. aTask = " + aTask);
	printMsg(aLangStrings[6] + " > 1<br><br>" + getTaskDetails(aTask));
	var opts = aTask[3].split("_");
	var nid = parseInt(aTask[4]);
	var target = parseInt(aTask[2]);
	var sUrl = "build.php?"+(isNaN(nid)?"":("newdid="+nid+"&")) + "t=5&gid=17" + ( (isNaN(target) || target < 1 || target > 641601) ? "" : "&z="+target );
	var merchantResult = get(fullName+sUrl, handleMerchantRequest1, aTask, false);
	_log(2,"SendMerchant> End.");
	return merchantResult;
}

function refillVillage(aTask){
	_log(1,"Refill Village> Begin. aTask = " + aTask);
	printMsg("Start refill vilage");
	var nid = parseInt(aTask[4]);
	var opts = aTask[3].split("_");
	console.log(opts)
	switchActiveVillage(nid,opts,handleRefillRequest)
	_log(2,"Refill Village> End.");
}

function handleRefillRequest(httpRequest,options){
	if (httpRequest.readyState == 4) {
		if (httpRequest.status == 200 && httpRequest.responseText ) { // ok
			var parser = new DOMParser();
			var dpcc = parser.parseFromString(httpRequest.responseText, "text/html");
			getResources(dpcc);

			var targetX  = options[0];
			var targetY  = options[1];
			var zid = coordsXYToZ(targetX,targetY);
			var nK  = parseInt(options[2]);
			var noCrop  = options[3];
			var selectedVillagesString = [];
			var copyThem = false;
			for (var i = 4; i< options.length; i++){
				var currentOptionElement = options[i];
				if(currentOptionElement.startsWith(";")){
					copyThem = true;
				}
				if(copyThem){
					selectedVillagesString.push(currentOptionElement.replace(/;/g, ''))
				}
				if(currentOptionElement.endsWith(";")){
					copyThem = false;
				}
			}
			var missingResources = [0,0,0,0];
            for (var i = 0; i < 4; i++) {
                missingResources[i] = Math.round( fullRes[i]  * nK/100 - resNow[i] );
                if( missingResources[i] < 0 ) missingResources[i] = 0;
			}
			if(noCrop == true){
				missingResources[3]=0;
			}
			unsafeWindow.sendResourcesForTroopsFromSelectedVillages(selectedVillagesString,missingResources.join('_'),income.join('_'),zid);
		}
	}
}



function handleMerchantRequest1(httpRequest, aTask) {
	_log(3,"handleMerchantRequest1> Begin.");
	if (httpRequest.readyState == 4) {
		printMsg(aLangStrings[6] + " > 1 > 2<br><br>" + getTaskDetails(aTask));
		var options = aTask[3].split("_")
		var oldCoords = aTask[3].split("_");
		oldCoords = "(" + oldCoords[0] + "|" + oldCoords[1] + ")";
		var oldName = getVillageNameZ(parseInt(aTask[2]));
		var oldVID = parseInt(aTask[4]);
		if ( isNaN(oldVID) ) oldVID = -2;
		if (httpRequest.status == 200 && httpRequest.responseText ) { // ok
			var holder = document.createElement('div');
			holder.innerHTML = httpRequest.responseText;
			var tInputs = holder.getElementsByTagName('input');
			var reqVID = getActiveVillage(holder);
			var parser = new DOMParser();
			var dpcc = parser.parseFromString(httpRequest.responseText, "text/html");
			getResources(dpcc);
			if ( tInputs.length > 3 && holder.getElementsByClassName("gid17").length == 1 && reqVID == oldVID ) {
				var maxM = 20;
				var maxC = 500;

				tX = [500,1000,750];
				tY = getOption("RACE", -1, "integer");
				if( tY > -1 ) maxC = tX[tY];
				tX = $gc('merchantsAvailable',holder)[0];
				if( tX ) maxM = parseInt(tX.innerHTML.onlyText());
				tX = $gc('max',holder)[0];
				if( tX ) maxC = parseInt(tX.innerHTML.match(/>\(?(\d+)\)?</)[1]);
				maxC *= maxM;
				_log(3,"Merchants available:"+maxM+", total capacity:"+maxC);
				for( var i = 0; i < 4; i++ ) {
					tX = xpath('.//span[@id="l'+(1+i)+'"]',holder,true);
					if( tX ) {
						tX = tX.innerHTML.split("/");
						tY = parseInt(tX[0]);
						if( !isNaN(tY) ) resNow[i] = tY;
					}
				}
				_log(3,"Resources available:"+resNow.join(','));
				var sParams = 'cmd=prepareMarketplace&';
				var opts = aTask[3].split("_");
				var subSolution = false;


				//if smart send

				var smartSend = false;
				if(typeof(opts[7]) != 'undefined'){
					smartSend = true;
				}

				if (smartSend){
					var sourceIncome = [parseInt(opts[7]),parseInt(opts[8]),parseInt(opts[9]),parseInt(opts[10])];
					//workaround for negative crop production
					if(opts[5]==0) sourceIncome[3]=0;

					var originalToSend = [ parseInt(opts[2]) ,parseInt(opts[3]), parseInt(opts[4]), parseInt(opts[5])];
					var updatedSend = [ parseInt(opts[2]) ,parseInt(opts[3]), parseInt(opts[4]), parseInt(opts[5])];
					var map = getVillageNamesAndZIDs();
					var sourceVid;
					var targetVid = parseInt(aTask[2]);
					Object.keys(map).forEach(function(key) {
						value = map[key];
						if(value.id == oldVID){
							sourceVid = value.vid;
						}
					});
					//kiszámoljuk mennyit kell küldeni úgy, hogy mire odaér addigra a falu termelése a maradékot kitermelje
					var secsToArriveInVillage = getTTime( calcDistance(sourceVid, targetVid), merchantTimes[iMyRace]);
					for( var i = 0; i < 4; i++ ) {
						updatedSend[i] = Math.ceil(parseInt(originalToSend[i]) - sourceIncome[i]/3600 * secsToArriveInVillage);
						if (updatedSend[i] < 0 ) updatedSend[i] =0;
					}

					//if smart send
					opts[2]  = ''+updatedSend[0];
					opts[3] = ''+updatedSend[1];
					opts[4] = ''+updatedSend[2];
					opts[5] = ''+updatedSend[3];
				}

				if(USE_SMART_RESOURCE_SCALING && (opts[2] || opts[3] || opts[4] || opts[5])){
					//if there's any resource to send
					if( maxC != 0){
						//if at least there is capacity in the village
						var sumResToSend = parseInt(opts[2]) + parseInt(opts[3]) + parseInt(opts[4]) + parseInt(opts[5]);
						var ratio = maxC / sumResToSend;
						if(ratio<=1){
							//more to send than max capacity, scale down each resources
							console.log("Scaling down FROM: " + opts[2] + "  " + opts[3] + "  " + opts[4] + "  " + opts[5]);
							opts[2] = Math.floor(parseInt(opts[2])*ratio);
							opts[3] = Math.floor(parseInt(opts[3])*ratio);
							opts[4] = Math.floor(parseInt(opts[4])*ratio);
							opts[5] = Math.floor(parseInt(opts[5])*ratio);
							console.log("Scaling down TO: " + opts[2] + "  " + opts[3] + "  " + opts[4] + "  " + opts[5]);
							subSolution = true;
						}
					}
				}

				var tX = 0;
				for (var q = 0 ; q < tInputs.length ; ++q) {
					switch ( tInputs[q].id ) {
						case "r1":		if ( opts[2] ) {
											tY = parseInt(opts[2]);
											if( tY > resNow[0] ){ tY = resNow[0];subSolution = true;}
											if( tY + tX > maxC ) {tY = maxC - tX;subSolution = true;}
											tX += tY;
											opts[2] = tY;
											sParams += "r1=" + tY + "&";
										} else sParams += "r1=0&";
										break;
						case "r2":		if ( opts[3] ) {
											tY = parseInt(opts[3]);
											if( tY > resNow[1] ) {tY = resNow[1]; subSolution = true;}
											if( tY + tX > maxC ) {tY = maxC - tX; subSolution = true;}
											tX += tY; opts[3] = tY;
											sParams += "r2=" + tY + "&";
										} else sParams += "r2=0&";
										break;
						case "r3":		if ( opts[4] ) {
											tY = parseInt(opts[4]);
											if( tY > resNow[2] ) {tY = resNow[2]; subSolution = true;}
											if( tY + tX > maxC ) {tY = maxC - tX; subSolution = true;}
											tX += tY; opts[4] = tY;
											sParams += "r3=" + tY + "&";
										} else sParams += "r3=0&";
										break;
						case "r4":		if ( opts[5] ) {
											tY = parseInt(opts[5]);
											if( tY > resNow[3] ) {tY = resNow[3] - 10;subSolution = true;}
											if( tY < 0 ) tY = 0;
											if( tY + tX > maxC ) {tY = maxC - tX;subSolution = true;}
											tX += tY; opts[5] = tY;
											sParams += "r4=" + tY + "&";
										} else sParams += "r4=0&";
										break;
						default:		sParams += tInputs[q].name + "=" + tInputs[q].value + "&";
										break;
					}
				}

				sParams = sParams.substring(0, sParams.length - 1);
				aTask[3] = opts.join("_");
				aTask[5] = reqVID;
				_log(3,"sParams:"+sParams);
				sParams += '&ajaxToken='+getAjaxToken();
				var merchantResult = post(fullName+"ajax.php", sParams, handleMerchantRequest2, aTask,false,subSolution);
				if(smartSend){
					var stillNeeded = originalToSend.slice();
					if (merchantResult == 'success'){
						var reallySending = [ parseInt(opts[2]) ,parseInt(opts[3]), parseInt(opts[4]), parseInt(opts[5])];
						var willBeWhenArriving = [0,0,0,0]
						for( var i = 0; i < 4; i++ ) {
							willBeWhenArriving[i] = reallySending[i] + sourceIncome[i]/3600 * secsToArriveInVillage;
							stillNeeded[i] = originalToSend[i] - willBeWhenArriving[i];
							if(stillNeeded[i]<0) stillNeeded[i]=0;
						}
					}
					return stillNeeded;
				}else{
					return;
				}
			}
			if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
			printMsg(getVillageName(oldVID)+ "<br>" + aLangTasks[7] + " >> " + oldName + " " + oldCoords + "<br>" + getMerchantInfo(aTask[3]) + "<br>"+ aLangStrings[73] + " (" + aLangStrings[74]+" "+aLangStrings[11]+ " 1)",true); //Your merchants didnt send. (Server: Redirected)
			_log(1,"Your merchants were not sent. I was redirected before I could send the first request to send the merchant. Server: Redirected 1. From: " + getVillageName(oldVID) + "   To: " +oldName + " " + oldCoords + " carrying " + getMerchantInfo(aTask[3]) );
			addToHistory(aTask, false, aLangStrings[74]+" "+aLangStrings[11] + " 1");
			return;
		}
		switchActiveVillage(currentActiveVillage);
		printMsg(getVillageName(oldVID)+ "<br>" + aLangTasks[7] + " >> " + oldName + " " + oldCoords + "<br>" + getMerchantInfo(aTask[3]) + "<br>"+ aLangStrings[73] + " (" + aLangStrings[74]+" "+aLangStrings[46] + " 1)",true); //Your merchants didnt send. (Server: Page Failed)
		_log(1,"Your merchants were not sent. The server returned a non-200 code (or the request was empty) upon trying to load the marketplace page.  Server: Page Failed 1. From: " + getVillageName(oldVID) + "   To: " + oldCoords + " carrying " + getMerchantInfo(aTask[3]) );
		addToHistory(aTask, false, aLangStrings[74]+" "+aLangStrings[46]+" 1");
	}
}

function handleMerchantRequest2(httpRequest, aTask, subSolution) {
	if (httpRequest.readyState == 4) {
		printMsg(aLangStrings[6] + " > 1 > 2 > 3<br><br>" + getTaskDetails(aTask));
		var options = new Array();
		options.push(aTask);
		var oldCoords = aTask[3].split("_");
		oldCoords = "(" + oldCoords[0] + "|" + oldCoords[1] + ")";
		var oldVID = parseInt(aTask[4]);
		if ( isNaN(oldVID) ) oldVID = -2;
		var oldName = getVillageNameZ(parseInt(aTask[2]));

		if (httpRequest.status == 200 && httpRequest.responseText) { // ok
			var holder = document.createElement('div');
			//holder.innerHTML = httpRequest.responseText;
			var marketData = eval('(' + httpRequest.responseText + ')');
			marketData = marketData["response"];
			//var reqVID = getActiveVillage(holder);
			var reqVID = aTask[5];
			//var tTime = holder.getElementsByClassName("error");
			var tTime = marketData["data"]["errorMessage"];
			if ( tTime.length > 0 ) {
				if (RAISE_ALERT_ON_MERCHANT_ERROR == 1){
					alert(tTime);
				}
				if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
				//tTime = "["+tTime[0].innerHTML.split(",")[0]+"]";
				_log(1, "handleMerchantRequest2> I could not send the Merchants. Reason: " + tTime);
				printMsg(getVillageName(aTask[4])+ "<br>" + aLangTasks[7] + " >> " + getVillageNameZ(parseInt(aTask[2])) + " " + oldCoords + "<br>" + getMerchantInfo(aTask[3]) + "<br> " + aLangStrings[69] + " (" + tTime +")",true); //Your merchants didnt send. (Server: Redirected)
				addToHistory(aTask, false, tTime);
				return;
			}

			holder.innerHTML = marketData["data"]["formular"];

			tTime = holder.getElementsByClassName("res_target");
			var tInputs = holder.getElementsByTagName('input');
			//if ( tTime.length > 0 && tInputs.length > 4 && holder.getElementsByClassName("gid17").length == 1 && reqVID == oldVID) {
			if ( tTime.length > 0 && tInputs.length > 4 && reqVID == oldVID) {
				tTime = tTime[0].getElementsByTagName("td");
				options.push(parseInt(tTime[2].innerHTML.replace(/:/g,""),10));
				//options.push(tTime[0].getElementsByClassName("coordText")[0].innerHTML);
				options.push(tTime[0].getElementsByClassName("coordinates coordinatesWrapper")[0].innerHTML);
				var sParams = 'cmd=prepareMarketplace&';
				for (var q = 0 ; q < tInputs.length ; ++q) {
					if( tInputs[q].name == "dname" ) continue;
					if( tInputs[q].name == "x2" && tInputs[q].value == "" ) {
						sParams += "x2=1&"; continue;
					}
					sParams += tInputs[q].name + "=" + tInputs[q].value + "&";
				}
				//sParams = sParams.substring(0, sParams.length - 1);
				var opts = aTask[3].split("_");
				sParams += "r1=" + opts[2] + "&r2=" + opts[3] + "&r3=" + opts[4] + "&r4=" + opts[5];
				_log(3,"sParams:"+sParams);
				sParams += '&ajaxToken='+getAjaxToken();
				return post(fullName+"ajax.php", sParams, handleMerchantRequestConfirmation, options,false,subSolution);
			}
			if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
			printMsg(getVillageName(oldVID)+ "<br>" + aLangTasks[7] + " >> " + options[2] + " " + oldCoords + "<br>" + getMerchantInfo(aTask[3]) + "<br>"+ aLangStrings[73] + " (" + aLangStrings[74]+" "+aLangStrings[11] + " 2)",true); //Your merchants didnt send. (Server: Redirected)
			_log(1,"Your merchants were not sent. I was redirected before I could send the final request to send the merchant. Server: Redirected 2. From: " + getVillageName(oldVID) + "   To: " +options[2] + " " + oldCoords + " carrying " + getMerchantInfo(aTask[3]) );
			addToHistory(aTask, false, aLangStrings[74]+" "+aLangStrings[11]+" 2");
			return;
		}
		switchActiveVillage(currentActiveVillage);
		printMsg(getVillageName(oldVID)+ "<br>" + aLangTasks[7] + " >> " + oldName +" "+ oldCoords + "<br>" + getMerchantInfo(aTask[3]) + "<br>"+ aLangStrings[73] + " (" + aLangStrings[74]+" "+aLangStrings[46] + " 2)",true); //Your merchants didnt send. (Server: Page Failed)
		_log(1,"Your merchants were not sent. The server returned a non-200 code (or the request was empty) before I could send the final request to send the merchant.  Server: Page Failed 2. From: " + getVillageName(oldVID) + "   To: " + oldCoords + " carrying " + getMerchantInfo(aTask[3]) );
		addToHistory(aTask, false, aLangStrings[74]+" "+aLangStrings[46]+" 2");
	}
}

function handleMerchantRequestConfirmation(httpRequest, options, subSolution) {
	_log(2,"handleMerchantRequestConfirmation> Begin. options = " + options);
	if (httpRequest.readyState == 4) {
		var aTask = options[0];
		var oldName = options[2];
		var oldCoords = aTask[3].split("_");
		oldCoords = "(" + oldCoords[0] + "|" + oldCoords[1] + ")";
		var oldVID = parseInt(aTask[4]);
		if ( isNaN(oldVID) ) oldVID = -2;

		if (httpRequest.status == 200 && httpRequest.responseText ) { // ok
			var holder = document.createElement('div');
			//holder.innerHTML = httpRequest.responseText;
			var marketData = eval('(' + httpRequest.responseText + ')');
			marketData = marketData["response"];
			holder.innerHTML = marketData["data"]["formular"];
			//var tTraders = holder.getElementsByClassName("traders");
			//var tIn = holder.getElementsByClassName("in");
			//var tRes = holder.getElementsByClassName("res");
			//var tDorf = holder.getElementsByClassName("dorf");
			//var oldTime = parseInt(options[1]);
			//var oldDesVID = parseInt(aTask[2]);
			//var tTime, tDesVID, ii, jj = tTraders.length;
			//var reqVID = getActiveVillage(holder);
			var reqVID = aTask[5];
			if ( reqVID != currentActiveVillage ) switchActiveVillage(currentActiveVillage);
			//if ( reqVID == oldVID && holder.getElementsByClassName("gid17").length == 1) {
			if ( marketData["data"]["notice"].length > 0 ) {
			//	for ( ii = 0 ; ii < jj ; ++ii ) {
			//		tTime = parseInt(tIn[ii].firstChild.innerHTML.replace(/:/g,""),10);
			//		tDesVID = parseInt(tDorf[ii].getElementsByTagName("a")[0].href.split("=")[1]);
			//		if ( oldTime-tTime < 9 && tDesVID == oldDesVID && tRes[ii].getElementsByClassName("f10").length == 0) ii = jj;
			//	}
			//	if ( ii == jj+1 ) {
				if(	marketData["data"]["errorMessage"].length == 0 ) {
					printMsg(getVillageName(oldVID)+ "<br>" + aLangTasks[7] + " >> " + oldName + " " + oldCoords + "<br>" + getMerchantInfo(aTask[3]),undefined,subSolution ); //Your merchants were sent.
					_log(1,"Your merchants were sent. From: " + getVillageName(oldVID) + "   To: " +oldName + " " + oldCoords + " carrying " + getMerchantInfo(aTask[3]) );
					if(typeof(subSolution) != 'undefined' && subSolution == true){
						addToHistory(aTask, true,undefined,true);
						return 'success';
					}else{
						addToHistory(aTask, true);
						return 'success';
					}

				} else {
					printMsg(getVillageName(oldVID)+ "<br>" + aLangTasks[7] + " >> " + oldName + " " + oldCoords + "<br>" + getMerchantInfo(aTask[3]) + "<br>"+aLangStrings[50]+" ("+aLangStrings[75]+")",true); //Your merchants didnt send. Confirmation failed
					_log(1,"Your merchants were NOT sent. Didnt see it on marketplace, could have actually been successfull if there was a long delay. Confirmation Failed.From: " + getVillageName(oldVID) + "   To: " +oldName + " " + oldCoords + " carrying " + getMerchantInfo(aTask[3]) );
					addToHistory(aTask, false, aLangStrings[75]);
				}
			} else {
				printMsg(getVillageName(oldVID)+ "<br>" + aLangTasks[7] + " >> " + oldName + " " + oldCoords + "<br>" + getMerchantInfo(aTask[3]) + "<br>"+ aLangStrings[73] + " (" +aLangStrings[75]+", "+ aLangStrings[74]+" "+aLangStrings[11] + " 3)",true); //Your merchants didnt send. (Server: Redirected)
				_log(1,"Request sent, however, I am unable to confirm it. My confirmation page was redirected. Confirmation Failed, Server: Redirected 3. From: " + getVillageName(oldVID) + "   To: " +oldName + " " + oldCoords + " carrying " + getMerchantInfo(aTask[3]) );
				addToHistory(aTask, false, aLangStrings[75] + ", " +aLangStrings[74]+" "+aLangStrings[11] + " 3");
			}
			return;
		}
		switchActiveVillage(currentActiveVillage);
		printMsg(getVillageName(oldVID)+ "<br>" + aLangTasks[7] + " >> " + oldName + " " + oldCoords + "<br>" + getMerchantInfo(aTask[3]) + "<br>"+ aLangStrings[50] +" " + aLangStrings[73] + " (" + aLangStrings[75] + ", " + aLangStrings[74]+" "+aLangStrings[46] + " 3)",true); //Your merchants didnt send. (Server: Page Failed)
		_log(1,"Request sent, however, I am unable to confirm it. The server returned a non-200 code (or the request was empty) after I sent the request. Confirmation Failed, Server: Page Failed 3. From: " + getVillageName(oldVID) + "   To: " +oldName + " " + oldCoords + " carrying " + getMerchantInfo(aTask[3]) );
		addToHistory(aTask, false, aLangStrings[75] + ", " + aLangStrings[74]+" "+aLangStrings[46]+" 3");
	}
}
// *** End Send Merchant Functions ***
// ****** END TTQ TASK FUNCTIONS ******

//  *** BEGIN Timer Form Code ***
/**************************************************************************
 * @param iTask: 0 - build, 1 - upgrade, 2 - attack,raid,support, 3 - research, 4 - train troops, 6 - demolish, 7 - Send Merchants, 8 - Send Troops Back
 * @param target: sitedId for iTask = 0 or 1; iVillageId for siteId = 2
 * @param options: buildingId for iTask = 0; troops for attacks.
 * @param timestamp: if it is passed, suggest the time calculated from this (Caution! It is in seconds).
 * @param taskindex: (optional) task index for editing tasks
 * @param villagedid: (optional) the original task's corresponding village (default: current village)
 * This function functions both as a Listener for Build later and Upgrade later links,
 * and as regular function when arguments are supplied (in case of scheduling attacks and editing existing tasks).
 ***************************************************************************/
function displayTimerForm(iTask, target, options, timestamp, taskindex, villagedid) {
	_log(3,"Begin displayTimerForm("+iTask+", "+target+", "+options+", "+timestamp+", "+taskindex+", "+villagedid+")");
	var iVillageId = typeof(villagedid) != 'undefined' ? villagedid : currentActiveVillage;
	// For build and upgrade, we need to extract arguments from the event object
	if((typeof(iTask) == 'object' || iTask < 2) && target == null) {  //if params are supplied, we do not extract them from the event object target (link)
		var el = iTask.target;  // iTask really is the Event object!
		var iTask = parseInt(el.getAttribute("itask"));
		var target = el.getAttribute("starget");
		var options = el.getAttribute("soptions");
		if(iTask == undefined || target == undefined || options == undefined) {
			_log(2, "Missing arguments:\niTask="+iTask+"\ntarget="+target+"\noptions="+options);
			return false;
		}
	}
	_log(2, "Arguments:\niTask="+iTask+"\ntarget="+target+"\noptions="+options);
	var sTask = '';
	var sWhat = '';
	var sMoreInfo = '';
	var sWho = '<span id="ttq_placename_' +iVillageId+ '">'+getVillageName(iVillageId)+':</span>';
	if (typeof(options) != 'object') options = options.split("_");
	switch(iTask) {
		case 0:  //build
		case 1:  //upgrade
			sWhat = "- "+options[1];
			sTask = aLangTasks[iTask];
			sMoreInfo = aLangStrings[35] + " " +target;
			break;
		case 2:  //Attack, Raid, Support
			var iAttackType = parseInt(options[0]) + 18;
			var bLetsSpy = (iAttackType > 20 && onlySpies(options));
			sWhat = ( bLetsSpy ? aLangStrings[47] : aLangStrings[iAttackType] )+' >> <span id="ttq_placename_' +target+ '">' +getVillageNameZ(target)+ '</span>';
			var bCatapultPresent = (options[8] > 0) ? true : false;
			if(options[11] == undefined) options[11] = 0;  //if no heros are specified, set them to zero
			sMoreInfo = getTroopsInfo(options);
			break;
		case 3:  //Research
			sWhat = "- "+options[2];
			sTask = aLangTasks[options[1]];
			break;
		case 4:  //Training
			sWhat = "" + (options[12] > 0 ? aLangTroops[11] : aLangStrings[49]);
			sTask = aLangTasks[4];
			sMoreInfo = getTroopsInfo(options);
			break;
		case 5:  //Party
			sWhat = aLangStrings[53];
			sTask = aLangTasks[5];
			break;
		case 6:  //Demolish
			sWhat = '<select name="abriss" onchange="var t = document.getElementsByName(\'timerTarget\'); if ( t.length > 0 ) t[0].value = this.value; t = document.getElementById(\'timerMoreInfo\'); if ( t ) { var k = t.innerHTML.split(\' \'); k.pop(); k.push(this.value); t.innerHTML = k.join(\' \'); }">';
			target = parseInt(target);
			if (isNaN(target)) target = -1;
			for ( tX = 0, tY = options.length ; tX < tY ; ++tX ) {
				tA = parseInt(options[tX].replace("[",""));
				sWhat += '<option value="' +tA+ '" '+( tA == target ? 'selected' : '' )+'>'+options[tX]+'</option>';
			}
			sWhat = "- " + sWhat + "</select>";
			sTask = aLangTasks[6] + ": ";
			sMoreInfo = aLangStrings[35] + " " +target;
			break;
		case 7:  //Send Merchants
			sTask = aLangTasks[7];
			sWhat = " >> " + getVillageNameZ(target);
			sMoreInfo = getMerchantInfo(options);
			break;
		case 8: // Send Back Troops
			sTask = aLangTasks[8];
			sWhat = " >> " + target;
			sMoreInfo = getTroopsInfo(options);
			break;
		case 9: // Send troops through Gold-Club
			var sTask = getOption('FARMLIST','');
			if( sTask == '' ) {
				sTask = $gc('tabItem',$gc('active',$gc('subNavi')[0])[0])[0].innerHTML;
				setOption('FARMLIST',sTask);
			}
			sWhat = " >> " + target;
			var tA = $gc('iReport1');
			//if( tA.length > 0 ) {
			//	tA = tA[0].getAttribute('alt');
			//	sWhat += ' >> <img class="iReport iReport1" src="img/x.gif" title="' + tA +
			//	'" alt="' + tA + '"><input type="checkbox" "checked">';
			//}
			/* ????????? ??? ???? ????, ???, ??? ????. ??? ????? 6?,7?,8? ???????. ??????????? ???? name ??? 6??.
			 * ????? ? ??????? ???? ???????. ??????? ???? ????????. ????? ?? ?????? ? ???????.
			 */
			break;
		case 10:  //Send Merchants
			sTask = "Schedule refill village";
			sWhat = " >> " + getVillageNameZ(target);
			sMoreInfo = "Refill to "+ options[2] + "%";
			if(options[3] == true){
				sMoreInfo += " WITHOUT crop";
			}else{
				sMoreInfo += " WITH crop";
			}
			sMoreInfo += " from villages: " +options[4].toString();
			break;
	}

	var oTimerForm = document.createElement("form");
	oTimerForm.setAttribute('name','myForm');
	//Suggest the current time. Can be local or server time.
		var sTimeType = "This is your local time.";

		if(timestamp) var date = new Date(timestamp * 1000);
		else var date = new Date();
		var dd = date.getDate();
		var mm = date.getMonth() + 1;
		var yyyy = date.getFullYear();
		var hh = date.getHours();
		var min = date.getMinutes();
		var sec = date.getSeconds();

		//Convert small numbers to conventional format
		var sTime = formatDate(yyyy, mm, dd, hh, min, sec);
	// Allow target selection for catapults if this is Normal Attack and at least 1 cata is sent
	var sCataTargets = '';
	if(iTask == 2 && iAttackType == 21 && bCatapultPresent) {
		var sCataOptions = "";
		for(var j=1; j < aLangBuildings.length; ++j) {
			if (j==12 || j==23 || j==31 || j==32 || j==33 || j==34 || j==36 || j==42 || j==43) continue; //skip walls and untargetable buildings
			sCataOptions += '<option value="' +j+ '">' +aLangBuildings[j]+ '</option>';
		}
		sCataTargets = '<select name="kata"><option value="99">' +aLangStrings[24]+ '</option>' + sCataOptions + '</select>';
		if ( options[8] >= 20 ) sCataTargets += '<select name="kata2"><option value="0"></option><option value="99">' +aLangStrings[24]+ '</option>' + sCataOptions + '</select>';
	}
	//Allow specifying the spying mode (only if there is nothing but spies being sent and if this is not a support)
	var sSpyMode = '';
	if(iTask == 2 && bLetsSpy) sSpyMode = '<input type="radio" name="spy" value="1" checked>' +aLangStrings[31]+ ' <input type="radio" name="spy" value="2">' +aLangStrings[32];
	oTimerForm.id = "timerForm";
	oTimerForm.setAttribute("onsubmit", "return false;");
	//Use img tag directly
	var sLinkClose = "<img src='" +sCloseBtn+ "' alt='["+aLangStrings[56]+"]' title='"+aLangStrings[56]+"' id='ttq_close_btn' class='ttq_close_btn' onclick='document.body.removeChild(document.getElementById(\"timerform_wrapper\"));' />";
	if (typeof(options) == "object") {
		//4ik elembe lesz a selected villages, azt beékeljük ;-vel
		if(Array.isArray(options[4])){
			options[4] = ";"+options[4].join("_")+";"
		}
		options = options.join("_");
	}
	
	oTimerForm.innerHTML =
	/* 0 */ '<input type="hidden" name="timerTask" value="' +iTask+ '" />' +
	/* 1 */	'<input type="hidden" name="timerTarget" value="' +target+ '" />' +
	/* 2 */	'<input type="hidden" name="timerOptions" value="'+options+'" />'+sWho+'<br /><br />' +sTask+ ' ' +sWhat+ '<br /><br /><span style="display:inline-block;">' + aLangStrings[25] + '</span>' +
	/* 3 */ ' <input name="at" type="text" id="at" value="' +sTime+ '" onmousedown="dragObject = null;" onfocus="document.getElementById(\'after\').value = \'\'; this.value=\'' +sTime+ '\'" title="' +sTimeType+ '" /><span>' + aLangStrings[26] + '</span>' +
	/* 4 */ ' <input name="after" type="text" id="after" onmousedown="dragObject = null;" onmousemove="dragObject = null;" onmouseup="dragObject = null;" onfocus="document.getElementById(\'at\').value = \'\';" />' +
	/* 5 */	'<select name="timeUnit"><option value="1">' + aLangStrings[27]
	+ '</option><option value="60" selected="selected">' + aLangStrings[28]
	+ '</option><option value="3600">' + aLangStrings[29]
	+ '</option><option value="86400">' + aLangStrings[30]
	+ '</option></select><br /><span id="timerMoreInfo" style="font-size:85%;color:red; cursor:default;">' +sMoreInfo+ '</span><br />';

	/* 6,7*/if(sCataTargets != '') oTimerForm.innerHTML += '<p>' + aLangStrings[23] + ': ' +sCataTargets+ ' </p>';
	/* 6,7*/if(sSpyMode != '') oTimerForm.innerHTML += '<p>' +sSpyMode+ '</p>';

	// if taskindex is set, we are editing a task
	if (typeof(taskindex) != 'undefined') sSubmitButtonLabel = aLangStrings[58];
	else sSubmitButtonLabel = "OK";
	var oSubmitBtn = $e("input",[['name',"submitBtn"],['id',"submitBtn"],['type',"submit"]]);
	oSubmitBtn.value = sSubmitButtonLabel;
	ttqAddEventListener(oSubmitBtn, 'click', function() {handleTimerForm(this.form, 1, taskindex, iVillageId)}, true);
	/* 8 */oTimerForm.appendChild(oSubmitBtn);

	// Add buttons if editing
	if (typeof(taskindex) != 'undefined') {
		var oAddCloseBtn = $e("input",[['name',"AddCloseBtn"],['value',aLangStrings[59]],['type',"button"]]);
		ttqAddEventListener(oAddCloseBtn, 'click', function() {handleTimerForm(this.form, 2, taskindex, iVillageId)}, true);
		oTimerForm.appendChild(oAddCloseBtn);

		var oAddBtn = $e("input",[['name',"AddBtn"],['value',aLangStrings[60]],['type',"button"]]);
		ttqAddEventListener(oAddBtn, 'click', function() {handleTimerForm(this.form, 3, taskindex, iVillageId)}, true);
		oTimerForm.appendChild(oAddBtn);
	}

	var oTitle = document.createElement("div");
	oTitle.id="timerform_title";
	oTitle.innerHTML = sLinkClose + "<span style='font-weight: bold;'>" + aLangStrings[57] + "<span>";
	oTitle.style.margin="10px 20px";
	oTitle.setAttribute("class", "handle");
	//oTitle.setAttribute("onmousedown", "return false;");

	var oWrapper = $e("div",[['id',"timerform_wrapper"]]);
	oWrapper.appendChild(oTitle);
	oWrapper.appendChild(oTimerForm);

	//position
	var formCoords = getOption("FORM_POSITION", "215px_215px");
	formCoords = formCoords.split("_");
	oWrapper.style.top = formCoords[0];
	oWrapper.style.left = formCoords[1];

	document.body.appendChild(oWrapper);
	makeDraggable($id("timerform_title"));
	_log(3, "End displayTimerForm()");
	return false;
}
/**************************************************************************
* 0 = timerTask, 1 = timerTarget, 2 = timerOptions, 3 = at, 4 = after
* 5 = timeUnit, 6 = OK - true - 1, 7 = undefined - false - 2, 8 = undefined - OK
/**************************************************************************/
function handleTimerForm(oForm, iAction, taskindex, villagedid) {
	_log(3,"Begin handleTimerForm()");
	if ( typeof(oForm.elements[3]) == "undefined" ) oForm = XPCNativeWrapper.unwrap(oForm);
	var iTaskTime = [];
	var at = oForm.elements["at"].value;
	if(at == '') { // When you type in, say, 13 minutes
		var after = oForm.elements["after"].value;
		var timeUnit = oForm.elements["timeUnit"].value;
		//after = after*timeUnit;  // convert to seconds
		var oDate = new Date();  // current GMT date. TODO: server time

		if (after.indexOf(",") > -1) {
			var arrafter = after.split(",");
			for (var i=0; i<arrafter.length; i++) {
				iTaskTime[i] = Math.floor(oDate.getTime()/1000 + arrafter[i]*timeUnit + ttqRandomNumber());
			}
		} else {
			iTaskTime[0] = Math.floor(oDate.getTime()/1000 + after*timeUnit);
		}
	} else {// when you use the specific time
		// convert formatted date to milliseconds
		var re = new RegExp("^(2[0-9]{3})/([0-9]{1,2})/([0-9]{1,2}) ([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})$", "i");
		var aMatch = at.match(re);
		if(!aMatch) {
			_log(1, "You entered invalid format of date!");
			return;
		}
		for(var i = 2; i < aMatch.length; ++i) {
			// convert strings to integers
			if(aMatch[i].match(/0[0-9]{1}/i)) {aMatch[i] = aMatch[i].substring(1);}
			aMatch[i] = parseInt(aMatch[i]);
		}

		// Time zone conversions
		if(bUseServerTime) { //server time
			var iServerTimeOffset = getServerTimeOffset();
			if(iServerTimeOffset == -999) {  //problem. do nothing.
				_log(2, "We could not schedule this task, because we were unable to determine server's timezone.");
				printMsg("We could not schedule this task, because we were unable to determine server's timezone.", true);
				return false;
			}

			var oTaskDate = new Date(aMatch[1],aMatch[2]-1,aMatch[3],aMatch[4],aMatch[5],aMatch[6]);  //server time in local offset
			var newtimestamp = oTaskDate.getTime() - (oTaskDate.getTimezoneOffset() * 60000);  //server time in server's timezone
			newtimestamp = newtimestamp - (iServerTimeOffset * 3600000);  //get the UTC server time for this task
			iTaskTime[0] = Math.floor( newtimestamp/1000 );  //convert to seconds
		} else {  //local time
			var oDate = new Date(aMatch[1],aMatch[2]-1,aMatch[3],aMatch[4],aMatch[5],aMatch[6]);
			iTaskTime[0] = Math.floor(oDate.getTime()/1000);
		}
	}
	//Remove the form unless "add" is clicked
	if (iAction === 1 || iAction === 2) document.body.removeChild($id('timerform_wrapper'));
	_log(2, "Task will be scheduled for " +iTaskTime);  // The stored time is the absolute Unix GMT time.
	n = oForm.elements["timerOptions"].value.split("_");
	if ( typeof(oForm.elements["spy"]) != "undefined" ) { //We spy
		if ( oForm.elements["spy"].value == 1 ) n[14] = 1;
		else n[14] = 2;
	} else if ( typeof(oForm.elements["kata"]) != "undefined" ) { //We kata
		if ( oForm.elements["kata"].value > 0 ) n[15] = oForm.elements["kata"].value; //store catapults targets
		if(typeof(oForm.elements["kata2"]) != "undefined" && oForm.elements["kata2"].value > 0) n[16] = oForm.elements["kata2"].value;//store catapults targets
	} else if ( typeof(oForm.elements["abriss"]) != "undefined" ) { //We Demo
		n = new Array();
		var tO = oForm.elements["abriss"].getElementsByTagName("option");
		for ( var i = 0, j = tO.length ; i < j ; ++i ) n.push(tO[i].innerHTML);
	}
	oForm.elements["timerOptions"].value = n.join("_");

	// Added taskindex and villagedid, unset taskindex if adding new task
	//Also disabling the "edit" button when clicking the add button
	if (iAction === 2 || iAction === 3) {
		taskindex = undefined;
		at = $id('submitBtn');
		if ( at != null ) at.disabled=true;
	}
	for (var i=0; i<iTaskTime.length; i++) {
		setTask(oForm.elements["timerTask"].value, iTaskTime[i], oForm.elements["timerTarget"].value, oForm.elements["timerOptions"].value, taskindex, villagedid);
	}

	_log(3, "End handleTimerForm()");
}
/**************************************************************************
  * Schedules the specified task. The task is stored in a variable.
  * @param iTask: name of the task (0-build, 1-upgrade, 2-attack, 3-research, 4-train)
  * @param iWhen: date when the task is to be triggered
  * @param target: iBuildingId, or iVillageId
  * @param options: what to build, what units to send attacking (first member specifies the type of attack: 0-support, 1-normal attack, 2-raid).
  ***************************************************************************/
function setTask(iTask, iWhen, target, options, taskindex, villagedid) {
	var iVillageId = typeof(villagedid) != 'undefined' ? villagedid : currentActiveVillage;
	if(bLocked) {
		_log(3, "The TTQ_TASKS variables is locked. We are not able to write it. The Task could not be scheduled.");
		printMsg("<span class='ttq_village_name' style='display:block;'>" +getVillageName(iVillageId)+ "</span>" +aLangStrings[12], true);
		return false;
	}

	bLocked = true;
	var data = getVariable("TTQ_TASKS");
	var aTasks = data.split("|");
	var iTaskIndex = typeof(taskindex) != 'undefined' ? taskindex : aTasks.length;
	var newValue = iTask + ',' + iWhen + ',' + target + ',' + options;
	if ( iVillageId > 0 ) newValue += ',' + iVillageId;
	else newValue += ',' + 'null';
	if (data=="") {
		data = newValue;
		aTasks = data.split("|");
	} else {
		aTasks.splice(iTaskIndex, (typeof(taskindex) != 'undefined' ? 1 : 0), newValue);  //replace/add the task
		data = aTasks.join("|");
	}
	_log(1, "Writing task list: "+data);
	setVariable("TTQ_TASKS", data);
	bLocked = false;
	refreshTaskList(aTasks);
	_log(1, "Writing refreshed task list: "+data);
	// Generate message
	var sTaskSubject = "";
	var sTask = "";
	switch(iTask) {
		case "0":  //build
		case "1":  //upgrade
			sTaskSubject = "- "+options.split("_")[1];
			sTask = aLangTasks[iTask];
			break;
		case "2":  //attack
			sTaskSubject = ' >> <span id="ttq_placename_' +target+ '">' +getVillageNameZ(target)+ '</span>';
			var aTroops = options.split("_");
			var iIndex = parseInt(aTroops[0]) + 18;
			if((iIndex == 21 || iIndex == 22) && onlySpies(aTroops) ) {
				sTask = aLangStrings[47];
				sTaskSubject = " "+aTroops[14]+" "+sTaskSubject;
			} else { sTask = aLangStrings[iIndex]; }
			break;
		case "3":  //research
			var aOptions = options.split("_");
			sTaskSubject = "- "+aOptions[2];
			sTask = aLangTasks[aOptions[1]];
			break;
		case "4":  //training
			var aTroops = options.split("_");
			sTaskSubject = ' ' + getTroopsInfo(aTroops);
			sTask = aLangTasks[4];
			break;
		case "5":  //party
			sTaskSubject = ' ' + aLangStrings[53];
			sTask = aLangTasks[5];
			break;
		case "6":  //Demolish [ALPHA]
			var tO = options.split("_");
			sTaskSubject = "A building";
			target = parseInt(target);
			for ( var i = 0,k = tO.length ; i < k ; ++i ) {
				if ( parseInt(tO[i].replace(/\[/g,"")) == target ) {
					sTaskSubject = "- "+tO[i];
					i = k;
				}
			}
			sTask = aLangTasks[6];
			break;
		case "7": //Send Merchants
			sTask = aLangTasks[7];
			var opts = options.split("_");
			sTaskSubject = ": " + getVillageName(iVillageId) + " >> " + getVillageNameXY(opts[0],opts[1]) + "<br>" + getMerchantInfo(opts);
			break;
		case "8": //Send Back/Withdraw
			sTask = aLangTasks[8];
			var opts = options.split("_");
			sTaskSubject = " >> " + target + "<br>" + getTroopsInfo(opts) ;
			break;
		case "9": // Send troops through Gold-Club
			sTask = getOption('FARMLIST','');
			var opts = options.split("_");
			sTaskSubject = " >> " + target + " ";
			break;
		default:
			break;
	}

	printMsg(getVillageName(iVillageId,true) + '<br/>' + aLangStrings[10] + '<br/>' +sTask+ ' ' +sTaskSubject);
	if(!oIntervalReference) {
		oIntervalReference = window.setInterval(checkSetTasks, CHECK_TASKS_EVERY*1000);  //start checking if there is any task to trigger
		_log(2, "Started checking for the set tasks...");
	}
	ttqUpdatePanel(data);

	_log(3, "End setTask(()");
}

//CUSTOM
function getResources (aDoc) {
		try { var resources={};
			var fullScr = $xf('//script[contains(text(),"resources.production")]',undefined,aDoc,aDoc).innerHTML;
			var r1 = fullScr.match(/resources.production\s=[\s\S]+};/);

            eval(r1[0]);
        } catch(e) {  }
        for( var i = 0; i < 4; i++ ) {
			var wholeRes = $g("l" + (1+i),aDoc);
            if( ! wholeRes ) return false;
            if( typeof resources != 'undefined' )
                income[i] = resources.production['l'+(1+i)];
            else {
                var resT = $g('production');
                if( resT ) {
                    income[i] = resT.rows[1+i].cells[2].innerHTML.match(/-?\d+/)[0];
                } else {
                    income[i] = RB.village_PPH[i];
                }
            }
            incomepersecond[i] = income[i] / 3600;
            iresNow[i] = parseInt(toNumber(wholeRes.textContent));
            fullRes[i] = resources.maxStorage['l'+(1+i)];
        }
        resNow = iresNow.slice();

        //incomeba lesz listaként a 4 nyersi
        //console.log(income);
    return true;
}


// *** End Timer Form Code ***

// *** Begin Drag n Drop (move TTQ windows) Block ***
var mouseOffset = null;
var iMouseDown  = false;
var lMouseState = false;
var dragObject  = null;
var curTarget   = null;

function mouseCoords(ev){
	return {x:ev.pageX, y:ev.pageY};
}

function getMouseOffset(target, ev){
	var docPos    = getPosition(target);
	var mousePos  = mouseCoords(ev);
	return {x:mousePos.x - docPos.x, y:mousePos.y - docPos.y};
}

function getPosition(e){
	var left = 0;
	var top  = 0;
	while (e.offsetParent){
		left += e.offsetLeft + (e.currentStyle?(parseInt(e.currentStyle.borderLeftWidth)).NaN0():0);
		top  += e.offsetTop  + (e.currentStyle?(parseInt(e.currentStyle.borderTopWidth)).NaN0():0);
		e     = e.offsetParent;
	}
	left += e.offsetLeft + (e.currentStyle?(parseInt(e.currentStyle.borderLeftWidth)).NaN0():0);
	top  += e.offsetTop  + (e.currentStyle?(parseInt(e.currentStyle.borderTopWidth)).NaN0():0);
	return {x:left, y:top};
}

function mouseMove(ev){
	var target   = ev.target;
	var mousePos = mouseCoords(ev);

	if(dragObject){
		dragObject.style.position = 'absolute';
		dragObject.style.top      = (mousePos.y - mouseOffset.y) +"px";
		dragObject.style.left     = (mousePos.x - mouseOffset.x) +"px";
	}
	lMouseState = iMouseDown;
	return false;
}

function mouseUp(ev){
	if(dragObject) {
		switch(dragObject.id) {
			case "ttq_message":
				var key = "MSG_POSITION";
				break;
			case "timerform_wrapper":
				var key = "FORM_POSITION";
				break;
			case "ttq_history":
				var key = "HISTORY_POSITION";
				break;
			case "ttq_tasklist":
			default:
				var key = "LIST_POSITION";
				break;
		}
		setOption(key, dragObject.style.top +"_"+ dragObject.style.left);
	}
	dragObject = null;
	iMouseDown = false;
}

function mouseDown(ev){
  var mousePos = mouseCoords(ev);
	var target = ev.target;
	if (target.id == 'ttq_close_btn') {dragObject = null; return false;}
	iMouseDown = true;
	if(target.getAttribute('DragObj')) return false;
}

function makeDraggable(item, noParent){
	if(!item) return;
	ttqAddEventListener(item, "mousedown",function(ev){
		ev.preventDefault();
		dragObject  = (noParent?this:this.parentNode);
		mouseOffset = getMouseOffset((noParent?this:this.parentNode), ev);
		return false;
	}, false);
}
// *** End Drag n Drop (move TTQ windows) Block ***

// *** Begin TTQ "get" Functions  Block ***
function getSiteId() {
	_log(3,"Begin getSiteId()");
	//Check if the page is showing the village instead
	var xpathVillage = xpath("//div[@class='village2'] | //div[@class='village1'] ");
	var href = window.location.href;
	if ( xpathVillage.snapshotLength > 0 || href.indexOf("messages") > -1 || href.indexOf("berichte") > -1 || href.indexOf("hero") > -1 || href.indexOf("details") > -1 || href.indexOf("karte") > -1 || href.indexOf("statistiken") > -1 ) {
		_log(2, "getSiteId>This is not a screen that has a building. End getSiteId()");
		return -6;
	}
	_log(3,"getSiteId> Trying from URL...");
	var re = /.*build\.php\?([a-z=0-9&]*&)?id=([0-9]{1,2})/i;
	var tSiteId = window.location.href.match(re);
	if(tSiteId != null) {
		tSiteId = parseInt(tSiteId[2]);
		_log(3, "getSiteId> Building site ID is " + tSiteId + ". End getSiteId().");
		return tSiteId;
	}
	_log(2, "getSiteId> Building site ID not found.... anywhere. End getSiteId();");
	return -6;
}

/**************************************************************************
 * @return name of one of your one villages.
 ***************************************************************************/
function getVillageName(iVillageDid) {
	iVillageDid = parseInt(iVillageDid);
	if ( isNaN(iVillageDid) ) return aLangStrings[2];
	if ( typeof(myPlaceNames[iVillageDid]) != "undefined" ) return myPlaceNames[iVillageDid];
	if ( iVillageDid > 0 ) return "(" + iVillageDid + ")";
	return aLangStrings[2];
}

function getVillageNameZ(iVillageZid) {
	var xy = coordZToXY(iVillageZid);
	return getVillageNameXY(xy[0],xy[1]);
}

function getVillageNameXY(iVillageX, iVillageY){
	iVillageX = parseInt(iVillageX);
	iVillageY = parseInt(iVillageY);
	if ( isNaN(iVillageX) || Math.abs(iVillageX) > mapRadius || isNaN(iVillageY) ||  Math.abs(iVillageY) > mapRadius ) return aLangStrings[2];
	if ( typeof(myPlaceNames[iVillageX+" "+iVillageY]) != "undefined" ) return myPlaceNames[iVillageX+" "+iVillageY];
	var nV, tStr1 = "<span class ='ttq_village_name' title='"+aLangStrings[81]+"' onclick='window.location = \"position_details.php?x="+iVillageX+"&y="+iVillageY+"\";return false;' >";
	var tStr2 = "("+iVillageX+"|"+iVillageY+")</span>";
	for ( var i = 0, k = otherPlaceNames.length ; i < k ; ++i ) {
		nV = otherPlaceNames[i].split("|");
		if ( parseInt(nV[0]) == iVillageX && parseInt(nV[1]) == iVillageY ) {
			nV.splice(0,2);//Just in case some village names have | in thier name
			return tStr1+nV.join("|")+" "+tStr2;
		}
	}
	return tStr1+tStr2;
}

function getTroopsInfo(aTroops) {
	var sTroopsInfo = "";
	var isEmpty = true;
	var k = -1;
	for(var i = 1; i < aTroops.length && i < 13; ++i) {
		if ( aTroops[i] > 0 && ((isEmpty && i > 11) || (i < 12)) ) {
			isEmpty = false;
			sTroopsInfo += aLangTroops[i-1] + ": " +aTroops[i]+ ", ";
		}
	}
	//trim last two characters
	sTroopsInfo = sTroopsInfo.substring(0, sTroopsInfo.length - 2);
	return sTroopsInfo;
}

function getMerchantInfo(aMerchants, isLong){
	var	sMerchantInfo = "";
	if ( typeof(aMerchants) == 'string'	) aMerchants = aMerchants.split("_");
	if ( isLong ) { sMerchantInfo = aLangResources[0] + ":" + aMerchants[2] + ", " + aLangResources[1] + ":" + aMerchants[3] + ", " + aLangResources[2] + ":" + aMerchants[4] + ", " + aLangResources[3] + ":" + aMerchants[5];
	} else {
		sMerchantInfo = "" + ((aMerchants[2]>0)?(aLangResources[0]+": "+aMerchants[2]+", "):"") + ((aMerchants[3]>0)?(aLangResources[1]+": "+aMerchants[3]+", "):"") + ((aMerchants[4]>0)?(aLangResources[2]+": "+aMerchants[4]+", "):"") + ((aMerchants[5]>0)?(aLangResources[3]+": "+aMerchants[5]+", "):"");
		sMerchantInfo = sMerchantInfo.slice(0,-2);
	}
	return sMerchantInfo;
}

function getTaskDetails(aTask) {
	_log(2,"Begin getTaskDetails("+aTask+")");
	switch(aTask[0]) {
		case "0": //build new building
			return getVillageName(aTask[4]) + " : " + aLangTasks[0] + " " + aTask[3].split("_")[1] + "<br>(" + aLangStrings[35] + " " + aTask[2] + ")";
		case "1": //upgrade building
			return getVillageName(aTask[4]) + " : " + aLangTasks[1] + " " + aTask[3].split("_")[1] + "<br>(" + aLangStrings[35] + " " + aTask[2] + ")";
		case "2": //send attack
			var aTroops = aTask[3].split("_");
			var iIndex = parseInt(aTroops[0]) + 18;
			if ( (iIndex == 21 || iIndex == 22) && onlySpies(aTroops) ) var sTask = aLangStrings[47]+" "+aTroops[14]+" ";
			else var sTask = aLangStrings[iIndex];
			return getVillageName(aTask[4]) + " : " + sTask + " >> " + getVillageNameZ(aTask[2]) + "<br>(" + getTroopsInfo(aTroops) + ")";
		case "3": //research
			var aOptions = aTask[3].split("_");
			return getVillageName(aTask[4])+" : "+aLangTasks[aOptions[1]]+" - "+aOptions[2];
		case "4": //train troops
			var aTroops = aTask[3].split("_");
			return getVillageName(aTask[4]) + " : " + aLangTasks[4] + "<br>(" + getTroopsInfo(aTroops) + ")";
		case "5": //throw party
			return getVillageName(aTask[4]) + " : " + aLangTasks[5] + " " + aLangStrings[53];
		case "6": //demolish building
			var tmp = "A Building";
			var tmp2 = aTask[3].split("_");
			var siteId = parseInt(aTask[2]);
			for ( var i = 0, k = tmp2.length ; i < k ; ++i ) {
				if ( parseInt(tmp2[i].replace(/\[/g,"")) == siteId ) {
					tmp = tmp2[i];
					break;
				}
			}
			return getVillageName(aTask[4]) + " : " + aLangTasks[6] + " " + tmp + "<br>(" + aLangStrings[35] + " " + siteId + ")";
		case "7": //Send Merchants
			var tM = aTask[3].split("_");
			return getVillageName(aTask[4]) + " : " + aLangTasks[7] + " >> " + getVillageNameXY(tM[0],tM[1]) + "<br>(" + getMerchantInfo(tM) + ")";
		case "8": //Send Back/Withdraw
			return getVillageName(aTask[4]) + " : " + aLangTasks[8] + " >> " + aTask[2] + "<br>(" + getTroopsInfo(aTask[3].split("_")) + ")";
		case "9": // Send troops through Gold-Club
			return getVillageName(aTask[4]) + " : " + getOption('FARMLIST','') + " >> " + aTask[2] + " ";
		default: //do nothing
			_log(3, "Unknown task, cant find details.");
			return "Unknown Task";
	}
	_log(3, "End getTaskDetails("+aTask+")");
}

function getTroopNames() {
	var httpRequest = new XMLHttpRequest();
	var httpRequestString = fullName+"build.php?id=39&tt=1";
	httpRequest.open("GET", httpRequestString, true);
	httpRequest.onreadystatechange = function() {
		if (httpRequest.readyState == 4) { //complete
			var tTroops = new Array();
			if (httpRequest.status == 200 && httpRequest.responseText) { // ok
				var holder = document.createElement('div');
				holder.innerHTML = httpRequest.responseText;
				if ( holder.getElementsByClassName("gid16").length == 1 ) {
					var tUnits = holder.getElementsByClassName("troop_details");
					var i;
					for ( i = 0, k = tUnits.length ; i < k && tUnits[i].className.indexOf(" ") > -1 ; ++i ) ;
					tUnits = tUnits[i].getElementsByClassName("unit");
					if ( tUnits.length > 10 ) for ( i = 0 ; i < 11 ; ++i ) tTroops.push("["+tUnits[i].alt+"]");
				}
			}
			tTroops.push(aLangStrings[7]);
			if ( tTroops.length > 10 ) {
				aLangTroops = tTroops;
				setVariable("TROOP_NAMES",tTroops.join("|"));
				isTroopsLoaded = true;
				ttqUpdatePanel();
			}
		}
	};
	httpRequest.send(null);
}

// *** End TTQ "get" Functions ***

// *** Begin Helper Functions ***

function onlySpies(aTroops) { // @return true if there are only spies, false if there is anything else or no spies.
	_log(3,"Begin onlySpies()");
	var iScoutUnit = (iMyRace == 2 || iMyRace == 6) ? 3 : 4;
	if(aTroops[iScoutUnit] < 1) { //no spies
		_log(3, "No spies.");
		return false;
	}
	for(var i=1; i <= 11; ++i) {
		if(i != iScoutUnit && parseInt(aTroops[i]) > 0) { //at least one other troop
			_log(3, "Troops other than spies are present.");
			return false;
		}
	}
	_log(3, "This is a spying mission.");
	return true;
}

function switchActiveVillage(did) {
	_log(2, "Switching your village back to " +did);
	if ( Number.isInteger(did) && did > 0 ) get(fullName+"dorf1.php?newdid="+did, null, null);
}
function switchActiveVillage(did,options,callback) {
	_log(2, "Switching your village back to " +did);
	if ( Number.isInteger(did) && did > 0 ) get(fullName+"dorf1.php?newdid="+did, callback, options, true);
}



// *** Display Helper Functions
function generateButton(title, callback){
	_log(3, "Begin generateButton()");
	var oBtn = document.createElement("span");
	oBtn.style.border="1px solid #71D000";
	oBtn.style.backgroundImage = "linear-gradient(to top,#ccd5cc,#ffffff)";
	oBtn.style.verticalAlign="middle";
	oBtn.style.margin="5px";
	oBtn.style.borderRadius = "3px";
	oBtn.style.cursor="pointer";
	oBtn.style.display="inline-block";
	oBtn.setAttribute("onMouseOver", "this.style.border='1px solid #808080';");
	oBtn.setAttribute("onMouseOut", "this.style.border='1px solid #71D000';");
	oBtn.setAttribute("onclick", "window.scroll(0, 0);");
	oBtn.innerHTML = "<span style='font-size: 8pt; margin: 5px; color: #808080'>"+title+"</span>";
	ttqAddEventListener(oBtn,"click", callback, false);
	_log(3, "End generateButton()");
	return oBtn;
}

function printMsg(sMsg,bError,subSolution) {
	_log(3,"Begin printMsg()");
	var oDate = new Date();
	var sWhen = oDate.toLocaleString() + "\n";
	_log(1, sWhen + sMsg);
	var oOldMessage = $id("ttq_message");
	if(oOldMessage) {
		_log(3, "Removing the old message." +oOldMessage);
		oOldMessage.parentNode.removeChild(oOldMessage); 	// delete old message
	}
	// here we generate a link which closes the message //Use img tag directly
	var sLinkClose = "<img src='" +sCloseBtn+ "' alt='["+aLangStrings[56]+"]' title='"+aLangStrings[56]+"' id='ttq_close_btn' class='ttq_close_btn' onclick='document.body.removeChild(document.getElementById(\"ttq_message\"));' />";
	var sBgColor = (bError) ? "#FFB89F" : "#90FF8F";
	if (subSolution == true){
		sBgColor = "#E08F26";
	}
	var oMsgBox = document.createElement("div");
	oMsgBox.innerHTML = "<div id='ttq_draghandle_msg' class='handle'>" + sLinkClose + sMsg + "</div>";
	oMsgBox.style.backgroundColor = sBgColor;
	var msgCoords = getOption("MSG_POSITION", "215px_215px");
	msgCoords = msgCoords.split("_");
	oMsgBox.style.top = msgCoords[0];
	oMsgBox.style.left = msgCoords[1];
	oMsgBox.id = "ttq_message";
	document.body.appendChild(oMsgBox);
	makeDraggable($id('ttq_draghandle_msg'));
	_log(3, "End printMsg()");
}

function ttqRandomNumber() {
	var aleat = Math.random() * (MAX_REFRESH_MINUTES-MIN_REFRESH_MINUTES);
	aleat = Math.round(aleat);
	return parseInt(MIN_REFRESH_MINUTES) + aleat;
}

function ttqAddEventListener (obj, str, handler, boole) {
	if ( obj && str && handler ) {
		theListeners.push([obj, str, handler, boole]);
		obj.addEventListener(str, handler, boole);
	}
}

function ttqAniShadePanelYellowToRed(tNode) {  //This all assumes that CHECK_TASKS_EVERY is set to the default 10 seconds.
	var tGreen = 255;
	var tBlue = 255;
	return function () {
		if ( tBlue > 135 ) tBlue -= 24;
		else tGreen -= 24;
		tNode.style.backgroundColor = "rgb(255,"+tGreen+","+tBlue+")";
	}
}

function ttqAniShadePanelGreen(tNode) {  //This all assumes that CHECK_TASKS_EVERY is set to the default 10 seconds.
	var tRed = 255;
	var tBlue = 255;
	var tStyle = tNode.style;
	return function () {
		tBlue -= 5;
		tRed -= 5;
		tStyle.backgroundColor = "rgb("+tRed+",255,"+tBlue+")";
	}
}

function ttqUpdatePanel(aTasks,tTime){
	if ( oAnimateTimerIR  ) {
		window.clearInterval(oAnimateTimerIR);
		oAnimateTimerIR = null;
	}
	var ttqTimer = $id("ttqReloadTimer");
	if ( ttqTimer ) {
		tA = Math.floor(Date.now()/1000);
		vName = getOption('RELOAD_AT', 0, "integer") - tA; //Recycled Variables
		vName = Math.floor(vName/60)+"m"+vName%60 + "s";
		ttqTimer.innerHTML = vName;
		if ( !isTroopsLoaded || !isTTQLoaded ) return; // Its grey while something (getTroopNames) is running, so we let it stay grey
		ttqTimer = ttqTimer.parentNode.parentNode;
		if ( !aTasks ) aTasks = getVariable("TTQ_TASKS", "");
		if ( !tTime ) tTime = tA;
		tX = 0;
		tY = 0;
		if ( aTasks != "" ) {
			tA = aTasks.split("|");
			for ( tY = tA.length ; tX < tY ; ++tX ) {
				vName = parseInt(tA[tX].split(",")[1]);
				if ( vName <= tTime+60 ) {
					if ( vName <= tTime+CHECK_TASKS_EVERY) {
						if ( vName <= tTime ) {
							ttqTimer.style.backgroundColor ="#EE8787";
						} else {
							ttqTimer.style.backgroundColor ="#FFFF00";
							oAnimateTimerIR = window.setInterval(ttqAniShadePanelYellowToRed(ttqTimer), CHECK_TASKS_EVERY*99);
						}
					} else {
						ttqTimer.style.backgroundColor ="#BBFFBB";
						oAnimateTimerIR = window.setInterval(ttqAniShadePanelGreen(ttqTimer), CHECK_TASKS_EVERY*99);
					}
					tX = tY;
				}
			}
		}
		if ( tX != tY+1 ) ttqTimer.style.backgroundColor ="#FFFFFF";
	}
}

// *** End Helper Functions ***

// *** Begin GreaseMonkey Menu Block ***
function promptRace() {
	iMyRace = 'x';
	while ( isNaN(iMyRace) ) {
		iMyRace = prompt(aLangMenuOptions[0] + aLangMenuOptions[7] + getOption("RACE", -1, "integer"));
		if ( iMyRace == null || iMyRace == '' ) break;
		iMyRace = parseInt(iMyRace);
		if ( !isNaN(iMyRace) ) {
			if ( iMyRace < 7 ) {
				if ( iMyRace < -1 || iMyRace == 3 || iMyRace == 4 || iMyRace > 7 ) iMyRace = -1;
				setOption("RACE", iMyRace);
				window.location.reload();
				break;
			} else iMyRace = 'x';
		}
	}
}

function promptHistory() {
	var tHistLen = 'x';
	while ( isNaN(tHistLen) ) {
		tHistLen = prompt(aLangMenuOptions[0] + aLangMenuOptions[6] + iHistoryLength);
		if ( tHistLen == null || tHistLen == '' ) break;
		tHistLen = parseInt(tHistLen);
		if( !isNaN(tHistLen) ) {
			if(tHistLen > -1) {
				setOption("HISTORY_LENGTH", tHistLen);
				window.location.reload();
				break;
			} else tHistLen = 'x';
		}
	}
}

function promptReset() {
	if ( confirm(aLangMenuOptions[0] + "\n" + aLangMenuOptions[8]) ) {
		// rewritten by Serj_LV
		unLoad();
		var allkey = ['OTHER_PLACE_NAMES','TROOP_NAMES','TTQ_HISTORY','TTQ_OPTIONS','TTQ_TABID','TTQ_TASKS','vlist'];
		for (var i=0; i<allkey.length; i++) allkey[i] = CURRENT_SERVER + myPlayerID + "_" + allkey[i];
		allkey.push(CURRENT_SERVER+'login',CURRENT_SERVER+'lang');
		for (i=0; i<allkey.length; i++) TTQ_deleteValue(allkey[i]);
		var ttqPanel = $id("ttqPanel");
		if( ttqPanel ) {
			ttqPanel.style.backgroundColor ="#C0C0FF";
			ttqPanel.innerHTML = 'TTQ - goodbye';
		}
		allkey = ["ttq_message","timerform_wrapper","ttq_history","ttq_tasklist"];
		for (i=0; i<allkey.length; i++) {
			tA = $id(allkey[i]);
			if( tA ) tA.parentNode.removeChild(tA);
		}
	}
}

function promptLang() {
// writed by Serj_LV
	var aLangPrompt = "0 - auto, or one of these: ";
	var t=1;
	allLangs.sort();
	for( var i=0; i<allLangs.length; i++ ) {
		if(aLangPrompt.length > t*50 ) {
			aLangPrompt += '\n';
			t++;
		}
		aLangPrompt += allLangs[i] + ", ";
	}
	while( true ) {
		var aLang = prompt(aLangPrompt, TTQ_getValue(CURRENT_SERVER+"lang","0"));
		if( !aLang ) return;
		if( aLang == 0 ) {
			TTQ_deleteValue(CURRENT_SERVER+"lang");
			break;
		} else {
			if( (","+allLangs.join(',')+",").indexOf(","+aLang+",") != -1 ) {
				TTQ_setValue(CURRENT_SERVER+"lang",aLang);
				break;
			}
		}
	}
	window.location.reload();
}

// *** End GreaseMonkey Menu Block ***

// *** Begin document listener Block ***
function onLoad() {
	var starttime2 = Date.now();

	_log(1,"Begin onLoad()");

	TTQ_registerMenuCommand(aLangMenuOptions[3], promptRace);
	TTQ_registerMenuCommand(aLangMenuOptions[4], promptHistory);
	TTQ_registerMenuCommand(aLangMenuOptions[5], promptReset);
	TTQ_registerMenuCommand("Language", promptLang);

    tA = /.*build\.php.*/i;

	//CUSTOM
	if( /build.php/.test(crtPath) ) { putCustomSendResourceFromVillageLink() }

	createCustomMerchantSenderLink();
	createScheduleTroopsLink();
	if (iSiteId > -1 && tA.test(window.location.href)) {
		createBuildLinks();

		var build = $id('build');
		if( !(build) ) {
//		tX = xpath("//div[@class='build_desc']/a/img");
//		if (xpath("//div[@id='build'][@class='gid0']").snapshotLength > 0 || tX.snapshotLength != 1 ) {
			_log(2, "This is an empty building site or I can not find build description image. More more links to create.");
		} else {
			tY = parseInt(build.getAttribute('class').match(/\d+/)[0]);
			_log(3, "This building (gid="+tY+").");
//			tY = parseInt(tX.snapshotItem(0).className.split(" g")[1]);  //Building ID
			switch ( tY ) {
				case 13:
				case 22:	createResearchLinks(tY);
							break;
				case 19:	case 20:	case 21:	case 36:
				case 25:	case 26:	case 29:	case 30:	case 44:
							createTrainLinks(tY);
							break;
				case 24:	createPartyLinks();
							break;
				case 15:	createDemolishBtn();
							break;
				case 17:	createMarketLinks();
							break;
				case 16:	if( $gn('s1') ) createAttackLinks();
							if( $id('raidList') ) createGoldClubBtn();
							break;
				default:	_log(2, "This building (gid="+tY+") has no more links to create.");
			}
		}
	}

	vName = getVariable("TTQ_TASKS");
	if(vName != '') refreshTaskList(vName.split("|"));

	tA = getVariable("TTQ_HISTORY");
	if(iHistoryLength > 0 && tA != '') refreshHistory(ttqTrimData(tA, iHistoryLength, false));

	tA = $id("ttqLoad");
	tX = Date.now();
	if ( tA ) tA.innerHTML = (inittime + (tX - starttime2));

	isTTQLoaded = true;
	ttqUpdatePanel(vName,Math.floor(tX/1000));
	_log(1, "End onLoad()");

	if(AUTOMATIC_BUILD_SCHEDULE){
		window.close();
	}
}

function getSelectValues(select) {
	var result = [];
	var options = select && select.options;
	var opt;

	for (var i=0, iLen=options.length; i<iLen; i++) {
	  opt = options[i];

	  if (opt.selected) {
		result.push(opt.text);
	  }
	}
	return result;
  }

function getLegioOptions(count){
	return '80b842_'+count+'_0_0_0_0_0_0_0_0_0_0_0_19_-1_-1_-1';
}
function getTestorOptions(count){
	return '80b842_0_'+count+'_0_0_0_0_0_0_0_0_0_0_19_-1_-1_-1';
}

function wait(ms){
	var start = new Date().getTime();
	var end = start;
	while(end < start + ms) {
	  end = new Date().getTime();
   }
 }


/**
 * Returns the currently selected village's struct
 */
function getCurrentVillageStruct(){
	var BreakException = {};
	var villageStruct;
	var villages = getVillageNamesAndZIDs();
	try{
		Object.keys(villages).forEach(function(key) {
			villageStruct = villages[key];
			if(villageStruct.id == currentActiveVillage){
				throw BreakException
				return villageStruct;
			}
		});
	}catch (e){
		if (e === BreakException) return villageStruct;
	}
	return undefined;
}

function getVillageStructByVillageName(selectedVillageName){
	var BreakException = {};
	var villageStruct;
	var villages = getVillageNamesAndZIDs();
	try{
		Object.keys(villages).forEach(function(key) {
			villageStruct = villages[key];
			if(villageStruct.villageName == selectedVillageName){
				throw BreakException
				return villageStruct;
			}
		});
	}catch (e){
		if (e === BreakException) return villageStruct;
	}
	return undefined;
}



 unsafeWindow.getHeroNextVillage = function(){
	return heroPath[getCurrentVillageStruct().villageName];
 }

 unsafeWindow.sendHeroToSelectedVillage = function(selectedVillageName){
	if(Array.isArray(selectedVillageName) && selectedVillageName.length == 1){
		selectedVillageName = selectedVillageName[0];
	}

	var task = [];
	task.push('2')
	task.push(''+new Date().getTime())
	task.push(''+getVillageStructByVillageName(selectedVillageName).vid)
	//first two is for logging purposes the sending coordinate
	task.push('2_0_0_0_0_0_0_0_0_0_0_1_0_-1_-1_-1_-1_1') // 2 az valami 'c', az első 1 az a hero , az utolsó pedig hogy áthelyezés, a -1ek nemtom
	task.push(currentActiveVillage) 

	attack(task);
 }


 unsafeWindow.scheduleVillageRefill = function(selectedVillages,nK,noCrop){
	var villages = getVillageNamesAndZIDs();
	var currentVillageZID;
	var currentVillageX;
	var currentVillageY;
	Object.keys(villages).forEach(function(key) {
		villageStruct = villages[key];
		if(villageStruct.id == currentActiveVillage){
			currentVillageZID = villageStruct.vid
		}
	});

		var tXX = coordZToXY(currentVillageZID)[0];
		var tYY = coordZToXY(currentVillageZID)[1];
		var tData = [tXX,tYY,nK,noCrop,selectedVillages];
		displayTimerForm(10, currentVillageZID, tData);
 }

/**
 * Input:
 * array of selected village names: e.g: ['02','03'...]
 * string of '_' concatenated missing resources: e.g: '4000_1200_10_20'
 * string of '_' concatenated income/h of the village to send to: e.g: '5250_5250_5250_6000'
 * zid optional ha nincs megadva akkor a current active falu lesz kiválasztva
 */
unsafeWindow.sendResourcesForTroopsFromSelectedVillages = function(selectedVillages,missingResources,incomeString,zid){
	bLocked = true;
	if(missingResources == '0_0_0_0'){
		console.log('INFO exiting, nothing to send')
		return;
	}

	var villages = getVillageNamesAndZIDs();
	var villageIdsToSendFrom = [];
	var marketIDs = [];
	for(var i = 0; i < selectedVillages.length ; ++i ) {
		var villageName = selectedVillages[i];
		var villageStruct = villages[villageName];
		if(notUndefinedNotNull(villageStruct.marketID) && notUndefinedNotNull(villageStruct.id)){
			marketIDs.push(''+villageStruct.marketID);
			villageIdsToSendFrom.push(''+villageStruct.id);
		}else{
			console.log("WARNING marketID or Zid is not defined for village: "+ villageName + " continue with next village");
		}
	}

	var currentVillageZID;
	if (typeof(zid) != 'undefined'){
		currentVillageZID = zid;
	}else{
		Object.keys(villages).forEach(function(key) {
			villageStruct = villages[key];
			if(villageStruct.id == currentActiveVillage){
				currentVillageZID = villageStruct.vid
			}
		});
	}

	if(!notUndefinedNotNull(currentVillageZID)){
		console.log('ERROR could not determine current village coords, exiting')
		return;
	}

	for(var i = 0; i < villageIdsToSendFrom.length ; ++i ) {
		var task = [];
		task.push('7')
		task.push(''+new Date().getTime())
		task.push(''+currentVillageZID)
		//first two is for logging purposes the sending coordinate
		task.push('0_0_'+missingResources+'_'+marketIDs[i]+'_'+incomeString)
		task.push(villageIdsToSendFrom[i])
		//console.log('the task is: ' + task);
		var result = merchant(task)
		console.log('remaining amount to send after sending from ' + villageIdsToSendFrom[i] + ' is : ' + result);
		var continueE = false;
		if(result != null && Array.isArray(result)){
			for(var g = 0; g < result.length ; ++g ) {
				if(result[g] != 0){
					continueE = true;
					missingResources = result[0]+'_'+result[1]+'_'+result[2]+'_'+result[3];
				}
			}
		}
		if(!continueE){
			break;
		}
		wait(800);
	}
	bLocked = false;
	if(result.join('_') =='0_0_0_0'){
		console.log('COMPLETED sending resources')
	}else{
		console.log(result + 'REMAINING')
		addToHistory(['7',''+new Date().getTime(),'','','',''], true, 'Remaining to send: '+result,true) 
	}
}



unsafeWindow.scheduleTroopsInSelectedVillages = function(selectedVillages) {
	bLocked = true;
	var villages = getVillageNamesAndZIDs();
	var _1day = 1000 *60 *60 *24;
    var oDate =Math.floor((new Date().getTime()- _1day)/1000 );
	if (typeof(selectedVillages) != 'undefined' && selectedVillages != null){
		var count = 0;
		for(var i = 0; i < selectedVillages.length; i++) {
			var villageName = selectedVillages[i];
			var villageStruct = villages[villageName];
			var taskTrain = [];

			if(notUndefinedNotNull(villageStruct.troopType)){
				taskTrain.push('4');
				taskTrain.push(''+oDate);
				taskTrain.push(''+villageStruct.barrackID);
				if(villageStruct.troopType =='l'){
					taskTrain.push(getLegioOptions(50));
				}else if (villageStruct.troopType =='t'){
					taskTrain.push(getTestorOptions(50));
				}else{
					console.log("WARNING troop type is unknown for village: "+ villageName + " continue with next village");
					continue;
				}
				taskTrain.push(''+villageStruct.id);
				console.log('INFO starting train in: ' + villageName)
				train(taskTrain);
				console.log('INFO finishing train: '  + villageName)
				wait(1500);
			}else{
				console.log("WARNING no troop type is defined for village: "+ villageName + " continue with next village");
				continue;
			}

        }
	}
	bLocked = false;
	console.log('INFO done training')
};

function notUndefinedNotNull(variableToCheck){
	return (typeof(variableToCheck) != 'undefined' && variableToCheck != null);
}

function putCustomSendResourceFromVillageLink(){
	var baseWrap = $xf('.//div[contains(@class,"contractWrapper")]','l',cont);
	for( var j = 0; j < baseWrap.snapshotLength; j++ ) {
		var baseCosts = $xf('.//div[contains(@class,"contractCosts")]','l', baseWrap.snapshotItem(j));
		for( var i = 0; i < baseCosts.snapshotLength; i++ ) {
			var base = baseCosts.snapshotItem(i).innerHTML;
			if ( ! />(\d+).+?>(\d+).+?>(\d+).+?>(\d+)/.test(base) ) break;
			var newD = sendFromShow( base );
			if(newD != null){
				var map = getVillageNamesAndZIDs();
				var el = $sel('akarmi', Object.keys(map).length);
				for(var villageName in map) {
					var villageZID = map[villageName];
					var option = $opt(villageName,villageZID);
					el.appendChild(option);
				}
				if( wfl || baseCosts.snapshotItem(i).parentNode.getAttribute("class") != "details" ){
					var childOfThisElement = $gc('showCosts',baseWrap.snapshotItem(j))[0];
					var sendFromLink = $a('Küldés ebből a faluból',[['href',jsVoid],['dir','ltr']]);
					childOfThisElement.appendChild( el );
					childOfThisElement.appendChild( sendFromLink);
					sendFromLink.addEventListener('click',function(){
						getResources();
						var selectedValues = getSelectValues(el);
						var missingResources = [newD[0],newD[1],newD[2],newD[3]];
						unsafeWindow.sendResourcesForTroopsFromSelectedVillages(selectedValues,missingResources.join('_'),income.join('_'));
					}, 0);
				}
			}
			//addNPC(baseCosts.snapshotItem(i));
		}
	}
}
function sendFromShow( base ) {
	var neededRes = base.match(/>(\d+).+?>(\d+).+?>(\d+).+?>(\d+)/);
	wfl = false;
	var wantsResMem = [0,0,0,0,0,0,0,0,0,0];
	var forNPC = [0,0];
	var beforeThis = $e('DIV');
	getResources();
	for (var e = 0; e < 4; e++) {
		wantsResMem[e+5] = parseInt(neededRes[e+1]);
		var wantsRes = resNow[e] - wantsResMem[e+5];
		if (wantsRes < 0) {
			wantsResMem[e] = Math.abs(wantsRes);
			wfl = true;
		}
	}
	if (wfl == true){
		return wantsResMem;
	}
	return null;
}



function unLoad () {
	setVariable("TTQ_TABID", 0);
	for ( tX = 0, tY = theListeners.length ; tX < tY ; ++tX ) {
		tA = theListeners[tX];
		if  ( tA && tA[0] ) tA[0].removeEventListener(tA[1],tA[2],tA[3]);
	}
	window.clearInterval(oAnimateTimerIR);
	window.clearInterval(oIntervalReference);
	oIntervalReference = null;
	oAnimateTimerIR = null;
}

function doMinimize(evt) {
	var isMin, tD = evt.target.parentNode;
	if ( tD != null ) {
		switch ( tD.id ) {
			case "ttq_tasklist":		isMinimized = !isMinimized;
										isMin = isMinimized;
										setOption ("LIST_MINIMIZED", isMinimized);
										break;
			case "ttq_history":			isHistoryMinimized = !isHistoryMinimized;
										isMin = isHistoryMinimized;
										setOption ("LIST_HISTORY_MINIMIZED", isHistoryMinimized);
										break;
			default:					return false;
		}

		if ( isMin ) {
			tD.style.height = "16px";
			tD.style.width = "150px";
			tD.style.overflow = "hidden";
		} else {
			tD.style.height = "";
			tD.style.width = "";
		}
	}
}

// *** End document listener Block ***
/**************************************************************************
 * --- Main Code Block ---
 ***************************************************************************/
if (init) {
	ttqAddEventListener ( document, "mousemove", mouseMove, false );
	ttqAddEventListener ( document, "mousedown", mouseDown, false );
	ttqAddEventListener ( document, "mouseup",   mouseUp,   false );
//	ttqAddEventListener ( window,   "load",      onLoad,    false );
	ttqAddEventListener ( window,   "unload",    unLoad,    false );
	var inittime = Date.now();
	_log(0, "TTQ starting...");
	var tmp = Math.round(ttqRandomNumber()*60000);
	setOption('RELOAD_AT', Math.floor((tmp + inittime)/1000));
	inittime -= starttime;
	_log(1, "CheckSetTasks> Begin. (tab ID = " + myID + " / "+getVariable("TTQ_TABID",0)+")");
//	checkSetTasks();
	if(!oIntervalReference) {
		_log(3, "setInterval()");
		oIntervalReference = window.setInterval(checkSetTasks, CHECK_TASKS_EVERY*1000);
	}
	onLoad();
} else {
    var oLogout = xpath("//div[@class='logout']");
	var oError = $gc('error');
	var errorFL = false;
	for( var i=0; i<oError.length; i++ ) {
		if( oError[i].innerHTML.replace(/\s/g,'').length > 0 ) {
			errorFL = true;
			break;
		}
	}
	if( oLogout.snapshotLength > 0 || errorFL ) TTQ_setValue(CURRENT_SERVER+'login','0');
    var oSysMsg = xpath("//div[@id='sysmsg']");
	var oLoginBtn = xpath("//button[@id='s1'][@name='s1'][@type='submit']");
    if ( oLoginBtn.snapshotLength < 1 && (oLogout.snapshotLength > 0 || oSysMsg.snapshotLength > 0) ) {
        _log(0, "Error screen or something. Game is not loaded. Did not start TTQ.");
    } else if ( oLoginBtn.snapshotLength == 1 ) {  //Auto-Login, this assumes that FF has saved your username and password
		var loginFL = false;
		var oLogin = xpath("//input[@name='name'][@class='text'][@type='text']").snapshotItem(0);
		var oPassword = xpath("//input[@name='password'][@class='text'][@type='password']").snapshotItem(0);
		// writed by Serj_LV
		var logPas = TTQ_getValue(CURRENT_SERVER+'login','0');
		if( logPas != '0' ) {
			logPas = logPas.split('/');
			oLogin.value = logPas[0];
			oPassword.value = logPas[1];
			loginFL = true;
		} else {
			oLoginBtn.snapshotItem(0).addEventListener('click',function() {
				if ( oLogin.value.length > 0 && oPassword.value.length > 0 )
					TTQ_setValue(CURRENT_SERVER+'login',oLogin.value+'/'+oPassword.value);
			}, false);
		}
		if( loginFL ) setTimeout("document.getElementById('s1').click();",Math.round(ttqRandomNumber()*111)); // 333 - roughly 1.6 to 3.3 with default random min/max settings
		else _log(0,"Auto-Login failed. You must have Firefox/Chrome store the username and password. TTQ does not.");
	} else {
		_log(0, "Initialization failed, Auto-login failed. Travian Task Queue is not running");
	}
}

}

function backupStart () {
	if(notRunYet) {
		var l4 = document.getElementById('l4');
		if( l4 ) allInOneTTQ();
		else setTimeout(backupStart, 500);
	}
}

var notRunYet = true;
if( /Gecko/.test(navigator.userAgent) ) allInOneTTQ();
else if (window.addEventListener) window.addEventListener("load",function () { if(notRunYet) allInOneTTQ(); },false);
setTimeout(backupStart, 500);

})();