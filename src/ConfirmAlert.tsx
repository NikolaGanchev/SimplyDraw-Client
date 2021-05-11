import { useRef } from "react";

export default function ConfirmAlert(props: any) {
    const contentRef = useRef<HTMLDivElement>(null);

    function onAnyClick(e: any) {
        const content = contentRef.current
        if (!content) return;

        if (!content.contains(e.target)) {
            props.onResponse(false);
        }
    }

    return (
        <div className="fixed top-0 bottom-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-items-center justify-center z-30 p-0 m-0" onClick={onAnyClick}>
            <div className="z-50 bg-white w-3/6 h-80 shadow-lg rounded-md" ref={contentRef}>
                <div className="w-full h-1/5 p-3 border-b-2 flex align-middle text-start items-center">
                    <h1 className="text-xl">{props.header}</h1>
                </div>
                <div className="w-full h-3/5 p-3 border-b-2 flex align-middle text-start">
                    {props.children}
                </div>
                <div className="w-full h-1/5 p-3 flex items-center justify-end space-x-1 ">
                    <button className="w-24 h-5/6 p-3 flex items-center justify-center  bg-white text-black hover:bg-gray-300 rounded-md" onClick={() => { props.onResponse(false) }}>
                        <b>Refuse</b>
                    </button>
                    <button className="w-24 h-5/6 p-3 flex items-center justify-center bg-red-600 text-white hover:bg-red-700 rounded-md" onClick={() => { props.onResponse(true) }}>
                        <b>Ok</b>
                    </button>
                </div>
            </div>

        </div>
    );
}