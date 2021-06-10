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
import { useTranslation } from 'react-i18next';
import { NetworkContext } from './NetworkContext';
import { Fade } from 'react-awesome-reveal';
import { VALID_VALUES } from './utils/ValidValues';

export default function Board() {
    const canvasRef = useRef(null);
    const boardRef = useRef<HTMLDivElement>(null);
    const EVENT_BUS_KEY = "BOARD";
    const [isMuted, setIsMuted] = useState(false);
    const [t] = useTranslation("common");
    const { sendDrawEvent, resize }: any = useContext(NetworkContext);

    useEffect(() => {
        let isDrawing = false;
        let lineWidth = 10;
        let lineCap: CanvasLineCap = "round";
        let currentColor: Color = new Color(0, 0, 0, 255);
        let selectedColor: Color = new Color(0, 0, 0, 255);
        let isFloodFill: boolean = false;
        let isControlPressed = false;
        const canvas: HTMLCanvasElement = canvasRef.current!;
        const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
        const EVENT_LISTENERS = new Map<string, any>();
        EVENT_LISTENERS.set("onresize", onResize)
        EVENT_LISTENERS.set("mousedown", startDrawingMouse);
        EVENT_LISTENERS.set("mouseup", stopDrawingMouse);
        EVENT_LISTENERS.set("mousemove", onMoveEventMouse);
        EVENT_LISTENERS.set("mouseout", stopDrawingMouse);
        EVENT_LISTENERS.set("touchstart", startDrawingTouch);
        EVENT_LISTENERS.set("touchend", stopDrawingTouch);
        EVENT_LISTENERS.set("touchmove", onMoveEventTouch);

        onResize();

        window.onresize = onResize;

        let event: DrawEvent | null;
        let path: Path;

        function onResize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            let ratio = canvas.width / canvas.height;

            resize(ratio);

            EventCache.pastEvents.forEach((e: DrawEvent) => {
                drawEvent(e);
            })
        }

        function startDrawingMouse(clickEvent: any) {
            startDrawing(clickEvent, getMousePositionInCanvas);
        }

        function stopDrawingMouse(e: any) {
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
                    clearCanvas();
                    break;
                }
                case DrawEventType.FloodFillEvent: {
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

            // convert fillColor from RGBA to ABGR and from signed to unsigned value to ensure the equality check works 
            // and its type matches the target color
            const fillColor = ColorABGR.fromRGBA(color).abgrToDecimalNumber() >>> 0;

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

        function onKeyEvent(e: KeyboardEvent) {
            if (e.code === "KeyZ" && isControlPressed) {
                undoLastAction();
            }

            if (e.code === "KeyY" && isControlPressed) {
                doFutureAction();
            }

            isControlPressed = e.code === "ControlLeft";
        }

        registerDrawingListeners();

        function registerDrawingListeners() {
            for (let [event, callback] of EVENT_LISTENERS) {
                canvas.addEventListener(event, callback);
            }

            document.addEventListener('keydown', onKeyEvent);

            EventBus.subscribe(EVENTS.FULL_ERASE_REQUEST, () => {
                let event = new DrawEvent(DrawEventType.FullEraseEvent);
                EventCache.addEvent(event);
                sendDrawEvent(event);
                clearCanvas();
            }, EVENT_BUS_KEY);
            EventBus.subscribe(EVENTS.UNDO_LAST_ACTION_REQUEST, () => {
                undoLastAction();
            }, EVENT_BUS_KEY);
            EventBus.subscribe(EVENTS.REDO_FUTURE_ACTION_REQUEST, () => {
                doFutureAction();
            }, EVENT_BUS_KEY);

            EventBus.subscribe(EVENTS.JOINED_ROOM, () => {
                clearCanvas();
            }, EVENT_BUS_KEY);
        }

        function removeDrawingListeners() {
            for (let [event, callback] of EVENT_LISTENERS) {
                canvas.removeEventListener(event, callback);
            }

            document.removeEventListener('keydown', onKeyEvent);
            document.removeEventListener('keydown', sendMuteErrorOnUndoOrRedo);

            EventBus.unsubscribeAll(EVENT_BUS_KEY);
        }

        function sendMuteError() {
            EventBus.dispatchEvent(EVENTS.ERROR, new Error(t("error.muted.draw")));
        }

        function sendMuteErrorOnUndoOrRedo(e: KeyboardEvent) {
            if ((e.code === "KeyZ" || e.code === "KeyY") && isControlPressed) {
                sendMuteError();
            }

            isControlPressed = e.code === "ControlLeft";
        }

        function registerErrors() {

            document.addEventListener('keydown', sendMuteErrorOnUndoOrRedo);

            EventBus.subscribe(EVENTS.FULL_ERASE_REQUEST, sendMuteError, EVENT_BUS_KEY);
            EventBus.subscribe(EVENTS.UNDO_LAST_ACTION_REQUEST, sendMuteError, EVENT_BUS_KEY);
            EventBus.subscribe(EVENTS.REDO_FUTURE_ACTION_REQUEST, sendMuteError, EVENT_BUS_KEY);
            EventBus.subscribe(EVENTS.JOINED_ROOM, sendMuteError, EVENT_BUS_KEY);
        }

        function saveCanvasToUserDevice() {
            canvas.toBlob(function (blob: Blob | null) {
                if (blob === null) {
                    EventBus.dispatchEvent(EVENTS.ERROR, new Error(t("error.downloading")));
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
        EventBus.subscribe(EVENTS.FLOOD_FILL_ACTIVATE_REQUEST, () => {
            isFloodFill = true;
        });
        EventBus.subscribe(EVENTS.FLOOD_FILL_DISABLE_REQUEST, () => {
            isFloodFill = false;
        });
        EventBus.subscribe(EVENTS.EVENT_CACHE_SYNC, (newCache: typeof EventCache) => {
            EventCache.set(newCache);

            EventCache.pastEvents.forEach((e: DrawEvent) => {
                drawEvent(e);
            });
        });
        EventBus.subscribe(EVENTS.DRAW_EVENT, (e: DrawEvent) => {
            if (e.type === DrawEventType.DrawEvent) {
                if (e.payload.lineWidth < VALID_VALUES.MIN_LINE_SIZE || e.payload.lineWidth > VALID_VALUES.MAX_LINE_SIZE) {
                    return;
                }
            }
            EventCache.addEvent(e);
            drawEvent(e);
        });
        EventBus.subscribe(EVENTS.REMOTE_REDO_REQUEST, () => {
            doFutureAction();
        });
        EventBus.subscribe(EVENTS.REMOTE_UNDO_REQUEST, () => {
            undoLastAction();
        });
        EventBus.subscribe(EVENTS.MUTED_STATE_CHANGE, (isMuted: boolean) => {
            setIsMuted(isMuted);
            if (isMuted) {
                removeDrawingListeners();
                registerErrors();
            }
            else {
                removeDrawingListeners();
                registerDrawingListeners();
            }
        });
        EventBus.subscribe(EVENTS.RESIZE_EVENT, (ratio: number) => {
        });
        // After a lot of debugging and reading docs, some things were learned
        // Like the fact that useEffect reruns on every rerender
        // Causing a plethora of strange issues, with listener running an extreme amounts of time
        // it turns out, all you need to fix it is [], to basically say that it should only rerun when the values in that list update
        // which is never
        // Well, that was a nice learning experience
    }, []);

    return (
        <div ref={boardRef}>
            <Members></Members>
            {(isMuted) ?
                (<Fade duration={500} className="absolute z-10 w-full h-full flex"><div className="absolute bg-black bg-opacity-20 z-10 w-full h-full flex">
                    <span className="align-top justify-start ml-3 mt-1 bg-white rounded-md p-1 w-auto h-fit-content text-center shadow-md">
                        {t("board.muted")}
                    </span>
                </div></Fade>)
                :
                (null)}
            <canvas ref={canvasRef} className=""></canvas>
        </div>
    );
}