import { MutableRefObject, useRef, useState } from 'react';
import PickColorIconDark from './resources/colorize_black_24dp.svg';
import PickColorIconLight from './resources/colorize_white_24dp.svg';
import { SketchPicker } from 'react-color';
import EventBus from './Events/EventBus';
import ColorCircle from './ColorCircle';
import Color from './Color';

export default function ColorMenu(props: any) {
    const [shouldShowMenu, setShouldShowMenu] = useState(false);
    const [color, setColor] = useState(new Color(0, 0, 0, 255));
    const [PickColorIcon, setPickColorIcon] = useState(PickColorIconLight);
    const ColorPickerRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
    const [isClicked, setIsClicked] = useState(false);
    const defaultColors = [
        new Color(0, 0, 0, 255),
        new Color(255, 255, 0, 255),
        new Color(255, 0, 200, 255),
        new Color(0, 0, 230, 255),
        new Color(0, 200, 0, 255),
        new Color(200, 0, 0, 255),
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
        let color = new Color(col.rgb.r, col.rgb.g, col.rgb.b, col.rgb.a * 255)
        setColor(color);
        let brightness = getColorBrightness(col);
        setPickColorIcon((brightness > 128) ? PickColorIconDark : PickColorIconLight);
        EventBus.dispatchEvent(EventBus.EVENTS.DRAWING_COLOR_CHANGE_REQUEST, color);
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
                    <button className="rounded-full w-10 h-10 flex items-center justify-center ml-auto" onClick={onMenuClick} style={{ backgroundColor: color.rgbaToString() }}><img src={PickColorIcon} className="w-6 h-6 select-none"></img></button>
                </div >
                {(shouldShowMenu) ? (
                    <div className="relative flex self-end justify-end z-10" ref={ColorPickerRef}>
                        <SketchPicker className="absolute mt-1 z-50" color={color} onChange={onChangeColor}></SketchPicker>
                    </div>) : (null)}
            </div>
        </div>
    );
}