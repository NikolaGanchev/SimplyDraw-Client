
import { useState } from 'react';
import EventBus from './Events/EventBus';
import { EVENTS } from './Events/EventBus';
import Color from './utils/Color';
import ExpandMoreIcon from './resources/ExpandMore';
import ExpandLessIcon from './resources/ExpandLess';
import { useWindowDimensions } from "./Hooks";
import MobileModal from "./MobileModal";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";
import { Fade } from "react-awesome-reveal";
import { VALID_VALUES } from "./utils/ValidValues";

export default function LineStyleInput(props: any) {
    const [t] = useTranslation("common");
    const fragmented = t("navbar.line.caps.fragmented");
    const round = t("navbar.line.caps.round");
    const square = t("navbar.line.caps.square");
    const [List] = useState([fragmented, square, round]);
    const [label] = useState(props.label);
    const [isListOpen, setIsListOpen] = useState(false);
    const [borderColor, setBorderColor] = useState(props.defaultColor);
    const [selectedValue, setSelectedValue] = useState(props.default);
    const { width } = useWindowDimensions();

    EventBus.subscribe(EVENTS.DRAWING_COLOR_CHANGE_REQUEST, (newColor: Color) => {
        setBorderColor(newColor.rgbaToString());
    });

    function onButtonClick() {
        setIsListOpen(!isListOpen);
    }

    function onItemClick(newValue: any) {
        setIsListOpen(false);
        setSelectedValue(newValue);
        let lineCap = null;
        switch (newValue) {
            case fragmented: {
                lineCap = "butt";
                break;
            }
            case square: {
                lineCap = "square";
                break;
            }
            case round: {
                lineCap = "round";
                break;
            }
            default: {
                lineCap = "round";
            }
        }
        EventBus.dispatchEvent(EVENTS.LINE_CAP_CHANGE_REQUEST, lineCap);
    }

    return (
        <div className="relative top-0 self-center inline-flex space-x-1 rounded-md border-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors h-full" style={{ borderColor: borderColor }} onClick={onButtonClick}>
            <div className="flex self-center justify-center w-24 h-full rounded-md place-content-center place-items-center cursor-pointer select-none flex-row p-0" style={{ borderColor: borderColor }} >

                <div className="h-full flex place-items-center justify-center w-3/4">
                    <span className="text-xs self-start text-center">{label}
                        <div className="w-full focus:outline-none text-center h-full rounded-md self-center text-base">{selectedValue}</div>
                    </span>
                </div>
                <div className="h-full flex place-items-center justify-center w-1/4 rounded-md"><button>{(isListOpen) ? <ExpandLessIcon /> : <ExpandMoreIcon />} </button></div>
                {
                    (isListOpen && width > VALID_VALUES.SMALL_SCREEN) ?
                        (<div className="relative flex self-end z-30 justify-end slim-scrollbar dark:bg-gray-900">
                            <div className="rounded-md absolute mt-1 z-50 shadow-lg w-24 h-24 overflow-scroll overflow-x-hidden flex flex-col place-items-center">
                                {List.map((entry: any, i: any) => {
                                    return (<Fade duration={500} className="h-8 w-full"><button key={nanoid(3)} className="h-8 w-full hover:bg-gray-300 place-content-center flex transition-colors dark:hover:bg-gray-600 dark:bg-gray-900" onClick={() => { onItemClick(entry) }}>{entry}</button></Fade>);
                                })}
                            </div>
                        </div>)

                        : (null)
                }

                {
                    (isListOpen && width <= VALID_VALUES.SMALL_SCREEN) ?
                        (<MobileModal header={t("navbar.line.mobile.headers.cap")} onResponse={() => { setIsListOpen(false) }}><div className="relative flex self-end z-10 justify-end slim-scrollbar ">
                            <div className="rounded-md mt-1 z-50  shadow-lg w-24 h-24 overflow-scroll overflow-x-hidden flex flex-col place-items-center dark:bg-gray-900">
                                {List.map((entry: any, i: any) => {
                                    return (<button key={i} className="h-8 w-full hover:bg-gray-300 dark:hover:bg-gray-600 place-content-center flex transition-colors dark:bg-gray-900" onClick={() => { onItemClick(entry) }}>{entry}</button>);
                                })}
                            </div>
                        </div></MobileModal>)

                        : (null)
                }
            </div>
        </div>
    );
}