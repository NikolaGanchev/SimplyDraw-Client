import { useRef, useEffect, useState } from 'react';
import EventBus from './Events/EventBus';
import { EVENTS } from './Events/EventBus';
import { saveAs } from 'file-saver';
import Color from './Color';
import Line from './Events/Line';
import Path from './Events/Path';
import DrawEvent from './Events/DrawEvent';
import { DrawEventType } from './Events/DrawEventType';
import EventCache from './Events/EventCache';

export default function Board() {
    const canvasRef = useRef(null);
    let isDrawing = false;
    let lineWidth = 10;
    let lineCap: CanvasLineCap = "round";
    let currentColor: Color = new Color(0, 0, 0, 1);
    let selectedColor: Color = new Color(0, 0, 0, 1);

    useEffect(() => {
        let isControlPressed = false;
        const canvas: HTMLCanvasElement = canvasRef.current!;
        const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
        resize();

        let event: DrawEvent | null;
        let path: Path;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        const startDrawing = (clickEvent: any) => {
            ctx.lineWidth = lineWidth;
            ctx.lineCap = lineCap;
            ctx.strokeStyle = currentColor.rgbaToString();

            event = new DrawEvent(DrawEventType.DrawEvent);
            path = new Path(lineWidth, lineCap, currentColor);

            isDrawing = true;
            onMoveEvent(clickEvent);
        }

        const stopDrawing = () => {
            if (event && event !== undefined) {
                Object.assign(event?.payload, path);
                EventCache.addEvent(event);
                event = null;
            }
            isDrawing = false;
            ctx.beginPath();
        }

        function onMoveEvent(moveEvent: any) {
            if (!isDrawing) return;

            var position = getMousePositionInCanvas(moveEvent);

            path.positions.push(position);

            draw(position);
        }

        function draw(position: { x: number, y: number }) {
            ctx.lineTo(position.x, position.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(position.x, position.y);
        }

        function drawEvent(e: DrawEvent) {
            console.log(e);
            ctx.lineWidth = e.payload.lineWidth;
            ctx.lineCap = e.payload.lineCap;
            ctx.strokeStyle = e.payload.color.rgbaToString();

            e.payload.positions.forEach((e: { x: number, y: number }) => {
                draw(e);
            });

            ctx.beginPath();
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

        function undoLastAction() {

            if (EventCache.pastEvents.length === 0) return;
            console.log(EventCache.pastEvents);
            EventCache.rewindEvent();
            console.log(EventCache.pastEvents);
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

        canvas.addEventListener("onresize", resize)
        canvas.addEventListener("mousedown", startDrawing);
        canvas.addEventListener("mouseup", stopDrawing);
        canvas.addEventListener("mousemove", onMoveEvent);
        canvas.addEventListener("mouseout", stopDrawing);
        canvas.addEventListener("touchstart", startDrawing);
        canvas.addEventListener("touchend", stopDrawing);
        canvas.addEventListener("touchmove", onMoveEvent);

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
            clearCanvas();
        });
        EventBus.subscribe(EVENTS.UNDO_LAST_ACTION_REQUEST, () => {
            undoLastAction();
        });
        EventBus.subscribe(EVENTS.REDO_FUTURE_ACTION_REQUEST, () => {
            doFutureAction();
        });
    });

    return (
        <canvas ref={canvasRef} className=""></canvas>
    );
}