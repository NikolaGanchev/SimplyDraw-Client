import { useState } from 'react';

export default function StyleButton(props: any) {
    const [lineCap, setLineCap] = useState(props.lineCap);

    return (
        <div className="relative inline-flex flex-col self-center hover:bg-gray-300 transition-colors place-items-center align-center w-14 h-12 justify-center rounded-md" onClick={() => props.onSelect(props.color)}>
            <div>
                <div className="rounded-full w-14 h-10 flex items-center justify-center ml-auto text-center text-base">{lineCap}</div>
            </div>
        </div>
    )
}