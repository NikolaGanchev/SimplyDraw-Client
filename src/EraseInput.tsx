import ColorCircle from "./ColorCircle";
import Eraser from './resources/eraser-line.svg';
import EraserFill from './resources/eraser-fill.svg';
import EventBus from './Events/EventBus';
import { EVENTS } from './Events/EventBus';
import { useState, useEffect } from 'react';
import ConfirmAlert from "./ConfirmAlert";
import { useTranslation } from "react-i18next";

export function EraseInput() {
    const [background, setBackground] = useState("#ffffff");
    const [eraserIsActive, setEraserIsActive] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [t] = useTranslation('common');

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

    EventBus.subscribe(EVENTS.DRAWING_COLOR_CHANGE_REQUEST, () => {
        setEraserIsActive(false);
        setBackground("#ffffff");
    });

    return (
        <div><div>{(showModal) ? (<ConfirmAlert header={t("navbar.erase.confirmation.question")} onResponse={onModalResponse}>{t("navbar.erase.confirmation.text")} </ConfirmAlert>) : (null)}</div>
            <div className="flex space-x-1">
                <div className="relative inline-flex self-center transition-colors place-items-center align-center w-12 h-12 justify-center rounded-md cursor-pointer hover:bg-gray-300">

                    <div className="flex flex-col" onClick={onFullErase}>
                        <span className="text-xs text-center pt-1">{t("navbar.erase.clear")}</span>
                        <div className="rounded-full w-10 h-8 flex items-center justify-center ml-auto " ><input type="image" src={EraserFill} className="w-6 h-6 select-none"></input></div>
                    </div>
                </div>

                <div className="relative inline-flex self-center transition-colors place-items-center align-center w-12 h-12 justify-center rounded-md cursor-pointer" style={{ backgroundColor: background }} onClick={onEraserClick} onMouseEnter={onHover} onMouseLeave={onStopHover}>
                    <div>
                        <div className="rounded-full w-10 h-10 flex items-center justify-center ml-auto" ><input type="image" src={Eraser} className="w-6 h-6 select-none"></input></div>
                    </div >
                </div>
            </div>
        </div>
    );
}