"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/code.ts
  var require_code = __commonJS({
    "src/code.ts"(exports) {
      figma.showUI(__html__, { width: 400, height: 600 });
      figma.ui.onmessage = (msg) => __async(null, null, function* () {
        if (msg.type === "analyze-selection") {
          const selection = figma.currentPage.selection;
          if (selection.length === 0) {
            figma.ui.postMessage({ type: "error", message: "\uBA3C\uC800 \uBD84\uC11D\uD560 \uD504\uB808\uC784\uC774\uB098 \uC694\uC18C\uB97C \uC120\uD0DD\uD574\uC8FC\uC138\uC694." });
            return;
          }
          try {
            const node = selection[0];
            const bytes = yield node.exportAsync({
              format: "PNG",
              constraint: { type: "SCALE", value: 2 }
            });
            const base64 = figma.base64Encode(bytes);
            figma.ui.postMessage({
              type: "image-data",
              base64,
              width: node.width,
              height: node.height,
              nodeId: node.id
            });
          } catch (error) {
            figma.ui.postMessage({ type: "error", message: "\uC774\uBBF8\uC9C0 \uCD94\uCD9C \uC2E4\uD328: " + String(error) });
          }
        }
        if (msg.type === "draw-rects") {
          const { issues, nodeId } = msg;
          const node = figma.getNodeById(nodeId);
          if (node && "x" in node && "y" in node && "children" in node) {
            const nodesToGroup = [];
            for (const issue of issues) {
              if (!issue.coordinates) continue;
              const { x, y, width, height } = issue.coordinates;
              const rect = figma.createRectangle();
              rect.x = node.x + x;
              rect.y = node.y + y;
              rect.resize(width, height);
              rect.fills = [];
              rect.strokes = [{ type: "SOLID", color: { r: 1, g: 0, b: 0 } }];
              rect.strokeWeight = 2;
              rect.name = `ISSUE: ${issue.title}`;
              figma.currentPage.appendChild(rect);
              nodesToGroup.push(rect);
            }
            if (nodesToGroup.length > 0) {
              const group = figma.group(nodesToGroup, figma.currentPage);
              group.name = "AIQC Annotations";
              figma.currentPage.selection = [group];
            }
          }
        }
      });
    }
  });
  require_code();
})();
