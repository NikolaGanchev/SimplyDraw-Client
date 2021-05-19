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
import AvataaarComponent from './AvataaarComponent';
import Avataaar from './utils/Avataaar'

export default function Navbar() {
    const [t] = useTranslation('common');

    return (
        <div className="flex h-12 shadow-md bg-white dark:bg-black overflow-x-scroll overflow-y-hidden lg:overflow-visible">
            <h1 className="self-center ml-3 text-lg select-none whitespace-nowrap text-left"><b>{t("app.name")}</b></h1>
            <div className="ml-auto mr-3 flex space-x-3">
                <GroupConnectComponent></GroupConnectComponent>
                <FloodFillButton></FloodFillButton>
                <UndoRedoInput></UndoRedoInput>
                <EraseInput></EraseInput>
                <LineStyleInput defaultColor={"#000000"} default={t("navbar.line.caps.round")} label={t("navbar.line.cap")}></LineStyleInput>
                <NumberInput list={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].concat(Array.from({ length: (100 - 12) / 2 + 1 }, (_, i) => 12 + (i * 2)))} default={"10"} max={100} defaultColor="#000000" label={t("navbar.line.width")}></NumberInput>
                <ColorMenu className="self-center"></ColorMenu>
                <button className="select-none"><img src={DownloadIcon} alt="Download icon" onClick={() => { EventBus.dispatchEvent(EVENTS.CANVAS_DOWNLOAD_REQUEST) }}></img></button>
            </div>

        </div>
    );
}