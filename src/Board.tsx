import { useRef, useEffect, useState } from 'react';
import EventBus from './EventBus';
import { EVENTS } from './EventBus';
import { saveAs } from 'file-saver';
import { rgbaToString } from './Utils';

export default function Board() {
    const canvasRef = useRef(null);
    let isDrawing = false;
    let lineWidth = 10;
    let lineCap: CanvasLineCap = "round";
    let currentColor: string = "rgba(0, 0, 0, 1)"
    let selectedColor: string = "rgba(0, 0, 0, 1)";

    useEffect(() => {

        const canvas: HTMLCanvasElement = canvasRef.current!;
        const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
        resize();

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        const startDrawing = (clickEvent: any) => {
            isDrawing = true;
            draw(clickEvent);
        }

        const stopDrawing = () => {
            isDrawing = false;
            ctx.beginPath();
        }

        function draw(moveEvent: any) {
            if (!isDrawing) return;

            var position = getMousePositionInCanvas(moveEvent);

            var rect = canvas.getBoundingClientRect();

            ctx.lineWidth = lineWidth;
            ctx.lineCap = lineCap;
            ctx.strokeStyle = currentColor;

            ctx.lineTo(position.x, position.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(position.x, position.y);
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

        canvas.addEventListener("onresize", resize)
        canvas.addEventListener("mousedown", startDrawing);
        canvas.addEventListener("mouseup", stopDrawing);
        canvas.addEventListener("mousemove", draw);
        canvas.addEventListener("mouseout", stopDrawing);
        canvas.addEventListener("touchstart", startDrawing);
        canvas.addEventListener("touchend", stopDrawing);
        canvas.addEventListener("touchmove", draw);

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
        EventBus.subscribe(EVENTS.DRAWING_COLOR_CHANGE_REQUEST, (newColor: string) => {
            selectedColor = rgbaToString(newColor);
            currentColor = selectedColor;
        });
        EventBus.subscribe(EVENTS.LINE_WIDTH_CHANGE_REQUEST, (newValue: number) => {
            lineWidth = newValue;
        });
        EventBus.subscribe(EVENTS.LINE_CAP_CHANGE_REQUEST, (newValue: CanvasLineCap) => {
            lineCap = newValue;
        });
        EventBus.subscribe(EVENTS.ACTIVATE_ERASER_REQUEST, () => {
            currentColor = "rgba(255, 255, 255, 1)";
        });
        EventBus.subscribe(EVENTS.DISABLE_ERASER_REQUEST, () => {
            currentColor = selectedColor;
        });
        EventBus.subscribe(EVENTS.FULL_ERASE_REQUEST, () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    });

    return (
        <canvas ref={canvasRef} className=""></canvas>
    );
}