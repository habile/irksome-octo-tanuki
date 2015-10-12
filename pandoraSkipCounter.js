// ==UserScript==
// @name         Pandora Skip Counter
// @namespace    http://your.homepage/
// @version      0.1
// @description  Tracks all stations' individual song-skips per rolling hour.
// @author       Soren Barr
// @match        http://www.pandora.com/*
// @downloadURL  https://raw.githubusercontent.com/habile/irksome-octo-tanuki/master/pandoraSkipCounter.js
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

String.prototype.lpad = function(padString, length) {
    var str = this;
    while (str.length < length) {
        str = padString + str;
    }
    return str;
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
        dates = skipDates[station] = [];
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

function addJPlayerFunc(jNode) {
    document.styleSheets[0].insertRule("#timeTip{ \
        position:abosolute; \
        z-index:24; \
        background-color:#ccc; \
        text-decoration:none; \
        display: none; \
        position:absolute; \
        border: 1px solid #000D23; \
        background-color: #455774; \
        color:#FFF; \
        text-align: center; \
        width: 40px; \
        height: 15px; \
    }", 0);

    var timeouts = {};
    var player = $('#jPlayer2');

    function progress() {
        if ($(".progressBar").length > 0) {
            $(".progressBar").click(function(e) {
                var l = player.data('jPlayer').status.duration;
                var x = e.pageX - this.offsetLeft;
                var w = $(this).width();
                var p = x / w;
                var t = Math.round(p * l * 100) / 100;
                player.jPlayer("play", t);
            });
            $(".progressBar").mousemove(function(e) {
                var l = player.data('jPlayer').status.duration;
                var x = e.pageX - this.offsetLeft;
                var w = $(this).width();
                var p = x / w;
                var t = p * l * 100 / 100;
                var mins = Math.floor(t / 60);
                var secs = Math.floor(t % 60).toString().lpad(0, 2);
                var time = mins + ':' + secs;
                $("#timeTip").html(time).css({
                    "left": (e.clientX - 20) + "px",
                    "top": (e.clientY - 50) + "px"
                }).show();
            }).mouseout(function() {
                $("#timeTip").hide();
            });
            $('.progress').append('<div id="timeTip"></div>');
        } else {
            timeouts.progressBar = setTimeout(progress, 200);
        }
    }
    timeouts.progressBar = setTimeout(progress, 200);
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
    waitForKeyElements("#jPlayer2", addJPlayerFunc);
}

waitJavaQuery();