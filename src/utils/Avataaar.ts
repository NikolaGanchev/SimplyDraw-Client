export default class Avataaar {
    // I'm storing the options as numbers corresponding to the object AvataaarOptions to lessen network strain
    topType: number;
    accessoriesType: number;
    hairColor: number;
    facialHairType: number;
    facialHairColor: number;
    clotheType: number;
    clotheColor: number;
    graphicType: number;
    eyeType: number;
    eyebrowType: number;
    mouthType: number;
    skinColor: number;

    constructor() {
        // Generates random Avataar

        this.topType = this.selectRandomInRange(0, AvataaarOptions.topType.length - 1);
        this.accessoriesType = this.selectRandomInRange(0, AvataaarOptions.accessoriesType.length - 1);
        this.hairColor = this.selectRandomInRange(0, AvataaarOptions.hairColor.length - 1);
        this.facialHairType = this.selectRandomInRange(0, AvataaarOptions.facialHairType.length - 1);
        this.facialHairColor = this.selectRandomInRange(0, AvataaarOptions.facialHairColor.length - 1);
        this.clotheType = this.selectRandomInRange(0, AvataaarOptions.clotheType.length - 1);
        this.clotheColor = this.selectRandomInRange(0, AvataaarOptions.clotheColor.length - 1);
        this.graphicType = this.selectRandomInRange(0, AvataaarOptions.graphicType.length - 1);
        this.eyeType = this.selectRandomInRange(0, AvataaarOptions.eyeType.length - 1);
        this.eyebrowType = this.selectRandomInRange(0, AvataaarOptions.eyebrowType.length - 1);
        this.mouthType = this.selectRandomInRange(0, AvataaarOptions.mouthType.length - 1);
        this.skinColor = this.selectRandomInRange(0, AvataaarOptions.skinColor.length - 1);
    }

    private selectRandomInRange(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// Credits to https://github.com/fangpenlin/avataaars/issues/8 for compiling that list together
export const AvataaarOptions = {
    topType: [
        'NoHair',
        'Eyepatch',
        'Hat',
        'Hijab',
        'Turban',
        'WinterHat1',
        'WinterHat2',
        'WinterHat3',
        'WinterHat4',
        'LongHairBigHair',
        'LongHairBob',
        'LongHairBun',
        'LongHairCurly',
        'LongHairCurvy',
        'LongHairDreads',
        'LongHairFrida',
        'LongHairFro',
        'LongHairFroBand',
        'LongHairNotTooLong',
        'LongHairShavedSides',
        'LongHairMiaWallace',
        'LongHairStraight',
        'LongHairStraight2',
        'LongHairStraightStrand',
        'ShortHairDreads01',
        'ShortHairDreads02'
    ],
    accessoriesType: [
        'Blank',
        'Kurt',
        'Prescription01',
        'Prescription02',
        'Round',
        'Sunglasses',
        'Wayfarers'
    ],
    hatColor: [
        'Black',
        'Blue01',
        'Blue02',
        'Blue03',
        'Gray01',
        'Gray02',
        'Heather',
        'PastelBlue',
        'PastelGreen',
        'PastelOrange',
        'PastelRed',
        'PastelYellow',
        'Pink',
        'Red',
        'White'
    ],
    hairColor: [
        'Auburn',
        'Black',
        'Blonde',
        'BlondeGolden',
        'Brown',
        'BrownDark',
        'PastelPink',
        'Platinum',
        'Red',
        'SilverGray'
    ],
    facialHairType: [
        'Blank',
        'BeardMedium',
        'BeardLight',
        'BeardMajestic',
        'MoustacheFancy',
        'MoustacheMagnum'
    ],
    facialHairColor: [
        'Auburn',
        'Black',
        'Blonde',
        'BlondeGolden',
        'Brown',
        'BrownDark',
        'Platinum',
        'Red'
    ],
    clotheType: [
        'BlazerShirt',
        'BlazerSweater',
        'CollarSweater',
        'GraphicShirt',
        'Hoodie',
        'Overall',
        'ShirtCrewNeck',
        'ShirtScoopNeck',
        'ShirtVNeck'
    ],
    clotheColor: [
        'Black',
        'Blue01',
        'Blue02',
        'Blue03',
        'Gray01',
        'Gray02',
        'Heather',
        'PastelBlue',
        'PastelGreen',
        'PastelOrange',
        'PastelRed',
        'PastelYellow',
        'Pink',
        'Red',
        'White'
    ],
    graphicType: [
        'Bat',
        'Cumbia',
        'Deer',
        'Diamond',
        'Hola',
        'Pizza',
        'Resist',
        'Selena',
        'Bear',
        'SkullOutline',
        'Skull'
    ],
    eyeType: [
        'Close',
        'Cry',
        'Default',
        'Dizzy',
        'EyeRoll',
        'Happy',
        'Hearts',
        'Side',
        'Squint',
        'Surprised',
        'Wink',
        'WinkWacky'
    ],
    eyebrowType: [
        'Angry',
        'AngryNatural',
        'Default',
        'DefaultNatural',
        'FlatNatural',
        'RaisedExcited',
        'RaisedExcitedNatural',
        'SadConcerned',
        'SadConcernedNatural',
        'UnibrowNatural',
        'UpDown',
        'UpDownNatural'
    ],
    mouthType: [
        'Concerned',
        'Default',
        'Disbelief',
        'Eating',
        'Grimace',
        'Sad',
        'ScreamOpen',
        'Serious',
        'Smile',
        'Tongue',
        'Twinkle',
        'Vomit'
    ],
    skinColor: [
        'Tanned',
        'Yellow',
        'Pale',
        'Light',
        'Brown',
        'DarkBrown',
        'Black'
    ]
}