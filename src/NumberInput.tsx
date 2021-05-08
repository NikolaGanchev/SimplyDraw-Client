import { useRef, useState } from 'react';

export default function NumberInput(props: any) {
    const [List, setList] = useState(props.list);
    const [selectedValue, setSelectedValue] = useState(props.default);
    const [isListOpen, setIsListOpen] = useState(false);

    function onButtonClick() {
        setIsListOpen(!isListOpen);
    }

    function onItemClick(newValue: any) {
        setIsListOpen(false);
        setSelectedValue(newValue);
    }
    return (
        <div className="flex self-center justify-center w-12 h-12 border-2 rounded-md place-content-center place-items-center border-green-600 cursor-pointer select-none flex-row" onClick={onButtonClick}>
            <div className="text-green-500">{selectedValue}</div>
            {
                (isListOpen) ?
                    (<div className="relative flex self-end z-10 justify-end">
                        <div className="absolute mt-1 z-50 bg-white shadow-lg w-12 h-24 overflow-scroll overflow-x-hidden flex flex-col place-items-center">
                            {List.map((entry: any, i: any) => {
                                return (<div key={i} className="h-6 w-8 hover:bg-gray-300 place-content-center flex transition-colors" onClick={() => { onItemClick(entry) }}>{entry}</div>);
                            })}
                        </div>
                    </div>)

                    : (null)
            }
        </div>
    );
}