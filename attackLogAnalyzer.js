// ==UserScript==
// @name        Attack log analyzer
// @namespace   http://greasyfork.org/users/6214-adipiciu
// @author      adipiciu (based on TTQ by Risi and further edited by Nevam and then Pimp Trizkit and Serj_LV)
// @license     GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @description Schedule delayed constructions, upgrades and attacks.
// @contributionURL https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=56E2JM7DNDHGQ&item_name=TTQ4+script&currency_code=EUR
// @include     *://*.travian.hu/allianz.php?s=3*
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

        function isEmptyObject(obj) {
            for(var prop in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                    return false;
                }
            }
            return true;
        }

        var btnAnalyze = $('<input type="button" id="btnAnalyze" value="Analyze reports" />');
        jQuery("div.boxes-contents.cf:first").append(btnAnalyze);
        jQuery("#btnAnalyze").on('click', function () {
            AnalyzeReports();
        });


        //wrap jquery dom element in html and log
        function logJqueryDOM(domElement) {
            console.log(domElement.clone().wrap('<div/>').parent().html())
        }

        function AnalyzeReports() {
            jQuery('td#logAnalyzerTD').each(function () {
                $(this).remove();
            });
            var no = 0;
            //minden kifosztotta, és támad linkre
            jQ("a:contains('kifosztotta'),a:contains('támad'),a:contains('kém')")
                .each(function () {


                    var linkToReport = $(this).attr('href');
                    var result = {};
                    jQuery.ajax({
                        url: linkToReport,
                        type: 'get',
                        dataType: 'html',
                        async: false,
                        success: function (data) {
                            var sumStolen = 0
                            var parsedHtml = jQuery.parseHTML(data);

                            //STOLEN RESOURCES
                            jQuery("table#attacker tbody.goods img", parsedHtml).filter(".r1,.r2,.r3,.r4").each(function () {
                                sumStolen += Number($(this).parent().text());
                            });
                            result.sumStolen = sumStolen;

                            //ATTACKERS
                            var attackers = [];
                            var counter = 0;
                            jQuery("table#attacker tbody.units:nth-child(3) td", parsedHtml).each(function () {
                                if ($(this).text() != "0") {
                                    var attackerObj = {};
                                    attackerObj.iconHtml = jQuery("table#attacker tbody.units:nth-child(2) td:nth-child(" + (counter + 2) + ")", parsedHtml).html();
                                    attackerObj.number = $(this).text();
                                    attackers.push(attackerObj);
                                }
                                counter++;
                            });
                            result.attackers = attackers;


                            //ATTACKER LOST
                            var attackersLost = [];
                            var counter = 0;
                            var sumAttackerLost = 0
                            jQuery("table#attacker tbody.units.last td", parsedHtml).each(function () {
                                if ($(this).text() != "0") {
                                    var attackerLostObj = {};
                                    attackerLostObj.iconHtml = jQuery("table#attacker tbody.units:nth-child(2) td:nth-child(" + (counter + 2) + ")", parsedHtml).html();
                                    attackerLostObj.number = $(this).text();
                                    attackersLost.push(attackerLostObj);
                                }
                                sumAttackerLost += Number($(this).text());
                                counter++;
                            });
                            result.attackersLost = attackersLost;
                            result.sumAttackerLost = sumAttackerLost;


                            //DEFENDERS
                            var sumDefenderLost = 0;
                            var dict = {};
                            var lineCounter = 0;
                            jQuery("table#attacker", parsedHtml).siblings("table").each(function () {

                                //go through the defenders of each team on defenders side
                                //and save the numbers
                                var unitsPerColumn = {};
                                var columnCounter = 0;
                                jQuery("tbody.units:nth-child(3) td",$(this)).each(function(){
                                    unitsPerColumn[columnCounter] = Number($(this).text()) || 0;
                                    columnCounter++;
                                });

                                //skipping nonsense separator tables
                                if(!isEmptyObject(unitsPerColumn)){
                                    var props = Object.getOwnPropertyNames(unitsPerColumn);
                                    for (var i = 0; i < props.length; i++) {
                                        var colNumber = Number(props[i])
                                        var htmlOfIcon = jQuery("table#attacker", parsedHtml).siblings("table:nth-child("+(lineCounter+3)+")").find("tbody:first td.uniticon:nth-child("+(colNumber+2)+")").html();
                                        var numberOfThatType =unitsPerColumn[i];
                                        if(typeof dict[htmlOfIcon] == "undefined"){
                                            dict[htmlOfIcon] = 0;
                                        }
                                        dict[htmlOfIcon] += numberOfThatType;

                                    }
                                }
                                lineCounter++;
                            });
                            result.defenders = dict;

                            //DEFENDERS LOST
                            var sumDefenderLost = 0;
                            jQuery("table#attacker", parsedHtml).siblings("table").find("tbody.units.last td").each(function () {
                                sumDefenderLost += Number($(this).text());
                            });
                            result.sumDefenderLost = sumDefenderLost;
                        }
                    });
                    no++;
                    console.log("processed: " + no + " report");
                    var parentToAppendTo = $(this).parent().parent().parent();
                    parentToAppendTo.append('<td id="logAnalyzerTD">' + result.sumStolen + '</td>');


                    //ATTACKERS
                    var attackersHtmlToInsert = "";
                    for (var i = 0; i < result.attackers.length; i++) {
                        attackersHtmlToInsert = attackersHtmlToInsert + result.attackers[i].iconHtml + result.attackers[i].number + "</br>";
                    }
                    parentToAppendTo.append('<td id="logAnalyzerTD" width="15%">' + attackersHtmlToInsert + '</td>');

                    //ATTACKERS LOST
                    var attackersLostHtmlToInsert = "";
                    for (var i = 0; i < result.attackersLost.length; i++) {
                        attackersLostHtmlToInsert = attackersLostHtmlToInsert + result.attackersLost[i].iconHtml + result.attackersLost[i].number + "</br>";
                    }
                    parentToAppendTo.append('<td id="logAnalyzerTD" width="15%">' + attackersLostHtmlToInsert + '</td>');


                    //DEFENDERRS
                    var defendersHtmlToInsert = "";
                    var props = Object.getOwnPropertyNames(result.defenders);
                    for (var i = 0; i < props.length; i++) {
                       var propKey =props[i];
                       var propVal = result.defenders[propKey];
                       if(propVal != 0){
                           defendersHtmlToInsert = defendersHtmlToInsert + propKey + propVal + "</br>";
                       }
                    }
                    parentToAppendTo.append('<td id="logAnalyzerTD" width="15%">' + defendersHtmlToInsert + '</td>');

                    //convert falsely values to zero: 0,NaN,undefined,false,....
                    result.sumDefenderLost = isNaN(result.sumDefenderLost) ? 0 : result.sumDefenderLost;
                    var defLostString = (result.sumDefenderLost != 0) ? "Def lost: " + result.sumDefenderLost : "";
                    $(this).parent().parent().parent().append('<td id="logAnalyzerTD">' + defLostString + '</td>');


                })
        }


    }

// load jQuery and execute the main function
    addJQuery(main);


})();