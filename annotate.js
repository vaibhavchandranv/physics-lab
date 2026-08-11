(() => {
    "use strict";

    const STORAGE_KEY = "physicsLabAnnotations";
    const CONTENT_SELECTOR = ".content";

    let currentColor = "#fff59d";

    // ─────────────────────────────────────────────
    // wait until the page exists
    // ─────────────────────────────────────────────

    function init() {
        const content = document.querySelector(CONTENT_SELECTOR);

        if (!content) {
            console.error(
                "physics lab annotate.js: .content not found"
            );
            return;
        }

        console.log(
            "physics lab annotate.js: loaded successfully"
        );

        createStyles();
        createToolbar(content);
    }

    // ─────────────────────────────────────────────
    // toolbar
    // ─────────────────────────────────────────────

    function createToolbar(content) {
        const toolbar = document.createElement("div");

        toolbar.id = "physics-lab-annotation-toolbar";

        toolbar.innerHTML = `
            <button id="annotate-highlight" title="highlight">
                🖍
            </button>

            <button id="annotate-note" title="note">
                📝
            </button>

            <span class="annotate-divider"></span>

            <button
                class="annotate-color cyan"
                data-color="#a5f3fc"
                title="cyan">
            </button>

            <button
                class="annotate-color yellow selected"
                data-color="#fff59d"
                title="yellow">
            </button>

            <button
                class="annotate-color green"
                data-color="#bbf7d0"
                title="green">
            </button>

            <span class="annotate-divider"></span>

            <button id="annotate-clear" title="clear annotations">
                🗑
            </button>
        `;

        document.body.appendChild(toolbar);

        // highlight
        document
            .getElementById("annotate-highlight")
            .addEventListener("click", () => {
                highlightSelection(content);
            });

        // note
        document
            .getElementById("annotate-note")
            .addEventListener("click", () => {
                addNote(content);
            });

        // colors
        toolbar
            .querySelectorAll(".annotate-color")
            .forEach(button => {
                button.addEventListener("click", () => {
                    currentColor =
                        button.dataset.color;

                    toolbar
                        .querySelectorAll(
                            ".annotate-color"
                        )
                        .forEach(b =>
                            b.classList.remove(
                                "selected"
                            )
                        );

                    button.classList.add("selected");
                });
            });

        // clear
        document
            .getElementById("annotate-clear")
            .addEventListener("click", clearAnnotations);
    }

    // ─────────────────────────────────────────────
    // get selected text
    // ─────────────────────────────────────────────

    function getSelection(content) {
        const selection = window.getSelection();

        if (
            !selection ||
            selection.rangeCount === 0
        ) {
            return null;
        }

        const range =
            selection.getRangeAt(0);

        if (range.collapsed) {
            return null;
        }

        if (
            !content.contains(
                range.commonAncestorContainer
            )
        ) {
            return null;
        }

        return range;
    }

    // ─────────────────────────────────────────────
    // highlight
    // ─────────────────────────────────────────────

    function highlightSelection(content) {
        const range = getSelection(content);

        if (!range) {
            alert("select some text first.");
            return;
        }

        const text =
            range.toString().trim();

        if (!text) return;

        const id =
            "annotation-" +
            Date.now();

        const span =
            document.createElement("span");

        span.className =
            "physics-lab-highlight";

        span.dataset.annotationId = id;

        span.style.backgroundColor =
            currentColor;

        try {
            range.surroundContents(span);
        } catch {
            alert(
                "that selection crosses multiple elements. " +
                "try selecting text within one paragraph."
            );

            return;
        }

        saveAnnotation({
            id: id,
            type: "highlight",
            text: text,
            color: currentColor
        });

        window.getSelection().removeAllRanges();
    }

    // ─────────────────────────────────────────────
    // notes
    // ─────────────────────────────────────────────

    function addNote(content) {
        const range = getSelection(content);

        if (!range) {
            alert("select some text first.");
            return;
        }

        const text =
            range.toString().trim();

        if (!text) return;

        const note =
            prompt(
                "enter your note:"
            );

        if (!note || !note.trim()) {
            return;
        }

        const id =
            "annotation-" +
            Date.now();

        const span =
            document.createElement("span");

        span.className =
            "physics-lab-note";

        span.dataset.annotationId = id;

        span.title =
            note.trim();

        try {
            range.surroundContents(span);
        } catch {
            alert(
                "that selection crosses multiple elements. " +
                "try selecting text within one paragraph."
            );

            return;
        }

        saveAnnotation({
            id: id,
            type: "note",
            text: text,
            note: note.trim()
        });

        window.getSelection().removeAllRanges();
    }

    // ─────────────────────────────────────────────
    // localStorage
    // ─────────────────────────────────────────────

    function saveAnnotation(annotation) {
        const page =
            window.location.pathname;

        const stored =
            JSON.parse(
                localStorage.getItem(
                    STORAGE_KEY
                ) || "{}"
            );

        if (!stored[page]) {
            stored[page] = [];
        }

        stored[page].push(annotation);

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(stored)
        );

        console.log(
            "annotation saved:",
            annotation
        );
    }

    // ─────────────────────────────────────────────
    // clear
    // ─────────────────────────────────────────────

    function clearAnnotations() {
        const page =
            window.location.pathname;

        localStorage.removeItem(
            STORAGE_KEY
        );

        location.reload();
    }

    // ─────────────────────────────────────────────
    // styles
    // ─────────────────────────────────────────────

    function createStyles() {
        const style =
            document.createElement("style");

        style.textContent = `
            #physics-lab-annotation-toolbar {
                position: fixed;
                left: 50%;
                bottom: 24px;

                transform: translateX(-50%);

                display: flex;
                align-items: center;
                gap: 6px;

                padding: 8px;

                background: white;

                border: 1px solid #d1d5db;
                border-radius: 12px;

                box-shadow:
                    0 8px 30px
                    rgba(0, 0, 0, 0.16);

                z-index: 999999;

                font-family:
                    Inter,
                    system-ui,
                    sans-serif;
            }

            #physics-lab-annotation-toolbar
            button {
                width: 36px;
                height: 36px;

                padding: 0;

                border: 0;
                border-radius: 8px;

                background: transparent;

                cursor: pointer;

                display: flex;
                align-items: center;
                justify-content: center;

                font-size: 17px;
            }

            #physics-lab-annotation-toolbar
            button:hover {
                background: #f1f5f9;
            }

            .annotate-divider {
                width: 1px;
                height: 24px;

                background: #d1d5db;

                margin: 0 3px;
            }

            .annotate-color {
                border: 2px solid transparent !important;
            }

            .annotate-color.cyan {
                background: #a5f3fc !important;
            }

            .annotate-color.yellow {
                background: #fff59d !important;
            }

            .annotate-color.green {
                background: #bbf7d0 !important;
            }

            .annotate-color.selected {
                border-color: #374151 !important;
                transform: scale(1.08);
            }

            .physics-lab-highlight {
                padding: 1px 0;
                border-radius: 2px;
            }

            .physics-lab-note {
                border-bottom:
                    2px dotted #64748b;

                cursor: help;
            }
        `;

        document.head.appendChild(style);
    }

    // ─────────────────────────────────────────────
    // start
    // ─────────────────────────────────────────────

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