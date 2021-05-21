import { useRef, useEffect, useState, useContext } from 'react';
import EventBus from './Events/EventBus';
import { EVENTS } from './Events/EventBus';
import { saveAs } from 'file-saver';
import Color from './utils/Color';
import Position from './Events/Position';
import Path from './Events/Path';
import DrawEvent from './Events/DrawEvent';
import { DrawEventType } from './Events/DrawEventType';
import EventCache from './Events/EventCache';
import ColorABGR from './utils/ColorABGR';
import FloodFillEvent from './Events/FloodFillEvent';
import Members from './Members';

export default function Board() {
    const canvasRef = useRef(null);
    let isDrawing = false;
    let lineWidth = 10;
    let lineCap: CanvasLineCap = "round";
    let currentColor: Color = new Color(0, 0, 0, 255);
    let selectedColor: Color = new Color(0, 0, 0, 255);
    let isFloodFill: boolean = false;

    useEffect(() => {
        let isControlPressed = false;
        const canvas: HTMLCanvasElement = canvasRef.current!;
        const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
        resize();

        window.onresize = resize;

        let event: DrawEvent | null;
        let path: Path;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            EventCache.pastEvents.forEach((e: DrawEvent) => {
                drawEvent(e);
            })
        }

        const startDrawingMouse = (clickEvent: any) => {
            startDrawing(clickEvent, getMousePositionInCanvas);
        }

        const stopDrawingMouse = (e: any) => {
            stopDrawing();
        }

        function onMoveEventMouse(moveEvent: any) {
            onMoveEvent(moveEvent, getMousePositionInCanvas);
        }

        function startDrawingTouch(touchEvent: TouchEvent) {
            startDrawing(touchEvent, getTouchPositionInCanvas);
        }

        function stopDrawingTouch() {
            stopDrawing();
        }

        function onMoveEventTouch(touchEvent: TouchEvent) {
            onMoveEvent(touchEvent, getTouchPositionInCanvas);
        }

        function startDrawing(e: any, getPosition: (e: any) => { x: number, y: number }) {
            if (isFloodFill) {
                event = new DrawEvent(DrawEventType.FloodFillEvent);
                const startingPixel = getPosition(e);
                let payload = new FloodFillEvent(startingPixel, currentColor);
                event.payload = payload;
                EventCache.addEvent(event);
                floodFill(startingPixel, currentColor);
                sendDrawEvent(event);
                event = null;
                return;
            }

            ctx.lineWidth = lineWidth;
            ctx.lineCap = lineCap;
            ctx.strokeStyle = currentColor.rgbaToString();

            event = new DrawEvent(DrawEventType.DrawEvent);
            path = new Path(lineWidth, lineCap, currentColor);

            isDrawing = true;
            onMoveEvent(e, getPosition);
        }

        function onMoveEvent(e: any, getPosition: (e: any) => { x: number, y: number }) {
            if (!isDrawing) return;

            let position = getPosition(e);

            path.positions.push(position);

            draw(position);
        }

        function stopDrawing() {
            if (event && event !== undefined) {
                Object.assign(event?.payload, path);
                EventCache.addEvent(event);
                sendDrawEvent(event);
                event = null;
            }
            isDrawing = false;
            ctx.beginPath();
        }

        function draw(position: Position) {
            ctx.lineTo(position.x, position.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(position.x, position.y);
        }

        function drawEvent(e: DrawEvent) {
            switch (e.type) {
                case DrawEventType.DrawEvent: {
                    let color = new Color(e.payload.color.r, e.payload.color.g, e.payload.color.b, e.payload.color.a);
                    ctx.lineWidth = e.payload.lineWidth;
                    ctx.lineCap = e.payload.lineCap;
                    ctx.strokeStyle = color.rgbaToString();

                    let positions: Position[] = e.payload.positions;
                    positions.forEach((e: Position) => {
                        draw(e);
                    });

                    ctx.beginPath();
                    break;
                }
                case DrawEventType.FullEraseEvent: {
                    console.log("EraseEvent");
                    clearCanvas();
                    break;
                }
                case DrawEventType.FloodFillEvent: {
                    console.log("FloodFillEvent");
                    floodFill(e.payload.startingPixel, e.payload.fillColor);
                    break;
                }
            }


        }

        function getMousePositionInCanvas(event: any) {
            var rect = canvas.getBoundingClientRect();
            var scaleX = canvas.width / rect.width;
            var scaleY = canvas.height / rect.height;

            return {
                x: (event.clientX - rect.left) * scaleX,
                y: (event.clientY - rect.top) * scaleY
            };
        }

        // https://stackoverflow.com/questions/41993176/determine-touch-position-on-tablets-with-javascript
        function getTouchPositionInCanvas(touchEvent: TouchEvent) {
            var rect = canvas.getBoundingClientRect();
            var scaleX = canvas.width / rect.width;
            var scaleY = canvas.height / rect.height;
            let touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
            return {
                x: (touch.pageX - rect.left) * scaleX,
                y: (touch.pageY - rect.top) * scaleY
            };
        }

        function undoLastAction() {

            if (EventCache.pastEvents.length === 0) return;

            EventCache.rewindEvent();

            clearCanvas();

            EventCache.pastEvents.forEach((e: DrawEvent) => {
                drawEvent(e);
            });

        }

        function doFutureAction() {
            if (EventCache.futureEvents.length === 0) return;

            const event: DrawEvent | undefined = EventCache.travelToEvent();

            if (event === undefined) return;

            drawEvent(event);
        }

        function clearCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Source: https://stackoverflow.com/questions/53077955/how-do-i-do-flood-fill-on-the-html-canvas-in-javascript
        function floodFill(startingPixel: Position, color: Color) {

            function getPixel(pixelData: any, x: number, y: number) {
                if (x < 0 || y < 0 || x >= pixelData.width || y >= pixelData.height) {
                    return -1;
                } else {
                    return pixelData.data[y * pixelData.width + x];
                }
            }


            let x = startingPixel.x;
            let y = startingPixel.y;
            if (x === undefined || y === undefined) return;

            const fillColor = ColorABGR.fromRGBA(color).abgrToDecimalNumber();

            const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

            // make a Uint32Array view on the pixels so we can manipulate pixels
            // one 32bit value at a time instead of as 4 bytes per pixel
            const pixelData = {
                width: imageData.width,
                height: imageData.height,
                data: new Uint32Array(imageData.data.buffer),
            };

            // get the color we're filling
            const targetColor = getPixel(pixelData, x, y);

            // check we are actually filling a different color
            if (targetColor !== fillColor) {

                const pixelsToCheck = [x, y];
                while (pixelsToCheck.length > 0) {
                    const y = pixelsToCheck.pop();
                    const x = pixelsToCheck.pop();

                    const currentColor = getPixel(pixelData, x!, y!);
                    if (currentColor === targetColor) {
                        pixelData.data[y! * pixelData.width + x!] = fillColor;
                        pixelsToCheck.push(x! + 1, y!);
                        pixelsToCheck.push(x! - 1, y!);
                        pixelsToCheck.push(x!, y! + 1);
                        pixelsToCheck.push(x!, y! - 1);
                    }
                }

                // put the data back
                ctx.putImageData(imageData, 0, 0);
            }
        }

        // I would use the react context verison of his function directly
        // However, the inclusion of useContext() in this file causes some very strange bugs
        // Like canvas resetting and invoking floodFill() too much
        // For this reason, im using the EventBus to communicate
        function sendDrawEvent(drawEvent: DrawEvent) {
            EventBus.dispatchEvent(EVENTS.SEND_DRAW_EVENT_REQUEST, drawEvent);
        }

        canvas.addEventListener("onresize", resize)
        canvas.addEventListener("mousedown", startDrawingMouse);
        canvas.addEventListener("mouseup", stopDrawingMouse);
        canvas.addEventListener("mousemove", onMoveEventMouse);
        canvas.addEventListener("mouseout", stopDrawingMouse);
        canvas.addEventListener("touchstart", startDrawingTouch);
        canvas.addEventListener("touchend", stopDrawingTouch);
        canvas.addEventListener("touchmove", onMoveEventTouch);

        document.addEventListener('keydown', (e) => {
            if (e.code === "KeyZ" && isControlPressed) {
                undoLastAction();
            }

            if (e.code === "KeyY" && isControlPressed) {
                doFutureAction();
            }

            isControlPressed = e.code === "ControlLeft"
        });


        function saveCanvasToUserDevice() {
            canvas.toBlob(function (blob: Blob | null) {
                if (blob === null) {
                    window.alert("We encountered an error while downloading. Please try again.");
                    return;
                }
                saveAs(blob, "simplydraw.png");
            });
        }

        EventBus.subscribe(EVENTS.CANVAS_DOWNLOAD_REQUEST, saveCanvasToUserDevice);
        EventBus.subscribe(EVENTS.DRAWING_COLOR_CHANGE_REQUEST, (newColor: Color) => {
            selectedColor = newColor;
            currentColor = selectedColor;
        });
        EventBus.subscribe(EVENTS.LINE_WIDTH_CHANGE_REQUEST, (newValue: number) => {
            lineWidth = newValue;
        });
        EventBus.subscribe(EVENTS.LINE_CAP_CHANGE_REQUEST, (newValue: CanvasLineCap) => {
            lineCap = newValue;
        });
        EventBus.subscribe(EVENTS.ACTIVATE_ERASER_REQUEST, () => {
            currentColor = new Color(255, 255, 255, 1);
        });
        EventBus.subscribe(EVENTS.DISABLE_ERASER_REQUEST, () => {
            currentColor = selectedColor;
        });
        EventBus.subscribe(EVENTS.FULL_ERASE_REQUEST, () => {
            let event = new DrawEvent(DrawEventType.FullEraseEvent);
            EventCache.addEvent(event);
            sendDrawEvent(event);
            clearCanvas();
        });
        EventBus.subscribe(EVENTS.UNDO_LAST_ACTION_REQUEST, () => {
            undoLastAction();
        });
        EventBus.subscribe(EVENTS.REDO_FUTURE_ACTION_REQUEST, () => {
            doFutureAction();
        });
        EventBus.subscribe(EVENTS.FLOOD_FILL_ACTIVATE_REQUEST, () => {
            isFloodFill = true;
        });
        EventBus.subscribe(EVENTS.FLOOD_FILL_DISABLE_REQUEST, () => {
            isFloodFill = false;
        });
        EventBus.subscribe(EVENTS.JOINED_ROOM, () => {
            clearCanvas();
        });
        EventBus.subscribe(EVENTS.EVENT_CACHE_SYNC, (newCache: typeof EventCache) => {
            EventCache.set(newCache);

            EventCache.pastEvents.forEach((e: DrawEvent) => {
                drawEvent(e);
            });
        })
        EventBus.subscribe(EVENTS.DRAW_EVENT, (e: DrawEvent) => {
            EventCache.addEvent(e);
            drawEvent(e);
        });
        EventBus.subscribe(EVENTS.REMOTE_REDO_REQUEST, () => {
            doFutureAction();
        });
        EventBus.subscribe(EVENTS.REMOTE_UNDO_REQUEST, () => {
            undoLastAction();
        })
    });

    return (
        <div>
            <Members></Members>
            <canvas ref={canvasRef} className=""></canvas>
        </div>
    );
}