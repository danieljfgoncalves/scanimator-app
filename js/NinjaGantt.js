// NinjaGantt
// version 1.0.0
// 2015 Gustavo Ushijima [gustavo@ushijima.com.br]
// Release Date 2015-06-16
(function ($) {
    _ngt_startX = null;
    _ngt_startY = null;
    _ngt_mouseDown = null;
    _ngt_mouseUp = null;
    _ngt_selectedDragItem = null;
    _ngt_currentWidth = null;

    $.fn.ninjaGantt = function (options) {

        var _ninjaGantt = {};
        _ninjaGantt.p = $.extend({
            sourceList: new Array(),
            columns: null,
            maxHeight: null,
            fixed: true,
            onLeftItemClick: null,
            onRightItemClick: null,
            onLoad: null
        }, options);

        _ninjaGantt.divWrapper = this;
        _ninjaGantt.p.monthsName = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'Octuber', 'November', 'Dezember']

        _ninjaGantt.fnBuild = function () {
            var divWrapper = $(this.divWrapper);
            divWrapper.html('');
            divWrapper.addClass("ninjaGantt");

            if (this.p.fixed)
                divWrapper.addClass("fixed");



            var divLeft = $("<div>", { "class": "divGanttLeft" });
            var divLeftWrapper = $("<div>", { "class": "divGanttLeft-Wrapper" });
            var divRight = $("<div>", { "class": "divGanttRight" });
            var divRightWrapper = $("<div>", { "class": "divGanttRight-Wrapper" });


            var dtOffestTimeZone = (((new Date()).getTimezoneOffset()) / 60);
            var dtMinStart = null;
            var dtMaxEnd = null;
            var arrayMonths = new Array();
            var arrayDates = new Array();
            for (var i = 0; i < this.p.sourceList.length; i++) {
                var obj = this.p.sourceList[i];

                var dtStartItem = null;
                if (obj.Start) {
                    if (Object.prototype.toString.call(obj.Start) === '[object Date]')
                        dtStartItem = new Date(obj.Start);
                    else
                        dtStartItem = new Date((obj.Start + "-" + buildTimeString(dtOffestTimeZone, 0)));
                }

                var dtEndItem = null;
                if (obj.End) {
                    if (Object.prototype.toString.call(obj.End) === '[object Date]')
                        dtEndItem = new Date(obj.End);
                    else
                        dtEndItem = new Date((obj.End + "-" + buildTimeString(dtOffestTimeZone, 0)));
                }

                if (dtStartItem && (dtMinStart == null || dtStartItem < dtMinStart)) {
                    dtMinStart = dtStartItem;
                }

                if (dtEndItem && (dtMaxEnd == null || dtEndItem > dtMaxEnd)) {
                    dtMaxEnd = dtEndItem;
                }
            }
            var prevYear = null;
            var prevMonth = null;
            while (dtMinStart <= dtMaxEnd) {
                var year = dtMinStart.getFullYear();
                var month = dtMinStart.getMonth() + 1;
                var day = dtMinStart.getDate();
                var week = dtMinStart.getDay();

                var isDiffMonth = false;

                if (prevYear == null || prevYear != year) {
                    prevYear = year;
                    isDiffMonth = true;
                }
                if (prevMonth == null || prevMonth != month) {
                    prevMonth = month;
                    isDiffMonth = true;
                }

                if (isDiffMonth)
                    arrayMonths.push([year, month]);

                arrayDates.push([year, month, day, week]);

                dtMinStart.setDate(dtMinStart.getDate() + 1);
            }


            //-- LEFT SIDE
            var divHeaderLeft = $("<div>", { "class": "divGanttLeft-header" });
            var divBodyLeft = $("<div>", { "class": "divGanttLeft-body" });
            for (var c = 0; c < this.p.columns.length; c++) {
                var col = this.p.columns[c];
                var divColumn = $("<div>", { "class": "divGanttLeft-header-group" });

                if (col.text)
                    divColumn.append('<span>' + col.text + '<span>');
                if (col.width)
                    divColumn.css("width", col.width);

                divHeaderLeft.append(divColumn);
            }

            divLeftWrapper.append(divHeaderLeft);
            divLeftWrapper.append(divBodyLeft);
            divLeft.append(divLeftWrapper);
            divLeft.append($("<div>", { "class": "divGantt-splitBar" }));

            //-- RIGHT SIDE
            var divBodyRight = $("<div>", { "class": "divGanttRight-body" });
            var divHeaderMonths = $("<div>");

            for (var m = 0; m < arrayMonths.length; m++) {
                var divMonth = $("<div>", { "class": "divGanttRight-header-group" });
                divMonth.append($("<div>", { "class": "divGanttRight-header-month" }).html('<span>' + this.p.monthsName[arrayMonths[m][1]] + '/' + arrayMonths[m][0] + '</span>'));

                var arrayDays = arrayDates.filter(filterDates, { year: arrayMonths[m][0], month: arrayMonths[m][1] });

                var divDays = $("<div>");
                for (var d = 0; d < arrayDays.length; d++) {
                    var day = arrayDays[d];
                    var divDay = $("<div>", { "class": "divGanttRight-header-day" }).attr("data-ngt-day", day).html('<span>' + day[2] + '</span>');
                    divDays.append(divDay);
                }
                divMonth.append(divDays);
                divHeaderMonths.append(divMonth);
            }

            divRightWrapper.append(divHeaderMonths);
            divRightWrapper.append(divBodyRight);
            divRight.append(divRightWrapper);

            //-- se setar maxHeigth, adiciona scroll
            var divScrollBar = null;
            var divScroll = null;
            if (this.p.maxHeight || this.p.fixed) {
                if (!this.p.fixed) {
                    divBodyLeft.css("maxHeight", parseInt(this.p.maxHeight,10) + 'px');
                    divBodyRight.css("maxHeight", parseInt(this.p.maxHeight,10) + 'px');
                }
                else {
                    divBodyLeft.css("maxHeight", '100%');
                    divBodyRight.css("maxHeight", '100%');
                }

                divScrollBar = $("<div>", { "class": "divGantt-scrollBar" });
                divScroll = $("<div>", { "class": "divGantt-scroll" });
                divScrollBar.append(divScroll);
                divRight.append(divScrollBar);
                divRight.css("paddingRight", "16px");
            }

            divWrapper.append(divLeft);
            divWrapper.append(divRight);

            divBodyLeft.width(getTotalWidth(divLeftWrapper));
            divBodyRight.width(getTotalWidth(divRightWrapper));




            for (var i = 0; i < this.p.sourceList.length; i++) {
                var obj = this.p.sourceList[i];

                //-- Rows
                var divRowLeft = $("<div>", { "class": "divGantt-row" });
                var divRowRight = $("<div>", { "class": "divGantt-row" });

                if (obj.IDProject) {
                    divRowLeft.attr("data-ngt-idP", obj.IDProject);
                    divRowRight.attr("data-ngt-idP", obj.IDProject);
                }
                if (obj.IDSprint) {
                    divRowLeft.attr("data-ngt-idS", obj.IDSprint);
                    divRowRight.attr("data-ngt-idS", obj.IDSprint);
                }
                if (obj.IDTask) {
                    divRowLeft.attr("data-ngt-idT", obj.IDTask);
                    divRowRight.attr("data-ngt-idT", obj.IDTask);
                }



                //-- BODY LEFT --
                //---------------
                for (var c = 0; c < this.p.columns.length; c++) {
                    var col = this.p.columns[c];
                    var column = buildLeftColumns(col, obj);

                    column.addClass("row-type-" + obj.Type);
                    divRowLeft.append(column);
                }
                if (this.p.onLeftItemClick)
                    divRowLeft.bind("click", { obj: obj, row: divRowLeft }, this.p.onLeftItemClick);

                divBodyLeft.append(divRowLeft);


                //-- BODY RIGHT --
                //----------------
                divBodyRight.append(divRowRight);
                //-- loop entre as datas de Start e End
                for (var m = 0; m < arrayMonths.length; m++) {
                    var arrayDays = arrayDates.filter(filterDates, { year: arrayMonths[m][0], month: arrayMonths[m][1] });

                    for (var d = 0; d < arrayDays.length; d++) {
                        var day = arrayDays[d];
                        var divDay = $("<div>", { "class": "divGantt-cell" }).attr("data-ngt-day", day);
                        if (day[3] == 0 || day[3] == 6) {
                            divDay.addClass('weekend');
                        }

                        divRowRight.append(divDay);
                    }
                }




                var dtItemStart = null;
                if (Object.prototype.toString.call(obj.Start) === '[object Date]')
                    dtItemStart = new Date(obj.Start);
                else
                    dtItemStart = new Date((obj.Start + "-" + buildTimeString(dtOffestTimeZone, 0)));


                var dtItemEnd = null;
                if (Object.prototype.toString.call(obj.End) === '[object Date]')
                    dtItemEnd = new Date(obj.End);
                else
                    dtItemEnd = new Date((obj.End + "-" + buildTimeString(dtOffestTimeZone, 0)));

                var dtStart = [dtItemStart.getFullYear(), dtItemStart.getMonth() + 1, dtItemStart.getDate(), dtItemStart.getDay()];
                var divDayStart = $(".divGantt-cell[data-ngt-day='" + dtStart + "']", divRowRight);

                var days = ((dtItemEnd - dtItemStart) / (1000 * 60 * 60 * 24));
                var cellWidth = $(".divGantt-cell")[0].offsetWidth;
                var size = (cellWidth * (days + 1)) - 5;

                switch (obj.Type) {
                    case 1:
                        {
                            var divTimeBar = $("<div>", { "class": "divGantt-timebar" });
                            divTimeBar.css("width", size + "px");
                            divDayStart.append(divTimeBar);
                            break;
                        }
                    case 2:
                        {
                            var divTimeBar = $("<div>", { "class": "divGantt-timebar" });
                            divTimeBar.css("width", size + "px");
                            divDayStart.append(divTimeBar);
                            break;
                        }
                    case 3:
                        {
                            var divBlockBar = $("<div>", { "class": "divGantt-blockbar" });
                            var divBlockBarPercent = $("<div>", { "class": "divGantt-blockbar-perc" });

                            divBlockBar.css("width", size + "px");
                            divBlockBarPercent.css("width", obj.Percent);
                            divBlockBar.append(divBlockBarPercent);
                            divBlockBar.append("<span>" + obj.Percent + "</span>");
                            divDayStart.append(divBlockBar);

                            if (this.p.onRightItemClick)
                                divBlockBar.bind("click", { obj: obj, row: divBlockBar }, this.p.onRightItemClick);
                            break;
                        }
                }
            }


            //-- EVENTS --
            //------------
            if (divScrollBar && divScroll) {
                $(".ninjaGantt").bind('mousewheel DOMMouseScroll', function (e) {
                    var currentScroll = $(".divGanttLeft-body").scrollTop();
                    var scrollBarHeight = $(".divGantt-scrollBar").height() - 40;

                    var totalScroll = 0;
                    var maxScrollL = $(".divGanttLeft-body")[0].scrollHeight - $(".divGanttLeft-body")[0].clientHeight;
                    var maxScrollR = $(".divGanttRight-body")[0].scrollHeight - $(".divGanttRight-body")[0].clientHeight;
                    totalScroll = maxScrollL < maxScrollR ? maxScrollL : maxScrollR;

                    if (!currentScroll)
                        currentScroll = 0;

                    var scrollDown = false;

                    if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
                        scrollDown = true;
                    }

                    scrollTo = 42;
                    if (scrollTo) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (scrollDown)
                            scrollTo = scrollTo * -1;

                        var newScroll = parseInt(currentScroll,10) + scrollTo;
                        newScroll = newScroll < 0 ? 0 : newScroll;
                        newScroll = newScroll >= totalScroll ? totalScroll : newScroll;

                        $(".divGanttLeft-body").scrollTop(newScroll);
                        $(".divGanttRight-body").scrollTop(newScroll);

                        currentScroll = $(".divGanttLeft-body").scrollTop();

                        var perc = Math.ceil(currentScroll * 100 / totalScroll);
                        var newScrollBarTop = Math.ceil((perc * scrollBarHeight) / 100);
                        $(".divGantt-scroll").css("top", newScrollBarTop + 'px');
                    }
                });

                $(".divGantt-scroll").draggable({ containment: ".divGantt-scrollBar", axis: "y", drag: function () {
                    var scrollTop = parseInt($(".divGantt-scroll").css("top"),10);
                    var scrollBarHeight = $(".divGantt-scrollBar").height() - 40;

                    var totalScrollL = $(".divGanttLeft-body")[0].scrollHeight - $(".divGanttLeft-body")[0].clientHeight;
                    var totalScrollR = $(".divGanttRight-body")[0].scrollHeight - $(".divGanttRight-body")[0].clientHeight;
                    var totalScroll = totalScrollL > totalScrollR ? totalScrollR : totalScrollL;

                    var perc = Math.floor(scrollTop * 100 / scrollBarHeight);
                    var newTopPosition = Math.floor((perc * totalScroll) / 100);
                    newTopPosition = newTopPosition > totalScroll ? totalScroll : newTopPosition;

                    $(".divGanttLeft-body").scrollTop(newTopPosition);
                    $(".divGanttRight-body").scrollTop(newTopPosition);
                }
                });
            }

            //-- COLUMNS RESIZE --
            //--------------------
            $(document).bind('mousedown', function (event) {
                _ngt_startX = event.screenX;
                _ngt_startY = event.screenY;
                _ngt_lastX = null;
                _ngt_lastY = null;
                _ngt_selectedDragItem = null;
                _ngt_mouseDown = true;
                _ngt_mouseUp = false;
            }).bind('mouseup', function (event) {
                _ngt_startX = null;
                _ngt_startY = null;
                _ngt_lastX = null;
                _ngt_lastY = null;
                _ngt_selectedDragItem = null;
                _ngt_mouseDown = false;
                _ngt_mouseUp = true;
            }).bind('mousemove', function (event) {
                if (_ngt_mouseDown && !_ngt_mouseUp) {
                    var el = $(event.target);

                    if (_ngt_selectedDragItem == null) {
                        if (el.hasClass("divGantt-splitBar")) {
                            _ngt_selectedDragItem = event.target;
                            _ngt_currentWidth = $(".divGanttLeft").outerWidth(true);
                        }
                        else if (el.hasClass("divGanttLeft-header-group") || el.closest(".divGanttLeft-header-group") != null) {
                            _ngt_selectedDragItem = el.hasClass("divGanttLeft-header-group") ? event.target : el.closest(".divGanttLeft-header-group");
                            _ngt_currentWidth = $(_ngt_selectedDragItem).outerWidth(true);
                        }
                    }


                    if (_ngt_selectedDragItem != null) {
                        _ngt_lastX = event.screenX;
                        var distance = _ngt_lastX - _ngt_startX;

                        if (distance != 0) {
                            var selectedDragItem = $(_ngt_selectedDragItem);
                            var newWidth = _ngt_currentWidth + distance;
                            newWidth = newWidth < 1 ? 1 : newWidth;

                            if (selectedDragItem.hasClass("divGanttLeft-header-group")) {
                                var idx = selectedDragItem.index();

                                selectedDragItem.width(newWidth - 21);

                                $(".divGanttLeft-body .divGantt-row").each(function () {
                                    $($(".divGanttLeft-column", this)[idx]).width(newWidth - 21);
                                });
                            }
                            else if (selectedDragItem.hasClass("divGantt-splitBar")) {
                                var newWidth = _ngt_currentWidth + distance;
                                var totalWidth = $(".ninjaGantt").outerWidth(true);
                                var perc = newWidth * 100 / totalWidth;
                                perc = perc < 2 ? 2 : perc;
                                perc = perc > 98 ? 98 : perc;
                                $(".divGanttLeft").css("width", perc + '%');
                                $(".divGanttRight").css("width", (100 - perc) + '%');
                            }

                            var totalWidth = 0;
                            var leftWidth = $(".divGanttLeft-header").outerWidth(true);
                            $('.divGanttLeft-header-group').each(function () {
                                totalWidth += $(this).outerWidth(true);
                            });
                            $('.divGanttLeft-body').css('width', (totalWidth < leftWidth ? leftWidth : totalWidth));
                        }
                    }
                }
            });


            if (!this.p.fixed) {
                var hL = divBodyLeft.height();
                var hR = divBodyRight.height();
                if (hL > hR) { divBodyRight.height(hL); }
                if (hR > hL) { divBodyLeft.height(hR); }
            }


            if (this.p.onLoad) {
                this.p.onLoad();
            }

        }.bind(_ninjaGantt);

        function getTotalWidth(e) {
            var cw = $(e)[0].clientWidth;
            var sw = $(e)[0].scrollWidth;

            if (cw > sw)
                return cw;
            if (sw > cw)
                return sw;
        }

        function buildTimeString(hora, min) {
            var h = '00000' + hora.toString();
            var m = '00000' + min.toString();
            return h.substr(h.length - 2, 2) + ":" + m.substr(m.length - 2, 2);
        }

        function buildLeftColumns(column, obj) {
            var divColumn = $("<div>", { "class": "divGanttLeft-column" });

            if (column.width) {
                divColumn.css("width", column.width);
            }

            if (column.fieldName) {
                var vl = obj[column.fieldName] ? obj[column.fieldName] : "";
                divColumn.append('<span>' + vl + '<span>');
            }
            else if (column.format) {
                divColumn.append(column.format(obj));
            }

            return divColumn;
        }

        function filterDates(value, index, ar) {
            var m = this.month;
            var y = this.year;

            return value[0] == y && value[1] == m;
        }

        _ninjaGantt.fnBuild();
        $(this).data("ninjaGantt", _ninjaGantt);
    }
} (jQuery));





