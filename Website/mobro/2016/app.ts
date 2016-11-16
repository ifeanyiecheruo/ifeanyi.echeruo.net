interface StringMap<T> {
    [index: string]: T;
}

interface AppOption {
    uri: string;
    votes: number;
}

interface Thenable {
    then(done: () => void, fail?: (error: Error) => void): Thenable;
    then<R>(callback: () => R | Thenable, fail?: (error: Error) => void): ThenableV<R>;
}

interface ThenableV<V> {
    then(callback: (value: V) => void, fail?: (error: Error) => void): Thenable;
    then<R>(callback: (value: V) => R | ThenableV<R>, fail?: (error: Error) => void): ThenableV<R>;
}

interface FetchResponse {
    ok: boolean;
    status: number;
    statusText: string;
    json(): ThenableV<any>;
    text(): ThenableV<any>;
}

interface AppState {
    selectedItemName: string;
    options: StringMap<AppOption>;
}

var theApp: any;

window.onload = () => {
    theApp = createApp();
    theApp.refresh();
};

function createApp() {
    const options: StringMap<AppOption> = {};
    const appState = {
        selectedItemName: "",
        options: options
    };

    function addCssClass(value: HTMLElement, newClass: string): void {
        const expr = new RegExp("\\b" + newClass + "\\b");

        value.className = value.className + (expr.test(value.className) ? "" : (" " + newClass));
    }

    function removeCssClass(value: HTMLElement, newClass: string): void {
        const expr = new RegExp("\\b" + newClass + "\\b", "g");

        value.className = value.className.replace(expr, "").trim();
    }

    function isVisible(name: string, value: boolean): void {
        const element = document.getElementById(name);

        if (value) {
            removeCssClass(element, "hidden");
        } else {
            addCssClass(element, "hidden");
        }
    }

    function getData<R>(uri: string, method: string = "GET", body?: any): ThenableV<R> {
        var promise: ThenableV<FetchResponse> = (<any>window).fetch(
            uri, {
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                method: method,
                body: (typeof body !== "undefined") ? JSON.stringify(body) : undefined
            });

        isVisible("loading-overlay", true);
        isVisible("error-overlay", false);

        return promise.then<FetchResponse>((response) => {
            isVisible("loading-overlay", false);
            return response;
        }, (error) => {
            isVisible("loading-overlay", false);

            const rejection: Thenable = window["Promise"].reject(error);
            return rejection;
        }).then<any>((response) => {
            if (!response.ok) {
                const rejection: Thenable = window["Promise"].reject(new Error("Response failed: HTTP " + response.status + ": " + response.statusText));
                return rejection;
            }

            if (response.status === 204) {
                return response.text().then(() => { });
            }

            return response.json();
        }).then<any>((value) => {
            return value;
        }, (error) => {
            isVisible("error-overlay", true);
        });
    }

    const app = {
        refresh: (): Thenable => {
            return getData<StringMap<AppOption>>("/api/mobro/2016/votes").then((votes) => {
                if (!votes) {
                    return window["Promise"].reject();
                }

                appState.options = votes;
                app.onOptionsChanged();
            });
        },
        getSelectedOption: (): AppOption => {
            const name = (typeof appState.selectedItemName === "string") ? appState.selectedItemName : "";

            return appState.options[name];
        },
        selectItem: (name: string) => {
            appState.selectedItemName = name;

            if (app.getSelectedOption()) {
                isVisible("vote-container", true);
            }

            app.onRender();
        },
        voteForSelected: (): Thenable => {
            const selectedOption = app.getSelectedOption();

            if (!selectedOption) {
                return window["Promise"].reject();
            }

            return getData("/api/mobro/2016/vote", "POST", appState.selectedItemName).then(() => {
                return app.refresh();
            }).then(() => {
                isVisible("results-container", true);
            });
        },
        onOptionsChanged: callOnce(() => {
            app.onRender();
        }),
        onRender: callOnce((): void => {
            const pickerOptionsContainer = document.getElementById("picker-container");
            pickerOptionsContainer.innerHTML = app.createPickerHtml();

            const votesContainer = document.getElementById("votes-container");
            votesContainer.innerHTML = app.createVotesHtml();

            const selectedOption = app.getSelectedOption();
            const previewItem = document.getElementById("preview-item");
            (<HTMLDivElement>previewItem).style["background-image"] = selectedOption ? "url(" + selectedOption.uri + ")" : "none";
        }),
        createPickerHtml: function (): string {
            return Object.keys(appState.options).map((optionName) => {
                const option = appState.options[optionName];
                const isSelected = appState.selectedItemName === optionName;
                const _class = (isSelected ? "selected " : "") + "item";
                const onClick = "onItemSelected(this, '" + optionName + "')";
                const style = "background-image: url(" + option.uri + ")";

                return "<a href=\"javascript: void(0)\">" +
                       "  <div class=\"" + _class + "\" style=\"" + style + "\" onclick=\"" + onClick + "\"></div>" +
                       "</a>";
            }).join("");
        },
        createVotesHtml: function (): string {
            var minVote;
            return Object.keys(appState.options).map((optionName) => {
                const option = appState.options[optionName];
                const isSelected = appState.selectedItemName === optionName;

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

                return "" +
                    "<div>" +
                    "  <span>" + voteBadge + "</span>" +
                    "  <div class=\"background item\">" +
                    "    <div class=\"item\"  style=\"" + style + "\"></div>" +
                    "  </div>" +
                    "</div>";
            }).join("");
        }
    };

    return app;
}

function onItemSelected(elem: HTMLElement, optionName: string): void {
    theApp.selectItem(optionName);
}

function onVoteForSelected(elem: HTMLElement): void {
    theApp.voteForSelected().then(() => {
        const targetOffset = findVerticalScrollOffset(document.getElementById("votes-container"));

        var prevValue = 0;
        animate(1000, 0, targetOffset, (value) => {
            window.scrollBy(0, value - prevValue);
            prevValue = value;
        });
    });
}

function animate(durationMs: number, from: number, to: number, callback: (value: number) => void): void {
    const startTime = Date.now();
    const delta = to - from;

    const handle = setInterval(() => {
        const t = (Date.now() - startTime) / durationMs;

        if (t < 0 || t > 1) {
            clearInterval(handle);
            return;
        }

        callback(from + (delta * t));
    }, 100);
}

//Finds y value of given object
function findVerticalScrollOffset(element: Element): number {
    var curtop = 0;

    if (element["offsetParent"]) {
        do {
            curtop += element["offsetTop"];
        } while (element = element["offsetParent"]);

        return curtop;
    }
}

function callOnce(callback: () => void, ...args: any[]): () => void {
    return callOnceImpl(callback);
}

function callOnceT<T1>(callback: (t1: T1) => void, ...args: any[]): (t1: T1) => void {
    return callOnceImpl(callback);
}

function callOnceImpl(callback: (...args: any[]) => void, ...args: any[]): (...args: any[]) => void {
    var callCount = 0;

    return (args) => {
        callCount++;
        if (callCount > 1) {
            return;
        }
        try {
            callback(args);
        } finally {
            callCount--;
        }
    };
}
