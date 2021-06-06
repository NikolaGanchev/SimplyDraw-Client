import { useRef } from "react";
import { Fade } from 'react-awesome-reveal';

export default function ResponsiveContentModal(props: any) {
    const contentRef = useRef<HTMLDivElement>(null);

    function onTouch(e: any) {
        const content = contentRef.current
        if (!content) return;

        if (!content.contains(e.target)) {
            props.onResponse(false);
        }
    }

    return (
        <Fade duration={500} className="fixed top-0 bottom-0 left-0 right-0 flex items-center justify-items-center justify-center z-30 p-0 m-0 cursor-pointer">
            <div className="fixed top-0 bottom-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-items-center justify-center z-30 p-0 m-0 cursor-pointer" onClick={onTouch}>

                <div className="z-50 bg-white shadow-lg rounded-md w-full lg:w-3/6" ref={contentRef} style={props.style}>
                    <div className="w-full h-1/5 p-3 border-b-2 flex align-middle text-start items-center">
                        <h1 className="text-xl">{props.header}</h1>
                    </div>
                    <div className="w-full h-3/5 p-3 border-b-2 flex align-middle text-start justify-center place-items-center flex-col">
                        {props.children}
                    </div>
                </div>

            </div>
        </Fade>
    );
}