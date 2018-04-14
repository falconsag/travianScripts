// ==UserScript==
// @name         FarmlistaraRako
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://tx3.travian.hu/position_details*
// @grant        none
// ==/UserScript==

(function () {
    

    function getXYFromPos(hr) {
        if (hr == null) return 0;
        var vIdH = hr.match(/[&\?][zd]=(\d+)/);
        //if( vIdH ) vId = vIdH[1];
        //else {
        vIdH = hr.match(/[&\?]x=(-?\d+)&y=(-?\d+)/);
        //                            vId = vIdH ? xy2id(vIdH[1], vIdH[2]) : 0;
        //            }
        return vIdH;
    }

    function $g(aID) { return (aID != '' ? document.getElementById(aID) : null); }
    function $gn(aID) { return (aID != '' ? document.getElementsByName(aID) : null); }
    function $gt(str, m) { return (typeof m == 'undefined' ? document : m).getElementsByTagName(str); }
    function $gc(str, m) { return (typeof m == 'undefined' ? document : m).getElementsByClassName(str); }
    function $at(aElem, att) { if (att !== undefined) { for (var xi = 0; xi < att.length; xi++) { aElem.setAttribute(att[xi][0], att[xi][1]); if (att[xi][0].toUpperCase() == 'TITLE') aElem.setAttribute('alt', att[xi][1]); } } }
    function $t(iHTML) { return document.createTextNode(iHTML); }
    function $e(nElem, att) { var Elem = document.createElement(nElem); $at(Elem, att); return Elem; }
    function $ee(nElem, oElem, att) { var Elem = $e(nElem, att); if (oElem !== undefined) if (typeof (oElem) == 'object') Elem.appendChild(oElem); else Elem.innerHTML = oElem; return Elem; }
    function $c(iHTML, att) { return $ee('TD', iHTML, att); }
    function $a(iHTML, att) { return $ee('A', iHTML, att); }
    function $am(Elem, mElem) { if (mElem !== undefined) for (var i = 0; i < mElem.length; i++) { if (typeof (mElem[i]) == 'object') Elem.appendChild(mElem[i]); else Elem.appendChild($t(mElem[i])); } return Elem; }
    function $em(nElem, mElem, att) { var Elem = $e(nElem, att); return $am(Elem, mElem); }
    function dummy() { return; }

    var crtPath = window.location.href;
    var fullName = crtPath.match(/^.*\/\/.+\/+?/)[0];

    function ajaxRequest(url, aMethod, param, onSuccess, onFailure) {
        var aR = new XMLHttpRequest();
        aR.onreadystatechange = function () {
            if (aR.readyState == 4 && (aR.status == 200 || aR.status == 304))
                onSuccess(aR);
            else if (aR.readyState == 4 && aR.status != 200) onFailure(aR);
        };
        aR.open(aMethod, url, true);
        if (aMethod == 'POST') aR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
        aR.send(param);
    };


    function $xf(xpath, xpt, startnode, aDoc) {
        var XPFirst = XPathResult.FIRST_ORDERED_NODE_TYPE;
        var XPList = XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE;
        var XPIterate = XPathResult.UNORDERED_NODE_ITERATOR_TYPE;
        var XPResult = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE;
        if (!aDoc) aDoc = document;
        if (!startnode) startnode = document;
        var xpres = XPFirst;
        switch (xpt) {
            case 'i': xpres = XPIterator; break;
            case 'l': xpres = XPList; break;
            case 'r': xpres = XPResult; break;
        };
        var ret = aDoc.evaluate(xpath, startnode, null, xpres, null);
        return (xpres == XPFirst ? ret.singleNodeValue : ret);
    };






    var ajaxToken = false;
    function getAjaxToken() {
        if (ajaxToken) return ajaxToken;
        var aText = $xf('//script[contains(text(),"ajaxToken")]');
        if (aText) eval(aText.textContent.match(/ajaxToken.*/)[0]);
        return ajaxToken;
    }

    //usage: listId should be supplied!
    //a kód forrásába van egy javascript function ami visszadobja azt az ajaxTokent ami kell mikor besubmiteljük a listát...
    //ezt a függvényt regexszel kikeressük evaluáljuk, innentől létezik itt a kódban az a function.. arra ráhívunk és megvan a token ami kell
    function farmlista() {
        var fullScr = $xf('//script[contains(text(),"assemblerAtticsGangplankHobbyCatalysis")]').innerHTML;
        var r1 = fullScr.match(/assemblerAtticsGangplankHobbyCatalysis[\s\S]+/);
        eval(r1[0]);
        var tokenNeeded = assemblerAtticsGangplankHobbyCatalysis();
        ajaxRequest(fullName + 'ajax.php?cmd=raidList', 'POST', 'cmd=raidList&action=ActionAddSlot&listId=1089&x=' + xX + '&y=' + yY + '&t1=0&t2=0&t3=' + parseInt(biri.value) + '&t4=0&t5=0&t6=' + parseInt(cezi.value) + '&t7=0&t8=0&t9=0&t10=0&ajaxToken=' + tokenNeeded, function (ajaxResp) {
        console.log(ajaxResp.responseText);
        }, dummy);

    }


    var xX = getXYFromPos(crtPath)[1];
    var yY = getXYFromPos(crtPath)[2];


    var build = $g('tileDetails');
    var biri = $e('INPUT', []);
    var cezi = $e('INPUT', []);
    biri.value = '0';
    cezi.value = '35';


    build.appendChild(biri);
    build.appendChild(cezi);


    var btn = document.createElement('input');
    btn.type = 'button';
    btn.value = 'Create';


    btn.addEventListener('click', farmlista, false);

    build.appendChild(btn);


//    farmlista();

})();