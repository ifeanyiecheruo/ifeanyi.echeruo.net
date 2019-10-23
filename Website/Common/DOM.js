var DOM = {
    addCssClass: function (value, newClass) {
        var expr = new RegExp("\\b" + newClass + "\\b");
        value.className = value.className + (expr.test(value.className) ? "" : (" " + newClass));
    },
    removeCssClass: function (value, newClass) {
        var expr = new RegExp("\\b" + newClass + "\\b", "g");
        value.className = value.className.replace(expr, "").trim();
    },
    isVisible: function (name, value) {
        var element = document.getElementById(name);
        if (value) {
            this.removeCssClass(element, "hidden");
        }
        else {
            this.addCssClass(element, "hidden");
        }
    },
    findVerticalScrollOffset: function (element) {
        var curtop = 0;
        if (element["offsetParent"]) {
            do {
                curtop += element["offsetTop"];
            } while (element = element["offsetParent"]);
            return curtop;
        }
    },
};
