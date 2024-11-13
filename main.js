let fontAwesomeObjs = null;
let myWorker = null;

function init() {
    addEventListeners();
    installfonttools();
}

async function installfonttools() {
    if ( window.Worker) {
        myWorker = new Worker("worker.js");
        myWorker.onmessage = function(e) {
            let {fontBuffer, isRegular, isWoff} = e.data;
            createDownloadLink(fontBuffer, isRegular, isWoff);
        }
    }
}

function addEventListeners() {
    const inputElement = document.getElementById("css-file");
    const selectElement = document.getElementById("icon-names");
    const solidElement = document.getElementById("solid-radio");
    const ttfElement = document.getElementById("ttf-radio")
    const dropZoneElement = inputElement.parentElement;
    inputElement.addEventListener("change", (e) => {
        if (inputElement.files.length == 0) {
            console.log("Nothing");
            return;
        }
        printUrlAndContent(inputElement.files[0]);
    });

    dropZoneElement.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZoneElement.classList.add("drop-over");
    });

    ["dragleave", "dragend"].forEach((event) => {
        dropZoneElement.addEventListener(event, (e) => {
            dropZoneElement.classList.remove("drop-over");
        });
    });

    dropZoneElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if ( e.dataTransfer.files.length) {
            inputElement.files = e.dataTransfer.files;
            printUrlAndContent(e.dataTransfer.files[0]);
        }
        dropZoneElement.classList.remove("drop-over");
    });

    document.getElementById("extract-fonts").addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("result-link").innerHTML = "";
        let selected = [];
        for ( let option of selectElement.options ) {
            if ( option.selected ) {
                selected.push(parseInt(option.value));
            }
        }
        let isRegular = true;
        if ( solidElement.checked ) {
            isRegular = false;
        }
        let isWoff = true;
        if ( ttfElement.checked ) {
            isWoff = false;
        }
        extractFont(selected, isRegular, isWoff);
    })
}

async function printUrlAndContent(file) {
    if ( file.type != "text/css" ) {
        return;
    }
    const fileContent = await file.text();
    const sheet = getStyleSheet(fileContent);
    fontAwesomeObjs = getFontAwesomeObjs(sheet.cssRules);
    if ( fontAwesomeObjs.length == 0 ) {
        return;
    }
    const formElem = document.querySelector("section form");
    const selectElem = document.getElementById("icon-names");
    const options = fontAwesomeObjs.map((icon, index) => {
        return `<option value="${index}" selected>${icon.name}</option>`;
    });
    selectElem.innerHTML = options.join("");
    formElem.style.display = "block";
}

function getStyleSheet(text) {
    const iframe = document.createElement("iframe");
    document.head.appendChild(iframe);
    const style = iframe.contentDocument.createElement("style");
    style.textContent = text;
    iframe.contentDocument.head.appendChild(style);
    const styleSheet = iframe.contentDocument.styleSheets[0];
    iframe.remove();
    return styleSheet;
}

function getFontAwesomeObjs(cssRules) {
    let result = [];
    for ( rule of cssRules ) {
        if ( rule.selectorText == null || rule.selectorText == undefined ) {
            continue;
        }
        if ( rule.style.content == "" ) {
            continue;
        }
        let selectors = rule.selectorText.split(",");
        for ( let selector of selectors ) {
            selector = selector.trim();
            if ( selector.startsWith(".fa-") && selector.endsWith("::before") ) {
                let icon = selector.substring(4, selector.length - 8);
                result.push({'name': icon, 'code': rule.style.content});
                break;
            }
        }
    }
    return result;
}

function extractFont(indexes, isRegular, isWoff) {
    unicodes = [];
    for ( let index of indexes ) {
        let code = fontAwesomeObjs[index].code
        if ( code.length != 3 ) {
            continue;
        }
        let c = code.codePointAt(1)
        unicodes.push(c);
    }
    unicodes.sort((a, b) => a - b);
    unicodes = unicodes.map((c) => c.toString(16)).join(",");
    myWorker.postMessage({unicodes, isRegular, isWoff});
}

function createDownloadLink(font, isRegular, isWoff) {
    let font_type = "font/woff2";
    let ext = "woff2";
    if ( !isWoff ) {
        font_type = "font/ttf";
        ext = "ttf";
    }
    let blob = new Blob([font], {type: font_type});
    let url = window.URL.createObjectURL(blob);
    let filename = `fa-regular-subset-400.${ext}`;
    if ( !isRegular ) {
        filename = `fa-solid-subset-900.${ext}`;
    }
    document.getElementById("result-link").innerHTML = `<a href=${url} download=${filename}>Download Subset</a>`;
}