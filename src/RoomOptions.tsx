export default function RoomOption(props: any) {

    return (
        <div className="w-full m-1 h-24 p-3 rounded-md bg-white dark:bg-gray-900 dark:hover:bg-gray-600 hover:bg-gray-300 dark:border-white border-2 shadow-md content-end transition-colors" onClick={props.onClick}>
            <h3><b>{props.header}</b></h3>
            <span>{props.text}</span>
        </div>
    )
}