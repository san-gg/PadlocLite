module.exports = function (ctx) {
    if (ctx.opts.plugin.id === "cordova-plugin-file") {
        let found = 0;
        try {
            ctx.opts.plugin.pluginInfo._et._root._children.every((el) => {
                const targetVal =
                    el.attrib.name === "File"
                        ? "window.CordovaFile"
                        : el.attrib.name === "FileReader"
                        ? "window.CordovaFileReader"
                        : null;
                if (targetVal) {
                    el._children.forEach((att) => {
                        if (att.tag === "clobbers") {
                            att.attrib.target = targetVal;
                        }
                    });
                    found += 1;
                }
                if (found === 2) return false;
                return true;
            });
        } catch (e) {
            console.log("---------------Hook Exception---------------");
            console.log(e);
        }
    }
};
