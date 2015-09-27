// ==UserScript==
// @name         Pandora Skip Counter
// @namespace    http://your.homepage/
// @version      0.1
// @description  Tracks all stations' individual song-skips per rolling hour.
// @author       Soren Barr
// @match        http://www.pandora.com/*
// @grant        none
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// ==/UserScript==

var skipDates = {};

String.prototype.toTimeShort = function() {
    var sec_num = parseInt(this, 10);
    var h = Math.floor(sec_num / 3600);
    var m = Math.floor((sec_num - (h * 3600)) / 60);
    var s = sec_num - (h * 3600) - (m * 60);

    var hh = (h < 10) ? "0" + h : h.toString();
    var mm = (m < 10) ? "0" + m : m.toString();
    var ss = (s < 10) ? "0" + s : s.toString();

    return ((h > 0) ? hh + ':' + mm + ':' : (m > 0) ? mm + ':' : "") + ss;
};

function skipDisplay() {
    var station = $(".stationChangeSelector [title]:first").attr("title");

    var display = "";
    try {
        var matches = station.match(/\b(\w)/g);
        display = matches.join('');
    } catch (err) {
        console.log(err);
    }

    var dates = skipDates[station];

    if (dates instanceof Array && dates.length > 0) {
        var diff = 0;
        while (dates.length > 0) {
            diff = dates[0] - new Date() + (60 * 60 * 1000);
            if (diff <= 0) {
                dates.shift();
                localStorage.skipDates = JSON.stringify(skipDates);
            } else {
                break;
            }
        }
        if (dates.length > 0) {
            diff = diff / 1000 + 1;
            diff = diff.toString().toTimeShort();
            display += ": " + (6 - dates.length) + ", " + diff;
        }
    } else {
        display += ": " + 6;
    }

    $(".stationChangeSelector [title]:first").html(display);
    setTimeout(skipDisplay, 1000);
}

function skip() {
    var station = $(".stationChangeSelector [title]:first").attr("title");

    var dates = skipDates[station];

    if (!(dates instanceof Array)) {
        dates = [];
    } else if (dates.length >= 6) {
        return;
    }
    dates.push(new Date());
    localStorage.skipDates = JSON.stringify(skipDates);
}

function addSkipFunc(jNode) {
    jNode.click(skip);
}

function addDisplayFunc(jNode) {
    try {
        var storedSkipDates = localStorage.skipDates;
        if (typeof storedSkipDates == 'string') {
            var parsedDates = JSON.parse(storedSkipDates);
            if (parsedDates instanceof Object) {
                for (var key in parsedDates) {
                    var dates = skipDates[key] = [];
                    for (var val of parsedDates[key]) {
                        dates.push(new Date(val));
                    }
                }
            }
        }
    } catch (err) {
        console.log(err);
    }

    //jNode.click(skip); // FOR TESTING !!!
    skipDisplay();
}

function waitJavaQuery() {
    if (typeof window.jQuery == 'undefined') {
        window.setTimeout(waitJavaQuery, 100);
    } else {
        $ = window.jQuery;
        addToElements();
    }
}

function addToElements() {
    waitForKeyElements(".thumbDownButton", addSkipFunc);
    waitForKeyElements(".skipButton", addSkipFunc);
    waitForKeyElements(".stationChangeSelector [title]:first", addDisplayFunc);
}

waitJavaQuery();