const DOM = {
    addCssClass: function (value: HTMLElement, newClass: string): void {
        const expr = new RegExp("\\b" + newClass + "\\b");

        value.className = value.className + (expr.test(value.className) ? "" : (" " + newClass));
    },
    removeCssClass: function (value: HTMLElement, newClass: string): void {
        const expr = new RegExp("\\b" + newClass + "\\b", "g");

        value.className = value.className.replace(expr, "").trim();
    },
    isVisible: function (name: string, value: boolean): void {
        const element = document.getElementById(name);

        if (value) {
            this.removeCssClass(element, "hidden");
        } else {
            this.addCssClass(element, "hidden");
        }
    },
    findVerticalScrollOffset: function(element: Element): number {
        let curtop = 0;

        if (element["offsetParent"]) {
            do {
                curtop += element["offsetTop"];
            } while (element = element["offsetParent"]);

            return curtop;
        }
    },
}
