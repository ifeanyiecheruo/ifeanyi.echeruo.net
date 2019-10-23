var Mobro2017Application = (function () {
    function Mobro2017Application() {
        var _this = this;
        this.state = {
            selectedItemName: "",
            options: {}
        };
        this.onOptionsChanged = STD.callOnce(function () {
            _this.onRender();
        });
        this.onRender = STD.callOnce(function () {
            var pickerOptionsContainer = document.getElementById("picker-container");
            pickerOptionsContainer.innerHTML = _this.createPickerHtml();
            var votesContainer = document.getElementById("votes-container");
            votesContainer.innerHTML = _this.createVotesHtml();
            var selectedOption = _this.getSelectedOption();
            DOM.isVisible("play-container", !!selectedOption);
            var backgroundImage = selectedOption ? "url(" + selectedOption.uri + ")" : "none";
            var previewItem = document.getElementById("preview-item");
            previewItem.style["background-image"] = backgroundImage;
            var previewItem2 = document.getElementById("preview-item-2");
            previewItem2.style["background-image"] = backgroundImage;
        });
    }
    Mobro2017Application.prototype.refresh = function () {
        var _this = this;
        return this.getData("api/votes").then(function (votes) {
            if (!votes) {
                return window["Promise"].reject();
            }
            _this.state.options = votes;
            _this.onOptionsChanged();
        });
    };
    Mobro2017Application.prototype.getSelectedOption = function () {
        var name = (typeof this.state.selectedItemName === "string") ? this.state.selectedItemName : "";
        return this.state.options[name];
    };
    Mobro2017Application.prototype.selectItem = function (name) {
        this.state.selectedItemName = name;
        this.onRender();
    };
    Mobro2017Application.prototype.playWithSelected = function () {
        if (!this._game) {
            this._game = new Mobro2017Game(window.document.getElementById("game-face"));
        }
        this._game.start();
    };
    Mobro2017Application.prototype.voteForSelected = function () {
        var _this = this;
        var selectedOption = this.getSelectedOption();
        if (this._game) {
            this._game.stop();
        }
        if (!selectedOption) {
            return window["Promise"].reject();
        }
        return this.getData("api/vote", "POST", this.state.selectedItemName).then(function () {
            return _this.refresh();
        }).then(function () {
            DOM.isVisible("results-container", true);
        });
    };
    Mobro2017Application.prototype.getData = function (uri, method, body) {
        if (method === void 0) { method = "GET"; }
        var promise = window.fetch(uri, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            method: method,
            body: (typeof body !== "undefined") ? JSON.stringify(body) : undefined
        });
        DOM.isVisible("loading-overlay", true);
        DOM.isVisible("error-overlay", false);
        return promise.then(function (response) {
            DOM.isVisible("loading-overlay", false);
            return response;
        }).catch(function (error) {
            DOM.isVisible("loading-overlay", false);
            var rejection = window["Promise"].reject(error);
            return rejection;
        }).then(function (response) {
            if (!response.ok) {
                var rejection = window["Promise"].reject(new Error("Response failed: HTTP " + response.status + ": " + response.statusText));
                return rejection;
            }
            if (response.status === 204) {
                return response.text().then(function () { });
            }
            DOM.isVisible("content", true);
            return response.json();
        }).catch(function (error) {
            DOM.isVisible("content", false);
            DOM.isVisible("error-overlay", true);
            return window["Promise"].reject(error);
        });
    };
    Mobro2017Application.prototype.createPickerHtml = function () {
        var _this = this;
        return Object.keys(this.state.options).map(function (optionName) {
            var option = _this.state.options[optionName];
            var isSelected = _this.state.selectedItemName === optionName;
            var _class = (isSelected ? "selected " : "") + "item";
            var onClick = "onItemSelected(this, '" + optionName + "')";
            var style = "background-image: url(" + option.uri + ")";
            return "<a href=\"javascript: void(0)\">" +
                "  <div class=\"" + _class + "\" style=\"" + style + "\" onclick=\"" + onClick + "\"></div>" +
                "</a>";
        }).join("");
    };
    Mobro2017Application.prototype.createVotesHtml = function () {
        var _this = this;
        var minVote;
        return Object.keys(this.state.options).map(function (optionName) {
            var option = _this.state.options[optionName];
            var isSelected = _this.state.selectedItemName === optionName;
            minVote = (typeof minVote === "undefined") ? option.votes : Math.min(minVote, option.votes);
            return {
                votes: option.votes,
                uri: option.uri
            };
        }).sort(function (a, b) {
            return b.votes - a.votes;
        }).filter(function (value) {
            return value.votes > 1;
        }).map(function (value) {
            var style = "background-image: url(" + value.uri + ")";
            var votes = value.votes - minVote;
            var voteBadge = (votes > 0) ? ("+" + votes) : ".";
            var relFontSize = ((votes > 0) ? "+" : "-") + (votes * 4);
            return "" +
                "<div class=\"centered row container\">" +
                "  <div class=\"background item\">" +
                "    <div class=\"item\"  style=\"" + style + "\"></div>" +
                "  </div>" +
                "  <span style=\"font-size: " + relFontSize + "\">" + voteBadge + "</span>" +
                "</div>";
        }).join("");
    };
    return Mobro2017Application;
}());
var Mobro2017Game = (function () {
    function Mobro2017Game(face) {
        this._face = face;
    }
    Mobro2017Game.prototype.start = function () {
        if (!this._peeking) {
            this._canceled = false;
            this._peeking = true;
            this._face.style.display = "none";
            this._face.style.position = "relative";
            this.scheduleNextPeek(2000, 5000);
        }
    };
    Mobro2017Game.prototype.stop = function () {
        this._canceled = true;
    };
    Mobro2017Game.prototype.scheduleNextPeek = function (minDelay, maxDelay) {
        var _this = this;
        var delay = Mobro2017Game.random(minDelay, maxDelay);
        var nextLeft = Mobro2017Game.random(0, this._face.parentElement.clientWidth - this._face.clientWidth);
        var handle = window.setTimeout(function () {
            if (_this._canceled) {
                _this._peeking = false;
            }
            else {
                _this.peek(nextLeft, 50, 1000);
            }
        }, delay);
    };
    Mobro2017Game.prototype.peek = function (left, minDurationMs, maxDurationMs) {
        var _this = this;
        this._face.style.display = "initial";
        this._face.style.top = "0px";
        this._face.style.left = left.toString() + "px";
        var callback = function (value, cancel) {
            if (_this._canceled) {
                cancel();
                _this._peeking = false;
                _this._face.style.top = (-_this._face.clientHeight).toString() + "px";
            }
            else {
                _this._face.style.top = value.toString() + "px";
            }
        };
        STD.animate(Mobro2017Game.random(minDurationMs, maxDurationMs), 0, -this._face.clientHeight, callback, function (canceled) {
            if (canceled) {
                return;
            }
            STD.animate(Mobro2017Game.random(minDurationMs, maxDurationMs), -_this._face.clientHeight, 0, callback, function (canceled) {
                if (canceled) {
                    return;
                }
                _this._face.style.display = "none";
                _this.scheduleNextPeek(minDurationMs, maxDurationMs);
            });
        });
    };
    Mobro2017Game.random = function (min, max) {
        return (Math.random() * Math.abs(max - min)) + Math.min(max, min);
    };
    return Mobro2017Game;
}());
