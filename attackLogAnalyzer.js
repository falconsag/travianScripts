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
  script.addEventListener('load', function() {
    var script = document.createElement("script");
    script.textContent = "window.jQ=jQuery.noConflict(true);(" + callback.toString() + ")();";
    document.body.appendChild(script);
  }, false);
  document.body.appendChild(script);
}


    // the guts of this userscript
function main() {

     var btnAnalyze = $('<input type="button" id="btnAnalyze" value="Analyze reports" />');
     jQuery("div.boxes-contents.cf:first").append(btnAnalyze);
     jQuery("#btnAnalyze").on('click',function(){
         AnalyzeReports();
     });


    //wrap jquery dom element in html and log
     function logJqueryDOM( domElement){
         console.log(domElement.clone().wrap('<div/>').parent().html())
     }

     function AnalyzeReports(){
      jQuery('td#logAnalyzerTD').each(function(){
      $(this).remove();
      });
     var no=0;
     //minden kifosztotta, és támad linkre
    jQ("a:contains('kifosztotta'),a:contains('támad')")
        .each(function() {


        var linkToReport =$(this).attr('href');
        var result = null;
        jQuery.ajax({
           url: linkToReport,
           type: 'get',
           dataType: 'html',
           async: false,
           success: function(data) {
            var sumStolen = 0
            var parsedHtml = jQuery.parseHTML(data);

            jQuery("table#attacker tbody.goods img",parsedHtml).filter( ".r1,.r2,.r3,.r4" ).each(function(){
                sumStolen += Number($(this).parent().text());
            });
            result = sumStolen+";";

            //numbers of first 5 attacker type like (5,0,0) = 5 buzogányos
            var attackers = jQuery("table#attacker tbody.units:nth-child(3) td",parsedHtml).slice(0,5)
               .map(function(){
                return $(this).text()
            })
            .get()
            .join(",");

             var sumAttackerLost = 0
             jQuery("table#attacker tbody.units.last td",parsedHtml).each(function(){
                 sumAttackerLost += Number($(this).text());
             });


             var sumDefenderLost =0;
             jQuery("table#attacker",parsedHtml).siblings("table").find("tbody.units.last td").each(function(){
                 sumDefenderLost += Number($(this).text());
             });

            result =result + attackers +";"+sumAttackerLost+";"+sumDefenderLost;
           }
        });
        no++;
        var resultArray = result.split(";")
        console.log("processed: "+no+" report");
        $(this).parent().parent().parent().append('<td id="logAnalyzerTD">'+resultArray[0]+'</td>');
        $(this).parent().parent().parent().append('<td id="logAnalyzerTD">'+resultArray[1]+'</td>');

        //convert falsely values to zero: 0,NaN,undefined,false,....

        resultArray[2] = resultArray[2] || 0;
        resultArray[3] = resultArray[3] || 0;
        var atkLostString= (resultArray[2] != 0) ? "Atk lost: "+resultArray[2] : "";
        var defLostString= (resultArray[3] != 0) ? "Def lost: "+resultArray[3] : "";

        $(this).parent().parent().parent().append('<td id="logAnalyzerTD">'+atkLostString+'</td>');
        $(this).parent().parent().parent().append('<td id="logAnalyzerTD">'+defLostString+'</td>');

        
    })
     }





}

// load jQuery and execute the main function
addJQuery(main);



})();