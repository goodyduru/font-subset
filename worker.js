importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.3/full/pyodide.js");

async function loadPyodideandPackages() {
    let pyodide = await loadPyodide();
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    await micropip.install('fonttools');
    await micropip.install('brotli')
    let zipResponse = await fetch("fonts.zip");
    let zipBinary = await zipResponse.arrayBuffer();
    pyodide.unpackArchive(zipBinary, "zip");
    self.pyodide = pyodide;
}

let pyodideReadyPromise = loadPyodideandPackages();

self.onmessage = async (event) => {
    await pyodideReadyPromise;
    const { unicodes, isRegular, isWoff } = event.data;
    self.unicodes = unicodes;
    self.is_regular = isRegular;
    self.is_woff = isWoff;

    await self.pyodide.runPythonAsync(`
        import sys
        from os import listdir
        from fontTools import subset
        from js import unicodes, is_regular, is_woff
        ext = "woff2"
        if not is_woff:
            ext = "ttf"

        args = [
            f"fa-regular-400.{ext}",
            f"--unicodes={unicodes}",
            "--no-layout-closure",
            f"--output-file=./result.{ext}",
        ]
        if is_woff:
            args.append("--flavor=woff2")

        if not is_regular:
            args[0] = f"fa-solid-900.{ext}"

        subset.main(args)

        with open(f"./result.{ext}", "rb") as f:
            font = f.read()
    `);
    let font = pyodide.globals.get('font')
    let fontBuffer = font.toJs();
    self.postMessage({fontBuffer, isRegular, isWoff});
};
