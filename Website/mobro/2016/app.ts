interface Mobro2016AppOption {
    uri: string,
    votes: number
}

class Mobro2016Application {
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

    public getSelectedOption(): Mobro2016AppOption {
        const name = (typeof this.state.selectedItemName === "string") ? this.state.selectedItemName : "";

        return this.state.options[name];
    }

    public selectItem(name: string): void {
        this.state.selectedItemName = name;

        if (this.getSelectedOption()) {
            DOM.isVisible("vote-container", true);
        }

        this.onRender();
    }

    public voteForSelected(): Thenable {
        const selectedOption = this.getSelectedOption();

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

            return response.json();
        }).catch(error => {
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
        const previewItem = document.getElementById("preview-item");
        (<HTMLDivElement>previewItem).style["background-image"] = selectedOption ? "url(" + selectedOption.uri + ")" : "none";
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

            return "" +
                "<div>" +
                "  <span>" + voteBadge + "</span>" +
                "  <div class=\"background item\">" +
                "    <div class=\"item\"  style=\"" + style + "\"></div>" +
                "  </div>" +
                "</div>";
        }).join("");
    }
}