import { useRef, useState } from 'react';
import EventBus from './Events/EventBus';
import { EVENTS } from './Events/EventBus';
import ExpandMoreIcon from './resources/expand_more_black_24dp.svg';
import ExpandLessIcon from './resources/expand_less_black_24dp.svg';
import Color from './Color';
import { useWindowDimensions } from './Hooks';
import MobileModal from './MobileModal';
import { useTranslation } from 'react-i18next';

export default function NumberInput(props: any) {
    const [List, setList] = useState(props.list);
    const [selectedValue, setSelectedValue] = useState(props.default);
    const [isListOpen, setIsListOpen] = useState(false);
    const [borderColor, setBorderColor] = useState(props.defaultColor);
    const MIN_NUMBER = props.min || 1;
    const MAX_NUMBER = props.max || 999;
    const [ArrowIcon, setArrowIcon] = useState(ExpandMoreIcon);
    const [label, setLabel] = useState(props.label);
    const { height, width } = useWindowDimensions();
    const [t] = useTranslation("common");

    function onButtonClick() {
        setArrowIcon((isListOpen) ? ExpandMoreIcon : ExpandLessIcon);
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
            <div className="h-full flex place-items-center justify-center w-1/4 border-l-2 hover:bg-gray-300 rounded-md" onClick={onButtonClick}><input type="image" src={ArrowIcon}></input></div>
            {
                (isListOpen && width > 1024) ?
                    (<div className="relative flex self-end z-10 justify-end slim-scrollbar hover:bg-white">
                        <div className="rounded-md absolute mt-1 z-50 bg-white shadow-lg w-24 h-24 overflow-scroll overflow-x-hidden flex flex-col place-items-center">
                            {List.map((entry: any, i: any) => {
                                return (<button key={i} className="h-6 w-full hover:bg-gray-300 place-content-center flex transition-colors" onClick={() => { onItemClick(entry) }}>{entry}</button>);
                            })}
                        </div>
                    </div>)

                    : (null)
            }

            {
                (isListOpen && width <= 1024) ?
                    (<MobileModal header={t("navbar.line.mobile.headers.width")} onResponse={() => { onButtonClick() }}><div className="relative flex self-end z-10 justify-end slim-scrollbar hover:bg-white">
                        <div className="rounded-md mt-1 z-50 bg-white shadow-lg w-24 h-24 overflow-scroll overflow-x-hidden flex flex-col place-items-center">
                            {List.map((entry: any, i: any) => {
                                return (<button key={i} className="h-8 w-full hover:bg-gray-300 place-content-center flex transition-colors" onClick={() => { onItemClick(entry) }}>{entry}</button>);
                            })}
                        </div>
                    </div></MobileModal>)

                    : (null)
            }
        </div>
    );
}