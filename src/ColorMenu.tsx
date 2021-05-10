import { MutableRefObject, useRef, useState } from 'react';
import PickColorIconDark from './colorize_black_24dp.svg';
import PickColorIconLight from './colorize_white_24dp.svg';
import { SketchPicker } from 'react-color';
import EventBus from './EventBus';
import ColorCircle from './ColorCircle';
import { rgbaToString } from './Utils';

export default function ColorMenu(props: any) {
    const [shouldShowMenu, setShouldShowMenu] = useState(false);
    const [color, setColor] = useState({ r: 0, g: 0, b: 0, a: 1 });
    const [PickColorIcon, setPickColorIcon] = useState(PickColorIconLight);
    const ColorPickerRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
    const [isClicked, setIsClicked] = useState(false);
    const defaultColors = [
        { r: 0, g: 0, b: 0, a: 1 },
        { r: 255, g: 255, b: 0, a: 1 },
        { r: 255, g: 0, b: 200, a: 1 },
        { r: 0, g: 0, b: 230, a: 1 },
        { r: 0, g: 200, b: 0, a: 1 },
        { r: 200, g: 0, b: 0, a: 1 },
    ]


    function getColorBrightness(color: any): number {
        let rgb = color.rgb;
        let brightness: number = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
        return brightness;
    }

    function onHover() {
        setShouldShowMenu(true);
    }

    function onHoverLeave(event: any) {
        if (!isClicked) {
            setShouldShowMenu(false);
        }
    }

    function onMenuClick() {
        setIsClicked(!isClicked);
        setShouldShowMenu(!isClicked);
    }

    function onChangeColor(col: any, event: any) {
        setColor(col.rgb);
        let brightness = getColorBrightness(col);
        setPickColorIcon((brightness > 128) ? PickColorIconDark : PickColorIconLight);
        EventBus.dispatchEvent(EventBus.EVENTS.DRAWING_COLOR_CHANGE_REQUEST, col.rgb);
    }

    function onColorSelectFromDefaults(col: any) {
        onChangeColor({ rgb: col }, null);
        EventBus.dispatchEvent(EventBus.EVENTS.DRAWING_COLOR_CHANGE_REQUEST, col);
    }

    return (
        <div className="relative top-0 self-center inline-flex space-x-1">

            {defaultColors.map((color, i) => {
                return (<ColorCircle color={color} key={i} onSelect={onColorSelectFromDefaults}></ColorCircle>)
            })}

            <div className="relative inline-flex flex-col self-center hover:bg-gray-300 transition-colors place-items-center align-center w-12 h-12 justify-center rounded-md" onMouseEnter={onHover} onMouseLeave={onHoverLeave}>
                <div className="">
                    <div className="rounded-full w-10 h-10 flex items-center justify-center ml-auto" onClick={onMenuClick} style={{ backgroundColor: rgbaToString(color) }}><img src={PickColorIcon} className="w-6 h-6 select-none"></img></div>
                </div >
                {(shouldShowMenu) ? (
                    <div className="relative flex self-end justify-end z-10" ref={ColorPickerRef}>
                        <SketchPicker className="absolute mt-1 z-50" color={color} onChange={onChangeColor}></SketchPicker>
                    </div>) : (null)}
            </div>
        </div>
    );
}