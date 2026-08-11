(() => {
    "use strict";

    const STORAGE_KEY = "physicsLabAnnotations";
    const CONTENT_SELECTOR = "main";

    let currentColor = "#fff59d";
    let annotations = loadAnnotations();

    // ─────────────────────────────────────────────
    // storage
    // ─────────────────────────────────────────────

    function getPageKey() {
        return window.location.pathname;
    }

    function loadAnnotations() {
        try {
            return JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            ) || {};
        } catch {
            return {};
        }
    }

    function saveAnnotations() {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(annotations)
        );
    }

    function getPageAnnotations() {
        const page = getPageKey();

        if (!annotations[page]) {
            annotations[page] = [];
        }

        return annotations[page];
    }

    // ─────────────────────────────────────────────
    // toolbar
    // ─────────────────────────────────────────────

    function createToolbar() {
        const toolbar = document.createElement("div");

        toolbar.id = "physics-lab-annotation-toolbar";

        toolbar.innerHTML = `
            <button data-action="highlight" title="highlight">
                🖍
            </button>

            <button data-action="note" title="add note">
                📝
            </button>

            <span class="annotation-divider"></span>

            <button
                class="color-button cyan"
                data-color="#a5f3fc"
                title="cyan">
            </button>

            <button
                class="color-button yellow"
                data-color="#fff59d"
                title="yellow">
            </button>

            <button
                class="color-button green"
                data-color="#bbf7d0"
                title="green">
            </button>

            <span class="annotation-divider"></span>

            <button
                data-action="clear"
                title="clear all annotations">
                🗑
            </button>
        `;

        document.body.appendChild(toolbar);

        toolbar.addEventListener("click", event => {
            const button = event.target.closest("button");

            if (!button) return;

            const action = button.dataset.action;
            const color = button.dataset.color;

            if (color) {
                currentColor = color;

                toolbar
                    .querySelectorAll(".color-button")
                    .forEach(button => {
                        button.classList.remove("selected");
                    });

                button.classList.add("selected");

                return;
            }

            if (action === "highlight") {
                highlightSelection();
            }

            if (action === "note") {
                addNote();
            }

            if (action === "clear") {
                clearAnnotations();
            }
        });

        const defaultColor =
            toolbar.querySelector(
                `[data-color="${currentColor}"]`
            );

        if (defaultColor) {
            defaultColor.classList.add("selected");
        }
    }

    // ─────────────────────────────────────────────
    // selection
    // ─────────────────────────────────────────────

    function getSelectionRange() {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            return null;
        }

        const range = selection.getRangeAt(0);

        if (range.collapsed) {
            return null;
        }

        const content =
            document.querySelector(CONTENT_SELECTOR);

        if (
            !content ||
            !content.contains(range.commonAncestorContainer)
        ) {
            return null;
        }

        return range;
    }

    // ─────────────────────────────────────────────
    // highlighting
    // ─────────────────────────────────────────────

    function highlightSelection() {
        const range = getSelectionRange();

        if (!range) return;

        const selectedText = range.toString().trim();

        if (!selectedText) return;

        const span = document.createElement("span");

        span.className = "physics-lab-highlight";
        span.style.backgroundColor = currentColor;
        span.dataset.annotationId = crypto.randomUUID();

        try {
            range.surroundContents(span);
        } catch {
            alert(
                "that selection crosses multiple elements. " +
                "try highlighting a smaller section."
            );

            return;
        }

        getPageAnnotations().push({
            id: span.dataset.annotationId,
            type: "highlight",
            text: selectedText,
            color: currentColor
        });

        saveAnnotations();

        window.getSelection().removeAllRanges();
    }

    // ─────────────────────────────────────────────
    // notes
    // ─────────────────────────────────────────────

    function addNote() {
        const range = getSelectionRange();

        if (!range) return;

        const selectedText = range.toString().trim();

        if (!selectedText) return;

        const note = prompt(
            `add a note for:\n\n"${selectedText}"`
        );

        if (!note || !note.trim()) return;

        const id = crypto.randomUUID();

        const span = document.createElement("span");

        span.className = "physics-lab-note";
        span.dataset.annotationId = id;
        span.title = note.trim();

        try {
            range.surroundContents(span);
        } catch {
            alert(
                "that selection crosses multiple elements. " +
                "try selecting a smaller section."
            );

            return;
        }

        getPageAnnotations().push({
            id,
            type: "note",
            text: selectedText,
            note: note.trim()
        });

        saveAnnotations();

        window.getSelection().removeAllRanges();
    }

    // ─────────────────────────────────────────────
    // clear annotations
    // ─────────────────────────────────────────────

    function clearAnnotations() {
        const page = getPageKey();

        if (
            !annotations[page] ||
            annotations[page].length === 0
        ) {
            return;
        }

        const confirmed = confirm(
            "delete all annotations on this page?"
        );

        if (!confirmed) return;

        delete annotations[page];

        saveAnnotations();

        location.reload();
    }

    // ─────────────────────────────────────────────
    // restore saved annotations
    // ─────────────────────────────────────────────

    function restoreAnnotations() {
        const pageAnnotations =
            getPageAnnotations();

        for (const annotation of pageAnnotations) {
            const found =
                findText(annotation.text);

            if (!found) continue;

            const span =
                document.createElement("span");

            span.dataset.annotationId =
                annotation.id;

            if (annotation.type === "highlight") {
                span.className =
                    "physics-lab-highlight";

                span.style.backgroundColor =
                    annotation.color;
            }

            if (annotation.type === "note") {
                span.className =
                    "physics-lab-note";

                span.title =
                    annotation.note;
            }

            try {
                found.surroundContents(span);
            } catch {
                continue;
            }
        }
    }

    // ─────────────────────────────────────────────
    // find text
    // ─────────────────────────────────────────────

    function findText(text) {
        const content =
            document.querySelector(
                CONTENT_SELECTOR
            );

        if (!content || !text) {
            return null;
        }

        const walker =
            document.createTreeWalker(
                content,
                NodeFilter.SHOW_TEXT
            );

        let node;

        while (node = walker.nextNode()) {
            const index =
                node.nodeValue.indexOf(text);

            if (index !== -1) {
                const range =
                    document.createRange();

                range.setStart(
                    node,
                    index
                );

                range.setEnd(
                    node,
                    index + text.length
                );

                return range;
            }
        }

        return null;
    }

    // ─────────────────────────────────────────────
    // styles
    // ─────────────────────────────────────────────

    function injectStyles() {
        const style =
            document.createElement("style");

        style.textContent = `
            #physics-lab-annotation-toolbar {
                position: fixed;
                bottom: 20px;
                left: 50%;

                transform: translateX(-50%);

                display: flex;
                align-items: center;
                gap: 6px;

                padding: 8px 10px;

                background: white;

                border: 1px solid #ddd;
                border-radius: 12px;

                box-shadow:
                    0 4px 20px
                    rgba(0, 0, 0, 0.15);

                z-index: 999999;

                font-family:
                    system-ui,
                    -apple-system,
                    BlinkMacSystemFont,
                    "Segoe UI",
                    sans-serif;
            }

            #physics-lab-annotation-toolbar
            button {
                width: 34px;
                height: 34px;

                border: none;
                border-radius: 7px;

                background: transparent;

                cursor: pointer;

                font-size: 17px;

                display: flex;
                align-items: center;
                justify-content: center;
            }

            #physics-lab-annotation-toolbar
            button:hover {
                background: #f0f0f0;
            }

            .annotation-divider {
                width: 1px;
                height: 24px;

                background: #ddd;

                margin: 0 3px;
            }

            .color-button {
                border: 2px solid transparent !important;
                position: relative;
            }

            .color-button.cyan {
                background: #a5f3fc !important;
            }

            .color-button.yellow {
                background: #fff59d !important;
            }

            .color-button.green {
                background: #bbf7d0 !important;
            }

            .color-button.selected {
                border-color: #555 !important;
                transform: scale(1.08);
            }

            .physics-lab-highlight {
                border-radius: 2px;
                padding: 1px 0;
            }

            .physics-lab-note {
                border-bottom:
                    2px dotted #777;

                cursor: help;
            }
        `;

        document.head.appendChild(style);
    }

    // ─────────────────────────────────────────────
    // initialize
    // ─────────────────────────────────────────────

    function init() {
        const content =
            document.querySelector(
                CONTENT_SELECTOR
            );

        if (!content) {
            console.warn(
                "physics lab annotations: " +
                "no <main> element found."
            );

            return;
        }

        injectStyles();
        createToolbar();

        setTimeout(
            restoreAnnotations,
            100
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init
        );
    } else {
        init();
    }
})();