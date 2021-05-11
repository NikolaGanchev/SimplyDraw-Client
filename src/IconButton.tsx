export default function IconButton(props: any) {
    return (
        <div className="relative inline-flex self-center transition-colors place-items-center align-center w-12 h-12 justify-center rounded-md cursor-pointer hover:bg-gray-300" onClick={props.onClick}>
            <div>
                <div className="rounded-full w-10 h-10 flex items-center justify-center ml-auto" ><input type="image" src={props.icon} className="w-6 h-6 select-none"></input></div>
            </div >
        </div>
    );
}