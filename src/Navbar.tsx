import DownloadIcon from './resources/file_download_black_24dp.svg'
import EventBus from './Events/EventBus'
import { EVENTS } from './Events/EventBus'
import ColorMenu from './ColorMenu'
import NumberInput from './NumberInput';
import LineStyleInput from './LineStyleInput';
import { EraseInput } from './EraseInput';
import UndoRedoInput from './UndoRedoInput';
import FloodFillButton from './FloodFillButton';
import { useTranslation } from 'react-i18next';
import GroupConnectComponent from './GroupConnectComponent';
import { VALID_VALUES } from './utils/ValidValues';
import ReactTooltip from 'react-tooltip';
import { useState } from 'react';
import ResponsiveContentModal from './ResponsiveContentModal';

export default function Navbar() {
    const [t] = useTranslation('common');
    const [showAbout, setShowAbout] = useState(false);

    return (
        <div className="flex h-12 shadow-md bg-white dark:bg-black overflow-x-scroll overflow-y-hidden small:overflow-visible">
            <h1 data-tip={t("tooltip.about")} onClick={() => { setShowAbout(true) }} className="self-center ml-3 text-lg select-none whitespace-nowrap text-left cursor-pointer"><b>{t("app.name")}</b> </h1>
            {(showAbout) ?
                (<ResponsiveContentModal style={{ width: '50rem' }} header={t("tooltip.about")} onResponse={() => { setShowAbout(false) }}>
                    <span dangerouslySetInnerHTML={{ __html: t("about.text") }}></span>
                    <br />
                    <a className="text-blue-500 underline" href='https://github.com/NikolaGanchev/SimplyDraw-Client'>Github</a>
                </ResponsiveContentModal>) :
                (null)
            }
            <div className="ml-auto mr-3 flex space-x-3">
                <GroupConnectComponent></GroupConnectComponent>
                <FloodFillButton></FloodFillButton>
                <UndoRedoInput></UndoRedoInput>
                <EraseInput></EraseInput>
                <LineStyleInput defaultColor={"#000000"} default={t("navbar.line.caps.round")} label={t("navbar.line.cap")}></LineStyleInput>
                <NumberInput list={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].concat(Array.from({ length: (VALID_VALUES.MAX_LINE_SIZE - 12) / 2 + 1 }, (_, i) => 12 + (i * 2)))} default={"10"} max={VALID_VALUES.MAX_LINE_SIZE} defaultColor="#000000" label={t("navbar.line.width")}></NumberInput>
                <ColorMenu className="self-center"></ColorMenu>
                <button className="select-none"><img src={DownloadIcon} alt="Download icon" onClick={() => { EventBus.dispatchEvent(EVENTS.CANVAS_DOWNLOAD_REQUEST) }}></img></button>
            </div>

        </div>
    );
}