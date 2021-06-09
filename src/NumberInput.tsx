import { useState } from 'react';
import EventBus from './Events/EventBus';
import { EVENTS } from './Events/EventBus';
import ExpandMoreIcon from './resources/ExpandMore';
import ExpandLessIcon from './resources/ExpandLess';
import Color from './utils/Color';
import { useWindowDimensions } from './Hooks';
import MobileModal from './MobileModal';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import { Fade } from 'react-awesome-reveal';
import { VALID_VALUES } from './utils/ValidValues';

export default function NumberInput(props: any) {
    const [List] = useState(props.list);
    const [selectedValue, setSelectedValue] = useState(props.default);
    const [isListOpen, setIsListOpen] = useState(false);
    const [borderColor, setBorderColor] = useState(props.defaultColor);
    const MIN_NUMBER = props.min || 1;
    const MAX_NUMBER = props.max || 999;
    const [label] = useState(props.label);
    const { width } = useWindowDimensions();
    const [t] = useTranslation("common");

    function onButtonClick() {
        setIsListOpen(!isListOpen);
    }

    function onItemClick(newValue: any) {
        setIsListOpen(false);
        setSelectedValue(newValue);
        EventBus.dispatchEvent(EVENTS.LINE_WIDTH_CHANGE_REQUEST, newValue);
    }

    EventBus.subscribe(EVENTS.DRAWING_COLOR_CHANGE_REQUEST, (newColor: Color) => {
        setBorderColor(newColor.rgbaToString());
    });

    function handleNumberChange(event: React.ChangeEvent<HTMLInputElement>) {
        let value = event.target.value.replace(/\D/, '');
        if ((value >= MIN_NUMBER && value <= MAX_NUMBER) || value === "") {
            setSelectedValue(value);
            EventBus.dispatchEvent(EVENTS.LINE_WIDTH_CHANGE_REQUEST, value);
        }
    }

    return (
        <div className="flex self-center justify-center w-24 h-full border-2 rounded-md place-content-center place-items-center cursor-pointer select-none flex-row p-0" style={{ borderColor: borderColor }}>

            <div className="h-full flex place-items-center justify-center w-3/4">
                <label className="text-xs self-start text-center">{label}
                    <input className="w-full focus:outline-none text-center h-full rounded-md self-center text-base dark:bg-gray-900" value={selectedValue} onChange={handleNumberChange}></input>
                </label>
            </div>
            <div className="h-full flex place-items-center justify-center w-1/4 border-l-2 hover:bg-gray-300 rounded-md transition-colors dark:hover:bg-gray-600 dark:border-gray-900" onClick={onButtonClick}><button>{(isListOpen) ? <ExpandLessIcon /> : <ExpandMoreIcon />}</button></div>
            {
                (isListOpen && width > VALID_VALUES.SMALL_SCREEN) ?
                    (<div className="relative flex self-end z-30 justify-end slim-scrollbar">
                        <div className="rounded-md absolute mt-1 z-50 shadow-lg w-24 h-24 overflow-scroll overflow-x-hidden flex flex-col place-items-center dark:bg-gray-900">
                            {List.map((entry: any, i: any) => {
                                return (<Fade duration={100} className="h-6 w-full"><button key={nanoid(3)} className="h-6 w-full hover:bg-gray-300 place-content-center flex transition-colors dark:hover:bg-gray-600" onClick={() => { onItemClick(entry) }}>{entry}</button></Fade>);
                            })}
                        </div>
                    </div>)

                    : (null)
            }

            {
                (isListOpen && width <= VALID_VALUES.SMALL_SCREEN) ?
                    (<MobileModal header={t("navbar.line.mobile.headers.width")} onResponse={() => { onButtonClick() }}><div className="relative flex self-end z-10 justify-end slim-scrollbar hover:bg-white">
                        <div className="rounded-md mt-1 z-50 bg-white shadow-lg w-24 h-24 overflow-scroll overflow-x-hidden flex flex-col place-items-center dark:bg-gray-900">
                            {List.map((entry: any, i: any) => {
                                return (<button key={nanoid(3)} className="h-8 w-full hover:bg-gray-300 place-content-center flex transition-colors dark:hover:bg-gray-600" onClick={() => { onItemClick(entry) }}>{entry}</button>);
                            })}
                        </div>
                    </div></MobileModal>)

                    : (null)
            }
        </div>
    );
}