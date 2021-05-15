export default function RoomOption(props: any) {

    return (
        <div className="w-full m-1 h-24 p-3 rounded-md bg-white hover:bg-gray-300 shadow-md content-end" onClick={props.onClick}>
            <h3><b>{props.header}</b></h3>
            <span>{props.text}</span>
        </div>
    )
}