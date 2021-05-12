import { useState } from 'react';
import EventBus, { EVENTS } from './Events/EventBus';
import FillIcon from './resources/format_color_fill_black_24dp.svg';

export default function FloodFillButton() {
    const [background, setBackground] = useState("#ffffff");
    const [isFloodActive, setIsFloodActive] = useState(false);

    function onHover() {
        setBackground("rgba(209, 213, 219, 1)");
    }

    function onStopHover() {
        if (!isFloodActive) {
            setBackground("#ffffff");
        }
    }

    function onClick() {
        if (isFloodActive) {
            setIsFloodActive(false);
            EventBus.dispatchEvent(EVENTS.FLOOD_FILL_DISABLE_REQUEST);
        }
        else {
            setIsFloodActive(true);
            EventBus.dispatchEvent(EVENTS.FLOOD_FILL_ACTIVATE_REQUEST);
        }
    }

    return (
        <div className="relative inline-flex self-center transition-colors place-items-center align-center w-12 h-12 justify-center rounded-md cursor-pointer" style={{ backgroundColor: background }} onClick={onClick} onMouseEnter={onHover} onMouseLeave={onStopHover}>
            <div>
                <div className="rounded-full w-10 h-10 flex items-center justify-center ml-auto" ><input type="image" src={FillIcon} className="w-6 h-6 select-none"></input></div>
            </div >
        </div>
    );
}