import IconButton from "./IconButton";
import undoIcon from './resources/undo_black_24dp.svg';
import redoIcon from './resources/redo_black_24dp.svg';
import EventBus, { EVENTS } from "./Events/EventBus";
import EventCache from "./Events/EventCache";

export default function RedoUndoInput(props: any) {


    function sendUndoRequest() {
        EventBus.dispatchEvent(EVENTS.UNDO_LAST_ACTION_REQUEST);
    }

    function sendRedoRequest() {
        EventBus.dispatchEvent(EVENTS.REDO_FUTURE_ACTION_REQUEST);
    }

    return (
        <div className="flex space-x-1">
            <IconButton icon={undoIcon} onClick={sendUndoRequest} disabled={EventCache.pastEvents.length !== 0}></IconButton>
            <IconButton icon={redoIcon} onClick={sendRedoRequest}></IconButton>
        </div>
    );
}