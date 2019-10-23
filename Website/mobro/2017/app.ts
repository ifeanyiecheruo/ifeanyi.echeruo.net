interface Mobro2017AppOption {
    uri: string,
    votes: number
}

class Mobro2017Application {
    constructor() {
    }

    private state = {
        selectedItemName: "",
        options: <StringMap<Mobro2017AppOption>>{}
    }

    public refresh(): Thenable {
        return this.getData("api/votes").then(votes => {
            if (!votes) {
                return window["Promise"].reject();
            }

            this.state.options = votes;
            this.onOptionsChanged();
        });
    }

    public getSelectedOption(): Mobro2017AppOption {
        const name = (typeof this.state.selectedItemName === "string") ? this.state.selectedItemName : "";

        return this.state.options[name];
    }

    public selectItem(name: string): void {
        this.state.selectedItemName = name;

        this.onRender();
    }

    public playWithSelected(): void {
        if (!this._game) {
            this._game = new Mobro2017Game(window.document.getElementById("game-face"));
        }

        this._game.start();
    }

    public voteForSelected(): Thenable {
        const selectedOption = this.getSelectedOption();

        if (this._game) {
            this._game.stop();
        }

        if (!selectedOption) {
            return window["Promise"].reject();
        }

        return this.getData("api/vote", "POST", this.state.selectedItemName).then(() => {
            return this.refresh();
        }).then(() => {
            DOM.isVisible("results-container", true);
        });
    }

    private getData(uri: string, method: string = "GET", body?: any): ThenableVR<any, Error> {
        const promise: ThenableVR<FetchResponse, Error> = (<any>window).fetch(
            uri, {
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

        return promise.then<FetchResponse>(response => {
            DOM.isVisible("loading-overlay", false);
            return response;
        }).catch(error => {
            DOM.isVisible("loading-overlay", false);

            const rejection: ThenableVR<FetchResponse, Error> = window["Promise"].reject(error);
            return rejection;
        }).then<any, Error>(response => {
            if (!response.ok) {
                const rejection: Thenable = window["Promise"].reject(new Error("Response failed: HTTP " + response.status + ": " + response.statusText));
                return rejection;
            }

            if (response.status === 204) {
                return response.text().then(() => { });
            }

            DOM.isVisible("content", true);
            return response.json();
        }).catch(error => {
            DOM.isVisible("content", false);
            DOM.isVisible("error-overlay", true);
            return window["Promise"].reject(error);
        });
    }

    private onOptionsChanged = STD.callOnce(() => {
        this.onRender();
    });

    private onRender = STD.callOnce((): void => {
        const pickerOptionsContainer = document.getElementById("picker-container");
        pickerOptionsContainer.innerHTML = this.createPickerHtml();

        const votesContainer = document.getElementById("votes-container");
        votesContainer.innerHTML = this.createVotesHtml();

        const selectedOption = this.getSelectedOption();
        DOM.isVisible("play-container", !!selectedOption);

        const backgroundImage = selectedOption ? "url(" + selectedOption.uri + ")" : "none";
        const previewItem = document.getElementById("preview-item");
        (<HTMLDivElement>previewItem).style["background-image"] = backgroundImage;

        const previewItem2 = document.getElementById("preview-item-2");
        (<HTMLDivElement>previewItem2).style["background-image"] = backgroundImage;
    });

    private createPickerHtml(): string {
        return Object.keys(this.state.options).map((optionName) => {
            const option = this.state.options[optionName];
            const isSelected = this.state.selectedItemName === optionName;
            const _class = (isSelected ? "selected " : "") + "item";
            const onClick = "onItemSelected(this, '" + optionName + "')";
            const style = "background-image: url(" + option.uri + ")";

            return "<a href=\"javascript: void(0)\">" +
                "  <div class=\"" + _class + "\" style=\"" + style + "\" onclick=\"" + onClick + "\"></div>" +
                "</a>";
        }).join("");
    }

    private createVotesHtml(): string {
        var minVote;
        return Object.keys(this.state.options).map((optionName) => {
            const option = this.state.options[optionName];
            const isSelected = this.state.selectedItemName === optionName;

            minVote = (typeof minVote === "undefined") ? option.votes : Math.min(minVote, option.votes);

            return {
                votes: option.votes,
                uri: option.uri
            };
        }).sort((a, b) => {
            return b.votes - a.votes;
        }).filter((value) => {
            return value.votes > 1;
        }).map((value) => {
            const style = "background-image: url(" + value.uri + ")";
            const votes = value.votes - minVote;
            const voteBadge = (votes > 0) ? ("+" + votes) : ".";
            const relFontSize = ((votes > 0) ? "+" : "-") + (votes*4);

            return "" +
                "<div class=\"centered row container\">" +
                "  <div class=\"background item\">" +
                "    <div class=\"item\"  style=\"" + style + "\"></div>" +
                "  </div>" +
                "  <span style=\"font-size: " + relFontSize + "\">" + voteBadge + "</span>" +
                "</div>";
        }).join("");
    }

    private _game: Mobro2017Game;
}

class Mobro2017Game {
    constructor(face: HTMLElement) {
        this._face = face;
    }

    public start() {
        if (!this._peeking) {
            this._canceled = false;
            this._peeking = true;
            this._face.style.display = "none";
            this._face.style.position = "relative";
            this.scheduleNextPeek(2000, 5000);
        }
    }

    public stop() {
        this._canceled = true;
    }

    private scheduleNextPeek(minDelay: number, maxDelay: number) {
        const delay = Mobro2017Game.random(minDelay, maxDelay);
        const nextLeft = Mobro2017Game.random(0, this._face.parentElement.clientWidth - this._face.clientWidth);
        const handle = window.setTimeout(() => {
            if (this._canceled) {
                this._peeking = false;
            } else {
                this.peek(nextLeft, 50, 1000);
            }
        }, delay);
    }

    private peek(left: number, minDurationMs: number, maxDurationMs) {
        this._face.style.display = "initial";
        this._face.style.top = "0px";
        this._face.style.left = left.toString() + "px";

        const callback = (value, cancel) => {
            if (this._canceled) {
                cancel();
                this._peeking = false;
                this._face.style.top = (-this._face.clientHeight).toString() + "px";
            } else {
                this._face.style.top = value.toString() + "px";
            }
        };

        STD.animate(Mobro2017Game.random(minDurationMs, maxDurationMs), 0, -this._face.clientHeight, callback, (canceled) => {
            if (canceled) {
                return;
            }

            STD.animate(Mobro2017Game.random(minDurationMs, maxDurationMs), -this._face.clientHeight, 0, callback, (canceled) => {
                if (canceled) {
                    return;
                }

                this._face.style.display = "none";
                this.scheduleNextPeek(minDurationMs, maxDurationMs);
            });
        });
    }

    private static random(min: number, max: number): number {
        return (Math.random() * Math.abs(max - min)) + Math.min(max, min);
    }

    private _face: HTMLElement;
    private _canceled: boolean;
    private _peeking: boolean;
}