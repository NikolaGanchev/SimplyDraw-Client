import Avatar from 'avataaars'
import { useState } from 'react';
import { AvataaarOptions } from './utils/Avataaar';

export default function AvataaarComponent(props: any) {
    let avatar = props.avatar;

    const [topType] = useState(AvataaarOptions.topType[avatar.topType]);
    const [accessoriesType] = useState(AvataaarOptions.accessoriesType[avatar.accessoriesType]);
    const [hairColor] = useState(AvataaarOptions.hairColor[avatar.hairColor]);
    const [facialHairType] = useState(AvataaarOptions.facialHairType[avatar.facialHairType]);
    const [facialHairColor] = useState(AvataaarOptions.facialHairColor[avatar.facialHairColor]);
    const [clotheType] = useState(AvataaarOptions.clotheType[avatar.clotheType]);
    const [clotheColor] = useState(AvataaarOptions.clotheColor[avatar.clotheColor]);
    const [graphicType] = useState(AvataaarOptions.graphicType[avatar.graphicType]);
    const [eyeType] = useState("Default");
    const [eyebrowType] = useState("Default");
    const [mouthType] = useState("Default");
    const [skinColor] = useState(AvataaarOptions.skinColor[avatar.skinColor]);

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