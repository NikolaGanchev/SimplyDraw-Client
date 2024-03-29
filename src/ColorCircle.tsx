
export default function ColorCircle(props: any) {
    return (
        <div className="relative inline-flex flex-col self-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors place-items-center align-center w-12 h-12 justify-center rounded-md cursor-pointer" onClick={() => props.onSelect(props.color)}>
            <div>
                <button className="rounded-full w-10 h-10 flex items-center justify-center ml-auto" style={{ backgroundColor: props.color.rgbaToString() }}></button>
            </div>
        </div>)
}