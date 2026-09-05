// Injects a lightweight error/timeout guard into the exported index.html so
// that if the web bundle fails to load or React never mounts, the visitor
// sees a diagnostic message instead of a silent blank white page.
const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "dist", "index.html");
let html = fs.readFileSync(indexPath, "utf8");

const guard = `
    <script>
      (function () {
        function show(msg) {
          var root = document.getElementById("root");
          if (!root) return;
          if (root.dataset.mounted === "1") return;
          root.innerHTML =
            '<div style="padding:24px;font-family:sans-serif">' +
            '<h2 style="margin:0 0 8px">App failed to load</h2>' +
            '<pre style="white-space:pre-wrap;font-size:12px;color:#b91c1c">' +
            msg.replace(/</g, "&lt;") +
            "</pre></div>";
        }
        window.addEventListener("error", function (e) {
          show((e.error && e.error.stack) || e.message || "Unknown script error");
        });
        window.addEventListener("unhandledrejection", function (e) {
          show(
            "Unhandled promise rejection: " +
              ((e.reason && (e.reason.stack || e.reason.message)) || e.reason)
          );
        });
        setTimeout(function () {
          var root = document.getElementById("root");
          if (root && root.children.length === 0) {
            show("App did not render within 8s (root stayed empty). No JS error was caught, so check network requests / bundle path.");
          }
        }, 8000);
      })();
    </script>
`;

html = html.replace("</head>", guard + "  </head>");

// Mark root as mounted once React actually renders something into it, so the
// timeout check above doesn't false-positive after a slow-but-successful mount.
html = html.replace(
  '<div id="root"></div>',
  '<div id="root"></div>\n    <script>new MutationObserver(function(muts){var root=document.getElementById("root");if(root&&root.children.length>0){root.dataset.mounted="1";}}).observe(document.getElementById("root")||document.body,{childList:true,subtree:true});</script>'
);

fs.writeFileSync(indexPath, html);
console.log("Injected diagnostics guard into", indexPath);
