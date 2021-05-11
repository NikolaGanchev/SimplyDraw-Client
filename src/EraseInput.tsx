import ColorCircle from "./ColorCircle";
import Eraser from './resources/eraser-line.svg';
import EraserFill from './resources/eraser-fill.svg';
import EventBus from './Events/EventBus';
import { EVENTS } from './Events/EventBus';
import { useState, useEffect } from 'react';
import ConfirmAlert from "./ConfirmAlert";

export function EraseInput() {
    const [background, setBackground] = useState("#ffffff");
    const [eraserIsActive, setEraserIsActive] = useState(false);
    const [showModal, setShowModal] = useState(false);

    function onEraserClick() {
        if (eraserIsActive) {
            EventBus.dispatchEvent(EVENTS.DISABLE_ERASER_REQUEST);
            setBackground("#ffffff");
        }
        else {
            EventBus.dispatchEvent(EVENTS.ACTIVATE_ERASER_REQUEST);
            setBackground("rgba(209, 213, 219, 1)");
        }
        setEraserIsActive(!eraserIsActive);
    }

    function onHover() {
        setBackground("rgba(209, 213, 219, 1)");
    }

    function onStopHover() {
        if (!eraserIsActive) {
            setBackground("#ffffff");
        }
    }

    function onFullErase() {
        setShowModal(true);

    }

    function onModalResponse(shouldErase: boolean) {
        setShowModal(false);
        if (shouldErase) {
            EventBus.dispatchEvent(EVENTS.FULL_ERASE_REQUEST);
        }
    }

    return (
        <div><div>{(showModal) ? (<ConfirmAlert header="Are you sure you want to clear the canvas?" onResponse={onModalResponse}>All contents of the canvas will be cleared. You may not be able to return it to its previous state.</ConfirmAlert>) : (null)}</div>
            <div className="flex space-x-1">
                <div className="relative inline-flex self-center transition-colors place-items-center align-center w-12 h-12 justify-center rounded-md cursor-pointer hover:bg-gray-300">

                    <div className="flex flex-col" onClick={onFullErase}>
                        <span className="text-xs text-center pt-1">Clear</span>
                        <div className="rounded-full w-10 h-8 flex items-center justify-center ml-auto " ><img src={EraserFill} className="w-6 h-6 select-none"></img></div>
                    </div>
                </div>

                <div className="relative inline-flex self-center transition-colors place-items-center align-center w-12 h-12 justify-center rounded-md cursor-pointer" style={{ backgroundColor: background }} onClick={onEraserClick} onMouseEnter={onHover} onMouseLeave={onStopHover}>
                    <div>
                        <div className="rounded-full w-10 h-10 flex items-center justify-center ml-auto" ><img src={Eraser} className="w-6 h-6 select-none"></img></div>
                    </div >
                </div>
            </div>
        </div>
    );
}