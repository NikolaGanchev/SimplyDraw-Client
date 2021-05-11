import { useRef, useState } from 'react';
import EventBus from './EventBus';
import { EVENTS } from './EventBus';
import { rgbaToString } from './Utils';
import ExpandMoreIcon from './expand_more_black_24dp.svg';
import ExpandLessIcon from './expand_less_black_24dp.svg';

export default function NumberInput(props: any) {
    const [List, setList] = useState(props.list);
    const [selectedValue, setSelectedValue] = useState(props.default);
    const [isListOpen, setIsListOpen] = useState(false);
    const [borderColor, setBorderColor] = useState(props.defaultColor);
    const MIN_NUMBER = props.min || 1;
    const MAX_NUMBER = props.max || 999;
    const [ArrowIcon, setArrowIcon] = useState(ExpandMoreIcon);
    const [label, setLabel] = useState(props.label);

    function onButtonClick() {
        setArrowIcon((isListOpen) ? ExpandMoreIcon : ExpandLessIcon);
        setIsListOpen(!isListOpen);
    }

    function onItemClick(newValue: any) {
        setIsListOpen(false);
        setSelectedValue(newValue);
        EventBus.dispatchEvent(EVENTS.LINE_WIDTH_CHANGE_REQUEST, newValue);
    }

    EventBus.subscribe(EVENTS.DRAWING_COLOR_CHANGE_REQUEST, (newColor: string) => {
        setBorderColor(rgbaToString(newColor));
    });

    function handleNumberChange(event: React.ChangeEvent<HTMLInputElement>) {
        let value = event.target.value.replace(/\D/, '');
        if (value >= MIN_NUMBER && value <= MAX_NUMBER || value === "") {
            setSelectedValue(value);
            EventBus.dispatchEvent(EVENTS.LINE_WIDTH_CHANGE_REQUEST, value);
        }
    }

    return (
        <div className="flex self-center justify-center w-24 h-full border-2 rounded-md place-content-center place-items-center cursor-pointer select-none flex-row p-0 mt-0.5 " style={{ borderColor: borderColor }}>

            <div className="h-full flex place-items-center justify-center w-3/4">
                <label className="text-xs self-start text-center">{label}
                    <input className="w-full focus:outline-none text-center h-full rounded-md self-center text-base" value={selectedValue} onChange={handleNumberChange}></input>
                </label>
            </div>
            <div className="h-full flex place-items-center justify-center w-1/4 border-l-2 hover:bg-gray-300 rounded-md" onClick={onButtonClick}><img src={ArrowIcon}></img></div>
            {
                (isListOpen) ?
                    (<div className="relative flex self-end z-10 justify-end slim-scrollbar hover:bg-white">
                        <div className="rounded-md absolute mt-1 z-50 bg-white shadow-lg w-24 h-24 overflow-scroll overflow-x-hidden flex flex-col place-items-center">
                            {List.map((entry: any, i: any) => {
                                return (<div key={i} className="h-6 w-full hover:bg-gray-300 place-content-center flex transition-colors" onClick={() => { onItemClick(entry) }}>{entry}</div>);
                            })}
                        </div>
                    </div>)

                    : (null)
            }
        </div>
    );
}