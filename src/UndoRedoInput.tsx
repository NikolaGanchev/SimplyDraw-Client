import SvgIconButton from "./SvgIconButton";
import undoIcon from './resources/Undo';
import redoIcon from './resources/Redo';
import EventBus, { EVENTS } from "./Events/EventBus";
import EventCache from "./Events/EventCache";
import { useTranslation } from "react-i18next";

export default function RedoUndoInput(props: any) {
    const [t] = useTranslation("common");

    function sendUndoRequest() {
        EventBus.dispatchEvent(EVENTS.UNDO_LAST_ACTION_REQUEST);
    }

    function sendRedoRequest() {
        EventBus.dispatchEvent(EVENTS.REDO_FUTURE_ACTION_REQUEST);
    }

    return (
        <div className="flex space-x-1">
            <SvgIconButton icon={undoIcon} onClick={sendUndoRequest} disabled={EventCache.pastEvents.length !== 0} tooltip={t("tooltip.undo")}></SvgIconButton>
            <SvgIconButton icon={redoIcon} onClick={sendRedoRequest} tooltip={t("tooltip.redo")}></SvgIconButton>
        </div>
    );
}