import DownloadIcon from './file_download_black_24dp.svg'
import EventBus from './EventBus'
import { EVENTS } from './EventBus'
import ColorMenu from './ColorMenu'

export default function Navbar() {
    return (
        <div className="flex h-12 shadow-md bg-white dark:bg-black">
            <h1 className="self-center ml-3 text-3xl select-none">Simply Draw</h1>
            <div className="ml-auto mr-3 flex space-x-3">
                <ColorMenu></ColorMenu>
                <button className="select-none"><img src={DownloadIcon} alt="Download icon" onClick={() => { EventBus.dispatchEvent(EVENTS.CANVAS_DOWNLOAD_REQUEST) }}></img></button>
            </div>

        </div>
    );
}