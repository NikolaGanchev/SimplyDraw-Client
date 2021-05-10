import DownloadIcon from './file_download_black_24dp.svg'
import EventBus from './EventBus'
import { EVENTS } from './EventBus'
import ColorMenu from './ColorMenu'
import NumberInput from './NumberInput';

export default function Navbar() {
    return (
        <div className="flex h-12 shadow-md bg-white dark:bg-black">
            <h1 className="self-center ml-3 text-3xl select-none">Simply Draw</h1>
            <div className="ml-auto mr-3 flex space-x-3">
                <NumberInput list={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].concat(Array.from({ length: (100 - 12) / 2 + 1 }, (_, i) => 12 + (i * 2)))} default={"10"} max={100} defaultColor="#000000" label="Line width"></NumberInput>
                <ColorMenu className="self-center"></ColorMenu>
                <button className="select-none"><img src={DownloadIcon} alt="Download icon" onClick={() => { EventBus.dispatchEvent(EVENTS.CANVAS_DOWNLOAD_REQUEST) }}></img></button>
            </div>

        </div>
    );
}