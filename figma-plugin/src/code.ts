/// <reference types="@figma/plugin-typings" />

figma.showUI(__html__, { width: 400, height: 600 });

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'analyze-selection') {
        const selection = figma.currentPage.selection;

        if (selection.length === 0) {
            figma.ui.postMessage({ type: 'error', message: '먼저 분석할 프레임이나 요소를 선택해주세요.' });
            return;
        }

        try {
            const node = selection[0];
            // 1. Export as Image (PNG)
            const bytes = await node.exportAsync({
                format: 'PNG',
                constraint: { type: 'SCALE', value: 2 },
            });

            // 2. Convert to Base64 (Sandboxed environment hack)
            const base64 = figma.base64Encode(bytes);

            // 3. Send to UI (Network requests must happen in UI)
            figma.ui.postMessage({
                type: 'image-data',
                base64: base64,
                width: node.width,
                height: node.height,
                nodeId: node.id
            });

        } catch (error) {
            figma.ui.postMessage({ type: 'error', message: '이미지 추출 실패: ' + String(error) });
        }
    }

    if (msg.type === 'draw-rects') {
        const { issues, nodeId } = msg;
        const node = figma.getNodeById(nodeId);

        if (node && 'x' in node && 'y' in node && 'children' in node) {
            // Create a new Page or Frame for annotations? No, just overlay on top or inside.
            // Let's create a Group for annotations
            const nodesToGroup: SceneNode[] = [];

            for (const issue of issues) {
                if (!issue.coordinates) continue;
                const { x, y, width, height } = issue.coordinates;

                // 좌표 변환 (Relative to Node -> Absolute or Node-Relative)
                // AI returns percent-based or image-relative coordinates.
                // Assuming the API returns px relative to the image size sent.

                // Draw Rect
                const rect = figma.createRectangle();
                rect.x = node.x + x;
                rect.y = node.y + y;
                rect.resize(width, height);
                rect.fills = []; // Transparent fill
                rect.strokes = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]; // Red stroke
                rect.strokeWeight = 2;
                rect.name = `ISSUE: ${issue.title}`;

                figma.currentPage.appendChild(rect);
                nodesToGroup.push(rect);
            }

            if (nodesToGroup.length > 0) {
                const group = figma.group(nodesToGroup, figma.currentPage);
                group.name = 'AIQC Annotations';
                figma.currentPage.selection = [group];
            }
        }
    }
};
