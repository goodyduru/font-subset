class App {
    constructor() {
        this.myWorker = null;
    }

    init() {
        this.allIconContainer = document.getElementById("all-icons");
        this.selectedIconContainer = document.getElementById("selected-icons");
        this.searchBox = document.getElementById("search-icons");
        this.extractBtn = document.getElementById("extract-fonts");
        this.blobUrl = null;
        this.addEventListeners();
        this.installfonttools();
        this.renderAll();
    }

    async installfonttools() {
        if ( window.Worker) {
            this.myWorker = new Worker("worker.js");
            let createDownloadLink = this.createDownloadLink.bind(this);
            this.myWorker.onmessage = function(e) {
                let {fontBuffer, isRegular, isWoff} = e.data;
                createDownloadLink(fontBuffer, isRegular, isWoff);
            }
        }
    }

    addEventListeners() {
        const selectElement = document.getElementById("icon-names");
        const solidElement = document.getElementById("solid-radio");
        const regularElement = document.getElementById("regular-radio");
        const ttfElement = document.getElementById("ttf-radio");

        [solidElement, regularElement].forEach((el) => {el.addEventListener("change", (e) => {
            let text = "Regular Icons";
            let isRegular = true;
            if ( solidElement.checked ) {
                text = "Solid Icons";
                isRegular = false;
            }
            this.searchBox.setAttribute("placeholder", `Search ${text}`);
            document.querySelector("section:nth-of-type(2) h2").innerHTML = `All ${text}`;
            this.selectedIconContainer.innerHTML = "<p>Your selected icons will appear here</p>";
            this.renderAll(isRegular);
        })});

        this.searchBox.addEventListener("input", (e) => {
            const text = e.target.value.trim();
            this.allIconContainer.replaceChildren();
            if ( text.length == 0 ) {
                this.renderChildren();
                return;
            }
            this.renderChildren(text);
        })

        this.extractBtn.addEventListener("click", (e) => {
            e.preventDefault();
            let unicodes = [];
            for ( let icon of this.allIcons ) {
                if ( icon.added == true ) {
                    unicodes.push(icon.code);
                }
            }
            if ( unicodes.length == 0 ) {
                return;
            }
            document.getElementById("result-link").innerHTML = "";
            this.extractBtn.setAttribute('disabled', 'disabled');
            this.extractBtn.textContent = "Extracting";
            let isRegular = true;
            if ( solidElement.checked ) {
                isRegular = false;
            }
            let isWoff = true;
            if ( ttfElement.checked ) {
                isWoff = false;
            }
            unicodes.sort();
            unicodes = unicodes.join(",");
            this.myWorker.postMessage({unicodes, isRegular, isWoff});
        });
    }

    htmlToNode(html) {
        const template = document.createElement('template');
        template.innerHTML = html;
        return template.content.firstChild;
    }

    renderAll(isRegular) {
        if ( isRegular == undefined || isRegular == null || isRegular ) {
            this.allIcons = [...REGULAR];
            this.allIconContainer.classList.remove('solid');
            this.selectedIconContainer.classList.remove('solid');
        } else {
            this.allIcons = [...SOLID];
            this.allIconContainer.classList.add('solid');
            this.selectedIconContainer.classList.add('solid')
        }
        this.allIconContainer.replaceChildren();
        this.renderChildren();
    }

    renderChildren(searchText) {
        for ( let icon of this.allIcons ) {
            if ( icon.added == true || (searchText != undefined && !icon.name.startsWith(searchText)) ) {
                continue;
            }
            let html = `<div class="tag"><i class="fa fa-${icon.name}"></i><span>${icon.name}</span></div>`;
            let node = this.htmlToNode(html);
            let button = this.htmlToNode(`<button class="action" aria-label="${icon.name}"></button>`);
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.clickHandler(icon, node);
            });
            node.append(button);
            this.allIconContainer.append(node);
        }
    }

    clickHandler(icon, node) {
        node.remove();
        if ( icon.added == true ) {
            icon.added = false;
            let text = this.searchBox.value.trim();
            if ( icon.name.startsWith(text) ) {
                this.allIconContainer.append(node);
            }
            if ( this.selectedIconContainer.childNodes.length == 0 ) {
                this.selectedIconContainer.innerHTML = "<p>Your selected icons will appear here</p>";
            }
        } else {
            icon.added = true;
            if ( this.selectedIconContainer.firstChild.tagName == "P" ) {
                this.selectedIconContainer.replaceChildren();
            }
            this.selectedIconContainer.append(node);
        }
    }

    createDownloadLink(font, isRegular, isWoff) {
        let font_type = "font/woff2";
        let ext = "woff2";
        if ( !isWoff ) {
            font_type = "font/ttf";
            ext = "ttf";
        }
        if ( this.blobUrl != null ) {
            window.URL.revokeObjectURL(this.blobUrl);
        }
        let blob = new Blob([font], {type: font_type});
        let url = window.URL.createObjectURL(blob);
        let filename = `fa-regular-subset-400.${ext}`;
        if ( !isRegular ) {
            filename = `fa-solid-subset-900.${ext}`;
        }
        document.getElementById("result-link").innerHTML = `<a href=${url} download=${filename}>Download Subset</a>`;
        this.extractBtn.removeAttribute('disabled');
        this.extractBtn.textContent = "Extract Icons As Fonts";
        this.blobUrl = url;
    }
}

const app = new App();
document.addEventListener("DOMContentLoaded", (e) => {app.init();}, false);