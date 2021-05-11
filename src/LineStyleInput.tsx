import StyleButton from "./StyleButton";
import { useState } from 'react';
import EventBus from './EventBus';
import { EVENTS } from './EventBus';
import { rgbaToString } from './Utils';
import ExpandMoreIcon from './expand_more_black_24dp.svg';
import ExpandLessIcon from './expand_less_black_24dp.svg';

export default function LineStyleInput(props: any) {
    const [List, setList] = useState(["Fragment", "Square", "Round"]);
    const [ArrowIcon, setArrowIcon] = useState(ExpandMoreIcon);
    const [label, setLabel] = useState(props.label);
    const [isListOpen, setIsListOpen] = useState(false);
    const [borderColor, setBorderColor] = useState(props.defaultColor);
    const [selectedValue, setSelectedValue] = useState(props.default);

    EventBus.subscribe(EVENTS.DRAWING_COLOR_CHANGE_REQUEST, (newColor: string) => {
        setBorderColor(rgbaToString(newColor));
    });

    function onButtonClick() {
        setArrowIcon((isListOpen) ? ExpandMoreIcon : ExpandLessIcon);
        setIsListOpen(!isListOpen);
    }

    function onItemClick(newValue: any) {
        setIsListOpen(false);
        setSelectedValue(newValue);
        let lineCap = null;
        switch (newValue) {
            case "Fragment": {
                lineCap = "butt";
                break;
            }
            case "Square": {
                lineCap = "square";
                break;
            }
            case "Round": {
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
        <div className="relative top-0 self-center inline-flex space-x-1 rounded-md border-2 hover:bg-gray-300 h-full" style={{ borderColor: borderColor }} onClick={onButtonClick}>
            <div className="flex self-center justify-center w-24 h-full rounded-md place-content-center place-items-center cursor-pointer select-none flex-row p-0 mt-0.5 " style={{ borderColor: borderColor }} >

                <div className="h-full flex place-items-center justify-center w-3/4">
                    <span className="text-xs self-start text-center">{label}
                        <div className="w-full focus:outline-none text-center h-full rounded-md self-center text-base">{selectedValue}</div>
                    </span>
                </div>
                <div className="h-full flex place-items-center justify-center w-1/4 rounded-md"><img src={ArrowIcon}></img></div>
                {
                    (isListOpen) ?
                        (<div className="relative flex self-end z-10 justify-end slim-scrollbar hover:bg-white">
                            <div className="rounded-md absolute mt-1 z-50 bg-white shadow-lg w-24 h-24 overflow-scroll overflow-x-hidden flex flex-col place-items-center">
                                {List.map((entry: any, i: any) => {
                                    return (<div key={i} className="h-8 w-full hover:bg-gray-300 place-content-center flex transition-colors" onClick={() => { onItemClick(entry) }}>{entry}</div>);
                                })}
                            </div>
                        </div>)

                        : (null)
                }
            </div>
        </div>
    );
}