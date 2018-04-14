// ==UserScript==
// @name           Kemleles reporter
// @license        GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @include     *://*.travian*.*/berichte.php*

// @version        2.12.29
// ==/UserScript==

(function () {





    function detectMapSize () {
        var aText = $xf('//script[contains(text(),"TravianDefaults")]');
        if( aText ) {
            eval(aText.textContent);
            return window.TravianDefaults["Map"]["Size"]["width"];
        }
    }
    function id2xy(vid) {
        var arrXY = new Array;
        var ivid = parseInt(vid);
        arrXY[0] = ((ivid-1) % mapWidth) - mapRadius;
        arrXY[1] = mapRadius - Math.floor((ivid-1) / mapWidth);
        return arrXY;
    }
    function $gt(str,m) { return (typeof m == 'undefined' ? document:m).getElementsByTagName(str); }
    function $gn(aID) {return (aID != '' ? document.getElementsByName(aID) : null);}
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
    function id2xy(vid) {
        var arrXY = new Array;
        var ivid = parseInt(vid);
        arrXY[0] = ((ivid-1) % mapWidth) - mapRadius;
        arrXY[1] = mapRadius - Math.floor((ivid-1) / mapWidth);
        return arrXY;
    }
    var mapWidth = detectMapSize();
    var mapRadius = (mapWidth - 1) / 2;

    function getCurrentSpyEntry(){
        var a = $xf('//span[contains(@class,"inline-block")]','l');
        if(a && a.snapshotLength > 1){
            var defenderSpanItem = a.snapshotItem(1);
            var aHrefs = $gt('a',defenderSpanItem);
            var klanName = aHrefs[0].text;
            var playerName = defenderSpanItem.nextSibling.nextSibling.innerHTML;
        

            var villageAHref = $xf('(//td[@class="troopHeadline"])[2]/p/a[@class="village"]','f');
            var vid = villageAHref.getAttribute('href').match(/d=(\d+)/)[1]

            var villageCoords = id2xy(vid);
            var url = window.location.href;
            var date = $xf('//div[@id="time"]/div[@class="header text"]','f').innerHTML;
            var year = date.split(",")[0];


            var entry = klanName+";"+playerName+";"+villageCoords[0]+","+villageCoords[1]+";"+url+";"+year;
            return entry;
        }
    }



    var spyEntries = window.localStorage.getItem('TravianSpyEntries');

    if( typeof(spyEntries) =='undefined' || spyEntries == null ){
        spyEntries = "";
    }

    spyEntries = spyEntries + "\n"+getCurrentSpyEntry();
    window.localStorage.setItem( 'TravianSpyEntries', spyEntries );


    
})();