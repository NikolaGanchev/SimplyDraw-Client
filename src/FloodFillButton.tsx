import { useContext, useState } from 'react';
import EventBus, { EVENTS } from './Events/EventBus';
import FillIcon from './resources/format_color_fill_black_24dp.svg';
import Color from './utils/Color';
import ReactTooltip from 'react-tooltip';
import { useTranslation } from 'react-i18next';

export default function FloodFillButton() {
    const [t] = useTranslation("common");
    const activeColor = new Color(209, 213, 219, 1);

    const [background, setBackground] = useState<string | undefined>(undefined);
    const [isFloodActive, setIsFloodActive] = useState(false);

    function onClick() {
        if (isFloodActive) {
            setBackground(undefined);
            EventBus.dispatchEvent(EVENTS.FLOOD_FILL_DISABLE_REQUEST);
        }
        else {
            setBackground(activeColor.rgbaToString());
            EventBus.dispatchEvent(EVENTS.FLOOD_FILL_ACTIVATE_REQUEST);
        }
        setIsFloodActive(!isFloodActive);
    }

    return (
        <div data-tip={t("tooltip.fill")} style={{ backgroundColor: background }} className="relative inline-flex self-center transition-colors place-items-center align-center w-12 h-12 justify-center rounded-md cursor-pointer hover:bg-gray-300" onClick={onClick} >
            <div>
                <div className="rounded-full w-10 h-10 flex items-center justify-center ml-auto" ><input type="image" src={FillIcon} className="w-6 h-6 select-none disabled:opacity-60 fill-current"></input></div>
            </div >

            <ReactTooltip place="bottom" type="light" effect="solid" border={true} borderColor="black" />
        </div>
    );
}