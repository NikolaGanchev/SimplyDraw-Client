import Avatar from 'avataaars'
import { useState } from 'react';
import { AvataaarOptions } from './utils/Avataaar';

export default function AvataaarComponent(props: any) {
    let avatar = props.avatar;

    const [topType, setTopType] = useState(AvataaarOptions.topType[avatar.topType]);
    const [accessoriesType, setAccessoriesType] = useState(AvataaarOptions.accessoriesType[avatar.accessoriesType]);
    const [hairColor, setHairColor] = useState(AvataaarOptions.hairColor[avatar.hairColor]);
    const [facialHairType, setFacialHairType] = useState(AvataaarOptions.facialHairType[avatar.facialHairType]);
    const [facialHairColor, setFacialHairColor] = useState(AvataaarOptions.facialHairColor[avatar.facialHairColor]);
    const [clotheType, setClotheType] = useState(AvataaarOptions.clotheType[avatar.clotheType]);
    const [clotheColor, setClotheColor] = useState(AvataaarOptions.clotheColor[avatar.clotheColor]);
    const [graphicType, setGraphicType] = useState(AvataaarOptions.graphicType[avatar.graphicType]);
    const [eyeType, setEyeType] = useState("Default");
    const [eyebrowType, setEyebrowType] = useState("Default");
    const [mouthType, setMouthType] = useState("Default");
    const [skinColor, setSkinColor] = useState(AvataaarOptions.skinColor[avatar.skinColor]);

    return (
        <Avatar
            avatarStyle='Circle'
            topType={topType}
            accessoriesType={accessoriesType}
            hairColor={hairColor}
            facialHairType={facialHairType}
            facialHairColor={facialHairColor}
            clotheType={clotheType}
            clotheColor={clotheColor}
            graphicType={graphicType}
            eyeType={eyeType}
            eyebrowType={eyebrowType}
            mouthType={mouthType}
            skinColor={skinColor}
            style={{ width: '6rem', height: '6rem' }}
        />
    )
}