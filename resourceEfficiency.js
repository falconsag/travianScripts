// ==UserScript==
// @name        Efficiency calculator
// @namespace   http://greasyfork.org/users/6214-adipiciu
// @author      adipiciu (based on TTQ by Risi and further edited by Nevam and then Pimp Trizkit and Serj_LV)
// @license     GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @description Schedule delayed constructions, upgrades and attacks.
// @contributionURL https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=56E2JM7DNDHGQ&item_name=TTQ4+script&currency_code=EUR
// @include     *://*.travian.hu/build.php*
// @exclude     *.css
// @exclude     *.js

// @version     1.5.2
// ==/UserScript==

(function () {

    function addJQuery(callback) {
        var script = document.createElement("script");
        script.setAttribute("src", "https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js");
        script.addEventListener('load', function () {
            var script = document.createElement("script");
            script.textContent = "window.jQ=jQuery.noConflict(true);(" + callback.toString() + ")();";
            document.body.appendChild(script);
        }, false);
        document.body.appendChild(script);
    }


    // the guts of this userscript
    function main() {
        var currentProd =Number(jQuery("tr.currentLevel th:contains('Aktuális termelés')").siblings().find("span").text());
        var nextProd =Number(jQuery("tr.nextPossible th:contains('szinten')").siblings().find("span").text());
        var increase = (nextProd-currentProd)*1.25;

        var cost = jQuery("div.showCosts.centeredText");
        var r1 =Number(cost.find("span.r1").text());
        var r2 =Number(cost.find("span.r2").text());
        var r3 =Number(cost.find("span.r3").text());
        var r4 =Number(cost.find("span.r4").text());

        var sumCost = r1+r2+r3+r4
        var resourceTable = jQuery("tr.currentLevel th:contains('Aktuális termelés')").parent().parent();
        var increaseCost = sumCost/increase*1000;
        resourceTable.append('<tr><th>1000 termelés növekedés ára:</th><td><span class="number">'+increaseCost+'</span></td></tr>');
    }

// load jQuery and execute the main function
    addJQuery(main);


})();