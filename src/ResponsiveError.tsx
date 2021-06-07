import { useRef } from "react";
import { Fade } from "react-awesome-reveal";
import { useTranslation } from "react-i18next";

export default function ResponsiveError(props: any) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [t] = useTranslation('common');

    function onTouch(e: any) {
        const content = contentRef.current
        if (!content) return;

        if (!content.contains(e.target)) {
            props.onResponse(false);
        }
    }

    return (
        <Fade duration={500} className="fixed top-0 bottom-0 left-0 right-0 flex items-center justify-items-center justify-center z-40 p-0 m-0 cursor-pointer">
            <div className="fixed top-0 bottom-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-items-center justify-center z-40 p-0 m-0 cursor-pointer" onClick={onTouch}>
                <div className="z-50 bg-white dark:bg-gray-900 shadow-lg rounded-md w-full lg:w-3/6 dark:text-white" ref={contentRef} >
                    <div className="w-full h-1/5 p-3 border-b-2 dark:border-white  flex align-middle text-start items-center">
                        <h1 className="text-xl">{t("error.header")}</h1>
                    </div>
                    <div className="w-full h-3/5 p-3 border-b-2 dark:border-white flex align-middle text-start justify-center place-items-center flex-col">
                        {props.error}
                    </div>
                    <div className="w-full h-1/5 p-3 flex items-center justify-end space-x-1 ">
                        <button className="w-24 h-5/6 p-3 flex items-center justify-center bg-white dark:bg-gray-900 dark:text-white dark:hover:bg-gray-600 text-black hover:bg-gray-300 rounded-md cursor-pointer" onClick={() => { props.onResponse(false) }}>
                            <b>{t("answers.positive")}</b>
                        </button>
                    </div>
                </div>

            </div></Fade>
    );
}